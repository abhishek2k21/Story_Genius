import { generateSpeechGoogle, listVoicesGoogle, TTSOptions } from "../clients/google-tts";
import { generateSpeechElevenLabs, listVoicesElevenLabs, ElevenLabsOptions } from "../clients/elevenlabs";
import { generateMusicSuno, SunoGenerationOptions, getSunoStatus, SunoGenerationResult } from "../clients/suno";

export type AudioProvider = "google" | "elevenlabs";

export interface GenerateNarrationParams {
    text: string;
    provider?: AudioProvider;
    voiceId?: string; // Neural2 name or ElevenLabs ID
    options?: {
        gender?: "MALE" | "FEMALE";
        speakingRate?: number;
        pitch?: number;
        stability?: number; // ElevenLabs only
        style?: string; // Future use
    };
}

export interface GenerateMusicParams {
    prompt: string;
    duration?: number;
    instrumental?: boolean;
}

export class AudioGeneratorService {

    /**
     * Generate Narration / Speech
     */
    async generateNarration(params: GenerateNarrationParams): Promise<Buffer> {
        const provider = params.provider || "google";

        if (provider === "elevenlabs") {
            try {
                return await generateSpeechElevenLabs({
                    text: params.text,
                    voiceId: params.voiceId,
                    stability: params.options?.stability,
                });
            } catch (error) {
                console.warn("ElevenLabs failed, falling back to Google TTS", error);
                // Fallback to Google
                return this.generateGoogleTTS(params);
            }
        }

        return this.generateGoogleTTS(params);
    }

    private async generateGoogleTTS(params: GenerateNarrationParams): Promise<Buffer> {
        const result = await generateSpeechGoogle({
            text: params.text,
            voiceName: params.voiceId,
            gender: params.options?.gender,
            speakingRate: params.options?.speakingRate,
            pitch: params.options?.pitch,
        });
        return result.audioContent;
    }

    /**
     * Generate Background Music
     */
    async generateMusic(params: GenerateMusicParams): Promise<SunoGenerationResult> {
        return await generateMusicSuno({
            prompt: params.prompt,
            duration: params.duration,
            instrumental: params.instrumental,
        });
    }

    /**
     * Check Music Generation Status
     */
    async checkMusicStatus(id: string): Promise<SunoGenerationResult> {
        return await getSunoStatus(id);
    }

    /**
     * List Available Voices
     */
    async listVoices(provider: AudioProvider = "google") {
        if (provider === "elevenlabs") {
            return await listVoicesElevenLabs();
        }
        return await listVoicesGoogle();
    }
}

export const audioGenerator = new AudioGeneratorService();
