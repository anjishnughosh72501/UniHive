/**
 * Administrator Governance Console
 * - User permission management and category certification grants
 * - Inventory listing creation modal with validation
 * - Instant client-side CSV exports for Audit Log and Bookings
 * - Active / Archive listing toggles
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, showToast, formatCurrency } from '../ui.js';

export async function renderAdmin(params, container) {
  const currentUser = await Store.getCurrentUser();

  if (currentUser.role !== Rules.ROLES.ADMIN) {
    container.innerHTML = `
      <div class="card-brut" style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2>Administrator Authorization Required</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 1.5rem;">
          Only Dean Alice Cooper (Admin) can access user governance and global system settings.
        </p>
        <button type="button" class="btn-brut btn-primary" id="btn-switch-admin">Switch to Admin Persona →</button>
      </div>
    `;
    container.querySelector('#btn-switch-admin').addEventListener('click', async () => {
      await Store.setCurrentUser(201); // Dean Alice Cooper
      window.location.reload();
    });
    return;
  }

  const [users, resources, incidents] = await Promise.all([
    Store.listUsers(),
    Store.listResources({ active: undefined }),
    Store.listIncidents()
  ]);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
      <div>
        <span class="sticker sticker-lilac">CAMPUS GOVERNANCE</span>
        <h1 style="font-size: 2.25rem; margin-top: 0.35rem;">Dean & System Administration</h1>
        <p style="color: var(--color-muted);">Manage student certifications, equipment listings, and export regulatory audit archives.</p>
      </div>

      <!-- Action Buttons: List Gear & CSV Export -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button type="button" class="btn-brut btn-primary" id="btn-open-create-modal">
          + List New Resource
        </button>
        <button type="button" class="btn-brut btn-secondary" id="btn-export-audit-csv">
          📥 Export Audit CSV
        </button>
        <button type="button" class="btn-brut btn-secondary" id="btn-export-bookings-csv">
          📥 Export Bookings CSV
        </button>
      </div>
    </div>

    <!-- User Directory Table with Role & Training Grants -->
    <section class="card-brut" style="margin-bottom: 2.5rem;">
      <h2 style="font-size: 1.4rem; margin-bottom: 1rem;">Campus User Directory & Certification Grants</h2>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: var(--border-thick); background: var(--color-paper);">
              <th style="padding: 0.75rem;">Name & Email</th>
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
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">${escapeHtml(u.email)}</div>
                </td>
                <td style="padding: 0.75rem;">
                  <select class="select-brut user-role-select" data-id="${u.id}" style="padding: 0.3rem 0.5rem; font-size: 0.8rem; width: auto;">
                    <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
                    <option value="owner" ${u.role === 'owner' ? 'selected' : ''}>Custodian / Owner</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
                  </select>
                </td>
                <td style="padding: 0.75rem;">
                  ${u.trained_categories ? u.trained_categories.split(',').map(c => `
                    <span class="sticker sticker-mint" style="font-size: 0.65rem; margin: 0.1rem;">${escapeHtml(c.trim())}</span>
                  `).join('') : '<span style="color:var(--color-muted); font-size:0.8rem;">None recorded</span>'}
                </td>
                <td style="padding: 0.75rem; text-align: right;">
                  <button type="button" class="btn-brut btn-sm btn-secondary btn-grant-cert" data-id="${u.id}" data-current="${escapeHtml(u.trained_categories || '')}">
                    + Grant Certification
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Equipment Inventory Management -->
    <section class="card-brut">
      <h2 style="font-size: 1.4rem; margin-bottom: 1rem;">Asset Visibility & Inventory Status (${resources.length})</h2>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${resources.map(r => `
          <div style="padding: 0.75rem 1rem; border: var(--border-thin); background: var(--color-paper); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong>${escapeHtml(r.name)}</strong>
              <span class="sticker sticker-yellow" style="font-size: 0.65rem; margin-left: 0.5rem;">${escapeHtml(r.category)}</span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted); margin-left: 0.5rem;">Value: ${formatCurrency(r.replacement_value)}</span>
              ${!r.active ? '<span class="sticker sticker-coral" style="margin-left:0.5rem;">ARCHIVED</span>' : ''}
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button type="button" class="btn-brut btn-sm ${r.active ? 'btn-danger' : 'btn-mint'} btn-toggle-active" data-id="${r.id}" data-active="${r.active}">
                ${r.active ? 'Archive Listing' : 'Restore Listing'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Create New Resource Modal -->
    <div id="create-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9990; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="card-brut" style="max-width: 580px; width: 100%; background: var(--color-paper-card); max-height: 90vh; overflow-y: auto;">
        <h3 style="margin-bottom: 0.5rem;">List a New Equipment Asset</h3>
        <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">
          Add a laboratory kit, drone, or camera rig to the campus sharing network.
        </p>

        <form id="create-resource-form">
          <div class="form-group">
            <label class="form-label" for="res-name">Asset Title / Model</label>
            <input type="text" id="res-name" class="input-brut" placeholder="e.g. Fluke 87V Industrial Multimeter" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="res-cat">Category</label>
              <select id="res-cat" class="select-brut" required>
                <option value="Electronics">Electronics</option>
                <option value="Lab Kits">Lab Kits</option>
                <option value="Photography">Photography</option>
                <option value="Audio">Audio</option>
                <option value="3D Printers">3D Printers</option>
                <option value="Drones">Drones</option>
                <option value="Laptops">Laptops</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="res-val">Replacement Value ($)</label>
              <input type="number" id="res-val" class="input-brut" value="450" min="10" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="res-loc">Storage Location</label>
            <input type="text" id="res-loc" class="input-brut" placeholder="e.g. Engineering Lab · Room E105" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="res-desc">Description & Specifications</label>
            <textarea id="res-desc" class="textarea-brut" rows="3" placeholder="Features, inclusions, accessories..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="res-rules">Handling & Safety Rules</label>
            <textarea id="res-rules" class="textarea-brut" rows="2" placeholder="Standard operating guidelines..."></textarea>
          </div>

          <div class="form-group" style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; font-size: 0.9rem; cursor: pointer;">
              <input type="checkbox" id="res-training" style="width: 18px; height: 18px;" />
              Training Certification Required
            </label>

            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; font-size: 0.9rem; cursor: pointer;">
              <input type="checkbox" id="res-auto-approve" checked style="width: 18px; height: 18px;" />
              Enable Auto-Approval for Trusted Borrowers
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-brut btn-secondary" id="btn-close-create-modal">Cancel</button>
            <button type="submit" class="btn-brut btn-primary">List Asset →</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Create Resource Modal handlers
  const createModal = container.querySelector('#create-modal-backdrop');
  container.querySelector('#btn-open-create-modal').addEventListener('click', () => {
    createModal.style.display = 'flex';
  });
  container.querySelector('#btn-close-create-modal').addEventListener('click', () => {
    createModal.style.display = 'none';
  });

  container.querySelector('#create-resource-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#res-name').value.trim();
    const category = container.querySelector('#res-cat').value;
    const replacement_value = Number(container.querySelector('#res-val').value) || 300;
    const location = container.querySelector('#res-loc').value.trim();
    const description = container.querySelector('#res-desc').value.trim();
    const usage_rules = container.querySelector('#res-rules').value.trim() || 'Follow standard lab safety rules.';
    const training_required = container.querySelector('#res-training').checked;
    const auto_approve_trusted = container.querySelector('#res-auto-approve').checked;

    try {
      await Store.createResource({
        name,
        category,
        description,
        location,
        owner_id: currentUser.id,
        training_required,
        usage_rules,
        replacement_value,
        auto_approve_trusted,
        tags: [category.toLowerCase().replace(/\s+/g, '-'), 'campus']
      });

      createModal.style.display = 'none';
      showToast(`Asset "${name}" listed successfully!`, 'success');
      renderAdmin(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Client-side CSV Exports
  container.querySelector('#btn-export-audit-csv').addEventListener('click', async () => {
    const csvContent = await Store.exportAuditEventsCsv();
    downloadCsv(csvContent, `campusshare_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Audit Log CSV exported!', 'success');
  });

  container.querySelector('#btn-export-bookings-csv').addEventListener('click', async () => {
    const csvContent = await Store.exportBookingsCsv();
    downloadCsv(csvContent, `campusshare_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Bookings CSV exported!', 'success');
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

  // Role select listener
  container.querySelectorAll('.user-role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const uId = sel.dataset.id;
      const newRole = sel.value;
      await Store.updateUser(uId, { role: newRole });
      await Store.recordAuditEvent(currentUser.id, 'role_updated', 'user', uId, `Updated role to ${newRole}`);
      showToast(`User role updated to ${newRole}.`, 'info');
    });
  });

  // Certification grant handlers
  container.querySelectorAll('.btn-grant-cert').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uId = btn.dataset.id;
      const currentCerts = btn.dataset.current;
      const certToGrant = prompt(`Enter category to certify user for (e.g. Electronics, Drones, 3D Printers, Photography):\nCurrent: ${currentCerts || 'None'}`);
      if (certToGrant && certToGrant.trim()) {
        const cat = certToGrant.trim();
        const existing = currentCerts ? currentCerts.split(',').map(s => s.trim()) : [];
        if (!existing.includes(cat)) {
          existing.push(cat);
          await Store.updateUser(uId, { trained_categories: existing.join(',') });
          await Store.recordAuditEvent(currentUser.id, 'training_granted', 'user', uId, `Granted ${cat} certification`);
          showToast(`Granted ${cat} training certification!`, 'success');
          renderAdmin(params, container);
        }
      }
    });
  });

  // Active state toggles
  container.querySelectorAll('.btn-toggle-active').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rId = btn.dataset.id;
      const isCurrentlyActive = btn.dataset.active === 'true';
      await Store.updateResource(rId, { active: !isCurrentlyActive });
      await Store.recordAuditEvent(currentUser.id, isCurrentlyActive ? 'resource_archived' : 'resource_restored', 'resource', rId, `Toggled active state to ${!isCurrentlyActive}`);
      showToast(`Listing ${isCurrentlyActive ? 'archived' : 'restored'}.`, 'info');
      renderAdmin(params, container);
    });
  });
}
