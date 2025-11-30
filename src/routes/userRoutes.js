const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');

// Route lấy danh sách yêu thích
router.get('/favorites', verifyToken, userController.getFavorites);

// Route thêm yêu thích
router.post('/favorites', verifyToken, userController.addFavorite);

// Route xóa yêu thích
router.delete('/favorites/:slug', verifyToken, userController.removeFavorite);

// Route kiểm tra trạng thái phim
router.get('/favorites/check/:slug', verifyToken, userController.checkFavorite);

// --- QUAN TRỌNG: Route cập nhật hồ sơ (Fix lỗi 404) ---
router.put('/profile', verifyToken, userController.updateProfile);

// Route lịch sử
router.post('/history', verifyToken, userController.setHistory)
router.get('/history', verifyToken, userController.getHistory);
router.delete('/history', verifyToken, userController.clearHistory);

module.exports = router;