import { generateWithGeminiPro } from "../clients/gemini";
import type { SceneBreakdown } from "../types";

const SCENE_BREAKDOWN_PROMPT = `You are a professional film director breaking down a story into visual scenes for video generation.

Story:
"""
{story}
"""

Target video duration: {duration} seconds

Break this story into {sceneCount} scenes. For each scene, provide:

Respond with a JSON array:
[
  {
    "sceneNumber": 1,
    "title": "brief scene title",
    "summary": "one-line summary",
    "content": "the story content for this scene",
    "duration": seconds,
    "location": "scene location",
    "timeOfDay": "dawn|morning|afternoon|evening|night|unknown",
    "weather": "optional weather description",
    "mood": "scene mood",
    "characters": ["character names present"],
    "visualStyle": {
      "cameraAngle": "wide|medium|close|extreme close|bird's eye|etc",
      "cameraMovement": "static|pan|tilt|track|dolly|crane|etc",
      "lighting": "high key|low key|natural|dramatic|etc",
      "colorPalette": ["color1", "color2", "color3"]
    },
    "transition": {
      "type": "cut|fade|dissolve|wipe|none",
      "duration": seconds
    }
  }
]`;

/**
 * Break story into scenes for video generation
 */
export async function breakdownIntoScenes(
    storyContent: string,
    targetDuration: number = 60,
    sceneCount?: number
): Promise<SceneBreakdown[]> {
    const estimatedScenes = sceneCount || Math.ceil(targetDuration / 5);

    const prompt = SCENE_BREAKDOWN_PROMPT
        .replace("{story}", storyContent)
        .replace("{duration}", targetDuration.toString())
        .replace("{sceneCount}", estimatedScenes.toString());

    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }
        return JSON.parse(jsonMatch[0]) as SceneBreakdown[];
    } catch (error) {
        console.error("Failed to breakdown scenes:", error);
        throw new Error("Failed to breakdown story into scenes");
    }
}

/**
 * Adjust scene durations to match target total
 */
export function adjustSceneDurations(
    scenes: SceneBreakdown[],
    targetDuration: number
): SceneBreakdown[] {
    const currentTotal = scenes.reduce((sum, s) => sum + s.duration, 0);
    const ratio = targetDuration / currentTotal;

    return scenes.map(scene => ({
        ...scene,
        duration: Math.round(scene.duration * ratio * 10) / 10,
    }));
}
