You are an expert UI/UX designer and full-stack frontend engineer.

You are working on an existing **User Management dashboard** with a table containing users, roles, status, reports, and actions.

Your task is to **enhance and extend this UI with deep inspection panels, moderation tools, and advanced admin controls**, while keeping the design clean, structured, and human-crafted (NOT generic or cluttered).

---

## Core Principle

* Keep UI minimal, structured, and highly readable
* Avoid clutter and “admin overload”
* Use progressive disclosure (open panels, drawers, tabs instead of crowded screens)
* Every action must feel intentional and traceable

---

## Existing UI Context

A table with columns:

* User (name + email)
* Role
* Status (active / banned / suspended)
* Joined
* Last Active
* Reports (number)
* Actions

---

## Features to Implement

---

### 1. Reports Deep View (on clicking report count)

When clicking the **Reports number**, open a **side drawer or modal** with detailed report insights.

#### Show:

For each report:

* Reported content (post / comment / problem / etc.)
* Content preview (truncated with expand option)
* Report reason
* Reported by (user info)
* Timestamp

#### Moderation Info:

* Action taken (ban / suspend / ignore / delete content)
* Action taken by (admin name)
* Action timestamp
* Status (pending / resolved)

#### UX:

* Group reports by content
* Highlight repeated reports
* Add filters:

  * Pending / Resolved
  * Severity
* Provide quick actions inside panel

---

### 2. Cooldown / Restriction UI System

Add a system for **temporary restrictions (cooldowns)**:

#### Types:

* Ban cooldown (time-based)
* Content posting restriction
* Comment restriction
* View-only mode

#### UI:

* When applying restriction:

  * Select restriction type
  * Duration (e.g., 1h, 24h, 7d, custom)
  * Reason input

#### Display:

* Show cooldown badge in table
* Tooltip with:

  * Remaining time
  * Reason

---

### 3. Status Click → Detailed Logs

When clicking **Status (Active / Banned / Suspended)**:

Open a **status history panel**

#### Show:

* Full ban/suspension history:

  * Status type (ban/suspend/unban)
  * Reason
  * Applied by (admin)
  * Timestamp
  * Duration (if temporary)

#### Include:

* Related content (what caused the ban)
* Link to reported content

#### UX:

* Timeline view (clean vertical layout)
* Highlight active restriction

---

### 4. Profile Deep Insights Panel

Clicking a user opens an enhanced **Profile Admin View**

#### Tabs:

##### Overview

* Basic info
* Current status
* Active restrictions

##### Activity

* Posts
* Comments
* Submissions

##### Reports (IMPORTANT)

* Reports **against this user**
* Reports **made by this user**

#### Add special metric:

* “Reports Made by User”
* “Report Accuracy Ratio” (optional logic)

👉 Highlight users who:

* Mass report frequently
* Have low valid report ratio

---

### 5. Abuse Detection UI (Mass Reporting Detection)

In profile:

* Show:

  * Total reports submitted
  * Valid vs invalid reports
* Add flag:

  * “Potential misuse of reporting system”

#### UX:

* Subtle warning badge (not aggressive)
* Admin-only visibility

---

### 6. Super Admin Dashboard Enhancements

For **Super Admin only**, add:

#### User Insights:

* View:

  * Followers of any user
  * Following list
* Open in modal or drawer

#### Content Insights:

* All posts by user
* Engagement (likes, comments)

#### UX:

* Tab-based:

  * Followers
  * Following
  * Posts

---

### 7. Table UI Improvements

Improve current table:

* Add:

  * Status badges (color-coded but subtle)
  * Report count as clickable chip
  * Hover row → quick actions

* Actions dropdown:

  * Suspend
  * Ban
  * Delete
  * Reset password
  * View profile

---

### 8. Notifications & Feedback

* Use:

  * Dialog → confirmations
  * Toast → success/error
* Examples:

  * “User banned successfully”
  * “Restriction applied for 24 hours”

---

### 9. Component Architecture

Create reusable components:

* ReportDrawer
* StatusHistoryPanel
* UserProfileAdminView
* CooldownSelector
* ActivityLogTimeline
* Notification system (toast + dialog)

---

### 10. Code Requirements

Provide:

* Component structure (React or preferred framework)
* State management approach
* Example:

  * Report drawer implementation
  * Status history timeline
  * Cooldown selector UI
* Clean modular architecture

---

### Output Expectations

1. UI structure (layout + flow)
2. Component hierarchy
3. Code examples
4. Data structure for:

   * Reports
   * Logs
   * Restrictions
5. UX reasoning for each feature

---

### Tone

Be practical and implementation-focused.
Avoid generic UI suggestions—design like a real production admin system.
