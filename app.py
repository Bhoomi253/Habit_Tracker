import os
from flask import Flask, render_template, send_from_directory
from models import db, Habit, HabitCompletion, WeeklyReport
from routes import api
from scheduler import init_scheduler

app = Flask(__name__, static_folder='static', template_folder='templates')

app.secret_key = os.environ.get("SESSION_SECRET") or os.environ.get("FLASK_SECRET_KEY") or "dhas-secret-key"

app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:root@localhost/habitdb"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

app.register_blueprint(api)

with app.app_context():
    db.create_all()

init_scheduler(app)


@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('index.html')


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)


@app.after_request
def add_header(response):
    """Add headers to prevent caching"""
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
