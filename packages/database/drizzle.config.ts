import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://storygenius:storygenius@localhost:5433/storygenius",
    },
});
