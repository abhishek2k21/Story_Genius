import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { authMiddleware } from "../middleware/auth";

const importRouter = new Hono();

// Schema validations
const textImportSchema = z.object({
    text: z.string().min(1, "Text content is required"),
});

const urlImportSchema = z.object({
    url: z.string().url("Invalid URL"),
});

// Import from pasted text
importRouter.post(
    "/import/text",
    authMiddleware,
    zValidator("json", textImportSchema),
    async (c) => {
        const { text } = c.req.valid("json");

        // Convert plain text to HTML paragraphs
        const paragraphs = text
            .split(/\n\n+/)
            .filter((p) => p.trim())
            .map((p) => `<p>${p.trim()}</p>`)
            .join("\n");

        return c.json({
            content: paragraphs,
            wordCount: text.split(/\s+/).filter(Boolean).length,
            source: "paste",
        });
    }
);

// Import from file upload (TXT, DOCX)
importRouter.post("/import/file", authMiddleware, async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return c.json({ error: "No file provided" }, 400);
        }

        const fileName = file.name.toLowerCase();
        let content = "";

        if (fileName.endsWith(".txt")) {
            // Plain text file
            content = await file.text();
            // Convert to HTML paragraphs
            content = content
                .split(/\n\n+/)
                .filter((p) => p.trim())
                .map((p) => `<p>${p.trim()}</p>`)
                .join("\n");
        } else if (fileName.endsWith(".docx")) {
            // DOCX file
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });
            content = result.value;
        } else {
            return c.json({ error: "Unsupported file format. Use TXT or DOCX." }, 400);
        }

        // Count words from plain text
        const plainText = content.replace(/<[^>]*>/g, " ");
        const wordCount = plainText.split(/\s+/).filter(Boolean).length;

        return c.json({
            content,
            wordCount,
            source: `file:${file.name}`,
        });
    } catch (error) {
        console.error("Error parsing file:", error);
        return c.json({ error: "Failed to parse file" }, 500);
    }
});

// Import from URL (web scraping)
importRouter.post(
    "/import/url",
    authMiddleware,
    zValidator("json", urlImportSchema),
    async (c) => {
        const { url } = c.req.valid("json");

        try {
            // Fetch the URL content
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; StoryGenius/1.0)",
                },
            });

            if (!response.ok) {
                return c.json({ error: "Failed to fetch URL" }, 400);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Remove script, style, nav, header, footer, aside elements
            $("script, style, nav, header, footer, aside, .ad, .sidebar, .comments").remove();

            // Try to find the main content
            let mainContent = "";
            const title = $("title").text().trim();

            // Common content selectors
            const contentSelectors = [
                "article",
                ".story-content",
                ".post-content",
                ".entry-content",
                ".article-body",
                ".story",
                "main",
                ".content",
                "#content",
            ];

            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    mainContent = element.html() || "";
                    break;
                }
            }

            // Fallback to body if no content found
            if (!mainContent) {
                mainContent = $("body").html() || "";
            }

            // Clean up the content
            const $content = cheerio.load(mainContent);
            $content("script, style, nav, header, footer, aside").remove();

            // Get paragraphs
            const paragraphs: string[] = [];
            $content("p, h1, h2, h3, h4, h5, h6").each((_, el) => {
                const text = $content(el).text().trim();
                if (text.length > 0) {
                    const tagName = el.tagName.toLowerCase();
                    if (tagName.startsWith("h")) {
                        paragraphs.push(`<${tagName}>${text}</${tagName}>`);
                    } else {
                        paragraphs.push(`<p>${text}</p>`);
                    }
                }
            });

            const content = paragraphs.join("\n");
            const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

            return c.json({
                content,
                wordCount,
                title,
                source: `url:${url}`,
            });
        } catch (error) {
            console.error("Error scraping URL:", error);
            return c.json({ error: "Failed to scrape URL content" }, 500);
        }
    }
);

export { importRouter };
