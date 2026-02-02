import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, scenes, users, projects, stories } from "@repo/database";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { breakdownIntoScenes, generateVisualPlan, checkConsistency } from "@repo/ai";

const scenesRouter = new Hono();

// TEMP SETUP ENDPOINT
scenesRouter.get("/setup-test-data", async (c) => {
    const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
    // Ensure User
    const [existingUser] = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
    if (!existingUser) {
        await db.insert(users).values({
            id: TEST_USER_ID,
            email: "test@example.com",
            name: "Test User",
            clerkId: TEST_USER_ID,
        });
    }
    // Create Project
    const [project] = await db.insert(projects).values({
        userId: TEST_USER_ID,
        title: "Test Movie Project",
        type: "movie",
        status: "draft",
    }).returning();
    // Create Story (Required for Foreign Key)
    await db.insert(stories).values({
        userId: TEST_USER_ID,
        projectId: project.id,
        title: "Test Story",
        content: "Draft content",
        status: "draft"
    });

    return c.json({
        message: "Test data created",
        projectId: project.id,
        cmd: `curl.exe -X POST http://localhost:3001/api/scenes/generate/${project.id} -H "Content-Type: application/json" -H "x-bypass-auth: true" -d "{\\\"storyContent\\\": \\\"A cyberpunk detective smoking in the rain.\\\"}"`
    });
});

scenesRouter.use("*", authMiddleware);

/**
 * POST /api/scenes/check-consistency
 * Check consistency of a list of scenes
 */
scenesRouter.post(
    "/check-consistency",
    zValidator("json", z.object({
        scenes: z.array(z.any()),
    })),
    async (c) => {
        const { scenes } = c.req.valid("json");
        try {
            const issues = await checkConsistency(scenes);
            return c.json({ issues });
        } catch (error) {
            console.error("[Consistency Check Error]", error);
            return c.json({ error: "Failed to check consistency" }, 500);
        }
    }
);

/**
 * POST /api/scenes/generate/:projectId
 * Generate scenes from story content
 */
scenesRouter.post(
    "/generate/:projectId",
    zValidator("json", z.object({
        storyContent: z.string().min(1),
        targetDuration: z.number().optional().default(60),
        sceneCount: z.number().optional(),
    })),
    async (c) => {
        const projectId = c.req.param("projectId");
        const { storyContent, targetDuration, sceneCount } = c.req.valid("json");

        try {
            // Generate scenes using AI
            const generatedScenes = await breakdownIntoScenes(storyContent, targetDuration, sceneCount);

            // Save scenes to database
            const savedScenes = [];
            for (let i = 0; i < generatedScenes.length; i++) {
                const scene = generatedScenes[i];
                const [saved] = await db.insert(scenes).values({
                    projectId,
                    storyId: projectId, // Using projectId as storyId for now
                    order: i + 1,
                    title: scene.title,
                    content: scene.content,
                    summary: scene.summary,
                    duration: scene.duration.toString(),
                    location: scene.location,
                    timeOfDay: scene.timeOfDay,
                    mood: scene.mood,
                    characters: scene.characters,
                    cameraMovement: scene.visualStyle?.cameraMovement,
                    cameraAngle: scene.visualStyle?.cameraAngle,
                    lighting: scene.visualStyle?.lighting,
                    colorPalette: scene.visualStyle?.colorPalette,
                    transitionOut: scene.transition?.type,
                }).returning();
                savedScenes.push(saved);
            }

            return c.json({ message: "Scenes generated", scenes: savedScenes });
        } catch (error) {
            console.error("[Scene Generation Error]", error);
            return c.json({ error: "Failed to generate scenes" }, 500);
        }
    }
);

/**
 * GET /api/scenes/projects/:projectId
 * List all scenes for a project
 */
scenesRouter.get("/projects/:projectId", async (c) => {
    const projectId = c.req.param("projectId");

    try {
        const projectScenes = await db
            .select()
            .from(scenes)
            .where(eq(scenes.projectId, projectId))
            .orderBy(scenes.order);

        return c.json({ scenes: projectScenes });
    } catch (error) {
        console.error("[Get Scenes Error]", error);
        return c.json({ error: "Failed to fetch scenes" }, 500);
    }
});

/**
 * PATCH /api/scenes/:id
 * Update a scene
 */
scenesRouter.patch(
    "/:id",
    zValidator("json", z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        duration: z.string().optional(),
        location: z.string().optional(),
        mood: z.string().optional(),
        cameraMovement: z.string().optional(),
        cameraAngle: z.string().optional(),
        lighting: z.string().optional(),
        colorPalette: z.array(z.string()).optional(),
        transitionIn: z.string().optional(),
        transitionOut: z.string().optional(),
    })),
    async (c) => {
        const id = c.req.param("id");
        const updates = c.req.valid("json");

        try {
            await db.update(scenes).set({ ...updates, updatedAt: new Date() }).where(eq(scenes.id, id));
            return c.json({ message: "Scene updated" });
        } catch (error) {
            console.error("[Update Scene Error]", error);
            return c.json({ error: "Failed to update scene" }, 500);
        }
    }
);

/**
 * POST /api/scenes/reorder
 * Reorder scenes
 */
scenesRouter.post(
    "/reorder",
    zValidator("json", z.object({
        sceneOrders: z.array(z.object({
            id: z.string(),
            order: z.number(),
        })),
    })),
    async (c) => {
        const { sceneOrders } = c.req.valid("json");

        try {
            for (const { id, order } of sceneOrders) {
                await db.update(scenes).set({ order }).where(eq(scenes.id, id));
            }
            return c.json({ message: "Scenes reordered" });
        } catch (error) {
            console.error("[Reorder Scenes Error]", error);
            return c.json({ error: "Failed to reorder scenes" }, 500);
        }
    }
);

/**
 * POST /api/scenes/:id/split
 * Split a scene into two
 */
scenesRouter.post(
    "/:id/split",
    zValidator("json", z.object({
        splitPoint: z.number().min(0).max(1), // 0-1 proportion
    })),
    async (c) => {
        const id = c.req.param("id");
        const { splitPoint } = c.req.valid("json");

        try {
            const [scene] = await db.select().from(scenes).where(eq(scenes.id, id));
            if (!scene) return c.json({ error: "Scene not found" }, 404);

            const content = scene.content;
            const splitIndex = Math.floor(content.length * splitPoint);

            // Update original scene with first half
            await db.update(scenes).set({
                content: content.slice(0, splitIndex),
                duration: (parseFloat(scene.duration) * splitPoint).toFixed(2),
            }).where(eq(scenes.id, id));

            // Create new scene with second half
            const [newScene] = await db.insert(scenes).values({
                projectId: scene.projectId,
                storyId: scene.storyId,
                order: scene.order + 1,
                title: `${scene.title} (Part 2)`,
                content: content.slice(splitIndex),
                duration: (parseFloat(scene.duration) * (1 - splitPoint)).toFixed(2),
                location: scene.location,
                mood: scene.mood,
            }).returning();

            // Shift other scenes
            await db.execute(
                `UPDATE scenes SET "order" = "order" + 1 WHERE "order" > ${scene.order} AND id != '${newScene.id}'`
            );

            return c.json({ message: "Scene split", newScene });
        } catch (error) {
            console.error("[Split Scene Error]", error);
            return c.json({ error: "Failed to split scene" }, 500);
        }
    }
);

/**
 * POST /api/scenes/:id/visual-plan
 * Generate visual plan for a scene
 */
scenesRouter.post("/:id/visual-plan", async (c) => {
    const id = c.req.param("id");

    try {
        const [scene] = await db.select().from(scenes).where(eq(scenes.id, id));
        if (!scene) return c.json({ error: "Scene not found" }, 404);

        const visualPlan = await generateVisualPlan({
            content: scene.content,
            location: scene.location || undefined,
            timeOfDay: scene.timeOfDay || undefined,
            mood: scene.mood || undefined,
            characters: scene.characters as string[] || [],
        });

        // Save visual plan to scene
        await db.update(scenes).set({
            cameraMovement: visualPlan.cameraMovement,
            cameraAngle: visualPlan.cameraAngle,
            lighting: visualPlan.lighting,
            colorPalette: visualPlan.colorPalette,
            transitionIn: visualPlan.transitionIn,
            transitionOut: visualPlan.transitionOut,
        }).where(eq(scenes.id, id));

        return c.json({ message: "Visual plan generated", visualPlan });
    } catch (error) {
        console.error("[Visual Plan Error]", error);
        return c.json({ error: "Failed to generate visual plan" }, 500);
    }
});

/**
 * DELETE /api/scenes/:id
 * Delete a scene
 */
scenesRouter.delete("/:id", async (c) => {
    const id = c.req.param("id");

    try {
        await db.delete(scenes).where(eq(scenes.id, id));
        return c.json({ message: "Scene deleted" });
    } catch (error) {
        console.error("[Delete Scene Error]", error);
        return c.json({ error: "Failed to delete scene" }, 500);
    }
});

export default scenesRouter;
