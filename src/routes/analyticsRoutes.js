const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Import Middleware (Nhớ là import riêng lẻ như ta đã chốt)
const verifyToken = require('../middlewares/authMiddleware');
const verifyAdmin = require('../middlewares/adminMiddleware');

// --- CÁC ROUTES ---

// 1. Nhận log từ User (Public)
router.post('/log', analyticsController.submitLog);

// 2. Admin God Mode (Cần quyền Admin)
router.post('/admin/force', verifyToken, verifyAdmin, analyticsController.adminForceIntro);

// 3. Lấy dữ liệu Intro để hiển thị nút Skip (Public)
router.get('/data', analyticsController.getEpisodeIntelligence);

// --- CÁC ROUTES MỚI CHO DASHBOARD (ĐANG THIẾU CÁI NÀY) ---

// 4. Lấy danh sách Intro cho Admin Dashboard
router.get('/admin/list', verifyToken, verifyAdmin, analyticsController.getAllIntros);

// 5. Xóa dữ liệu Intro
router.delete('/admin/:id', verifyToken, verifyAdmin, analyticsController.deleteIntro);

router.get('/admin/movies-stats', verifyToken, verifyAdmin, analyticsController.getMovieStats);

module.exports = router;