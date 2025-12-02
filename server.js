const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// --- IMPORT CÁC GÓI BẢO MẬT ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

require('./src/config/database'); 

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const movieRoutes = require('./src/routes/movieRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. BẢO MẬT HTTP HEADERS ---
app.use(helmet());

// --- 2. CHỐNG SPAM / DDOS (Rate Limiting) ---
// Cho phép tối đa 150 request trong 15 phút từ 1 IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 150, 
    message: { message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút!' }
});
app.use('/api', limiter); // Áp dụng cho tất cả API

// --- 3. CẤU HÌNH CORS CHẶT CHẼ ---
// Chỉ cho phép Frontend của bạn gọi vào
const allowedOrigins = [
    'http://localhost:5173', // Cho phép lúc Dev
    process.env.CLIENT_URL   // Cho phép lúc Deploy (Cloudflare)
];

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có origin (như Postman, Mobile App) hoặc nằm trong whitelist
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Không được phép truy cập bởi CORS'));
        }
    },
    credentials: true // Cho phép cookie nếu cần sau này
}));

// --- 4. XỬ LÝ DỮ LIỆU ---
app.use(express.json({ limit: '10kb' })); // Giới hạn dữ liệu gửi lên (tránh treo server)
app.use(express.urlencoded({ extended: true }));

// --- 5. CHỐNG XSS & HPP ---
app.use(xss()); // Lọc mã độc trong input
app.use(hpp()); // Chống trùng lặp tham số

// --- 6. ROUTES ---
app.get('/ping', (req, res) => {
    res.status(200).send('Pong! Server is alive.');
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', movieRoutes);

app.get('/', (req, res) => {
    res.send('Server PhimVietHay đang chạy...');
});

// --- 7. XỬ LÝ LỖI CUỐI CÙNG (Error Handling) ---
// Giấu lỗi chi tiết, chỉ báo lỗi chung chung cho user
app.use((err, req, res, next) => {
    console.error('🔥 Lỗi hệ thống:', err.stack);
    res.status(500).json({ 
        message: 'Đã xảy ra lỗi hệ thống!',
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});