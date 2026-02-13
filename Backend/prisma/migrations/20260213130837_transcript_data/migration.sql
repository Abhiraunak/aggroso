-- CreateTable
CREATE TABLE "transcripts" (
    "id" SERIAL NOT NULL,
    "rawText" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" SERIAL NOT NULL,
    "transcriptId" INTEGER NOT NULL,
    "taskDescription" TEXT NOT NULL,
    "owner" TEXT,
    "due_date" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
