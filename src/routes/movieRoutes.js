const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// 1. Lấy chi tiết phim (Get Info + Sync DB + Inc View)
router.get('/phim/:slug', movieController.getMovieDetail);

// 2. Lấy Top Trending (Từ DB local)
router.get('/trending', movieController.getTrending);

module.exports = router;