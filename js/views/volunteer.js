/**
 * Technical Council Volunteer & Component Management Workspace
 * Permissions: Council Volunteers & Admins
 * Features:
 * - Add new hardware component to inventory
 * - Remove / Archive components from the catalog
 * - Approve / Reject student component requests
 * - Complete physical checkout and return handovers with QR scanner
 * - Monitor active and overdue project hardware
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import * as Auth from '../auth.js';
import * as Media from '../media.js';
import { generateComponentSvg } from '../seed.js';
import { QrScannerModal } from '../qr.js';
import { escapeHtml, formatDateTime, showToast, formatCurrency } from '../ui.js';

export async function renderVolunteer(params, container) {
  const currentUser = await Auth.getSessionUser();

  if (!currentUser || (currentUser.role !== 'volunteer' && currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
    container.innerHTML = `
      <div class="card-brut" style="max-width: 580px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
        <h2>Council Volunteer Authorization Required</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 1.5rem;">
          This workspace is reserved for Technical Council Volunteers and Administrators to manage available electronics components and handovers.
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="#/login" class="btn-brut btn-primary">Sign In as Volunteer →</a>
          <a href="#/signup" class="btn-brut btn-secondary">Register Volunteer Account</a>
        </div>
      </div>
    `;
    return;
  }

  const [allResources, allBookings, allUsers, conditionReports] = await Promise.all([
    Store.listResources({ active: undefined }),
    Store.listBookings(),
    Store.listUsers(),
    Store.getConditionReports()
  ]);

  const managedResources = allResources;
  const pendingRequests = allBookings.filter(b => b.status === Rules.BOOKING_STATUSES.PENDING || b.status === Rules.BOOKING_STATUSES.WAITLISTED);
  const checkedOutBookings = allBookings.filter(b => b.status === Rules.BOOKING_STATUSES.CHECKED_OUT || b.status === Rules.BOOKING_STATUSES.ALLOTTED);
  const overdueBookings = allBookings.filter(b => Rules.isOverdue(b));

  container.innerHTML = `
    <!-- Top Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
      <div>
        <div style="margin-bottom: 0.35rem;">
          <span class="sticker ${currentUser.role === 'admin' ? 'sticker-lilac' : 'sticker-yellow'}">
            ${currentUser.role === 'admin' ? 'CENTRAL ADMIN WORKSPACE' : 'TECHNICAL COUNCIL VOLUNTEER WORKSPACE'}
          </span>
        </div>
        <h1 style="font-size: 2.25rem;">Component Inventory & Handover Ops</h1>
        <p style="color: var(--color-muted);">
          Logged in as <strong>${escapeHtml(currentUser.name)}</strong> (${escapeHtml(currentUser.role)}). Add/remove components, verify handovers, and track project loans.
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button type="button" class="btn-brut btn-primary" id="btn-open-add-modal">
          + Add New Component
        </button>
        <button type="button" class="btn-brut btn-secondary" id="btn-open-qr-scanner">
          📷 Scan Handover Pass
        </button>
      </div>
    </div>

    <!-- Overdue Alert Strip -->
    ${overdueBookings.length ? `
      <div class="card-brut" style="background: var(--color-coral); color: #111; margin-bottom: 2rem; border-width: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 2rem;">⚠️</span>
            <div>
              <h3 style="margin-bottom: 0.2rem; font-size: 1.2rem;">OVERDUE EQUIPMENT ALERT (${overdueBookings.length})</h3>
              <p style="margin: 0; font-size: 0.9rem;">The following hardware is overdue for return to the locker:</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          ${overdueBookings.map(ob => {
            const res = allResources.find(r => r.id === ob.resource_id);
            const borrower = allUsers.find(u => u.id === ob.user_id);
            return `
              <div style="background: #fff; border: 2px solid #111; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <strong>${escapeHtml(res ? res.name : 'Unknown')}</strong> — Loaned to <strong>${escapeHtml(borrower ? borrower.name : 'Student')}</strong>
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #666;">
                    Scheduled Return: ${formatDateTime(ob.end_at)} · Token: <code>${escapeHtml(ob.qr_token || 'N/A')}</code>
                  </div>
                </div>
                <button type="button" class="btn-brut btn-sm btn-primary btn-checkout-action" data-action="return" data-id="${ob.id}">
                  Confirm Return Handover →
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Stat Metrics -->
    <div class="metric-grid" style="margin-bottom: 2.5rem;">
      <div class="metric-card">
        <div class="metric-val">${managedResources.filter(r => r.active).length}</div>
        <div class="metric-label">Active Components</div>
      </div>
      <div class="metric-card" style="border-color: ${pendingRequests.length ? 'var(--color-primary)' : 'var(--color-ink)'};">
        <div class="metric-val">${pendingRequests.length}</div>
        <div class="metric-label">Pending Reviews</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${checkedOutBookings.length}</div>
        <div class="metric-label">Currently in Field</div>
      </div>
      <div class="metric-card" style="border-color: ${overdueBookings.length ? 'var(--color-coral)' : 'var(--color-ink)'};">
        <div class="metric-val" style="color: ${overdueBookings.length ? 'var(--color-coral)' : 'inherit'};">${overdueBookings.length}</div>
        <div class="metric-label">Overdue Items</div>
      </div>
    </div>

    <!-- Component Management Section -->
    <section class="card-brut" style="margin-bottom: 3rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.5rem; margin: 0 0 0.25rem;">Manage Available Components</h2>
          <p style="color: var(--color-muted); margin: 0; font-size: 0.9rem;">
            As a council volunteer or admin, you can add new components or remove decommissioned items from the available catalog.
          </p>
        </div>
        <button type="button" class="btn-brut btn-sm btn-primary" id="btn-open-add-modal-2">
          + Add Component
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${managedResources.map(r => `
          <div style="padding: 1rem; border: var(--border-thin); background: var(--color-paper); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-radius: var(--radius-sm);">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 50px; height: 35px; border: var(--border-thin); background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${r.image_url ? `<img src="${escapeHtml(r.image_url)}" style="width:100%; height:100%; object-fit:contain;" alt="" />` : (r.svgArt || `<span style="font-size:0.7rem; font-weight:bold;">${escapeHtml(r.category)}</span>`)}
              </div>
              <div>
                <strong>${escapeHtml(r.name)}</strong>
                <span class="sticker sticker-yellow" style="font-size: 0.65rem; margin-left: 0.4rem;">${escapeHtml(r.category)}</span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted); margin-left: 0.4rem;">Code: <code>${escapeHtml(r.component_code || 'N/A')}</code></span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; margin-left: 0.4rem; font-weight: 700;">
                  Qty: ${r.quantity_available !== undefined ? r.quantity_available : 1} / ${r.quantity_total || 1} avail
                </span>
                ${!r.active ? '<span class="sticker sticker-coral" style="margin-left:0.5rem;">ARCHIVED</span>' : ''}
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <a href="#/resource/${r.id}" class="btn-brut btn-sm btn-secondary">View Page</a>
              <button type="button" class="btn-brut btn-sm ${r.active ? 'btn-secondary' : 'btn-mint'} btn-toggle-active" data-id="${r.id}" data-active="${r.active}">
                ${r.active ? 'Archive' : 'Restore'}
              </button>
              <button type="button" class="btn-brut btn-sm btn-danger btn-delete-component" data-id="${r.id}" data-name="${escapeHtml(r.name)}">
                🗑️ Remove
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Request Inbox Section -->
    <section style="margin-bottom: 3rem;">
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Actionable Student Request Inbox</h2>

      ${!pendingRequests.length ? `
        <div class="card-brut" style="padding: 2.5rem; text-align: center;">
          <p style="color: var(--color-muted); margin: 0;">✓ All pending loan requests have been reviewed.</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${pendingRequests.map(b => {
            const res = allResources.find(r => r.id === b.resource_id);
            const borrower = allUsers.find(u => u.id === b.user_id);
            const userTrust = Rules.calculateTrustScore(b.user_id, allBookings, [], conditionReports);

            return `
              <div class="card-brut" style="border-left: 8px solid ${b.status === 'waitlisted' ? 'var(--color-blue)' : 'var(--color-primary)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                  <div>
                    <span class="sticker ${b.status === 'waitlisted' ? 'sticker-blue' : 'sticker-yellow'}">${escapeHtml(b.status)}</span>
                    <span class="sticker ${userTrust.badgeClass}" style="margin-left: 0.35rem;">Trust Standing: ${userTrust.level}</span>
                    <h3 style="font-size: 1.25rem; margin-top: 0.35rem;">
                      ${escapeHtml(res ? res.name : 'Hardware')} requested by <strong>${escapeHtml(borrower ? borrower.name : 'Student')}</strong>
                    </h3>
                    <div style="font-size: 0.8rem; color: var(--color-muted); font-family: var(--font-mono);">
                      Student ID: ${escapeHtml(borrower ? borrower.student_id || borrower.email : '')}
                    </div>
                  </div>

                  <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;">
                    <div>Requested Window:</div>
                    <strong>${formatDateTime(b.start_at)} → ${formatDateTime(b.end_at)}</strong>
                  </div>
                </div>

                <div style="background: var(--color-paper); padding: 0.75rem 1rem; border: var(--border-thin); margin-bottom: 1rem; font-size: 0.9rem;">
                  <strong>Purpose / Project:</strong> ${escapeHtml(b.purpose)}
                </div>

                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                  <input type="text" class="input-brut decision-reason-input" data-id="${b.id}" placeholder="Optional decision note / pickup desk instructions..." style="flex: 1; min-width: 260px;" />
                  <button type="button" class="btn-brut btn-sm btn-mint btn-decide" data-id="${b.id}" data-decision="approved">
                    ✓ Approve Request
                  </button>
                  <button type="button" class="btn-brut btn-sm btn-danger btn-decide" data-id="${b.id}" data-decision="rejected">
                    ✖ Reject Request
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </section>

    <!-- Physical Handover Operations -->
    <section style="margin-bottom: 3rem;">
      <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Physical Handover Operations</h2>
      <p style="color: var(--color-muted); margin-bottom: 1rem;">
        Council volunteers inspect components and record handovers when students pick up or return hardware.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${allBookings.filter(b => b.status === 'approved' || b.status === 'checked_out' || b.status === 'allotted').map(b => {
          const res = allResources.find(r => r.id === b.resource_id);
          const borrower = allUsers.find(u => u.id === b.user_id);
          const reports = conditionReports.filter(c => c.booking_id === b.id);
          const hasBefore = reports.some(r => r.stage === 'before');
          const hasAfter = reports.some(r => r.stage === 'after');

          return `
            <div class="card-brut" style="padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <span class="sticker ${b.status === 'checked_out' || b.status === 'allotted' ? 'sticker-blue' : 'sticker-mint'}">
                    ${b.status === 'allotted' ? 'ADMIN ALLOTTED' : escapeHtml(b.status)}
                  </span>
                  <strong style="margin-left: 0.5rem; font-size: 1.1rem;">${escapeHtml(res ? res.name : '')}</strong>
                  <div style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.25rem;">
                    Borrower: <strong>${escapeHtml(borrower ? borrower.name : '')}</strong> · Token: <code>${escapeHtml(b.qr_token || 'N/A')}</code>
                  </div>
                </div>

                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                  ${b.status === 'approved' ? `
                    ${hasBefore ? `
                      <button type="button" class="btn-brut btn-sm btn-primary btn-checkout-action" data-action="checkout" data-id="${b.id}">
                        📦 Complete Check-out Handover
                      </button>
                    ` : `
                      <button type="button" class="btn-brut btn-sm btn-primary btn-quick-inspect-checkout" data-id="${b.id}">
                        ✓ Inspect & Release Component
                      </button>
                    `}
                  ` : ''}

                  ${b.status === 'checked_out' || b.status === 'allotted' ? `
                    ${hasAfter ? `
                      <button type="button" class="btn-brut btn-sm btn-mint btn-checkout-action" data-action="return" data-id="${b.id}">
                        ✓ Confirm Return Handover
                      </button>
                    ` : `
                      <button type="button" class="btn-brut btn-sm btn-mint btn-quick-inspect-return" data-id="${b.id}">
                        ✓ Inspect & Confirm Return
                      </button>
                    `}
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- Modal: Add New Component -->
    <div id="add-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9990; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="card-brut" style="max-width: 600px; width: 100%; background: var(--color-paper-card); max-height: 90vh; overflow-y: auto;">
        <h3 style="margin-bottom: 0.5rem;">Add Available Component to Locker</h3>
        <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">
          Register new microcontrollers, battery packs, sensor modules, or 3D printer supplies.
        </p>

        <form id="add-component-form">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="comp-name">Component Title & Model</label>
            <input type="text" id="comp-name" class="input-brut" placeholder="e.g. ESP32-CAM AI Vision Module" required />
          </div>

          <!-- Product Picture via MediaWiki API:Imageinfo -->
          <div class="form-group" style="margin-bottom: 1.25rem; background: var(--color-paper); padding: 0.85rem; border: var(--border-medium); border-radius: var(--radius-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" style="margin: 0; font-size: 0.8rem;">📷 Product Picture (MediaWiki Imageinfo API)</label>
              <span class="sticker sticker-white" style="font-size: 0.6rem; padding: 1px 5px;">Wikimedia Commons</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" id="wiki-search-query" class="input-brut" placeholder="Search Wikimedia Commons (e.g. ESP32, Arduino)..." style="font-size: 0.85rem; padding: 0.4rem 0.65rem;" />
              <button type="button" id="btn-wiki-search" class="btn-brut btn-sm btn-primary" style="white-space: nowrap; font-size: 0.8rem;">
                🔍 Search
              </button>
            </div>
            <div id="wiki-search-status" style="font-size: 0.75rem; color: var(--color-muted); margin-top: 0.35rem; display: none;"></div>
            <div id="wiki-search-results" style="display: none; margin-top: 0.5rem; max-height: 160px; overflow-y: auto; gap: 0.5rem; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); padding: 0.5rem; background: #fff; border: 1px solid #ccc;"></div>
            <div id="wiki-selected-preview" style="display: none; margin-top: 0.5rem; align-items: center; gap: 0.75rem; background: #fff; padding: 0.4rem; border: var(--border-thin);">
              <img id="wiki-preview-img" src="" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #ddd;" alt="" />
              <div style="flex: 1; min-width: 0;">
                <div id="wiki-preview-title" style="font-weight: bold; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                <div id="wiki-preview-meta" style="color: var(--color-muted); font-size: 0.7rem;"></div>
              </div>
              <button type="button" id="btn-clear-wiki-img" class="btn-brut btn-sm btn-secondary" style="padding: 0.15rem 0.4rem; font-size: 0.7rem;">✕</button>
            </div>
            <input type="hidden" id="comp-wiki-file" />
            <input type="hidden" id="comp-wiki-url" />
            <input type="hidden" id="comp-wiki-license" />
            <input type="hidden" id="comp-wiki-artist" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="comp-cat">Category</label>
              <select id="comp-cat" class="select-brut" required>
                <option value="Microcontrollers">Microcontrollers</option>
                <option value="Power & Batteries">Power & Batteries</option>
                <option value="Prototyping & Coils">Prototyping & Coils</option>
                <option value="3D Printing">3D Printing</option>
                <option value="Sensors & Actuators">Sensors & Actuators</option>
                <option value="Test & Tools">Test & Tools</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="comp-code">Component Code</label>
              <input type="text" id="comp-code" class="input-brut" placeholder="e.g. CS-CAM-01" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="comp-qty">Quantity in Stock</label>
              <input type="number" id="comp-qty" class="input-brut" value="5" min="1" max="100" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="comp-val">Replacement Value ($)</label>
              <input type="number" id="comp-val" class="input-brut" value="25" min="1" required />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="comp-loc">Storage Location</label>
            <input type="text" id="comp-loc" class="input-brut" placeholder="e.g. Robotics Lab · Bay 3 / Drawer 4" required />
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="comp-desc">Specifications & Details</label>
            <textarea id="comp-desc" class="textarea-brut" rows="3" placeholder="Key specs, pinout info, logic level..." required></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="comp-rules">Handling & Safety Guidelines</label>
            <textarea id="comp-rules" class="textarea-brut" rows="2" placeholder="Voltage limits, handling precautions..."></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; font-size: 0.9rem; cursor: pointer;">
              <input type="checkbox" id="comp-training" style="width: 18px; height: 18px;" />
              Requires Verified Lab Certification
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-brut btn-secondary" id="btn-close-add-modal">Cancel</button>
            <button type="submit" class="btn-brut btn-primary">Add Component to Catalog →</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Modal Open/Close Handlers
  const modal = container.querySelector('#add-modal-backdrop');
  const openModal = () => { modal.style.display = 'flex'; };
  const closeModal = () => { modal.style.display = 'none'; };

  const addBtn1 = container.querySelector('#btn-open-add-modal');
  if (addBtn1) addBtn1.addEventListener('click', openModal);
  const addBtn2 = container.querySelector('#btn-open-add-modal-2');
  if (addBtn2) addBtn2.addEventListener('click', openModal);
  const closeBtn = container.querySelector('#btn-close-add-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Wikimedia Commons Image Search & Select (API:Imageinfo)
  const wikiQueryInput = container.querySelector('#wiki-search-query');
  const btnWikiSearch = container.querySelector('#btn-wiki-search');
  const wikiStatus = container.querySelector('#wiki-search-status');
  const wikiResults = container.querySelector('#wiki-search-results');
  const wikiPreview = container.querySelector('#wiki-selected-preview');
  const wikiPreviewImg = container.querySelector('#wiki-preview-img');
  const wikiPreviewTitle = container.querySelector('#wiki-preview-title');
  const wikiPreviewMeta = container.querySelector('#wiki-preview-meta');
  const btnClearWiki = container.querySelector('#btn-clear-wiki-img');

  const fileInput = container.querySelector('#comp-wiki-file');
  const urlInput = container.querySelector('#comp-wiki-url');
  const licInput = container.querySelector('#comp-wiki-license');
  const artInput = container.querySelector('#comp-wiki-artist');

  if (btnWikiSearch && wikiQueryInput) {
    const doWikiSearch = async () => {
      const q = wikiQueryInput.value.trim() || container.querySelector('#comp-name').value.trim();
      if (!q) {
        showToast('Please enter a component keyword to search Wikimedia Commons.', 'warning');
        return;
      }
      wikiStatus.style.display = 'block';
      wikiStatus.textContent = `Searching Wikimedia Commons for "${q}"...`;
      wikiResults.style.display = 'none';

      try {
        const results = await Media.searchWikimediaImages(q, 10, 240);
        if (!results.length) {
          wikiStatus.textContent = `No images found for "${q}". Try another keyword.`;
          return;
        }

        wikiStatus.textContent = `Found ${results.length} images. Click one to select:`;
        wikiResults.innerHTML = results.map((item, idx) => `
          <div class="wiki-choice" data-idx="${idx}" style="cursor: pointer; border: 2px solid #ddd; padding: 2px; text-align: center; border-radius: 3px; background: #fafafa; transition: border-color 0.15s;" title="${escapeHtml(item.title)}">
            <img src="${escapeHtml(item.thumbUrl)}" style="width: 100%; height: 60px; object-fit: contain;" alt="" />
            <div style="font-size: 0.6rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono);">${escapeHtml(item.license)}</div>
          </div>
        `).join('');
        wikiResults.style.display = 'grid';

        wikiResults.querySelectorAll('.wiki-choice').forEach(el => {
          el.addEventListener('click', () => {
            const chosen = results[Number(el.dataset.idx)];
            fileInput.value = chosen.title;
            urlInput.value = chosen.thumbUrl;
            licInput.value = chosen.license;
            artInput.value = chosen.artist;

            wikiPreviewImg.src = chosen.thumbUrl;
            wikiPreviewTitle.textContent = chosen.title.replace(/^File:/, '');
            wikiPreviewMeta.textContent = `${chosen.license} · ${chosen.artist}`;
            wikiPreview.style.display = 'flex';
            wikiResults.style.display = 'none';
            wikiStatus.textContent = '✓ Image selected from Wikimedia Commons!';
          });
        });
      } catch (err) {
        wikiStatus.textContent = 'Failed to fetch from Wikimedia API. Please check connection.';
      }
    };

    btnWikiSearch.addEventListener('click', doWikiSearch);
    wikiQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doWikiSearch();
      }
    });

    if (btnClearWiki) {
      btnClearWiki.addEventListener('click', () => {
        fileInput.value = '';
        urlInput.value = '';
        licInput.value = '';
        artInput.value = '';
        wikiPreview.style.display = 'none';
        wikiStatus.style.display = 'none';
      });
    }
  }

  // Form Submission: Add Component
  container.querySelector('#add-component-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#comp-name').value.trim();
    const category = container.querySelector('#comp-cat').value;
    const component_code = container.querySelector('#comp-code').value.trim();
    const quantity_total = Number(container.querySelector('#comp-qty').value) || 1;
    const replacement_value = Number(container.querySelector('#comp-val').value) || 25;
    const location = container.querySelector('#comp-loc').value.trim();
    const description = container.querySelector('#comp-desc').value.trim();
    const usage_rules = container.querySelector('#comp-rules').value.trim() || 'Follow standard lab safety rules.';
    const training_required = container.querySelector('#comp-training').checked;

    const wikiFile = fileInput ? fileInput.value.trim() : '';
    const wikiUrl = urlInput ? urlInput.value.trim() : '';
    const wikiLicense = licInput ? licInput.value.trim() : '';
    const wikiArtist = artInput ? artInput.value.trim() : '';

    // Pick a fitting SVG style
    let svgType = 'generic';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('arduino')) svgType = 'arduino';
    else if (lowerName.includes('esp')) svgType = 'esp32';
    else if (lowerName.includes('pi') || lowerName.includes('raspberry')) svgType = 'raspberry_pi';
    else if (lowerName.includes('coil') || lowerName.includes('toroid')) svgType = 'coil_inductor';
    else if (lowerName.includes('lipo')) svgType = 'lipo_battery';
    else if (lowerName.includes('18650') || lowerName.includes('battery')) svgType = '18650_battery';
    else if (lowerName.includes('filament') || lowerName.includes('pla')) svgType = 'pla_filament';
    else if (lowerName.includes('motor') || lowerName.includes('driver')) svgType = 'motor_driver';
    else if (lowerName.includes('ultrasonic') || lowerName.includes('sensor')) svgType = 'ultrasonic';
    else if (lowerName.includes('scope') || lowerName.includes('meter')) svgType = 'oscilloscope';

    try {
      await Store.createResource({
        name,
        category,
        component_code,
        quantity_total,
        quantity_available: quantity_total,
        location,
        description,
        usage_rules,
        training_required,
        replacement_value,
        auto_approve_trusted: true,
        owner_id: currentUser.id,
        tags: [category.toLowerCase().replace(/\s+/g, '-'), 'hardware'],
        wikimedia_file: wikiFile || undefined,
        image_url: wikiUrl || undefined,
        image_license: wikiLicense || undefined,
        image_artist: wikiArtist || undefined,
        description_url: wikiFile ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(wikiFile)}` : undefined,
        svgArt: generateComponentSvg(svgType, name, component_code)
      });

      closeModal();
      showToast(`Component "${name}" added to catalog!`, 'success');
      renderVolunteer(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Delete / Remove Component
  container.querySelectorAll('.btn-delete-component').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (confirm(`Are you sure you want to completely remove "${name}" from the inventory catalog?`)) {
        try {
          await Store.deleteResource(id, currentUser.id);
          showToast(`Component "${name}" removed.`, 'info');
          renderVolunteer(params, container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });

  // Toggle Active/Archive
  container.querySelectorAll('.btn-toggle-active').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const isCurrentlyActive = btn.dataset.active === 'true';
      await Store.updateResource(id, { active: !isCurrentlyActive });
      showToast(`Listing ${isCurrentlyActive ? 'archived' : 'restored'}.`, 'info');
      renderVolunteer(params, container);
    });
  });

  // Decide Pending Requests
  container.querySelectorAll('.btn-decide').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bId = btn.dataset.id;
      const decision = btn.dataset.decision;
      const reasonInput = container.querySelector(`.decision-reason-input[data-id="${bId}"]`);
      const reason = reasonInput ? reasonInput.value.trim() : '';

      try {
        await Store.decideBooking(bId, decision, reason, currentUser.id);
        showToast(`Request ${decision}.`, 'success');
        renderVolunteer(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });

  // Quick Inspect & Checkout
  container.querySelectorAll('.btn-quick-inspect-checkout').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bId = btn.dataset.id;
      try {
        await Store.addConditionReport({
          booking_id: bId,
          reporter_id: currentUser.id,
          stage: 'before',
          condition: 'good',
          notes: 'Pre-handover inspection: component tested & verified functional.'
        });
        await Store.checkoutBooking(bId, currentUser.id);
        showToast('Check-out recorded and component custody transferred!', 'success');
        renderVolunteer(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });

  // Quick Inspect & Return
  container.querySelectorAll('.btn-quick-inspect-return').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bId = btn.dataset.id;
      try {
        await Store.addConditionReport({
          booking_id: bId,
          reporter_id: currentUser.id,
          stage: 'after',
          condition: 'good',
          notes: 'Return inspection: component returned in good condition, restocked.'
        });
        await Store.returnBooking(bId, currentUser.id);
        showToast('Return confirmed and restocked to locker!', 'success');
        renderVolunteer(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });

  // QR Scanner Controller
  const qrScanner = new QrScannerModal(async (scannedToken) => {
    try {
      const booking = await Store.getBookingByQrToken(scannedToken);
      if (!booking) {
        showToast(`Passcode "${scannedToken}" was not found.`, 'danger');
        return;
      }

      const res = allResources.find(r => r.id === booking.resource_id);
      const borrower = allUsers.find(u => u.id === booking.user_id);

      if (booking.status === 'approved') {
        await Store.addConditionReport({
          booking_id: booking.id,
          reporter_id: currentUser.id,
          stage: 'before',
          condition: 'good',
          notes: 'Verified via QR scanner pass.'
        });
        await Store.checkoutBooking(booking.id, currentUser.id);
        showToast(`✓ Check-out Verified! ${res.name} released to ${borrower.name}.`, 'success');
      } else if (booking.status === 'checked_out' || booking.status === 'allotted') {
        await Store.addConditionReport({
          booking_id: booking.id,
          reporter_id: currentUser.id,
          stage: 'after',
          condition: 'good',
          notes: 'Returned & scanned via QR pass.'
        });
        await Store.returnBooking(booking.id, currentUser.id);
        showToast(`✓ Return Verified! ${res.name} returned by ${borrower.name}.`, 'success');
      } else {
        showToast(`Booking is already in status "${booking.status}".`, 'info');
      }

      renderVolunteer(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  const scanBtn = container.querySelector('#btn-open-qr-scanner');
  if (scanBtn) scanBtn.addEventListener('click', () => qrScanner.open());
}
