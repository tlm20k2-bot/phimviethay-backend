const db = require('../config/database');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Thống kê (Giữ nguyên code cũ)
exports.getStats = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [comments] = await db.execute('SELECT COUNT(*) as count FROM comments');
        const [favorites] = await db.execute('SELECT COUNT(*) as count FROM favorites');
        const [views] = await db.execute('SELECT COUNT(*) as count FROM history');

        res.json({
            totalUsers: users[0].count,
            totalComments: comments[0].count,
            totalFavorites: favorites[0].count,
            totalViews: views[0].count
        });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// --- USER MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy danh sách user' }); }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.delete(id);
        res.json({ message: 'Đã xóa người dùng' });
    } catch (error) { res.status(500).json({ message: 'Lỗi xóa user' }); }
};

// --- COMMENT MANAGEMENT ---
exports.getAllComments = async (req, res) => {
    try {
        const comments = await Comment.getAll();
        res.json(comments);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy danh sách comment' }); }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        // Admin xóa comment thì truyền role='admin' vào hàm delete của Model
        await Comment.delete(id, null, 'admin');
        res.json({ message: 'Đã xóa bình luận' });
    } catch (error) { res.status(500).json({ message: 'Lỗi xóa comment' }); }
};