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
// Route cập nhật thông tin người dùng
router.put('/profile', verifyToken, userController.updateProfile);

// Route lịch sử
router.post('/history', verifyToken, userController.setHistory)
router.get('/history', verifyToken, userController.getHistory);
router.delete('/history', verifyToken, userController.clearHistory);
router.delete('/history/:slug', verifyToken, userController.removeHistoryItem); // Xóa 1 phim
module.exports = router;