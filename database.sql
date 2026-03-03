
CREATE DATABASE IF NOT EXISTS course_registration;
USE course_registration;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    course_code VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (student_id, course_id)
);

INSERT INTO courses (course_name, course_code) VALUES
('Data Structures & Algorithms', 'CS201'),
('Database Management Systems', 'CS301'),
('Operating Systems', 'CS302'),
('Computer Networks', 'CS401'),
('Web Development', 'CS402'),
('Artificial Intelligence', 'CS501'),
('Machine Learning', 'CS502'),
('Software Engineering', 'CS303'),
('Discrete Mathematics', 'MA201'),
('Digital Electronics', 'EC201');
