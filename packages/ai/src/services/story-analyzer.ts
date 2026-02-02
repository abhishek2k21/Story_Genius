import { generateWithGeminiPro } from "../clients/gemini";
import type { StoryAnalysis, CharacterProfile } from "../types";

const STORY_ANALYSIS_PROMPT = `You are an expert story analyst for a video generation system. Analyze the following story and extract key information in JSON format.

Story:
"""
{story}
"""

Respond with valid JSON only:
{
  "genre": "main genre",
  "subGenre": "optional sub-genre",
  "tone": "overall tone (e.g., dramatic, humorous, dark)",
  "mood": "dominant mood",
  "pacing": "slow|moderate|fast|variable",
  "themes": ["theme1", "theme2"],
  "targetAudience": "target audience description",
  "emotionalArc": [
    {
      "position": 0.0-1.0,
      "emotion": "emotion name",
      "intensity": 0.0-1.0,
      "description": "brief description"
    }
  ],
  "keyMoments": [
    {
      "position": 0.0-1.0,
      "description": "moment description",
      "importance": 1-10,
      "sceneType": "action|dialogue|reveal|climax|etc"
    }
  ]
}`;

const CHARACTER_EXTRACTION_PROMPT = `Extract all characters from this story. For each character, provide their details in JSON format.

Story:
"""
{story}
"""

Respond with a JSON array:
[
  {
    "name": "character name",
    "physicalDescription": "detailed physical description for visual generation",
    "personality": ["trait1", "trait2"],
    "role": "protagonist|antagonist|supporting|minor",
    "emotionalState": "general emotional state",
    "age": "approximate age",
    "clothing": "typical clothing description",
    "distinctiveFeatures": ["feature1", "feature2"]
  }
]`;

/**
 * Analyze a story and extract key narrative elements
 */
export async function analyzeStory(storyContent: string): Promise<StoryAnalysis> {
    const prompt = STORY_ANALYSIS_PROMPT.replace("{story}", storyContent);
    const response = await generateWithGeminiPro(prompt);

    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }
        return JSON.parse(jsonMatch[0]) as StoryAnalysis;
    } catch (error) {
        console.error("Failed to parse story analysis:", error);
        throw new Error("Failed to analyze story");
    }
}

/**
 * Extract characters from a story
 */
export async function extractCharacters(storyContent: string): Promise<CharacterProfile[]> {
    const prompt = CHARACTER_EXTRACTION_PROMPT.replace("{story}", storyContent);
    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }
        return JSON.parse(jsonMatch[0]) as CharacterProfile[];
    } catch (error) {
        console.error("Failed to extract characters:", error);
        throw new Error("Failed to extract characters");
    }
}
