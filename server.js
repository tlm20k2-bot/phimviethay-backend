const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const http = require('http'); // [MỚI] Module HTTP gốc của Node.js
const { Server } = require("socket.io"); // [MỚI] Thư viện Socket.io

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

// [MỚI] Tạo HTTP Server bọc lấy Express App
const server = http.createServer(app);

// [QUAN TRỌNG KHI DEPLOY RENDER]
app.set('trust proxy', 1);

app.use(helmet());

// Giới hạn request
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 150, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút!' }
});
app.use('/api', limiter);

// Cấu hình CORS (Dùng chung cho cả Express và Socket)
const allowedOrigins = [
    'http://localhost:5173',            // Môi trường Dev
    'https://phimviethay.pages.dev',    // Domain Frontend
    process.env.CLIENT_URL              // Biến môi trường
].filter(Boolean);

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

// [MỚI] Cấu hình Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins, // Cho phép các domain trên kết nối socket
        methods: ["GET", "POST"],
        credentials: true
    }
});

// [MỚI] Logic Real-time cho Watch Party
io.on("connection", (socket) => {
    // console.log(`⚡ Client connected: ${socket.id}`);

    // 1. Tham gia phòng xem chung
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        // console.log(`User ${socket.id} joined room: ${roomId}`);
        
        // Thông báo cho những người khác trong phòng
        socket.to(roomId).emit("user_joined", { id: socket.id });
    });

    // 2. Đồng bộ Video (Play/Pause/Seek/Change Server)
    socket.on("video_action", (data) => {
        // data: { roomId, action: 'play'|'pause'|'seek', time: 123, ... }
        // Gửi cho tất cả mọi người trong phòng TRỪ người gửi (broadcast)
        socket.to(data.roomId).emit("receive_video_action", data);
    });

    // 3. Chat trong phòng
    socket.on("send_message", (data) => {
        // data: { roomId, user: 'Huy', text: 'Phim hay quá' }
        socket.to(data.roomId).emit("receive_message", data);
    });

    // 4. Ngắt kết nối
    socket.on("disconnect", () => {
        // console.log("Client disconnected", socket.id);
    });
});

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(hpp()); 

// --- Routes HTTP ---
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

// [THAY ĐỔI] Dùng server.listen thay vì app.listen
server.listen(PORT, () => {
    console.log(`🚀 Server Socket đang chạy tại http://localhost:${PORT}`);
});