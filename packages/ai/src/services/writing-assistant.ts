import { generateWithGeminiFlash, streamFromGeminiPro } from "../clients/gemini";

export type WritingMode = "improve" | "expand" | "shorten" | "fix" | "tone" | "continue";
export type ToneType = "professional" | "dramatic" | "funny" | "dark" | "romantic" | "mysterious";

export interface WritingAssistantParams {
    text: string;
    mode: WritingMode;
    context?: string; // Preceding text or story context
    tone?: ToneType;
    instruction?: string; // Custom instruction
}

/**
 * Service to handle AI writing assistance
 */
export class WritingAssistantService {

    /**
     * Process a text segment based on the selected mode
     */
    async processText(params: WritingAssistantParams): Promise<string> {
        const prompt = this.buildPrompt(params);

        // Use Flash for quick edits, Pro for creative continuation
        if (params.mode === "continue" || params.mode === "expand") {
            // We might want to stream 'continue' later, but for single request:
            // Actually, we'll use Pro for quality on expansion/continuation
            // We can't use the 'streamFromGeminiPro' here as this returns string.
            // For streaming, use streamContinueStory.
            // We'll use Flash for speed on everything else unless verified otherwise.
            // Actually, 'expand' benefits from Pro.
            return await generateWithGeminiFlash(prompt);
            // Note: Depending on quality requirements, might switch to Pro.
        }

        return await generateWithGeminiFlash(prompt);
    }

    /**
     * Stream the continuation of a story
     */
    async *streamContinueStory(text: string, context: string = ""): AsyncGenerator<string> {
        const prompt = `
You are an expert storyteller and co-author. 
Your task is to continue the story naturally based on the provided text and context.

PREVIOUS CONTEXT:
${context}

CURRENT TEXT:
${text}

INSTRUCTIONS:
- Continue the narrative flow seamlessly.
- Match the existing tone and style.
- Do not repeat the last sentence.
- Provide about 1-2 paragraphs of continuation.
- Do not output any meta-commentary (e.g., "Here is the continuation").

CONTINUATION:
`;
        yield* streamFromGeminiPro(prompt);
    }

    private buildPrompt(params: WritingAssistantParams): string {
        const { text, mode, tone, instruction, context } = params;

        let basePrompt = `You are an expert editor and writing assistant. `;

        if (context) {
            basePrompt += `\n\nCONTEXT (Preceding Text):\n${context}\n`;
        }

        basePrompt += `\n\nINPUT TEXT:\n"${text}"\n\n`;

        switch (mode) {
            case "improve":
                return `${basePrompt}TASK: Rewrite the input text to improve clarity, flow, and impact. Keep the original meaning.`;
            case "expand":
                return `${basePrompt}TASK: Expand on the input text by adding descriptive details, sensory language, and depth. Make it more immersive.`;
            case "shorten":
                return `${basePrompt}TASK: Condense the input text to be more concise while retaining key information and impact.`;
            case "fix":
                return `${basePrompt}TASK: Fix any grammar, spelling, or punctuation errors in the input text. Do not change the style significantly.`;
            case "tone":
                return `${basePrompt}TASK: Rewrite the input text to match a ${tone || "neutral"} tone.`;
            case "continue":
                // 'continue' is usually handled by stream, but if called here:
                return `${basePrompt}TASK: Continue the story from the current text. Write the next logical sentences.`;
            default:
                if (instruction) {
                    return `${basePrompt}TASK: ${instruction}`;
                }
                return `${basePrompt}TASK: Improve the text.`;
        }
    }
}

export const writingAssistant = new WritingAssistantService();
