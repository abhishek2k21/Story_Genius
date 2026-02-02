import { db, users, projects, stories } from "@repo/database";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Setting up test data...");

    const TEST_USER_ID = "test-user-id"; // Matches auth bypass

    // 1. Ensure User Exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
    if (!existingUser) {
        console.log("Creating test user...");
        await db.insert(users).values({
            id: TEST_USER_ID,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            clerkId: TEST_USER_ID,
            imageUrl: "https://example.com/avatar.png"
        });
    }

    // 2. Create Project
    console.log("Creating test project...");
    const [project] = await db.insert(projects).values({
        userId: TEST_USER_ID,
        title: "Test Movie Project",
        type: "movie",
        status: "draft",
        visibility: "private"
    }).returning();

    // 3. Create Story (if necessary for FK, though often logic links them)
    // Checking if stories table is required. scenes.ts references stories.id.
    // So we MUST create a story.
    console.log("Creating test story...");
    const [story] = await db.insert(stories).values({
        userId: TEST_USER_ID,
        projectId: project.id,
        title: "Test Story",
        content: "A cyberpunk detective smoking in the rain.",
        status: "draft"
    }).returning();

    console.log("\n✅ Test Data Created!");
    console.log(`User ID: ${TEST_USER_ID}`);
    console.log(`Project ID: ${project.id}`);
    console.log(`Story ID: ${story.id}`);
    const cmd = `curl.exe -X POST http://localhost:3001/api/scenes/generate/${project.id} -H "Content-Type: application/json" -H "x-bypass-auth: true" -d "{\\\"storyContent\\\": \\\"A cyberpunk detective smoking in the rain.\\\"}"`;

    console.log("\n👇 USE THIS COMMAND 👇");
    console.log(cmd);

    // Write to file for verification tool to read
    const fs = await import("fs");
    fs.writeFileSync("test_curl_command.txt", cmd);
}

main().catch(console.error).then(() => process.exit(0));
