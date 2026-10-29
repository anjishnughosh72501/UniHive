/**
 * My Bookings View
 * - 6-stage physical handover stepper
 * - Dynamic SVG QR token generation
 * - Photo evidence attachments on condition reports
 * - Side-by-side Before/After comparison
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import * as Auth from '../auth.js';
import { generateQrSvg } from '../qr.js';
import { escapeHtml, formatDateTime, showToast } from '../ui.js';

export async function renderMyBookings(params, container) {
  const currentUser = await Auth.getSessionUser();
  if (!currentUser) {
    container.innerHTML = `
      <div class="card-brut" style="max-width: 520px; margin: 4rem auto; text-align: center; padding: 3rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
        <h2>Sign In Required</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 1.5rem;">
          Please sign in to view your borrowed equipment loans, inspection passes, and chain-of-custody tokens.
        </p>
        <a href="#/login" class="btn-brut btn-primary">Sign In →</a>
      </div>
    `;
    return;
  }

  const [userBookings, resources, conditionReports, incidents] = await Promise.all([
    Store.listBookings({ userId: currentUser.id }),
    Store.listResources(),
    Store.getConditionReports(),
    Store.listIncidents()
  ]);

  const trust = Rules.calculateTrustScore(currentUser.id, userBookings, incidents, conditionReports);

  function getStepIndex(booking, reports) {
    if (booking.status === Rules.BOOKING_STATUSES.CANCELLED || booking.status === Rules.BOOKING_STATUSES.REJECTED) {
      return -1;
    }
    const hasBefore = reports.some(r => r.booking_id === booking.id && r.stage === 'before');
    const hasAfter = reports.some(r => r.booking_id === booking.id && r.stage === 'after');

    if (booking.status === Rules.BOOKING_STATUSES.RETURNED) return 6;
    if (hasAfter) return 5;
    if (booking.status === Rules.BOOKING_STATUSES.CHECKED_OUT || booking.status === Rules.BOOKING_STATUSES.ALLOTTED) return 4;
    if (hasBefore) return 3;
    if (booking.status === Rules.BOOKING_STATUSES.APPROVED) return 2;
    return 1; // Pending or waitlisted
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
      <div>
        <h1 style="font-size: 2.25rem; margin-bottom: 0.25rem;">My Equipment Loans</h1>
        <p style="color: var(--color-muted);">Chain-of-custody tracking, QR inspection passes, and condition records.</p>
      </div>

      <!-- Trust Score Card -->
      <div class="card-brut" style="padding: 1rem 1.25rem; min-width: 260px; background: var(--color-paper);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Lender Trust Standing</span>
          <span class="sticker ${trust.badgeClass}">${trust.level}</span>
        </div>
        <div style="font-size: 1.75rem; font-weight: 900; font-family: var(--font-heading); margin-bottom: 0.25rem;">
          ${trust.score} <span style="font-size: 0.85rem; font-weight: 500; font-family: var(--font-mono); color: var(--color-muted);">PTS</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--color-muted); line-height: 1.3; margin: 0;">
          ${trust.advisoryNotice}
        </p>
      </div>
    </div>

    ${!userBookings.length ? `
      <div class="card-brut" style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <h3>No active or past bookings</h3>
        <p style="color: var(--color-muted); margin-bottom: 1.5rem;">Browse available lab kits, cinema gear, and 3D printers to borrow.</p>
        <a href="#/" class="btn-brut btn-primary">Explore Equipment Locker →</a>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        ${userBookings.map(b => {
          const res = resources.find(r => r.id === b.resource_id);
          const reports = conditionReports.filter(r => r.booking_id === b.id);
          const step = getStepIndex(b, reports);
          const isOverdue = Rules.isOverdue(b);
          const hasBeforeReport = reports.some(r => r.stage === 'before');
          const hasAfterReport = reports.some(r => r.stage === 'after');

          const statusColors = {
            pending: 'sticker-yellow',
            waitlisted: 'sticker-yellow',
            approved: 'sticker-mint',
            allotted: 'sticker-mint',
            checked_out: 'sticker-blue',
            returned: 'sticker-mint',
            rejected: 'sticker-coral',
            cancelled: 'sticker-coral'
          };

          const beforeReport = reports.find(r => r.stage === 'before');
          const afterReport = reports.find(r => r.stage === 'after');

          return `
            <article class="card-brut reveal-item revealed" data-booking-id="${b.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                    <span class="sticker ${statusColors[b.status] || 'sticker-yellow'}">
                      ${b.status === 'allotted' ? '⚡ ADMIN ALLOTTED' : escapeHtml(b.status)}
                    </span>
                    ${isOverdue ? '<span class="sticker sticker-coral badge-overdue-pulse">⚠️ OVERDUE</span>' : ''}
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted);">ID #${b.id}</span>
                  </div>
                  <h3 style="font-size: 1.35rem;">
                    <a href="#/resource/${res ? res.id : ''}">${escapeHtml(res ? res.name : 'Unknown Equipment')}</a>
                  </h3>
                </div>

                <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem;">
                  <div><strong>Start:</strong> ${formatDateTime(b.start_at)}</div>
                  <div><strong>Return:</strong> ${formatDateTime(b.end_at)}</div>
                </div>
              </div>

              <!-- 6-Stage Accountability Stepper -->
              ${step > 0 ? `
                <div class="stepper-container" aria-label="Booking handover progress">
                  <div class="step-item ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}">
                    <div class="step-badge">${step > 1 ? '✓' : '1'}</div>
                    <div class="step-title">Requested</div>
                  </div>
                  <div class="step-item ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}">
                    <div class="step-badge">${step > 2 ? '✓' : '2'}</div>
                    <div class="step-title">Approved</div>
                  </div>
                  <div class="step-item ${step >= 3 ? (step === 3 ? 'active' : 'completed') : ''}">
                    <div class="step-badge">${step > 3 ? '✓' : '3'}</div>
                    <div class="step-title">Check-in Condition</div>
                  </div>
                  <div class="step-item ${step >= 4 ? (step === 4 ? 'active' : 'completed') : ''}">
                    <div class="step-badge">${step > 4 ? '✓' : '4'}</div>
                    <div class="step-title">Handed Out</div>
                  </div>
                  <div class="step-item ${step >= 5 ? (step === 5 ? 'active' : 'completed') : ''}">
                    <div class="step-badge">${step > 5 ? '✓' : '5'}</div>
                    <div class="step-title">Return Condition</div>
                  </div>
                  <div class="step-item ${step >= 6 ? 'completed' : ''}">
                    <div class="step-badge">${step === 6 ? '✓' : '6'}</div>
                    <div class="step-title">Returned</div>
                  </div>
                </div>
              ` : `
                <div style="background: var(--color-paper); border: var(--border-medium); padding: 0.75rem 1rem; margin-bottom: 1rem; font-family: var(--font-mono); font-size: 0.85rem;">
                  Status notice: ${escapeHtml(b.decision_reason || 'Booking closed.')}
                </div>
              `}

              <!-- Handover QR & Token Pass (Client-side Vector SVG QR) -->
              ${(b.status === 'approved' || b.status === 'checked_out') && b.qr_token ? `
                <div style="background: var(--color-paper); border: var(--border-thick); padding: 1.25rem; margin: 1.25rem 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; border-radius: var(--radius-sm);">
                  <div style="max-width: 420px;">
                    <div style="font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--color-muted);">
                      Official Digital Handover Pass
                    </div>
                    <div style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; letter-spacing: 0.05em; color: var(--color-blue); margin: 0.25rem 0;">
                      ${escapeHtml(b.qr_token)}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-ink); line-height: 1.4;">
                      Present this screen to the custodian at the equipment desk. The custodian will scan this code to confirm custody and activate the loan.
                    </div>
                  </div>
                  <div>
                    ${generateQrSvg(b.qr_token, 130)}
                  </div>
                </div>
              ` : ''}

              <!-- Inspection Records & Photos -->
              ${reports.length ? `
                <div style="margin: 1rem 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Condition Reports & Evidence</span>
                    ${beforeReport && afterReport ? `
                      <button type="button" class="btn-brut btn-sm btn-secondary btn-compare-modal" data-id="${b.id}">
                        🔍 Compare Before/After Side-by-Side
                      </button>
                    ` : ''}
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${reports.map(r => `
                      <div style="font-size: 0.85rem; padding: 0.5rem 0.75rem; background: var(--color-paper); border: var(--border-thin); display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                          <strong>${r.stage === 'before' ? 'Pre-Handover Check:' : 'Return Check:'}</strong>
                          <span class="sticker ${r.condition === 'good' ? 'sticker-mint' : (r.condition === 'minor_issue' ? 'sticker-yellow' : 'sticker-coral')}" style="font-size:0.65rem;">${r.condition}</span>
                          ${r.notes ? `— <em>${escapeHtml(r.notes)}</em>` : ''}
                        </div>
                        ${r.photoUrls && r.photoUrls.length ? `
                          <div style="display: flex; gap: 0.35rem;">
                            ${r.photoUrls.map((p, idx) => `
                              <img src="${p}" alt="Evidence ${idx + 1}" style="width: 38px; height: 38px; object-fit: cover; border: 1.5px solid #111; border-radius: 2px;" />
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Action Bar -->
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; padding-top: 1rem; border-top: var(--border-medium);">
                ${b.status === 'approved' && !hasBeforeReport ? `
                  <button type="button" class="btn-brut btn-sm btn-primary btn-condition-modal" data-stage="before" data-id="${b.id}">
                    📝 Log Pre-Handover Condition (Required for Pickup)
                  </button>
                ` : ''}

                ${b.status === 'checked_out' && !hasAfterReport ? `
                  <button type="button" class="btn-brut btn-sm btn-primary btn-condition-modal" data-stage="after" data-id="${b.id}">
                    📝 Log Return Condition (Required for Return)
                  </button>
                ` : ''}

                ${Rules.canCancelBooking(currentUser, b) ? `
                  <button type="button" class="btn-brut btn-sm btn-danger btn-cancel-booking" data-id="${b.id}">
                    Cancel Request
                  </button>
                ` : ''}

                <a href="#/resource/${res ? res.id : ''}" class="btn-brut btn-sm btn-secondary" style="margin-left: auto;">
                  Listing Details →
                </a>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `}

    <!-- Condition Report Modal with Photo Upload -->
    <div id="condition-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9990; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="card-brut" style="max-width: 520px; width: 100%; background: var(--color-paper-card); max-height: 90vh; overflow-y: auto;">
        <h3 id="modal-title" style="margin-bottom: 0.35rem;">Record Condition Inspection</h3>
        <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">
          Take or attach up to 3 photos and record observed hardware condition.
        </p>

        <form id="condition-report-form">
          <input type="hidden" id="modal-booking-id" />
          <input type="hidden" id="modal-stage" />

          <div class="form-group">
            <label class="form-label">Observed Condition</label>
            <select id="modal-condition" class="select-brut" required>
              <option value="good">Good (Clean, fully operational, all accessories present)</option>
              <option value="minor_issue">Minor Issue (Cosmetic scuff, slight wear, functional)</option>
              <option value="damaged">Damaged / Non-functional (Requires human review)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="modal-notes">Inspection Notes</label>
            <textarea id="modal-notes" class="textarea-brut" rows="3" placeholder="Describe any scuffs, battery health, missing cables, or test observations..." required></textarea>
          </div>

          <!-- Photo Evidence Attachment -->
          <div class="form-group">
            <label class="form-label">Photo Evidence (Up to 3 photos, max 1.5MB each)</label>
            <input type="file" id="modal-photo-input" class="input-brut" accept="image/*" multiple style="padding: 0.4rem;" />
            <div id="photo-preview-box" style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;"></div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-brut btn-secondary" id="btn-modal-cancel">Cancel</button>
            <button type="submit" class="btn-brut btn-primary">Save Inspection Report →</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Side-by-Side Photo Comparison Modal (Phase 3.2) -->
    <div id="compare-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9995; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="card-brut" style="max-width: 750px; width: 100%; background: var(--color-paper-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0;">🔍 Before & After Condition Comparison</h3>
          <button type="button" id="btn-close-compare" class="btn-brut btn-sm btn-secondary" style="min-width: 36px; padding: 0.2rem 0.6rem;">×</button>
        </div>
        <div id="compare-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;"></div>
      </div>
    </div>
  `;

  // Condition modal handling with photo compression
  const modalBackdrop = container.querySelector('#condition-modal-backdrop');
  const modalBookingId = container.querySelector('#modal-booking-id');
  const modalStage = container.querySelector('#modal-stage');
  const modalNotes = container.querySelector('#modal-notes');
  const modalCondition = container.querySelector('#modal-condition');
  const modalTitle = container.querySelector('#modal-title');
  const photoInput = container.querySelector('#modal-photo-input');
  const photoPreviewBox = container.querySelector('#photo-preview-box');

  let compressedPhotoUrls = [];

  photoInput.addEventListener('change', async (e) => {
    photoPreviewBox.innerHTML = '';
    compressedPhotoUrls = [];
    const files = Array.from(e.target.files).slice(0, 3);

    for (const file of files) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast(`Image ${file.name} exceeds 1.5MB and was skipped.`, 'warning');
        continue;
      }
      try {
        const compressed = await compressImageToDataUrl(file);
        compressedPhotoUrls.push(compressed);
        const img = document.createElement('img');
        img.src = compressed;
        img.style.cssText = 'width:60px; height:60px; object-fit:cover; border:2px solid #111; border-radius:4px;';
        photoPreviewBox.appendChild(img);
      } catch (err) {
        console.warn('Image compression error', err);
      }
    }
  });

  async function compressImageToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  container.querySelectorAll('.btn-condition-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const stage = btn.dataset.stage;
      const bId = btn.dataset.id;
      modalBookingId.value = bId;
      modalStage.value = stage;
      modalNotes.value = '';
      photoInput.value = '';
      photoPreviewBox.innerHTML = '';
      compressedPhotoUrls = [];
      modalTitle.textContent = stage === 'before' ? 'Pre-Handover Inspection' : 'Return Handover Inspection';
      modalBackdrop.style.display = 'flex';
    });
  });

  container.querySelector('#btn-modal-cancel').addEventListener('click', () => {
    modalBackdrop.style.display = 'none';
  });

  container.querySelector('#condition-report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await Store.addConditionReport({
        booking_id: modalBookingId.value,
        reporter_id: currentUser.id,
        stage: modalStage.value,
        condition: modalCondition.value,
        notes: modalNotes.value,
        photoUrls: compressedPhotoUrls
      });

      modalBackdrop.style.display = 'none';
      if (res.incident) {
        showToast('Condition logged: Damage flagged. An incident has been submitted for human review.', 'warning');
      } else {
        showToast('Condition inspection recorded successfully.', 'success');
      }
      renderMyBookings(params, container);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Attach compare modal
  const compareBackdrop = container.querySelector('#compare-modal-backdrop');
  container.querySelectorAll('.btn-compare-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const bId = Number(btn.dataset.id);
      const reports = conditionReports.filter(c => c.booking_id === bId);
      const before = reports.find(r => r.stage === 'before');
      const after = reports.find(r => r.stage === 'after');

      const compareBox = container.querySelector('#compare-content');
      compareBox.innerHTML = `
        <div style="background:var(--color-paper); padding:1rem; border:var(--border-medium);">
          <strong style="font-family:var(--font-mono); font-size:0.85rem;">INITIAL CHECK-IN</strong>
          <div style="margin:0.5rem 0;">Condition: <span class="sticker ${before ? (before.condition === 'good' ? 'sticker-mint' : 'sticker-coral') : 'sticker-yellow'}">${before ? before.condition : 'N/A'}</span></div>
          <p style="font-size:0.85rem; margin-bottom:0.5rem;">${escapeHtml(before ? before.notes : 'No notes')}</p>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            ${before && before.photoUrls && before.photoUrls.length ? before.photoUrls.map(p => `<img src="${p}" style="width:100%; max-height:140px; object-fit:cover; border:1px solid #111;" />`).join('') : '<span style="font-size:0.75rem; color:#666;">No photos uploaded</span>'}
          </div>
        </div>

        <div style="background:var(--color-paper); padding:1rem; border:var(--border-medium);">
          <strong style="font-family:var(--font-mono); font-size:0.85rem;">RETURN INSPECTION</strong>
          <div style="margin:0.5rem 0;">Condition: <span class="sticker ${after ? (after.condition === 'good' ? 'sticker-mint' : 'sticker-coral') : 'sticker-yellow'}">${after ? after.condition : 'N/A'}</span></div>
          <p style="font-size:0.85rem; margin-bottom:0.5rem;">${escapeHtml(after ? after.notes : 'No notes')}</p>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            ${after && after.photoUrls && after.photoUrls.length ? after.photoUrls.map(p => `<img src="${p}" style="width:100%; max-height:140px; object-fit:cover; border:1px solid #111;" />`).join('') : '<span style="font-size:0.75rem; color:#666;">No photos uploaded</span>'}
          </div>
        </div>
      `;
      compareBackdrop.style.display = 'flex';
    });
  });

  container.querySelector('#btn-close-compare').addEventListener('click', () => {
    compareBackdrop.style.display = 'none';
  });

  // Attach cancel booking buttons
  container.querySelectorAll('.btn-cancel-booking').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to cancel this booking request? This will release the slot to other students.')) return;
      try {
        const res = await Store.cancelBooking(btn.dataset.id, currentUser.id);
        if (res.promoted) {
          showToast('Booking cancelled. Slot released and next waitlisted student was promoted!', 'info');
        } else {
          showToast('Booking cancelled.', 'info');
        }
        renderMyBookings(params, container);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  });
}
