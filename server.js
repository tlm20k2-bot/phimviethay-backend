const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http'); 
const initSocket = require('./src/socket'); 

// Khởi động Configs
require('./src/config/database'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// 1. Security Middlewares
app.set('trust proxy', 1); // Bắt buộc cho Render/Nginx
app.use(helmet());
app.use(hpp()); 

// 2. Tối ưu Body Parser (Chỉ nhận tối đa 2MB json để chống tràn bộ nhớ)
app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 3. Cấu hình CORS chặt chẽ
const allowedOrigins = [
    'http://localhost:5173',
    'https://phimviethay.pages.dev',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 4. Rate Limiting (Thân thiện hơn: 300 request / 5 phút)
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Thao tác quá nhanh, vui lòng thử lại sau vài phút.' }
});
app.use('/api', limiter);

// 5. Routes
app.get('/', (req, res) => res.send('Server PhimVietHay (v2) is Running...'));
app.get('/ping', (req, res) => res.status(200).send('Pong')); // Endpoint cho UptimeRobot

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/movies', require('./src/routes/movieRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

// 6. Global Error Handler (Clean Log)
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') console.error('🔥 Error:', err.stack);
    res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau.' });
});

// 7. Khởi chạy Socket & Server
initSocket(server, allowedOrigins);

server.listen(PORT, () => {
    console.log(`🚀 Server ready at port ${PORT}`);
});