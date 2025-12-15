const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const verifyToken = require('../middlewares/authMiddleware'); // Middleware import kiểu cũ (rollback)
const jwt = require('jsonwebtoken');

// Middleware optional
const verifyTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (e) {}
    }
    next();
};

router.get('/:slug', verifyTokenOptional, commentController.getComments);
router.post('/', verifyToken, commentController.addComment);
router.delete('/:id', verifyToken, commentController.deleteComment);
router.post('/:id/like', verifyToken, commentController.toggleLike);

// [NEW] Route Ghim
router.post('/:id/pin', verifyToken, commentController.pinComment);

module.exports = router;