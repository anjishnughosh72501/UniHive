/**
 * In-App Notifications View
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, formatDateTime } from '../ui.js';

export async function renderNotifications(params, container) {
  const currentUser = await Store.getCurrentUser();
  const [events, bookings] = await Promise.all([
    Store.listAuditEvents(),
    Store.listBookings()
  ]);

  const userBookingIds = bookings.filter(b => b.user_id === currentUser.id).map(b => b.id);

  // Filter events relevant to current user
  const relevantEvents = events.filter(e => 
    e.actor_id === currentUser.id ||
    (e.entity_type === 'booking' && userBookingIds.includes(e.entity_id))
  );

  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <span class="sticker sticker-blue">UPDATES</span>
      <h1 style="font-size: 2.25rem; margin-top: 0.35rem;">Notifications & Alerts</h1>
      <p style="color: var(--color-muted);">Stay informed on booking decisions, slot waitlist promotions, and due dates.</p>
    </div>

    ${!relevantEvents.length ? `
      <div class="card-brut" style="padding: 3rem; text-align: center;">
        <p style="color: var(--color-muted); margin: 0;">✓ You are all caught up! No unread notifications.</p>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${relevantEvents.map(e => `
          <div class="card-brut" style="padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="sticker sticker-yellow" style="font-size: 0.65rem;">${escapeHtml(e.action)}</span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">${formatDateTime(e.created_at)}</span>
              </div>
              <div style="font-size: 0.95rem; font-weight: 600;">${escapeHtml(e.details || e.action)}</div>
            </div>
            <a href="#/my-bookings" class="btn-brut btn-sm btn-secondary">View Booking →</a>
          </div>
        `).join('')}
      </div>
    `}
  `;
}
