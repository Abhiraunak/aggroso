import express , {Request, Response} from "express";
import { z } from "zod";

const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;

// zod schema for input validation
const idParamSchema = z.object ({
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

