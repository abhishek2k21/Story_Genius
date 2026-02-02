import { pgTable, uuid, text, integer, timestamp, jsonb, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const analyses = pgTable("analyses", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),

    // Core analysis fields
    genre: text("genre").notNull(),
    subGenre: text("sub_genre"),
    tone: text("tone").notNull(),
    mood: text("mood").notNull(),
    pacing: text("pacing").notNull(), // slow, moderate, fast, variable
    themes: jsonb("themes").$type<string[]>().notNull().default([]),
    targetAudience: text("target_audience"),

    // Emotional arc (array of emotion points)
    emotionalArc: jsonb("emotional_arc").$type<Array<{
        position: number;
        emotion: string;
        intensity: number;
        description: string;
    }>>().notNull().default([]),

    // Key moments in the story
    keyMoments: jsonb("key_moments").$type<Array<{
        position: number;
        description: string;
        importance: number;
        sceneType: string;
    }>>().notNull().default([]),

    // Metadata
    analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const analysesRelations = relations(analyses, ({ one, many }) => ({
    project: one(projects, {
        fields: [analyses.projectId],
        references: [projects.id],
    }),
    storyCharacters: many(storyCharacters),
    locations: many(locations),
}));

export const storyCharacters = pgTable("story_characters", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id")
        .references(() => analyses.id, { onDelete: "cascade" }),

    // Character identity
    name: text("name").notNull(),
    physicalDescription: text("physical_description").notNull(),

    // Character traits
    personality: jsonb("personality").$type<string[]>().notNull().default([]),
    role: text("role").notNull(), // protagonist, antagonist, supporting, minor
    emotionalState: text("emotional_state"),
    age: text("age"),
    clothing: text("clothing"),
    distinctiveFeatures: jsonb("distinctive_features").$type<string[]>().default([]),

    // Analysis-specific
    relationships: jsonb("relationships").$type<Array<{
        characterId: number;
        characterName: string;
        type: string; // friend, enemy, family, romantic, etc.
        description: string;
    }>>().default([]),
    screenTimeEstimate: integer("screen_time_estimate"), // Percentage 0-100

    // Embeddings for similarity search
    embedding: vector("embedding", { dimensions: 768 }),

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storyCharactersRelations = relations(storyCharacters, ({ one }) => ({
    project: one(projects, {
        fields: [storyCharacters.projectId],
        references: [projects.id],
    }),
    analysis: one(analyses, {
        fields: [storyCharacters.analysisId],
        references: [analyses.id],
    }),
}));

export const locations = pgTable("locations", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id")
        .references(() => analyses.id, { onDelete: "cascade" }),

    // Location details
    name: text("name").notNull(),
    type: text("type").notNull(), // interior, exterior, natural, urban, etc.
    description: text("description").notNull(),

    // World-building
    timePeriod: text("time_period"), // e.g., "Modern day", "Medieval", "2150 AD"
    atmosphere: text("atmosphere"), // e.g., "Tense", "Peaceful", "Chaotic"
    weather: text("weather"),

    // Additional details
    worldBuildingNotes: text("world_building_notes"),

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const locationsRelations = relations(locations, ({ one }) => ({
    project: one(projects, {
        fields: [locations.projectId],
        references: [projects.id],
    }),
    analysis: one(analyses, {
        fields: [locations.analysisId],
        references: [analyses.id],
    }),
}));
