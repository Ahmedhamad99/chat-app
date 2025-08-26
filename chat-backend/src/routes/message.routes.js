"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/", auth_1.authenticate, message_controller_1.create);
router.get("/:conversationId", auth_1.authenticate, message_controller_1.list);
exports.default = router;
