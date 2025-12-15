const axios = require('axios');
const Movie = require('../models/Movie');

// Helper: Format API Data chuẩn trước khi lưu/trả về
const formatMovieData = (apiMovie) => ({
    slug: apiMovie.slug,
    origin_name: apiMovie.origin_name,
    name: apiMovie.name,
    thumb_url: apiMovie.thumb_url,
    poster_url: apiMovie.poster_url,
    content: apiMovie.content,
    type: apiMovie.type,
    status: apiMovie.status,
    year: apiMovie.year,
    time: apiMovie.time,
    episode_current: apiMovie.episode_current,
    episode_total: apiMovie.episode_total,
    quality: apiMovie.quality,
    lang: apiMovie.lang
});

exports.getMovieDetail = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) return res.status(400).json({ message: 'Missing slug' });

        // Bước 1: Lấy data từ DB local
        let dbMovie = await Movie.findBySlug(slug);

        // Bước 2: Gọi API OPhim để check cập nhật (Hybrid Mode)
        try {
            const response = await axios.get(`https://ophim1.com/phim/${slug}`);
            const apiData = response.data;

            if (apiData.status && apiData.movie) {
                const apiMovie = apiData.movie;
                const formatted = formatMovieData(apiMovie);

                // --- LOGIC QUAN TRỌNG: Sync vào DB ---
                // Hàm create bây giờ đã có logic UPDATE thông tin mới nhất
                // Việc này chạy ngầm (không await) để trả response nhanh hơn
                Movie.create(formatted).catch(e => console.error("Sync Bg Error:", e.message));

                // --- MERGE DATA THÔNG MINH ---
                // Ưu tiên data mới nhất từ API (Info, Episodes)
                // Giữ lại view_count từ DB local
                apiData.movie = {
                    ...apiMovie,
                    view_count: dbMovie ? dbMovie.view_count + 1 : 1, // +1 view ảo cho session hiện tại
                    _id: dbMovie ? dbMovie.id : null // Giữ ID để frontend dùng
                };

                return res.json(apiData);
            }
        } catch (apiErr) {
            // [OFFLINE MODE] Nếu API OPhim lỗi, fallback về DB local
            if (dbMovie) {
                // Tăng view
                Movie.incrementView(slug);
                return res.json({
                    status: true,
                    movie: dbMovie,
                    episodes: [] // Lưu ý: DB hiện tại chưa lưu episodes JSON, nên offline mode sẽ mất list tập
                });
            }
        }

        // Trường hợp xấu nhất: Không có trong DB, API lỗi
        return res.status(404).json({ message: 'Movie not found' });

    } catch (error) {
        console.error("[Controller] GetMovie Error:", error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTrending = async (req, res) => {
    try {
        const movies = await Movie.getTrending(10);
        res.json(movies.map(m => ({
            _id: m.id,
            slug: m.slug,
            name: m.name,
            origin_name: m.origin_name,
            thumb_url: m.thumb_url,
            poster_url: m.poster_url,
            year: m.year,
            view_count: m.view_count
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trending' });
    }
};