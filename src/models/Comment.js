const db = require('../config/database');

class Comment {
    // Thêm bình luận
    static async add(userId, movieSlug, episodeSlug, content, parentId = null) {
        // Xử lý episodeSlug: Nếu là undefined hoặc rỗng -> chuyển thành null
        const epSlugValue = (episodeSlug && episodeSlug !== 'undefined') ? episodeSlug : null;
        
        const sql = 'INSERT INTO comments (user_id, movie_slug, episode_slug, content, parent_id) VALUES (?, ?, ?, ?, ?)';
        
        const [result] = await db.execute(sql, [
            userId, 
            movieSlug, 
            epSlugValue, 
            content,
            parentId
        ]);
        return result.insertId;
    }

    // Lấy bình luận
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

        sql += ` ORDER BY c.created_at DESC`;

        const [rows] = await db.execute(sql, params);
        return rows;
    }

    // Toggle Like
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

    // --- SỬA HÀM XÓA (DELETE CASCADE) ---
    static async delete(commentId, userId, userRole) {
        // 1. Kiểm tra xem comment có tồn tại và có phải của user này không
        const [rows] = await db.execute('SELECT id, user_id FROM comments WHERE id = ?', [commentId]);
        
        if (rows.length === 0) return false; // Không tìm thấy
        
        const comment = rows[0];

        // Nếu không phải Admin VÀ không phải chính chủ -> Chặn
        if (userRole !== 'admin' && comment.user_id !== userId) {
            return false;
        }

        // 2. Xóa comment đó VÀ tất cả các reply của nó (những dòng có parent_id = commentId)
        const sql = 'DELETE FROM comments WHERE id = ? OR parent_id = ?';
        const [result] = await db.execute(sql, [commentId, commentId]);

        return result.affectedRows > 0;
    }
    static async getAll() {
        const sql = `
            SELECT c.*, u.username, u.avatar 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            ORDER BY c.created_at DESC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }
}

module.exports = Comment;