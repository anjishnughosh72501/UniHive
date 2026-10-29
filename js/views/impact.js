/**
 * Impact & Sustainability Dashboard View
 * With animated metrics, 30-day SVG loan activity chart, and carbon formula breakdown.
 */

import * as Store from '../store.js';
import * as Rules from '../rules.js';
import { escapeHtml, formatCurrency, animateCounter } from '../ui.js';

export async function renderImpact(params, container) {
  const [resources, bookings] = await Promise.all([
    Store.listResources({ active: undefined }),
    Store.listBookings()
  ]);

  const stats = Rules.calculateImpactStats(resources, bookings);

  // Generate 30-day SVG trend chart
  function generate30DayChartSvg() {
    const days = 30;
    const now = new Date();
    const dayCounts = Array(days).fill(0);

    bookings.forEach(b => {
      const bDate = new Date(b.created_at);
      const diffDays = Math.floor((now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < days) {
        dayCounts[days - 1 - diffDays]++;
      }
    });

    const width = 760;
    const height = 180;
    const padding = 35;
    const barWidth = ((width - padding * 2) / days) - 4;
    const maxVal = Math.max(...dayCounts, 4);

    const bars = dayCounts.map((val, idx) => {
      const barHeight = Math.round((val / maxVal) * (height - padding * 2));
      const x = padding + idx * (barWidth + 4);
      const y = height - padding - barHeight;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${val > 0 ? '#4D96FF' : '#E0E0E0'}" stroke="#111" stroke-width="1.5">
          <title>Day ${idx + 1}: ${val} loans</title>
        </rect>
        ${val > 0 ? `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-family="'Space Mono', monospace" font-size="9" fill="#111" font-weight="bold">${val}</text>` : ''}
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:var(--color-paper-card); border:var(--border-thick); box-shadow:var(--shadow-hard); border-radius:var(--radius-sm);">
        <!-- Base line -->
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#111" stroke-width="2"/>
        ${bars}
        <!-- Labels -->
        <text x="${padding}" y="${height - 12}" font-family="'Space Mono', monospace" font-size="10" fill="var(--color-muted)">30 Days Ago</text>
        <text x="${width - padding}" y="${height - 12}" text-anchor="end" font-family="'Space Mono', monospace" font-size="10" fill="var(--color-muted)">Today</text>
      </svg>
    `;
  }

  container.innerHTML = `
    <div style="margin-bottom: 2.5rem;">
      <span class="sticker sticker-mint">CIRCULAR CAMPUS ECONOMY</span>
      <h1 style="font-size: 2.5rem; margin-top: 0.35rem;">Campus Sustainability & Sharing Impact</h1>
      <p style="color: var(--color-muted); max-width: 750px; font-size: 1.1rem;">
        By pooling high-value specialized lab hardware, cameras, and maker equipment, our campus community drastically reduces redundant student expenditure and electronic manufacturing waste.
      </p>
    </div>

    <!-- Impact Stat Metrics -->
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-val" id="metric-bookings">0</div>
        <div class="metric-label">Completed Loans</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" id="metric-items">0</div>
        <div class="metric-label">Unique Items Shared</div>
      </div>
      <div class="metric-card" style="border-color: var(--color-mint);">
        <div class="metric-val" style="color: var(--color-mint);" id="metric-savings">$0</div>
        <div class="metric-label">Est. Financial Savings</div>
      </div>
      <div class="metric-card" style="border-color: var(--color-blue);">
        <div class="metric-val" style="color: var(--color-blue);" id="metric-co2">0kg</div>
        <div class="metric-label">Est. CO2 Avoided</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" id="metric-ontime">0%</div>
        <div class="metric-label">On-Time Return Rate</div>
      </div>
    </div>

    <!-- 30-Day SVG Booking Activity Chart (2.5) -->
    <section style="margin-top: 3rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        <h2 style="font-size: 1.6rem; margin:0;">30-Day Loan Volume Activity</h2>
        <span class="sticker sticker-blue">Live Local Data</span>
      </div>
      <div style="height: 200px; width: 100%;">
        ${generate30DayChartSvg()}
      </div>
    </section>

    <!-- Highest Utilization Equipment -->
    <section style="margin-top: 3.5rem;">
      <h2 style="font-size: 1.6rem; margin-bottom: 1.25rem;">Highest Utilization Equipment</h2>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${stats.topResources.map((r, idx) => `
          <div class="card-brut" style="padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="step-badge" style="width: 32px; height: 32px; font-size: 0.85rem; margin: 0; background: var(--color-primary);">${idx + 1}</span>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.2rem;">
                  <a href="#/resource/${r.id}">${escapeHtml(r.name)}</a>
                </h3>
                <span class="sticker sticker-yellow" style="font-size: 0.65rem;">${escapeHtml(r.category)}</span>
                <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-muted); margin-left: 0.5rem;">Value: ${formatCurrency(r.replacement_value)}</span>
              </div>
            </div>

            <div style="text-align: right; font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800;">
              ${r.usageCount} <span style="font-size: 0.8rem; font-family: var(--font-mono); font-weight: normal; color: var(--color-muted);">loans recorded</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Methodology & Environmental Formulas -->
    <section style="margin-top: 3.5rem;">
      <details class="card-brut" style="background: var(--color-paper); cursor: pointer;">
        <summary style="font-family: var(--font-heading); font-weight: 800; font-size: 1.1rem; padding: 0.5rem 0;">
          Impact Estimation Methodology & Carbon Factors
        </summary>
        <div style="padding-top: 1rem; font-size: 0.9rem; line-height: 1.6; color: var(--color-ink);">
          <p>
            <strong>Cost Savings Calculation:</strong> For every loan completed, replacement savings are calculated at 15% of the asset's retail value, reflecting commercial daily rental avoidance or avoided duplicate personal purchases.
          </p>
          <p>
            <strong>Embodied Carbon Avoided:</strong> Embodied manufacturing footprint per category constants (based on standardized cradle-to-gate LCA estimates):
            <br>• Laptops & Workstations: 60 kg CO2e
            <br>• 3D Printers: 45 kg CO2e
            <br>• Drones: 35 kg CO2e
            <br>• Cinema & Photography: 25 kg CO2e
            <br>• Lab Prototyping Kits & Electronics: 15 kg CO2e
            <br>• Field Audio Equipment: 12 kg CO2e
          </p>
        </div>
      </details>
    </section>
  `;

  setTimeout(() => {
    const elBookings = container.querySelector('#metric-bookings');
    const elItems = container.querySelector('#metric-items');
    const elSavings = container.querySelector('#metric-savings');
    const elCo2 = container.querySelector('#metric-co2');
    const elOntime = container.querySelector('#metric-ontime');

    if (elBookings) animateCounter(elBookings, stats.completedBookingsCount);
    if (elItems) animateCounter(elItems, stats.uniqueItemsShared);
    if (elSavings) elSavings.textContent = formatCurrency(stats.estimatedMoneySaved);
    if (elCo2) elCo2.textContent = `${stats.estimatedCO2Kg.toLocaleString()} kg`;
    if (elOntime) elOntime.textContent = `${stats.onTimeReturnRate}%`;
  }, 100);
}
