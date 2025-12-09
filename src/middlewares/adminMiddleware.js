const verifyAdmin = (req, res, next) => {
    // Lưu ý: Middleware này phải chạy SAU verifyToken thì mới có req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Truy cập bị từ chối! Yêu cầu quyền Admin.' });
    }
};

module.exports = verifyAdmin;