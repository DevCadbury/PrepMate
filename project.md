# PrepMate Project Documentation

## 1. Project Overview

PrepMate is a full-stack AI-powered interview preparation platform built as an EdTech SaaS product. It combines interview simulation, coding practice, social learning, role-based dashboards, chat, and call workflows in a single system.

At a high level, PrepMate is designed to help learners:

- prepare for technical and behavioral interviews
- practice coding and question solving
- collaborate through community and direct chat
- track progress through profile and dashboard analytics

The system also supports teacher, HR, support, and admin workflows.

## 2. Workspace Applications

This workspace contains multiple apps and documentation bundles:

- prepmate-landing: React + TypeScript frontend application
- prepmate-backend: Node.js + Express + MongoDB backend API and Socket.IO server
- copy-of-prepmate-ai-interview-companion: additional AI interview companion code snapshot/prototype
- root documentation set: implementation notes for voice, speech, typing, social, and interview fixes

## 3. Core Product Pillars

PrepMate is built around these main pillars:

1. Authentication and role-aware access
2. AI interview companion and live mock interview experience
3. Coding and question preparation modules
4. Social network style profile/feed/follow ecosystem
5. Real-time chat and calling features
6. Settings, privacy, and personalization
7. Admin and operational management

## 4. Frontend Feature Set

### 4.1 Routing and Navigation

The frontend includes routes for:

- public landing and auth pages
- role dashboards (student, teacher, HR, support, admin)
- student social and preparation pages
- profile and settings pages
- chat and follow request management

Primary student navigation includes:

- Feed
- Trending
- Questions
- Coding
- Chat
- Follow Requests
- AI Companion
- Profile
- Settings

### 4.2 Authentication UX

Frontend auth coverage includes:

- sign in/sign up flows
- protected route handling
- Google auth callback and error flows
- username selection onboarding screen
- reset password page

### 4.3 Landing and Marketing Experience

Landing features include:

- hero section
- feature blocks
- pricing
- testimonials
- FAQ and contact sections
- responsive mobile-friendly layout

### 4.4 Student Dashboard Experience

Student dashboard acts as the shell for all user-facing preparation and social workflows.

It includes:

- top-level search
- notification polling and display
- page-level switching to feed/trending/coding/chat/profile/settings
- desktop and mobile navigation variants

### 4.5 Profile System

Profile features include:

- own profile and other-user profile views
- profile edit flow (name, bio, location, company, role, social links)
- profile image upload and preview
- follower/following dialogs with search and actions
- profile privacy gating based on relationship and privacy settings
- permission-aware UI for viewing posts/followers/following
- follow/unfollow/request states with dynamic button behavior

Recent hardening in this workspace includes:

- stale-request protection for profile and posts fetches
- route switch isolation to prevent cross-profile data bleed
- self-follow prevention in primary and dialog actions
- follow-status and privacy-permission synchronization improvements

### 4.6 Settings System

Settings page includes three major tabs:

- account settings
- privacy settings
- notification settings

Supported controls include:

- two-factor preference toggle
- profile visibility selection (public/private/friends)
- show followers/following/posts controls
- messaging/comment privacy controls
- online status and last seen controls
- email/phone visibility controls
- social notification toggles (followers/likes/comments/mentions/achievements)

Additional settings workflows:

- password change
- email change
- delete account flow
- blocked users management
- follow request management (single and bulk actions)

### 4.7 Feed and Social Content

Feed-related features include:

- post creation
- post listing and interaction
- post likes/saves/comments support (through API integration)
- post visibility and privacy filtering
- trending and discovery page integration

### 4.8 Questions and Coding

Preparation modules include:

- question listing and interview question workflows
- coding page with coding-focused practice flow
- backend endpoints for coding questions and submissions

### 4.9 AI Companion and Interview UI

AI Companion page is a major product feature with:

- interview setup and run modes
- voice interaction and speech recognition
- AI response streaming/integration
- camera/microphone workflow controls
- interview progression states
- support for advanced avatar/live interview integration patterns

### 4.10 Voice, Speech, and Accent Features

Documented and integrated voice enhancements include:

- bundled voice pack architecture with fallback chains
- Indian voice model support (multiple male/female variants)
- country/accent-aware preview flows
- improved speech recognition stability and restart handling
- microphone level monitoring and speaking detection
- auto-stop behavior to avoid overlapping voice playback

Voice system goal is resilience:

- works with browser voices when premium voices are unavailable
- supports configurable TTS providers and fallback behavior

### 4.11 Chat and Interaction UX

Chat-side frontend includes:

- room list and direct chat access
- message send/display
- typing indicator UX
- reaction UI and counts
- message actions (delete/report variants)
- media and interaction controls

### 4.12 Live Video Call Integration

Project docs include setup for live interview/call style experiences using:

- WebRTC patterns
- VSeeFace avatar pipeline
- OBS virtual camera routing

## 5. Deployment Notes

- Frontend (Vercel): use [prepmate-landing/vercel.json](prepmate-landing/vercel.json) and set any `REACT_APP_*` env vars in Vercel.
- Backend (Render): use [render.yaml](render.yaml) with `rootDir` set to `prepmate-backend` and configure `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` in Render.
- Health + uptime: `GET /api/health/uptime` exposes uptime, and the backend self-pings every 30 seconds by default (override with `SELF_PING_*` env vars).
- AI voice and response generation integration

This supports high-fidelity mock interview simulations for advanced usage scenarios.

## 5. Backend Feature Set

### 5.1 API Structure

Backend route modules include:

- auth
- admin
- student
- teacher
- social
- profile
- users
- notifications
- comments
- chat
- ai
- coding
- community
- interviews
- roadmaps
- subscriptions
- support
- analytics
- tests
- health

### 5.2 Authentication and Access Control

Backend auth stack includes:

- JWT-based auth
- role-aware authorization patterns
- Google OAuth integration
- password and account security endpoints
- token and session middleware support

### 5.3 Social Graph and Privacy Engine

Social capabilities include:

- follow/unfollow
- follow request send/accept/reject
- bulk follow request actions
- follower/following retrieval
- blocking and relationship restrictions
- follow status API

Privacy behavior is relationship-aware:

- profile visibility public/private/friends
- per-section visibility controls (followers/following/posts)
- can-message/can-comment style permission derivation
- viewerPermissions payloads returned for frontend gating

### 5.4 Posts and Social Content APIs

Social post endpoints include:

- post create/read/update/delete patterns
- per-user post retrieval with visibility filtering
- interaction support such as likes/comments/bookmarks/shares
- media handling with upload pipeline integration

### 5.5 User and Profile APIs

Profile and user services support:

- profile retrieval and update
- username-based profile lookup
- search users by name/username
- preferences update
- account-related operations

Preference persistence now supports multiple payload shapes and deep merging for compatibility with frontend settings controls.

### 5.6 Real-Time Chat and Socket Layer

Socket.IO server is initialized on backend startup and supports real-time interactions for:

- messaging flows
- typing signal propagation
- call signaling foundations
- presence and event-driven updates

### 5.7 AI Services

AI integrations include:

- interview and assistant style endpoints
- provider integrations across Gemini/OpenAI style workflows
- speech and voice related interfaces

### 5.8 Health and Reliability

Operational reliability features include:

- health routes
- structured startup logs
- MongoDB connection fallback logic
- startup guards for port conflicts
- centralized error middleware

## 6. Data and Domain Concepts

Key domain objects include:

- User (roles, preferences, social graph, profile data)
- Post (content, visibility, interactions)
- Chat rooms and messages
- Notifications
- Interview sessions
- Coding and question entities
- Roadmap/progress structures

The data model combines learning, social, and communication capabilities in a single user-centric profile.

## 7. Security and Guardrails

Security controls in the project include:

- helmet and CORS hardening
- rate limiting with route-specific policies
- input validation with express-validator and Joi patterns
- role checks and protected routes
- self-action restrictions (for example self-follow prevention)
- blocked-user interaction constraints

## 8. Testing and Diagnostics

The workspace includes many utility and test scripts across backend and root-level files.

Examples include:

- health checks
- server startup checks
- chat/socket typing tests
- message limit tests
- follow/social behavior tests
- speech and voice HTML test harnesses

This gives developers a practical toolkit for regression checks while shipping features quickly.

## 9. Developer Operations

### 9.1 Backend Run

Typical backend commands:

- npm install
- npm run dev
- npm start

### 9.2 Frontend Run

Typical frontend commands:

- npm install
- npm start
- npm run build

### 9.3 Environment

Important environment areas include:

- MongoDB connection and fallback URIs
- JWT and session secrets
- OAuth credentials
- AI provider keys
- Cloudinary and other media/service credentials

## 10. Feature Summary by Role

### Student

- onboarding and auth
- social learning (feed, trending, profile network)
- questions and coding preparation
- AI companion interview workflows
- chat and call interactions
- full privacy/settings controls

### Teacher and HR

- dashboard access for role-based management and workflows
- shared teacher dashboard patterns for HR/support variants in current routing

### Support

- support-oriented dashboard routing and tools

### Admin

- legacy and modern admin dashboard variants
- platform-level management pathways

## 11. Current Product Strengths

PrepMate currently stands out by combining:

- preparation + community + communication in one product
- deep privacy-aware social profile system
- robust voice and interview experimentation layer
- strong real-time chat and interaction focus
- practical test scripts and implementation notes for rapid iteration

## 12. Current Known Gaps and Technical Debt

Based on current repository state:

- there are existing lint warnings in multiple frontend files
- some flows are implemented in both users/social route surfaces and should stay behaviorally aligned
- some advanced voice/call features are integration-heavy and depend on local environment setup

These do not block core product operation but should be part of ongoing hardening.

## 13. Recommended Next Documentation Additions

To evolve this project.md further, you can add:

1. endpoint-by-endpoint API contract tables per route file
2. ER diagram for major MongoDB models
3. role-based permission matrix for every page and action
4. production deployment blueprint (frontend + backend + media + AI services)
5. regression test checklist mapped to each critical feature

---

This document captures the full working feature landscape of PrepMate in this workspace as of April 2026.