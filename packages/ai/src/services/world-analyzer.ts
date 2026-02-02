import { generateWithGeminiPro } from "../clients/gemini";

export interface Location {
    name: string;
    type: string; // interior, exterior, natural, urban, etc.
    description: string;
    timePeriod?: string;
    atmosphere?: string;
    weather?: string;
    worldBuildingNotes?: string;
}

const WORLD_ANALYSIS_PROMPT = `Analyze the following story and extract all world-building elements including locations, settings, time period, and atmosphere.

Story:
"""
{story}
"""

Provide a JSON object with:
{
  "locations": [
    {
      "name": "Location Name",
      "type": "interior|exterior|natural|urban|fictional",
      "description": "detailed description",
      "timePeriod": "e.g., Modern day, Medieval, 2150 AD",
      "atmosphere": "e.g., Tense, Peaceful, Chaotic",
      "weather": "if relevant",
      "worldBuildingNotes": "additional notes"
    }
  ],
  "overallTimePeriod": "main time setting",
  "worldType": "realistic|fantasy|sci-fi|historical|etc"
}`;

export interface WorldAnalysis {
    locations: Location[];
    overallTimePeriod: string;
    worldType: string;
}

/**
 * Analyze world-building elements from a story
 */
export async function analyzeWorld(storyContent: string): Promise<WorldAnalysis> {
    const prompt = WORLD_ANALYSIS_PROMPT.replace("{story}", storyContent);
    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }
        return JSON.parse(jsonMatch[0]) as WorldAnalysis;
    } catch (error) {
        console.error("Failed to analyze world:", error);
        throw new Error("Failed to analyze world");
    }
}
