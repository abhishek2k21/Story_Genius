
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@repo/database/src/client";
import { scenes } from "@repo/database/src/schema/scenes";
import { eq } from "drizzle-orm";
import { getQueueManager } from "@repo/queue/src/index";

const sceneEditorRouter = new Hono();

// Schema for updating scene
const updateSceneSchema = z.object({
    content: z.string().optional(),
    duration: z.number().optional(),
    audioSettings: z.object({
        musicVolume: z.number().min(0).max(1).optional(),
        narrationVolume: z.number().min(0).max(1).optional(),
        mute: z.boolean().optional(),
    }).optional(),
    subtitleText: z.string().optional(),
    cameraMovement: z.string().optional(),
    lighting: z.string().optional(),
});

// UPDATE SCENE
sceneEditorRouter.patch("/:projectId/scenes/:sceneId", async (c) => {
    const projectId = c.req.param("projectId");
    const sceneId = c.req.param("sceneId");

    try {
        const body = await c.req.json();
        const validatedBody = updateSceneSchema.parse(body);

        // Verify ownership (TODO: better middleware)
        // For now, assuming auth passed

        const updateData: any = {};
        if (validatedBody.content) updateData.content = validatedBody.content;
        if (validatedBody.duration) updateData.duration = validatedBody.duration.toString();
        if (validatedBody.audioSettings) updateData.audioSettings = validatedBody.audioSettings;
        if (validatedBody.subtitleText) updateData.subtitleText = validatedBody.subtitleText;
        if (validatedBody.cameraMovement) updateData.cameraMovement = validatedBody.cameraMovement;
        if (validatedBody.lighting) updateData.lighting = validatedBody.lighting;

        updateData.updatedAt = new Date();

        const [updatedScene] = await db
            .update(scenes)
            .set(updateData)
            .where(eq(scenes.id, sceneId))
            .returning();

        return c.json(updatedScene);
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return c.json({ error: "Validation failed", details: error.errors }, 400);
        }
        return c.json({ error: "Failed to update scene" }, 500);
    }
});

// REGENERATE SCENE
sceneEditorRouter.post("/:projectId/scenes/:sceneId/regenerate", async (c) => {
    const projectId = c.req.param("projectId");
    const sceneId = c.req.param("sceneId");

    try {
        const queue = getQueueManager();
        const body = await c.req.json();

        // Add regeneration job to queue
        const job = await queue.addJob("video-generation", {
            type: "scene-regenerate",
            projectId,
            sceneId,
            params: body || {}
        });

        return c.json({
            message: "Scene regeneration started",
            jobId: job.id
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to trigger regeneration" }, 500);
    }
});

// REORDER SCENES
sceneEditorRouter.post("/:projectId/scenes/reorder", async (c) => {
    const projectId = c.req.param("projectId");

    try {
        const body = await c.req.json();
        const { sceneIds } = body as { sceneIds: string[] };

        if (!sceneIds || !Array.isArray(sceneIds)) {
            return c.json({ error: "Invalid sceneIds provided" }, 400);
        }

        // Transaction to update order
        await db.transaction(async (tx) => {
            for (let i = 0; i < sceneIds.length; i++) {
                await tx
                    .update(scenes)
                    .set({ order: i + 1 })
                    .where(eq(scenes.id, sceneIds[i]));
            }
        });

        return c.json({ message: "Scenes reordered successfully" });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to reorder scenes" }, 500);
    }
});

export { sceneEditorRouter };
