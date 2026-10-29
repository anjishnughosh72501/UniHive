import os
from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, render_template, redirect, url_for, request, flash, abort, has_request_context
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

if not app.config['SECRET_KEY']:
    raise RuntimeError("SECRET_KEY environment variable must be set.")
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///campusshare.db').replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'warning'


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    trained_categories = db.Column(db.String(300), default='')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_trained_for(self, category):
        return category.lower() in [x.strip().lower() for x in self.trained_categories.split(',') if x.strip()]


class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(160), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    training_required = db.Column(db.Boolean, default=False, nullable=False)
    usage_rules = db.Column(db.Text, default='Use responsibly and follow the lab supervisor’s instructions.')
    active = db.Column(db.Boolean, default=True, nullable=False)
    owner = db.relationship('User', backref='resources')


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.Integer, db.ForeignKey('resource.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_at = db.Column(db.DateTime, nullable=False)
    end_at = db.Column(db.DateTime, nullable=False)
    purpose = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(24), nullable=False, default='pending')
    decision_reason = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    checked_out_at = db.Column(db.DateTime)
    returned_at = db.Column(db.DateTime)
    resource = db.relationship('Resource', backref='bookings')
    user = db.relationship('User', backref='bookings')


class ConditionReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    stage = db.Column(db.String(20), nullable=False)
    condition = db.Column(db.String(30), nullable=False)
    notes = db.Column(db.Text, default='')
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    booking = db.relationship('Booking', backref='condition_reports')
    reporter = db.relationship('User')


class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    incident_type = db.Column(db.String(40), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(24), default='open', nullable=False)
    resolution = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    booking = db.relationship('Booking', backref='incidents')
    reporter = db.relationship('User')


class AuditEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(80), nullable=False)
    entity_type = db.Column(db.String(40), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    details = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    actor = db.relationship('User')


def record_event(action, entity_type, entity_id, details=''):
    actor_id = (
        current_user.id
        if has_request_context() and current_user.is_authenticated
        else None
    )

    db.session.add(
        AuditEvent(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details
        )
    )


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapped(*args, **kwargs):
            if current_user.role not in roles:
                abort(403)
            return fn(*args, **kwargs)
        return wrapped
    return decorator


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@app.context_processor
def inject_now():
    return {'now': datetime.utcnow}


@app.route('/')
def index():
    search = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    query = Resource.query.filter_by(active=True)
    if search:
        like = f'%{search}%'
        query = query.filter(or_(Resource.name.ilike(like), Resource.description.ilike(like), Resource.location.ilike(like)))
    if category:
        query = query.filter_by(category=category)
    resources = query.order_by(Resource.name).all()
    categories = [row[0] for row in db.session.query(Resource.category).filter_by(active=True).distinct().order_by(Resource.category).all()]
    return render_template('index.html', resources=resources, search=search, category=category, categories=categories)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        if not name or not email or len(password) < 8:
            flash('Enter your name, a valid email, and a password of at least 8 characters.', 'danger')
        elif User.query.filter_by(email=email).first():
            flash('An account with that email already exists.', 'danger')
        else:
            user = User(name=name, email=email, role='student')
            user.set_password(password)
            db.session.add(user)
            db.session.flush()
            record_event('account_created', 'user', user.id, 'Self-registration; default role student')
            db.session.commit()
            login_user(user)
            flash('Account created. You can now request eligible resources.', 'success')
            return redirect(url_for('index'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            flash(f'Welcome back, {user.name.split()[0]}.', 'success')
            return redirect(request.args.get('next') or url_for('index'))
        flash('Email or password was incorrect.', 'danger')
    return render_template('login.html')


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    flash('You have been signed out.', 'info')
    return redirect(url_for('index'))


@app.route('/resources/new', methods=['GET', 'POST'])
@role_required('owner', 'admin')
def create_resource():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        category = request.form.get('category', '').strip()
        description = request.form.get('description', '').strip()
        location = request.form.get('location', '').strip()
        rules = request.form.get('usage_rules', '').strip()
        if not all([name, category, description, location]):
            flash('Please complete all required fields.', 'danger')
        else:
            resource = Resource(name=name, category=category, description=description, location=location,
                                owner_id=current_user.id, training_required=request.form.get('training_required') == 'on',
                                usage_rules=rules or 'Follow the owner’s instructions and return the resource on time.')
            db.session.add(resource)
            db.session.flush()
            record_event('resource_listed', 'resource', resource.id, f'Listed {resource.name}')
            db.session.commit()
            flash('Resource listed successfully.', 'success')
            return redirect(url_for('resource_detail', resource_id=resource.id))
    return render_template('resource_form.html')


@app.route('/resources/<int:resource_id>')
def resource_detail(resource_id):
    resource = db.get_or_404(Resource, resource_id)
    if not resource.active:
        abort(404)
    return render_template('resource_detail.html', resource=resource)


def parse_datetime(value):
    try:
        return datetime.strptime(value, '%Y-%m-%dT%H:%M')
    except (TypeError, ValueError):
        return None


@app.route('/resources/<int:resource_id>/request', methods=['POST'])
@login_required
def request_booking(resource_id):
    resource = db.get_or_404(Resource, resource_id)
    if not resource.active:
        abort(404)
    start_at = parse_datetime(request.form.get('start_at'))
    end_at = parse_datetime(request.form.get('end_at'))
    purpose = request.form.get('purpose', '').strip()
    if not start_at or not end_at or start_at <= datetime.now() or end_at <= start_at or not purpose:
        flash('Choose a future start and end time and provide a purpose.', 'danger')
        return redirect(url_for('resource_detail', resource_id=resource.id))
    if resource.training_required and not current_user.is_trained_for(resource.category):
        flash(f'This resource requires verified training for {resource.category}. Your demo profile does not currently meet that requirement.', 'danger')
        return redirect(url_for('resource_detail', resource_id=resource.id))
    if Booking.query.filter_by(user_id=current_user.id).filter(Booking.status.in_(['pending', 'approved', 'checked_out', 'waitlisted'])).count() >= 3:
        flash('Fair-use limit reached: you may have at most three active or pending requests at a time.', 'warning')
        return redirect(url_for('index'))
    overlap = Booking.query.filter_by(resource_id=resource.id).filter(Booking.status.in_(['approved', 'checked_out'])).filter(Booking.start_at < end_at, Booking.end_at > start_at).first()
    status = 'waitlisted' if overlap else 'pending'
    booking = Booking(resource_id=resource.id, user_id=current_user.id, start_at=start_at, end_at=end_at, purpose=purpose, status=status,
                      decision_reason='An approved booking overlaps this time; placed in the queue.' if overlap else '')
    db.session.add(booking)
    db.session.flush()
    record_event('booking_waitlisted' if overlap else 'booking_requested', 'booking', booking.id, booking.decision_reason or f'Requested {resource.name}')
    db.session.commit()
    flash('The time slot conflicts with an approved booking, so your request was placed on the waiting list.' if overlap else 'Request submitted. The resource owner must review it.', 'success')
    return redirect(url_for('my_bookings'))


@app.route('/my-bookings')
@login_required
def my_bookings():
    bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.created_at.desc()).all()
    return render_template('my_bookings.html', bookings=bookings)


@app.route('/owner')
@role_required('owner', 'admin')
def owner_dashboard():
    if current_user.role == 'admin':
        bookings = Booking.query.order_by(Booking.created_at.desc()).all()
        resources = Resource.query.order_by(Resource.name).all()
    else:
        resource_ids = [r.id for r in current_user.resources]
        bookings = Booking.query.filter(Booking.resource_id.in_(resource_ids)).order_by(Booking.created_at.desc()).all() if resource_ids else []
        resources = current_user.resources
    return render_template('owner_dashboard.html', bookings=bookings, resources=resources)


def can_manage_booking(booking):
    return current_user.role == 'admin' or booking.resource.owner_id == current_user.id


@app.route('/bookings/<int:booking_id>/decision', methods=['POST'])
@role_required('owner', 'admin')
def decide_booking(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if not can_manage_booking(booking):
        abort(403)
    if booking.status != 'pending':
        flash('Only pending requests can receive a decision.', 'warning')
        return redirect(url_for('owner_dashboard'))
    decision = request.form.get('decision')
    reason = request.form.get('reason', '').strip()
    if decision not in ['approved', 'rejected']:
        abort(400)
    if decision == 'approved':
        # Lock this resource row so concurrent approvals
        # for the same resource are processed one at a time.
        resource = (
            Resource.query
            .filter_by(id=booking.resource_id)
            .with_for_update()
            .first()
        )

        if resource is None:
            abort(404)

        overlap = Booking.query.filter(
            Booking.resource_id == booking.resource_id,
            Booking.id != booking.id,
            Booking.status.in_(['approved', 'checked_out']),
            Booking.start_at < booking.end_at,
            Booking.end_at > booking.start_at
        ).first()

        if overlap:
            booking.status = 'waitlisted'
            booking.decision_reason = (
                'Another booking was approved for an overlapping time; '
                'queued for review.'
            )
            record_event(
                'booking_waitlisted',
                'booking',
                booking.id,
                booking.decision_reason
            )
            db.session.commit()
            flash(
                'Another booking overlaps this time. '
                'The request was wait-listed instead.',
                'warning'
            )
            return redirect(url_for('owner_dashboard'))
    booking.status = decision
    booking.decision_reason = reason or ('Approved by resource owner.' if decision == 'approved' else 'Not approved by resource owner.')
    record_event(f'booking_{decision}', 'booking', booking.id, booking.decision_reason)
    db.session.commit()
    flash(f'Request {decision}.', 'success')
    return redirect(url_for('owner_dashboard'))


@app.route('/bookings/<int:booking_id>/condition', methods=['POST'])
@login_required
def condition_report(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if current_user.id != booking.user_id and not can_manage_booking(booking):
        abort(403)
    stage = request.form.get('stage')
    condition = request.form.get('condition')
    notes = request.form.get('notes', '').strip()
    if stage not in ['before', 'after'] or condition not in ['good', 'minor_issue', 'damaged']:
        abort(400)
    if stage == 'before' and booking.status != 'approved':
        flash('Initial condition can only be recorded for an approved booking.', 'warning')
        return redirect(url_for('my_bookings'))
    if stage == 'after' and booking.status != 'checked_out':
        flash('Final condition can only be recorded while the item is checked out.', 'warning')
        return redirect(url_for('my_bookings'))
    report = ConditionReport(booking_id=booking.id, stage=stage, condition=condition, notes=notes, reporter_id=current_user.id)
    db.session.add(report)
    db.session.flush()
    record_event(f'condition_{stage}_recorded', 'booking', booking.id, f'{condition}: {notes}')
    if condition == 'damaged':
        db.session.add(Incident(booking_id=booking.id, reporter_id=current_user.id, incident_type='damage', description=notes or 'Damage flagged in condition report.'))
        record_event('incident_opened', 'booking', booking.id, 'Damage flagged; human review required.')
    db.session.commit()
    flash('Condition report saved.', 'success')
    return redirect(url_for('my_bookings'))


@app.route('/bookings/<int:booking_id>/checkout', methods=['POST'])
@role_required('owner', 'admin')
def checkout_booking(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if not can_manage_booking(booking):
        abort(403)
    if booking.status != 'approved':
        flash('Only approved bookings can be checked out.', 'warning')
        return redirect(url_for('owner_dashboard'))
    if not any(r.stage == 'before' for r in booking.condition_reports):
        flash('Record the initial condition before checking out this resource.', 'warning')
        return redirect(url_for('owner_dashboard'))
    booking.status = 'checked_out'
    booking.checked_out_at = datetime.utcnow()
    record_event('resource_checked_out', 'booking', booking.id, 'Handover recorded by owner/manager.')
    db.session.commit()
    flash('Check-out recorded.', 'success')
    return redirect(url_for('owner_dashboard'))


@app.route('/bookings/<int:booking_id>/return', methods=['POST'])
@role_required('owner', 'admin')
def return_booking(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if not can_manage_booking(booking):
        abort(403)
    if booking.status != 'checked_out':
        flash('Only checked-out resources can be returned.', 'warning')
        return redirect(url_for('owner_dashboard'))
    if not any(r.stage == 'after' for r in booking.condition_reports):
        flash('Record the final condition before confirming the return.', 'warning')
        return redirect(url_for('owner_dashboard'))
    booking.status = 'returned'
    booking.returned_at = datetime.utcnow()
    record_event('resource_returned', 'booking', booking.id, 'Return confirmed by owner/manager.')
    db.session.commit()
    flash('Return confirmed and recorded.', 'success')
    return redirect(url_for('owner_dashboard'))


@app.route('/bookings/<int:booking_id>/incident', methods=['POST'])
@login_required
def report_incident(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if current_user.id != booking.user_id and not can_manage_booking(booking):
        abort(403)
    kind = request.form.get('incident_type', '')
    description = request.form.get('description', '').strip()
    if kind not in ['damage', 'delay', 'dispute', 'safety'] or not description:
        flash('Choose an incident type and enter a description.', 'danger')
        return redirect(url_for('my_bookings'))
    incident = Incident(booking_id=booking.id, reporter_id=current_user.id, incident_type=kind, description=description)
    db.session.add(incident)
    db.session.flush()
    record_event('incident_opened', 'incident', incident.id, f'{kind}: {description}')
    db.session.commit()
    flash('Incident submitted for human review.', 'success')
    return redirect(url_for('my_bookings'))


@app.route('/incidents')
@role_required('owner', 'admin')
def incidents():
    if current_user.role == 'admin':
        items = Incident.query.order_by(Incident.created_at.desc()).all()
    else:
        resource_ids = [r.id for r in current_user.resources]
        booking_ids = [b.id for b in Booking.query.filter(Booking.resource_id.in_(resource_ids)).all()] if resource_ids else []
        items = Incident.query.filter(Incident.booking_id.in_(booking_ids)).order_by(Incident.created_at.desc()).all() if booking_ids else []
    return render_template('incidents.html', incidents=items)


@app.route('/incidents/<int:incident_id>/resolve', methods=['POST'])
@role_required('owner', 'admin')
def resolve_incident(incident_id):
    incident = db.get_or_404(Incident, incident_id)
    if not can_manage_booking(incident.booking):
        abort(403)
    resolution = request.form.get('resolution', '').strip()
    if not resolution:
        flash('Enter the outcome of the human review.', 'danger')
        return redirect(url_for('incidents'))
    incident.status = 'resolved'
    incident.resolution = resolution
    record_event('incident_resolved', 'incident', incident.id, resolution)
    db.session.commit()
    flash('Incident resolution recorded.', 'success')
    return redirect(url_for('incidents'))


@app.route('/activity')
@login_required
def activity():
    if current_user.role == 'admin':
        events = AuditEvent.query.order_by(AuditEvent.created_at.desc()).limit(200).all()
    else:
        resource_ids = [r.id for r in current_user.resources]
        booking_ids = [b.id for b in Booking.query.filter_by(user_id=current_user.id).all()]
        visible = []
        for event in AuditEvent.query.order_by(AuditEvent.created_at.desc()).limit(500).all():
            if event.actor_id == current_user.id or (event.entity_type == 'booking' and event.entity_id in booking_ids) or (event.entity_type == 'resource' and event.entity_id in resource_ids):
                visible.append(event)
        events = visible[:200]
    return render_template('activity.html', events=events)


@app.errorhandler(403)
def forbidden(_error):
    return render_template('error.html', code=403, message='You do not have permission to perform that action.'), 403


@app.errorhandler(404)
def not_found(_error):
    return render_template('error.html', code=404, message='The page or resource could not be found.'), 404


def seed_demo_data():
    if User.query.count():
        return
    owner = User(name='Demo Lab Manager', email='owner@campusshare.demo', role='owner', trained_categories='Electronics,Photography')
    owner.set_password('DemoPass123!')
    student = User(name='Demo Student', email='student@campusshare.demo', role='student', trained_categories='Electronics')
    student.set_password('DemoPass123!')
    admin = User(name='Demo Administrator', email='admin@campusshare.demo', role='admin', trained_categories='Electronics,Photography')
    admin.set_password('DemoPass123!')
    db.session.add_all([owner, student, admin])
    db.session.flush()
    resources = [
        Resource(name='Electronics Project Kit', category='Electronics', description='A reusable kit for prototyping student electronics projects, including a breadboard, jumper wires, sensors and a microcontroller board.', location='Electronics Lab · Room E204', owner_id=owner.id, training_required=True, usage_rules='Use only at the designated lab benches. Return all components and report missing parts.'),
        Resource(name='DSLR Camera Kit', category='Photography', description='Camera body, standard lens, battery and carrying case for approved campus documentation and student projects.', location='Media Room · Block B', owner_id=owner.id, training_required=False, usage_rules='Use the strap, protect the lens, and return the battery and accessories with the kit.'),
        Resource(name='Portable Projector', category='AV Equipment', description='Portable projector and HDMI cable for student presentations, workshops and approved project demonstrations.', location='Resource Desk · Library Level 1', owner_id=owner.id, training_required=False, usage_rules='Keep liquids away from the device and allow it to cool before packing.'),
        Resource(name='Digital Oscilloscope', category='Electronics', description='Two-channel digital oscilloscope for supervised circuit measurement and debugging.', location='Electronics Lab · Room E204', owner_id=owner.id, training_required=True, usage_rules='Only trained users may operate this instrument. Follow lab safety procedures.'),
    ]
    db.session.add_all(resources)
    db.session.flush()
    record_event('demo_data_seeded', 'resource', resources[0].id, 'Fictional demo accounts and resources created.')
    db.session.commit()


with app.app_context():
    db.create_all()
    seed_demo_data()


if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1', host='127.0.0.1', port=int(os.environ.get('PORT', 5000)))
