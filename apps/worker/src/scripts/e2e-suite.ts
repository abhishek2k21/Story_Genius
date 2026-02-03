
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
config({ path: join(__dirname, "../../../../.env") });

import { createStorageClient } from "@repo/storage";
import { VideoAssemblyPayload } from "@repo/queue";
import { ffmpegClient } from "@repo/video";
import { db, projects, scenes, users, stories } from "@repo/database";
import fs from "fs-extra";
import path from "path";
import os from "os";

// Mock Process Function (Direct import to test logic without worker infra)
import { processVideoAssembly } from "../jobs/video-assembly";

const storage = createStorageClient();

/**
 * E2E Stress Test Suite
 */
async function runTestSuite() {
    console.log("🧪 STARTING E2E STRESS TEST SUITE 🧪");
    console.log("=======================================\n");

    const userId = crypto.randomUUID(); // Must be UUID
    const runId = crypto.randomUUID().slice(0, 8);

    // Create User First (Required for Foreign Key)
    await db.insert(users).values({
        id: userId,
        clerkId: `test-clerk-${runId}`,
        email: `test-${runId}@example.com`,
        name: "E2E Test User",
    }).onConflictDoNothing();

    // Setup: Create a Project
    const projectId = crypto.randomUUID(); // Must be UUID
    await db.insert(projects).values({
        id: projectId,
        userId,
        title: "E2E Stress Test Project",
        description: "Automated testing of edge cases",
    });
    console.log(`[Setup] Created Project: ${projectId}`);

    // Create Story (Required for Scenes)
    const storyId = crypto.randomUUID();
    await db.insert(stories).values({
        id: storyId,
        projectId,
        title: "Edge Case Story",
        content: "Testing edge cases",
    });

    // --- TEST CASE 1: Partial Failure (Missing Scene) ---
    console.log("\n🔹 CASE 1: Partial Asset Failure (3 Scenes, 1 Missing Video)");
    await runPartialFailureTest(projectId, storyId);

    // --- TEST CASE 2: No Assets (Total Failure) ---
    console.log("\n🔹 CASE 2: No Assets (Should Fail Gracefully)");
    await runNoAssetsTest(projectId, storyId);

    // --- TEST CASE 3: Corrupt Audio (Robustness) ---
    console.log("\n🔹 CASE 3: Corrupt Audio Asset");
    await runCorruptAudioTest(projectId, storyId);

    console.log("\n=======================================");
    console.log("✅ SUITE COMPLETE");
    process.exit(0);
}

// Helper: Mock Job
function createMockJob(data: any) {
    return {
        id: crypto.randomUUID(),
        data,
        updateProgress: async (p: any) => { }, // Silent progress
        log: (msg: string) => { },
    } as any;
}

// ---------------------------------------------------------

async function runPartialFailureTest(projectId: string, storyId: string) {
    // Create 3 Scenes
    const sceneIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

    for (let i = 0; i < 3; i++) {
        await db.insert(scenes).values({
            id: sceneIds[i],
            projectId,
            storyId, // Fix: Use passed storyId (which exists in DB)
            order: i + 1,
            content: `Scene ${i + 1}`,
            duration: 2, // Short for speed
        });
    }

    // Generate Assets ONLY for Scene 0 and 2. Skip 1.
    for (const idx of [0, 2]) {
        const sid = sceneIds[idx];
        const tempVid = path.join(os.tmpdir(), `test-vid-${sid}.mp4`);
        await ffmpegClient.createBlankVideo(tempVid, 2, "green"); // 2 seconds
        const buf = await fs.readFile(tempVid);
        await storage.uploadVideo(buf, projectId, sid, "final-test");
        await fs.remove(tempVid);
    }
    console.log("   - Uploaded assets for Scene 1 & 3. Scene 2 is missing.");

    // Run Assembly
    const payload: VideoAssemblyPayload = {
        projectId,
        sceneIds,
        output: { resolution: "720p", format: "mp4" },
        transitions: [],
        audio: { musicVolume: 0 },
        metadata: { userId: "test" }
    };

    const result = await processVideoAssembly(createMockJob(payload));

    if (result.success) {
        // We expect success, BUT with duration = 4s (2 scenes * 2s), skipping the missing one.
        // Actually, processVideoAssembly calculates duration from clips found.
        const expectedDuration = 4;
        const tolerance = 0.5;

        if (Math.abs(result.duration - expectedDuration) < tolerance) {
            console.log("   ✅ PASSED: Assembly succeeded, duration matched (4s) implies missing scene was skipped.");
        } else {
            console.error(`   ❌ FAILED: Duration mismatch. Expected ~4s, got ${result.duration}s`);
        }
    } else {
        console.error("   ❌ FAILED: Assembly crashed.", result.error);
    }
}

async function runNoAssetsTest(projectId: string, storyId: string) {
    const sceneId = crypto.randomUUID();
    await db.insert(scenes).values({
        id: sceneId,
        projectId,
        storyId,
        order: 10,
        content: "No Asset Scene",
        duration: 2,
    });

    const payload: VideoAssemblyPayload = {
        projectId,
        sceneIds: [sceneId],
        output: { resolution: "720p", format: "mp4" },
        transitions: [],
        audio: {},
        metadata: { userId: "test" }
    };

    const result = await processVideoAssembly(createMockJob(payload));

    if (!result.success && result.error?.includes("No valid clips")) {
        console.log("   ✅ PASSED: Failed gracefully with 'No valid clips'");
    } else {
        console.error("   ❌ FAILED: Did not fail as expected. Result:", result);
    }
}

async function runCorruptAudioTest(projectId: string, storyId: string) {
    const sceneId = crypto.randomUUID();
    await db.insert(scenes).values({
        id: sceneId,
        projectId,
        storyId,
        order: 20,
        content: "Corrupt Audio Scene",
        duration: 2,
    });

    // 1. Valid Video
    const tempVid = path.join(os.tmpdir(), `test-vid-${sceneId}.mp4`);
    await ffmpegClient.createBlankVideo(tempVid, 2, "red");
    const vBuf = await fs.readFile(tempVid);
    await storage.uploadVideo(vBuf, projectId, sceneId, "final-test");
    await fs.remove(tempVid);

    // 2. CORRUPT Audio (Text file text renamed as mp3)
    const corruptBuf = Buffer.from("This is not an audio file");
    const audioKey = `projects/${projectId}/scenes/${sceneId}/audio/corrupt.mp3`;
    await storage.uploadBuffer(corruptBuf, "corrupt.mp3", `projects/${projectId}/scenes/${sceneId}/audio`);

    const payload: VideoAssemblyPayload = {
        projectId,
        sceneIds: [sceneId],
        output: { resolution: "720p", format: "mp4" },
        transitions: [],
        audio: {
            narrationKey: audioKey // Point to corrupt file
        },
        metadata: { userId: "test" }
    };

    const result = await processVideoAssembly(createMockJob(payload));

    // FFmpeg should fail when mixing
    if (!result.success) {
        console.log("   ✅ PASSED: Assembly failed correctly due to invalid audio.");
    } else {
        console.error("   ❌ FAILED: Assembly succeeded despite corrupt audio? (FFmpeg might have ignored it)");
    }
}

runTestSuite().catch(err => {
    console.error("CRITICAL SUITE ERROR:", err);
    process.exit(1);
});
