const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// --- IMPORT TỪNG FILE RIÊNG BIỆT ---
// Lưu ý: Không dùng dấu { } vì file middleware xuất trực tiếp hàm
const verifyToken = require('../middlewares/authMiddleware');
const verifyAdmin = require('../middlewares/adminMiddleware');

// --- ÁP DỤNG MIDDLEWARE ---
// Thứ tự cực quan trọng: Phải xác thực Token trước để lấy info user, sau đó mới check quyền Admin
router.use(verifyToken, verifyAdmin);

// --- ĐỊNH NGHĨA ROUTES ---
// Dashboard
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Comments
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:id', adminController.deleteComment);

module.exports = router;