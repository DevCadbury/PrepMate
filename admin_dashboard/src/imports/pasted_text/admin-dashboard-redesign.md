You are an expert UI/UX designer, frontend architect, and moderation-system specialist.

Your task is to **redesign and enhance multiple admin pages** into a **clean, structured, high-performance moderation dashboard**.

Pages included:

1. Content Management (Posts)
2. Reported Content Review
3. Reports Management
4. Coding Platform (Problems & Submissions)

---

## Core Principles (VERY IMPORTANT)

* Avoid clutter → use layered UI (tables → drawers → tabs)
* Avoid generic or “AI-looking” UI
* Focus on **readability, hierarchy, and fast moderation workflows**
* Reduce cognitive load for admins handling large volumes
* Use **progressive disclosure** (don’t show everything at once)

---

# 1. Content Management Page (Posts)

## Current Problems:

* Flat table, low visibility
* Flagged content not clearly prioritized
* No quick moderation workflow

---

## Improvements:

### A. Smart Table UI

Enhance table with:

* Post preview (title + 1-line snippet)
* Author avatar + name
* Status badges:

  * Published (neutral)
  * Flagged (highlighted)
* Flags count as **clickable badge**
* Views (de-emphasized)

---

### B. Priority Highlighting

* Show banner:
  👉 “2 flagged posts need review”
* Auto-sort flagged content on top (optional toggle)

---

### C. Row Interaction

On click → open **Post Review Drawer**

---

# 2. Reported Content Review (MAJOR REDESIGN)

## Replace current cluttered UI with structured layout

### A. Split Layout (IMPORTANT)

Left:

* Content preview

Right:

* Reports + actions

---

### B. Content Section

* Title
* Full content (expandable)
* Metadata:

  * Views
  * Likes
  * Comments
  * Shares

---

### C. Reports Section

Group reports:

* Reporter info
* Reason
* Time

👉 Highlight:

* Repeated reasons
* Severity

---

### D. Action Panel (Sticky)

Actions:

* Approve Content
* Remove Content
* Warn User
* Ban User

#### Add:

* Reason input (required)
* Action preview (“This will remove the post and notify user”)

---

### E. UX Improvements

* Use tabs:

  * Content
  * Reports
  * History

* Avoid long vertical scrolling

* Make decisions fast and clear

---

# 3. Reports Management Page

## Current Issues:

* Too dense
* Hard to scan
* Weak prioritization

---

## Improvements:

### A. Enhanced Table

Columns:

* Reporter (with avatar)
* Target (user/post)
* Reason (short + expandable)
* Severity (badge)
* Status (pending/approved/rejected)
* Created

---

### B. Filters (Top Bar)

* Severity (High / Medium / Low)
* Status (Pending / Resolved)
* Type (User / Post)

---

### C. Row Click → Report Detail Drawer

#### Show:

* Full report details
* Related content/user
* Previous reports on same target

---

### D. Bulk Actions

* Approve multiple
* Reject multiple

---

### E. Severity System

* High → red indicator (subtle)
* Medium → neutral
* Low → muted

---

# 4. Coding Platform UI (Problems & Submissions)

## Current Issues:

* Flat listing
* Weak hierarchy
* No deep management tools

---

## Improvements:

### A. Problems Table Enhancement

Columns:

* Title
* Difficulty (color-coded but subtle)
* Category
* Tags (clean chips)
* Solved / Attempted (progress-style)
* Status

---

### B. Problem Click → Problem Detail Workspace

Open in:

* Tab or full page

---

### C. Problem Detail Layout

Tabs:

#### 1. Overview

* Title
* Description
* Constraints
* Examples

#### 2. Test Cases

* Input / Output pairs
* Hidden vs visible toggle
* Add/edit UI

#### 3. Submissions

* User submissions
* Status (accepted, failed)
* Runtime / memory

#### 4. Analytics

* Solve rate
* Attempt trends

---

### D. Add New Problem UI

* Split layout:

  * Left → editor
  * Right → preview

* Sections:

  * Problem statement
  * Tags
  * Difficulty
  * Test cases

---

# 5. Cross-System UX Improvements

---

## A. Unified Moderation Flow

* Same pattern everywhere:

  * Table → Drawer → Action

---

## B. Notifications

* Toast:

  * “Content removed”
  * “Report resolved”

* Dialog:

  * Confirmation before destructive actions

---

## C. Visual System

* Minimal color palette
* Strong spacing
* Clear typography hierarchy

---

## D. Interaction Design

* Hover → quick actions
* Click → deep view
* Tabs → organization
* Drawers → details

---

# 6. Component Architecture

Create reusable components:

* DataTable
* StatusBadge
* SeverityBadge
* ContentPreviewCard
* ReportDrawer
* ModerationActionPanel
* ProblemEditor
* TestCaseManager
* SubmissionTable

---

# 7. Data Structure

Define models for:

* Post
* Report
* ModerationAction
* CodingProblem
* TestCase
* Submission

---

# 8. Code Requirements

Provide:

* React (or preferred framework) components
* Table + drawer implementation
* Example:

  * Report review panel
  * Content moderation flow
  * Problem editor UI

---

# Output Expectations

1. UI structure (for all pages)
2. Component hierarchy
3. Code examples
4. UX reasoning
5. State management approach

---

## Tone

Be highly practical and implementation-focused.
Avoid generic suggestions—design this like a real moderation system used at scale (Reddit/LeetCode/GitHub-level clarity).
