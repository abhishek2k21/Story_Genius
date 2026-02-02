import { generateWithGeminiPro } from "../clients/gemini";

export interface ConsistencyIssue {
    type: "character" | "timeline" | "location" | "visual";
    severity: "low" | "medium" | "high";
    description: string;
    sceneIds: string[];
    suggestion: string;
}

const CONSISTENCY_PROMPT = `You are a film continuity supervisor. Analyze these scenes for continuity errors.

Scenes:
{scenes_json}

Check for:
1. Character Consistency: Are characters appearing/disappearing logically? Do their traits remain stable?
2. Timeline Consistency: Do time of day and duration flows make sense? (e.g., Night to Morning abruptly?)
3. Location Consistency: Are locations stable or changing logically?
4. Visual Style Consistency: Do camera/lighting choices clash between adjacent scenes?

Respond with a JSON array of issues:
[
  {
    "type": "character|timeline|location|visual",
    "severity": "low|medium|high",
    "description": "description of the error",
    "sceneIds": ["scene_id_1", "scene_id_2"],
    "suggestion": "how to fix it"
  }
]
If no issues, return [].`;

/**
 * Check for consistency issues across scenes
 */
export async function checkConsistency(scenes: any[]): Promise<ConsistencyIssue[]> {
    // Simplify scenes for prompt to save tokens
    const simplifiedScenes = scenes.map(s => ({
        id: s.id,
        order: s.order,
        title: s.title,
        timeOfDay: s.timeOfDay,
        location: s.location,
        characters: s.characters,
        visualStyle: {
            lighting: s.lighting,
            camera: s.cameraMovement
        }
    }));

    const prompt = CONSISTENCY_PROMPT.replace("{scenes_json}", JSON.stringify(simplifiedScenes, null, 2));

    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        return JSON.parse(jsonMatch[0]) as ConsistencyIssue[];
    } catch (error) {
        console.error("Failed to check consistency:", error);
        return [];
    }
}
