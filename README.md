# TaskFlow - Team Task Manager

A modern full-stack team task management application built with React, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v7

## Features

- **Authentication**: Email/password signup and login via Supabase Auth
- **Role-Based Access**: Admin and Member roles with permission controls
- **Project Management**: Create, edit, and delete projects (admin only)
- **Task Management**: Create tasks, assign to team members, track status (pending / in-progress / completed)
- **Dashboard**: Stats cards, pie chart for status overview, bar chart for tasks by project, recent tasks list
- **Team Management**: View team members, admins can change roles
- **Settings**: Update profile name and password
- **Responsive Design**: Mobile-friendly with collapsible sidebar
- **Dark Blue Theme**: Professional navy/teal color scheme

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@taskflow.com | admin123 | Admin |
| sarah@taskflow.com | member123 | Member |
| mike@taskflow.com | member123 | Member |
| emma@taskflow.com | member123 | Member |

## Project Structure

```
src/
  main.jsx           # App entry point with routing
  index.css          # Tailwind + custom theme
  lib/
    supabase.js      # Supabase client
  contexts/
    AuthContext.jsx   # Auth state, signup/signin/signout
  components/
    Sidebar.jsx       # Navigation sidebar layout
    ProtectedRoute.jsx # Route guard
  pages/
    Login.jsx         # Login page
    Signup.jsx        # Signup page
    Dashboard.jsx     # Dashboard with charts
    Projects.jsx      # Project CRUD
    Tasks.jsx         # Task CRUD with filters
    Team.jsx          # Team members list
    Settings.jsx      # Profile settings
supabase/
  functions/
    seed-data/        # Edge function to seed demo data
```

## Getting Started

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`

## Database

Supabase handles authentication, database, and row-level security. Tables:

- **profiles** - User profiles with role (admin/member)
- **projects** - Team projects
- **tasks** - Tasks with status, priority, assignee, due date
- **project_members** - Project membership

All tables have RLS policies ensuring authenticated access and role-based permissions.
