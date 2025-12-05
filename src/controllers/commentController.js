const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
    try {
        const { slug } = req.params;
        const { episode } = req.query;

        // Xác định userId nếu người dùng đã đăng nhập
        let userId = 0;
        if (req.user) {
            userId = req.user.id;
        }

        const comments = await Comment.getByContext(slug, episode, userId);
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { movieSlug, episodeSlug, content, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Nội dung trống' });
        }

        await Comment.add(req.user.id, movieSlug, episodeSlug, content, parentId);

        // Trả về danh sách comment mới nhất để cập nhật UI
        const newComments = await Comment.getByContext(movieSlug, episodeSlug, req.user.id);
        res.json(newComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        await Comment.toggleLike(req.user.id, id);
        res.json({ message: 'Success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const success = await Comment.delete(id, req.user.id, req.user.role);
        
        if (!success) {
            return res.status(403).json({ message: 'Không có quyền xóa' });
        }

        res.json({ message: 'Đã xóa bình luận' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};