import { generateWithGeminiFlash } from "../clients/gemini";
import type { SceneBreakdown, VideoPrompt } from "../types";

/**
 * Build video generation prompt from scene data
 */
export function buildVideoPrompt(scene: SceneBreakdown, style: string = "cinematic"): VideoPrompt {
    const visualElements = [
        scene.content,
        `${scene.visualStyle.lighting} lighting`,
        `${scene.visualStyle.cameraAngle} shot`,
        `${scene.visualStyle.cameraMovement} camera movement`,
        scene.mood,
        scene.location,
        scene.timeOfDay !== "unknown" ? `${scene.timeOfDay} atmosphere` : "",
        scene.weather || "",
        style,
    ].filter(Boolean);

    return {
        prompt: visualElements.join(", "),
        negativePrompt: "blurry, low quality, distorted, watermark, text overlay, amateur",
        style,
        aspectRatio: "16:9",
        duration: scene.duration,
        motionStrength: scene.visualStyle.cameraMovement === "static" ? 0.3 : 0.7,
    };
}

/**
 * Enhance a prompt with more details using AI
 */
export async function enhancePrompt(
    basicPrompt: string,
    style: string = "cinematic"
): Promise<string> {
    const enhancePromptTemplate = `Enhance this video generation prompt for a ${style} style video. 
Add specific visual details, atmosphere, and technical filmmaking terms.
Keep it concise (max 200 words).

Original prompt: "${basicPrompt}"

Enhanced prompt:`;

    const enhanced = await generateWithGeminiFlash(enhancePromptTemplate);
    return enhanced.trim();
}

/**
 * Generate negative prompt for a style
 */
export function generateNegativePrompt(style: string): string {
    const baseNegatives = [
        "blurry",
        "low quality",
        "distorted",
        "watermark",
        "text overlay",
        "amateur",
        "poorly lit",
    ];

    const styleNegatives: Record<string, string[]> = {
        cinematic: ["flat lighting", "static", "boring composition"],
        anime: ["realistic", "photographic", "3D render"],
        realistic: ["cartoon", "animated", "stylized"],
        noir: ["bright colors", "cheerful", "sunny"],
        fantasy: ["modern", "mundane", "realistic"],
    };

    const extras = styleNegatives[style] || [];
    return [...baseNegatives, ...extras].join(", ");
}
