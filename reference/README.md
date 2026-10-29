# CampusShare — CodeConqueror prototype

A Flask-based prototype for accountable sharing of underused campus equipment. It demonstrates resource discovery, eligibility checks, booking requests, owner decisions, condition reports, check-in/check-out, incidents, and an activity history.

> **Important:** This is a hackathon prototype. Demo accounts and resources are fictional. Before public production use, set a strong `SECRET_KEY`, configure HTTPS and managed PostgreSQL, review security, and add real institutional verification. Do not use real student records in the demo.

## Run locally (Windows PowerShell)

1. Install Python 3.11+ and Git.
2. Extract this folder and open it in VS Code.
3. In the VS Code terminal:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

4. Open `http://127.0.0.1:5000`.

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal and activate again. Alternatively, use Command Prompt: `.venv\Scripts\activate.bat`.

## Fictional demo accounts

All three use the password `DemoPass123!`:

- Student: `student@campusshare.demo`
- Owner: `owner@campusshare.demo`
- Administrator: `admin@campusshare.demo`

Self-registered accounts receive the student role. The demo owner account owns the seeded resources. These accounts are for local judging/demo only; change or disable them before any public launch.

## Suggested judge journey

1. Sign in as the student and open a resource.
2. Submit a future booking request for a resource that the demo student is eligible to use.
3. Sign out and sign in as the owner; approve the request from the Owner dashboard.
4. Sign in as the student and record the initial condition under My bookings.
5. Sign in as the owner and record check-out.
6. Sign in as the student and record the final condition.
7. Sign in as the owner and confirm return.
8. Open Activity to review the recorded actions. Report an incident and resolve it from the Incidents page for the human-review flow.

## Stack

- Python / Flask
- Flask-Login for sessions
- Flask-SQLAlchemy for persistence
- SQLite locally; PostgreSQL can be configured using `DATABASE_URL`
- Jinja templates and Bootstrap 5 via CDN

## Known MVP limitations

- No email notifications yet.
- Training verification is a seeded demo profile field, not an institutional verification integration.
- No file upload for condition evidence yet; condition notes are stored.
- The waiting list is recorded, but automatic promotion is not yet implemented.
- No automated recurring overdue reminders yet.
- This starter has not been security-audited for production use.

## Team contribution evidence

Keep a task log with the actual contributor, task, date, result and evidence (commit, pull request, test output or research note). Disclose the use of AI coding assistance in the submission as required by the organisers. Do not claim generated code as a teammate's independent work; document each person's actual implementation, review, testing, integration and research contributions.
