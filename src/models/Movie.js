const db = require('../config/database');

const Movie = {
    // 1. Tìm phim trong DB theo Slug
    findBySlug: async (slug) => {
        try {
            // Sử dụng execute cho an toàn (Prepared Statement)
            const [rows] = await db.execute('SELECT * FROM movies WHERE slug = ?', [slug]);
            return rows[0];
        } catch (error) {
            console.error("Lỗi tìm phim DB:", error);
            return null;
        }
    },

    // 2. Lưu phim mới vào DB (Sync từ API về)
    create: async (data) => {
        try {
            const sql = `
                INSERT INTO movies 
                (slug, origin_name, name, thumb_url, poster_url, content, type, status, year, time, episode_current, episode_total, quality, lang)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                view_count = view_count + 1, updated_at = NOW()
            `;
            const params = [
                data.slug,
                data.origin_name,
                data.name,
                data.thumb_url,
                data.poster_url,
                data.content,
                data.type,
                data.status,
                data.year,
                data.time,
                data.episode_current,
                data.episode_total,
                data.quality,
                data.lang
            ];
            
            await db.execute(sql, params);
            return true;
        } catch (error) {
            console.error("Lỗi lưu phim vào DB:", error);
            return false;
        }
    },

    // 3. Tăng lượt xem
    incrementView: async (slug) => {
        try {
            await db.execute('UPDATE movies SET view_count = view_count + 1 WHERE slug = ?', [slug]);
        } catch (error) {
            console.error("Lỗi tăng view:", error);
        }
    },

    // 4. Lấy Top Trending (Thay thế bảng movie_views cũ)
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