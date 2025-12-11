const axios = require('axios');
const Movie = require('../models/Movie');

// 1. [CORE] Lấy chi tiết phim (Cơ chế Lazy Sync)
exports.getMovieDetail = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) return res.status(400).json({ message: 'Thiếu slug' });

        // BƯỚC 1: Kiểm tra trong Database
        let movie = await Movie.findBySlug(slug);

        if (movie) {
            // Tăng view ngầm
            Movie.incrementView(slug);

            // HYBRID: Lấy Info từ DB + Episodes từ API
            try {
                const response = await axios.get(`https://ophim1.com/phim/${slug}`);
                const apiData = response.data;
                
                if (apiData.status) {
                    apiData.movie = { 
                        ...apiData.movie, // Backup
                        ...movie,         // Ưu tiên data từ DB mình
                    };
                    return res.json(apiData);
                }
            } catch (err) {
                // Chỉ log lỗi thực sự quan trọng (khi API Ophim chết)
                console.error(`[Offline Mode] Không gọi được API cho phim: ${slug}`);
                return res.json({ 
                    status: true, 
                    movie: movie, 
                    episodes: [] 
                });
            }
        }

        // BƯỚC 2: Nếu chưa có trong DB -> Gọi API Ophim
        const response = await axios.get(`https://ophim1.com/phim/${slug}`);
        const apiData = response.data;

        if (!apiData.status || !apiData.movie) {
            return res.status(404).json({ message: 'Phim không tìm thấy' });
        }

        const m = apiData.movie;

        // BƯỚC 3: Lưu vào Database (Sync)
        const movieToSave = {
            slug: m.slug,
            origin_name: m.origin_name,
            name: m.name,
            thumb_url: m.thumb_url,
            poster_url: m.poster_url,
            content: m.content,
            type: m.type,
            status: m.status,
            year: m.year,
            time: m.time,
            episode_current: m.episode_current,
            episode_total: m.episode_total,
            quality: m.quality,
            lang: m.lang
        };

        // Lưu bất đồng bộ, chỉ log nếu có lỗi nghiêm trọng khi lưu
        Movie.create(movieToSave).catch(err => console.error("[DB Error] Lỗi lưu phim:", err));

        // Trả về dữ liệu
        res.json(apiData);

    } catch (error) {
        console.error("[System Error] Get Movie Detail:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Lấy Top Trending
exports.getTrending = async (req, res) => {
    try {
        const movies = await Movie.getTrending(10);
        
        const formattedMovies = movies.map(m => ({
            _id: m.id,
            slug: m.slug,
            name: m.name,
            origin_name: m.origin_name,
            thumb_url: m.thumb_url,
            poster_url: m.poster_url,
            year: m.year,
            quality: m.quality,
            lang: m.lang,
            vote_average: 0,
            view_count: m.view_count // Có thể dùng để debug hoặc hiển thị
        }));

        res.json(formattedMovies);
    } catch (error) {
        console.error("[System Error] Get Trending:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};