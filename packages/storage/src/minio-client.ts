import { Client as MinioClient } from "minio";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";

export interface StorageConfig {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export interface UploadResult {
    id: string;
    bucket: string;
    key: string;
    url: string;
    size: number;
    contentType: string;
    createdAt: Date;
}

export interface FileMetadata {
    id: string;
    key: string;
    size: number;
    contentType: string;
    lastModified: Date;
}

/**
 * MinIO Storage Client for file management
 */
export class StorageClient {
    private client: MinioClient;
    private bucket: string;
    private publicUrl: string;

    constructor(config: StorageConfig) {
        this.client = new MinioClient({
            endPoint: config.endPoint,
            port: config.port,
            useSSL: config.useSSL,
            accessKey: config.accessKey,
            secretKey: config.secretKey,
        });
        this.bucket = config.bucket;
        this.publicUrl = `http${config.useSSL ? "s" : ""}://${config.endPoint}:${config.port}/${config.bucket}`;
    }

    /**
     * Initialize bucket if it doesn't exist
     */
    async ensureBucket(): Promise<void> {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket, "us-east-1");
            console.log(`✅ Created bucket: ${this.bucket}`);
        }
    }

    /**
     * Upload a file from buffer
     */
    async uploadBuffer(
        buffer: Buffer,
        originalName: string,
        folder: string = "uploads"
    ): Promise<UploadResult> {
        const id = uuidv4();
        const ext = originalName.split(".").pop() || "bin";
        const key = `${folder}/${id}.${ext}`;
        const contentType = mime.lookup(originalName) || "application/octet-stream";

        await this.client.putObject(this.bucket, key, buffer, buffer.length, {
            "Content-Type": contentType,
            "x-amz-meta-original-name": originalName,
            "x-amz-meta-upload-id": id,
        });

        return {
            id,
            bucket: this.bucket,
            key,
            url: `${this.publicUrl}/${key}`,
            size: buffer.length,
            contentType,
            createdAt: new Date(),
        };
    }

    /**
     * Upload a file from stream (for large files)
     */
    async uploadStream(
        stream: NodeJS.ReadableStream,
        originalName: string,
        size: number,
        folder: string = "uploads"
    ): Promise<UploadResult> {
        const id = uuidv4();
        const ext = originalName.split(".").pop() || "bin";
        const key = `${folder}/${id}.${ext}`;
        const contentType = mime.lookup(originalName) || "application/octet-stream";

        await this.client.putObject(this.bucket, key, stream, size, {
            "Content-Type": contentType,
            "x-amz-meta-original-name": originalName,
            "x-amz-meta-upload-id": id,
        });

        return {
            id,
            bucket: this.bucket,
            key,
            url: `${this.publicUrl}/${key}`,
            size,
            contentType,
            createdAt: new Date(),
        };
    }

    /**
     * Upload video file with organized path
     */
    async uploadVideo(
        buffer: Buffer,
        projectId: string,
        sceneId: string,
        variant: string = "final"
    ): Promise<UploadResult> {
        const id = uuidv4();
        const key = `projects/${projectId}/scenes/${sceneId}/videos/${variant}-${id}.mp4`;
        const contentType = "video/mp4";

        await this.client.putObject(this.bucket, key, buffer, buffer.length, {
            "Content-Type": contentType,
            "x-amz-meta-project-id": projectId,
            "x-amz-meta-scene-id": sceneId,
            "x-amz-meta-variant": variant,
        });

        return {
            id,
            bucket: this.bucket,
            key,
            url: `${this.publicUrl}/${key}`,
            size: buffer.length,
            contentType,
            createdAt: new Date(),
        };
    }

    /**
     * Upload preview image
     */
    async uploadPreview(
        buffer: Buffer,
        projectId: string,
        sceneId: string,
        style: "A" | "B" | "C" | "D"
    ): Promise<UploadResult> {
        const id = uuidv4();
        const key = `projects/${projectId}/scenes/${sceneId}/previews/style-${style}-${id}.jpg`;
        const contentType = "image/jpeg";

        await this.client.putObject(this.bucket, key, buffer, buffer.length, {
            "Content-Type": contentType,
            "x-amz-meta-project-id": projectId,
            "x-amz-meta-scene-id": sceneId,
            "x-amz-meta-style": style,
        });

        return {
            id,
            bucket: this.bucket,
            key,
            url: `${this.publicUrl}/${key}`,
            size: buffer.length,
            contentType,
            createdAt: new Date(),
        };
    }

    /**
     * Generate presigned URL for download (time-limited)
     */
    async getPresignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
        return await this.client.presignedGetObject(this.bucket, key, expirySeconds);
    }

    /**
     * Generate presigned URL for upload
     */
    async getPresignedUploadUrl(key: string, expirySeconds: number = 3600): Promise<string> {
        return await this.client.presignedPutObject(this.bucket, key, expirySeconds);
    }

    /**
     * Get file metadata
     */
    async getFileMetadata(key: string): Promise<FileMetadata | null> {
        try {
            const stat = await this.client.statObject(this.bucket, key);
            return {
                id: stat.metaData?.["x-amz-meta-upload-id"] || key,
                key,
                size: stat.size,
                contentType: stat.metaData?.["content-type"] || "application/octet-stream",
                lastModified: stat.lastModified,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Download file as buffer
     */
    async downloadBuffer(key: string): Promise<Buffer> {
        const stream = await this.client.getObject(this.bucket, key);
        const chunks: Buffer[] = [];

        return new Promise((resolve, reject) => {
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);
        });
    }

    /**
     * Delete a file
     */
    async deleteFile(key: string): Promise<void> {
        await this.client.removeObject(this.bucket, key);
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(keys: string[]): Promise<void> {
        await this.client.removeObjects(this.bucket, keys);
    }

    /**
     * List files in a folder
     */
    async listFiles(prefix: string): Promise<FileMetadata[]> {
        const files: FileMetadata[] = [];
        const stream = this.client.listObjects(this.bucket, prefix, true);

        return new Promise((resolve, reject) => {
            stream.on("data", (obj) => {
                if (obj.name) {
                    files.push({
                        id: obj.name,
                        key: obj.name,
                        size: obj.size || 0,
                        contentType: "unknown",
                        lastModified: obj.lastModified || new Date(),
                    });
                }
            });
            stream.on("end", () => resolve(files));
            stream.on("error", reject);
        });
    }

    /**
     * Cleanup temporary files older than specified hours
     */
    async cleanupTempFiles(hoursOld: number = 24): Promise<number> {
        const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
        const tempFiles = await this.listFiles("temp/");

        const toDelete = tempFiles
            .filter((f) => f.lastModified < cutoff)
            .map((f) => f.key);

        if (toDelete.length > 0) {
            await this.deleteFiles(toDelete);
        }

        console.log(`🧹 Cleaned up ${toDelete.length} temporary files`);
        return toDelete.length;
    }

    /**
     * Get CDN-ready URL (can be customized for CloudFlare integration)
     */
    getCdnUrl(key: string, cdnDomain?: string): string {
        if (cdnDomain) {
            return `https://${cdnDomain}/${key}`;
        }
        return `${this.publicUrl}/${key}`;
    }
}

/**
 * Create storage client from environment variables
 */
export function createStorageClient(): StorageClient {
    return new StorageClient({
        endPoint: process.env.MINIO_ENDPOINT || "localhost",
        port: parseInt(process.env.MINIO_PORT || "9000"),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ACCESS_KEY || "storygenius",
        secretKey: process.env.MINIO_SECRET_KEY || "storygenius123",
        bucket: process.env.MINIO_BUCKET || "storygenius-assets",
    });
}
