const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middlewares
const verifyToken = require('../middlewares/authMiddleware');
const { verifyAdmin, verifySuperAdmin } = require('../middlewares/adminMiddleware');

// ÁP DỤNG MIDDLEWARE BẢO VỆ TOÀN BỘ ROUTE ADMIN
router.use(verifyToken, verifyAdmin);

// --- Stats ---
router.get('/stats', adminController.getStats);

// --- Users ---
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser); // Admin thường xóa được User thường

// [SUPER ADMIN ONLY] Nâng quyền & Cấm User
router.put('/users/:id/role', verifySuperAdmin, adminController.updateUserRole);
router.put('/users/:id/ban', verifySuperAdmin, adminController.banUser);

// --- Comments ---
router.get('/comments', adminController.getAllComments);
router.delete('/comments/:id', adminController.deleteComment);

module.exports = router;