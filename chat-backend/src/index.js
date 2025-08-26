"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const error_1 = require("./middleware/error");
const chat_1 = __importDefault(require("./sockets/chat"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/auth", auth_routes_1.default);
app.use("/conversations", conversation_routes_1.default);
app.use("/messages", message_routes_1.default);
// Error handling
app.use(error_1.errorHandler);
// Sockets
(0, chat_1.default)(io);
server.listen(4000, () => {
    console.log("🚀 Server running at http://localhost:4000");
});
