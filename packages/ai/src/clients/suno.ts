import axios from "axios";
import { config } from "dotenv";

config({ path: "../../.env" });

const API_KEY = process.env.SUNO_API_KEY;
// Using a proxy or direct API URL. Assuming a standard structure for now.
// If using an unofficial API like 'suno-api', URL might be localhost:3000
const BASE_URL = process.env.SUNO_API_URL || "https://api.suno.ai/v1";

export interface SunoGenerationOptions {
    prompt: string;
    instrumental?: boolean; // If true, no lyrics
    duration?: number;
    loop?: boolean;
}

export interface SunoGenerationResult {
    id: string;
    audioUrl?: string; // URL to download the MP3
    status: "submitted" | "processing" | "completed" | "failed";
}

/**
 * Suno AI Client Wrapper
 */
export async function generateMusicSuno(options: SunoGenerationOptions): Promise<SunoGenerationResult> {
    if (!API_KEY) {
        console.warn("⚠️ SUNO_API_KEY missing, returning mock response");
        return {
            id: `mock-suno-${Date.now()}`,
            status: "completed",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Public test MP3
        };
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/generation/generate`,
            {
                prompt: options.prompt,
                make_instrumental: options.instrumental,
                wait_audio: false, // Async generation
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const data = response.data;
        // Adjust based on actual API response structure
        const clip = data.clips?.[0];

        return {
            id: clip?.id || data.id,
            status: "submitted",
            audioUrl: clip?.audio_url,
        };
    } catch (error) {
        console.error("Suno API Error:", error);
        throw error;
    }
}

/**
 * Check generation status
 */
export async function getSunoStatus(id: string): Promise<SunoGenerationResult> {
    if (id.startsWith("mock-")) {
        return { id, status: "completed", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" };
    }

    try {
        const response = await axios.get(`${BASE_URL}/generation/${id}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
        });

        const data = response.data;
        return {
            id: data.id,
            status: data.status,
            audioUrl: data.audio_url,
        };
    } catch (error) {
        console.error("Suno Status Error:", error);
        throw error;
    }
}
