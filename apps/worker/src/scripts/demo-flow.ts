
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env before imports that might use it
config({ path: join(__dirname, "../../../../.env") });

import { db } from "@repo/database";
import { projects, stories, scenes, generations, users } from "@repo/database";
import { createStorageClient } from "@repo/storage";
import { QueueManager, QUEUE_NAMES, VideoAssemblyPayload, getQueueManager } from "@repo/queue";
import { audioGenerator } from "@repo/ai";
import { ffmpegClient } from "@repo/video";
import { eq } from "drizzle-orm";
import fs from "fs-extra";
import path from "path";
import os from "os";

const storage = createStorageClient();
const queueManager = getQueueManager();

async function runDemo() {
    console.log("🎬 STARTING DEMO: End-to-End Video Production Pipeline 🎬");
    console.log("==========================================================");

    // 1. Setup User & Project
    console.log("\n1. 👤 Setting up User & Project...");

    // Find or create a demo user
    let userId = "demo-user-id";
    const existingUser = await db.query.users.findFirst();
    if (existingUser) {
        userId = existingUser.id;
        console.log(`   - Using existing user: ${userId}`);
    } else {
        // Mock user creation if needed (skipping for now, assuming auth bypass or using explicit ID)
        console.log(`   - Using mock user ID: ${userId}`);
    }

    const projectId = crypto.randomUUID();
    const storyId = crypto.randomUUID();
    const sceneId = crypto.randomUUID();

    // Create Project
    await db.insert(projects).values({
        id: projectId,
        userId,
        title: "Demo Movie " + new Date().toISOString(),
        description: "Automated demo generated movie",
    });
    console.log(`   - ✅ Project Created: ${projectId}`);

    // Create Story
    await db.insert(stories).values({
        id: storyId,
        projectId,
        title: "The Lonely Robot",
        content: "A robot sits on a park bench, watching the sunset. It feels lonely but hopeful.",
    });
    console.log(`   - ✅ Story Created: ${storyId}`);

    // Create Scene
    await db.insert(scenes).values({
        id: sceneId,
        projectId,
        storyId,
        order: 1,
        content: "A robot sits on a park bench.",
        visualDescription: "Wide shot of a rusty robot sitting on a bench in a futuristic park, sunset lighting.",
        narration: "Even metal hearts can feel the weight of silence.",
        duration: 5,
    });
    console.log(`   - ✅ Scene Created: ${sceneId}`);

    // 2. Generate Assets
    console.log("\n2. 🎨 Generating Assets...");

    // A. Audio (Mocked for Demo)
    console.log("   - 🎙️  Generating Narration (Mocking)...");
    const audioBuffer = Buffer.from("mock-audio-data");
    // const audioBuffer = await audioGenerator.generateNarration({
    //     text: "Even metal hearts can feel the weight of silence.",
    //     provider: "google",
    //     options: { gender: "MALE" }
    // });
    const audioKey = `projects/${projectId}/scenes/${sceneId}/audio/narration.mp3`;
    await storage.uploadBuffer(audioBuffer, "narration.mp3", `projects/${projectId}/scenes/${sceneId}/audio`);
    console.log(`   - ✅ Audio Uploaded: ${audioKey}`);

    // B. Video (Simulated Realism via FFmpeg)
    console.log("   - 🎥 Generating Video Clip (Simulating AI generation)...");
    const tempVideoPath = path.join(os.tmpdir(), `demo-video-${sceneId}.mp4`);

    // Create a 5s blue video with text (using color filter for simplicity)
    await ffmpegClient.createBlankVideo(tempVideoPath, 5, "blue");

    const videoBuffer = await fs.readFile(tempVideoPath);
    const videoKey = `projects/${projectId}/scenes/${sceneId}/videos/final-demo-${sceneId}.mp4`;
    await storage.uploadBuffer(videoBuffer, "final.mp4", `projects/${projectId}/scenes/${sceneId}/videos`);

    // Clean up temp
    await fs.remove(tempVideoPath);
    console.log(`   - ✅ Video Uploaded: ${videoKey}`);

    // 3. Trigger Assembly (Real Worker)
    console.log("\n3. ⚙️  Triggering Assembly Job...");

    const payload: VideoAssemblyPayload = {
        projectId,
        sceneIds: [sceneId], // Just one scene for demo
        output: { resolution: "720p", format: "mp4" },
        transitions: [],
        audio: {
            narrationKey: audioKey,
            musicVolume: 0.0, // No music for speed
        },
        metadata: { userId }
    };

    const job = await queueManager.addVideoAssemblyJob(payload);
    console.log(`   - 🚀 Job Submitted! ID: ${job.id}`);

    // 4. Poll for Completion
    console.log("\n4. ⏳ Waiting for Worker...");

    // We need to wait for the worker to pick it up. 
    // Since we are running this script standalone, WE need to start a worker or assume one is running.
    // The user's metadata shows no 'pnpm --filter worker dev' running.
    // So we will process it RIGHT HERE in the script or start a worker.

    // To make this self-contained, let's process it using the worker function directly
    // mimicking what the worker does, to verify logic without needing Redis/BullMQ worker process active.

    console.log("   - (Simulating Worker Execution locally for demo)...");

    // Mock Job object
    const mockJob = {
        id: job.id,
        data: payload,
        updateProgress: async (p: any) => console.log(`     [Progress] ${p.stage}: ${p.percent}% - ${p.message}`),
        log: (msg: string) => console.log(`     [Log] ${msg}`),
    } as any;

    // Importing the processor dynamically to avoid top-level side effects if any
    const { processVideoAssembly } = await import("../jobs/video-assembly");

    const result = await processVideoAssembly(mockJob);

    console.log("\n5. 🎉 Demo Result:");
    if (result.success) {
        console.log("   ✅ SUCCESS!");
        console.log("   📂 Output URL:", result.outputUrl);
        console.log("   🔑 MinIO Key:", result.outputKey);
        console.log("   ⏱️  Duration:", result.duration);
    } else {
        console.error("   ❌ FAILED:", result.error);
    }

    console.log("\n==========================================================");
    process.exit(0);
}

runDemo().catch(err => {
    console.error("CRITICAL ERROR:", err);
    process.exit(1);
});
