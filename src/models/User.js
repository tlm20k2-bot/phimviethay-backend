const db = require('../config/database');

class User {
    // Tìm user bằng Email HOẶC Username
    static async findByCredentials(identifier) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?', 
            [identifier, identifier]
        );
        return rows[0];
    }

    // Kiểm tra tồn tại
    static async checkExist(username, email) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?', 
            [email, username]
        );
        return rows[0];
    }

    // Tạo user mới
    static async create(username, email, password, fullname) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, fullname) VALUES (?, ?, ?, ?)',
            [username, email, password, fullname]
        );
        return result.insertId;
    }

    // Tìm theo ID
    static async findById(id) {
        const [rows] = await db.execute('SELECT id, username, fullname, email, avatar, role FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    // --- HÀM MỚI: CẬP NHẬT USER ---
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Chỉ update những trường có gửi lên
        if (data.fullname) {
            fields.push('fullname = ?');
            values.push(data.fullname);
        }
        if (data.avatar) {
            fields.push('avatar = ?');
            values.push(data.avatar);
        }
        if (data.password) {
            fields.push('password = ?');
            values.push(data.password);
        }

        // Nếu không có gì để update thì return luôn
        if (fields.length === 0) return null;

        // Thêm ID vào cuối mảng values cho điều kiện WHERE
        values.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        const [result] = await db.execute(sql, values);
        return result;
    }
    static async getAll() {
        const [rows] = await db.execute('SELECT id, username, email, fullname, role, avatar, created_at FROM users ORDER BY created_at DESC');
        return rows;
    }

    // Xóa user
    static async delete(id) {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;