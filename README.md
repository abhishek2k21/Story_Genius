# Story Genius 🎬

**Story Genius** is an advanced AI-powered platform that transforms written stories into cinematic videos. By combining narrative understanding with generative video technology, it offers a complete "Script-to-Screen" workflow for creators.

## 🚀 Unique Value Propositions

1.  **Story-First Approach**: The AI understands narrative structure, not just prompts.
2.  **Thinking AI**: visualizing the agent's decision-making process (Genre, Tone, Character Arcs) before generation.
3.  **Consistent Characters**: Maintains visual identity across scenes.
4.  **Intelligent Assembly**: Cinematic transitions and pacing based on emotional context.

## 🏗️ Architecture

Story Genius involves a modern, scalable monorepo architecture powered by **Turborepo**.

### Core Applications (`/apps`)

*   **`web`**: The Director's Dashboard.
    *   **Framework**: Next.js 14 (App Router)
    *   **Styling**: Tailwind CSS, Shadcn UI
    *   **Key Features**: TipTap Story Editor, Studio Mode, Visual Customizer, Live Generation Dashboard.
*   **`api`**: The Orchestration Layer.
    *   **Framework**: Node.js / Express
    *   **Role**: Manages project state, job queues, and communicates with AI/Video services.

### Shared Packages (`/packages`)

*   **`ai`**: The Intelligence Core.
    *   Handles Prompt Engineering, LLM Integration, and Narrative Analysis.
*   **`video`**: The Production Engine.
    *   Wrappers for FFmpeg and Video Generation Models.
*   **`database`**: The Source of Truth.
    *   Prisma ORM schema and database clients (PostgreSQL).
*   **`queue`**: Asynchronous Processing.
    *   Job definitions for video rendering and AI analysis (BullMQ/Redis).
*   **`storage`**: Asset Management.
    *   Abstraction layer for handling video/image assets (S3/Local).
*   **`ui`**: Design System.
    *   Shared React components and design tokens.

## 🛠️ User Journey

1.  **Write/Import**: Users draft stories in a rich-text editor or import from URL.
2.  **Analyze**: AI "reads" the story, extracting characters, locations, and emotional beats.
3.  **Refine (Studio)**: Users review the scene breakdown, adjusting dialogue and action.
4.  **Direct**: Global visual style selection (Cinematic, Anime, etc.) and aspect ratio config.
5.  **Preview**: A/B testing mechanism to choose the best look for key scenes.
6.  **Generate**: Real-time rendering dashboard tracking scene-by-scene progress.
7.  **Result**: Engagement analytics and social-ready export suggestions.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   pnpm
*   Docker (for Redis/Postgres)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start development server
pnpm dev
```

## 🤝 Contributing
Built with ❤️ by the Story Genius Team.
