// server/src/socket/index.js
const { Server } = require("socket.io");
const watchPartyHandler = require('./watchParty');

const initSocket = (httpServer, allowedOrigins) => {
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        // Gắn logic Watch Party vào mỗi kết nối mới
        watchPartyHandler(io, socket);
    });

    return io;
};

module.exports = initSocket;