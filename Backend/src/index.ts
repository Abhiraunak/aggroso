import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const app = express();
const router = express.Router();
app.use(express.json());
const port = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const prisma = new PrismaClient();

// zod schema for input validation
const idParamSchema = z.object({
    id: z.coerce.number().int().positive("Id must be positive")
});

const processTranscriptShema = z.object({
    transcript: z.string().min(10, "Please enter a valid transcript")
});

//user might be update just one thing so everthing shold be optional
const updateActionSchema = z.object({
    taskDescription: z.string().min(1, "Please add a valid details").optional(),
    ownwer: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    isDone: z.string().nullable().optional(),
    tags: z.array(z.string().optional())
}).strict();

//Basic type safety of ai extract text
interface AIActionItem {
    taskDescription: string;
    owner: string | null;
    dueDate: string | null;
}

// Route : for process the transcript

router.post('/api/processTranscript', async (req: Request, res: Response) => {
    try {
        // validate the request body
        const parsedBody = processTranscriptShema.safeParse(req.body);

        if (!parsedBody.success) {
            res.status(400).json({ error: "validation failed" });
            return;
        }

        const { transcript } = parsedBody.data;

        // --- AI Extraction ---
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

        // save the response in database
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
            include: {
                actionItems: true // Tell Prisma to return the newly created items
            }
        });

        res.status(200).json({
            message: 'Transcript processed successfully',
            transcript_id: newTranscript.id,
            data: newTranscript.actionItems
        })

    } catch (error) {
        console.error("Error while processing the transcript");
        res.status(500).json({ error: "An error occur while parsing the transcript" })
    }
})

// get the history of transcript
router.post('/api/history', async (req: Request, res: Response) => {
    try {
        const history = await prisma.transcript.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                rawText: true,
                createdAt: true,
                _count: {
                    select: { actionItems: true } // Gets the count of related items
                }
            }
        })

        // map over the result
        const formattedHistory = history.map(item => ({
            id: item.id,
            preview_text: item.rawText.substring(0, 100) + '...',
            created_at: item.createdAt,
            action_item_count: item._count.actionItems
        }));

        res.status(200).json({ data: formattedHistory });

    } catch (error) {
        console.error("Error while accesing the history", error);
        res.status(500).json({ error: "An error occur while accesing the history" })
    }

})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

