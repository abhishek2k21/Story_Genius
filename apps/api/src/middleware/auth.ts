import { Context, Next } from "hono";
import { verifyToken } from "@clerk/backend";

export interface AuthContext {
    userId: string;
    sessionId: string;
    clerkId: string;
}

/**
 * Clerk authentication middleware for Hono
 * Validates JWT tokens and attaches user context to requests
 */
export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    // DEVELOPMENT BYPASS
    const bypassHeader = c.req.header("x-bypass-auth");
    if (process.env.NODE_ENV !== "production" && bypassHeader === "true") {
        console.warn("⚠️ AUTH BYPASS: Dev mode bypass active");
        c.set("auth", {
            userId: "00000000-0000-0000-0000-000000000001",
            sessionId: "test-session-id",
            clerkId: "00000000-0000-0000-0000-000000000001",
        } as AuthContext);
        await next();
        return;
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized", message: "Missing or invalid authorization header" }, 401);
    }

    const token = authHeader.substring(7);
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
        console.error("CLERK_SECRET_KEY not configured");
        return c.json({ error: "Server configuration error" }, 500);
    }

    try {
        const payload = await verifyToken(token, {
            secretKey,
        });

        if (!payload || !payload.sub) {
            return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
        }

        // Attach auth context to the request
        c.set("auth", {
            userId: payload.sub,
            sessionId: payload.sid || "",
            clerkId: payload.sub,
        } as AuthContext);

        await next();
    } catch (error) {
        console.error("Auth verification failed:", error);
        return c.json({ error: "Unauthorized", message: "Token verification failed" }, 401);
    }
}

/**
 * Optional auth middleware - doesn't fail if no token present
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        c.set("auth", null);
        await next();
        return;
    }

    // If token present, validate it
    return authMiddleware(c, next);
}
