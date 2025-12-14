const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.chat = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Chỉ log khi thiếu key (lỗi nghiêm trọng)
            console.error("❌ MISSING GEMINI_API_KEY"); 
            return res.status(500).json({ reply: "Lỗi Server: Thiếu API Key" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { message } = req.body;

        if (!message) return res.status(400).json({ reply: "Bạn chưa nhập câu hỏi!" });

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const context = `
            Bạn là trợ lý ảo của website xem phim PhimVietHay.
            Nhiệm vụ: Tư vấn phim, gợi ý phim dựa trên tâm trạng khách hàng.
            YÊU CẦU: Trả lời KHÔNG QUÁ 3 CÂU VÀ CHỈ 1 ĐOẠN VĂN DUY NHẤT.
            Phong cách: Thân thiện, hài hước, dùng icon 🍿🎬.
            Lưu ý: Chỉ trả lời về phim ảnh.
            Cuối câu trả lời hãy nhắc khách tìm tên phim trên thanh tìm kiếm.
        `;

        const result = await model.generateContent(`${context}\n\nKhách hỏi: ${message}`);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        // Chỉ log error khi có lỗi phát sinh trong quá trình gọi API
        console.error("🔥 AI Lỗi trong Controller:", error.message);

        if (error.message.includes("429") || error.message.includes("Quota")) {
             return res.status(429).json({ 
                reply: "AI đang quá tải do nhiều người dùng, bạn chờ 1 phút rồi thử lại nhé! ⏳" 
            });
        }

        res.status(500).json({ 
            reply: "Hệ thống AI đang bảo trì, bạn quay lại sau nhé! 🤖",
            error: error.message 
        });
    }
};