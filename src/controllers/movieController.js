const db = require('../config/database');

// Tăng lượt xem (Lưu Full Info để hiển thị Card đẹp)
exports.increaseView = async (req, res) => {
    try {
        const { slug, name, thumb, quality, year, episode_current, vote_average } = req.body;
        
        if (!slug) return res.status(400).json({ message: 'Thiếu slug' });

        // SQL: Nếu chưa có thì tạo mới, nếu có rồi thì tăng view + cập nhật thông tin mới nhất
        const sql = `
            INSERT INTO movie_views 
            (movie_slug, movie_name, movie_thumb, movie_quality, movie_year, episode_current, vote_average, view_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1) 
            ON DUPLICATE KEY UPDATE 
                view_count = view_count + 1,
                movie_name = VALUES(movie_name),
                movie_thumb = VALUES(movie_thumb),
                movie_quality = VALUES(movie_quality),
                movie_year = VALUES(movie_year),
                episode_current = VALUES(episode_current),
                vote_average = VALUES(vote_average)
        `;
        
        await db.execute(sql, [
            slug, 
            name, 
            thumb, 
            quality || 'HD', 
            year || '2024', 
            episode_current || 'Full', 
            vote_average || 0
        ]);
        
        res.json({ message: 'View counted' });
    } catch (error) {
        console.error("Lỗi tăng view:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy Top Trending (Giữ nguyên)
exports.getTrending = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM movie_views ORDER BY view_count DESC LIMIT 10');
        res.json(rows);
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};