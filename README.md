# Course Registration System

A full-stack web application for college course registration built with **HTML/CSS/JS**, **Node.js/Express**, and **MySQL**.

## Features

- Student registration with course selection
- Admin panel with search, filter, edit, delete
- REST API with proper error handling
- Modern dark-themed responsive UI

## Prerequisites

- **Node.js** (v14+)
- **MySQL** (v5.7+)

## Setup Instructions

### 1. Database

Open MySQL and run the SQL schema file:

```sql
source /path/to/COURSE_REGISTRATION_SYSTEM/database.sql;
```

Or copy-paste the contents of `database.sql` into MySQL Workbench / phpMyAdmin.

### 2. Backend

```bash
cd backend
npm install
```

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=course_registration
DB_PORT=3306
SERVER_PORT=3000
```

Start the server:

```bash
npm start
```

You should see:
```
✅ MySQL connected successfully
🚀 Server running on http://localhost:3000
```

### 3. Frontend

Open `frontend/index.html` in your browser (double-click or use Live Server).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | Fetch all courses |
| POST | `/register` | Register a student |
| GET | `/registrations` | Fetch all registrations |
| PUT | `/registrations/:id` | Update a registration |
| DELETE | `/registrations/:id` | Delete a registration |
| GET | `/search?q=term` | Search students |

## Project Structure

```
COURSE_REGISTRATION_SYSTEM/
├── database.sql
├── README.md
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── studentController.js
│   │   └── courseController.js
│   └── routes/
│       ├── studentRoutes.js
│       └── courseRoutes.js
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```
