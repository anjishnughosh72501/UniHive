/**
 * Activity & Audit Trail View
 * Day-grouped icon timeline adhering to immutable audit logging.
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, formatDateTime, formatDateOnly } from '../ui.js';

export async function renderActivity(params, container) {
  const [events, users] = await Promise.all([
    Store.listAuditEvents(),
    Store.listUsers()
  ]);

  // Group events by day
  const grouped = {};
  for (const ev of events) {
    const dayKey = ev.created_at ? ev.created_at.split('T')[0] : 'Unknown';
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(ev);
  }

  const sortedDays = Object.keys(grouped).sort().reverse();

  const actionIcons = {
    booking_requested: '📥',
    booking_approved: '✓',
    booking_rejected: '✖',
    booking_waitlisted: '⏳',
    booking_cancelled: '🚫',
    resource_checked_out: '📦',
    resource_returned: '↩',
    condition_before_recorded: '📝',
    condition_after_recorded: '📝',
    incident_opened: '⚠️',
    incident_resolved: '⚖️',
    resource_listed: '✨',
    training_granted: '🎓',
    system_initialized: '⚡'
  };

  const actionBadges = {
    booking_requested: 'sticker-yellow',
    booking_approved: 'sticker-mint',
    booking_rejected: 'sticker-coral',
    booking_waitlisted: 'sticker-blue',
    booking_cancelled: 'sticker-coral',
    resource_checked_out: 'sticker-blue',
    resource_returned: 'sticker-mint',
    incident_opened: 'sticker-coral',
    incident_resolved: 'sticker-mint'
  };

  container.innerHTML = `
    <div style="margin-bottom: 2.5rem;">
      <span class="sticker sticker-primary">IMMUTABLE CHAIN-OF-CUSTODY AUDIT LOG</span>
      <h1 style="font-size: 2.5rem; margin-top: 0.35rem;">Campus Equipment Timeline</h1>
      <p style="color: var(--color-muted); max-width: 700px;">
        Chronological audit records of all equipment requests, custody transfers, condition assessments, and human review resolutions across the university.
      </p>
    </div>

    ${!events.length ? `
      <div class="empty-state">
        <h3 style="margin-bottom: 0.5rem;">No Recorded Activity</h3>
        <p style="color: var(--color-muted);">Activity will populate automatically as equipment is requested and loaned.</p>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 2.5rem;">
        ${sortedDays.map(day => `
          <div>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
              <span class="sticker sticker-primary" style="font-size: 0.85rem; font-weight: 800; padding: 0.3rem 0.8rem;">
                📅 ${formatDateOnly(day)}
              </span>
              <div style="flex: 1; height: 3px; background: var(--color-ink);"></div>
            </div>

            <div class="card-brut" style="padding: 1.5rem 1.75rem;">
              <div class="timeline">
                ${grouped[day].map(ev => {
                  const actor = users.find(u => u.id === ev.actor_id);
                  const icon = actionIcons[ev.action] || '•';
                  const badgeClass = actionBadges[ev.action] || 'sticker-yellow';

                  return `
                    <div class="timeline-item reveal-item revealed">
                      <div class="timeline-time">${formatDateTime(ev.created_at)}</div>
                      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                        <span class="sticker ${badgeClass}" style="font-size: 0.7rem;">
                          ${icon} ${escapeHtml(ev.action.replace(/_/g, ' '))}
                        </span>
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">
                          ${escapeHtml(ev.entity_type)} #${ev.entity_id}
                        </span>
                      </div>
                      <div style="font-weight: 700; font-size: 0.95rem; line-height: 1.4;">
                        ${escapeHtml(actor ? actor.name : 'System')} — ${escapeHtml(ev.details || ev.action)}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}
