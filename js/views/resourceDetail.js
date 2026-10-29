/**
 * Resource Detail View
 * Complete with:
 * - Interactive 7-Day Availability Calendar Grid with click-to-select
 * - Smart History-derived Hints (busiest weekday, next free slot, similar gear)
 * - Auto-approval status for Trusted borrowers
 * - Tabbed Rules / Eligibility / History inspection
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import * as Auth from '../auth.js';
import { escapeHtml, formatDateTime, formatCurrency, showToast } from '../ui.js';

export async function renderResourceDetail(params, container) {
  const resourceId = Number(params.id);
  const currentUser = await Auth.getSessionUser();
  const [resource, allResources, bookings, userBookings, incidents, conditionReports] = await Promise.all([
    Store.getResourceById(resourceId),
    Store.listResources({ active: true }),
    Store.listBookings({ resourceId }),
    currentUser ? Store.listBookings({ userId: currentUser.id }) : Promise.resolve([]),
    Store.listIncidents(),
    Store.getConditionReports()
  ]);

  if (!resource) {
    container.innerHTML = `
      <div class="card-brut" style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h2>Component Not Found</h2>
        <p style="color: var(--color-muted); margin: 1rem 0 2rem;">The requested component does not exist or has been retired.</p>
        <a href="#/" class="btn-brut btn-primary">← Return to Locker</a>
      </div>
    `;
    return;
  }

  const owner = resource.owner_id ? await Store.getUserById(resource.owner_id) : null;
  const isTrained = !resource.training_required || (currentUser && Rules.isUserTrainedForCategory(currentUser, resource.category));
  const activeUserBookingsCount = userBookings.filter(b => 
    [Rules.BOOKING_STATUSES.PENDING, Rules.BOOKING_STATUSES.APPROVED, Rules.BOOKING_STATUSES.CHECKED_OUT, Rules.BOOKING_STATUSES.WAITLISTED, Rules.BOOKING_STATUSES.ALLOTTED].includes(b.status)
  ).length;

  const trust = currentUser ? Rules.calculateTrustScore(currentUser.id, userBookings, incidents, conditionReports) : { score: 25, level: 'Newcomer', badgeClass: 'sticker-blue' };
  const isAutoApproveEligible = currentUser ? Rules.canAutoApprove(currentUser, resource, trust, false) : false;

  // Default start/end (Tomorrow 10:00 to 17:00)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = n => String(n).padStart(2, '0');
  const defaultDateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  const defaultStart = `${defaultDateStr}T10:00`;
  const defaultEnd = `${defaultDateStr}T17:00`;

  // ----------------- SMART HISTORICAL HINTS (2.6) -----------------
  // 1. Busiest weekday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  bookings.forEach(b => {
    const day = new Date(b.start_at).getDay();
    dayCounts[day]++;
  });
  const busiestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
  const busiestWeekday = dayCounts[busiestDayIdx] > 0 ? dayNames[busiestDayIdx] : 'Tuesday';

  // 2. Similar items currently free
  const similarItems = allResources.filter(r => 
    r.id !== resource.id &&
    r.category === resource.category &&
    !bookings.some(b => b.resource_id === r.id && (b.status === 'approved' || b.status === 'checked_out'))
  ).slice(0, 2);

  // ----------------- 7-DAY CALENDAR GENERATOR (2.1) -----------------
  let weekOffsetDays = 0;

  function renderCalendarGrid() {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffsetDays);
    baseDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(baseDate);
      dt.setDate(dt.getDate() + i);
      days.push(dt);
    }

    const timeSlots = [
      { label: 'Morning (09:00 - 13:00)', startHour: 9, endHour: 13 },
      { label: 'Afternoon (13:00 - 17:00)', startHour: 13, endHour: 17 },
      { label: 'Evening (17:00 - 20:00)', startHour: 17, endHour: 20 }
    ];

    return `
      <div class="calendar-wrapper" style="margin: 1.5rem 0; border: var(--border-thick); background: var(--color-paper-card); border-radius: var(--radius-sm); overflow: hidden;">
        <div style="background: var(--color-paper); padding: 0.75rem 1rem; border-bottom: var(--border-medium); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong style="font-family: var(--font-heading); font-size: 0.95rem;">Live 7-Day Availability Grid</strong>
            <span class="sticker sticker-mint" style="font-size: 0.65rem;">Click Slot to Reserve</span>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-brut btn-sm btn-secondary" id="cal-prev-week" ${weekOffsetDays <= 0 ? 'disabled' : ''}>← Previous</button>
            <button type="button" class="btn-brut btn-sm btn-secondary" id="cal-next-week">Next 7 Days →</button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 0.8rem; font-family: var(--font-mono);">
            <thead>
              <tr style="background: var(--color-paper); border-bottom: var(--border-medium);">
                <th style="padding: 0.6rem; border-right: var(--border-thin); width: 140px;">Time Window</th>
                ${days.map(d => `
                  <th style="padding: 0.6rem; border-right: var(--border-thin); min-width: 95px;">
                    <div style="font-weight: 800; font-family: var(--font-heading);">${d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div style="color: var(--color-muted); font-size: 0.7rem;">${d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${timeSlots.map(slot => `
                <tr style="border-bottom: var(--border-thin);">
                  <td style="padding: 0.6rem; border-right: var(--border-thin); font-weight: 700; text-align: left; background: var(--color-paper); font-size: 0.75rem;">
                    ${slot.label}
                  </td>
                  ${days.map(day => {
                    const slotStart = new Date(day);
                    slotStart.setHours(slot.startHour, 0, 0, 0);
                    const slotEnd = new Date(day);
                    slotEnd.setHours(slot.endHour, 0, 0, 0);

                    // Find if any booking overlaps
                    const overlapping = bookings.find(b => 
                      Rules.isOverlapping(slotStart.toISOString(), slotEnd.toISOString(), b.start_at, b.end_at)
                    );

                    const isPast = slotEnd.getTime() <= Date.now();

                    if (isPast) {
                      return `
                        <td style="padding: 0.5rem; border-right: var(--border-thin); background: rgba(0,0,0,0.04); color: var(--color-muted);" title="Slot is in the past">
                          —
                        </td>
                      `;
                    }

                    if (overlapping) {
                      const isSolidBooked = overlapping.status === 'approved' || overlapping.status === 'checked_out';
                      const isHatched = overlapping.status === 'pending' || overlapping.status === 'waitlisted';

                      return `
                        <td style="padding: 0.5rem; border-right: var(--border-thin); ${isSolidBooked ? 'background: #FFD93D; font-weight: bold;' : 'background: repeating-linear-gradient(45deg, #FFF8E7, #FFF8E7 6px, #FFEAA7 6px, #FFEAA7 12px);'}" title="${isSolidBooked ? 'Reserved/In Use' : 'Pending Request Queue'}">
                          <span style="font-size: 0.7rem; font-weight: 800; display: block;">${isSolidBooked ? 'BOOKED' : 'PENDING'}</span>
                        </td>
                      `;
                    }

                    // Slot is completely free!
                    const startVal = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(slot.startHour)}:00`;
                    const endVal = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(slot.endHour)}:00`;

                    return `
                      <td style="padding: 0.5rem; border-right: var(--border-thin); cursor: pointer; transition: background 0.12s; background: rgba(107, 203, 119, 0.15);" 
                          class="cal-slot-free" 
                          data-start="${startVal}" 
                          data-end="${endVal}" 
                          title="Free slot! Click to fill reservation form">
                        <span style="color: #111; font-weight: 800; font-size: 0.75rem;">FREE</span>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <a href="#/" class="btn-brut btn-sm btn-secondary">← Back to Locker</a>
    </div>

    <div class="detail-layout">
      <!-- Left Column: Media & Specifications & Calendar -->
      <div>
        <div class="card-brut" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
          <!-- Media Header Toolbar -->
          <div style="background: var(--color-ink); color: #fff; padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span>VIEW MODE:</span>
              <button type="button" id="btn-show-photo" class="btn-brut btn-sm btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; min-height: 28px;">
                📷 Real Photo (Wikimedia)
              </button>
              <button type="button" id="btn-show-svg" class="btn-brut btn-sm btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; min-height: 28px;">
                ⚡ Circuit Art (SVG)
              </button>
            </div>
            ${resource.wikimedia_file ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="sticker sticker-white" style="font-size: 0.65rem; padding: 1px 5px;">${escapeHtml(resource.image_license || 'CC')}</span>
                <a href="${escapeHtml(resource.description_url || `https://commons.wikimedia.org/wiki/${encodeURIComponent(resource.wikimedia_file)}`)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); text-decoration: underline;">
                  MediaWiki Imageinfo ↗
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Photo View Container -->
          <div id="media-photo-view" style="min-height: 320px; background: #ffffff; border-bottom: var(--border-thick); display: flex; align-items: center; justify-content: center; position: relative; padding: 1rem;">
            ${resource.image_url ? `
              <img src="${escapeHtml(resource.image_url)}" alt="${escapeHtml(resource.name)}" style="max-height: 320px; max-width: 100%; object-fit: contain;" />
            ` : `
              <div style="padding: 2rem; text-align: center; color: var(--color-muted);">
                No photograph available. Displaying vector schematic below.
              </div>
            `}
          </div>

          <!-- Circuit SVG View Container -->
          <div id="media-svg-view" style="display: none; height: 320px; background: var(--color-paper); border-bottom: var(--border-thick);">
            ${resource.svgArt}
          </div>

          ${resource.image_artist ? `
            <div style="background: var(--color-paper); padding: 0.4rem 1rem; border-bottom: var(--border-thin); font-size: 0.75rem; font-family: var(--font-mono); color: var(--color-muted); display: flex; justify-content: space-between; flex-wrap: wrap;">
              <span>Attribution: <strong>${escapeHtml(resource.image_artist)}</strong></span>
              <span>License: <strong>${escapeHtml(resource.image_license || 'Creative Commons')}</strong> via Wikimedia Commons</span>
            </div>
          ` : ''}
          <div style="padding: 1.75rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <span class="sticker sticker-yellow">${escapeHtml(resource.category)}</span>
              ${resource.training_required ? `
                <span class="sticker ${isTrained ? 'sticker-mint' : 'sticker-coral'}">
                  ${isTrained ? '✓ You Are Certified' : '⚡ Training Required'}
                </span>
              ` : '<span class="sticker sticker-mint">Open Access</span>'}
              <span class="sticker sticker-blue">Valued: ${formatCurrency(resource.replacement_value)}</span>
              ${resource.auto_approve_trusted ? '<span class="sticker sticker-lilac">⚡ Auto-Approve Eligible</span>' : ''}
            </div>

            <h1 style="font-size: 2.2rem; margin-bottom: 1rem;">${escapeHtml(resource.name)}</h1>
            <p style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.75rem;">${escapeHtml(resource.description)}</p>

            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; font-family: var(--font-mono); font-size: 0.85rem; border-top: var(--border-medium); padding-top: 1rem; margin-bottom: 1.5rem;">
              <div><strong>Custodian:</strong> ${escapeHtml(owner ? owner.name : 'Lab Staff')}</div>
              <div><strong>Locker Location:</strong> ${escapeHtml(resource.location)}</div>
            </div>

            <!-- 7-Day Live Availability Calendar Grid -->
            <div id="calendar-container">
              ${renderCalendarGrid()}
            </div>

            <!-- Tabs: Rules / Eligibility / History -->
            <div class="tab-nav" role="tablist">
              <button type="button" class="tab-btn active" data-tab="tab-rules" role="tab" aria-selected="true">
                📋 Usage Rules
              </button>
              <button type="button" class="tab-btn" data-tab="tab-eligibility" role="tab" aria-selected="false">
                🎓 Eligibility Check
              </button>
              <button type="button" class="tab-btn" data-tab="tab-history" role="tab" aria-selected="false">
                📜 Loan History (${bookings.length})
              </button>
            </div>

            <div id="tab-rules" class="tab-content" role="tabpanel" style="display: block;">
              <div style="background: var(--color-paper); border: var(--border-medium); padding: 1.25rem; border-radius: var(--radius-sm);">
                <h4 style="font-size: 0.95rem; text-transform: uppercase; margin-bottom: 0.5rem; font-family: var(--font-mono);">
                  Standard Operating Procedures & Safe Handling
                </h4>
                <p style="font-size: 0.95rem; margin: 0; line-height: 1.6;">${escapeHtml(resource.usage_rules)}</p>
                <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--color-muted);">
                  * Pre-handover inspection and return condition reports must be logged by the borrower or lab supervisor.
                </div>
              </div>
            </div>

            <div id="tab-eligibility" class="tab-content" role="tabpanel" style="display: none;">
              <div style="background: var(--color-paper); border: var(--border-medium); padding: 1.25rem; border-radius: var(--radius-sm);">
                <h4 style="font-size: 0.95rem; text-transform: uppercase; margin-bottom: 0.75rem; font-family: var(--font-mono);">
                  Borrower Qualification Status
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Category Training (${escapeHtml(resource.category)}):</span>
                    <span class="sticker ${isTrained ? 'sticker-mint' : 'sticker-coral'}">
                      ${isTrained ? '✓ Satisfied' : '✗ Training Missing'}
                    </span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Active Requests Limit (Fair Use):</span>
                    <span class="sticker ${activeUserBookingsCount < 3 ? 'sticker-mint' : 'sticker-coral'}">
                      ${activeUserBookingsCount}/3 Active
                    </span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Lender Trust Standing:</span>
                    <span class="sticker ${trust.badgeClass}">
                      ${trust.level} (${trust.score}pts)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div id="tab-history" class="tab-content" role="tabpanel" style="display: none;">
              <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1rem;">
                Immutable chain-of-custody log verifying past checkouts and condition checks.
              </p>
              ${bookings.length ? `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${bookings.slice(0, 6).map(b => `
                    <div style="padding: 0.75rem 1rem; border: var(--border-thin); background: var(--color-paper); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                      <div>
                        <span class="sticker ${b.status === 'returned' ? 'sticker-mint' : (b.status === 'checked_out' ? 'sticker-blue' : 'sticker-yellow')}">${escapeHtml(b.status)}</span>
                        <span style="font-family: var(--font-mono); font-size: 0.8rem; margin-left: 0.5rem;">${formatDateTime(b.start_at)} → ${formatDateTime(b.end_at)}</span>
                      </div>
                      <div style="font-size: 0.85rem; color: var(--color-muted);">${escapeHtml(b.purpose.substring(0, 32))}...</div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p style="color:var(--color-muted);">No recorded loans for this item yet.</p>'}
            </div>

          </div>
        </div>
      </div>

      <!-- Right Column: Request Slot Booking Form & Smart Hints -->
      <div>
        <!-- Smart History Hints Card (2.6) -->
        <div class="card-brut" style="background: var(--color-paper); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            💡 Smart Booking Insights
          </h4>
          <ul style="font-size: 0.85rem; list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            <li>📊 <strong>Peak Demand:</strong> Most frequently booked on <strong>${escapeHtml(busiestWeekday)}s</strong>.</li>
            <li>⏱ <strong>Quick Select:</strong> Click any green <em>FREE</em> block on the calendar to snap your reservation slot.</li>
            ${similarItems.length ? `
              <li>
                🔍 <strong>Alternative Free Gear:</strong>
                ${similarItems.map(si => `<a href="#/resource/${si.id}" style="text-decoration: underline; font-weight: bold; margin-left: 0.25rem;">${escapeHtml(si.name)}</a>`).join(', ')}
              </li>
            ` : ''}
          </ul>
        </div>

        <div class="card-brut" style="position: sticky; top: 5.5rem;">
          <h3 style="margin-bottom: 0.25rem;">Reserve Component</h3>

          ${currentUser && currentUser.role === 'admin' ? `
            <div style="background: var(--color-paper); border: var(--border-medium); padding: 0.85rem; margin-bottom: 1rem; border-radius: var(--radius-sm);">
              <strong>🏛️ Administrator Privilege:</strong>
              <div style="font-size: 0.8rem; color: var(--color-muted); margin: 0.25rem 0 0.5rem;">You can directly assign and allot this component to any student without waiting.</div>
              <a href="#/admin" class="btn-brut btn-sm btn-primary">Go to Direct Allotment Console →</a>
            </div>
          ` : ''}

          ${!currentUser ? `
            <div style="background: var(--color-paper); border: var(--border-medium); padding: 1.5rem; text-align: center; border-radius: var(--radius-sm);">
              <h4 style="margin-bottom: 0.5rem;">Sign In to Request</h4>
              <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">
                You must be logged in as a registered student to request this component from the locker.
              </p>
              <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                <a href="#/login" class="btn-brut btn-primary">Sign In</a>
                <a href="#/signup" class="btn-brut btn-secondary">Sign Up</a>
              </div>
            </div>
          ` : `
            <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1.25rem;">Active requests: ${activeUserBookingsCount}/4 fair-use slots</p>

            ${isAutoApproveEligible ? `
              <div style="background: rgba(107, 203, 119, 0.2); border: 2px solid var(--color-mint); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.85rem;">
                ⚡ <strong>Instant Auto-Approval Eligible!</strong><br>
                Because your Trust Level is <strong>${trust.level}</strong> and this component does not require training, your request will be approved instantly!
              </div>
            ` : ''}

            ${!isTrained ? `
              <div style="background: var(--color-coral); border: var(--border-thick); padding: 1rem; font-weight: 700; margin-bottom: 1.25rem; font-size: 0.9rem;">
                ⚠️ Lab Certification Required<br>
                <span style="font-weight: 400; font-size: 0.85rem;">You need verified training for <strong>${escapeHtml(resource.category)}</strong> before borrowing this unit. Contact a council volunteer.</span>
              </div>
            ` : ''}

            ${activeUserBookingsCount >= 4 ? `
              <div style="background: var(--color-primary); border: var(--border-thick); padding: 1rem; font-weight: 700; margin-bottom: 1.25rem; font-size: 0.9rem;">
                ⚠️ Active Request Limit Reached<br>
                <span style="font-weight: 400; font-size: 0.85rem;">To ensure fair access across campus, users can have at most 4 active or pending bookings.</span>
              </div>
            ` : ''}

            <form id="request-booking-form">
              <div class="form-group">
                <label class="form-label" for="booking-start">Borrow Date & Time</label>
                <input type="datetime-local" id="booking-start" class="input-brut" value="${defaultStart}" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="booking-end">Expected Return</label>
                <input type="datetime-local" id="booking-end" class="input-brut" value="${defaultEnd}" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="booking-purpose">Project Purpose</label>
                <textarea id="booking-purpose" class="textarea-brut" rows="3" placeholder="Specify course, project, or event purpose..." required></textarea>
              </div>

              <div id="conflict-warning" style="display: none; background: var(--color-primary); border: var(--border-medium); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.85rem; font-weight: 700;">
                ℹ Notice: This slot overlaps an approved reservation. Submitting will place you on the <strong>auto-promoting waitlist</strong>.
              </div>

              <button type="submit" class="btn-brut btn-primary" style="width: 100%;" ${(!isTrained || activeUserBookingsCount >= 4) ? 'disabled' : ''}>
                ${isAutoApproveEligible ? '⚡ Submit & Instant Auto-Approve →' : 'Submit Borrow Request →'}
              </button>
            </form>
          `}
        </div>
      </div>
    </div>
  `;

  // Media View Mode switcher (Real Wikimedia Photo vs Circuit SVG)
  const btnShowPhoto = container.querySelector('#btn-show-photo');
  const btnShowSvg = container.querySelector('#btn-show-svg');
  const photoView = container.querySelector('#media-photo-view');
  const svgView = container.querySelector('#media-svg-view');

  if (btnShowPhoto && btnShowSvg && photoView && svgView) {
    btnShowPhoto.addEventListener('click', () => {
      photoView.style.display = 'flex';
      svgView.style.display = 'none';
      btnShowPhoto.classList.replace('btn-secondary', 'btn-primary');
      btnShowSvg.classList.replace('btn-primary', 'btn-secondary');
    });

    btnShowSvg.addEventListener('click', () => {
      photoView.style.display = 'none';
      svgView.style.display = 'block';
      btnShowSvg.classList.replace('btn-secondary', 'btn-primary');
      btnShowPhoto.classList.replace('btn-primary', 'btn-secondary');
    });
  }

  // Attach tab switching handlers
  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetId = btn.dataset.tab;
      const targetEl = container.querySelector(`#${targetId}`);
      if (targetEl) targetEl.style.display = 'block';
    });
  });

  // Calendar slot click-to-select and navigation
  function bindCalendarEvents() {
    container.querySelectorAll('.cal-slot-free').forEach(slot => {
      slot.addEventListener('click', () => {
        const s = slot.dataset.start;
        const e = slot.dataset.end;
        container.querySelector('#booking-start').value = s;
        container.querySelector('#booking-end').value = e;
        checkConflict();
        showToast('Selected time window loaded into reservation form!', 'info');
      });
    });

    const nextBtn = container.querySelector('#cal-next-week');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        weekOffsetDays += 7;
        updateCalendar();
      });
    }

    const prevBtn = container.querySelector('#cal-prev-week');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        weekOffsetDays = Math.max(0, weekOffsetDays - 7);
        updateCalendar();
      });
    }
  }

  function updateCalendar() {
    const calBox = container.querySelector('#calendar-container');
    if (calBox) {
      calBox.innerHTML = renderCalendarGrid();
      bindCalendarEvents();
    }
  }

  bindCalendarEvents();

  // Attach live conflict check
  const startInput = container.querySelector('#booking-start');
  const endInput = container.querySelector('#booking-end');
  const conflictBanner = container.querySelector('#conflict-warning');

  function checkConflict() {
    const s = startInput.value;
    const e = endInput.value;
    if (s && e) {
      const overlap = Rules.findOverlappingBooking(resource.id, s, e, bookings);
      conflictBanner.style.display = overlap ? 'block' : 'none';
    }
  }

  startInput.addEventListener('change', checkConflict);
  endInput.addEventListener('change', checkConflict);
  checkConflict();

  // Handle form submission
  const form = container.querySelector('#request-booking-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const startAt = startInput.value;
    const endAt = endInput.value;
    const purpose = container.querySelector('#booking-purpose').value;

    try {
      const booking = await Store.createBooking({
        resource_id: resource.id,
        user_id: currentUser.id,
        start_at: startAt,
        end_at: endAt,
        purpose
      });

      if (booking.status === Rules.BOOKING_STATUSES.WAITLISTED) {
        showToast('Request submitted and placed in waitlist queue due to schedule conflict.', 'warning');
      } else if (booking.status === Rules.BOOKING_STATUSES.APPROVED) {
        showToast('⚡ Instant Auto-Approval Granted! Your Trusted standing approved this loan.', 'success');
      } else {
        showToast('Booking request submitted! Awaiting owner approval.', 'success');
      }

      window.location.hash = '#/my-bookings';
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}
