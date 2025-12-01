const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    
    // --- CẤU HÌNH POOL (Quan trọng) ---
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
    // --- FIX LỖI ECONNRESET (Giữ kết nối luôn sống) ---
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    
    // --- CẤU HÌNH SSL CHO TIDB ---
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false // false để chạy dev, true khi deploy (như bài trước đã bàn)
    }
});

const db = pool.promise();

// Test kết nối (Thêm đoạn catch để không crash app nếu lỗi ban đầu)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('✅ Đã kết nối thành công tới MySQL Database!');
        connection.release();
    }
});

module.exports = db;