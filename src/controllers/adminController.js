const db = require('../config/database');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Thống kê 
exports.getStats = async (req, res) => {
    try {
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const [comments] = await db.query('SELECT COUNT(*) as count FROM comments');
        const [favorites] = await db.query('SELECT COUNT(*) as count FROM favorites');
        const [views] = await db.query('SELECT COUNT(*) as count FROM history');

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        // Xây dựng câu truy vấn động
        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = 'WHERE username LIKE ? OR email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 1. Đếm tổng số user (để tính số trang)
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Lấy dữ liệu phân trang
        // Thêm sắp xếp: Super Admin lên đầu, Admin kế tiếp, User cuối cùng. Mới nhất lên trên.
        params.push(limit, offset);
        const [users] = await db.query(`
            SELECT id, username, email, role, avatar, created_at, banned_until 
            FROM users 
            ${whereClause}
            ORDER BY 
                CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
                created_at DESC
            LIMIT ? OFFSET ?
        `, params);

        res.json({
            data: users,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách user' });
    }
};
// [QUAN TRỌNG] Xóa User với logic bảo vệ quyền lực
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requester = req.user; // Người đang thực hiện lệnh xóa

        // 1. Lấy thông tin người bị xóa
        const [targetUser] = await db.query('SELECT role FROM users WHERE id = ?', [id]);

        if (!targetUser || targetUser.length === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const targetRole = targetUser[0].role;

        // 2. Kiểm tra quyền hạn
        // Quy tắc: Không ai được xóa Super Admin (kể cả Super Admin khác để tránh tai nạn)
        if (targetRole === 'super_admin') {
            return res.status(403).json({ message: 'Không thể xóa Super Admin!' });
        }

        // Quy tắc: Admin thường không được xóa Admin khác
        if (requester.role === 'admin' && targetRole === 'admin') {
            return res.status(403).json({ message: 'Bạn không đủ quyền để xóa Admin khác!' });
        }

        await User.delete(id);
        res.json({ message: 'Đã xóa người dùng' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa user' });
    }
};

// [MỚI] Nâng/Hạ quyền (Chỉ dành cho Super Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // 'admin' hoặc 'user'
        const requester = req.user;

        // Chỉ Super Admin mới được gọi hàm này (Middleware đã chặn, check lại cho chắc)
        if (requester.role !== 'super_admin') {
            return res.status(403).json({ message: 'Chỉ Super Admin mới được phân quyền!' });
        }

        // Không được phép tự hạ quyền chính mình (tránh mất quyền quản trị)
        if (parseInt(id) === requester.id) {
            return res.status(400).json({ message: 'Không thể tự thay đổi quyền của chính mình!' });
        }

        // Cập nhật Database
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: `Đã cập nhật vai trò thành ${role.toUpperCase()}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật quyền' });
    }
};

// --- COMMENT MANAGEMENT (Giữ nguyên) ---
exports.getAllComments = async (req, res) => {
    try {
        const comments = await Comment.getAll();
        res.json(comments);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy danh sách comment' }); }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        await Comment.delete(id, null, 'admin');
        res.json({ message: 'Đã xóa bình luận' });
    } catch (error) { res.status(500).json({ message: 'Lỗi xóa comment' }); }
};
exports.banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { days } = req.body; // days = 0 là Unban, > 0 là số ngày Ban
        const requester = req.user;

        // 1. Kiểm tra quyền (Không cho Ban Super Admin hoặc Admin khác nếu không phải Super Admin)
        const [target] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (!target || target.length === 0) return res.status(404).json({ message: 'User không tồn tại' });

        const targetRole = target[0].role;

        if (targetRole === 'super_admin') {
            return res.status(403).json({ message: 'Không thể cấm Super Admin!' });
        }
        if (requester.role !== 'super_admin' && targetRole === 'admin') {
            return res.status(403).json({ message: 'Bạn không đủ quyền cấm Admin khác!' });
        }

        // 2. Xử lý Logic
        let bannedUntil = null;
        let message = 'Đã mở khóa tài khoản (Unban)';

        if (days > 0) {
            // Tính thời gian tương lai: Hiện tại + số ngày
            const date = new Date();
            date.setDate(date.getDate() + parseInt(days));
            bannedUntil = date;
            message = `Đã cấm tài khoản trong ${days} ngày`;
        }

        // 3. Cập nhật Database
        await db.query('UPDATE users SET banned_until = ? WHERE id = ?', [bannedUntil, id]);

        res.json({ message });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xử lý cấm user' });
    }
};