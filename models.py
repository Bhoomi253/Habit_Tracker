import os
from datetime import datetime, date
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class Habit(db.Model):
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    completions = db.relationship('HabitCompletion', backref='habit', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }


class HabitCompletion(db.Model):
    __tablename__ = 'habit_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    completed_date = db.Column(db.Date, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('habit_id', 'completed_date', name='unique_habit_date'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class WeeklyReport(db.Model):
    __tablename__ = 'weekly_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    week_start = db.Column(db.Date, nullable=False)
    week_end = db.Column(db.Date, nullable=False)
    total_habits = db.Column(db.Integer, default=0)
    total_completions = db.Column(db.Integer, default=0)
    overall_score = db.Column(db.Float, default=0.0)
    report_data = db.Column(db.JSON, nullable=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'week_start': self.week_start.isoformat() if self.week_start else None,
            'week_end': self.week_end.isoformat() if self.week_end else None,
            'total_habits': self.total_habits,
            'total_completions': self.total_completions,
            'overall_score': self.overall_score,
            'report_data': self.report_data,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None
        }
