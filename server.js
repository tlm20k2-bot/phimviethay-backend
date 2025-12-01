const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

// --- CẤU HÌNH MIDDLEWARE (QUAN TRỌNG) ---
// Phải đặt những dòng này TRƯỚC khi khai báo routes
app.use(cors());
app.use(express.json()); // <--- Dòng này giúp đọc JSON từ body
app.use(express.urlencoded({ extended: true })); // Hỗ trợ thêm form-data nếu cần

// Sử dụng Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/movies', movieRoutes);

app.get('/', (req, res) => {
    res.send('Server PhimVietHay đang chạy...');
});
// Tool bên ngoài sẽ gọi vào đây định kỳ
app.get('/ping', (req, res) => {
    res.status(200).send('Pong! Server is alive.');
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});