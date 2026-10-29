/**
 * Owner Dashboard View
 * Features:
 * - Direct Camera & Token QR Handover Scanner integration
 * - Overdue item alert banner
 * - Inline reason inputs for 1-click approvals/rejections
 * - Listing management controls
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { QrScannerModal } from '../qr.js';
import { escapeHtml, formatDateTime, showToast } from '../ui.js';

export async function renderOwnerDashboard(params, container) {
  const currentUser = await Store.getCurrentUser();

  if (currentUser.role !== Rules.ROLES.OWNER && currentUser.role !== Rules.ROLES.ADMIN) {
    container.innerHTML = `
      <div class="card-brut" style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
        <h2>Owner Dashboard Access Restricted</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 1.5rem;">
          This dashboard is reserved for equipment custodians and lab managers. Switch your demo persona to <strong>Dr. Aris Miller (Owner)</strong> or <strong>Dean Alice Cooper (Admin)</strong>.
        </p>
        <button type="button" class="btn-brut btn-primary" id="btn-switch-owner-demo">Switch to Owner Demo →</button>
      </div>
    `;
    container.querySelector('#btn-switch-owner-demo').addEventListener('click', async () => {
      await Store.setCurrentUser(101); // Dr. Aris Miller
      window.location.reload();
    });
    return;
  }

  const [allResources, allBookings, allUsers, conditionReports] = await Promise.all([
    Store.listResources({ active: undefined }),
    Store.listBookings(),
    Store.listUsers(),
    Store.getConditionReports()
  ]);

  const managedResources = currentUser.role === Rules.ROLES.ADMIN
    ? allResources
    : allResources.filter(r => r.owner_id === currentUser.id);

  const managedResourceIds = managedResources.map(r => r.id);

  const managedBookings = currentUser.role === Rules.ROLES.ADMIN
    ? allBookings
    : allBookings.filter(b => managedResourceIds.includes(b.resource_id));

  const pendingRequests = managedBookings.filter(b => b.status === Rules.BOOKING_STATUSES.PENDING || b.status === Rules.BOOKING_STATUSES.WAITLISTED);
  const checkedOutBookings = managedBookings.filter(b => b.status === Rules.BOOKING_STATUSES.CHECKED_OUT);
  const overdueBookings = managedBookings.filter(b => Rules.isOverdue(b));

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
      <div>
        <div style="margin-bottom: 0.35rem;">
          <span class="sticker ${currentUser.role === 'admin' ? 'sticker-lilac' : 'sticker-yellow'}">
            ${currentUser.role === 'admin' ? 'ADMINISTRATOR CONSOLE' : 'EQUIPMENT CUSTODIAN WORKSPACE'}
          </span>
        </div>
        <h1 style="font-size: 2.25rem;">${escapeHtml(currentUser.name)}'s Lab Operations</h1>
        <p style="color: var(--color-muted);">Manage requests, verify chain-of-custody handovers, and track loan returns.</p>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button type="button" class="btn-brut btn-primary" id="btn-open-qr-scanner">
          📷 Scan Handover QR Pass
        </button>
        <a href="#/activity" class="btn-brut btn-secondary">Audit Trail →</a>
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
              <p style="margin: 0; font-size: 0.9rem;">The following equipment has not been checked back in past its scheduled return window:</p>
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
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #666;">Scheduled return was: ${formatDateTime(ob.end_at)} · Token: <code>${escapeHtml(ob.qr_token || 'N/A')}</code></div>
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
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-val">${managedResources.length}</div>
        <div class="metric-label">Managed Assets</div>
      </div>
      <div class="metric-card" style="border-color: ${pendingRequests.length ? 'var(--color-primary)' : 'var(--color-ink)'};">
        <div class="metric-val">${pendingRequests.length}</div>
        <div class="metric-label">Pending Reviews</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${checkedOutBookings.length}</div>
        <div class="metric-label">Currently In Field</div>
      </div>
      <div class="metric-card" style="border-color: ${overdueBookings.length ? 'var(--color-coral)' : 'var(--color-ink)'};">
        <div class="metric-val" style="color: ${overdueBookings.length ? 'var(--color-coral)' : 'inherit'};">${overdueBookings.length}</div>
        <div class="metric-label">Overdue Items</div>
      </div>
    </div>

    <!-- Request Inbox Section -->
    <section style="margin-bottom: 3rem;">
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Actionable Request Inbox</h2>

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
                    <span class="sticker ${userTrust.badgeClass}" style="margin-left: 0.35rem;">Trust: ${userTrust.level} (${userTrust.score}pts)</span>
                    <h3 style="font-size: 1.25rem; margin-top: 0.35rem;">
                      ${escapeHtml(res ? res.name : 'Equipment')} requested by <strong>${escapeHtml(borrower ? borrower.name : 'Student')}</strong>
                    </h3>
                  </div>

                  <div style="font-family: var(--font-mono); font-size: 0.8rem; text-align: right;">
                    <div>Requested Window:</div>
                    <strong>${formatDateTime(b.start_at)} → ${formatDateTime(b.end_at)}</strong>
                  </div>
                </div>

                <div style="background: var(--color-paper); padding: 0.75rem 1rem; border: var(--border-thin); margin-bottom: 1rem; font-size: 0.9rem;">
                  <strong>Purpose:</strong> ${escapeHtml(b.purpose)}
                </div>

                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                  <input type="text" class="input-brut decision-reason-input" data-id="${b.id}" placeholder="Optional decision note / pickup instructions..." style="flex: 1; min-width: 260px;" />
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
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Physical Handover Operations</h2>
      <p style="color: var(--color-muted); margin-bottom: 1rem;">
        Custodians must confirm condition reports before releasing or accepting hardware back into the locker.
      </p>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${managedBookings.filter(b => b.status === 'approved' || b.status === 'checked_out').map(b => {
          const res = allResources.find(r => r.id === b.resource_id);
          const borrower = allUsers.find(u => u.id === b.user_id);
          const reports = conditionReports.filter(c => c.booking_id === b.id);
          const hasBefore = reports.some(r => r.stage === 'before');
          const hasAfter = reports.some(r => r.stage === 'after');

          return `
            <div class="card-brut" style="padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <span class="sticker ${b.status === 'checked_out' ? 'sticker-blue' : 'sticker-mint'}">${escapeHtml(b.status)}</span>
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
                      <span class="sticker sticker-yellow" title="Student or custodian must log initial condition first">
                        ⏳ Awaiting Initial Condition Report
                      </span>
                    `}
                  ` : ''}

                  ${b.status === 'checked_out' ? `
                    ${hasAfter ? `
                      <button type="button" class="btn-brut btn-sm btn-mint btn-checkout-action" data-action="return" data-id="${b.id}">
                        ✓ Confirm Return Handover
                      </button>
                    ` : `
                      <span class="sticker sticker-yellow" title="Return inspection report required before closing loan">
                        ⏳ Awaiting Return Condition Report
                      </span>
                    `}
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;

  // QR Scanner Controller Instance
  const qrScanner = new QrScannerModal(async (scannedToken) => {
    try {
      const booking = await Store.getBookingByQrToken(scannedToken);
      if (!booking) {
        showToast(`Passcode "${scannedToken}" was not found in the booking registry.`, 'danger');
        return;
      }

      const res = allResources.find(r => r.id === booking.resource_id);
      const borrower = allUsers.find(u => u.id === booking.user_id);
      const reports = conditionReports.filter(c => c.booking_id === booking.id);
      const hasBefore = reports.some(r => r.stage === 'before');
      const hasAfter = reports.some(r => r.stage === 'after');

      if (booking.status === 'approved') {
        if (!hasBefore) {
          showToast(`Initial condition report missing for ${res.name}. Student must log initial check before checkout.`, 'warning');
          return;
        }
        await Store.checkoutBooking(booking.id, currentUser.id);
        showToast(`✓ Check-out Verified by QR! ${res.name} handed over to ${borrower.name}.`, 'success');
      } else if (booking.status === 'checked_out') {
        if (!hasAfter) {
          showToast(`Final condition report missing for ${res.name}. Log return inspection before closing.`, 'warning');
          return;
        }
        await Store.returnBooking(booking.id, currentUser.id);
        showToast(`✓ Return Verified by QR! ${res.name} returned to locker by ${borrower.name}.`, 'success');
      } else {
        showToast(`Booking is in status "${booking.status}"; no handover action needed.`, 'info');
      }

      renderOwnerDashboard(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  const scanBtn = container.querySelector('#btn-open-qr-scanner');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => qrScanner.open());
  }

  // Attach decide listeners
  container.querySelectorAll('.btn-decide').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bId = btn.dataset.id;
      const decision = btn.dataset.decision;
      const reasonInput = container.querySelector(`.decision-reason-input[data-id="${bId}"]`);
      const reason = reasonInput ? reasonInput.value.trim() : '';

      try {
        const res = await Store.decideBooking(bId, decision, reason, currentUser.id);
        if (res.waitlisted) {
          showToast(res.message, 'warning');
        } else if (res.promoted) {
          showToast(`Request ${decision}. Waitlisted candidate was automatically promoted!`, 'success');
        } else {
          showToast(`Booking request ${decision}.`, 'success');
        }
        renderOwnerDashboard(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });

  // Attach checkout & return listeners
  container.querySelectorAll('.btn-checkout-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const bId = btn.dataset.id;
      try {
        if (action === 'checkout') {
          await Store.checkoutBooking(bId, currentUser.id);
          showToast('Check-out completed. Equipment custody transferred.', 'success');
        } else {
          const res = await Store.returnBooking(bId, currentUser.id);
          if (res.promoted) {
            showToast('Return recorded. Next waitlisted candidate was promoted!', 'success');
          } else {
            showToast('Return confirmed and recorded in audit log.', 'success');
          }
        }
        renderOwnerDashboard(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });
}
