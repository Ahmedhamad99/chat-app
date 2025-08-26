"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatSocket;
function chatSocket(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("message:send", (data) => {
            // broadcast message to conversation room
            io.emit("message:new", data);
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}
