/**
 * Text Embeddings Client for semantic search and similarity
 * Uses Vertex AI text embeddings
 */

const projectId = process.env.GCP_PROJECT_ID || "winged-precept-458206-j1";
const location = process.env.GCP_REGION || "us-central1";

export interface EmbeddingResult {
    text: string;
    embedding: number[];
}

/**
 * Generate text embedding
 * Uses textembedding-gecko model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    console.log(`🔢 Generating embedding for text: ${text.substring(0, 50)}...`);

    // TODO: Implement actual embedding generation
    // Requires: @google-cloud/aiplatform predictions

    // Return placeholder 768-dimension embedding
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (const text of texts) {
        const embedding = await generateEmbedding(text);
        results.push({ text, embedding });
    }

    return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Embeddings must have the same dimension");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar text from a list
 */
export function findMostSimilar(
    queryEmbedding: number[],
    candidates: EmbeddingResult[]
): EmbeddingResult | null {
    if (candidates.length === 0) return null;

    let bestMatch = candidates[0];
    let bestScore = cosineSimilarity(queryEmbedding, candidates[0].embedding);

    for (let i = 1; i < candidates.length; i++) {
        const score = cosineSimilarity(queryEmbedding, candidates[i].embedding);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = candidates[i];
        }
    }

    return bestMatch;
}
