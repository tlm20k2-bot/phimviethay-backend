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

// ĐĂNG NHẬP (SỬA LẠI)
exports.login = async (req, res) => {
    try {
        // Frontend gửi field tên là 'email', nhưng giá trị có thể là username
        const { email, password } = req.body; 

        // Tìm user bằng (Email HOẶC Username)
        const user = await User.findByCredentials(email);
        
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

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