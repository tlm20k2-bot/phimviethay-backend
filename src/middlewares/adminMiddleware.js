const adminMiddleware = (req, res, next) => {
    // req.user đã có từ verifyToken chạy trước đó
    if (req.user && req.user.role === 'admin') {
        next(); // Là admin, cho qua
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối! Bạn không phải Admin.' });
    }
};

module.exports = adminMiddleware;