# Daily Habit Accountability System (DHAS)

A smart web application that tracks habits and sends "accountability scores" based on your consistency.

## Overview

DHAS is a habit tracking web app built with Python Flask backend and vanilla JavaScript frontend. It helps users build better habits by:
- Tracking daily habit completions
- Calculating consistency scores using SQL
- Maintaining streak counters
- Generating weekly accountability reports
- Providing visual feedback on habit health

## Project Architecture

### Backend (5 files)
- `app.py` - Main Flask application entry point
- `models.py` - SQLAlchemy database models (Habit, HabitCompletion, WeeklyReport)
- `routes.py` - API endpoints for CRUD operations
- `utils.py` - Utility functions for calculations (streaks, consistency scores, health status)
- `scheduler.py` - APScheduler for automated weekly report generation

### Frontend (5+ files)
- `templates/index.html` - Main HTML template
- `static/css/styles.css` - Core styles
- `static/css/animations.css` - CSS animations and transitions
- `static/css/themes.css` - Light/dark theme support
- `static/js/api.js` - API client for backend communication
- `static/js/utils.js` - Frontend utility functions
- `static/js/app.js` - Main application logic

### Database
- PostgreSQL database with 3 tables:
  - `habits` - Stores habit information
  - `habit_completions` - Tracks daily completions
  - `weekly_reports` - Stores generated weekly reports

## Key Features

1. **Habit Management** - Create, edit, delete habits
2. **Daily Tracking** - Mark habits complete/incomplete
3. **Streak Tracking** - Current streak and longest streak
4. **Consistency Score** - SQL-calculated percentage over 30 days
5. **Health Status** - Visual indicators (excellent, good, needs improvement, critical)
6. **Weekly Reports** - Auto-generated performance summaries
7. **Theme Support** - Light and dark mode toggle
8. **Animations** - Smooth transitions and visual feedback

## Running the Application

The application runs on port 5000 using Flask development server:
```bash
python app.py
```

For production, use gunicorn:
```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

## API Endpoints

- `GET /api/habits` - Get all habits with stats
- `POST /api/habits` - Create new habit
- `PUT /api/habits/<id>` - Update habit
- `DELETE /api/habits/<id>` - Delete habit
- `POST /api/habits/<id>/toggle` - Toggle completion
- `GET /api/habits/<id>/history` - Get completion history
- `GET /api/dashboard` - Get dashboard data
- `GET /api/reports` - Get all weekly reports
- `POST /api/reports/generate` - Generate new report

## Recent Changes

- Initial project setup with Flask and PostgreSQL
- Implemented all backend models and routes
- Created animated frontend with theme support
- Added streak calculations and consistency scoring
- Implemented weekly report generation
