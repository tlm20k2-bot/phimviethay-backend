const Favorite = require('../models/Favorite');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// --- THÊM DÒNG NÀY ---
const History = require('../models/History'); 
// ---------------------

// Lấy danh sách yêu thích
exports.getFavorites = async (req, res) => {
    try {
        const list = await Favorite.getList(req.user.id);
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thêm yêu thích
exports.addFavorite = async (req, res) => {
    try {
        const { slug, name, thumb, quality, year, episode_current, vote_average } = req.body;
        
        if (!slug || !name) return res.status(400).json({ message: 'Thiếu thông tin phim' });

        await Favorite.add(req.user.id, { 
            slug, 
            name, 
            thumb,
            quality, 
            year, 
            episode_current,
            vote_average 
        });
        
        res.json({ message: 'Đã thêm vào danh sách yêu thích', added: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xóa yêu thích
exports.removeFavorite = async (req, res) => {
    try {
        const { slug } = req.params;
        await Favorite.remove(req.user.id, slug);
        res.json({ message: 'Đã xóa khỏi danh sách', added: false });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Kiểm tra trạng thái thích
exports.checkFavorite = async (req, res) => {
    try {
        const { slug } = req.params;
        const isFavorite = await Favorite.check(req.user.id, slug);
        res.json({ isFavorite });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, password, avatar } = req.body;
        const updateData = {};
        if (fullname) updateData.fullname = fullname;
        if (avatar) updateData.avatar = avatar;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        await User.update(req.user.id, updateData);
        const updatedUser = await User.findById(req.user.id);
        res.json({ message: 'Cập nhật thành công!', user: updatedUser });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// --- HISTORY SECTION ---

// Ghi lịch sử
exports.setHistory = async (req, res) => {
    try {
        const { movieSlug, episodeSlug, movieName, movieThumb, episodeName } = req.body;
        
        if (!movieSlug || !episodeSlug) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }

        // Gọi Model History (Giờ đã được import nên sẽ không lỗi nữa)
        await History.set(req.user.id, { movieSlug, episodeSlug, movieName, movieThumb, episodeName });
        
        res.json({ message: 'Đã lưu lịch sử' });
    } catch (error) {
        console.error('Lỗi set history:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy lịch sử
exports.getHistory = async (req, res) => {
    try {
        const list = await History.getList(req.user.id);
        res.json(list);
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Xóa lịch sử
exports.clearHistory = async (req, res) => {
    try {
        await History.clear(req.user.id);
        res.json({ message: 'Đã xóa toàn bộ lịch sử' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};