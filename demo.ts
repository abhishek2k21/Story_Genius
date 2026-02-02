
import { config } from "dotenv";
import { join } from "path";
// Load env before imports that might use it
config();

import { db } from "./packages/database/src/index.ts";
import { projects, stories, scenes } from "./packages/database/src/index.ts";
import { createStorageClient } from "./packages/storage/src/index.ts";
import { QueueManager, QUEUE_NAMES, VideoAssemblyPayload, getQueueManager } from "./packages/queue/src/index.ts";
// ... imports ...
import { audioGenerator } from "./packages/ai/src/index.ts";
import { ffmpegClient } from "./packages/video/src/index.ts";
import fs from "fs-extra";
import path from "path";
import os from "os";
import crypto from "crypto";

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

    // Create a 5s blue video with text
    await ffmpegClient.createBlankVideo(tempVideoPath, 5, "blue");

    const videoBuffer = await fs.readFile(tempVideoPath);
    const videoKey = `projects/${projectId}/scenes/${sceneId}/videos/final-demo-${sceneId}.mp4`;
    await storage.uploadBuffer(videoBuffer, "final.mp4", `projects/${projectId}/scenes/${sceneId}/videos`);

    // Clean up temp
    await fs.remove(tempVideoPath);
    console.log(`   - ✅ Video Uploaded: ${videoKey}`);

    // 3. Trigger Assembly (Real Worker Logic executed locally)
    console.log("\n3. ⚙️  Triggering Assembly Job...");

    const payload: VideoAssemblyPayload = {
        projectId,
        sceneIds: [sceneId],
        output: { resolution: "720p", format: "mp4" },
        transitions: [],
        audio: {
            narrationKey: audioKey,
            musicVolume: 0.0,
        },
        metadata: { userId }
    };

    console.log("   - (Simulating Worker Execution locally)...");

    // We import worker job logic here. 
    // Since we are in root, path is ./apps/worker/src/jobs/video-assembly.ts
    const { processVideoAssembly } = await import("./apps/worker/src/jobs/video-assembly.ts");

    // Mock Job
    const mockJob = {
        id: "demo-job-" + Date.now(),
        data: payload,
        updateProgress: async (p: any) => console.log(`     [Progress] ${p.stage}: ${p.percent}% - ${p.message}`),
        log: (msg: string) => console.log(`     [Log] ${msg}`),
    } as any;

    const result = await processVideoAssembly(mockJob);

    console.log("\n5. 🎉 Demo Result:");
    if (result.success) {
        console.log("   ✅ SUCCESS!");
        console.log("   📂 Output URL:", result.outputUrl);
        console.log("   keys. Output Key:", result.outputKey);
        console.log("   Duration:", result.duration);
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
