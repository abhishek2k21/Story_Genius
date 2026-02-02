import { generateWithGeminiPro } from "../clients/gemini";
import type { CharacterProfile } from "../types";

const CHARACTER_ANALYSIS_PROMPT = `Analyze the following story and extract detailed character information with relationships and screen presence.

Story:
"""
{story}
"""

Provide a JSON array where each character includes:
- name
- physicalDescription (for visual generation)
- personality traits array
- role (protagonist/antagonist/supporting/minor)
- emotionalState
- age
- clothing description
- distinctiveFeatures array
- relationships array (with other characters: type, description)
- screenTimeEstimate (0-100, percentage of story presence)

Response format:
[
  {
    "name": "Character Name",
    "physicalDescription": "detailed visual description",
    "personality": ["trait1", "trait2"],
    "role": "protagonist",
    "emotionalState": "state",
    "age": "approximate age",
    "clothing": "description",
    "distinctiveFeatures": ["feature1"],
    "relationships": [
      {
        "characterName": "Other Character",
        "type": "friend|enemy|family|romantic|rival",
        "description": "nature of relationship"
      }
    ],
    "screenTimeEstimate": 75
  }
]`;

/**
 * Analyze characters with relationships and screen time
 */
export async function analyzeCharacters(storyContent: string): Promise<CharacterProfile[]> {
    const prompt = CHARACTER_ANALYSIS_PROMPT.replace("{story}", storyContent);
    const response = await generateWithGeminiPro(prompt);

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }
        return JSON.parse(jsonMatch[0]) as CharacterProfile[];
    } catch (error) {
        console.error("Failed to analyze characters:", error);
        throw new Error("Failed to analyze characters");
    }
}

/**
 * Generate character embedding for similarity search
 * (Simplified - in production, use a dedicated embedding model)
 */
export async function generateCharacterEmbedding(character: CharacterProfile): Promise<number[]> {
    // For now, return a placeholder
    // In production, use Vertex AI's text embedding API
    const description = `${character.name}: ${character.physicalDescription}. ${character.personality.join(", ")}`;

    // Placeholder: return 768-dim zero vector
    // TODO: Replace with actual Vertex AI embedding call
    return new Array(768).fill(0);
}
