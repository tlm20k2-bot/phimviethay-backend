const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded; // Lưu info user
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ.' });
    }
};

// Xuất ra trực tiếp hàm này (hoặc Object cũng được, nhưng function cho gọn nếu chỉ có 1 hàm)
module.exports = verifyToken;