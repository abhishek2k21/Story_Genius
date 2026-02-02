import { generateWithGeminiPro } from "../clients/gemini";

export interface VisualPlan {
    cameraMovement: string;
    cameraAngle: string;
    lighting: string;
    colorPalette: string[];
    transitionIn: string;
    transitionOut: string;
}

const VISUAL_PLAN_PROMPT = `You are a cinematographer planning visual elements for a scene.

Scene Details:
- Content: "{content}"
- Location: {location}
- Time of Day: {timeOfDay}
- Mood: {mood}
- Characters: {characters}

Suggest visual elements for this scene in JSON:
{
  "cameraMovement": "static|pan|tilt|track|dolly|crane|handheld",
  "cameraAngle": "wide|medium|close-up|extreme close-up|bird's eye|low angle|high angle",
  "lighting": "high-key|low-key|natural|dramatic|silhouette|backlit|golden hour",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "transitionIn": "cut|fade in|dissolve|wipe",
  "transitionOut": "cut|fade out|dissolve|wipe"
}`;

/**
 * Generate visual plan for a single scene
 */
export async function generateVisualPlan(scene: {
    content: string;
    location?: string;
    timeOfDay?: string;
    mood?: string;
    characters?: string[];
}): Promise<VisualPlan> {
    const prompt = VISUAL_PLAN_PROMPT
        .replace("{content}", scene.content.slice(0, 500))
        .replace("{location}", scene.location || "unspecified")
        .replace("{timeOfDay}", scene.timeOfDay || "day")
        .replace("{mood}", scene.mood || "neutral")
        .replace("{characters}", scene.characters?.join(", ") || "none");

    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }
        return JSON.parse(jsonMatch[0]) as VisualPlan;
    } catch (error) {
        console.error("Failed to generate visual plan:", error);
        // Return sensible defaults
        return {
            cameraMovement: "static",
            cameraAngle: "medium",
            lighting: "natural",
            colorPalette: ["#4A5568", "#718096", "#A0AEC0"],
            transitionIn: "cut",
            transitionOut: "cut",
        };
    }
}

/**
 * Suggest camera movements based on scene action
 */
export function suggestCameraMovement(action: string): string {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("chase") || actionLower.includes("run")) return "track";
    if (actionLower.includes("reveal") || actionLower.includes("discover")) return "dolly";
    if (actionLower.includes("look") || actionLower.includes("turn")) return "pan";
    if (actionLower.includes("fall") || actionLower.includes("rise")) return "tilt";
    if (actionLower.includes("intense") || actionLower.includes("nervous")) return "handheld";
    return "static";
}

/**
 * Suggest lighting based on mood
 */
export function suggestLighting(mood: string): string {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes("tense") || moodLower.includes("dark")) return "low-key";
    if (moodLower.includes("happy") || moodLower.includes("bright")) return "high-key";
    if (moodLower.includes("romantic") || moodLower.includes("warm")) return "golden hour";
    if (moodLower.includes("mystery") || moodLower.includes("suspense")) return "dramatic";
    return "natural";
}
