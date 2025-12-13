const db = require('../config/database'); 
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ĐĂNG KÝ
exports.register = async (req, res) => {
    try {
        const { username, email, password, fullname } = req.body;

        // Validate cơ bản
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const existingUser = await User.checkExist(username, email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email hoặc Username đã tồn tại!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create(username, email, hashedPassword, fullname);

        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Lỗi đăng ký tài khoản.' });
    }
};

// ĐĂNG NHẬP
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body; 

        // 1. Tìm user
        const user = await User.findByCredentials(email);
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
        }

        // 2. CHECK BAN (Logic cũ của bạn rất tốt, giữ nguyên)
        if (user.banned_until && new Date(user.banned_until) > new Date()) {
             return res.status(403).json({ 
                 message: `Tài khoản bị khóa đến: ${new Date(user.banned_until).toLocaleString('vi-VN')}` 
             });
        }

        // 3. Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

        // 4. Tạo Token (Bảo mật: Token chỉ chứa ID và Role)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Trả về info (loại bỏ password)
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
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Lỗi đăng nhập.' });
    }
};