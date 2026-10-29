/**
 * Authentication View: Login
 * Clean neo-brutalist authentication interface with instant preset fills for testing
 */

import * as Auth from '../auth.js';
import { escapeHtml, showToast } from '../ui.js';

export async function renderLogin(params, container) {
  const current = await Auth.getSessionUser();
  if (current) {
    container.innerHTML = `
      <div class="card-brut" style="max-width: 500px; margin: 3rem auto; padding: 2.5rem; text-align: center;">
        <span class="sticker sticker-mint">ACTIVE SESSION</span>
        <h2 style="margin: 1rem 0 0.5rem;">Already Signed In</h2>
        <p style="color: var(--color-muted); margin-bottom: 1.5rem;">
          You are currently signed in as <strong>${escapeHtml(current.name)}</strong> (${escapeHtml(current.role)}).
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="#/" class="btn-brut btn-primary">Browse Component Locker →</a>
          <button type="button" class="btn-brut btn-danger" id="btn-session-logout">Sign Out</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-session-logout').addEventListener('click', async () => {
      await Auth.logout();
      showToast('You have been signed out.', 'info');
      window.location.hash = '#/login';
      window.location.reload();
    });
    return;
  }

  container.innerHTML = `
    <div style="max-width: 520px; margin: 2rem auto;">
      <!-- Main Login Card -->
      <div class="card-brut" style="padding: 2.5rem; background: var(--color-paper-card);">
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <span class="sticker sticker-yellow">SECURE ACCESS</span>
          <h1 style="font-size: 2rem; margin: 0.5rem 0 0.25rem;">Sign In to UniHive</h1>
          <p style="color: var(--color-muted); font-size: 0.9rem;">
            Access hardware lockers, loan chain-of-custody, and lab components.
          </p>
        </div>

        <!-- Quick Fill Preset Helper Pills -->
        <div style="background: var(--color-paper); border: var(--border-thin); padding: 1rem; margin-bottom: 1.5rem; border-radius: var(--radius-sm);">
          <div style="font-size: 0.75rem; font-family: var(--font-mono); font-weight: 700; color: var(--color-muted); margin-bottom: 0.5rem;">
            ⚡ QUICK FILL PRESET DEMO ACCOUNTS:
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button type="button" class="btn-brut btn-sm btn-secondary btn-preset-fill" data-email="admin@unihive.edu" data-pass="Admin@UniHive2025!">
              🏛️ Admin
            </button>
            <button type="button" class="btn-brut btn-sm btn-secondary btn-preset-fill" data-email="volunteer@unihive.edu" data-pass="Volunteer@UniHive2025!">
              🛡️ Council Volunteer
            </button>
            <button type="button" class="btn-brut btn-sm btn-secondary btn-preset-fill" data-email="student@unihive.edu" data-pass="Student@UniHive2025!">
              🎓 Student
            </button>
          </div>
        </div>

        <form id="login-form">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" for="login-email">College Email Address</label>
            <input type="email" id="login-email" class="input-brut" placeholder="name@unihive.edu" required autocomplete="email" />
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <label class="form-label" for="login-password" style="margin: 0;">Password</label>
            </div>
            <input type="password" id="login-password" class="input-brut" placeholder="••••••••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" class="btn-brut btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
            Sign In →
          </button>
        </form>

        <div style="margin-top: 1.75rem; text-align: center; border-top: var(--border-thin); padding-top: 1.25rem; font-size: 0.9rem;">
          Don't have an account yet? 
          <a href="#/signup" style="font-weight: 800; text-decoration: underline; color: inherit;">Register as Student or Volunteer</a>
        </div>
      </div>
    </div>
  `;

  // Preset fills listener
  container.querySelectorAll('.btn-preset-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelector('#login-email').value = btn.dataset.email;
      container.querySelector('#login-password').value = btn.dataset.pass;
      showToast(`Filled credentials for ${btn.textContent.trim()}`, 'info');
    });
  });

  // Login form submission
  container.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#login-email').value.trim();
    const password = container.querySelector('#login-password').value;

    try {
      const user = await Auth.login(email, password);
      showToast(`Welcome back, ${user.name}! (${user.role.toUpperCase()})`, 'success');
      
      if (user.role === 'admin') {
        window.location.hash = '#/admin';
      } else if (user.role === 'volunteer') {
        window.location.hash = '#/volunteer';
      } else {
        window.location.hash = '#/';
      }
      setTimeout(() => window.location.reload(), 250);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}
