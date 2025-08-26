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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Create a new conversation
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userIds } = req.body;
        if (!userIds || userIds.length < 2) {
            return res.status(400).json({ message: "A conversation needs at least 2 users." });
        }
        const conversation = yield prisma.conversation.create({
            data: {
                users: {
                    connect: userIds.map((id) => ({ id })),
                },
            },
            include: { users: true },
        });
        res.status(201).json(conversation);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create conversation" });
    }
}));
// Get all conversations of a user
router.get("/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const conversations = yield prisma.conversation.findMany({
            where: { users: { some: { id: userId } } },
            include: {
                users: true,
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1, // last message preview
                },
            },
        });
        res.json(conversations);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
}));
exports.default = router;
