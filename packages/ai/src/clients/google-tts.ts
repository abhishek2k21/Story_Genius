import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { config } from "dotenv";

config({ path: "../../.env" });

let client: TextToSpeechClient | null = null;

function getClient() {
    if (!client) {
        client = new TextToSpeechClient();
    }
    return client;
}

export interface TTSOptions {
    text: string;
    languageCode?: string;
    gender?: "MALE" | "FEMALE" | "NEUTRAL";
    voiceName?: string;
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    ssml?: boolean;
}

export interface TTSResult {
    audioContent: Buffer;
    timepoints?: any[]; // For future lip-sync
}

/**
 * Google Cloud TTS Client Wrapper
 */
export async function generateSpeechGoogle(options: TTSOptions): Promise<TTSResult> {
    try {
        const [response] = await getClient().synthesizeSpeech({
            input: options.ssml ? { ssml: options.text } : { text: options.text },
            voice: {
                languageCode: options.languageCode || "en-US",
                name: options.voiceName || "en-US-Neural2-A", // Default to high-quality Neural2
                ssmlGender: options.gender || "MALE",
            },
            audioConfig: {
                audioEncoding: "MP3",
                speakingRate: options.speakingRate || 1.0,
                pitch: options.pitch || 0.0,
                volumeGainDb: options.volumeGainDb || 0.0,
            },
        });

        if (!response.audioContent) {
            throw new Error("No audio content received from Google TTS");
        }

        return {
            audioContent: Buffer.from(response.audioContent),
        };
    } catch (error) {
        console.error("Google TTS Error:", error);
        throw error;
    }
}

/**
 * List available voices
 */
export async function listVoicesGoogle(languageCode: string = "en-US") {
    const [result] = await getClient().listVoices({ languageCode });
    return result.voices?.map(v => ({
        name: v.name,
        gender: v.ssmlGender,
        languageCodes: v.languageCodes,
    })) || [];
}
