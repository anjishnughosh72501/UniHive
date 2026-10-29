/**
 * CampusShare Main Application & Hash Router
 */

import * as Store from './store.js';
import * as Rules from './rules.js';
import * as UI from './ui.js';

import { renderExplore } from './views/explore.js';
import { renderResourceDetail } from './views/resourceDetail.js';
import { renderMyBookings } from './views/myBookings.js';
import { renderOwnerDashboard } from './views/ownerDashboard.js';
import { renderIncidents } from './views/incidents.js';
import { renderActivity } from './views/activity.js';
import { renderImpact } from './views/impact.js';
import { renderAdmin } from './views/admin.js';
import { renderNotifications } from './views/notifications.js';
import { renderNotFound } from './views/notFound.js';

const routes = [
  { pattern: /^#\/?$/, handler: renderExplore },
  { pattern: /^#\/resource\/(\d+)$/, handler: (match, c) => renderResourceDetail({ id: match[1] }, c) },
  { pattern: /^#\/my-bookings\/?$/, handler: renderMyBookings },
  { pattern: /^#\/owner\/?$/, handler: renderOwnerDashboard },
  { pattern: /^#\/incidents\/?$/, handler: renderIncidents },
  { pattern: /^#\/activity\/?$/, handler: renderActivity },
  { pattern: /^#\/impact\/?$/, handler: renderImpact },
  { pattern: /^#\/admin\/?$/, handler: renderAdmin },
  { pattern: /^#\/notifications\/?$/, handler: renderNotifications }
];

async function updateNavbarState() {
  const [currentUser, bookings, incidents, reports, events] = await Promise.all([
    Store.getCurrentUser(),
    Store.listBookings(),
    Store.listIncidents(),
    Store.getConditionReports(),
    Store.listAuditEvents()
  ]);

  // 1. Update Trust Badge in Navbar
  const trustPill = document.getElementById('nav-trust-pill');
  const trustLevelText = document.getElementById('nav-trust-level');
  if (trustPill && trustLevelText) {
    if (currentUser.role === 'student') {
      const trust = Rules.calculateTrustScore(currentUser.id, bookings, incidents, reports);
      trustLevelText.textContent = `${trust.level} (${trust.score}p)`;
      trustPill.className = `sticker ${trust.badgeClass}`;
      trustPill.style.display = 'inline-flex';
    } else {
      trustPill.style.display = 'none';
    }
  }

  // 2. Update Notification Bell & Popover (2.4)
  const bellBtn = document.getElementById('nav-notif-bell');
  const badge = document.getElementById('notif-badge');
  const popover = document.getElementById('notif-popover');
  const notifList = document.getElementById('notif-list');
  const markReadBtn = document.getElementById('btn-mark-all-read');

  if (bellBtn && badge && popover && notifList) {
    const userBookings = bookings.filter(b => b.user_id === currentUser.id);
    const userBookingIds = userBookings.map(b => b.id);

    // Identify user-relevant events
    const relevantEvents = events.filter(e => 
      e.actor_id === currentUser.id ||
      (e.entity_type === 'booking' && userBookingIds.includes(e.entity_id)) ||
      currentUser.role === 'admin'
    ).slice(0, 8);

    const hasRead = localStorage.getItem(`notifs_read_${currentUser.id}`) === 'true';
    const unreadCount = hasRead ? 0 : Math.min(relevantEvents.length, 5);

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }

    notifList.innerHTML = relevantEvents.length ? relevantEvents.map(e => `
      <div style="font-size:0.8rem; padding:0.4rem 0.6rem; background:var(--color-paper); border:var(--border-thin); border-radius:var(--radius-sm);">
        <div style="display:flex; justify-content:space-between; color:var(--color-muted); font-size:0.7rem; margin-bottom:0.2rem;">
          <span class="sticker sticker-yellow" style="font-size:0.6rem; padding:0.1rem 0.3rem;">${UI.escapeHtml(e.action)}</span>
          <span>${UI.formatDateTime(e.created_at)}</span>
        </div>
        <div style="font-weight:600;">${UI.escapeHtml(e.details || e.action)}</div>
      </div>
    `).join('') : '<p style="font-size:0.8rem; color:var(--color-muted); margin:0;">No notifications.</p>';

    bellBtn.onclick = (e) => {
      e.stopPropagation();
      popover.style.display = popover.style.display === 'block' ? 'none' : 'block';
    };

    if (markReadBtn) {
      markReadBtn.onclick = () => {
        localStorage.setItem(`notifs_read_${currentUser.id}`, 'true');
        badge.style.display = 'none';
        UI.showToast('All notifications marked as read.', 'info');
      };
    }

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== bellBtn) {
        popover.style.display = 'none';
      }
    });
  }
}

async function route() {
  const hash = window.location.hash || '#/';
  const container = document.getElementById('view-container');
  if (!container) return;

  let matchedHandler = null;
  let matchResult = null;

  for (const r of routes) {
    const match = hash.match(r.pattern);
    if (match) {
      matchedHandler = r.handler;
      matchResult = match;
      break;
    }
  }

  if (!matchedHandler) {
    matchedHandler = (params, c) => renderNotFound(params, c);
  }

  // Update nav active link
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash || (hash.startsWith(href) && href !== '#/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // View transition wrapper
  const transitionExec = async () => {
    container.innerHTML = '<div style="padding: 3rem; text-align: center; font-family: var(--font-mono);">Loading...</div>';
    await matchedHandler(matchResult, container);
    await updateNavbarState();
    UI.initScrollReveal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => transitionExec());
  } else {
    await transitionExec();
  }
}

async function initNavbarUserSwitcher() {
  const select = document.getElementById('global-role-switcher');
  if (!select) return;

  const [users, current] = await Promise.all([
    Store.listUsers(),
    Store.getCurrentUser()
  ]);

  select.innerHTML = users.map(u => `
    <option value="${u.id}" ${u.id === current.id ? 'selected' : ''}>
      ${UI.escapeHtml(u.name)} (${UI.escapeHtml(u.role)})
    </option>
  `).join('');

  select.addEventListener('change', async (e) => {
    await Store.setCurrentUser(e.target.value);
    UI.showToast(`Switched active profile to ${select.options[select.selectedIndex].text}`, 'info');
    await route();
  });
}

// Register PWA Service Worker (3.3)
function initPwa() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('PWA service worker registration skipped:', err);
    });
  }
}

async function boot() {
  try {
    await Store.initStore();
    UI.initTheme();
    await initNavbarUserSwitcher();
    initPwa();

    // Reset demo button handler
    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Reset demo state to initial seed data? All temporary bookings and modifications will be refreshed.')) {
          await Store.resetStore();
          UI.showToast('Demo store successfully reseeded!', 'success');
          setTimeout(() => window.location.reload(), 400);
        }
      });
    }

    window.addEventListener('hashchange', route);
    await route();
  } catch (err) {
    console.error('Fatal application boot error:', err);
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = `
        <div class="card-brut" style="padding: 2rem; border-color: var(--color-coral);">
          <h2>Application Initialization Error</h2>
          <pre style="margin-top: 1rem; font-family: monospace;">${UI.escapeHtml(err.stack || err.message)}</pre>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
