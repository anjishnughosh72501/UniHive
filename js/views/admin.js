/**
 * Administrator Governance Console & Exclusive Student Allotment
 * Permissions: Admin only
 * Key Capabilities:
 * - Direct Allotment of required electronics components to students (Admin exclusive)
 * - Add, archive, and remove hardware components
 * - Manage user permissions and grant category certifications
 * - Instant regulatory CSV exports for audit trail and active loans
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import * as Auth from '../auth.js';
import { generateComponentSvg } from '../seed.js';
import { escapeHtml, showToast, formatCurrency, formatDateTime } from '../ui.js';

export async function renderAdmin(params, container) {
  const currentUser = await Auth.getSessionUser();

  if (!currentUser || currentUser.role !== Rules.ROLES.ADMIN) {
    container.innerHTML = `
      <div class="card-brut" style="max-width: 580px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2>Administrator Authorization Required</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 1.5rem;">
          Only Dean Alice Cooper or designated administrators have permissions to access governance settings and directly allot equipment to students.
        </p>
        <a href="#/login" class="btn-brut btn-primary">Sign In as Admin →</a>
      </div>
    `;
    return;
  }

  const [users, resources, bookings] = await Promise.all([
    Store.listUsers(),
    Store.listResources({ active: undefined }),
    Store.listBookings()
  ]);

  const students = users.filter(u => u.role === 'student');
  const activeResources = resources.filter(r => r.active);
  const allottedBookings = bookings.filter(b => b.status === 'allotted');

  container.innerHTML = `
    <!-- Top Header Bar -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
      <div>
        <span class="sticker sticker-lilac">ADMINISTRATIVE CONTROL</span>
        <h1 style="font-size: 2.25rem; margin-top: 0.35rem;">Campus Hardware Governance</h1>
        <p style="color: var(--color-muted);">Directly allot components to students, oversee council inventory, and audit compliance.</p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button type="button" class="btn-brut btn-primary" id="btn-open-create-modal">
          + Add New Component
        </button>
        <button type="button" class="btn-brut btn-secondary" id="btn-export-audit-csv">
          📥 Audit CSV
        </button>
        <button type="button" class="btn-brut btn-secondary" id="btn-export-bookings-csv">
          📥 Loans CSV
        </button>
      </div>
    </div>

    <!-- EXCLUSIVE FEATURE: Direct Student Allotment Section -->
    <section class="card-brut" style="background: var(--color-paper-card); border-left: 8px solid var(--color-primary); margin-bottom: 2.5rem; padding: 1.75rem;">
      <div style="margin-bottom: 1.25rem;">
        <span class="sticker sticker-primary">ADMIN EXCLUSIVE PRIVILEGE</span>
        <h2 style="font-size: 1.5rem; margin: 0.4rem 0 0.2rem;">Direct Component Allotment to Students</h2>
        <p style="color: var(--color-muted); font-size: 0.9rem; margin: 0;">
          As an administrator, you have exclusive authority to assign required microcontrollers, coils, or batteries directly to student project teams without requiring a standard waiting queue.
        </p>
      </div>

      <form id="admin-allot-form" style="background: var(--color-paper); border: var(--border-thin); padding: 1.25rem; border-radius: var(--radius-sm);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <!-- Student Selector -->
          <div class="form-group">
            <label class="form-label" for="allot-student">Select Student</label>
            <select id="allot-student" class="select-brut" required>
              <option value="">-- Choose Student --</option>
              ${students.map(s => `
                <option value="${s.id}">
                  ${escapeHtml(s.name)} (${escapeHtml(s.student_id || s.email)}) - ${escapeHtml(s.department || 'Student')}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Component Selector -->
          <div class="form-group">
            <label class="form-label" for="allot-component">Select Component</label>
            <select id="allot-component" class="select-brut" required>
              <option value="">-- Choose Component --</option>
              ${activeResources.map(r => `
                <option value="${r.id}" data-max="${r.quantity_available !== undefined ? r.quantity_available : 5}">
                  ${escapeHtml(r.name)} [${escapeHtml(r.component_code || '')}] — ${r.quantity_available !== undefined ? r.quantity_available : 1} available
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label class="form-label" for="allot-qty">Units to Allot</label>
            <input type="number" id="allot-qty" class="input-brut" value="1" min="1" max="10" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <!-- Start Date -->
          <div class="form-group">
            <label class="form-label" for="allot-start">Allotment Date</label>
            <input type="date" id="allot-start" class="input-brut" required />
          </div>

          <!-- Return Date -->
          <div class="form-group">
            <label class="form-label" for="allot-end">Scheduled Return Date</label>
            <input type="date" id="allot-end" class="input-brut" required />
          </div>

          <!-- Project / Purpose -->
          <div class="form-group">
            <label class="form-label" for="allot-purpose">Course Project / Research Purpose</label>
            <input type="text" id="allot-purpose" class="input-brut" placeholder="e.g. Capstone Autonomous Rover Build" required />
          </div>
        </div>

        <button type="submit" class="btn-brut btn-primary" style="padding: 0.75rem 1.5rem; font-weight: 800;">
          ⚡ Confirm Direct Allotment →
        </button>
      </form>

      <!-- Active Allotments Summary -->
      ${allottedBookings.length ? `
        <div style="margin-top: 1.5rem;">
          <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">Current Active Administrative Allotments (${allottedBookings.length}):</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${allottedBookings.map(ab => {
              const comp = resources.find(r => r.id === ab.resource_id);
              const stud = users.find(u => u.id === ab.user_id);
              return `
                <div style="font-size: 0.85rem; padding: 0.6rem 0.85rem; background: var(--color-paper); border: var(--border-thin); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                  <div>
                    <span class="sticker sticker-mint" style="font-size: 0.65rem;">ADMIN ALLOTTED</span>
                    <strong>${escapeHtml(comp ? comp.name : 'Component')}</strong> allotted to <strong>${escapeHtml(stud ? stud.name : 'Student')}</strong>
                    <div style="color: var(--color-muted); font-size: 0.75rem;">Purpose: ${escapeHtml(ab.purpose)} · Scheduled Return: ${formatDateTime(ab.end_at)}</div>
                  </div>
                  <div>
                    <code>Passcode: ${escapeHtml(ab.qr_token || 'N/A')}</code>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </section>

    <!-- Component Inventory & Lifecycle Management -->
    <section class="card-brut" style="margin-bottom: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <h2 style="font-size: 1.4rem; margin: 0 0 0.25rem;">Inventory Catalog & Availability (${resources.length})</h2>
          <p style="color: var(--color-muted); margin: 0; font-size: 0.85rem;">Both administrators and council volunteers can register or remove components.</p>
        </div>
        <button type="button" class="btn-brut btn-sm btn-primary" id="btn-open-create-modal-2">
          + Add Component
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${resources.map(r => `
          <div style="padding: 0.85rem 1rem; border: var(--border-thin); background: var(--color-paper); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-radius: var(--radius-sm);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 32px; border: var(--border-thin); background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${r.image_url ? `<img src="${escapeHtml(r.image_url)}" style="width:100%; height:100%; object-fit:contain;" alt="" />` : (r.svgArt || `<span style="font-size:0.65rem;">${escapeHtml(r.category)}</span>`)}
              </div>
              <div>
                <strong>${escapeHtml(r.name)}</strong>
                <span class="sticker sticker-yellow" style="font-size: 0.65rem; margin-left: 0.4rem;">${escapeHtml(r.category)}</span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted); margin-left: 0.4rem;">Code: <code>${escapeHtml(r.component_code || '')}</code></span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; margin-left: 0.4rem; font-weight: 700;">
                  Qty: ${r.quantity_available !== undefined ? r.quantity_available : 1} / ${r.quantity_total || 1} available
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

    <!-- User Directory Table with Role & Training Grants -->
    <section class="card-brut">
      <h2 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Campus User Directory & Certification Grants (${users.length})</h2>
      <p style="color: var(--color-muted); font-size: 0.85rem; margin-bottom: 1rem;">View registered students, council volunteers, and grant lab certifications.</p>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: var(--border-thick); background: var(--color-paper);">
              <th style="padding: 0.75rem;">Name & ID</th>
              <th style="padding: 0.75rem;">System Role</th>
              <th style="padding: 0.75rem;">Trained Categories</th>
              <th style="padding: 0.75rem; text-align: right;">Certification Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom: var(--border-thin);">
                <td style="padding: 0.75rem;">
                  <strong>${escapeHtml(u.name)}</strong>
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">${escapeHtml(u.email)} · ${escapeHtml(u.student_id || '')}</div>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="sticker ${u.role === 'admin' ? 'sticker-lilac' : u.role === 'volunteer' ? 'sticker-yellow' : 'sticker-mint'}">
                    ${escapeHtml(u.role.toUpperCase())}
                  </span>
                </td>
                <td style="padding: 0.75rem;">
                  ${u.trained_categories ? u.trained_categories.split(',').map(c => `
                    <span class="sticker sticker-mint" style="font-size: 0.65rem; margin: 0.1rem;">${escapeHtml(c.trim())}</span>
                  `).join('') : '<span style="color:var(--color-muted); font-size:0.8rem;">None</span>'}
                </td>
                <td style="padding: 0.75rem; text-align: right;">
                  <button type="button" class="btn-brut btn-sm btn-secondary btn-grant-cert" data-id="${u.id}" data-name="${escapeHtml(u.name)}" data-current="${escapeHtml(u.trained_categories || '')}">
                    + Grant Certification
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Create Component Modal -->
    <div id="create-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9990; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="card-brut" style="max-width: 600px; width: 100%; background: var(--color-paper-card); max-height: 90vh; overflow-y: auto;">
        <h3 style="margin-bottom: 0.5rem;">Add New Available Component</h3>
        <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">
          Register an electronics board, coil, battery pack, or test equipment.
        </p>

        <form id="create-resource-form">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="res-name">Component Title & Model</label>
            <input type="text" id="res-name" class="input-brut" placeholder="e.g. Raspberry Pi Pico W" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="res-cat">Category</label>
              <select id="res-cat" class="select-brut" required>
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
              <label class="form-label" for="res-code">Component Code</label>
              <input type="text" id="res-code" class="input-brut" placeholder="e.g. CS-MCU-05" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="res-qty">Total Stock Quantity</label>
              <input type="number" id="res-qty" class="input-brut" value="6" min="1" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="res-val">Unit Value ($)</label>
              <input type="number" id="res-val" class="input-brut" value="25" min="1" required />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="res-loc">Storage Location</label>
            <input type="text" id="res-loc" class="input-brut" placeholder="e.g. Makerspace · Bay 4 / Drawer 2" required />
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" for="res-desc">Description & Technical Specifications</label>
            <textarea id="res-desc" class="textarea-brut" rows="3" placeholder="Key specs, pin layout, logic voltages..." required></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; font-size: 0.9rem; cursor: pointer;">
              <input type="checkbox" id="res-training" style="width: 18px; height: 18px;" />
              Requires Verified Lab Certification
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-brut btn-secondary" id="btn-close-create-modal">Cancel</button>
            <button type="submit" class="btn-brut btn-primary">Add Component to Catalog →</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Set default dates for allotment form (today and +7 days)
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const startInput = container.querySelector('#allot-start');
  const endInput = container.querySelector('#allot-end');
  if (startInput) startInput.value = today;
  if (endInput) endInput.value = nextWeek;

  // Handle Admin Allotment Form Submission
  container.querySelector('#admin-allot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const student_id = container.querySelector('#allot-student').value;
    const resource_id = container.querySelector('#allot-component').value;
    const quantity = container.querySelector('#allot-qty').value;
    const start_at = container.querySelector('#allot-start').value;
    const end_at = container.querySelector('#allot-end').value;
    const purpose = container.querySelector('#allot-purpose').value.trim();

    if (!student_id || !resource_id) {
      showToast('Please select both a student and a component.', 'danger');
      return;
    }

    try {
      const booking = await Store.allotComponentToStudent({
        resource_id,
        student_id,
        admin_id: currentUser.id,
        quantity,
        start_at,
        end_at,
        purpose
      });

      showToast(`Component allotted successfully to student! Passcode: ${booking.qr_token}`, 'success');
      renderAdmin(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Modal Open/Close Handlers
  const modal = container.querySelector('#create-modal-backdrop');
  const openModal = () => { modal.style.display = 'flex'; };
  const closeModal = () => { modal.style.display = 'none'; };

  const btn1 = container.querySelector('#btn-open-create-modal');
  if (btn1) btn1.addEventListener('click', openModal);
  const btn2 = container.querySelector('#btn-open-create-modal-2');
  if (btn2) btn2.addEventListener('click', openModal);
  const closeBtn = container.querySelector('#btn-close-create-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Add Component Form Submission
  container.querySelector('#create-resource-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#res-name').value.trim();
    const category = container.querySelector('#res-cat').value;
    const component_code = container.querySelector('#res-code').value.trim();
    const quantity_total = Number(container.querySelector('#res-qty').value) || 1;
    const replacement_value = Number(container.querySelector('#res-val').value) || 25;
    const location = container.querySelector('#res-loc').value.trim();
    const description = container.querySelector('#res-desc').value.trim();
    const training_required = container.querySelector('#res-training').checked;

    let svgType = 'generic';
    const lower = name.toLowerCase();
    if (lower.includes('arduino')) svgType = 'arduino';
    else if (lower.includes('esp')) svgType = 'esp32';
    else if (lower.includes('pi') || lower.includes('raspberry')) svgType = 'raspberry_pi';
    else if (lower.includes('coil') || lower.includes('toroid')) svgType = 'coil_inductor';
    else if (lower.includes('lipo')) svgType = 'lipo_battery';
    else if (lower.includes('18650') || lower.includes('battery')) svgType = '18650_battery';
    else if (lower.includes('filament') || lower.includes('pla')) svgType = 'pla_filament';
    else if (lower.includes('motor')) svgType = 'motor_driver';
    else if (lower.includes('ultrasonic') || lower.includes('sensor')) svgType = 'ultrasonic';
    else if (lower.includes('scope') || lower.includes('meter')) svgType = 'oscilloscope';

    try {
      await Store.createResource({
        name,
        category,
        component_code,
        quantity_total,
        quantity_available: quantity_total,
        location,
        description,
        usage_rules: 'Follow standard lab bench safety protocols.',
        training_required,
        replacement_value,
        auto_approve_trusted: true,
        owner_id: currentUser.id,
        tags: [category.toLowerCase().replace(/\s+/g, '-'), 'hardware'],
        svgArt: generateComponentSvg(svgType, name, component_code)
      });

      closeModal();
      showToast(`Component "${name}" added to catalog!`, 'success');
      renderAdmin(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Delete / Remove Component
  container.querySelectorAll('.btn-delete-component').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (confirm(`Remove "${name}" permanently from inventory?`)) {
        try {
          await Store.deleteResource(id, currentUser.id);
          showToast(`Component "${name}" removed.`, 'info');
          renderAdmin(params, container);
        } catch (err) {
          showToast(err.message, 'danger');
        }
      }
    });
  });

  // Toggle Active / Archive
  container.querySelectorAll('.btn-toggle-active').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const isCurrentlyActive = btn.dataset.active === 'true';
      await Store.updateResource(id, { active: !isCurrentlyActive });
      showToast(`Listing ${isCurrentlyActive ? 'archived' : 'restored'}.`, 'info');
      renderAdmin(params, container);
    });
  });

  // Grant Certification
  container.querySelectorAll('.btn-grant-cert').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uId = btn.dataset.id;
      const userName = btn.dataset.name;
      const currentCerts = btn.dataset.current;
      const certToGrant = prompt(`Enter category certification to grant to ${userName}:\n(e.g. Microcontrollers, Power & Batteries, Prototyping & Coils, 3D Printing, Sensors & Actuators)\n\nCurrent: ${currentCerts || 'None'}`);
      if (certToGrant && certToGrant.trim()) {
        const cat = certToGrant.trim();
        const existing = currentCerts ? currentCerts.split(',').map(s => s.trim()) : [];
        if (!existing.includes(cat)) {
          existing.push(cat);
          await Store.updateUser(uId, { trained_categories: existing.join(',') });
          await Store.recordAuditEvent(currentUser.id, 'training_granted', 'user', uId, `Granted ${cat} certification to ${userName}`);
          showToast(`Granted ${cat} certification to ${userName}!`, 'success');
          renderAdmin(params, container);
        }
      }
    });
  });

  // CSV Exports
  container.querySelector('#btn-export-audit-csv').addEventListener('click', async () => {
    const csvContent = await Store.exportAuditEventsCsv();
    downloadCsv(csvContent, `unihive_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Audit Log CSV exported!', 'success');
  });

  container.querySelector('#btn-export-bookings-csv').addEventListener('click', async () => {
    const csvContent = await Store.exportBookingsCsv();
    downloadCsv(csvContent, `unihive_loans_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Equipment Loans CSV exported!', 'success');
  });

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
