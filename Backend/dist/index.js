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
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const router = express_1.default.Router();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 5000;
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const prisma = new client_1.PrismaClient();
// --- Zod Schemas ---
const idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive("Id must be positive")
});
const processTranscriptSchema = zod_1.z.object({
    transcript: zod_1.z.string().min(10, "Please enter a valid transcript")
});
const updateActionSchema = zod_1.z.object({
    taskDescription: zod_1.z.string().min(1, "Please add valid details").optional(),
    owner: zod_1.z.string().nullable().optional(),
    dueDate: zod_1.z.string().nullable().optional(),
    isDone: zod_1.z.boolean().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
}).strict();
// Route : for process the transcript
router.post('/api/processTranscript', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedBody = processTranscriptSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: "validation failed", details: parsedBody.error });
            return;
        }
        const { transcript } = parsedBody.data;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const prompt = `
            Analyze the following meeting transcript and extract all action items.
            Return ONLY a valid JSON array of objects. 
            Do not include any other conversational text or markdown formatting.
            Each object must have exactly these keys:
            - "taskDescription" (string, the action item)
            - "owner" (string, who is responsible, or null if unknown)
            - "dueDate" (string, the deadline, or null if unknown)

            Transcript:
            """
            ${transcript}
            """
        `;
        const result = yield model.generateContent(prompt);
        const cleanJsonString = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const extractedItems = JSON.parse(cleanJsonString);
        const newTranscript = yield prisma.transcript.create({
            data: {
                rawText: transcript,
                actionItems: {
                    create: extractedItems.map(item => ({
                        taskDescription: item.taskDescription,
                        owner: item.owner,
                        dueDate: item.dueDate
                    }))
                }
            },
            include: { actionItems: true }
        });
        res.status(200).json({
            message: 'Transcript processed successfully',
            transcript_id: newTranscript.id,
            data: newTranscript.actionItems
        });
    }
    catch (error) {
        console.error("Error while processing the transcript:", error);
        res.status(500).json({ error: "An error occurred while parsing the transcript" });
    }
}));
// Get History
router.get('/api/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield prisma.transcript.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                rawText: true,
                createdAt: true,
                _count: { select: { actionItems: true } }
            }
        });
        const formattedHistory = history.map(item => ({
            id: item.id,
            preview_text: item.rawText.length > 100 ? item.rawText.substring(0, 100) + '...' : item.rawText,
            created_at: item.createdAt,
            action_item_count: item._count.actionItems
        }));
        res.status(200).json({ data: formattedHistory });
    }
    catch (error) {
        console.error("Error while accessing history:", error);
        res.status(500).json({ error: "An error occurred while accessing the history" });
    }
}));
// Get Specific Transcript Items
router.get('/api/transcript/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedId = idParamSchema.safeParse({ id: req.params.id });
        if (!parsedId.success) {
            res.status(400).json({ error: 'Invalid ID.' });
            return;
        }
        const items = yield prisma.actionItem.findMany({
            where: { transcriptId: parsedId.data.id },
            orderBy: { id: 'asc' }
        });
        res.status(200).json({ data: items });
    }
    catch (error) {
        console.error("Error while accessing transcript items:", error);
        res.status(500).json({ error: "An error occurred while accessing the history" });
    }
}));
// Update an Action Item
router.patch('/api/action-items/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedId = idParamSchema.safeParse({ id: req.params.id });
        if (!parsedId.success) {
            res.status(400).json({ error: 'Invalid ID.' });
            return;
        }
        const parsedBody = updateActionSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: 'Validation failed', details: parsedBody.error });
            return;
        }
        const updatedItem = yield prisma.actionItem.update({
            where: { id: parsedId.data.id },
            data: parsedBody.data
        });
        res.status(200).json({ data: updatedItem });
    }
    catch (error) {
        console.error("Error while updating item:", error);
        res.status(500).json({ error: "An error occurred while updating the item" });
    }
}));
// Delete an Action Item
router.delete('/api/action-items/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedId = idParamSchema.safeParse({ id: req.params.id });
        if (!parsedId.success) {
            res.status(400).json({ error: 'Invalid ID.' });
            return;
        }
        yield prisma.actionItem.delete({
            where: { id: parsedId.data.id }
        });
        res.status(200).json({ deleted_id: parsedId.data.id });
    }
    catch (error) {
        console.error("Error while deleting item:", error);
        res.status(500).json({ error: "An error occurred while deleting the item" });
    }
}));
app.use('/', router);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
