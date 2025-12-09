const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

require('./src/config/database'); 

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const movieRoutes = require('./src/routes/movieRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 150, 
    message: { message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút!' }
});
app.use('/api', limiter);

const allowedOrigins = [
    'http://localhost:5173', 
    process.env.CLIENT_URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Không được phép truy cập bởi CORS'));
        }
    },
    credentials: true
}));

// Tăng giới hạn json lên để tránh lỗi PayloadTooLarge
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(hpp()); 

// --- Routes ---
app.get('/ping', (req, res) => {
    res.status(200).send('Pong! Server is alive.');
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send('Server PhimVietHay đang chạy...');
});

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