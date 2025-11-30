const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // --- THÊM ĐOẠN NÀY ĐỂ CHẠY ĐƯỢC TRÊN TIDB ---
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
    // ---------------------------------------------
});

const db = pool.promise();

// Test kết nối
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('✅ Đã kết nối thành công tới MySQL Database!');
        connection.release();
    }
});

module.exports = db;