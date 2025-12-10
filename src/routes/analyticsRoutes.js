const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// 1. Import verifyToken (Auth Middleware xuất trực tiếp hàm -> Import thường)
const verifyToken = require('../middlewares/authMiddleware');

// 2. Import verifyAdmin (Admin Middleware xuất Object -> PHẢI dùng ngoặc nhọn { })
// [ĐÂY LÀ NGUYÊN NHÂN GÂY LỖI TRƯỚC ĐÓ]
const { verifyAdmin } = require('../middlewares/adminMiddleware');

// --- ROUTES ---

// 1. Nhận log từ User (Nếu bạn chưa xóa hàm submitLog trong controller thì giữ nguyên, nếu xóa rồi thì comment lại)
router.post('/log', analyticsController.submitLog);

// 2. Admin God Mode (Cần quyền Admin)
router.post('/admin/force', verifyToken, verifyAdmin, analyticsController.adminForceIntro);

// 3. Lấy thống kê cho Dashboard
router.get('/admin/movies-stats', verifyToken, verifyAdmin, analyticsController.getMovieStats);

// 4. Lấy danh sách chi tiết (Table)
router.get('/admin/list', verifyToken, verifyAdmin, analyticsController.getAllIntros);

// 5. Xóa dữ liệu Intro
router.delete('/admin/:id', verifyToken, verifyAdmin, analyticsController.deleteIntro);

// 6. Lấy dữ liệu cho Player (Public - Không cần đăng nhập)
router.get('/data', analyticsController.getEpisodeIntelligence);

module.exports = router;