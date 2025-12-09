const db = require('../config/database'); 

// 1. Nhận log từ User
exports.submitLog = async (req, res) => {
    try {
        const { movie_slug, episode_slug, action_type, timestamp } = req.body;
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (!movie_slug || !episode_slug || !action_type || timestamp === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }

        const [spamCheck] = await db.query(`
            SELECT COUNT(*) as count FROM behavior_logs 
            WHERE ip_address = ? AND movie_slug = ? AND episode_slug = ? AND created_at > NOW() - INTERVAL 1 DAY
        `, [ip_address, movie_slug, episode_slug]);

        if (spamCheck[0].count >= 50) {
            return res.status(200).json({ message: 'Logged' }); 
        }

        await db.query(`
            INSERT INTO behavior_logs (movie_slug, episode_slug, ip_address, action_type, timestamp_recorded)
            VALUES (?, ?, ?, ?, ?)
        `, [movie_slug, episode_slug, ip_address, action_type, timestamp]);

        res.status(200).json({ message: 'Log received' });
    } catch (error) {
        console.error('Log Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. ADMIN GOD MODE
exports.adminForceIntro = async (req, res) => {
    try {
        const { movie_slug, episode_slug, intro_start, intro_end, credits_start } = req.body;

        if (!movie_slug || !episode_slug) {
            return res.status(400).json({ message: 'Thiếu slug phim/tập' });
        }

        const query = `
            INSERT INTO episode_intelligence 
            (movie_slug, episode_slug, intro_start, intro_end, credits_start, status, source, confidence_score, sample_count, updated_at)
            VALUES (?, ?, ?, ?, ?, 'VERIFIED', 'ADMIN', 1.0, 1, NOW())
            ON DUPLICATE KEY UPDATE
            intro_start = IFNULL(VALUES(intro_start), intro_start),
            intro_end = IFNULL(VALUES(intro_end), intro_end),
            credits_start = IFNULL(VALUES(credits_start), credits_start),
            status = 'VERIFIED',
            source = 'ADMIN',
            confidence_score = 1.0,
            updated_at = NOW();
        `;

        const p_start = intro_start !== undefined ? intro_start : null;
        const p_end = intro_end !== undefined ? intro_end : null;
        const p_credits = credits_start !== undefined ? credits_start : null;

        await db.query(query, [movie_slug, episode_slug, p_start, p_end, p_credits]);
        await db.query(`DELETE FROM behavior_logs WHERE movie_slug = ? AND episode_slug = ?`, [movie_slug, episode_slug]);

        res.status(200).json({ message: 'Admin Override Success' });
    } catch (error) {
        console.error('God Mode Error:', error);
        res.status(500).json({ message: 'Lỗi Database: ' + error.message });
    }
};

// 3. Lấy dữ liệu cho Player
exports.getEpisodeIntelligence = async (req, res) => {
    try {
        const { movie_slug, episode_slug } = req.query;
        if (!movie_slug || !episode_slug) return res.status(400).json({ message: 'Missing params' });

        const [rows] = await db.query(`
            SELECT intro_start, intro_end, credits_start, status 
            FROM episode_intelligence 
            WHERE movie_slug = ? AND episode_slug = ?
        `, [movie_slug, episode_slug]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(200).json(null);
        }
    } catch (error) {
        console.error('Get Data Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. Lấy danh sách Intro (Bảng chi tiết)
exports.getAllIntros = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; 
        const search = req.query.search || ''; 
        const exactMovie = req.query.exact_movie; 
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];

        if (exactMovie) {
            whereClause = 'WHERE movie_slug = ?';
            queryParams = [exactMovie];
        } else if (search) {
            whereClause = 'WHERE movie_slug LIKE ? OR episode_slug LIKE ?';
            queryParams = [`%${search}%`, `%${search}%`];
        }

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM episode_intelligence ${whereClause}`, 
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        queryParams.push(limit, offset);
        const [rows] = await db.query(
            `SELECT * FROM episode_intelligence ${whereClause} ORDER BY episode_slug ASC LIMIT ? OFFSET ?`, 
            queryParams
        );

        res.status(200).json({
            data: rows,
            pagination: { page, limit, totalItems, totalPages }
        });
    } catch (error) {
        console.error("Get All Intros Error:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 5. Xóa Intro
exports.deleteIntro = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM episode_intelligence WHERE id = ?', [id]);
        res.status(200).json({ message: 'Đã xóa dữ liệu Intro' });
    } catch (error) {
        console.error("Delete Intro Error:", error);
        res.status(500).json({ message: 'Lỗi xóa' });
    }
};

// 6. Lấy thống kê theo đầu phim (Dashboard)
exports.getMovieStats = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = 'WHERE movie_slug LIKE ?';
            params.push(`%${search}%`);
        }

        const [globalStats] = await db.query(`
            SELECT 
                COUNT(DISTINCT movie_slug) as total_movies,
                COUNT(*) as total_episodes,
                COUNT(CASE WHEN intro_start IS NOT NULL THEN 1 END) as total_intros,
                COUNT(CASE WHEN credits_start IS NOT NULL THEN 1 END) as total_credits
            FROM episode_intelligence
        `);

        const [countResult] = await db.query(
            `SELECT COUNT(DISTINCT movie_slug) as total FROM episode_intelligence ${whereClause}`,
            params
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        params.push(limit, offset);
        const [rows] = await db.query(`
            SELECT 
                movie_slug, 
                COUNT(episode_slug) as total_records,
                COUNT(CASE WHEN intro_start IS NOT NULL THEN 1 END) as count_intro,
                COUNT(CASE WHEN credits_start IS NOT NULL THEN 1 END) as count_credits,
                MAX(updated_at) as last_update,
                MAX(source) as last_source
            FROM episode_intelligence
            ${whereClause}
            GROUP BY movie_slug
            ORDER BY last_update DESC
            LIMIT ? OFFSET ?
        `, params);

        res.status(200).json({
            data: rows,
            summary: globalStats[0],
            pagination: { page, limit, totalItems, totalPages }
        });

    } catch (error) {
        console.error("Get Movie Stats Error:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};