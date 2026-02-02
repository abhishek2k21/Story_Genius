import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ||
    "postgresql://storygenius:storygenius@localhost:5433/storygenius";

// Singleton pattern for database connection
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb() {
    if (dbInstance) return dbInstance;

    const client = postgres(connectionString, {
        max: 10, // Connection pool size
        idle_timeout: 20,
        connect_timeout: 10,
    });

    dbInstance = drizzle(client, { schema });
    return dbInstance;
}

// Create drizzle database instance
export const db = createDb();

export type Database = typeof db;

