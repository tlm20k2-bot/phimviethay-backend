const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Tạo kết nối Pool (Tối ưu hiệu suất)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chuyển sang Promise wrapper để dùng async/await cho sướng
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