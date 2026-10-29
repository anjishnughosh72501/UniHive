/**
 * UniHive Main Application & Hash Router
 * Production-Ready Modular Architecture
 */

import * as Store from './store.js';
import * as Rules from './rules.js';
import * as Auth from './auth.js';
import * as UI from './ui.js';

import { renderExplore } from './views/explore.js';
import { renderResourceDetail } from './views/resourceDetail.js';
import { renderMyBookings } from './views/myBookings.js';
import { renderVolunteer } from './views/volunteer.js';
import { renderIncidents } from './views/incidents.js';
import { renderActivity } from './views/activity.js';
import { renderImpact } from './views/impact.js';
import { renderAdmin } from './views/admin.js';
import { renderNotifications } from './views/notifications.js';
import { renderLogin } from './views/login.js';
import { renderSignup } from './views/signup.js';
import { renderNotFound } from './views/notFound.js';

const routes = [
  { pattern: /^#\/?$/, handler: renderExplore },
  { pattern: /^#\/login\/?$/, handler: renderLogin },
  { pattern: /^#\/signup\/?$/, handler: renderSignup },
  { pattern: /^#\/resource\/(\d+)$/, handler: (match, c) => renderResourceDetail({ id: match[1] }, c) },
  { pattern: /^#\/my-bookings\/?$/, handler: renderMyBookings },
  { pattern: /^#\/volunteer\/?$/, handler: renderVolunteer },
  { pattern: /^#\/owner\/?$/, handler: renderVolunteer }, // Alias for backwards compatibility
  { pattern: /^#\/incidents\/?$/, handler: renderIncidents },
  { pattern: /^#\/activity\/?$/, handler: renderActivity },
  { pattern: /^#\/impact\/?$/, handler: renderImpact },
  { pattern: /^#\/admin\/?$/, handler: renderAdmin },
  { pattern: /^#\/notifications\/?$/, handler: renderNotifications }
];

async function updateNavbarState() {
  const [currentUser, bookings, incidents, reports, events] = await Promise.all([
    Auth.getSessionUser(),
    Store.listBookings(),
    Store.listIncidents(),
    Store.getConditionReports(),
    Store.listAuditEvents()
  ]);

  // 1. Role-based Nav Item Visibility
  const myLoansNav = document.getElementById('nav-item-my-loans');
  const volunteerNav = document.getElementById('nav-item-volunteer');
  const incidentsNav = document.getElementById('nav-item-incidents');
  const activityNav = document.getElementById('nav-item-activity');
  const adminNav = document.getElementById('nav-item-admin');

  if (myLoansNav) myLoansNav.style.display = currentUser ? 'block' : 'none';
  if (volunteerNav) volunteerNav.style.display = (currentUser && (currentUser.role === 'volunteer' || currentUser.role === 'admin' || currentUser.role === 'owner')) ? 'block' : 'none';
  if (incidentsNav) incidentsNav.style.display = (currentUser && (currentUser.role === 'volunteer' || currentUser.role === 'admin' || currentUser.role === 'owner')) ? 'block' : 'none';
  if (activityNav) activityNav.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
  if (adminNav) adminNav.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';

  // 2. Auth Profile / Sign In Box in Navbar
  const authBox = document.getElementById('nav-auth-box');
  if (authBox) {
    if (currentUser) {
      const roleColor = currentUser.role === 'admin' ? 'sticker-lilac' : (currentUser.role === 'volunteer' ? 'sticker-yellow' : 'sticker-mint');
      authBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--color-paper); border: var(--border-medium); padding: 0.25rem 0.55rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-hard-sm);">
          <span class="sticker ${roleColor}" style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">
            ${UI.escapeHtml(currentUser.role.toUpperCase())}
          </span>
          <span style="font-weight: 800; font-size: 0.85rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${UI.escapeHtml(currentUser.name.split(' ')[0])}
          </span>
          <button type="button" id="btn-nav-logout" class="btn-brut btn-sm btn-danger" style="padding: 0.15rem 0.55rem; font-size: 0.75rem; min-height: 26px; border-width: 2px; box-shadow: 2px 2px 0 #000; cursor: pointer;">
            Sign Out
          </button>
        </div>
      `;

      const logoutBtn = document.getElementById('btn-nav-logout');
      if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
          e.preventDefault();
          await Auth.logout();
          UI.showToast('Signed out of UniHive.', 'info');
          window.location.hash = '#/login';
          window.location.reload();
        };
      }
    } else {
      authBox.innerHTML = `
        <a href="#/login" class="btn-brut btn-sm btn-secondary" style="padding: 0.35rem 0.65rem;">Sign In</a>
        <a href="#/signup" class="btn-brut btn-sm btn-primary" style="padding: 0.35rem 0.65rem;">Register</a>
      `;
    }
  }

  // 3. Update Trust Badge in Navbar
  const trustPill = document.getElementById('nav-trust-pill');
  const trustLevelText = document.getElementById('nav-trust-level');
  if (trustPill && trustLevelText) {
    if (currentUser && currentUser.role === 'student') {
      const trust = Rules.calculateTrustScore(currentUser.id, bookings, incidents, reports);
      trustLevelText.textContent = `${trust.level} (${trust.score}p)`;
      trustPill.className = `sticker ${trust.badgeClass}`;
      trustPill.style.display = 'inline-flex';
    } else {
      trustPill.style.display = 'none';
    }
  }

  // 4. Update Notification Bell & Popover
  const bellBtn = document.getElementById('nav-notif-bell');
  const badge = document.getElementById('notif-badge');
  const popover = document.getElementById('notif-popover');
  const notifList = document.getElementById('notif-list');
  const markReadBtn = document.getElementById('btn-mark-all-read');

  if (bellBtn && badge && popover && notifList) {
    if (!currentUser) {
      bellBtn.style.display = 'none';
      return;
    }
    bellBtn.style.display = 'inline-flex';

    const userBookings = bookings.filter(b => b.user_id === currentUser.id);
    const userBookingIds = userBookings.map(b => b.id);

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

// Register PWA Service Worker
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
    initPwa();

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
