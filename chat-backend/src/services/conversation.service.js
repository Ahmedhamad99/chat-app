"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.getUserConversations = getUserConversations;
const prisma_1 = __importDefault(require("../config/prisma"));
function createConversation(userId, otherUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        let convo = yield prisma_1.default.conversation.findFirst({
            where: {
                participants: {
                    every: { userId: { in: [userId, otherUserId] } },
                },
            },
        });
        if (!convo) {
            convo = yield prisma_1.default.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId },
                            { userId: otherUserId },
                        ],
                    },
                },
                include: { participants: true },
            });
        }
        return convo;
    });
}
function getUserConversations(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.conversation.findMany({
            where: { participants: { some: { userId } } },
            include: {
                participants: { include: { user: true } },
                messages: { orderBy: { createdAt: "desc" }, take: 1 },
            },
        });
    });
}
