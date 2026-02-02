import { db } from "../client";
import { templates } from "../schema/templates";

const genreTemplates = [
    {
        name: "Epic Fantasy Quest",
        genre: "fantasy",
        description: "A hero's journey through magical lands with mythical creatures and ancient prophecies.",
        structure: {
            acts: [
                { name: "The Call", description: "Hero discovers their destiny" },
                { name: "The Journey", description: "Trials and allies gathered" },
                { name: "The Confrontation", description: "Final battle against darkness" },
            ],
            suggestedChapters: ["The Ordinary World", "The Discovery", "Crossing the Threshold", "Tests and Allies", "The Dark Cave", "The Climax", "The Return"],
        },
        exampleContent: `<h1>Chapter 1: The Ordinary World</h1>
<p>The village of Thornwood lay nestled in the shadow of the Misty Mountains, where ancient magic still whispered through the trees...</p>`,
    },
    {
        name: "Space Opera",
        genre: "sci-fi",
        description: "An interstellar adventure across galaxies with advanced technology and alien civilizations.",
        structure: {
            acts: [
                { name: "Launch", description: "Discovery and departure from home" },
                { name: "Deep Space", description: "Adventures among the stars" },
                { name: "Destination", description: "Final revelation and resolution" },
            ],
            suggestedChapters: ["Home Station", "The Signal", "Jump Gate", "First Contact", "The Void", "Enemy Fleet", "New Horizons"],
        },
        exampleContent: `<h1>Chapter 1: Home Station</h1>
<p>The orbital habitat of Kepler-7 spun silently against the backdrop of a dying red giant, its inhabitants unaware of the signal that would change everything...</p>`,
    },
    {
        name: "Romantic Journey",
        genre: "romance",
        description: "A heartfelt story of love, connection, and the obstacles that test true feelings.",
        structure: {
            acts: [
                { name: "Meeting", description: "First encounter and attraction" },
                { name: "Tension", description: "Obstacles and misunderstandings" },
                { name: "Resolution", description: "Love conquers all" },
            ],
            suggestedChapters: ["The First Glance", "Unexpected Connection", "Rising Tension", "The Misunderstanding", "Apart", "The Grand Gesture", "Together"],
        },
        exampleContent: `<h1>Chapter 1: The First Glance</h1>
<p>The coffee shop was crowded that morning, but somehow, across the sea of faces, their eyes met...</p>`,
    },
    {
        name: "Supernatural Horror",
        genre: "horror",
        description: "A terrifying tale of dark forces, haunted places, and the fight for survival.",
        structure: {
            acts: [
                { name: "Normalcy", description: "Establishing the ordinary before terror" },
                { name: "Descent", description: "Growing horror and revelations" },
                { name: "Confrontation", description: "Face the darkness or die trying" },
            ],
            suggestedChapters: ["New Beginnings", "Strange Occurrences", "The Warning", "Nightmare", "The Truth", "No Escape", "Into the Dark"],
        },
        exampleContent: `<h1>Chapter 1: New Beginnings</h1>
<p>The house had been on the market for years. The price was too good to be true, and as Sarah would soon learn, there was a reason...</p>`,
    },
    {
        name: "Detective Mystery",
        genre: "mystery",
        description: "A gripping whodunit with clues, red herrings, and a shocking revelation.",
        structure: {
            acts: [
                { name: "The Crime", description: "Discovery and initial investigation" },
                { name: "The Hunt", description: "Following clues and suspects" },
                { name: "The Reveal", description: "Unmasking the culprit" },
            ],
            suggestedChapters: ["The Body", "First Clues", "Suspects", "Red Herring", "The Missing Piece", "Confrontation", "Justice"],
        },
        exampleContent: `<h1>Chapter 1: The Body</h1>
<p>Detective Morgan had seen many crime scenes in her twenty years on the force, but nothing quite like this...</p>`,
    },
    {
        name: "Psychological Thriller",
        genre: "thriller",
        description: "A mind-bending story of suspense, paranoia, and dark secrets.",
        structure: {
            acts: [
                { name: "Setup", description: "Establishing tension and stakes" },
                { name: "Escalation", description: "Rising danger and uncertainty" },
                { name: "Twist", description: "Nothing is what it seems" },
            ],
            suggestedChapters: ["Normal Life", "First Sign", "Doubt", "Paranoia", "The Chase", "Revelation", "Aftermath"],
        },
        exampleContent: `<h1>Chapter 1: Normal Life</h1>
<p>Everything was perfect. Too perfect. And that should have been the first warning...</p>`,
    },
    {
        name: "Family Drama",
        genre: "drama",
        description: "An emotional exploration of family dynamics, secrets, and reconciliation.",
        structure: {
            acts: [
                { name: "Reunion", description: "Gathering and old wounds" },
                { name: "Conflict", description: "Secrets revealed and confrontations" },
                { name: "Healing", description: "Understanding and moving forward" },
            ],
            suggestedChapters: ["Coming Home", "Old Wounds", "The Secret", "Breaking Point", "Aftermath", "Understanding", "New Beginning"],
        },
        exampleContent: `<h1>Chapter 1: Coming Home</h1>
<p>Twenty years. It had been twenty years since she last walked through that front door...</p>`,
    },
    {
        name: "Comedic Adventure",
        genre: "comedy",
        description: "A laugh-out-loud journey filled with mishaps, witty dialogue, and heartwarming moments.",
        structure: {
            acts: [
                { name: "Setup", description: "Introducing the chaos" },
                { name: "Escalation", description: "Everything goes wrong" },
                { name: "Resolution", description: "Unlikely happy ending" },
            ],
            suggestedChapters: ["The Plan", "First Disaster", "Making It Worse", "Rock Bottom", "The Idea", "Chaos", "Happily Ever After"],
        },
        exampleContent: `<h1>Chapter 1: The Plan</h1>
<p>It was supposed to be simple. That's what Dave kept telling himself as he stared at the burning car...</p>`,
    },
    {
        name: "Action Adventure",
        genre: "adventure",
        description: "A high-stakes journey with daring heroes, exotic locations, and thrilling action.",
        structure: {
            acts: [
                { name: "The Mission", description: "Receiving the call to action" },
                { name: "The Journey", description: "Obstacles and close calls" },
                { name: "The Climax", description: "Final showdown and victory" },
            ],
            suggestedChapters: ["The Assignment", "Into the Unknown", "First Challenge", "Betrayal", "Against the Odds", "The Final Push", "Victory"],
        },
        exampleContent: `<h1>Chapter 1: The Assignment</h1>
<p>The manila folder landed on the desk with a soft thud. "You're the only one who can do this," the Director said...</p>`,
    },
    {
        name: "Historical Epic",
        genre: "historical",
        description: "A sweeping tale set against the backdrop of a pivotal moment in history.",
        structure: {
            acts: [
                { name: "The Era", description: "Establishing time and place" },
                { name: "The Struggle", description: "Caught in historical events" },
                { name: "The Legacy", description: "Impact and lasting change" },
            ],
            suggestedChapters: ["The World Before", "First Signs", "The Storm Breaks", "Survival", "Turning Point", "The Aftermath", "A New Dawn"],
        },
        exampleContent: `<h1>Chapter 1: The World Before</h1>
<p>In the spring of 1912, the great ship sat in the Belfast harbor, a monument to human ambition...</p>`,
    },
];

export async function seedTemplates() {
    console.log("🌱 Seeding story templates...");

    try {
        // Clear existing templates
        await db.delete(templates);

        // Insert new templates
        for (const template of genreTemplates) {
            await db.insert(templates).values({
                name: template.name,
                genre: template.genre,
                description: template.description,
                structure: template.structure,
                exampleContent: template.exampleContent,
                isSystem: true,
            });
        }

        console.log(`✅ Seeded ${genreTemplates.length} story templates`);
    } catch (error) {
        console.error("❌ Error seeding templates:", error);
        throw error;
    }
}

// Run if executed directly
seedTemplates()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
