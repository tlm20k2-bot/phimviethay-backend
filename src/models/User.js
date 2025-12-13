const db = require('../config/database');

class User {
    // Tìm user để Login (Email hoặc Username)
    static async findByCredentials(identifier) {
        try {
            // TiDB tối ưu tốt cho query đơn giản này, không cần quá lo về OR
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                [identifier, identifier]
            );
            return rows[0];
        } catch (e) { return null; }
    }

    // Kiểm tra tồn tại khi Register
    static async checkExist(username, email) {
        try {
            const [rows] = await db.execute(
                'SELECT id FROM users WHERE email = ? OR username = ? limit 1', 
                [email, username]
            );
            return rows[0];
        } catch (e) { return null; }
    }

    // Tạo user mới
    static async create(username, email, password, fullname) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, fullname) VALUES (?, ?, ?, ?)',
            [username, email, password, fullname]
        );
        return result.insertId;
    }

    // Tìm theo ID (Chỉ lấy info cần thiết, không lấy password)
    static async findById(id) {
        const [rows] = await db.execute('SELECT id, username, fullname, email, avatar, role, banned_until FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    // Dynamic Update (Giữ nguyên logic hay của bạn)
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.fullname) { fields.push('fullname = ?'); values.push(data.fullname); }
        if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
        if (data.password) { fields.push('password = ?'); values.push(data.password); }

        if (fields.length === 0) return null;

        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        const [result] = await db.execute(sql, values);
        return result;
    }

    static async getAll(page = 1, search = '') {
        const limit = 20;
        const offset = (page - 1) * limit;
        
        let sql = 'SELECT id, username, email, fullname, role, avatar, banned_until, created_at FROM users';
        const params = [];

        if (search) {
            sql += ' WHERE username LIKE ? OR email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset)); // TiDB đôi khi cần String cho Limit

        const [rows] = await db.execute(sql, params);
        
        // Đếm tổng để phân trang
        // (Lưu ý: Query COUNT(*) có thể chậm nếu bảng > 1 triệu dòng, nhưng với Free Tier thì OK)
        let countSql = 'SELECT COUNT(*) as total FROM users';
        let countParams = [];
        if (search) {
             countSql += ' WHERE username LIKE ? OR email LIKE ?';
             countParams.push(`%${search}%`, `%${search}%`);
        }
        const [countRows] = await db.execute(countSql, countParams);

        return { users: rows, total: countRows[0].total };
    }
}

module.exports = User;