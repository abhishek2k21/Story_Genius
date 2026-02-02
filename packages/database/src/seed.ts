import { db } from "./client";
import { users, projects, stories, scenes } from "./schema";

async function seed() {
    console.log("🌱 Starting database seed...");

    try {
        // Create test user
        const [testUser] = await db.insert(users).values({
            clerkId: "user_test_123",
            email: "test@storygenius.dev",
            name: "Test User",
            planTier: "creator",
            creditsRemaining: 500,
        }).onConflictDoNothing().returning();

        if (!testUser) {
            console.log("📝 Test user already exists, skipping...");
            const existingUser = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, "test@storygenius.dev"),
            });
            if (!existingUser) {
                throw new Error("Failed to find or create test user");
            }
            console.log("✅ Using existing user:", existingUser.email);
            process.exit(0);
        }

        console.log("✅ Created test user:", testUser.email);

        // Create sample project
        const [sampleProject] = await db.insert(projects).values({
            userId: testUser.id,
            title: "The Dragon's Quest",
            description: "An epic fantasy adventure about a young hero's journey to defeat an ancient dragon.",
            settings: {
                genre: "fantasy",
                tone: "epic",
                targetDuration: 180,
            },
        }).returning();

        console.log("✅ Created sample project:", sampleProject.title);

        // Create sample story
        const [sampleStory] = await db.insert(stories).values({
            projectId: sampleProject.id,
            title: "Chapter 1: The Call to Adventure",
            content: `The village of Thornwood had known peace for three hundred years. But tonight, as storm clouds gathered over the Dragonspine Mountains, that peace was about to end.

Elara stood at the edge of the forest, her grandmother's amulet clutched tightly in her hand. The ancient silver glowed faintly in the darkness, responding to something she couldn't see.

"You feel it too, don't you?" whispered Kael, her childhood friend who had insisted on coming along. "Something's wrong."

Before she could answer, the sky split open with a roar that shook the very ground beneath their feet. And in the flash of lightning, they saw it—a dragon, ancient and terrible, its scales black as midnight, rising from the peaks.

The prophecy her grandmother had spoken of was coming true. And Elara was the only one who could stop it.`,
            wordCount: 145,
            analysis: {
                genre: "fantasy",
                tone: "dramatic",
                pacing: "moderate",
                characters: ["Elara", "Kael"],
                locations: ["Thornwood village", "Dragonspine Mountains"],
            },
        }).returning();

        console.log("✅ Created sample story:", sampleStory.title);

        // Create sample scenes
        const sampleScenes = await db.insert(scenes).values([
            {
                storyId: sampleStory.id,
                order: 1,
                title: "The Village at Dusk",
                content: "Storm clouds gather over the peaceful village of Thornwood as night falls.",
                duration: "8.00",
                location: "Thornwood village",
                timeOfDay: "dusk",
                mood: "ominous",
                characters: ["villagers"],
                visualPlan: {
                    cameraMovement: "slow aerial pan",
                    lighting: "golden hour fading to stormy",
                    colorPalette: ["orange", "purple", "grey"],
                },
            },
            {
                storyId: sampleStory.id,
                order: 2,
                title: "Elara at the Forest Edge",
                content: "Elara stands at the forest edge, her grandmother's amulet glowing faintly.",
                duration: "6.00",
                location: "Forest edge",
                timeOfDay: "night",
                mood: "mysterious",
                characters: ["Elara"],
                visualPlan: {
                    cameraMovement: "close-up to medium shot",
                    lighting: "moonlit with magical glow",
                    colorPalette: ["blue", "silver", "dark green"],
                },
            },
            {
                storyId: sampleStory.id,
                order: 3,
                title: "The Dragon Awakens",
                content: "Lightning reveals the ancient dragon rising from the mountains.",
                duration: "10.00",
                location: "Dragonspine Mountains",
                timeOfDay: "night",
                mood: "terrifying",
                characters: ["Dragon"],
                visualPlan: {
                    cameraMovement: "dramatic zoom out reveal",
                    lighting: "lightning flashes, dark atmosphere",
                    colorPalette: ["black", "purple", "fire orange"],
                },
            },
        ]).returning();

        console.log("✅ Created", sampleScenes.length, "sample scenes");

        console.log("\n🎉 Database seeded successfully!");
        console.log("   User:", testUser.email);
        console.log("   Project:", sampleProject.title);
        console.log("   Story:", sampleStory.title);
        console.log("   Scenes:", sampleScenes.length);

    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
