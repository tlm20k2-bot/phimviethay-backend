const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./src/config/database'); 
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- CẤU HÌNH CORS ĐỘNG ---
const corsOptions = {
    origin: process.env.CLIENT_URL || '*', // Nếu chưa set thì cho phép tất cả (cẩn thận khi deploy)
    credentials: true, // Cho phép gửi cookie nếu cần
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.send('Server PhimVietHay đang chạy...');
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port ${PORT}`);
});