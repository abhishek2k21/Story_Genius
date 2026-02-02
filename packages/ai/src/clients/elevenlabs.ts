import { ElevenLabsClient } from "elevenlabs";
import { config } from "dotenv";

config({ path: "../../.env" });

const apiKey = process.env.ELEVENLABS_API_KEY;
const client = apiKey ? new ElevenLabsClient({ apiKey }) : null;

export interface ElevenLabsOptions {
    text: string;
    voiceId?: string; // Default: '21m00Tcm4TlvDq8ikWAM' (Rachel) or similar
    modelId?: string; // Default: 'eleven_multilingual_v2'
    stability?: number;
    similarityBoost?: number;
}

/**
 * ElevenLabs TTS Client Wrapper
 */
export async function generateSpeechElevenLabs(options: ElevenLabsOptions): Promise<Buffer> {
    if (!client) {
        throw new Error("ELEVENLABS_API_KEY is missing");
    }

    try {
        const audioStream = await client.textToSpeech.convert(
            options.voiceId || "21m00Tcm4TlvDq8ikWAM",
            {
                text: options.text,
                model_id: options.modelId || "eleven_multilingual_v2",
                voice_settings: {
                    stability: options.stability || 0.5,
                    similarity_boost: options.similarityBoost || 0.75,
                },
            }
        );

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk as Buffer);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error("ElevenLabs Error:", error);
        throw error;
    }
}

/**
 * Get available voices
 */
export async function listVoicesElevenLabs() {
    if (!client) return [];
    const response = await client.voices.getAll();
    return response.voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        previewUrl: v.preview_url,
    }));
}
