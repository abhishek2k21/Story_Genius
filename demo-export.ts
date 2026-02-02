
import { db } from "./packages/database/src/client";
import { projects } from "./packages/database/src/schema/projects";
import { scenes } from "./packages/database/src/schema/scenes";
import { users } from "./packages/database/src/schema/users";
import { stories } from "./packages/database/src/schema/stories"; // Moved to top
import { eq } from "drizzle-orm";
import { processExportVideo } from "./apps/worker/src/jobs/export-video";
import { createStorageClient } from "./packages/storage/src/index";
import { ffmpegClient } from "./packages/video/src/index";
import path from "path";
import os from "os";
import fs from "fs-extra";
import { randomUUID } from "crypto";

const storage = createStorageClient();

async function runExportDemo() {
    console.log("🚀 STARTING EXPORT DEMO 🚀");

    try {
        // 1. Setup Data
        // Use a valid UUID for checking/creating user
        const demoUserId = "550e8400-e29b-41d4-a716-446655440000";

        const [existingUser] = await db.select().from(users).where(eq(users.id, demoUserId));
        if (!existingUser) {
            console.log("Creating new demo user...");
            await db.insert(users).values({
                id: demoUserId,
                email: "demo-export@test.com",
                name: "Demo Export User",
                clerkId: "test_clerk_user_v1"
            }).returning();
        }

        // Create Project
        const [project] = await db.insert(projects).values({
            userId: demoUserId,
            title: "Export Demo Project",
            settings: { musicVolume: 0.1, narrationVolume: 1.0 }
        }).returning();
        console.log(`✅ Created Project: ${project.id}`);

        // Create Story
        const [story] = await db.insert(stories).values({
            projectId: project.id,
            userId: demoUserId,
            title: "Export Demo Story" // Added title if required, but schema might handle it
        }).returning();
        console.log(`✅ Created Story: ${story.id}`);

        // Create Scene
        const [scene] = await db.insert(scenes).values({
            projectId: project.id,
            storyId: story.id,
            order: 1,
            content: "Demo Scene",
            duration: "5.0",
            audioSettings: { mute: false }
        }).returning();
        console.log(`✅ Created Scene: ${scene.id}`);

        // 2. Upload Mock Video for Scene
        const tempDir = path.join(os.tmpdir(), "demo-export-setup");
        await fs.ensureDir(tempDir);
        const tempVideoPath = path.join(tempDir, "source_clip.mp4");

        // Create 5s blue video (Horizontal source)
        await ffmpegClient.createBlankVideo(tempVideoPath, 5, "blue", 1920, 1080);

        const fileBuffer = await fs.readFile(tempVideoPath);
        // Path expected by video-assembly: projects/{projectId}/scenes/{sceneId}/videos/final-{id}.mp4
        // We make up an ID
        const key = `projects/${project.id}/scenes/${scene.id}/videos/final-mock.mp4`;
        await storage.uploadBuffer(fileBuffer, "final-mock.mp4", `projects/${project.id}/scenes/${scene.id}/videos`);
        console.log(`✅ Uploaded Source Video to MinIO: ${key}`);

        // VERIFY LISTING
        const checkFiles = await storage.listFiles(`projects/${project.id}/scenes/${scene.id}/videos/`);
        console.log("📂 Storage List Files Result:", JSON.stringify(checkFiles, null, 2));

        // 3. Run Export Job (Target: TikTok 9:16)
        console.log("\n🎬 Running Export Job (Target: TikTok 9:16)...");

        const mockJob = {
            id: `job-export-${Date.now()}`,
            data: {
                projectId: project.id,
                params: {
                    resolution: "9:16", // Should trigger resize/crop logic in assembler (or padding)
                    format: "mp4",
                    preset: "tiktok"
                }
            },
            updateProgress: async (p: any) => console.log(`   [Progress] ${p.stage}: ${p.percent}% - ${p.message}`)
        } as any;

        const result = await processExportVideo(mockJob);

        console.log("\n🎉 Export Result:", result);

        if (result.success) {
            console.log(`   - Output URL: ${result.outputUrl}`);
            console.log(`   - Output Key: ${result.outputKey}`);
        } else {
            console.error("   - Export Failed:", result.error);
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error);
    } finally {
        // Cleanup (optional)
        process.exit(0);
    }
}

runExportDemo();
