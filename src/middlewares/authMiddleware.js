const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
    }

    // Bảo mật: Không dùng fallback string 'secretkey' nữa
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("❌ [System] Thiếu JWT_SECRET trong .env");
        return res.status(500).json({ message: 'Lỗi cấu hình server.' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ.' });
    }
};

module.exports = verifyToken;