const verifyAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Chưa đăng nhập!' });
    }
    // Cho phép cả admin và super_admin
    if (user.role === 'admin' || user.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Không có quyền truy cập Admin!' });
    }
};

const verifySuperAdmin = (req, res, next) => {
    const user = req.user;
    if (user && user.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Yêu cầu quyền Super Admin!' });
    }
};

// [QUAN TRỌNG NHẤT] Phải xuất ra Object chứa 2 hàm này
module.exports = { verifyAdmin, verifySuperAdmin };