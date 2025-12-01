const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Middleware chung cho toàn bộ route admin
router.use(verifyToken, adminMiddleware);

// Dashboard
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Comments
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:id', adminController.deleteComment);

module.exports = router;