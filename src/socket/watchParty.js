const activeRooms = {}; 

const watchPartyHandler = (io, socket) => {
    
    // 1. GET ROOMS
    socket.on("get_rooms", () => {
        const publicRooms = Object.entries(activeRooms)
            .filter(([_, room]) => room.isPublic && !room.deleteTimer)
            .map(([id, room]) => ({
                id,
                roomName: room.roomName,
                movie: room.movie,
                viewerCount: room.viewers.length,
            }));
        socket.emit("list_rooms", publicRooms);
    });

    // 2. CREATE ROOM
    socket.on("create_room", ({ roomId, roomName, isPublic, userId }) => {
        // Nếu phòng đang chờ xóa (do Host F5), hủy xóa ngay để tái sử dụng
        if (activeRooms[roomId] && activeRooms[roomId].deleteTimer) {
            clearTimeout(activeRooms[roomId].deleteTimer);
            activeRooms[roomId].deleteTimer = null;
            return;
        }

        activeRooms[roomId] = {
            roomName: roomName || `Phòng ${roomId}`,
            ownerId: userId, 
            hostSocketId: socket.id,
            isPublic: isPublic,
            movie: null,
            serverIndex: 0,
            viewers: [],
            deleteTimer: null
        };
        
        socket.join(roomId);
        socket.emit("room_created", { roomId });
        if (isPublic) io.emit("update_room_list");
    });

    // 3. JOIN ROOM
    socket.on("join_room", ({ roomId, userId, userInfo }) => {
        const room = activeRooms[roomId];
        
        if (!room) {
            socket.emit("error_join", "Phòng không tồn tại hoặc đã giải tán!");
            return;
        }

        // Logic Reconnect: Nếu Host cũ quay lại -> Hủy lệnh giải tán phòng
        let isHost = false;
        if (room.ownerId && String(room.ownerId) === String(userId)) {
            isHost = true;
            room.hostSocketId = socket.id; 
            
            if (room.deleteTimer) {
                clearTimeout(room.deleteTimer);
                room.deleteTimer = null;
            }
        }

        socket.join(roomId);

        // Cập nhật danh sách người xem
        const existingViewerIndex = room.viewers.findIndex(v => v.user.id === userInfo.id || v.socketId === socket.id);
        const viewerData = { socketId: socket.id, user: { ...userInfo, isHost } };

        if (existingViewerIndex !== -1) {
            room.viewers[existingViewerIndex] = viewerData; 
        } else {
            room.viewers.push(viewerData); 
        }

        socket.emit("joined_success", { 
            isHost, 
            roomName: room.roomName,
            movie: room.movie,
            serverIndex: room.serverIndex 
        });

        io.in(roomId).emit("update_viewers", room.viewers.map(v => v.user));
        
        if (room.isPublic) io.emit("update_room_list");
    });

    // 4. VIDEO ACTION
    socket.on("video_action", (data) => {
        const room = activeRooms[data.roomId];
        if (!room) return;
        if (data.action !== 'request_sync' && room.hostSocketId !== socket.id) return; 

        if (data.action === 'change_movie') {
            room.movie = { slug: data.slug, name: data.name, thumb: data.thumb };
            room.serverIndex = 0;
            if (room.isPublic) io.emit("update_room_list");
        }
        socket.to(data.roomId).emit("receive_video_action", data);
    });

    // 5. CHAT
    socket.on("send_message", (data) => {
        socket.to(data.roomId).emit("receive_message", data);
    });

    socket.on("delete_message", ({ roomId, messageId }) => {
        const room = activeRooms[roomId];
        if (room && room.hostSocketId === socket.id) {
            io.in(roomId).emit("message_deleted", { messageId });
        }
    });

    // 6. END ROOM
    socket.on("end_room", ({ roomId, userId }) => {
        const room = activeRooms[roomId];
        if (room && String(room.ownerId) === String(userId)) {
            io.in(roomId).emit("room_destroyed", "Chủ phòng đã giải tán phòng.");
            if (room.deleteTimer) clearTimeout(room.deleteTimer);
            delete activeRooms[roomId];
            io.emit("update_room_list");
            io.in(roomId).socketsLeave(roomId);
        }
    });

    // 7. DISCONNECT
    socket.on("disconnect", () => {
        for (const [roomId, room] of Object.entries(activeRooms)) {
            
            const viewerIndex = room.viewers.findIndex(v => v.socketId === socket.id);
            
            if (viewerIndex !== -1) {
                // Xóa user khỏi danh sách
                room.viewers.splice(viewerIndex, 1);
                io.in(roomId).emit("update_viewers", room.viewers.map(v => v.user));

                // [LOGIC] Nếu Host out -> Chờ 10s để reconnect
                if (socket.id === room.hostSocketId) {
                    room.deleteTimer = setTimeout(() => {
                        if (activeRooms[roomId]) {
                            io.in(roomId).emit("room_destroyed", "Chủ phòng đã mất kết nối.");
                            io.in(roomId).socketsLeave(roomId); 
                            delete activeRooms[roomId];
                            io.emit("update_room_list");
                        }
                    }, 10000); 

                } else {
                    // [LOGIC] Nếu Guest out và phòng trống -> Chờ 60s hủy phòng
                    if (room.viewers.length === 0 && !room.deleteTimer) {
                        room.deleteTimer = setTimeout(() => {
                            if (activeRooms[roomId] && activeRooms[roomId].viewers.length === 0) {
                                delete activeRooms[roomId];
                                io.emit("update_room_list");
                            }
                        }, 60000); 
                    }
                }
                
                if (room.isPublic && !room.deleteTimer) io.emit("update_room_list");
                break; 
            }
        }
    });
};

module.exports = watchPartyHandler;