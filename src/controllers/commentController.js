const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
    try {
        const { slug } = req.params;
        const { episode } = req.query; 
        // Lấy user id từ token (nếu có) để check trạng thái like
        // (Middleware verifyTokenOptional sẽ xử lý việc này, nhưng ở đây ta giả sử req.user có thể null)
        // Để đơn giản, ta sửa authMiddleware một chút hoặc chấp nhận user chưa login thì is_liked = 0
        
        let userId = 0;
        if (req.headers.authorization) {
             // Logic giải mã token nhanh gọn (hoặc dùng middleware optional)
             // Tạm thời coi như userId = 0 nếu chưa login
             // Nếu bạn muốn chính xác, cần middleware verifyTokenOptional
        }
        // Ở đây mình tạm lấy userId nếu đã qua middleware verifyToken, nếu chưa thì thôi
        if (req.user) userId = req.user.id;

        const comments = await Comment.getByContext(slug, episode, userId);
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { movieSlug, episodeSlug, content, parentId } = req.body; // Thêm parentId
        
        if (!content || !content.trim()) return res.status(400).json({ message: 'Nội dung trống' });

        await Comment.add(req.user.id, movieSlug, episodeSlug, content, parentId);
        
        // Trả về list mới
        const newComments = await Comment.getByContext(movieSlug, episodeSlug, req.user.id);
        res.json(newComments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// API Like Mới
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params; // Comment ID
        await Comment.toggleLike(req.user.id, id);
        res.json({ message: 'Success' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteComment = async (req, res) => {
    // ... (Giữ nguyên code cũ)
    try {
        const { id } = req.params;
        const success = await Comment.delete(id, req.user.id, req.user.role);
        if (!success) return res.status(403).json({ message: 'Không có quyền xóa' });
        res.json({ message: 'Đã xóa bình luận' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};