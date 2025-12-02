from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger


scheduler = BackgroundScheduler()


def generate_weekly_report(app):
    """Generate weekly report for all habits"""
    from models import db, Habit, HabitCompletion, WeeklyReport
    from utils import calculate_consistency_score, calculate_streak, get_habit_health
    
    with app.app_context():
        today = date.today()
        week_start = today - timedelta(days=today.weekday() + 7)
        week_end = week_start + timedelta(days=6)
        
        existing_report = WeeklyReport.query.filter(
            WeeklyReport.week_start == week_start
        ).first()
        
        if existing_report:
            return existing_report.to_dict()
        
        habits = Habit.query.filter_by(is_active=True).all()
        
        if not habits:
            return None
        
        habit_reports = []
        total_score = 0
        total_completions = 0
        
        for habit in habits:
            completions = HabitCompletion.query.filter(
                HabitCompletion.habit_id == habit.id,
                HabitCompletion.completed_date >= week_start,
                HabitCompletion.completed_date <= week_end
            ).count()
            
            consistency = calculate_consistency_score(habit.id, days=7)
            streak = calculate_streak(habit.id)
            health = get_habit_health(consistency)
            
            habit_report = {
                'habit_id': habit.id,
                'habit_name': habit.name,
                'completions': completions,
                'consistency_score': consistency,
                'streak': streak,
                'health_status': health['status']
            }
            habit_reports.append(habit_report)
            total_score += consistency
            total_completions += completions
        
        overall_score = round(total_score / len(habits), 1) if habits else 0
        
        report = WeeklyReport(
            week_start=week_start,
            week_end=week_end,
            total_habits=len(habits),
            total_completions=total_completions,
            overall_score=overall_score,
            report_data={'habit_reports': habit_reports}
        )
        
        db.session.add(report)
        db.session.commit()
        
        return report.to_dict()


def get_latest_report():
    """Get the most recent weekly report"""
    from models import WeeklyReport
    return WeeklyReport.query.order_by(WeeklyReport.generated_at.desc()).first()


def get_all_reports():
    """Get all weekly reports"""
    from models import WeeklyReport
    return WeeklyReport.query.order_by(WeeklyReport.generated_at.desc()).all()


def init_scheduler(app):
    """Initialize the scheduler with weekly report generation"""
    
    def job_wrapper():
        generate_weekly_report(app)
    
    scheduler.add_job(
        job_wrapper,
        CronTrigger(day_of_week='sun', hour=23, minute=59),
        id='weekly_report',
        replace_existing=True
    )
    
    if not scheduler.running:
        scheduler.start()
    
    return scheduler
