from datetime import datetime, date, timedelta
from sqlalchemy import func, text
from models import db, Habit, HabitCompletion, WeeklyReport


def calculate_streak(habit_id):
    """Calculate current streak for a habit using SQL"""
    today = date.today()
    
    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id
    ).order_by(HabitCompletion.completed_date.desc()).all()
    
    if not completions:
        return 0
    
    completion_dates = set(c.completed_date for c in completions)
    
    streak = 0
    current_date = today
    
    while current_date in completion_dates:
        streak += 1
        current_date -= timedelta(days=1)
    
    if streak == 0 and (today - timedelta(days=1)) in completion_dates:
        current_date = today - timedelta(days=1)
        while current_date in completion_dates:
            streak += 1
            current_date -= timedelta(days=1)
    
    return streak


def calculate_longest_streak(habit_id):
    """Calculate longest streak ever for a habit"""
    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id
    ).order_by(HabitCompletion.completed_date.asc()).all()
    
    if not completions:
        return 0
    
    completion_dates = sorted(set(c.completed_date for c in completions))
    
    if len(completion_dates) == 0:
        return 0
    
    longest_streak = 1
    current_streak = 1
    
    for i in range(1, len(completion_dates)):
        if (completion_dates[i] - completion_dates[i-1]).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 1
    
    return longest_streak


def calculate_consistency_score(habit_id, days=30):
    """Calculate consistency score based on completion rate over specified days"""
    today = date.today()
    start_date = today - timedelta(days=days)
    
    habit = Habit.query.get(habit_id)
    if not habit:
        return 0.0
    
    habit_created = habit.created_at.date() if habit.created_at else start_date
    effective_start = max(start_date, habit_created)
    
    total_days = (today - effective_start).days + 1
    if total_days <= 0:
        return 100.0
    
    completions_count = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completed_date >= effective_start,
        HabitCompletion.completed_date <= today
    ).count()
    
    score = (completions_count / total_days) * 100
    return round(min(score, 100.0), 1)


def get_habit_health(consistency_score):
    """Determine habit health status based on consistency score"""
    if consistency_score >= 80:
        return {'status': 'excellent', 'color': '#10b981', 'icon': '🔥'}
    elif consistency_score >= 50:
        return {'status': 'good', 'color': '#f59e0b', 'icon': '👍'}
    elif consistency_score >= 25:
        return {'status': 'needs_improvement', 'color': '#ef4444', 'icon': '⚠️'}
    else:
        return {'status': 'critical', 'color': '#dc2626', 'icon': '❌'}


def get_habit_stats(habit_id):
    """Get comprehensive stats for a habit"""
    habit = Habit.query.get(habit_id)
    if not habit:
        return None
    
    current_streak = calculate_streak(habit_id)
    longest_streak = calculate_longest_streak(habit_id)
    consistency_score = calculate_consistency_score(habit_id)
    health = get_habit_health(consistency_score)
    
    total_completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id
    ).count()
    
    return {
        'habit': habit.to_dict(),
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'consistency_score': consistency_score,
        'health': health,
        'total_completions': total_completions
    }


def get_habit_history(habit_id, days=30):
    """Get habit completion history for the calendar view"""
    today = date.today()
    start_date = today - timedelta(days=days)
    
    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completed_date >= start_date,
        HabitCompletion.completed_date <= today
    ).all()
    
    completion_dates = {c.completed_date.isoformat(): True for c in completions}
    
    history = []
    current_date = start_date
    while current_date <= today:
        history.append({
            'date': current_date.isoformat(),
            'completed': current_date.isoformat() in completion_dates
        })
        current_date += timedelta(days=1)
    
    return history


def get_overall_accountability_score():
    """Calculate overall accountability score across all active habits"""
    habits = Habit.query.filter_by(is_active=True).all()
    
    if not habits:
        return 0.0
    
    total_score = sum(calculate_consistency_score(h.id) for h in habits)
    return round(total_score / len(habits), 1)


def get_dashboard_data():
    """Get all data needed for the dashboard"""
    habits = Habit.query.filter_by(is_active=True).all()
    
    habits_with_stats = []
    for habit in habits:
        stats = get_habit_stats(habit.id)
        if stats:
            habits_with_stats.append(stats)
    
    overall_score = get_overall_accountability_score()
    overall_health = get_habit_health(overall_score)
    
    today = date.today()
    today_completions = HabitCompletion.query.filter(
        HabitCompletion.completed_date == today
    ).count()
    
    return {
        'habits': habits_with_stats,
        'overall_score': overall_score,
        'overall_health': overall_health,
        'total_habits': len(habits),
        'today_completions': today_completions,
        'date': today.isoformat()
    }
