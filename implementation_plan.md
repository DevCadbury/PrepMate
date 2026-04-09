# PrepMate UI/UX Complete Redesign — Implementation Plan

## Overview

Complete UI/UX overhaul of the PrepMate EdTech SaaS platform. The redesign will establish a cohesive, professional design system and rewrite every visual component across the codebase while preserving all existing backend integrations, business logic, and the 3D avatar/live interview system.

**Tech Stack**: React 18 + TypeScript + TailwindCSS 3 + shadcn/ui + Radix primitives + Framer Motion 12 + Three.js (R3F) + Lucide icons + Monaco Editor

---

## Decisions Made (Based on User Feedback)

| Decision | Result |
|----------|--------|
| Light vs Dark mode default | **Light mode default** with dark mode toggle |
| 3D Avatar / Three.js | **KEEP and ENHANCE** — 3D character with lip sync, eye movement, video call experience |
| HeroUI removal | **YES** — Replace with shadcn/ui, fixes framer-motion conflict |
| Code editor | **Monaco Editor** (`@monaco-editor/react`) |
| Framer Motion | **Upgrade to v12** (removing HeroUI unblocks this) |

---

## Phase 1: Foundation — Design System & Dependency Cleanup

### 1A. Dependency Cleanup

#### [MODIFY] [package.json](file:///e:/backup/desktop/project/prepmate-landing/package.json)

**Remove** (conflict sources & unused UI libs):
- `@heroui/react` — source of framer-motion conflict, replaced by shadcn
- `@chakra-ui/react` — unused, replaced by shadcn
- `@emotion/react`, `@emotion/styled` — Chakra dependencies, not needed
- `@headlessui/react` — replaced by Radix primitives

**Keep** (3D avatar system — core feature):
- `@react-three/fiber` — Three.js React renderer
- `@react-three/drei` — Three.js helpers (useGLTF, Environment)
- `three` — 3D engine
- `three-mesh-bvh` — BVH acceleration
- `@types/three` — types

**Upgrade**:
- `framer-motion` → `^12.0.0` (HeroUI removal unblocks)

**Add**:
- `@radix-ui/react-switch` — toggle switches for settings
- `@radix-ui/react-slider` — sliders for voice preferences
- `@radix-ui/react-progress` — progress bars
- `@radix-ui/react-collapsible` — collapsible sidebar sections
- `react-resizable-panels` — split-pane coding layout
- `@monaco-editor/react` — code editor for coding page
- `cmdk` — command palette for global search

---

### 1B. Design System Tokens

#### [MODIFY] [tailwind.config.js](file:///e:/backup/desktop/project/prepmate-landing/tailwind.config.js)
Fix the broken dual-export config and establish the PrepMate design token system:

```
Color System:
├── Navy Primary:      #1e3a5f (900) → #2563eb (600) → #dbeafe (50)
├── Emerald Success:   #059669 (600) → #10b981 (500) → #d1fae5 (50)
├── Red Destructive:   #dc2626 (600) → #ef4444 (500) → #fee2e2 (50)
├── Amber Warning:     #d97706 (600) → #f59e0b (500) → #fef3c7 (50)
├── AI Violet:         #7c3aed (600) → #8b5cf6 (500) — AI Companion pillar
├── Coding Teal:       #0d9488 (600) → #14b8a6 (500) — Coding pillar
├── Social Blue:       #2563eb (600) → #3b82f6 (500) — Social/Feed pillar
├── Chat Amber:        #d97706 (600) → #f59e0b (500) — Chat pillar
├── Background:        #ffffff (cards), #f8fafc (app bg), #f1f5f9 (sub-bg)
└── Dark mode:         #0f172a (bg), #1e293b (cards), #334155 (elevated)

Typography:
├── Font Family: Inter (var), JetBrains Mono (code)
├── Display:    32-48px, weight 700, tracking -0.02em
├── Heading:    20-28px, weight 600
├── Body:       14-16px, weight 400
├── Caption:    12-13px, weight 500
└── Code:       14px JetBrains Mono

Spacing: 8px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
Radius:  6px (standard), 8px (cards), 12px (panels), 9999px (pills)
Shadows: sm (subtle cards), md (elevated), lg (modals), xl (dialogs)
```

#### [MODIFY] [index.css](file:///e:/backup/desktop/project/prepmate-landing/src/index.css)
- Rewrite CSS custom properties for light & dark themes
- Google Fonts import: Inter (300-700) + JetBrains Mono (400-600)
- Global transition utilities (200ms ease for all interactive elements)
- Animation keyframes: pulse-ring (AI mic active), slide-in (modals), fade-in (page transitions)
- Preserve existing chat typing indicator CSS and interview animations

---

## Phase 2: Core Layout Architecture

### Application Shell — Extract from StudentDashboard Monolith

The current `StudentDashboard.tsx` (1129 lines) will be decomposed into clean, reusable layout components.

#### [MODIFY] [StudentDashboard.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/StudentDashboard.tsx)
Slim down to ~200 lines: routing shell + state orchestration only. All rendering extracted to child components.

#### [NEW] `src/components/layout/AppSidebar.tsx`
- Fixed left sidebar (240px desktop, collapsible on mobile)
- Navigation items with icons + labels:
  - Dashboard (home icon) 
  - Feed (newspaper icon — Social Blue accent)
  - Coding (code icon — Coding Teal accent)
  - AI Companion (sparkles icon — AI Violet accent)
  - Chat (message icon — Chat Amber accent)
  - Profile (user icon)
  - Settings (gear icon)
  - Follow Requests (user-plus icon)
- Active route: navy-600 background + white text + left border indicator
- User mini-profile at bottom: avatar + name + role badge
- Smooth collapse/expand with framer-motion

#### [NEW] `src/components/layout/AppNavbar.tsx`
- Fixed top bar (64px height)
- Left: Logo + Hamburger (mobile only)
- Center: Global search with `⌘K` shortcut trigger
- Right: Contextual action button + Notification bell + User avatar dropdown
- Contextual action changes per page: "Create Post" (feed), "Start Interview" (AI), "New Problem" (coding)

#### [NEW] `src/components/layout/GlobalSearch.tsx`
- `cmdk` command palette (Linear/Notion inspired)
- Searches users, posts, questions (uses existing API calls from StudentDashboard)
- Keyboard shortcut: `Ctrl+K` / `⌘K`
- Grouped results: Users → Posts → Questions
- Recent searches

#### [NEW] `src/components/layout/NotificationPanel.tsx`
- Dropdown from bell icon
- Grouped by type with icons (follow requests=orange, likes=red, comments=green)
- Inline accept/reject actions for follow requests
- Mark all as read
- "View all" link
- All existing API calls preserved from StudentDashboard

#### [NEW] `src/components/layout/MobileBottomNav.tsx`
- Sticky bottom bar (56px, mobile only, hidden on md+)
- 4 main items: Feed, AI Companion, Coding, Profile
- Active state: filled icon + label + navy color
- Subtle top border separator

---

## Phase 3: UI Component Design System

### 3A. Update Existing shadcn Components

All components in `src/components/ui/` updated for new theme:
- `button.tsx` — Add variants: `navy`, `success`, `ai`, `coding`, `chat`, `ghost-subtle`
- `card.tsx` — 6px radius, 1px border, generous p-6 padding, subtle hover elevation
- `input.tsx` — Navy focus ring, subtle border, clean placeholder
- `badge.tsx` — Categorical pill variants: ai (violet), coding (teal), social (blue), chat (amber)
- `dialog.tsx` — Centered, backdrop blur, framer-motion entry/exit
- `tabs.tsx` — Underline variant (settings), pill variant (feeds)
- `toast.tsx` — Slide-in from top-right, colored left border indicator
- `textarea.tsx` — Auto-grow, consistent focus style
- `skeleton.tsx` — Navy-tinted shimmer animation

### 3B. Add New shadcn Components

Install via CLI:
- `switch` — toggle switches for settings page
- `slider` — voice preference controls in AI settings
- `progress` — loading states, profile completion bar
- `command` — global search palette backbone
- `collapsible` — sidebar grouped sections

### 3C. Redesign Complex Components

#### [MODIFY] [post-card.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/ui/post-card.tsx)
Full redesign of the 32KB post card:
- **Header**: Avatar (40px) + Name + @username + timestamp + ··· menu
- **Content**: Text body with link detection + expandable "Read more" for long posts
- **Media**: Image grid (1-4 images layout) + video player
- **Code**: Syntax-highlighted block with dark background + language badge
- **Action bar**: Like (❤️), Comment (💬), Share (↗️), Bookmark (🔖) — all with counts
- Bottom border separator between cards
- All existing backend bindings preserved

#### [MODIFY] [post-creator.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/ui/post-creator.tsx)
- Clean card: avatar + "What's on your mind?" clickable area
- Expands on click: full textarea + toolbar
- Toolbar: 📷 Media, `</>` Code, 📊 Poll, 🌐 Visibility selector
- Smooth expand/collapse animation

---

## Phase 4: Feature Page Redesigns

### 4A. Social & Feed

#### [MODIFY] [FeedPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/FeedPage.tsx)
- Centered vertical stream (max-w-2xl) of PostCards
- Sticky PostCreator at top
- Grid/List view toggle (top right)
- Remove dev artifacts (console.logs, "Create Test Post" button)
- Loading skeleton shimmer
- Empty state with illustration
- Infinite scroll pattern

#### [MODIFY] [ProfilePage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/ProfilePage.tsx)
- **Header section**: Gradient background strip + centered avatar (80px) + Name + Bio + Location badge
- **Stats row**: Posts | Followers | Following (clickable to expand)
- **Action buttons**: Dynamic based on relationship state from backend API:
  - Own profile → "Edit Profile" + "Share Profile"
  - Public following → "Unfollow" + "Message"
  - Public not following → "Follow" + "Message"
  - Private requested → "Requested" (cancel on click) + "Message"
  - Private not requested → "Follow" 
  - Blocked → "Blocked" indicator
- **Tab content**: Posts | Media | Bookmarks (saved)
- Privacy gating: respect `viewerPermissions` from backend

#### [MODIFY] [SettingsPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/SettingsPage.tsx)
Tabbed interface with clean form groups:

**Account Tab**:
- Profile edit (name, bio, location, company, position, DOB, gender, phone)
- Email change
- Password change
- Theme selector (light/dark/auto → maps to `preferences.account.theme`)
- Language selector (maps to `preferences.account.language`)
- 2FA toggle (maps to `preferences.account.twoFactorEnabled`)
- Delete account (destructive action with confirmation)

**Privacy Tab** (maps to `preferences.privacy.*`):
- Profile visibility: public/private/friends selector
- Show email toggle (`showEmail`)
- Show phone toggle (`showPhone`)
- Show followers toggle (`showFollowers`)
- Show following toggle (`showFollowing`)
- Show posts: public/friends/private selector (`showPosts`)
- Show likes toggle (`showLikes`)
- Allow messages: everyone/friends/none (`allowMessages`)
- Allow comments: everyone/friends/none (`allowComments`)
- Show online status toggle (`showOnlineStatus`)
- Show last seen toggle (`showLastSeen`)

**Notifications Tab** (maps to `preferences.notifications.*`):
- Email notifications toggle
- Push notifications toggle
- SMS notifications toggle
- New followers toggle
- New likes toggle
- New comments toggle
- Mentions toggle
- Achievements toggle

**AI Companion Tab**:
- Gemini API key input (secure field)
- Voice model selector (dropdown with preview)
- Voice rate/pitch/volume sliders (maps to `aiCompanion.voicePreferences`)
- API key validation status indicator

---

### 4B. AI Companion & Live Interview (3D Enhanced)

#### [MODIFY] [AICompanionPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/AICompanionPage.tsx)

**Setup Phase** (current state: IDLE):
- Clean card-based setup with categorical AI Violet accent
- Interview type selector (Behavioral / Technical / HR / Mock)
- Difficulty selector (Easy / Medium / Hard)
- Job role input
- API key input or "Use saved key" toggle
- Voice model selector with "Preview" button
- Avatar mode toggle: 3D Character / Simple Avatar
- "Start Interview" CTA button (AI Violet)

**Active Interview Phase** (LISTENING / THINKING / SPEAKING):
- **Immersive mode**: Hide main sidebar to maximize screen space
- **Main area**: 3D WebGL avatar centered, filling most of the viewport
  - Video-call style frame with dark border
  - Status bar: "Live Interview • Face-to-Face" + Connected indicator
  - State indicator: Speaking (green pulse) / Listening (blue pulse) / Thinking (yellow pulse)
- **User camera PiP**: Draggable, resizable picture-in-picture of user's camera feed
  - Face detection with "Return to camera" warning overlay
- **Audio waveform**: Pulsing ring animation around avatar when mic is active
- **Floating control bar** (bottom center, pill shape, backdrop blur):
  - 🎤 Mute / Unmute microphone
  - 📷 Toggle camera
  - 🎭 Toggle avatar mode (3D ↔ Simple)
  - ☎️ End Session (red, destructive)
- **Conversation panel** (right side, collapsible):
  - Scrollable transcript with user/AI message bubbles
  - Real-time interim transcript display
- **Feedback metrics** (collapsible sidebar or overlay):
  - Pace, filler words, sentiment history

**Post-Interview Report Phase** (ENDED):
- Summary card with scores
- Feedback panel with detailed metrics
- "Start New Interview" CTA

#### [MODIFY] [WebGLAvatar.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/interview/WebGLAvatar.tsx)
Visual redesign of the video-call frame:
- Cleaner status bar with new design system typography (Inter)
- Navy-themed status badges instead of generic black
- State indicators using categorical colors (Speaking=emerald, Listening=blue, Thinking=amber)
- Smoother camera focus transition
- Remove excessive console.log calls
- All existing lip sync, eye blink, morph target logic preserved

#### [MODIFY] Other interview components:
- `SetupScreen.tsx` — Redesign with new card/form styles
- `ConversationView.tsx` — Chat bubble redesign with new colors
- `FeedbackPanel.tsx` — Clean metric cards with progress bars
- `PostInterviewReport.tsx` — Summary report with new design system
- `SimpleAvatar.tsx` — Updated colors and animations
- `SystemStatusCheck.tsx` — Clean status list

---

### 4C. Coding & Practice

#### [MODIFY] [CodingPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/CodingPage.tsx)
Currently minimal (5KB) — full rebuild with split-pane layout:

- **Split pane** using `react-resizable-panels`:
  - **Left pane** (40%): Question description, constraints, examples, hints (collapsible), difficulty badge, tags
  - **Right pane** (60%): 
    - **Top**: Monaco code editor with dark theme (`vs-dark`), language selector, font size control
    - **Bottom** (resizable): Terminal output, test case results, run/submit status
- **Controls**: Run Code button (teal), Submit (navy), Reset
- **Status bar**: Runtime, memory, submission count

#### [MODIFY] [QuestionsPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/QuestionsPage.tsx)
- Question list table: Title, Difficulty (Easy=green, Medium=amber, Hard=red), Category, Status
- Filter bar: difficulty, category, solved/unsolved
- Search within questions
- Click row → opens CodingPage with question context

---

### 4D. Chat Interface

#### [MODIFY] [ChatPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/ChatPage.tsx)
Two-pane layout redesign of the 116KB chat page:

- **Left pane** (300px): Room list
  - Search rooms input
  - Room items: Avatar + Name + Last message preview + Timestamp + Unread badge
  - Online status green dot on avatar
  - Active room highlighted with subtle navy background
  - "New Chat" button at top
  
- **Right pane**: Active chat thread
  - **Header**: Avatar + Name + Online/Typing status + Actions (info, call, more)
  - **Messages**: Sent (navy bg, right align), Received (gray bg, left align)
  - **Timestamps**: Grouped by day with divider
  - **Typing indicator**: Use existing CSS animation (3 dots)
  - **Input bar**: Text input + Emoji picker + Attach file + Send button
  - **Message actions**: Reply, React, Delete (on hover/long-press)
- All existing Socket.io integration preserved

---

### 4E. Other Pages

#### [MODIFY] [TrendingPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/TrendingPage.tsx)
- Trending posts feed with engagement scores
- Category filter tabs (horizontal scroll)

#### [MODIFY] [FollowRequestsPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/FollowRequestsPage.tsx)
- Clean list: Avatar + Name + Username + Accept/Reject buttons
- Bulk actions: Accept All / Reject All
- Empty state with friendly illustration

#### [MODIFY] [NotificationDashboard.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/NotificationDashboard.tsx)
- Full notification page with type-based filtering
- Grouped by date

---

## Phase 5: Landing Page & Auth Flow

#### [MODIFY] [LandingPage.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/pages/LandingPage.tsx)
- Modern hero with navy gradient + floating UI mockup
- Pillar feature cards with categorical colors (AI=violet, Coding=teal, Social=blue, Chat=amber)
- Stats ribbon
- CTA sections

#### [MODIFY] [Navbar.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/Navbar.tsx)
- Landing-specific nav (transparent → solid on scroll)
- Logo + Features + Pricing + Sign In + Get Started CTA

#### [MODIFY] Auth modals: `SignInModal.tsx`, `SignUpModal.tsx`, `OnboardingForm.tsx`, `UsernameSelection.tsx`, `ResetPasswordPage.tsx`
- Clean modal designs with new design system
- Form validation states with colored feedback
- Google OAuth button with official styling

#### [MODIFY] Landing sections: `Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `Testimonials.tsx`, `Contact.tsx`, `Footer.tsx`, `FAQ.tsx`, `WhyPrepMate.tsx`, `RolePreviews.tsx`
- Complete visual redesign with new palette
- Responsive layouts with proper spacing
- Micro-animations on scroll-into-view

---

## Phase 6: Admin & Teacher Dashboards

#### [MODIFY] [TeacherDashboard.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/TeacherDashboard.tsx)
- Shared layout shell (AppSidebar + AppNavbar) with teacher-specific navigation items
- Teacher content areas

#### [MODIFY] [ModernAdminDashboard.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/ModernAdminDashboard.tsx)
- Admin layout with wider sidebar
- Overview cards: Users, Posts, Reports, Chat stats
- User management table with search + filters
- Admin-specific actions

#### [DELETE] [AdminDashboard.tsx](file:///e:/backup/desktop/project/prepmate-landing/src/components/dashboards/AdminDashboard.tsx)
- Consolidate into ModernAdminDashboard (keeping all functionality)

---

## File Change Summary

| Action | Count | Details |
|--------|-------|---------|
| **NEW** | 5 | AppSidebar, AppNavbar, GlobalSearch, NotificationPanel, MobileBottomNav |
| **MODIFY** | ~35 | All pages, all UI components, config files, interview components |
| **DELETE** | 1 | AdminDashboard.tsx (consolidated) |

---

## Verification Plan

### Build Check
```bash
npm run build    # Zero TypeScript errors
npm run dev      # Dev server starts clean
```

### Browser Route Testing
| Route | Verification |
|-------|-------------|
| `/` | Landing page with hero, features, pricing renders |
| `/feed` | Feed with PostCards, create post, like/comment works |
| `/profile` | Profile header + stats + dynamic follow buttons |
| `/profile/:username` | Other-user profile with privacy gating |
| `/settings` | 4-tab settings, all toggles map to backend correctly |
| `/ai-companion` | Setup → 3D avatar interview → report flow works |
| `/coding` | Split-pane editor with Monaco renders |
| `/chat` | Two-pane chat, messages send, typing indicator shows |
| `/trending` | Trending feed renders |
| `/follow-requests` | Accept/reject works |

### Responsive Testing
- Desktop: 1440px, 1280px
- Tablet: 768px (sidebar collapses, stacked layouts)
- Mobile: 375px (bottom nav visible, single column, hamburger menu)

### Feature Verification
- 3D avatar lip sync, eye blink, facial expressions during interview
- Camera PiP with face detection
- Speech recognition → AI response → TTS cycle
- WebSocket chat real-time messaging
- Follow/unfollow with privacy gating
- Settings persistence to backend
- Dark mode toggle
- Global search (users, posts, questions)
- Notifications with follow request actions
