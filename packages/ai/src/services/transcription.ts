
/**
 * Transcription Service Interface
 */
export interface TranscriptionResult {
    text: string;
    segments: Array<{
        start: number;
        end: number;
        text: string;
    }>;
    language: string;
}

export interface TranscriptionService {
    transcribe(audioPath: string): Promise<TranscriptionResult>;
}

/**
 * Mock Transcription Service for Development
 */
export class MockTranscriptionService implements TranscriptionService {
    async transcribe(audioPath: string): Promise<TranscriptionResult> {
        console.log(`[Mock] Transcribing audio at ${audioPath}...`);

        // Return dummy segments
        return {
            text: "This is a mock transcription of the scene audio.",
            language: "en",
            segments: [
                { start: 0, end: 2.5, text: "This is a mock" },
                { start: 2.5, end: 5.0, text: "transcription of the scene audio." }
            ]
        };
    }
}

export const transcriptionService = new MockTranscriptionService();
