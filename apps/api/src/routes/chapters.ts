import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, chapters } from "@repo/database";
import { eq, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const chaptersRouter = new Hono();

// Schema validations
const createChapterSchema = z.object({
    title: z.string().min(1).max(255).optional().default("Untitled Chapter"),
    content: z.string().optional().default(""),
    order: z.number().int().min(0).optional(),
});

const updateChapterSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().optional(),
    order: z.number().int().min(0).optional(),
    wordCount: z.number().int().min(0).optional(),
});

const reorderChaptersSchema = z.object({
    chapters: z.array(z.object({
        id: z.string().uuid(),
        order: z.number().int().min(0),
    })),
});

// Get all chapters for a project
chaptersRouter.get("/projects/:projectId/chapters", authMiddleware, async (c) => {
    const projectId = c.req.param("projectId");

    try {
        const projectChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.projectId, projectId))
            .orderBy(asc(chapters.order));

        return c.json({ chapters: projectChapters });
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return c.json({ error: "Failed to fetch chapters" }, 500);
    }
});

// Create a new chapter
chaptersRouter.post(
    "/projects/:projectId/chapters",
    authMiddleware,
    zValidator("json", createChapterSchema),
    async (c) => {
        const projectId = c.req.param("projectId");
        const data = c.req.valid("json");

        try {
            // Get the highest order number
            const existingChapters = await db
                .select({ order: chapters.order })
                .from(chapters)
                .where(eq(chapters.projectId, projectId))
                .orderBy(asc(chapters.order));

            const nextOrder = data.order ?? (existingChapters.length > 0
                ? Math.max(...existingChapters.map(c => c.order)) + 1
                : 0);

            const [newChapter] = await db
                .insert(chapters)
                .values({
                    projectId,
                    title: data.title,
                    content: data.content,
                    order: nextOrder,
                    wordCount: data.content?.split(/\s+/).filter(Boolean).length ?? 0,
                })
                .returning();

            return c.json({ chapter: newChapter }, 201);
        } catch (error) {
            console.error("Error creating chapter:", error);
            return c.json({ error: "Failed to create chapter" }, 500);
        }
    }
);

// Get a single chapter
chaptersRouter.get("/chapters/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");

    try {
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, id));

        if (!chapter) {
            return c.json({ error: "Chapter not found" }, 404);
        }

        return c.json({ chapter });
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return c.json({ error: "Failed to fetch chapter" }, 500);
    }
});

// Update a chapter
chaptersRouter.patch(
    "/chapters/:id",
    authMiddleware,
    zValidator("json", updateChapterSchema),
    async (c) => {
        const id = c.req.param("id");
        const data = c.req.valid("json");

        try {
            // Calculate word count if content is provided
            let wordCount = data.wordCount;
            if (data.content !== undefined && wordCount === undefined) {
                wordCount = data.content.split(/\s+/).filter(Boolean).length;
            }

            const [updatedChapter] = await db
                .update(chapters)
                .set({
                    ...data,
                    wordCount: wordCount ?? undefined,
                    updatedAt: new Date(),
                })
                .where(eq(chapters.id, id))
                .returning();

            if (!updatedChapter) {
                return c.json({ error: "Chapter not found" }, 404);
            }

            return c.json({ chapter: updatedChapter });
        } catch (error) {
            console.error("Error updating chapter:", error);
            return c.json({ error: "Failed to update chapter" }, 500);
        }
    }
);

// Delete a chapter
chaptersRouter.delete("/chapters/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");

    try {
        const [deletedChapter] = await db
            .delete(chapters)
            .where(eq(chapters.id, id))
            .returning();

        if (!deletedChapter) {
            return c.json({ error: "Chapter not found" }, 404);
        }

        return c.json({ success: true, deletedId: id });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        return c.json({ error: "Failed to delete chapter" }, 500);
    }
});

// Reorder chapters
chaptersRouter.post(
    "/chapters/reorder",
    authMiddleware,
    zValidator("json", reorderChaptersSchema),
    async (c) => {
        const { chapters: chapterUpdates } = c.req.valid("json");

        try {
            // Update each chapter's order in a transaction-like manner
            const updates = await Promise.all(
                chapterUpdates.map(({ id, order }) =>
                    db
                        .update(chapters)
                        .set({ order, updatedAt: new Date() })
                        .where(eq(chapters.id, id))
                        .returning()
                )
            );

            return c.json({ success: true, updated: updates.length });
        } catch (error) {
            console.error("Error reordering chapters:", error);
            return c.json({ error: "Failed to reorder chapters" }, 500);
        }
    }
);

export { chaptersRouter };
