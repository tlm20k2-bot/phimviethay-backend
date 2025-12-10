const db = require('../config/database'); // <--- [QUAN TRỌNG] Thêm dòng này để dùng db
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ĐĂNG KÝ
exports.register = async (req, res) => {
    try {
        const { username, email, password, fullname } = req.body;

        const existingUser = await User.checkExist(username, email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email hoặc Username đã tồn tại!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create(username, email, hashedPassword, fullname);

        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ĐĂNG NHẬP
exports.login = async (req, res) => {
    try {
        // Frontend gửi field tên là 'email', nhưng giá trị có thể là username hoặc email
        const { email, password } = req.body; 

        // 1. Tìm user bằng (Email HOẶC Username) thông qua Model
        const user = await User.findByCredentials(email);
        
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
        }

        // --- [MỚI] 2. KIỂM TRA TRẠNG THÁI CẤM (BAN) ---
        // Query trực tiếp vào DB để lấy banned_until chính xác nhất theo ID
        const [banCheck] = await db.query('SELECT banned_until FROM users WHERE id = ?', [user.id]);
        
        if (banCheck.length > 0) {
            const bannedUntil = banCheck[0].banned_until;
            if (bannedUntil && new Date(bannedUntil) > new Date()) {
                return res.status(403).json({ 
                    message: `Tài khoản của bạn bị khóa đến: ${new Date(bannedUntil).toLocaleString('vi-VN')}` 
                });
            }
        }
        // ------------------------------------------------

        // 3. Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

        // 4. Tạo Token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};