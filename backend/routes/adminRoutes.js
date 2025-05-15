
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// All routes use adminAuth middleware which handles both authentication and admin role verification
router.use(adminAuth);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User routes
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Medicine routes
router.get('/medicines', adminController.getAllMedicines);
router.post('/medicines', adminController.createMedicine);
router.get('/medicines/:id', adminController.getMedicineById);
router.put('/medicines/:id', adminController.updateMedicine);
router.delete('/medicines/:id', adminController.deleteMedicine);
router.get('/medicines/:id/transactions', adminController.getMedicineTransactions);

// Countries for a medicine route
router.get('/medicines/:id/countries', adminController.getMedicineCountries);

// Country routes
router.get('/countries', adminController.getAllCountries);
router.post('/countries', adminController.createCountry);
router.get('/countries/:id', adminController.getCountryById);
router.put('/countries/:id', adminController.updateCountry);
router.delete('/countries/:id', adminController.deleteCountry);

// Medicines for a country route
router.get('/countries/:id/medicines', adminController.getCountryMedicines);

module.exports = router;
