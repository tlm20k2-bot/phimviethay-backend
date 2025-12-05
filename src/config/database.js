const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    // Thông tin kết nối cơ bản
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,

    // Cấu hình Pool để tối ưu hiệu năng
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Cấu hình Keep-Alive để tránh lỗi ECONNRESET
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    // Cấu hình SSL (Bắt buộc đối với TiDB/Cloud DB)
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false 
    }
});

// Chuyển đổi sang Promise để sử dụng async/await
const db = pool.promise();

// Kiểm tra kết nối khi khởi động server
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('✅ Đã kết nối thành công tới MySQL Database!');
        connection.release();
    }
});

module.exports = db;