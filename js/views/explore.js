/**
 * Explore / Component Catalog View
 * Neo-Brutalist campus noticeboard showcasing available electronics hardware,
 * microcontrollers, batteries, coils, sensors, and lab equipment with accurate SVG illustrations.
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import * as Auth from '../auth.js';
import { escapeHtml, formatDateTime } from '../ui.js';

export async function renderExplore(params, container) {
  const [resources, allBookings, currentUser] = await Promise.all([
    Store.listResources({ active: true }),
    Store.listBookings(),
    Auth.getSessionUser()
  ]);

  const categories = Array.from(new Set(resources.map(r => r.category))).sort();
  let selectedCategory = '';
  let searchQuery = '';

  function getAvailability(resource) {
    const activeBooking = allBookings.find(b => 
      b.resource_id === resource.id &&
      (b.status === Rules.BOOKING_STATUSES.APPROVED || b.status === Rules.BOOKING_STATUSES.CHECKED_OUT || b.status === Rules.BOOKING_STATUSES.ALLOTTED)
    );

    const qtyAvail = resource.quantity_available !== undefined ? resource.quantity_available : 1;
    const qtyTotal = resource.quantity_total || 1;

    if (qtyAvail > 0) {
      return { 
        status: 'free', 
        text: `${qtyAvail} of ${qtyTotal} Available`, 
        dotClass: 'avail-free' 
      };
    }

    if (activeBooking && Rules.isOverdue(activeBooking)) {
      return { status: 'overdue', text: 'Overdue for return', dotClass: 'avail-overdue' };
    }

    return { status: 'booked', text: `All ${qtyTotal} Units in Field`, dotClass: 'avail-booked' };
  }

  function filterResources() {
    return resources.filter(r => {
      const matchCat = !selectedCategory || r.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery = !searchQuery || 
        r.name.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery) ||
        r.location.toLowerCase().includes(searchQuery) ||
        (r.component_code && r.component_code.toLowerCase().includes(searchQuery)) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(searchQuery)));
      return matchCat && matchQuery;
    });
  }

  function renderCards(showSkeletons = false) {
    const grid = container.querySelector('#resources-grid');
    const countEl = container.querySelector('#results-count');

    if (showSkeletons) {
      grid.innerHTML = Array.from({ length: 4 }).map(() => `
        <div class="skeleton-card"></div>
      `).join('');
      return;
    }

    const list = filterResources();
    if (countEl) countEl.textContent = `${list.length} component${list.length === 1 ? '' : 's'} available in locker`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No Hardware Found</h3>
          <p style="color: var(--color-muted); max-width: 450px; margin: 0 auto 1.5rem;">
            No components matched your search keyword. Try clearing filters or searching for "esp32", "arduino", "battery", or "coil".
          </p>
          <button type="button" class="btn-brut btn-primary" id="btn-reset-filters">
            Reset Filters
          </button>
        </div>
      `;
      const resetBtn = grid.querySelector('#btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          selectedCategory = '';
          searchQuery = '';
          container.querySelector('#search-input').value = '';
          container.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.category === ''));
          renderCards();
        });
      }
      return;
    }

    grid.innerHTML = list.map(r => {
      const avail = getAvailability(r);
      const isTrained = !r.training_required || (currentUser && Rules.isUserTrainedForCategory(currentUser, r.category));

      return `
        <article class="card-brut resource-card card-interactive reveal-item">
          <!-- Component Image Illustration (Wikimedia Imageinfo API with SVG fallback) -->
          <div class="resource-art" style="overflow: hidden; background: #fff; position: relative; min-height: 200px; display: flex; align-items: center; justify-content: center;">
            ${r.image_url ? `
              <img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.name)}" loading="lazy" style="width: 100%; height: 210px; object-fit: contain; padding: 0.5rem; background: #fff;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div class="svg-fallback" style="display: none; width: 100%; height: 100%;">
                ${r.svgArt || `<div style="font-size:1.5rem; font-weight:800; padding:1.5rem;">${escapeHtml(r.category)}</div>`}
              </div>
            ` : (r.svgArt || `<div style="font-size:1.5rem; font-weight:800; padding:1.5rem;">${escapeHtml(r.category)}</div>`)}
            ${r.image_license ? `
              <span class="sticker sticker-white" style="position: absolute; bottom: 8px; right: 8px; font-size: 0.65rem; padding: 2px 6px; box-shadow: 2px 2px 0 #000; opacity: 0.95; z-index: 2;" title="Verified via Wikimedia Commons API:Imageinfo · ${escapeHtml(r.image_artist || '')}">
                📷 Wikimedia · ${escapeHtml(r.image_license)}
              </span>
            ` : ''}
          </div>

          <div class="resource-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
              <div>
                <span class="sticker sticker-yellow">${escapeHtml(r.category)}</span>
                ${r.component_code ? `<span class="sticker sticker-blue" style="font-size:0.65rem; margin-left:0.25rem;">${escapeHtml(r.component_code)}</span>` : ''}
              </div>
              <div class="availability-pill">
                <span class="avail-dot ${avail.dotClass}"></span>
                <span>${escapeHtml(avail.text)}</span>
              </div>
            </div>

            <h3 class="resource-title">
              <a href="#/resource/${r.id}">${escapeHtml(r.name)}</a>
            </h3>

            <p class="resource-desc">${escapeHtml(r.description)}</p>

            <div style="margin-bottom: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
              ${r.training_required ? `
                <span class="sticker ${isTrained ? 'sticker-mint' : 'sticker-coral'}" title="${isTrained ? 'Certified' : 'Training certification required'}">
                  ${isTrained ? '✓ Certified' : '⚡ Lab Cert Required'}
                </span>
              ` : '<span class="sticker sticker-mint" style="font-size:0.65rem;">Open Checkout</span>'}
              ${r.tags ? r.tags.map(t => `<span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--color-muted);">#${escapeHtml(t)}</span>`).join(' ') : ''}
            </div>

            <div class="resource-meta">
              <span>📍 ${escapeHtml(r.location)}</span>
              <div style="display: flex; gap: 0.4rem; align-items: center;">
                <a href="#/resource/${r.id}" class="btn-brut btn-sm btn-primary">Details & Request →</a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.querySelectorAll('.reveal-item').forEach((el, idx) => {
      setTimeout(() => el.classList.add('revealed'), idx * 40);
    });
  }

  container.innerHTML = `
    <!-- Hero Noticeboard Collage -->
    <section class="hero-section reveal-item revealed" aria-labelledby="hero-title">
      <div class="hero-inner">
        <div>
          <div style="margin-bottom: 0.75rem;">
            <span class="sticker sticker-primary">CAMPUS COMPONENT HUB // SMART INVENTORY</span>
          </div>
          <h1 id="hero-title" class="hero-title">
            Campus hardware, 
            <span class="highlight-doodle">
              accountably
              <svg class="doodle-svg" viewBox="0 0 160 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 10C35 4 125 3 157 9" stroke="#FFD93D" stroke-width="7" stroke-linecap="round"/>
                <path d="M12 11C45 6 110 5 145 10" stroke="#111111" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span> 
            shared.
          </h1>
          <p class="hero-lead">
            Access microcontrollers (Arduino, ESP32, Raspberry Pi), LiPo battery packs, 3D printing coils, sensors, and testing equipment for student innovation and capstone teams.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            ${currentUser ? `
              <a href="#/my-bookings" class="btn-brut btn-primary">My Active Loans →</a>
              ${currentUser.role === 'admin' ? '<a href="#/admin" class="btn-brut btn-secondary">Admin Allotment Console</a>' : ''}
              ${currentUser.role === 'volunteer' ? '<a href="#/volunteer" class="btn-brut btn-secondary">Council Volunteer Ops</a>' : ''}
            ` : `
              <a href="#/signup" class="btn-brut btn-primary">Join UniHive →</a>
              <a href="#/login" class="btn-brut btn-secondary">Sign In</a>
            `}
          </div>
        </div>

        <!-- Right Side: Noticeboard Tilted Sticky Note Cards Collage -->
        <div class="collage-container" aria-hidden="true">
          <div class="floating-shape floating-circle"></div>
          <div class="floating-shape floating-triangle"></div>

          <!-- Sticky Note 1: Arduino Uno -->
          <div class="sticky-note sticky-note-1" onclick="window.location.hash='#/resource/1'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">BENCH 3 // CS-ARD-01</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">Arduino Uno R3</div>
            <div style="font-size: 0.75rem; color: #333;">ATmega328P DIP board.</div>
            <span class="sticker sticker-mint" style="font-size: 0.65rem; margin-top: 0.5rem;">In Stock</span>
          </div>

          <!-- Sticky Note 2: ESP32 -->
          <div class="sticky-note sticky-note-2" onclick="window.location.hash='#/resource/2'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">IOT LAB // CS-ESP-02</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">ESP32 DevKit V1</div>
            <div style="font-size: 0.75rem; color: #333;">Wi-Fi + BLE 4.2 Module.</div>
            <span class="sticker sticker-yellow" style="font-size: 0.65rem; margin-top: 0.5rem;">High Demand</span>
          </div>

          <!-- Sticky Note 3: Toroid Coil -->
          <div class="sticky-note sticky-note-3" onclick="window.location.hash='#/resource/4'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">POWER BAY // CS-COIL-04</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">Toroid Coil Inductor</div>
            <div style="font-size: 0.75rem; color: #333;">220μH Ferrite Ring Coil.</div>
            <span class="sticker sticker-lilac" style="font-size: 0.65rem; margin-top: 0.5rem;">Prototyping</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Scrolling Marquee of Hardware Components -->
    <div class="marquee-bar" aria-hidden="true">
      <div class="marquee-content">
        ARDUINO UNO • ESP32 • RASPBERRY PI 4B • TOROID COILS • 3S LIPO BATTERIES • 18650 POWER PACKS • PLA 3D FILAMENT • L298N MOTOR DRIVERS • DIGITAL OSCILLOSCOPES • HC-SR04 SENSORS • 
        ARDUINO UNO • ESP32 • RASPBERRY PI 4B • TOROID COILS • 3S LIPO BATTERIES • 18650 POWER PACKS • PLA 3D FILAMENT • L298N MOTOR DRIVERS • DIGITAL OSCILLOSCOPES • HC-SR04 SENSORS • 
      </div>
    </div>

    <!-- Equipment Locker Catalog Section -->
    <section aria-labelledby="catalog-heading">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h2 id="catalog-heading" style="font-size: 1.85rem; margin-bottom: 0.25rem;">Available Components</h2>
          <p id="results-count" style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-muted);">
            ${resources.length} components available in locker
          </p>
        </div>
        
        <div style="min-width: 280px; max-width: 420px; flex: 1;">
          <label for="search-input" class="sr-only">Search components</label>
          <input type="search" id="search-input" class="input-brut" placeholder="Search by name, spec, or code (e.g. arduino, coil, esp32)..." autocomplete="off" />
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="chips-container" role="radiogroup" aria-label="Filter by Category">
        <button type="button" class="chip active" data-category="">All Components (${resources.length})</button>
        ${categories.map(cat => {
          const catCount = resources.filter(r => r.category === cat).length;
          return `<button type="button" class="chip" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${catCount})</button>`;
        }).join('')}
      </div>

      <div id="resources-grid" class="resource-grid" aria-live="polite"></div>
    </section>
  `;

  // Search input with debounce
  const searchInput = container.querySelector('#search-input');
  let debounceTimeout = null;
  searchInput.addEventListener('input', (e) => {
    renderCards(true);
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCards(false);
    }, 100);
  });

  // Category chip listeners
  const chipButtons = container.querySelectorAll('.chip');
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.dataset.category;
      renderCards();
    });
  });

  renderCards();
}
