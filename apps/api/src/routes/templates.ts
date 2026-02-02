import { Hono } from "hono";
import { db, templates } from "@repo/database";
import { eq, asc } from "drizzle-orm";

const templatesRouter = new Hono();

// Get all templates
templatesRouter.get("/", async (c) => {
    try {
        const allTemplates = await db
            .select()
            .from(templates)
            .orderBy(asc(templates.name));

        return c.json({ templates: allTemplates });
    } catch (error) {
        console.error("Error fetching templates:", error);
        return c.json({ error: "Failed to fetch templates" }, 500);
    }
});

// Get template by ID
templatesRouter.get("/:id", async (c) => {
    const id = c.req.param("id");

    try {
        const [template] = await db
            .select()
            .from(templates)
            .where(eq(templates.id, id));

        if (!template) {
            return c.json({ error: "Template not found" }, 404);
        }

        return c.json({ template });
    } catch (error) {
        console.error("Error fetching template:", error);
        return c.json({ error: "Failed to fetch template" }, 500);
    }
});

// Get templates by genre
templatesRouter.get("/genre/:genre", async (c) => {
    const genre = c.req.param("genre");

    try {
        const genreTemplates = await db
            .select()
            .from(templates)
            .where(eq(templates.genre, genre))
            .orderBy(asc(templates.name));

        return c.json({ templates: genreTemplates });
    } catch (error) {
        console.error("Error fetching templates by genre:", error);
        return c.json({ error: "Failed to fetch templates" }, 500);
    }
});

export { templatesRouter };
