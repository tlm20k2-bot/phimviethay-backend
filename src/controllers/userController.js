const Favorite = require('../models/Favorite');
const User = require('../models/User'); // Import User Model
const bcrypt = require('bcryptjs');     // Import bcrypt để mã hóa pass

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
        const { slug, name, thumb } = req.body;
        if (!slug || !name) return res.status(400).json({ message: 'Thiếu thông tin phim' });

        await Favorite.add(req.user.id, { slug, name, thumb });
        res.json({ message: 'Đã thêm vào danh sách yêu thích', added: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xóa yêu thích
exports.removeFavorite = async (req, res) => {
    try {
        const { slug } = req.params;
        await Favorite.remove(req.user.id, slug);
        res.json({ message: 'Đã xóa khỏi danh sách', added: false });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Kiểm tra trạng thái
exports.checkFavorite = async (req, res) => {
    try {
        const { slug } = req.params;
        const isFavorite = await Favorite.check(req.user.id, slug);
        res.json({ isFavorite });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// --- HÀM MỚI: CẬP NHẬT PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, password, avatar } = req.body;
        const updateData = {};

        if (fullname) updateData.fullname = fullname;
        if (avatar) updateData.avatar = avatar;
        
        // Nếu có gửi password mới lên -> Mã hóa nó
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Gọi Model để update
        await User.update(req.user.id, updateData);
        
        // Quan trọng: Lấy lại thông tin user mới nhất từ DB để trả về cho Frontend cập nhật UI
        const updatedUser = await User.findById(req.user.id);

        res.json({ 
            message: 'Cập nhật thành công!',
            user: updatedUser // Trả về user mới (đã update)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật' });
    }
};