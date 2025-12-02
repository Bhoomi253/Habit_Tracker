from datetime import datetime, date
from flask import Blueprint, request, jsonify, render_template
from models import db, Habit, HabitCompletion, WeeklyReport
from utils import (
    get_habit_stats, get_habit_history, get_dashboard_data,
    calculate_consistency_score, calculate_streak, calculate_longest_streak
)
from scheduler import generate_weekly_report, get_latest_report, get_all_reports

api = Blueprint('api', __name__, url_prefix='/api')


@api.route('/habits', methods=['GET'])
def get_habits():
    """Get all active habits with their stats"""
    habits = Habit.query.filter_by(is_active=True).all()
    result = []
    for habit in habits:
        stats = get_habit_stats(habit.id)
        if stats:
            result.append(stats)
    return jsonify(result)


@api.route('/habits', methods=['POST'])
def create_habit():
    """Create a new habit"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Habit name is required'}), 400
    
    habit = Habit(
        name=data['name'],
        description=data.get('description', '')
    )
    
    db.session.add(habit)
    db.session.commit()
    
    return jsonify(get_habit_stats(habit.id)), 201


@api.route('/habits/<int:habit_id>', methods=['GET'])
def get_habit(habit_id):
    """Get a specific habit with stats"""
    stats = get_habit_stats(habit_id)
    if not stats:
        return jsonify({'error': 'Habit not found'}), 404
    return jsonify(stats)


@api.route('/habits/<int:habit_id>', methods=['PUT'])
def update_habit(habit_id):
    """Update a habit"""
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        habit.name = data['name']
    if 'description' in data:
        habit.description = data['description']
    if 'is_active' in data:
        habit.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(get_habit_stats(habit.id))


@api.route('/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    """Delete a habit"""
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    db.session.delete(habit)
    db.session.commit()
    
    return jsonify({'message': 'Habit deleted successfully'})


@api.route('/habits/<int:habit_id>/toggle', methods=['POST'])
def toggle_habit_completion(habit_id):
    """Toggle habit completion for a specific date"""
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    data = request.get_json(silent=True) or {}
    completion_date = data.get('date')
    
    if completion_date:
        completion_date = datetime.strptime(completion_date, '%Y-%m-%d').date()
    else:
        completion_date = date.today()
    
    existing = HabitCompletion.query.filter_by(
        habit_id=habit_id,
        completed_date=completion_date
    ).first()
    
    if existing:
        db.session.delete(existing)
        db.session.commit()
        completed = False
    else:
        completion = HabitCompletion(
            habit_id=habit_id,
            completed_date=completion_date
        )
        db.session.add(completion)
        db.session.commit()
        completed = True
    
    return jsonify({
        'completed': completed,
        'date': completion_date.isoformat(),
        'stats': get_habit_stats(habit_id)
    })


@api.route('/habits/<int:habit_id>/history', methods=['GET'])
def get_history(habit_id):
    """Get habit completion history"""
    days = request.args.get('days', 30, type=int)
    history = get_habit_history(habit_id, days)
    return jsonify(history)


@api.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard data"""
    return jsonify(get_dashboard_data())


@api.route('/reports', methods=['GET'])
def get_reports():
    """Get all weekly reports"""
    reports = get_all_reports()
    return jsonify([r.to_dict() for r in reports])


@api.route('/reports/generate', methods=['POST'])
def generate_report():
    """Manually generate a weekly report"""
    from flask import current_app
    report_data = generate_weekly_report(current_app._get_current_object())
    if report_data:
        return jsonify(report_data)
    return jsonify({'message': 'No habits to generate report for'}), 400


@api.route('/reports/latest', methods=['GET'])
def latest_report():
    """Get the latest weekly report"""
    report = get_latest_report()
    if report:
        return jsonify(report.to_dict())
    return jsonify({'message': 'No reports available'}), 404
