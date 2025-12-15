const db = require('../config/database');

class Comment {
    // 1. Thêm bình luận mới
    static async add(userId, movieSlug, episodeSlug, content, parentId = null) {
        const epSlugValue = (episodeSlug && episodeSlug !== 'undefined') ? episodeSlug : null;
        
        const sql = 'INSERT INTO comments (user_id, movie_slug, episode_slug, content, parent_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(sql, [userId, movieSlug, epSlugValue, content, parentId]);
        return result.insertId;
    }

    // 2. Lấy bình luận cho trang xem phim (Client)
    static async getByContext(movieSlug, episodeSlug, currentUserId = 0) {
        let sql = `
            SELECT 
                c.*, 
                u.fullname, u.username, u.avatar, u.role,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as is_liked
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.movie_slug = ? 
        `;
        
        const params = [currentUserId, movieSlug];

        if (episodeSlug && episodeSlug !== 'null' && episodeSlug !== 'undefined') {
            sql += ` AND c.episode_slug = ?`;
            params.push(episodeSlug);
        } else {
            sql += ` AND c.episode_slug IS NULL`;
        }

        // [QUAN TRỌNG] Sắp xếp: Comment Ghim lên đầu -> Mới nhất
        sql += ` ORDER BY c.is_pinned DESC, c.created_at DESC`;
        
        const [rows] = await db.execute(sql, params);
        return rows;
    }

    // 3. Like/Unlike
    static async toggleLike(userId, commentId) {
        const [check] = await db.execute('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
        if (check.length > 0) {
            await db.execute('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
            return false;
        } else {
            await db.execute('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [userId, commentId]);
            return true;
        }
    }

    // 4. Xóa bình luận
    static async delete(commentId, userId, userRole) {
        const [rows] = await db.execute('SELECT id, user_id FROM comments WHERE id = ?', [commentId]);
        if (rows.length === 0) return false;
        
        const comment = rows[0];
        // Check quyền: Admin hoặc Chính chủ
        if (userRole !== 'super_admin' && userRole !== 'admin' && comment.user_id !== userId) {
            return false;
        }

        const sql = 'DELETE FROM comments WHERE id = ? OR parent_id = ?';
        const [result] = await db.execute(sql, [commentId, commentId]);
        return result.affectedRows > 0;
    }

    // 5. Ghim/Bỏ ghim (Dành cho Admin)
    static async togglePin(commentId) {
        // Lấy trạng thái hiện tại
        const [rows] = await db.execute('SELECT is_pinned FROM comments WHERE id = ?', [commentId]);
        if (rows.length === 0) return false;
        
        const currentStatus = rows[0].is_pinned;
        // Đảo ngược trạng thái (0 <-> 1)
        await db.execute('UPDATE comments SET is_pinned = ? WHERE id = ?', [!currentStatus, commentId]);
        return !currentStatus;
    }

    // 6. [FIX LỖI 500] Lấy tất cả comment cho trang Admin Dashboard
    static async getAll() {
        const sql = `
            SELECT 
                c.id, c.content, c.created_at, c.movie_slug, c.is_pinned,
                u.username, u.avatar, u.role
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            ORDER BY c.created_at DESC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }
}

module.exports = Comment;