
import { videoAssembler, ffmpegClient } from "./packages/video/src/index.ts";
import path from "path";
import os from "os";
import fs from "fs-extra";

async function runSimpleDemo() {
    console.log("🎬 STARTING VIDEO ASSEMBLY DEMO 🎬");
    console.log("==================================");

    const workDir = path.join(os.tmpdir(), "demo-simple-" + Date.now());
    await fs.ensureDir(workDir);
    console.log(`📂 Work Dir: ${workDir}`);

    try {
        // 1. Create Mock Clips
        console.log("\n1. 🎥 Creating Mock Clips...");

        const clip1Path = path.join(workDir, "clip1.mp4");
        const clip2Path = path.join(workDir, "clip2.mp4");

        await ffmpegClient.createBlankVideo(clip1Path, 3, "blue");
        console.log(`   - Created Clip 1 (Blue, 3s)`);

        await ffmpegClient.createBlankVideo(clip2Path, 3, "red");
        console.log(`   - Created Clip 2 (Red, 3s)`);

        // 2. Assemble (Concatenation)
        console.log("\n2. 🔗 Assembling (Simple Concatenation)...");

        const outputPath = path.join(workDir, "final_output.mp4");

        await videoAssembler.concat({
            clips: [
                { path: clip1Path, duration: 3 },
                { path: clip2Path, duration: 3 }
            ],
            outputPath: outputPath,
            resolution: { width: 640, height: 360 }
        });

        console.log("\n3. ✅ Assembly Complete!");
        const stats = await fs.stat(outputPath);
        console.log(`   - Output: ${outputPath}`);
        console.log(`   - Size: ${stats.size} bytes`);
        console.log(`   - Success! Core Assembly Engine is WORKING.`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        // cleanup
        // await fs.remove(workDir);
    }
}

runSimpleDemo();
