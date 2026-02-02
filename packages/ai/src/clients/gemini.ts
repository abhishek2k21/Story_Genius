import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI client
const projectId = process.env.GCP_PROJECT_ID || "winged-precept-458206-j1";
const location = process.env.GCP_REGION || "us-central1";

const vertexAI = new VertexAI({ project: projectId, location });

// Gemini models
const geminiProModel = "gemini-1.5-pro";
const geminiFlashModel = "gemini-1.5-flash";

/**
 * Get Gemini Pro client for complex tasks
 * - Story analysis
 * - Scene planning
 * - Character extraction
 */
export function getGeminiPro() {
    return vertexAI.getGenerativeModel({
        model: geminiProModel,
        generation_config: {
            max_output_tokens: 8192,
            temperature: 0.7,
            top_p: 0.95,
        },
    });
}

/**
 * Get Gemini Flash client for quick tasks
 * - Prompt generation
 * - Simple text processing
 * - Quick validations
 */
export function getGeminiFlash() {
    return vertexAI.getGenerativeModel({
        model: geminiFlashModel,
        generation_config: {
            max_output_tokens: 4096,
            temperature: 0.5,
            top_p: 0.9,
        },
    });
}

/**
 * Generate text with Gemini Pro
 */
export async function generateWithGeminiPro(prompt: string): Promise<string> {
    const model = getGeminiPro();
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Generate text with Gemini Flash
 */
export async function generateWithGeminiFlash(prompt: string): Promise<string> {
    const model = getGeminiFlash();
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Stream response from Gemini Pro
 */
export async function* streamFromGeminiPro(prompt: string): AsyncGenerator<string> {
    const model = getGeminiPro();
    const streamingResult = await model.generateContentStream(prompt);

    for await (const chunk of streamingResult.stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            yield text;
        }
    }
}

export { vertexAI };
