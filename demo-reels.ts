import { videoAssembler, ffmpegClient } from "./packages/video/src/index.ts";
import { createStorageClient } from "./packages/storage/src/index.ts";
import path from "path";
import os from "os";
import fs from "fs-extra";

async function runReelsDemo() {
    console.log("🎬 STARTING VERTICAL REELS DEMO 🎬");
    console.log("===================================");

    const workDir = path.join(os.tmpdir(), "demo-reels-" + Date.now());
    await fs.ensureDir(workDir);
    console.log(`📂 Work Dir: ${workDir}`);

    try {
        // 1. Create Vertical Clips (9:16 - 720x1280)
        console.log("\n1. 📱 Creating Vertical Clips (720x1280)...");

        const clip1Path = path.join(workDir, "clip_intro.mp4");
        const clip2Path = path.join(workDir, "clip_action.mp4");
        const clip3Path = path.join(workDir, "clip_outro.mp4");

        // Intro: Blue, 2 seconds
        await ffmpegClient.createBlankVideo(clip1Path, 2, "blue", 720, 1280);
        console.log(`   - Created Intro Clip (2s)`);

        // Action: Red, 4 seconds
        await ffmpegClient.createBlankVideo(clip2Path, 4, "red", 720, 1280);
        console.log(`   - Created Action Clip (4s)`);

        // Outro: Green, 2 seconds
        await ffmpegClient.createBlankVideo(clip3Path, 2, "green", 720, 1280);
        console.log(`   - Created Outro Clip (2s)`);

        // 2. Assemble Reel
        console.log("\n2. 🔗 Assembling Reel...");

        const outputPath = path.join(workDir, "final_reel.mp4");

        await videoAssembler.concat({
            clips: [
                { path: clip1Path, duration: 2 },
                { path: clip2Path, duration: 4 },
                { path: clip3Path, duration: 2 }
            ],
            outputPath: outputPath,
            resolution: { width: 720, height: 1280 }
        });

        console.log("\n3. ✅ Reel Generated Successfuly!");
        const stats = await fs.stat(outputPath);
        console.log(`   - Output: ${outputPath}`);
        console.log(`   - Size: ${stats.size} bytes`);
        console.log(`   - Resolution: 720x1280 (Vertical 9:16)`);
        console.log(`   - Duration: 8 seconds`);

        // 3. Upload to MinIO
        console.log("\n4. ☁️  Uploading to MinIO...");
        const storage = createStorageClient();
        await storage.ensureBucket();

        const fileBuffer = await fs.readFile(outputPath);
        const fileName = `final_reel_${Date.now()}.mp4`;

        const result = await storage.uploadBuffer(fileBuffer, fileName, "demos/reels");

        console.log(`   - ✅ Upload Complete!`);
        console.log(`   - URL: ${result.url}`);
        console.log(`   - Key: ${result.key}`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        // cleanup
        // await fs.remove(workDir);
    }
}

runReelsDemo();
