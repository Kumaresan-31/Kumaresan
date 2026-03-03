const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', studentRoutes);
app.use('/', courseRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Course Registration System API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
