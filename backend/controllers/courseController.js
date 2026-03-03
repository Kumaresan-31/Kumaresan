const pool = require('../config/db');

// Fetch all available courses
const getCourses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, course_name, course_code FROM courses ORDER BY course_name');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getCourses };
