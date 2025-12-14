const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http'); 
const passport = require('passport'); 
const initSocket = require('./src/socket'); 

require('./src/config/database'); 
require('./src/config/passport'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// 1. Security Middlewares
app.set('trust proxy', 1);
app.use(helmet());
app.use(hpp()); 

// [QUAN TRỌNG - SỬA LẠI THỨ TỰ] 
// Phải đặt Body Parser lên trước để đọc JSON
app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Sau đó mới đến Passport
app.use(passport.initialize());

// ... (Phần còn lại giữ nguyên) ...

// 3. Cấu hình CORS
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

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Thao tác quá nhanh, vui lòng thử lại sau vài phút.' }
});
app.use('/api', limiter);

app.get('/', (req, res) => res.send('Server PhimVietHay (v2) is Running...'));
app.get('/ping', (req, res) => res.status(200).send('Pong'));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/movies', require('./src/routes/movieRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') console.error('🔥 Error:', err.stack);
    res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau.' });
});

initSocket(server, allowedOrigins);

server.listen(PORT, () => {
    console.log(`🚀 Server ready at port ${PORT}`);
});