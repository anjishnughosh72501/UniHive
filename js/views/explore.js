/**
 * Explore / Noticeboard Catalog View
 * Neo-Brutalist campus noticeboard with collage, live filtering, and quick persona switcher.
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, formatDateTime } from '../ui.js';

export async function renderExplore(params, container) {
  const [resources, allBookings, currentUser] = await Promise.all([
    Store.listResources({ active: true }),
    Store.listBookings(),
    Store.getCurrentUser()
  ]);

  const categories = Array.from(new Set(resources.map(r => r.category))).sort();
  let selectedCategory = '';
  let searchQuery = '';

  function getAvailability(resource) {
    const activeBooking = allBookings.find(b => 
      b.resource_id === resource.id &&
      (b.status === Rules.BOOKING_STATUSES.APPROVED || b.status === Rules.BOOKING_STATUSES.CHECKED_OUT)
    );

    if (!activeBooking) {
      return { status: 'free', text: 'Free now', dotClass: 'avail-free' };
    }

    if (Rules.isOverdue(activeBooking)) {
      return { status: 'overdue', text: 'Overdue return', dotClass: 'avail-overdue' };
    }

    if (activeBooking.status === Rules.BOOKING_STATUSES.CHECKED_OUT) {
      return { status: 'booked', text: `In use until ${formatDateTime(activeBooking.end_at)}`, dotClass: 'avail-booked' };
    }

    return { status: 'booked', text: `Reserved from ${formatDateTime(activeBooking.start_at)}`, dotClass: 'avail-booked' };
  }

  function filterResources() {
    return resources.filter(r => {
      const matchCat = !selectedCategory || r.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery = !searchQuery || 
        r.name.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery) ||
        r.location.toLowerCase().includes(searchQuery) ||
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
    if (countEl) countEl.textContent = `${list.length} item${list.length === 1 ? '' : 's'} available on campus`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No Equipment Found</h3>
          <p style="color: var(--color-muted); max-width: 450px; margin: 0 auto 1.5rem;">
            No items matched your search query. Try clearing your filters or search keywords.
          </p>
          <button type="button" class="btn-brut btn-primary" id="btn-reset-filters">
            Reset All Filters
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
      const isTrained = !r.training_required || Rules.isUserTrainedForCategory(currentUser, r.category);

      return `
        <article class="card-brut resource-card card-interactive reveal-item">
          <div class="resource-art">
            ${r.svgArt || `<div style="font-size:2rem; font-weight:800;">${escapeHtml(r.category)}</div>`}
          </div>
          <div class="resource-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="sticker sticker-yellow">${escapeHtml(r.category)}</span>
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
                <span class="sticker ${isTrained ? 'sticker-mint' : 'sticker-coral'}" title="${isTrained ? 'You have verified certification' : 'Training certification required'}">
                  ${isTrained ? '✓ Certified' : '⚡ Training Required'}
                </span>
              ` : '<span class="sticker sticker-mint" style="font-size:0.65rem;">Open Access</span>'}
              ${r.tags ? r.tags.map(t => `<span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--color-muted);">#${escapeHtml(t)}</span>`).join(' ') : ''}
            </div>

            <div class="resource-meta">
              <span>📍 ${escapeHtml(r.location)}</span>
              <a href="#/resource/${r.id}" class="btn-brut btn-sm btn-primary">Details & Request →</a>
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
            <span class="sticker sticker-primary">DEMO HACKATHON EDITION // VERIFIED GEAR LOCKER</span>
          </div>
          <h1 id="hero-title" class="hero-title">
            Campus gear, 
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
            Borrow high-value oscilloscopes, cinema cameras, drones and 3D printers with peer verification, physical QR handovers, and clear condition records.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <a href="#/my-bookings" class="btn-brut btn-primary">My Borrowed Gear →</a>
            <a href="#/impact" class="btn-brut btn-secondary">View Impact Stats</a>
          </div>
        </div>

        <!-- Right Side: College Noticeboard Tilted Sticky Note Cards Collage -->
        <div class="collage-container" aria-hidden="true">
          <div class="floating-shape floating-circle"></div>
          <div class="floating-shape floating-triangle"></div>

          <!-- Sticky Note 1: Oscilloscope preview -->
          <div class="sticky-note sticky-note-1" onclick="window.location.hash='#/resource/1'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">LAB NOTICE // HALL B204</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">100MHz Oscilloscope</div>
            <div style="font-size: 0.75rem; color: #333;">Dual-channel test bench probe kit.</div>
            <span class="sticker sticker-mint" style="font-size: 0.65rem; margin-top: 0.5rem;">Free to Request</span>
          </div>

          <!-- Sticky Note 2: Camera preview -->
          <div class="sticky-note sticky-note-2" onclick="window.location.hash='#/resource/4'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">MEDIA ARTS // STUDIO C</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">Sony A7 IV Cinema</div>
            <div style="font-size: 0.75rem; color: #333;">24-70mm f/2.8 GM rig ready.</div>
            <span class="sticker sticker-yellow" style="font-size: 0.65rem; margin-top: 0.5rem;">High Demand</span>
          </div>

          <!-- Sticky Note 3: 3D Printer preview -->
          <div class="sticky-note sticky-note-3" onclick="window.location.hash='#/resource/10'">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; color: #555;">MAKERSPACE // BAY 4</div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; margin: 0.25rem 0;">Bambu Lab X1 Carbon</div>
            <div style="font-size: 0.75rem; color: #333;">Multi-material PETG/CF.</div>
            <span class="sticker sticker-lilac" style="font-size: 0.65rem; margin-top: 0.5rem;">Training Req.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Scrolling Marquee of Category Names -->
    <div class="marquee-bar" aria-hidden="true">
      <div class="marquee-content">
        LAB KITS • CINEMA RIGS • FIELD AUDIO • 3D PRINTERS • AERIAL DRONES • CAD WORKSTATIONS • ATHLETIC GEAR • CHAIN-OF-CUSTODY HANDOVERS • 
        LAB KITS • CINEMA RIGS • FIELD AUDIO • 3D PRINTERS • AERIAL DRONES • CAD WORKSTATIONS • ATHLETIC GEAR • CHAIN-OF-CUSTODY HANDOVERS • 
      </div>
    </div>

    <!-- Quick Persona Switcher Strip for Hackathon Judges -->
    <section class="card-brut" style="background: var(--color-paper); margin-bottom: 2.5rem; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div>
          <strong style="font-family: var(--font-heading); font-size: 1rem;">⚡ Quick Hackathon Role Demo:</strong>
          <span style="font-size: 0.85rem; color: var(--color-muted); margin-left: 0.5rem;">Jump instantly between student, owner, and admin perspectives:</span>
        </div>
        <span class="sticker sticker-blue">Active: ${escapeHtml(currentUser.name)} (${currentUser.role})</span>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-brut btn-sm ${currentUser.id === 1 ? 'btn-primary' : 'btn-secondary'} btn-quick-role" data-id="1">
          🎓 Student (Maya Chen)
        </button>
        <button type="button" class="btn-brut btn-sm ${currentUser.id === 8 ? 'btn-primary' : 'btn-secondary'} btn-quick-role" data-id="8">
          ⚠️ Student with Overdue Item (Marcus Vance)
        </button>
        <button type="button" class="btn-brut btn-sm ${currentUser.id === 101 ? 'btn-primary' : 'btn-secondary'} btn-quick-role" data-id="101">
          🔬 Lab Custodian (Dr. Aris Miller)
        </button>
        <button type="button" class="btn-brut btn-sm ${currentUser.id === 102 ? 'btn-primary' : 'btn-secondary'} btn-quick-role" data-id="102">
          📷 Media Lab Custodian (Sarah Jenkins)
        </button>
        <button type="button" class="btn-brut btn-sm ${currentUser.id === 201 ? 'btn-primary' : 'btn-secondary'} btn-quick-role" data-id="201">
          🏛️ Campus Administrator (Dean Alice Cooper)
        </button>
      </div>
    </section>

    <!-- Equipment Locker Catalog Section -->
    <section aria-labelledby="catalog-heading">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h2 id="catalog-heading" style="font-size: 1.85rem; margin-bottom: 0.25rem;">Equipment Locker</h2>
          <p id="results-count" style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-muted);">
            ${resources.length} items available on campus
          </p>
        </div>
        
        <div style="min-width: 280px; max-width: 420px; flex: 1;">
          <label for="search-input" class="sr-only">Search equipment</label>
          <input type="search" id="search-input" class="input-brut" placeholder="Search by gear name, specs, or tag (e.g. 4k, fpga)..." autocomplete="off" />
        </div>
      </div>

      <!-- Sticky Category Chips Filter -->
      <div class="chips-container" role="radiogroup" aria-label="Filter by Category">
        <button type="button" class="chip active" data-category="">All Categories (${resources.length})</button>
        ${categories.map(cat => {
          const catCount = resources.filter(r => r.category === cat).length;
          return `<button type="button" class="chip" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${catCount})</button>`;
        }).join('')}
      </div>

      <div id="resources-grid" class="resource-grid" aria-live="polite"></div>
    </section>
  `;

  // Quick role buttons listener
  container.querySelectorAll('.btn-quick-role').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uId = btn.dataset.id;
      await Store.setCurrentUser(uId);
      window.location.reload();
    });
  });

  // Attach search and filter event listeners
  const searchInput = container.querySelector('#search-input');
  let debounceTimeout = null;
  searchInput.addEventListener('input', (e) => {
    renderCards(true); // Show skeleton shimmer immediately
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCards(false);
    }, 120);
  });

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
