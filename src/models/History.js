const db = require('../config/database');

class History {
    // 1. Hàm set (Lưu lịch sử)
    // CẦN PHẢI CÓ TỪ KHÓA 'static' ĐỂ GỌI ĐƯỢC History.set()
    static async set(userId, data) {
        const { movieSlug, episodeSlug, movieName, movieThumb, episodeName } = data;
        
        const sql = `
            INSERT INTO history (user_id, movie_slug, episode_slug, movie_name, movie_thumb, episode_name, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE 
                episode_slug = VALUES(episode_slug), 
                episode_name = VALUES(episode_name),
                updated_at = NOW()
        `;

        const [result] = await db.execute(sql, [
            userId, 
            movieSlug, 
            episodeSlug, 
            movieName, 
            movieThumb, 
            episodeName
        ]);
        return result;
    }

    // 2. Hàm getList (Lấy lịch sử)
    static async getList(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM history WHERE user_id = ? ORDER BY updated_at DESC`,
            [userId]
        );
        return rows;
    }
    
    // 3. Hàm clear (Xóa lịch sử)
    static async clear(userId) {
        const [result] = await db.execute('DELETE FROM history WHERE user_id = ?', [userId]);
        return result;
    }
}

module.exports = History; // <-- QUAN TRỌNG: Phải export class này ra