import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, analyses, storyCharacters, locations } from "@repo/database";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { analyzeStory, extractCharacters, analyzeCharacters, analyzeWorld } from "@repo/ai";

const analysisRouter = new Hono();

analysisRouter.use("*", authMiddleware);

/**
 * POST /api/analysis/projects/:projectId/analyze
 * Trigger full story analysis
 */
analysisRouter.post(
    "/projects/:projectId/analyze",
    async (c) => {
        const projectId = c.req.param("projectId");

        try {
            // TODO: Get story content from chapters
            // For now, using placeholder
            const storyContent = "Placeholder story content";

            // Run parallel analysis
            const [storyAnalysisResult, charactersResult, worldResult] = await Promise.all([
                analyzeStory(storyContent),
                analyzeCharacters(storyContent),
                analyzeWorld(storyContent),
            ]);

            // Save analysis to database
            const [analysis] = await db.insert(analyses).values({
                projectId,
                genre: storyAnalysisResult.genre,
                subGenre: storyAnalysisResult.subGenre,
                tone: storyAnalysisResult.tone,
                mood: storyAnalysisResult.mood,
                pacing: storyAnalysisResult.pacing,
                themes: storyAnalysisResult.themes,
                targetAudience: storyAnalysisResult.targetAudience,
                emotionalArc: storyAnalysisResult.emotionalArc as any,
                keyMoments: storyAnalysisResult.keyMoments as any,
            }).returning();

            // Save characters
            const characterPromises = charactersResult.map((char: any) =>
                db.insert(storyCharacters).values({
                    projectId,
                    analysisId: analysis.id,
                    name: char.name,
                    physicalDescription: char.physicalDescription,
                    personality: char.personality,
                    role: char.role,
                    emotionalState: char.emotionalState,
                    age: char.age,
                    clothing: char.clothing,
                    distinctiveFeatures: char.distinctiveFeatures,
                    relationships: char.relationships as any,
                    screenTimeEstimate: char.screenTimeEstimate,
                })
            );
            await Promise.all(characterPromises);

            // Save locations
            const locationPromises = worldResult.locations.map((loc: any) =>
                db.insert(locations).values({
                    projectId,
                    analysisId: analysis.id,
                    name: loc.name,
                    type: loc.type,
                    description: loc.description,
                    timePeriod: loc.timePeriod,
                    atmosphere: loc.atmosphere,
                    weather: loc.weather,
                    worldBuildingNotes: loc.worldBuildingNotes,
                })
            );
            await Promise.all(locationPromises);

            return c.json({
                message: "Analysis complete",
                analysisId: analysis.id
            });
        } catch (error) {
            console.error("[Analysis Error]", error);
            return c.json({ error: "Failed to analyze story" }, 500);
        }
    }
);

/**
 * GET /api/analysis/projects/:projectId
 * Get saved analysis for a project
 */
analysisRouter.get(
    "/projects/:projectId",
    async (c) => {
        const projectId = c.req.param("projectId");

        try {
            const [analysis] = await db.select().from(analyses).where(eq(analyses.projectId, projectId));

            if (!analysis) {
                return c.json({ error: "No analysis found" }, 404);
            }

            const characters = await db.select().from(storyCharacters).where(eq(storyCharacters.analysisId, analysis.id));
            const locs = await db.select().from(locations).where(eq(locations.analysisId, analysis.id));

            return c.json({
                analysis,
                characters,
                locations: locs,
            });
        } catch (error) {
            console.error("[Get Analysis Error]", error);
            return c.json({ error: "Failed to fetch analysis" }, 500);
        }
    }
);

/**
 * PATCH /api/analysis/:id
 * Update analysis (user corrections)
 */
analysisRouter.patch(
    "/:id",
    zValidator("json", z.object({
        genre: z.string().optional(),
        tone: z.string().optional(),
        mood: z.string().optional(),
        themes: z.array(z.string()).optional(),
    })),
    async (c) => {
        const id = c.req.param("id");
        const updates = c.req.valid("json");

        try {
            await db.update(analyses).set(updates).where(eq(analyses.id, id));
            return c.json({ message: "Analysis updated" });
        } catch (error) {
            console.error("[Update Analysis Error]", error);
            return c.json({ error: "Failed to update analysis" }, 500);
        }
    }
);

export default analysisRouter;
