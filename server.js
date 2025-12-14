const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// [QUAN TRỌNG 1] Gọi config ngay đầu tiên để các file dưới nhận được biến môi trường
dotenv.config(); 

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http'); 
const passport = require('passport'); 
const initSocket = require('./src/socket'); 

// Import Routes
const aiRoutes = require('./src/routes/aiRoutes');
// ... các import khác

require('./src/config/database'); 
require('./src/config/passport'); 

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ============================================================
// 1. CẤU HÌNH CORS (PHẢI ĐẶT LÊN ĐẦU TIÊN)
// ============================================================
const allowedOrigins = [
    'http://localhost:5173',
    'https://phimviethay.pages.dev',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request từ Postman/Server (origin = undefined) hoặc từ domain trong whitelist
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); // Log để debug nếu bị chặn
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Cho phép các method này
}));

// ============================================================
// 2. SECURITY & PARSERS
// ============================================================
app.set('trust proxy', 1);
app.use(helmet());
app.use(hpp()); 

// Body Parser
app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Passport
app.use(passport.initialize());

// Rate Limit
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Thao tác quá nhanh, vui lòng thử lại sau vài phút.' }
});
app.use('/api', limiter);

// ============================================================
// 3. ROUTES (ĐẶT SAU CORS VÀ PARSERS)
// ============================================================

app.get('/', (req, res) => res.send('Server PhimVietHay (v2) is Running...'));
app.get('/ping', (req, res) => res.status(200).send('Pong'));

// [QUAN TRỌNG 2] Di chuyển route AI xuống đây (sau CORS)
app.use('/api/ai', aiRoutes);

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/movies', require('./src/routes/movieRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

// Error Handling
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') console.error('🔥 Error:', err.stack);
    // Xử lý riêng lỗi CORS để client dễ hiểu
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS Blocked: Domain không được phép truy cập' });
    }
    res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau.' });
});

initSocket(server, allowedOrigins);

server.listen(PORT, () => {
    console.log(`🚀 Server ready at port ${PORT}`);
});