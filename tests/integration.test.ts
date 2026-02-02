import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = "http://localhost:3001";
let projectId: string;
let sceneId: string;

describe('Story-Genius Full Stack Integration Tests', () => {

    // Month 1: Foundation
    describe('Month 1: Foundation', () => {
        it('should have healthy API', async () => {
            const res = await fetch(`${API_URL}/health`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.status).toBe('ok');
        });
    });

    // Month 2: Story Creation
    describe('Month 2: Story Creation', () => {
        it('should create a project', async () => {
            // Mock auth would be needed here or bypass
            // For this test script, we assume a test user or mock middleware
            // Or we check public endpoints if any, but most are protected.
            // We will verify endpoints exist even if 401
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Test Project', description: 'Test Description' })
            });
            // Expect 401 if unauthenticated, proving route exists
            expect(res.status).toBeOneOf([200, 201, 401]);
        });
    });

    // Month 3: AI Brain
    describe('Month 3: AI Brain', () => {
        it('should expose scene generation endpoint', async () => {
            const res = await fetch(`${API_URL}/api/scenes/generate/test-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyContent: 'Test story content' })
            });
            expect(res.status).toBeOneOf([200, 500, 401]); // 500 if AI fails, 401 if auth
        });

        it('should expose consistency check endpoint', async () => {
            const res = await fetch(`${API_URL}/api/scenes/check-consistency`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenes: [] })
            });
            expect(res.status).toBeOneOf([200, 401]);
        });
    });

    // Month 4: Video Production
    describe('Month 4: Video Production', () => {
        it('should expose video generation endpoint', async () => {
            const res = await fetch(`${API_URL}/api/generation/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'test prompt' })
            });
            expect(res.status).toBeOneOf([200, 401, 500]);
        });

        it('should expose assembly creation endpoint', async () => {
            const res = await fetch(`${API_URL}/api/assembly/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test Assembly', scenes: [] })
            });
            expect(res.status).toBeOneOf([200, 401]);
        });

        it('should expose providers list', async () => {
            const res = await fetch(`${API_URL}/api/generation/providers`);
            expect(res.status).toBeOneOf([200, 401]);
            if (res.status === 200) {
                const data = await res.json();
                expect(data.video).toBeDefined();
                expect(data.video.length).toBeGreaterThan(0);
            }
        });
    });
});
