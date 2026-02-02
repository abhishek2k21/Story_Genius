import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { config } from "dotenv";

// Load environment variables
config({ path: "../../.env" });

// Import routes
import { webhooks } from "./routes/webhooks";
import { projectRoutes } from "./routes/projects";
import { sceneEditorRouter } from "./routes/scene-editor";
import { exportRouter } from "./routes/export";
import { userRoutes } from "./routes/users";
import { chaptersRouter } from "./routes/chapters";
import { templatesRouter } from "./routes/templates";
import { importRouter } from "./routes/import";
import aiRouter from "./routes/ai";
import analysisRouter from "./routes/analysis";
import scenesRouter from "./routes/scenes";
import generationRouter from "./routes/generation";
import assemblyRouter from "./routes/assembly";
import queueRouter from "./routes/queue";
import storageRouter from "./routes/storage";
import audioRouter from "./routes/audio";

const app = new Hono();

// Middleware
app.use("*", cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
}));
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());

// Health check endpoint
app.get("/health", (c) => {
    return c.json({
        status: "healthy",
        service: "story-genius-api",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
    });
});

// API info endpoint
app.get("/api", (c) => {
    return c.json({
        message: "Welcome to Story-Genius API",
        version: "0.1.0",
        endpoints: {
            health: "/health",
            webhooks: "/webhooks/clerk",
            users: "/api/users",
            projects: "/api/projects",
            chapters: "/api/chapters",
            templates: "/api/templates",
            import: "/api/import/*",
            ai: "/api/ai/*",
            queue: "/api/queue/*",
            storage: "/api/storage/*",
        },
    });
});

// Mount routes
app.route("/webhooks", webhooks);
app.route("/api/users", userRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/projects", sceneEditorRouter); // Mounts to /api/projects/:projectId/scenes/...
app.route("/api/projects", exportRouter);       // Mounts to /api/projects/:projectId/export
app.route("/api", chaptersRouter);
app.route("/api/templates", templatesRouter);
app.route("/api", importRouter);
app.route("/api/ai", aiRouter);
app.route("/api/analysis", analysisRouter);
app.route("/api/scenes", scenesRouter);
app.route("/api/generation", generationRouter);
app.route("/api/assembly", assemblyRouter);
app.route("/api/queue", queueRouter);
app.route("/api/storage", storageRouter);
app.route("/api/audio", audioRouter);

// Generation routes (placeholder - to be implemented in Week 5-6)
app.post("/api/generate", async (c) => {
    const body = await c.req.json();
    return c.json({
        message: "Generation queued",
        jobId: `job_${Date.now()}`,
        status: "pending",
    }, 202);
});

app.get("/api/generate/:jobId", async (c) => {
    const jobId = c.req.param("jobId");
    return c.json({
        jobId,
        status: "pending",
        progress: 0,
    });
});

// 404 handler
app.notFound((c) => {
    return c.json({ error: "Not Found", path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
    console.error("API Error:", err);
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

// Start server
const port = parseInt(process.env.API_PORT || "3001");

console.log(`🚀 Story-Genius API starting on port ${port}...`);

try {
    serve({
        fetch: app.fetch,
        port,
    });
    console.log(`✅ API server running at http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
    console.log(`📋 API docs: http://localhost:${port}/api`);
} catch (error) {
    console.error(`❌ Failed to start API server: ${error}`);
}

export default app;
