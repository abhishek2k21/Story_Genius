import { Hono } from "hono";
import { db } from "@repo/database";
import { users } from "@repo/database";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthContext } from "../middleware/auth";

const userRoutes = new Hono();

// All user routes require authentication
userRoutes.use("*", authMiddleware);

/**
 * Get current user's profile
 */
userRoutes.get("/me", async (c) => {
    const auth = c.get("auth") as AuthContext;

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        // User signed in via Clerk but not yet synced to DB
        // This can happen if webhook hasn't fired yet
        return c.json({
            error: "User not found",
            message: "Please wait a moment and try again, or sign out and sign back in",
        }, 404);
    }

    return c.json({
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            avatarUrl: dbUser.avatarUrl,
            planTier: dbUser.planTier,
            creditsRemaining: dbUser.creditsRemaining,
            createdAt: dbUser.createdAt,
        },
    });
});

/**
 * Update current user's profile
 */
userRoutes.patch("/me", async (c) => {
    const auth = c.get("auth") as AuthContext;
    const body = await c.req.json<{
        name?: string;
    }>();

    const [updatedUser] = await db.update(users)
        .set({
            name: body.name?.trim(),
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, auth.clerkId))
        .returning();

    if (!updatedUser) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json({
        user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            avatarUrl: updatedUser.avatarUrl,
            planTier: updatedUser.planTier,
            creditsRemaining: updatedUser.creditsRemaining,
        },
    });
});

/**
 * Get user's credit balance
 */
userRoutes.get("/me/credits", async (c) => {
    const auth = c.get("auth") as AuthContext;

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
        columns: {
            creditsRemaining: true,
            planTier: true,
        },
    });

    if (!dbUser) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json({
        credits: dbUser.creditsRemaining,
        planTier: dbUser.planTier,
    });
});

export { userRoutes };
