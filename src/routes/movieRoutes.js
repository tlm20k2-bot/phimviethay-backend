const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// 1. Lấy chi tiết phim (Logic mới: Tự động Sync DB + Tự động tăng view)
// Endpoint này thay thế hoàn toàn cho việc gọi trực tiếp Ophim ở Frontend
router.get('/phim/:slug', movieController.getMovieDetail);

// 2. Lấy Top Trending (Từ bảng movies chuẩn)
router.get('/trending', movieController.getTrending);

// [ĐÃ XÓA] router.post('/increase-view') vì không cần nữa

module.exports = router;