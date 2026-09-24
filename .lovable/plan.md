# AI Workplace Productivity Assistant

## Overview
Build a responsive frontend-only productivity workspace at `/` with a professional light-purple, white, and sky-blue visual system. All “AI” actions will run locally using deterministic response templates, so the prototype remains fully usable without accounts, storage, APIs, or a backend.

## Experience
- Responsive sidebar with Dashboard, Email Generator, Meeting Summariser, AI Assistant, and Settings.
- Desktop navigation remains visible; mobile uses a compact header and slide-over menu.
- Dashboard shows feature launch cards and recent activity generated during the current browser session.
- Consistent empty, loading, success, and error states with subtle transitions.
- Persistent disclaimer in the interface: “AI-generated content may contain errors. Review outputs before using them for workplace decisions or communication.”

## Feature flows
- **Email Generator:** purpose, recipient/context, key points, and tone selector; local generation with editable output, Copy, and Regenerate.
- **Meeting Summariser:** large notes field; local extraction into editable Summary, Action Items, Decisions, Deadlines, and Key Points; copy actions.
- **AI Assistant:** one session-only conversation, suggested prompts, context-aware local responses for writing, planning, summarising, brainstorming, and productivity.
- **Settings:** lightweight prototype preferences such as default email tone and response style, held only for the current session.

## Technical approach
- Use reusable React components and a view-based dashboard shell within the existing TanStack Start index page.
- Install and compose the AI Elements conversation, message, prompt-input, and shimmer primitives for the chat surface.
- Keep all functionality in the browser; no server route, database, authentication, external API, or localStorage.
- Define the full semantic design system in `src/styles.css` using OKLCH tokens and Tailwind utilities.
- Add route-specific title, description, Open Graph, and Twitter metadata.
- Verify desktop and mobile layouts, interactions, copy/edit flows, loading states, and current build diagnostics.
