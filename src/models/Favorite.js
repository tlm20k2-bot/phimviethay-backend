const db = require('../config/database');

class Favorite {
    // Thêm phim yêu thích
    static async add(userId, movieData) {
        const { slug, name, thumb } = movieData;
        // Dùng IGNORE để nếu trùng phim thì không báo lỗi, chỉ bỏ qua
        const [result] = await db.execute(
            'INSERT IGNORE INTO favorites (user_id, movie_slug, movie_name, movie_thumb) VALUES (?, ?, ?, ?)',
            [userId, slug, name, thumb]
        );
        return result;
    }

    // Xóa phim yêu thích
    static async remove(userId, movieSlug) {
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE user_id = ? AND movie_slug = ?',
            [userId, movieSlug]
        );
        return result;
    }

    // Lấy danh sách phim của user
    static async getList(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    // Kiểm tra xem user đã thích phim này chưa
    static async check(userId, movieSlug) {
        const [rows] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND movie_slug = ?',
            [userId, movieSlug]
        );
        return rows.length > 0;
    }
}

module.exports = Favorite;