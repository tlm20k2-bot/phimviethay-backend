const db = require('../config/database');

class User {
    // --- CÁC HÀM CŨ (GIỮ NGUYÊN 100% LOGIC) ---

    // Tìm user để Login thường
    static async findByCredentials(identifier) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                [identifier, identifier]
            );
            return rows[0];
        } catch (e) { return null; }
    }

    // Kiểm tra tồn tại khi Register thường
    static async checkExist(username, email) {
        try {
            const [rows] = await db.execute(
                'SELECT id FROM users WHERE email = ? OR username = ? limit 1', 
                [email, username]
            );
            return rows[0];
        } catch (e) { return null; }
    }

    // Tạo user thường (Local Register)
    static async create(username, email, password, fullname) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, fullname, auth_type) VALUES (?, ?, ?, ?, ?)',
            [username, email, password, fullname, 'local']
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT id, username, fullname, email, avatar, role, banned_until FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.fullname) { fields.push('fullname = ?'); values.push(data.fullname); }
        if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
        if (data.password) { fields.push('password = ?'); values.push(data.password); }
        // Thêm update google_id nếu cần link tài khoản sau này
        if (data.google_id) { fields.push('google_id = ?'); values.push(data.google_id); }
        if (data.auth_type) { fields.push('auth_type = ?'); values.push(data.auth_type); }

        if (fields.length === 0) return null;
        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await db.execute(sql, values);
        return result;
    }

    static async getAll(page = 1, search = '') {
        // ... (Giữ nguyên logic getAll cũ của bạn)
        const limit = 20;
        const offset = (page - 1) * limit;
        let sql = 'SELECT id, username, email, fullname, role, avatar, banned_until, created_at FROM users';
        const params = [];
        if (search) {
            sql += ' WHERE username LIKE ? OR email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));
        const [rows] = await db.execute(sql, params);
        
        let countSql = 'SELECT COUNT(*) as total FROM users';
        let countParams = [];
        if (search) {
             countSql += ' WHERE username LIKE ? OR email LIKE ?';
             countParams.push(`%${search}%`, `%${search}%`);
        }
        const [countRows] = await db.execute(countSql, countParams);
        return { users: rows, total: countRows[0].total };
    }

    // --- CÁC HÀM MỚI (DÀNH CHO GOOGLE LOGIN) ---

    // 1. Tìm user bằng Google ID
    static async findByGoogleId(googleId) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
            return rows[0];
        } catch (e) { return null; }
    }

    // 2. Tìm user bằng Email (để link tài khoản nếu email trùng)
    static async findByEmail(email) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (e) { return null; }
    }

    // 3. Tạo User mới từ Google (Không cần password)
    static async createSocialUser({ username, email, googleId, avatar, fullname }) {
        try {
            // auth_type = 'google', password để NULL
            const [result] = await db.execute(
                'INSERT INTO users (username, email, google_id, avatar, fullname, auth_type, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, email, googleId, avatar, fullname, 'google', null]
            );
            return result.insertId;
        } catch (e) {
            console.error("Error creating social user:", e);
            throw e;
        }
    }
}

module.exports = User;