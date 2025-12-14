// File: server/check_key.js
const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("🔑 Đang kiểm tra Key:", apiKey ? "Đã tìm thấy Key" : "❌ Chưa có Key!");
console.log("📡 Đang kết nối tới Google...");

async function listModels() {
    try {
        // Gọi trực tiếp API lấy danh sách Model
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        
        const models = response.data.models;
        
        console.log("\n✅ KẾT NỐI THÀNH CÔNG! Dưới đây là các Model bạn được dùng:");
        console.log("-------------------------------------------------------------");
        
        // Lọc ra các model dùng để chat (generateContent)
        const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        chatModels.forEach(m => {
            console.log(`👉 Tên Model: ${m.name.replace('models/', '')}`);
        });
        console.log("-------------------------------------------------------------");
        console.log("💡 Hãy copy một trong các tên trên vào file aiController.js nhé!");

    } catch (error) {
        console.error("\n❌ LỖI RỒI:");
        if (error.response) {
            console.error(`- Status: ${error.response.status}`);
            console.error(`- Lý do: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(`- Chi tiết: ${error.message}`);
        }
    }
}

listModels();