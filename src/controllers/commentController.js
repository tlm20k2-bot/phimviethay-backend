const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
    try {
        const { slug } = req.params;
        const { episode } = req.query;
        const userId = req.user ? req.user.id : 0;
        const comments = await Comment.getByContext(slug, episode, userId);
        res.json(comments);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.addComment = async (req, res) => {
    try {
        const { movieSlug, episodeSlug, content, parentId } = req.body;
        if (!content || !content.trim()) return res.status(400).json({ message: 'Content required' });

        await Comment.add(req.user.id, movieSlug, episodeSlug, content, parentId);
        const newComments = await Comment.getByContext(movieSlug, episodeSlug, req.user.id);
        res.json(newComments);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.toggleLike = async (req, res) => {
    try {
        await Comment.toggleLike(req.user.id, req.params.id);
        res.json({ message: 'Success' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteComment = async (req, res) => {
    try {
        const success = await Comment.delete(req.params.id, req.user.id, req.user.role);
        if (!success) return res.status(403).json({ message: 'Forbidden' });
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// [NEW] Hàm Pin Comment
exports.pinComment = async (req, res) => {
    try {
        // Chỉ cho phép admin hoặc super_admin ghim
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Comment.togglePin(req.params.id);
        res.json({ message: 'Success' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};