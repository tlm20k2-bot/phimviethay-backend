const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Import verifyToken (Vì authMiddleware xuất trực tiếp 1 hàm -> KHÔNG dùng ngoặc nhọn)
const verifyToken = require('../middlewares/authMiddleware');

// 2. Import verifyAdmin (Vì adminMiddleware xuất Object -> PHẢI dùng ngoặc nhọn)
const { verifyAdmin, verifySuperAdmin } = require('../middlewares/adminMiddleware');

// --- ÁP DỤNG MIDDLEWARE ---
// Nếu verifyToken hoặc verifyAdmin bị undefined, dòng này sẽ gây crash server
router.use(verifyToken, verifyAdmin);

// --- ĐỊNH NGHĨA ROUTES ---
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Nâng quyền (Chỉ Super Admin)
router.put('/users/:id/role', verifySuperAdmin, adminController.updateUserRole);
router.put('/users/:id/ban', adminController.banUser);

// Comments
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:id', adminController.deleteComment);

module.exports = router;