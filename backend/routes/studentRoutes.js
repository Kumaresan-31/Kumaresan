const express = require('express');
const router = express.Router();
const {
    registerStudent,
    getRegistrations,
    deleteRegistration,
    bulkDeleteRegistrations,
    updateRegistration,
    searchStudents,
    getDashboardStats,
    exportCSV
} = require('../controllers/studentController');

router.post('/register', registerStudent);
router.get('/registrations', getRegistrations);
router.delete('/registrations/:id', deleteRegistration);
router.post('/registrations/bulk-delete', bulkDeleteRegistrations);
router.put('/registrations/:id', updateRegistration);
router.get('/search', searchStudents);
router.get('/dashboard/stats', getDashboardStats);
router.get('/export/csv', exportCSV);

module.exports = router;
