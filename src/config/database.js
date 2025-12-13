const mysql = require('mysql2');
require('dotenv').config();

// Cấu hình Connection Pool tối ưu cho TiDB Serverless (Free Tier)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,

    // Tinh chỉnh tài nguyên: Giảm limit để phù hợp với gói Free
    waitForConnections: true,
    connectionLimit: 5,  // Giảm từ 10 -> 5 (TiDB Free chịu tải tốt hơn ở mức này)
    queueLimit: 50,      // Giới hạn hàng đợi request DB để server Fail-fast thay vì treo

    // Giữ kết nối ổn định trên môi trường Cloud
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,

    // SSL bắt buộc cho TiDB
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    }
});

const db = pool.promise();

// Kiểm tra kết nối 1 lần khi khởi động
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ [Database] Kết nối thất bại:', err.message);
    } else {
        console.log('✅ [Database] Kết nối TiDB thành công!');
        connection.release();
    }
});

module.exports = db;