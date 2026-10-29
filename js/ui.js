/**
 * UI Utilities: Toasts, Accessibility, Theme, Formatting, and Animations
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Toast notification system with auto-dismiss and pause on hover
 */
export function showToast(message, type = 'info', durationMs = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const icons = {
    success: '✓',
    warning: '⚠',
    danger: '✖',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-size: 1.25rem;">${icons[type] || '•'}</span>
    <div style="flex: 1;">${escapeHtml(message)}</div>
    <button type="button" aria-label="Dismiss toast" style="background:none; border:none; cursor:pointer; font-weight:bold; font-size:1.1rem; padding:0.2rem 0.4rem; color:inherit;">×</button>
  `;

  const closeBtn = toast.querySelector('button');
  let timer = null;
  let remaining = durationMs;
  let start = Date.now();

  const remove = () => {
    toast.style.animation = 'toastSlideIn 0.2s reverse forwards';
    setTimeout(() => toast.remove(), 200);
  };

  closeBtn.addEventListener('click', remove);

  const startTimer = () => {
    start = Date.now();
    timer = setTimeout(remove, remaining);
  };

  const pauseTimer = () => {
    clearTimeout(timer);
    remaining -= (Date.now() - start);
  };

  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', () => {
    if (remaining > 0) startTimer();
    else remove();
  });

  container.appendChild(toast);
  startTimer();
}

/**
 * Format UTC ISO string to friendly local date/time
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return isoString;
  }
}

export function formatDateOnly(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return isoString;
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Theme switcher management
 */
export function initTheme() {
  const THEME_KEY = 'campusshare_theme';
  const toggleBtn = document.getElementById('theme-toggle-btn');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (toggleBtn) {
      toggleBtn.textContent = theme === 'dark' ? '☀ LIGHT' : '☾ DARK';
      toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  };

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (e) {}

  if (!savedTheme) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    savedTheme = prefersDark ? 'dark' : 'light';
  }

  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

/**
 * Animate numbers counting up on scroll
 */
export function animateCounter(element, targetValue, duration = 1200) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (targetValue - start) * ease);
    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

/**
 * Scroll reveal with IntersectionObserver
 */
export function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, idx * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal-item:not(.revealed)').forEach(el => observer.observe(el));
}
