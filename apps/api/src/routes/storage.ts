import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { createStorageClient, FileMetadata } from "@repo/storage";

const storageRouter = new Hono();
storageRouter.use("*", authMiddleware);

const storage = createStorageClient();

// ============================================
// GET FILE METADATA
// ============================================
storageRouter.get("/files/:key{.+}", async (c) => {
    const key = c.req.param("key");

    const metadata = await storage.getFileMetadata(key);

    if (!metadata) {
        return c.json({ error: "File not found" }, 404);
    }

    return c.json({ file: metadata });
});

// ============================================
// GET PRESIGNED DOWNLOAD URL
// ============================================
storageRouter.get(
    "/files/:key{.+}/url",
    async (c) => {
        const key = c.req.param("key");
        const expiry = parseInt(c.req.query("expiry") || "3600");

        try {
            const url = await storage.getPresignedUrl(key, expiry);
            return c.json({ url, expiresIn: expiry });
        } catch (error) {
            return c.json({ error: "Failed to generate URL" }, 500);
        }
    }
);

// ============================================
// GET PRESIGNED UPLOAD URL
// ============================================
storageRouter.post(
    "/upload-url",
    zValidator("json", z.object({
        filename: z.string().min(1),
        folder: z.string().default("uploads"),
    })),
    async (c) => {
        const { filename, folder } = c.req.valid("json");

        const id = crypto.randomUUID();
        const ext = filename.split(".").pop() || "bin";
        const key = `${folder}/${id}.${ext}`;

        try {
            const url = await storage.getPresignedUploadUrl(key, 3600);
            return c.json({ uploadUrl: url, key, expiresIn: 3600 });
        } catch (error) {
            return c.json({ error: "Failed to generate upload URL" }, 500);
        }
    }
);

// ============================================
// LIST FILES IN FOLDER
// ============================================
storageRouter.get("/list", async (c) => {
    const prefix = c.req.query("prefix") || "";

    try {
        const files = await storage.listFiles(prefix);
        return c.json({ files, count: files.length });
    } catch (error) {
        return c.json({ error: "Failed to list files" }, 500);
    }
});

// ============================================
// LIST PROJECT FILES
// ============================================
storageRouter.get("/projects/:projectId", async (c) => {
    const projectId = c.req.param("projectId");

    try {
        const files = await storage.listFiles(`projects/${projectId}/`);

        // Organize by type
        const organized = {
            videos: files.filter((f) => f.key.includes("/videos/")),
            previews: files.filter((f) => f.key.includes("/previews/")),
            audio: files.filter((f) => f.key.includes("/audio/")),
            other: files.filter((f) => !f.key.includes("/videos/") && !f.key.includes("/previews/") && !f.key.includes("/audio/")),
        };

        return c.json({ projectId, files: organized, totalCount: files.length });
    } catch (error) {
        return c.json({ error: "Failed to list project files" }, 500);
    }
});

// ============================================
// DELETE FILE
// ============================================
storageRouter.delete("/files/:key{.+}", async (c) => {
    const key = c.req.param("key");

    try {
        await storage.deleteFile(key);
        return c.json({ message: "File deleted", key });
    } catch (error) {
        return c.json({ error: "Failed to delete file" }, 500);
    }
});

// ============================================
// CLEANUP TEMPORARY FILES
// ============================================
storageRouter.post(
    "/cleanup",
    zValidator("json", z.object({
        hoursOld: z.number().min(1).max(720).default(24),
    })),
    async (c) => {
        const { hoursOld } = c.req.valid("json");

        try {
            const deletedCount = await storage.cleanupTempFiles(hoursOld);
            return c.json({ message: "Cleanup complete", deletedCount });
        } catch (error) {
            return c.json({ error: "Failed to cleanup files" }, 500);
        }
    }
);

// ============================================
// GET CDN URL
// ============================================
storageRouter.get(
    "/cdn-url/:key{.+}",
    async (c) => {
        const key = c.req.param("key");
        const cdnDomain = process.env.CDN_DOMAIN;

        const url = storage.getCdnUrl(key, cdnDomain);
        return c.json({ url, cdnEnabled: !!cdnDomain });
    }
);

export default storageRouter;
