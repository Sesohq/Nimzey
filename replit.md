# Nimzey - AI-Powered Design Feedback Application

## Overview
Nimzey is an AI-powered web application that provides expert-level design feedback using OpenAI's GPT-4 Vision API. Users upload design images (posters, layouts, ads, UI designs) and receive critiques with visual annotations, heatmaps, and genre-aware analysis. The application offers structured feedback, instant visual scores, and the ability to compare designs against curated references. Nimzey aims to provide actionable, professional-grade design critiques, helping users improve their visual content across various contexts like marketing, branding, and personal portfolios.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design Theme**: Premium SaaS UI with glass-morphism effects, gradient backgrounds (violet/cyan), and modern card layouts.
- **Interactive Elements**: Animated SVG gradient rings for instant scores, hover effects, custom scrollbars.
- **Feedback Display**: Unified image viewer with view mode toggles (Annotations/Heatmap), sticky right sidebar for issues breakdown.
- **Responsiveness**: Optimized for desktop with `lg:grid-cols-[2fr_1fr]` and single-column for mobile.
- **Instant Visual Scores**: 4 circular score indicators (Layout, Aesthetics, Copy, Color) with a 1-99 scale, color-coded circles, and hover tooltips.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui (Radix UI), Tailwind CSS, TanStack Query, Wouter.
- **Backend**: Node.js, Express.js, TypeScript, ES modules.
- **Image Processing**: Sharp for optimization (resize to 1024x1024, quality optimization) and Base64 encoding.
- **AI Integration**:
    - **Design Analysis**: GPT-4 Vision API for layout, spacing, hierarchy, and stylistic alignment critique.
    - **Visual Annotations**: GPT-4 Vision generates precise coordinates for issue locations.
    - **Genre-Aware Critique**: Identifies design genres (e.g., Sports Tribute, Minimalist) and applies context-specific evaluation criteria.
    - **Context-Aware Scoring**: Two-stage algorithm for design type classification and context-specific rubrics.
    - **Reference-Based Critique**: Compares user uploads against curated references from Supabase.
    - **Actionable Feedback**: Provides specific measurements, reasons for scores, top 3 fixes, and an "Advisor Note."
    - **Intent Selector**: Allows users to specify design purpose and goal for tailored feedback.

### System Design Choices
- **Database**: PostgreSQL with Drizzle ORM (Neon Database for serverless hosting).
- **Schema Management**: Drizzle Kit for migrations and schema synchronization.
- **File Upload**: Multer for backend, native HTML5 with drag-and-drop for frontend.
- **Data Flow**: User uploads image -> Frontend validation/processing -> AI analysis via OpenAI Vision API -> Structured feedback storage -> Results display.
- **Deployment**: Vite for frontend builds, ESBuild for backend, environment variable configuration for API keys and database.

## External Dependencies
- **OpenAI API**: GPT-4 Vision (design analysis, visual annotations), DALL-E 3 (design generation - *note: generation feature is no longer active*).
- **Neon Database**: Serverless PostgreSQL hosting.
- **Radix UI**: Accessible component primitives.
- **TanStack Query**: Server state management and caching.
- **Supabase**: For fetching curated poster references.
- **Drizzle Kit**: Database schema management.
- **Sharp**: Image processing library (also used for binary mask generation).
- **Multer**: Middleware for handling multipart form data.
- **Wouter**: Lightweight client-side routing.

## Recent Changes
- December 16, 2025. Added user authentication and past reviews tracking:
  - Replit Auth integration with OIDC for user login/logout
  - Users table with id, email, firstName, lastName, profileImageUrl fields
  - Design analyses linked to user accounts via userId field
  - Header shows Sign In button when not logged in, user profile + logout when authenticated
  - Past Reviews panel (slide-out from right) showing user's previous analyses
  - Past reviews display includes thumbnail, score, genre badge, and date
  - Click on past review to reload that analysis
  - New /api/my-analyses endpoint (authenticated) returns user's design analyses
  - PostgreSQL session storage for persistent login sessions

- December 16, 2025. Removed Vision Fix feature (click-to-fix annotations) - feature was non-functional.