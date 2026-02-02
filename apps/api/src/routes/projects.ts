import { Hono } from "hono";
import { db } from "@repo/database";
import { projects, stories, scenes } from "@repo/database";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthContext } from "../middleware/auth";
import { users } from "@repo/database";

const projectRoutes = new Hono();

// All project routes require authentication
projectRoutes.use("*", authMiddleware);

/**
 * Get all projects for the authenticated user
 */
projectRoutes.get("/", async (c) => {
    const auth = c.get("auth") as AuthContext;

    // First get the database user ID from Clerk ID
    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        return c.json({ error: "User not found in database" }, 404);
    }

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, dbUser.id),
        orderBy: desc(projects.updatedAt),
    });

    return c.json({
        projects: userProjects,
        total: userProjects.length,
    });
});

/**
 * Get a single project by ID
 */
projectRoutes.get("/:id", async (c) => {
    const auth = c.get("auth") as AuthContext;
    const projectId = c.req.param("id");

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        return c.json({ error: "User not found" }, 404);
    }

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
            // Include related data if needed
        },
    });

    if (!project) {
        return c.json({ error: "Project not found" }, 404);
    }

    // Verify ownership
    if (project.userId !== dbUser.id) {
        return c.json({ error: "Forbidden" }, 403);
    }

    return c.json({ project });
});

/**
 * Create a new project
 */
projectRoutes.post("/", async (c) => {
    const auth = c.get("auth") as AuthContext;
    const body = await c.req.json<{
        title: string;
        description?: string;
        settings?: Record<string, unknown>;
    }>();

    if (!body.title || body.title.trim().length === 0) {
        return c.json({ error: "Title is required" }, 400);
    }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        return c.json({ error: "User not found" }, 404);
    }

    const [newProject] = await db.insert(projects).values({
        userId: dbUser.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        settings: body.settings || {},
    }).returning();

    return c.json({ project: newProject }, 201);
});

/**
 * Update a project
 */
projectRoutes.patch("/:id", async (c) => {
    const auth = c.get("auth") as AuthContext;
    const projectId = c.req.param("id");
    const body = await c.req.json<{
        title?: string;
        description?: string;
        settings?: Record<string, unknown>;
        isPublic?: boolean;
    }>();

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        return c.json({ error: "User not found" }, 404);
    }

    // Verify ownership
    const existingProject = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!existingProject || existingProject.userId !== dbUser.id) {
        return c.json({ error: "Project not found" }, 404);
    }

    const [updatedProject] = await db.update(projects)
        .set({
            title: body.title?.trim() || existingProject.title,
            description: body.description?.trim() ?? existingProject.description,
            settings: body.settings ?? existingProject.settings,
            isPublic: body.isPublic ?? existingProject.isPublic,
            updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();

    return c.json({ project: updatedProject });
});

/**
 * Delete a project
 */
projectRoutes.delete("/:id", async (c) => {
    const auth = c.get("auth") as AuthContext;
    const projectId = c.req.param("id");

    const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, auth.clerkId),
    });

    if (!dbUser) {
        return c.json({ error: "User not found" }, 404);
    }

    // Verify ownership
    const existingProject = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!existingProject || existingProject.userId !== dbUser.id) {
        return c.json({ error: "Project not found" }, 404);
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    return c.json({ deleted: true });
});

export { projectRoutes };
