const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http'); 

// [MỚI] Import hàm khởi tạo socket
const initSocket = require('./src/socket'); 

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

// Tạo HTTP Server
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());

// Rate Limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 150, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút!' }
});
app.use('/api', limiter);

// Danh sách Domain được phép
const allowedOrigins = [
    'http://localhost:5173',
    'https://phimviethay.pages.dev',
    process.env.CLIENT_URL
].filter(Boolean);

// Config CORS cho Express
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("Blocked CORS Origin:", origin);
            callback(new Error('Không được phép truy cập bởi CORS'));
        }
    },
    credentials: true
}));

// [MỚI] Khởi tạo Socket.io (Tách biệt hoàn toàn)
// Truyền server và danh sách domain vào để config
initSocket(server, allowedOrigins);

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(hpp()); 

// --- Routes ---
app.get('/ping', (req, res) => res.status(200).send('Pong! Server is alive.'));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => res.send('Server PhimVietHay đang chạy...'));

app.use((err, req, res, next) => {
    console.error('🔥 Lỗi hệ thống:', err.stack);
    res.status(500).json({ 
        message: 'Đã xảy ra lỗi hệ thống!',
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});