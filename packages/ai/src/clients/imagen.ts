/**
 * Imagen 3 Client for image generation via Vertex AI
 */

import { VertexAI } from "@google-cloud/vertexai";

const projectId = process.env.GCP_PROJECT_ID || "winged-precept-458206-j1";
const location = process.env.GCP_REGION || "us-central1";

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: projectId, location });

export interface ImageGenerationOptions {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    numberOfImages?: number;
    style?: string;
}

export interface GeneratedImage {
    base64Data: string;
    mimeType: string;
}

/**
 * Generate image using Imagen 3 via Vertex AI
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    console.log(`📸 Generating image with Imagen 3:`, options.prompt.slice(0, 50));

    try {
        // Use the imagen model through Vertex AI
        const model = vertexAI.preview.getGenerativeModel({ model: "imagegeneration@006" });

        // Imagen uses a different API pattern - we'll use the prediction endpoint
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken()}`,
            },
            body: JSON.stringify({
                instances: [{
                    prompt: options.prompt,
                }],
                parameters: {
                    sampleCount: options.numberOfImages || 1,
                    aspectRatio: options.aspectRatio || "1:1",
                    negativePrompt: options.negativePrompt || "",
                    // Imagen 3 parameters
                    safetyFilterLevel: "block_some",
                    personGeneration: "allow_adult",
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Imagen API error:", error);
            throw new Error(`Imagen API error: ${response.statusText}`);
        }

        const data = await response.json();

        return data.predictions.map((pred: any) => ({
            base64Data: pred.bytesBase64Encoded,
            mimeType: "image/png",
        }));
    } catch (error) {
        console.error("Imagen generation failed:", error);
        throw error;
    }
}

/**
 * Get GCP access token for API calls
 */
async function getAccessToken(): Promise<string> {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token || "";
}

/**
 * Generate character reference image
 */
export async function generateCharacterImage(
    characterDescription: string,
    style: string = "realistic"
): Promise<GeneratedImage> {
    const prompt = `Professional portrait photograph of ${characterDescription}. ${style} style, detailed face, studio lighting, high quality, 8k resolution`;
    const negativePrompt = "blurry, low quality, distorted, deformed, ugly, cartoon, anime";

    const images = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "3:4",
        numberOfImages: 1,
        style,
    });
    return images[0];
}

/**
 * Generate scene storyboard image
 */
export async function generateSceneImage(
    sceneDescription: string,
    style: string = "cinematic"
): Promise<GeneratedImage> {
    const prompt = `Cinematic film still: ${sceneDescription}. ${style} cinematography, professional lighting, movie quality, 35mm film look`;
    const negativePrompt = "text, watermark, blurry, low quality, amateur";

    const images = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "16:9",
        numberOfImages: 1,
        style,
    });
    return images[0];
}

/**
 * Generate video thumbnail
 */
export async function generateThumbnail(
    sceneDescription: string,
    title?: string
): Promise<GeneratedImage> {
    const prompt = `YouTube video thumbnail: ${sceneDescription}. Eye-catching, vibrant colors, dramatic lighting, cinematic composition${title ? `, suggesting title "${title}"` : ""}`;
    const negativePrompt = "text, watermark, boring, dull, low contrast";

    const images = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "16:9",
        numberOfImages: 1,
    });
    return images[0];
}

/**
 * Generate storyboard frame (simpler, sketch-like)
 */
export async function generateStoryboardFrame(
    sceneDescription: string,
    shotType: "wide" | "medium" | "close-up" = "medium"
): Promise<GeneratedImage> {
    const shotDescriptors = {
        wide: "wide establishing shot",
        medium: "medium shot",
        "close-up": "close-up detail shot",
    };

    const prompt = `Storyboard sketch: ${sceneDescription}. ${shotDescriptors[shotType]}, black and white pencil sketch, professional storyboard artist style, clear composition`;

    const images = await generateImage({
        prompt,
        negativePrompt: "color, photograph, blurry",
        aspectRatio: "16:9",
        numberOfImages: 1,
    });
    return images[0];
}
