/**
 * Incidents & Human Review View
 * Implements the core principle: No automatic fault assignment or penalties;
 * all disputes and damage are resolved through human dialogue.
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, formatDateTime, showToast } from '../ui.js';

export async function renderIncidents(params, container) {
  const currentUser = await Store.getCurrentUser();
  const [incidents, allBookings, allResources, allUsers] = await Promise.all([
    Store.listIncidents(),
    Store.listBookings(),
    Store.listResources({ active: undefined }),
    Store.listUsers()
  ]);

  const canManage = currentUser.role === Rules.ROLES.ADMIN || currentUser.role === Rules.ROLES.OWNER;

  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <span class="sticker sticker-coral">GOVERNANCE & FAIR ACCOUNTABILITY</span>
      <h1 style="font-size: 2.25rem; margin-top: 0.35rem;">Human Review Incident Log</h1>
      <p style="color: var(--color-muted); max-width: 700px;">
        CampusShare adheres to the <strong>human-review guarantee</strong>: No student is ever penalized or fined automatically. Damage or delays open a collaborative dialogue between students and lab managers.
      </p>
    </div>

    ${!incidents.length ? `
      <div class="card-brut" style="padding: 3rem; text-align: center;">
        <p style="color: var(--color-muted); margin: 0;">✓ No recorded incidents or equipment damages.</p>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${incidents.map(inc => {
          const booking = allBookings.find(b => b.id === inc.booking_id);
          const resource = booking ? allResources.find(r => r.id === booking.resource_id) : null;
          const reporter = allUsers.find(u => u.id === inc.reporter_id);
          const borrower = booking ? allUsers.find(u => u.id === booking.user_id) : null;
          const isResolved = inc.status === 'resolved';

          return `
            <article class="card-brut" style="border-left: 8px solid ${isResolved ? 'var(--color-mint)' : 'var(--color-coral)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span class="sticker ${isResolved ? 'sticker-mint' : 'sticker-coral'}">${escapeHtml(inc.status)}</span>
                    <span class="sticker sticker-yellow">${escapeHtml(inc.incident_type)}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">INCIDENT #${inc.id}</span>
                  </div>
                  <h3 style="font-size: 1.25rem;">
                    ${escapeHtml(resource ? resource.name : 'Equipment Incident')}
                  </h3>
                </div>

                <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;">
                  <div>Reported on: ${formatDateTime(inc.created_at)}</div>
                  <div>Reported by: <strong>${escapeHtml(reporter ? reporter.name : 'User')}</strong></div>
                </div>
              </div>

              <div style="background: var(--color-paper); border: var(--border-thin); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.95rem;">
                <strong>Incident Description:</strong> ${escapeHtml(inc.description)}
              </div>

              ${isResolved ? `
                <div style="background: rgba(107, 203, 119, 0.15); border: 2px solid var(--color-mint); padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: var(--radius-sm);">
                  <strong style="color: #111; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase;">Human Review Resolution:</strong>
                  <p style="margin: 0.25rem 0 0; font-size: 0.9rem; line-height: 1.4;">${escapeHtml(inc.resolution)}</p>
                </div>
              ` : `
                ${canManage ? `
                  <form class="resolve-form" data-id="${inc.id}" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 1rem;">
                    <input type="text" class="input-brut resolve-input" placeholder="Enter findings from human review meeting / agreed resolution..." style="flex: 1; min-width: 280px;" required />
                    <button type="submit" class="btn-brut btn-sm btn-mint">
                      Record Human Resolution →
                    </button>
                  </form>
                ` : `
                  <div style="font-size: 0.85rem; color: var(--color-muted); font-family: var(--font-mono);">
                    ⏳ Awaiting human review session with lab custodian.
                  </div>
                `}
              `}
            </article>
          `;
        }).join('')}
      </div>
    `}
  `;

  // Attach resolution handlers
  container.querySelectorAll('.resolve-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const incId = form.dataset.id;
      const input = form.querySelector('.resolve-input');
      const resolution = input.value.trim();

      try {
        await Store.resolveIncident(incId, currentUser.id, resolution);
        showToast('Incident resolution recorded and logged in audit trail.', 'success');
        renderIncidents(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });
}
