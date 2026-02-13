import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const prisma = new PrismaClient();

// --- Zod Schemas ---
const idParamSchema = z.object({
    id: z.coerce.number().int().positive("Id must be positive")
});

const processTranscriptSchema = z.object({
    transcript: z.string().min(10, "Please enter a valid transcript")
});


const updateActionSchema = z.object({
    taskDescription: z.string().min(1, "Please add valid details").optional(),
    owner: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    isDone: z.boolean().optional(),
    tags: z.array(z.string()).optional()
}).strict();

//Basic type safety of ai extract text
interface AIActionItem {
    taskDescription: string;
    owner: string | null;
    dueDate: string | null;
}


// Route : for process the transcript
router.post('/api/processTranscript', async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedBody = processTranscriptSchema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ error: "validation failed", details: parsedBody.error });
            return;
        }

        const { transcript } = parsedBody.data;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
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

        const result = await model.generateContent(prompt);
        const cleanJsonString = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const extractedItems: AIActionItem[] = JSON.parse(cleanJsonString);
        const newTranscript = await prisma.transcript.create({
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

    } catch (error) {
        console.error("Error while processing the transcript:", error);
        res.status(500).json({ error: "An error occurred while parsing the transcript" });
    }
});

// Get History
router.get('/api/history', async (req: Request, res: Response): Promise<void> => {
    try {
        const history = await prisma.transcript.findMany({
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

    } catch (error) {
        console.error("Error while accessing history:", error);
        res.status(500).json({ error: "An error occurred while accessing the history" });
    }
});

// Get Specific Transcript Items
router.get('/api/transcript/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedId = idParamSchema.safeParse({ id: req.params.id });
        if (!parsedId.success) {
            res.status(400).json({ error: 'Invalid ID.' });
            return;
        }

        const items = await prisma.actionItem.findMany({
            where: { transcriptId: parsedId.data.id },
            orderBy: { id: 'asc' }
        });

        res.status(200).json({ data: items });

    } catch (error) {
        console.error("Error while accessing transcript items:", error);
        res.status(500).json({ error: "An error occurred while accessing the history" });
    }
});

// Update an Action Item
router.patch('/api/action-items/:id', async (req: Request, res: Response): Promise<void> => {
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

        const updatedItem = await prisma.actionItem.update({
            where: { id: parsedId.data.id },
            data: parsedBody.data
        });

        res.status(200).json({ data: updatedItem });

    } catch (error) {
        console.error("Error while updating item:", error);
        res.status(500).json({ error: "An error occurred while updating the item" });
    }
});

// Delete an Action Item
router.delete('/api/action-items/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedId = idParamSchema.safeParse({ id: req.params.id });
        if (!parsedId.success) {
            res.status(400).json({ error: 'Invalid ID.' });
            return;
        }

        await prisma.actionItem.delete({
            where: { id: parsedId.data.id }
        });

        res.status(200).json({ deleted_id: parsedId.data.id });

    } catch (error) {
        console.error("Error while deleting item:", error);
        res.status(500).json({ error: "An error occurred while deleting the item" });
    }
});

app.use('/', router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});