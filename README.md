# Fireflies-Inspired Meeting Assistant

A full-stack meeting workspace inspired by the Fireflies.ai user
experience. The application focuses on the post-meeting workflow:
browsing meetings, reviewing interactive transcripts, searching
conversations, understanding summaries, and managing action items.

> **Important:** This project is inspired by the layout and user
> experience of Fireflies.ai, but uses its own implementation and only
> the features required by the assignment. Real-time transcription,
> authentication, meeting integrations, and other advanced Fireflies
> features are outside the MVP.

------------------------------------------------------------------------

## 1. Problem

People attend many meetings but often spend too much time reviewing long
recordings or transcripts to understand what happened, find a specific
discussion, and remember their follow-up tasks.

This project solves that problem by bringing the important post-meeting
information into one workspace:

**Meeting → Transcript → Search → Summary → Action Items**

The goal is to let a user understand a meeting in minutes instead of
manually reviewing the entire recording or transcript.

------------------------------------------------------------------------

## 2. Target Users

The primary users are people who regularly attend meetings and need to:

-   Quickly find previous meetings
-   Review what was discussed
-   Search for specific information
-   Understand the main outcomes
-   Track follow-up tasks

The MVP assumes a default logged-in user. Real authentication is not
required.

------------------------------------------------------------------------

## 3. Product Goal

Build a Fireflies-inspired meeting workspace where a user can:

1.  Find a meeting
2.  Open the meeting
3.  Understand the summary
4.  Search the transcript
5.  Jump to relevant timestamps
6.  Review action items
7.  Add or complete follow-up tasks

### Core Value

The application should reduce the time required to understand a meeting
and turn the meeting content into actionable information.

------------------------------------------------------------------------

# 4. User Stories

These stories describe what the user can do without discussing
implementation details.

-   As a user, I want to **view my meetings** so I can easily find a
    meeting.
-   As a user, I want to **search and filter meetings** so I can quickly
    find a specific meeting.
-   As a user, I want to **view a meeting transcript** so I can review
    the discussion.
-   As a user, I want to **search the transcript** so I can quickly find
    specific information.
-   As a user, I want to **view the meeting summary** so I can
    understand the meeting quickly.
-   As a user, I want to **view and manage action items** so I know what
    tasks need to be completed.
-   As a user, I want to **create, edit, and delete meetings** so I can
    manage my meeting library.

------------------------------------------------------------------------

# 5. Data Models

The application needs five core models.

## Meeting

Stores basic information about a meeting.

``` text
id
title
date
duration
created_at
updated_at
```

## Participant

Stores people who attended meetings.

``` text
id
name
email
```

## TranscriptSegment

Stores individual pieces of a meeting transcript.

``` text
id
meeting_id
speaker
timestamp
text
```

## Summary

Stores the meeting's generated or seeded summary.

``` text
id
meeting_id
overview
```

## ActionItem

Stores tasks extracted from a meeting.

``` text
id
meeting_id
title
assignee
completed
```

## Relationships

``` text
Meeting
  ├── Participants
  ├── Transcript Segments
  ├── Summary
  └── Action Items
```

One meeting can have many transcript segments, many action items, many
participants, and one summary.

------------------------------------------------------------------------

# 6. Minimum Viable Product

The MVP follows the assignment's five required feature groups.

## 6.1 Meetings Library / Dashboard

The dashboard will allow users to:

-   View past meetings
-   See title, date, duration, and participants
-   Search meetings
-   Filter meetings
-   Sort meetings by recency
-   Open a meeting
-   Access profile/settings placeholders

Example:

``` text
Meetings

Search meetings...                 + New Meeting

[All] [Filters]                    [Newest]

Weekly Product Meeting
Aug 14 · 45 min · Suraj, Rahul, Aman

Backend Architecture Discussion
Aug 13 · 32 min · Suraj, Rahul
```

------------------------------------------------------------------------

## 6.2 Meeting / Transcript Detail

The meeting page is the main post-meeting workspace.

It will contain:

-   Meeting title
-   Date
-   Duration
-   Participants
-   Media player
-   Seek bar
-   Interactive transcript
-   Speaker labels
-   Timestamps
-   Transcript search
-   Search result highlighting
-   Transcript-to-player synchronization
-   Player-to-transcript synchronization

### Transcript Interaction

When the user clicks a transcript line:

``` text
12:42 Rahul
We should use Redis for caching.
```

the media player should move to:

``` text
12:42
```

When the media player reaches a transcript timestamp, the corresponding
transcript segment should become highlighted.

Real speech-to-text is not required.

------------------------------------------------------------------------

## 6.3 AI Summary & Notes

Each meeting will have a summary area containing:

### Summary

A seeded or mocked AI-generated overview.

### Key Topics / Chapters

For example:

``` text
Key Topics

- Backend Architecture
- Redis
- Database Design
- Deployment
```

### Action Items

For example:

``` text
☐ Configure Redis
☐ Create database schema
☑ Deploy API
```

The summaries can be seeded instead of generated by a real LLM.

------------------------------------------------------------------------

## 6.4 Meeting Management / CRUD

The user will be able to:

### Create

Create a meeting using:

-   A form
-   Pasted transcript
-   Optional transcript upload

### Read

View meetings and their complete details.

### Update

Edit:

-   Meeting title
-   Participants
-   Action items

### Delete

Delete a meeting.

### Action Items

The user can:

-   Add an action item
-   Edit an action item
-   Mark it as completed

All changes must persist in SQLite.

------------------------------------------------------------------------

## 6.5 Fireflies Experience

The application should feel like a modern meeting workspace rather than
a generic CRUD application.

The UI will include:

-   Fireflies-inspired sidebar/navigation
-   Meetings library
-   Search and filter controls
-   Meeting detail layout
-   Transcript panel
-   Summary panel
-   Forms
-   Modals
-   Toast notifications
-   Loading states
-   Empty states
-   Settings placeholder

The Fireflies UI is used only as inspiration for layout, spacing,
hierarchy, and overall productivity-focused experience.

------------------------------------------------------------------------

# 7. Prototype / Wireframe

## Dashboard

``` text
┌──────┬──────────────────────────────────────────────────────┐
│      │  Meetings                          Search            │
│ SIDE │                                                      │
│ BAR  │  [All] [Filters]                  [+ New Meeting]   │
│      │                                                      │
│      │  ┌──────────────────────────────────────────────┐  │
│      │  │ Weekly Product Meeting                       │  │
│      │  │ Aug 14 · 45 min · Suraj, Rahul, Aman        │  │
│      │  └──────────────────────────────────────────────┘  │
│      │                                                      │
│      │  ┌──────────────────────────────────────────────┐  │
│      │  │ Backend Architecture Discussion              │  │
│      │  │ Aug 13 · 32 min · Suraj, Rahul               │  │
│      │  └──────────────────────────────────────────────┘  │
└──────┴──────────────────────────────────────────────────────┘
```

## Meeting Detail

``` text
┌──────┬──────────────────────────────────────────────────────┐
│ SIDE │ Backend Architecture Meeting                       │
│ BAR  │ Aug 13 · 32 min · 3 participants                   │
│      │                                                      │
│      │ ┌────────────────────────────────────────────────┐ │
│      │ │ ▶ ───────────────●────────── 12:42 / 32:00    │ │
│      │ └────────────────────────────────────────────────┘ │
│      │                                                      │
│      │ ┌──────────────────────┬─────────────────────────┐ │
│      │ │ Transcript            │ Summary                 │ │
│      │ │ 🔍 Search transcript  │                         │ │
│      │ │                       │ AI Summary              │ │
│      │ │ 00:00 Rahul           │ ...                     │ │
│      │ │ Good morning...       │                         │ │
│      │ │                       │ Key Topics              │ │
│      │ │ 00:12 Suraj           │ • Backend               │ │
│      │ │ Let's discuss...      │ • Redis                 │ │
│      │ │                       │                         │ │
│      │ │ 01:03 Rahul           │ Action Items            │ │
│      │ │ We should use Redis…  │ ☐ Setup Redis           │ │
│      │ │                       │ ☐ Deploy API            │ │
│      │ └──────────────────────┴─────────────────────────┘ │
└──────┴──────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 8. Future Scope

This project is primarily a portfolio/evaluation prototype. It is not
being designed to operate at Fireflies' production scale.

The current MVP intentionally uses simple architecture.

## Current

``` text
Single user
SQLite
FastAPI
Next.js
Seeded transcripts
Mocked/seeded summaries
```

## Possible Future Evolution

``` text
SQLite
  ↓
PostgreSQL

Local/sample media
  ↓
Object Storage

Single FastAPI instance
  ↓
Multiple backend instances/services

Mock summaries
  ↓
LLM service

Sample media
  ↓
Real transcription pipeline

Default user
  ↓
Authentication + authorization
```

These future possibilities should encourage clean separation of
concerns, but they should not be implemented until the MVP is complete.

------------------------------------------------------------------------

# 9. Application Architecture

This is a full-stack web application.

``` text
                Browser
                   │
                   │ HTTP / JSON
                   ↓
          ┌─────────────────┐
          │    Next.js      │
          │   Frontend      │
          └────────┬────────┘
                   │
                   │ REST API
                   ↓
          ┌─────────────────┐
          │     FastAPI     │
          │     Backend     │
          └────────┬────────┘
                   │
                   ↓
          ┌─────────────────┐
          │     SQLite      │
          └─────────────────┘
```

------------------------------------------------------------------------

# 10. Frontend Components

The frontend will be divided into reusable components.

``` text
Sidebar
Navbar
MeetingList
MeetingCard
SearchBar
FilterControls
MeetingDetail
AudioPlayer
Transcript
TranscriptLine
Summary
ActionItems
Chapters
CreateMeetingModal
EditMeetingModal
DeleteConfirmation
Toast
LoadingState
EmptyState
```

------------------------------------------------------------------------

# 11. Backend Components

``` text
FastAPI Application
│
├── Meeting Routes
├── Transcript Routes
├── Summary Routes
├── Action Item Routes
│
├── SQLAlchemy Models
├── Pydantic Schemas
├── Database Session
└── Seed Data
```

------------------------------------------------------------------------

# 12. API Plan

  Method   Endpoint                      Purpose
  -------- ----------------------------- ----------------------------------------------
  GET      `/meetings`                   List meetings and support search/filter/sort
  POST     `/meetings`                   Create a meeting
  GET      `/meetings/{id}`              Get meeting details
  PUT      `/meetings/{id}`              Edit meeting metadata
  DELETE   `/meetings/{id}`              Delete a meeting
  GET      `/meetings/{id}/transcript`   Get transcript segments
  GET      `/meetings/{id}/summary`      Get meeting summary
  GET      `/meetings/{id}/actions`      Get action items
  POST     `/meetings/{id}/actions`      Add an action item
  PUT      `/actions/{id}`               Edit or complete an action item
  DELETE   `/actions/{id}`               Delete an action item

------------------------------------------------------------------------

# 13. Tech Stack

## Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS
-   Lucide React

## Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   Pydantic
-   Uvicorn

## Database

-   SQLite

## Why This Stack?

### Next.js + TypeScript

Required by the assignment and suitable for building an interactive web
application.

### FastAPI

Provides a lightweight REST API and is quick to develop and test.

### SQLAlchemy

Provides structured database models and relationships.

### SQLite

Simple, lightweight, persistent for the MVP, and explicitly required by
the assignment.

### Tailwind CSS

Allows fast development of a polished, Fireflies-inspired interface.

------------------------------------------------------------------------

# 14. Project Structure

The planned structure is:

``` text
fireflies-clone/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── meetings/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── MeetingList.tsx
│   │   ├── MeetingCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Transcript.tsx
│   │   ├── TranscriptLine.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── Summary.tsx
│   │   ├── ActionItems.tsx
│   │   ├── Chapters.tsx
│   │   └── CreateMeetingModal.tsx
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   └── types/
│       └── meeting.ts
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── seed.py
│   │
│   └── routers/
│       ├── meetings.py
│       ├── transcripts.py
│       └── actions.py
│
└── README.md
```

------------------------------------------------------------------------

# 15. Development Process

Development will follow this order to reduce rework.

``` text
1. Project Skeleton
        ↓
2. Database Models
        ↓
3. Seed Database
        ↓
4. Backend APIs
        ↓
5. Test APIs
        ↓
6. Frontend Layout
        ↓
7. Meetings Dashboard
        ↓
8. Meeting Detail
        ↓
9. Transcript Interaction
        ↓
10. Summary + Action Items
        ↓
11. CRUD
        ↓
12. UI Polish
        ↓
13. Testing
        ↓
14. Deployment
```

## Step 1 --- Project Skeleton

Create:

``` text
fireflies-clone/
├── frontend/
└── backend/
```

Initialize the environments and Git repository.

## Step 2 --- Database

Create the five core models:

``` text
Meeting
Participant
TranscriptSegment
Summary
ActionItem
```

## Step 3 --- Seed Data

Seed several realistic meetings so the application is immediately
usable.

Each seeded meeting should contain:

-   Title
-   Date
-   Duration
-   Participants
-   Full transcript
-   Summary
-   Key topics/chapters
-   Action items

## Step 4 --- Backend APIs

Build and verify the REST API.

## Step 5 --- Test Backend

Test CRUD and persistence before connecting the frontend.

## Step 6 --- Frontend Shell

Build the Fireflies-inspired:

-   Sidebar
-   Navbar
-   Main content area
-   Meeting library
-   Settings placeholder

## Step 7 --- Dashboard

Connect the meeting library to the backend.

Implement:

-   Search
-   Filter
-   Sort
-   Meeting cards
-   Create meeting

## Step 8 --- Meeting Detail

Build:

-   Player
-   Transcript
-   Summary
-   Topics/chapters
-   Action items

## Step 9 --- Transcript Interaction

Implement:

``` text
Click transcript
      ↓
Change player timestamp

Player timestamp changes
      ↓
Highlight relevant transcript
```

## Step 10 --- Summary + Actions

Connect seeded summary and action-item data.

## Step 11 --- CRUD

Implement:

-   Create meeting
-   Edit meeting
-   Delete meeting
-   Add action item
-   Edit action item
-   Complete action item

## Step 12 --- UI Polish

Add:

-   Toasts
-   Loading states
-   Empty states
-   Modals
-   Hover states
-   Proper spacing
-   Consistent typography
-   Fireflies-inspired visual hierarchy

## Step 13 --- Testing

Test the complete user journey and verify persistence.

## Step 14 --- Deployment

Deploy the frontend and backend and test the production version.

------------------------------------------------------------------------

# 16. Core User Flow

``` text
Dashboard
   ↓
Search / Filter / Sort
   ↓
Select Meeting
   ↓
Meeting Detail
   ├── Review Summary
   ├── Search Transcript
   ├── Click Transcript Timestamp
   │        ↓
   │     Player Jumps
   │
   └── Review Action Items
            ↓
       Add / Edit / Complete
```

------------------------------------------------------------------------

# 17. Definition of Done

The MVP is complete when:

-   [ ] The dashboard displays seeded meetings.
-   [ ] The user can search meetings.
-   [ ] The user can filter meetings.
-   [ ] The user can sort meetings by recency.
-   [ ] The user can open a meeting.
-   [ ] The meeting page displays transcript segments.
-   [ ] Transcript segments show speakers and timestamps.
-   [ ] The user can search the transcript.
-   [ ] Search matches are highlighted.
-   [ ] The media player has a working seek bar.
-   [ ] Clicking a transcript line changes the player position.
-   [ ] The player position highlights the relevant transcript segment.
-   [ ] A meeting summary is displayed.
-   [ ] Key topics/chapters are displayed.
-   [ ] Action items are displayed.
-   [ ] The user can add action items.
-   [ ] The user can edit action items.
-   [ ] The user can mark action items complete.
-   [ ] The user can create meetings.
-   [ ] The user can edit meetings.
-   [ ] The user can delete meetings.
-   [ ] Data persists in SQLite.
-   [ ] Toast notifications work for important actions.
-   [ ] Settings is available as a placeholder.
-   [ ] The UI feels like a polished meeting workspace rather than a
    generic CRUD application.
-   [ ] The deployed application works.

------------------------------------------------------------------------

# 18. Project Principle

The project should follow one rule:

> **Build the smallest complete version first.**

Do not add features simply because they are technically interesting.

Every technical and UI decision should support the core user journey:

**Find a meeting → understand it → search its transcript → navigate to
relevant moments → manage follow-up tasks.**

The Fireflies screenshot is a visual reference for the overall
productivity-focused experience, not a requirement to reproduce
Fireflies' unrelated features.
