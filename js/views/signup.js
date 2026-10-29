/**
 * Authentication View: Signup
 * Self-registration for Students and Council Volunteers
 * Administrator access is strictly preset and managed by institutional administration.
 */

import * as Auth from '../auth.js';
import { escapeHtml, showToast } from '../ui.js';

export async function renderSignup(params, container) {
  const current = await Auth.getSessionUser();
  if (current) {
    container.innerHTML = `
      <div class="card-brut" style="max-width: 500px; margin: 3rem auto; padding: 2.5rem; text-align: center;">
        <span class="sticker sticker-mint">ACTIVE ACCOUNT</span>
        <h2 style="margin: 1rem 0 0.5rem;">Already Registered & Signed In</h2>
        <p style="color: var(--color-muted); margin-bottom: 1.5rem;">
          You are currently signed in as <strong>${escapeHtml(current.name)}</strong> (${escapeHtml(current.role)}).
        </p>
        <a href="#/" class="btn-brut btn-primary">Go to Component Locker →</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width: 580px; margin: 2rem auto;">
      <div class="card-brut" style="padding: 2.5rem; background: var(--color-paper-card);">
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <span class="sticker sticker-primary">JOIN UNIHIVE</span>
          <h1 style="font-size: 2rem; margin: 0.5rem 0 0.25rem;">Create Your Account</h1>
          <p style="color: var(--color-muted); font-size: 0.9rem;">
            Sign up as a Student or Technical Council Volunteer to manage and borrow campus equipment.
          </p>
        </div>

        <form id="signup-form">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" for="signup-name">Full Name</label>
            <input type="text" id="signup-name" class="input-brut" placeholder="e.g. Alex Kumar" required autocomplete="name" />
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" for="signup-email">Institutional College Email</label>
            <input type="email" id="signup-email" class="input-brut" placeholder="alex.k@unihive.edu" required autocomplete="email" />
            <small style="color: var(--color-muted); font-size: 0.75rem; font-family: var(--font-mono);">
              Use your campus/university assigned email.
            </small>
          </div>

          <!-- Role Selector Strip -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">Select Account Role</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <label class="card-brut role-choice active" style="padding: 0.85rem; cursor: pointer; border-width: 2px;">
                <input type="radio" name="signup-role" value="student" checked style="margin-right: 0.4rem;" />
                <strong>🎓 Student</strong>
                <div style="font-size: 0.75rem; color: var(--color-muted); margin-top: 0.2rem;">Borrow components & track project loans</div>
              </label>

              <label class="card-brut role-choice" style="padding: 0.85rem; cursor: pointer; border-width: 2px;">
                <input type="radio" name="signup-role" value="volunteer" style="margin-right: 0.4rem;" />
                <strong>🛡️ Council Volunteer</strong>
                <div style="font-size: 0.75rem; color: var(--color-muted); margin-top: 0.2rem;">Add & manage inventory components</div>
              </label>
            </div>
            
            <div style="margin-top: 0.5rem; background: var(--color-paper); padding: 0.5rem 0.75rem; border: var(--border-thin); font-size: 0.75rem; color: var(--color-muted);">
              ℹ️ <strong>Administrator Note:</strong> Admin access credentials are preset and cannot be self-registered.
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-group">
              <label class="form-label" for="signup-dept">Department / Major</label>
              <input type="text" id="signup-dept" class="input-brut" placeholder="e.g. Electrical Eng" />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-id">Roll / Student ID</label>
              <input type="text" id="signup-id" class="input-brut" placeholder="e.g. 2024CS042" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.75rem;">
            <label class="form-label" for="signup-password">Choose Password</label>
            <input type="password" id="signup-password" class="input-brut" placeholder="Minimum 6 characters" minlength="6" required autocomplete="new-password" />
          </div>

          <button type="submit" class="btn-brut btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
            Create Account & Sign In →
          </button>
        </form>

        <div style="margin-top: 1.75rem; text-align: center; border-top: var(--border-thin); padding-top: 1.25rem; font-size: 0.9rem;">
          Already have an account? 
          <a href="#/login" style="font-weight: 800; text-decoration: underline; color: inherit;">Sign in here</a>
        </div>
      </div>
    </div>
  `;

  // Dynamic visual active toggle for role cards
  container.querySelectorAll('input[name="signup-role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      container.querySelectorAll('.role-choice').forEach(lbl => lbl.classList.remove('active'));
      radio.closest('.role-choice').classList.add('active');
    });
  });

  // Handle signup form submission
  container.querySelector('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#signup-name').value.trim();
    const email = container.querySelector('#signup-email').value.trim();
    const role = container.querySelector('input[name="signup-role"]:checked').value;
    const department = container.querySelector('#signup-dept').value.trim();
    const student_id = container.querySelector('#signup-id').value.trim();
    const password = container.querySelector('#signup-password').value;

    try {
      const newUser = await Auth.signup({
        name,
        email,
        password,
        role,
        department,
        student_id
      });

      showToast(`Account created successfully! Welcome, ${newUser.name}.`, 'success');
      window.location.hash = role === 'volunteer' ? '#/volunteer' : '#/';
      setTimeout(() => window.location.reload(), 250);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}
