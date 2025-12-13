const db = require('../config/database');

const Movie = {
    // 1. Tìm phim theo Slug
    findBySlug: async (slug) => {
        try {
            const [rows] = await db.execute('SELECT * FROM movies WHERE slug = ?', [slug]);
            return rows[0];
        } catch (error) {
            return null;
        }
    },

    // 2. Sync phim: Thêm mới hoặc Cập nhật thông tin (Logic đã Fix)
    create: async (data) => {
        try {
            const sql = `
                INSERT INTO movies 
                (slug, origin_name, name, thumb_url, poster_url, content, type, status, year, time, episode_current, episode_total, quality, lang)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    episode_current = VALUES(episode_current),
                    episode_total = VALUES(episode_total),
                    quality = VALUES(quality),
                    lang = VALUES(lang),
                    status = VALUES(status),
                    updated_at = NOW(),
                    view_count = view_count + 1
            `;
            
            const params = [
                data.slug, data.origin_name, data.name, data.thumb_url, data.poster_url, 
                data.content, data.type, data.status, data.year, data.time, 
                data.episode_current, data.episode_total, data.quality, data.lang
            ];
            
            await db.execute(sql, params);
            return true;
        } catch (error) {
            console.error("[Movie Model] Sync Error:", error.message); // Chỉ log message ngắn gọn
            return false;
        }
    },

    // 3. Tăng view thủ công (Dùng khi user xem phim đã có trong DB)
    incrementView: async (slug) => {
        try {
            await db.execute('UPDATE movies SET view_count = view_count + 1 WHERE slug = ?', [slug]);
        } catch (e) {}
    },

    // 4. Lấy Top Trending
    getTrending: async (limit = 10) => {
        try {
            const [rows] = await db.execute('SELECT * FROM movies ORDER BY view_count DESC LIMIT ?', [String(limit)]);
            return rows;
        } catch (error) {
            return [];
        }
    }
};

module.exports = Movie;