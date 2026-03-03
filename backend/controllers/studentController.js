const pool = require('../config/db');

// Register a new student and their course
const registerStudent = async (req, res) => {
    const { name, email, course_id } = req.body;

    if (!name || !email || !course_id) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.query('SELECT id FROM students WHERE email = ?', [email]);
        let studentId;

        if (existing.length > 0) {
            studentId = existing[0].id;
            await connection.query('UPDATE students SET name = ? WHERE id = ?', [name, studentId]);
        } else {
            const [result] = await connection.query('INSERT INTO students (name, email) VALUES (?, ?)', [name, email]);
            studentId = result.insertId;
        }

        const [dupCheck] = await connection.query(
            'SELECT id FROM registrations WHERE student_id = ? AND course_id = ?',
            [studentId, course_id]
        );

        if (dupCheck.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Student is already registered for this course'
            });
        }

        await connection.query(
            'INSERT INTO registrations (student_id, course_id) VALUES (?, ?)',
            [studentId, course_id]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Fetch all registrations with student and course details
const getRegistrations = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                r.id AS registration_id,
                s.id AS student_id,
                s.name AS student_name,
                s.email AS student_email,
                c.id AS course_id,
                c.course_name,
                c.course_code,
                r.registered_at
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            ORDER BY r.registered_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch registrations error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const resetAutoIncrementCounters = async (connection) => {
    // Setting AUTO_INCREMENT to 1 makes MySQL reuse the next available value (MAX(id) + 1).
    await connection.query('ALTER TABLE registrations AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE students AUTO_INCREMENT = 1');
};

const resequenceStudentIds = async (connection) => {
    const [students] = await connection.query('SELECT id FROM students ORDER BY id ASC');
    if (students.length === 0) {
        await connection.query('ALTER TABLE students AUTO_INCREMENT = 1');
        return;
    }

    const idMap = students.map((row, idx) => ({ oldId: row.id, newId: idx + 1 }));
    const needsResequence = idMap.some(({ oldId, newId }) => oldId !== newId);
    if (!needsResequence) {
        await connection.query('ALTER TABLE students AUTO_INCREMENT = 1');
        return;
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
        // Move IDs to a safe range first to avoid duplicate-key collisions.
        await connection.query('UPDATE students SET id = id + 1000000');
        await connection.query('UPDATE registrations SET student_id = student_id + 1000000');

        for (const { oldId, newId } of idMap) {
            await connection.query('UPDATE students SET id = ? WHERE id = ?', [newId, oldId + 1000000]);
            await connection.query('UPDATE registrations SET student_id = ? WHERE student_id = ?', [newId, oldId + 1000000]);
        }

        await connection.query('ALTER TABLE students AUTO_INCREMENT = 1');
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }
};

// Delete a registration
const deleteRegistration = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query('DELETE FROM registrations WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        await connection.query(`
            DELETE FROM students 
            WHERE id NOT IN (SELECT DISTINCT student_id FROM registrations)
        `);

        await resequenceStudentIds(connection);
        await resetAutoIncrementCounters(connection);
        await connection.commit();

        res.json({ success: true, message: 'Registration deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Bulk delete registrations
const bulkDeleteRegistrations = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No registration IDs provided' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');
        const [result] = await connection.query(
            `DELETE FROM registrations WHERE id IN (${placeholders})`, ids
        );

        await connection.query(`
            DELETE FROM students 
            WHERE id NOT IN (SELECT DISTINCT student_id FROM registrations)
        `);

        await resequenceStudentIds(connection);
        await resetAutoIncrementCounters(connection);
        await connection.commit();

        res.json({
            success: true,
            message: `${result.affectedRows} registration(s) deleted successfully`
        });
    } catch (error) {
        await connection.rollback();
        console.error('Bulk delete error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Update a registration
const updateRegistration = async (req, res) => {
    const { id } = req.params;
    const { name, email, course_id } = req.body;

    if (!name || !email || !course_id) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reg] = await connection.query('SELECT student_id FROM registrations WHERE id = ?', [id]);
        if (reg.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        const studentId = reg[0].student_id;

        const [emailConflict] = await connection.query(
            'SELECT id FROM students WHERE email = ? AND id != ?',
            [email, studentId]
        );
        if (emailConflict.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Email already belongs to another student' });
        }

        await connection.query('UPDATE students SET name = ?, email = ? WHERE id = ?', [name, email, studentId]);

        const [dupCheck] = await connection.query(
            'SELECT id FROM registrations WHERE student_id = ? AND course_id = ? AND id != ?',
            [studentId, course_id, id]
        );
        if (dupCheck.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Student is already registered for this course' });
        }

        await connection.query('UPDATE registrations SET course_id = ? WHERE id = ?', [course_id, id]);

        await connection.commit();
        res.json({ success: true, message: 'Registration updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Search students
const searchStudents = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    try {
        const searchTerm = `%${q}%`;
        const [rows] = await pool.query(`
            SELECT 
                r.id AS registration_id,
                s.id AS student_id,
                s.name AS student_name,
                s.email AS student_email,
                c.id AS course_id,
                c.course_name,
                c.course_code,
                r.registered_at
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            WHERE s.name LIKE ? OR s.email LIKE ?
            ORDER BY r.registered_at DESC
        `, [searchTerm, searchTerm]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Total counts
        const [[{ total_registrations }]] = await pool.query('SELECT COUNT(*) AS total_registrations FROM registrations');
        const [[{ total_students }]] = await pool.query('SELECT COUNT(*) AS total_students FROM students');
        const [[{ total_courses }]] = await pool.query('SELECT COUNT(*) AS total_courses FROM courses');

        // Per-course enrollment counts
        const [courseStats] = await pool.query(`
            SELECT c.course_name, c.course_code, COUNT(r.id) AS enrollment_count
            FROM courses c
            LEFT JOIN registrations r ON c.id = r.course_id
            GROUP BY c.id, c.course_name, c.course_code
            ORDER BY enrollment_count DESC
        `);

        // Recent 5 registrations
        const [recent] = await pool.query(`
            SELECT s.name AS student_name, c.course_name, c.course_code, r.registered_at
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            ORDER BY r.registered_at DESC
            LIMIT 5
        `);

        // Registrations per day (last 7 days)
        const [dailyTrend] = await pool.query(`
            SELECT DATE(registered_at) AS reg_date, COUNT(*) AS count
            FROM registrations
            WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(registered_at)
            ORDER BY reg_date ASC
        `);

        res.json({
            success: true,
            data: {
                total_registrations,
                total_students,
                total_courses,
                course_stats: courseStats,
                recent_registrations: recent,
                daily_trend: dailyTrend
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Export registrations as CSV
const exportCSV = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                r.id AS 'Registration ID',
                s.name AS 'Student Name',
                s.email AS 'Email',
                c.course_name AS 'Course Name',
                c.course_code AS 'Course Code',
                r.registered_at AS 'Registered At'
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            ORDER BY r.registered_at DESC
        `);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No data to export' });
        }

        const headers = Object.keys(rows[0]);
        const csvLines = [headers.join(',')];
        rows.forEach(row => {
            const values = headers.map(h => {
                let val = String(row[h] || '');
                val = val.replace(/"/g, '""');
                return `"${val}"`;
            });
            csvLines.push(values.join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
        res.send(csvLines.join('\n'));
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    registerStudent,
    getRegistrations,
    deleteRegistration,
    bulkDeleteRegistrations,
    updateRegistration,
    searchStudents,
    getDashboardStats,
    exportCSV
};
