/**
 * UniHive Seed Data - Electronics & Hardware Prototyping
 * Realistic electronics components (Microcontrollers, Sensors, Batteries, Coils, 3D printing)
 * High-fidelity inline SVG diagrams representing circuit hardware
 * Preset accounts: Admin, Council Volunteer, Student
 */

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * High-fidelity SVG generator for electronics hardware components
 */
export function generateComponentSvg(type, title, code) {
  const safeTitle = escapeXml(title.substring(0, 26));
  const safeCode = escapeXml(code || 'CS-HW');

  if (type === 'arduino') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#E8F4F8" />
      <g transform="translate(20, 20)">
        <!-- Arduino Blue PCB -->
        <rect x="0" y="0" width="360" height="200" rx="8" fill="#00878F" stroke="#005B60" stroke-width="3" />
        <!-- USB Type B connector -->
        <rect x="-8" y="25" width="48" height="42" rx="3" fill="#D0D7DE" stroke="#57606A" stroke-width="2" />
        <rect x="-4" y="33" width="16" height="26" fill="#24292F" />
        <!-- DC Barrel Jack -->
        <rect x="-6" y="130" width="54" height="48" rx="4" fill="#24292F" stroke="#111" stroke-width="2" />
        <circle cx="12" cy="154" r="8" fill="#6E7781" />
        <!-- ATmega328P DIP IC Socket & Chip -->
        <rect x="140" y="95" width="130" height="42" rx="2" fill="#1C2128" stroke="#111" stroke-width="2" />
        <!-- IC Pins -->
        ${Array.from({length: 14}).map((_, i) => `
          <rect x="${146 + i * 8.5}" y="90" width="3" height="6" fill="#C59B27" />
          <rect x="${146 + i * 8.5}" y="136" width="3" height="6" fill="#C59B27" />
        `).join('')}
        <circle cx="148" cy="116" r="3" fill="#444C56" />
        <text x="160" y="120" fill="#E6EDF3" font-family="'Space Mono', monospace" font-size="9" font-weight="700">ATMEGA328P</text>
        <!-- Digital Headers -->
        <rect x="150" y="10" width="180" height="18" fill="#1C2128" rx="2" />
        ${Array.from({length: 16}).map((_, i) => `<rect x="${155 + i * 10.5}" y="14" width="4" height="10" fill="#C59B27" />`).join('')}
        <text x="150" y="38" fill="#FFF" font-family="'Space Mono', monospace" font-size="8">DIGITAL PWM (0-13)</text>
        <!-- Analog / Power Headers -->
        <rect x="170" y="172" width="160" height="18" fill="#1C2128" rx="2" />
        ${Array.from({length: 14}).map((_, i) => `<rect x="${176 + i * 10.5}" y="176" width="4" height="10" fill="#C59B27" />`).join('')}
        <text x="170" y="166" fill="#FFF" font-family="'Space Mono', monospace" font-size="8">POWER / ANALOG (A0-A5)</text>
        <!-- 16MHz Crystal Oscillator -->
        <rect x="90" y="65" width="28" height="14" rx="3" fill="#D0D7DE" stroke="#8C959F" stroke-width="1.5" />
        <text x="93" y="75" fill="#111" font-family="'Space Mono', monospace" font-size="6" font-weight="700">16.0</text>
        <!-- Reset Button -->
        <rect x="70" y="20" width="22" height="22" rx="2" fill="#C59B27" />
        <circle cx="81" cy="31" r="6" fill="#C0392B" />
        <!-- Onboard LEDs -->
        <circle cx="115" cy="110" r="3" fill="#2ECC71" />
        <circle cx="115" cy="122" r="3" fill="#F1C40F" />
        <!-- Branding Label -->
        <text x="65" y="115" fill="#FFF" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="900" letter-spacing="1">ARDUINO</text>
        <text x="65" y="130" fill="#FFEAA7" font-family="'Space Mono', monospace" font-size="9" font-weight="700">UNO R3 • ${safeCode}</text>
      </g>
    </svg>`;
  }

  if (type === 'esp32') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#EAECEF" />
      <g transform="translate(60, 15)">
        <!-- ESP32 Matte Black Board -->
        <rect x="0" y="0" width="280" height="210" rx="6" fill="#1E232A" stroke="#111" stroke-width="3" />
        <!-- Dual Side Headers (30 pin) -->
        ${Array.from({length: 15}).map((_, i) => `
          <rect x="-8" y="${18 + i * 11.5}" width="12" height="6" fill="#C59B27" stroke="#111" stroke-width="1" />
          <rect x="276" y="${18 + i * 11.5}" width="12" height="6" fill="#C59B27" stroke="#111" stroke-width="1" />
        `).join('')}
        <!-- WROOM-32 Metal RF Shield -->
        <rect x="50" y="18" width="180" height="110" rx="4" fill="#C5D1D9" stroke="#8C959F" stroke-width="2" />
        <!-- PCB Trace Antenna on top -->
        <rect x="55" y="24" width="170" height="26" fill="#1E232A" rx="2" />
        <path d="M70,38 L85,38 L85,30 L100,30 L100,38 L115,38 L115,30 L130,30 L130,38 L145,38 L145,30 L160,30 L160,38 L175,38 L175,30 L190,30 L190,38 L205,38" fill="none" stroke="#C59B27" stroke-width="3" stroke-linecap="round" />
        <text x="65" y="75" fill="#24292F" font-family="'Space Mono', monospace" font-size="11" font-weight="900">ESP-WROOM-32</text>
        <text x="65" y="92" fill="#57606A" font-family="'Space Mono', monospace" font-size="8">Wi-Fi + BT / Dual Core 240MHz</text>
        <text x="65" y="108" fill="#57606A" font-family="'Space Mono', monospace" font-size="8">FCC ID: 2AC7Z-ESPWROOM32</text>
        <!-- CP2102 USB Bridge IC -->
        <rect x="120" y="145" width="40" height="26" rx="2" fill="#111" />
        <circle cx="125" cy="150" r="2" fill="#555" />
        <!-- MicroUSB Jack -->
        <rect x="110" y="196" width="60" height="20" rx="2" fill="#AFB8C1" stroke="#24292F" stroke-width="2" />
        <rect x="125" y="202" width="30" height="8" fill="#111" />
        <!-- Buttons EN / BOOT -->
        <rect x="25" y="170" width="22" height="18" fill="#57606A" rx="2" />
        <circle cx="36" cy="179" r="4" fill="#C0392B" />
        <text x="26" y="198" fill="#FFF" font-family="'Space Mono', monospace" font-size="7">EN</text>
        <rect x="233" y="170" width="22" height="18" fill="#57606A" rx="2" />
        <circle cx="244" cy="179" r="4" fill="#2980B9" />
        <text x="230" y="198" fill="#FFF" font-family="'Space Mono', monospace" font-size="7">BOOT</text>
      </g>
    </svg>`;
  }

  if (type === 'raspberry_pi') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#E6F4EA" />
      <g transform="translate(25, 20)">
        <!-- Green Pi PCB -->
        <rect x="0" y="0" width="350" height="200" rx="10" fill="#0E6251" stroke="#0B4F41" stroke-width="3" />
        <!-- 40 Pin GPIO Header -->
        <rect x="30" y="8" width="200" height="22" fill="#1A1A1A" rx="2" />
        ${Array.from({length: 20}).map((_, i) => `
          <circle cx="${38 + i * 9.8}" cy="14" r="2" fill="#C59B27" />
          <circle cx="${38 + i * 9.8}" cy="24" r="2" fill="#C59B27" />
        `).join('')}
        <!-- BCM2711 Quad CPU -->
        <rect x="110" y="65" width="55" height="55" rx="3" fill="#D0D7DE" stroke="#57606A" stroke-width="2" />
        <text x="115" y="95" fill="#111" font-family="'Space Mono', monospace" font-size="8" font-weight="700">BROADCOM</text>
        <!-- Dual USB 3.0 (Blue) -->
        <rect x="295" y="35" width="62" height="42" rx="3" fill="#0969DA" stroke="#111" stroke-width="2" />
        <rect x="345" y="42" width="14" height="28" fill="#111" />
        <!-- Dual USB 2.0 (Black) -->
        <rect x="295" y="90" width="62" height="42" rx="3" fill="#24292F" stroke="#111" stroke-width="2" />
        <!-- Ethernet Jack -->
        <rect x="295" y="145" width="62" height="45" rx="3" fill="#AFB8C1" stroke="#111" stroke-width="2" />
        <!-- Dual Micro HDMI -->
        <rect x="110" y="186" width="30" height="18" fill="#24292F" rx="2" />
        <rect x="160" y="186" width="30" height="18" fill="#24292F" rx="2" />
        <!-- USB-C Power -->
        <rect x="30" y="186" width="36" height="18" fill="#AFB8C1" rx="2" />
        <!-- Wireless Shield -->
        <rect x="25" y="45" width="36" height="36" rx="2" fill="#D0D7DE" />
        <text x="35" y="130" fill="#FFF" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="900">Raspberry Pi 4B</text>
        <text x="35" y="148" fill="#A3E4D7" font-family="'Space Mono', monospace" font-size="9">4GB RAM • Gigabit LAN • ${safeCode}</text>
      </g>
    </svg>`;
  }

  if (type === 'coil_inductor') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#FEF9E7" />
      <g transform="translate(80, 20)">
        <!-- Ferrite Toroid Core Ring -->
        <circle cx="120" cy="95" r="75" fill="none" stroke="#2C3E50" stroke-width="38" />
        <circle cx="120" cy="95" r="75" fill="none" stroke="#1A252F" stroke-width="32" />
        <!-- Copper Wire Turns tightly wound around the ring -->
        ${Array.from({length: 22}).map((_, i) => {
          const angle = (i / 22) * Math.PI * 2;
          const x1 = 120 + Math.cos(angle) * 55;
          const y1 = 95 + Math.sin(angle) * 55;
          const x2 = 120 + Math.cos(angle) * 95;
          const y2 = 95 + Math.sin(angle) * 95;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#D35400" stroke-width="8" stroke-linecap="round" />
                  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E67E22" stroke-width="5" stroke-linecap="round" />`;
        }).join('')}
        <!-- Terminal Wire Leads -->
        <path d="M50,135 Q20,180 -10,190" fill="none" stroke="#D35400" stroke-width="7" stroke-linecap="round" />
        <path d="M190,135 Q220,180 250,190" fill="none" stroke="#D35400" stroke-width="7" stroke-linecap="round" />
        <!-- Stripped Tinned Lead Tips -->
        <circle cx="-10" cy="190" r="5" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="2" />
        <circle cx="250" cy="190" r="5" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="2" />
        <rect x="35" y="80" width="170" height="30" rx="4" fill="#111" opacity="0.85" />
        <text x="45" y="100" fill="#F1C40F" font-family="'Space Mono', monospace" font-size="11" font-weight="700">TOROID COIL // 220μH</text>
      </g>
    </svg>`;
  }

  if (type === 'lipo_battery') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#FDEDEC" />
      <g transform="translate(50, 30)">
        <!-- LiPo Pack Body with 3 distinct stacked cells -->
        <rect x="0" y="20" width="220" height="130" rx="8" fill="#F4D03F" stroke="#111" stroke-width="3" />
        <line x1="0" y1="62" x2="220" y2="62" stroke="#D4AC0D" stroke-width="2" />
        <line x1="0" y1="104" x2="220" y2="104" stroke="#D4AC0D" stroke-width="2" />
        <!-- Warning & Spec Label -->
        <rect x="25" y="40" width="170" height="90" rx="4" fill="#111" />
        <text x="35" y="65" fill="#F1C40F" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="900">3S 11.1V 2200mAh</text>
        <text x="35" y="85" fill="#FFF" font-family="'Space Mono', monospace" font-size="11">DISCHARGE: 35C (77A)</text>
        <text x="35" y="105" fill="#E74C3C" font-family="'Space Mono', monospace" font-size="9" font-weight="700">⚠ LI-POLYMER RECHARGEABLE</text>
        <text x="35" y="120" fill="#AAA" font-family="'Space Mono', monospace" font-size="8">${safeCode} • CERTIFIED</text>
        <!-- Silicone Main Leads -->
        <path d="M220,50 C260,50 280,30 295,30" fill="none" stroke="#C0392B" stroke-width="8" stroke-linecap="round" />
        <path d="M220,70 C260,70 280,50 295,50" fill="none" stroke="#111" stroke-width="8" stroke-linecap="round" />
        <!-- Yellow XT60 Connector Plug -->
        <polygon points="295,20 325,25 325,55 295,60" fill="#F39C12" stroke="#111" stroke-width="2" />
        <circle cx="310" cy="35" r="4" fill="#C59B27" />
        <circle cx="310" cy="48" r="4" fill="#C59B27" />
        <!-- 4-Pin JST Balance Lead -->
        <path d="M220,110 C250,110 270,120 285,120" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
        <rect x="285" y="112" width="22" height="16" rx="2" fill="#FFF" stroke="#111" stroke-width="2" />
        ${Array.from({length: 4}).map((_, i) => `<rect x="${288 + i * 4.5}" y="116" width="2" height="8" fill="#C59B27" />`).join('')}
      </g>
    </svg>`;
  }

  if (type === '18650_battery') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#EBF5FB" />
      <g transform="translate(60, 25)">
        <!-- Heavy Duty Battery Cradle -->
        <rect x="0" y="10" width="260" height="160" rx="8" fill="#1C2833" stroke="#111" stroke-width="3" />
        <!-- Cell 1 -->
        <rect x="25" y="30" width="200" height="48" rx="6" fill="#2980B9" stroke="#1B4F72" stroke-width="2" />
        <rect x="225" y="42" width="12" height="24" rx="2" fill="#BDC3C7" />
        <text x="50" y="60" fill="#FFF" font-family="'Space Mono', monospace" font-size="11" font-weight="700">18650 • 3.7V 3000mAh</text>
        <!-- Cell 2 -->
        <rect x="25" y="100" width="200" height="48" rx="6" fill="#2980B9" stroke="#1B4F72" stroke-width="2" />
        <rect x="225" y="112" width="12" height="24" rx="2" fill="#BDC3C7" />
        <text x="50" y="130" fill="#FFF" font-family="'Space Mono', monospace" font-size="11" font-weight="700">18650 • 3.7V 3000mAh</text>
        <!-- Silver Contact Springs -->
        <circle cx="20" cy="54" r="5" fill="#BDC3C7" />
        <circle cx="20" cy="124" r="5" fill="#BDC3C7" />
        <!-- Output Wires -->
        <path d="M260,54 Q285,54 300,75" fill="none" stroke="#E74C3C" stroke-width="4" stroke-linecap="round" />
        <path d="M260,124 Q285,124 300,105" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" />
      </g>
    </svg>`;
  }

  if (type === 'pla_filament') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#F5EEF8" />
      <g transform="translate(90, 15)">
        <!-- Filament Spool Outer Flange -->
        <circle cx="110" cy="100" r="95" fill="#2C3E50" stroke="#111" stroke-width="3" />
        <!-- Coiled Filament Ring -->
        <circle cx="110" cy="100" r="85" fill="#E67E22" stroke="#D35400" stroke-width="2" />
        ${Array.from({length: 8}).map((_, i) => `
          <circle cx="110" cy="100" r="${55 + i * 4}" fill="none" stroke="#F39C12" stroke-width="2.5" opacity="0.85" />
        `).join('')}
        <!-- Inner Core Hub -->
        <circle cx="110" cy="100" r="48" fill="#1C2833" stroke="#111" stroke-width="2" />
        <circle cx="110" cy="100" r="24" fill="#F5EEF8" stroke="#111" stroke-width="2" />
        <!-- Spool Window Holes -->
        ${[0, 60, 120, 180, 240, 300].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const cx = 110 + Math.cos(rad) * 68;
          const cy = 100 + Math.sin(rad) * 68;
          return `<circle cx="${cx}" cy="${cy}" r="10" fill="#2C3E50" stroke="#111" stroke-width="1.5" />`;
        }).join('')}
        <!-- Loose Filament End -->
        <path d="M195,100 C220,90 230,130 250,120" fill="none" stroke="#E67E22" stroke-width="4" stroke-linecap="round" />
        <!-- Label Badge -->
        <rect x="50" y="90" width="120" height="22" rx="3" fill="#111" />
        <text x="58" y="105" fill="#FFF" font-family="'Space Mono', monospace" font-size="8" font-weight="700">PLA 1.75mm · 1KG</text>
      </g>
    </svg>`;
  }

  if (type === 'motor_driver') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#FADBD8" />
      <g transform="translate(60, 20)">
        <!-- Red PCB -->
        <rect x="0" y="0" width="280" height="195" rx="6" fill="#C0392B" stroke="#922B21" stroke-width="3" />
        <!-- Center Black Aluminum Heat Sink -->
        <rect x="80" y="30" width="120" height="75" rx="3" fill="#1C2833" stroke="#111" stroke-width="2" />
        ${Array.from({length: 7}).map((_, i) => `<line x1="${92 + i * 16}" y1="30" x2="${92 + i * 16}" y2="105" stroke="#34495E" stroke-width="3" />`).join('')}
        <text x="100" y="70" fill="#FFF" font-family="'Space Mono', monospace" font-size="11" font-weight="900">L298N DUAL</text>
        <text x="96" y="86" fill="#F1C40F" font-family="'Space Mono', monospace" font-size="8">H-BRIDGE DRIVER</text>
        <!-- Blue Screw Terminals: Motor A, Motor B, Power -->
        <rect x="10" y="50" width="40" height="50" rx="3" fill="#2980B9" stroke="#111" stroke-width="2" />
        <circle cx="30" cy="62" r="5" fill="#F4D03F" stroke="#111" />
        <circle cx="30" cy="88" r="5" fill="#F4D03F" stroke="#111" />
        <rect x="230" y="50" width="40" height="50" rx="3" fill="#2980B9" stroke="#111" stroke-width="2" />
        <circle cx="250" cy="62" r="5" fill="#F4D03F" stroke="#111" />
        <circle cx="250" cy="88" r="5" fill="#F4D03F" stroke="#111" />
        <!-- Bottom Power Terminal -->
        <rect x="80" y="140" width="60" height="35" rx="3" fill="#2980B9" stroke="#111" stroke-width="2" />
        <!-- Filter Capacitors -->
        <circle cx="55" cy="145" r="14" fill="#1C2833" stroke="#5D6D7E" stroke-width="2" />
        <line x1="45" y1="145" x2="65" y2="145" stroke="#BDC3C7" stroke-width="2" />
        <!-- Header Pins -->
        <rect x="160" y="150" width="80" height="16" fill="#111" rx="2" />
        ${Array.from({length: 6}).map((_, i) => `<circle cx="${168 + i * 12}" cy="158" r="2" fill="#C59B27" />`).join('')}
        <text x="160" y="180" fill="#FFF" font-family="'Space Mono', monospace" font-size="8">IN1 IN2 IN3 IN4</text>
      </g>
    </svg>`;
  }

  if (type === 'ultrasonic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#EBF5FB" />
      <g transform="translate(60, 25)">
        <!-- Blue PCB -->
        <rect x="0" y="20" width="280" height="150" rx="6" fill="#1B4F72" stroke="#111" stroke-width="3" />
        <!-- Dual Transducer Cylinders (Eyes) -->
        <circle cx="75" cy="85" r="45" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="3" />
        <circle cx="75" cy="85" r="38" fill="#2C3E50" />
        <circle cx="75" cy="85" r="32" fill="#1A252F" />
        <text x="70" y="90" fill="#FFF" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="900">T</text>
        <circle cx="205" cy="85" r="45" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="3" />
        <circle cx="205" cy="85" r="38" fill="#2C3E50" />
        <circle cx="205" cy="85" r="32" fill="#1A252F" />
        <text x="200" y="90" fill="#FFF" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="900">R</text>
        <!-- Center Crystal Oscillator -->
        <rect x="125" y="70" width="30" height="14" rx="3" fill="#D0D7DE" stroke="#57606A" stroke-width="1.5" />
        <!-- 4 Pin Header -->
        <rect x="110" y="160" width="60" height="15" fill="#111" rx="2" />
        ${Array.from({length: 4}).map((_, i) => `<circle cx="${118 + i * 14}" cy="167" r="2.5" fill="#C59B27" />`).join('')}
        <text x="90" y="42" fill="#FFF" font-family="'Space Mono', monospace" font-size="11" font-weight="700">HC-SR04 SENSOR</text>
      </g>
    </svg>`;
  }

  if (type === 'oscilloscope') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#FEF9E7" />
      <g transform="translate(60, 15)">
        <!-- Rugged Yellow Body -->
        <rect x="0" y="0" width="280" height="210" rx="10" fill="#F1C40F" stroke="#111" stroke-width="4" />
        <!-- Bezel & Dark Screen -->
        <rect x="25" y="20" width="170" height="135" rx="4" fill="#111" stroke="#333" stroke-width="2" />
        <!-- Grid lines on screen -->
        ${Array.from({length: 7}).map((_, i) => `<line x1="25" y1="${35 + i * 16}" x2="195" y2="${35 + i * 16}" stroke="#1E3A2F" stroke-width="1" stroke-dasharray="2 2" />`).join('')}
        ${Array.from({length: 9}).map((_, i) => `<line x1="${40 + i * 17}" y1="20" x2="${40 + i * 17}" y2="155" stroke="#1E3A2F" stroke-width="1" stroke-dasharray="2 2" />`).join('')}
        <!-- Sine Wave on screen -->
        <path d="M30,85 Q45,45 60,85 T90,85 T120,85 T150,85 T180,85 T195,85" fill="none" stroke="#2ECC71" stroke-width="2.5" stroke-linecap="round" />
        <text x="35" y="36" fill="#F1C40F" font-family="'Space Mono', monospace" font-size="8">CH1: 2.00V 1.00kHz</text>
        <!-- Control buttons on right -->
        <rect x="210" y="25" width="45" height="18" rx="3" fill="#24292F" stroke="#111" />
        <text x="218" y="37" fill="#FFF" font-family="'Space Mono', monospace" font-size="7">V/DIV</text>
        <rect x="210" y="52" width="45" height="18" rx="3" fill="#24292F" stroke="#111" />
        <text x="217" y="64" fill="#FFF" font-family="'Space Mono', monospace" font-size="7">SEC/D</text>
        <rect x="210" y="80" width="45" height="18" rx="3" fill="#24292F" stroke="#111" />
        <text x="220" y="92" fill="#FFF" font-family="'Space Mono', monospace" font-size="7">TRIG</text>
        <!-- Rotary Dial Knob -->
        <circle cx="232" cy="130" r="18" fill="#D0D7DE" stroke="#111" stroke-width="2" />
        <circle cx="232" cy="130" r="14" fill="#6E7781" />
        <line x1="232" y1="116" x2="232" y2="128" stroke="#FFF" stroke-width="2" />
        <!-- Bottom BNC Connector Port -->
        <circle cx="50" cy="180" r="12" fill="#D0D7DE" stroke="#111" stroke-width="2" />
        <circle cx="50" cy="180" r="4" fill="#111" />
        <text x="75" y="185" fill="#111" font-family="'Space Mono', monospace" font-size="10" font-weight="700">DSO150 OSCILLOSCOPE</text>
      </g>
    </svg>`;
  }

  // Generic fallback electronics card
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
    <rect width="100%" height="100%" fill="#E8F8F5" />
    <g transform="translate(40, 30)">
      <rect x="0" y="0" width="320" height="180" rx="8" fill="#1C2833" stroke="#111" stroke-width="3" />
      <rect x="0" y="0" width="320" height="36" fill="#111" />
      <text x="15" y="24" fill="#F1C40F" font-family="'Space Mono', monospace" font-size="11" font-weight="700">HARDWARE COMPONENT // ${safeCode}</text>
      <circle cx="80" cy="108" r="40" fill="#2ECC71" stroke="#111" stroke-width="2" />
      <rect x="62" y="90" width="36" height="36" fill="#111" rx="4" />
      <text x="140" y="95" fill="#FFF" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="800">${safeTitle}</text>
      <text x="140" y="118" fill="#AAA" font-family="'Space Mono', monospace" font-size="10">STANDARDIZED LAB KIT</text>
      <rect x="140" y="130" width="90" height="22" rx="3" fill="#F1C40F" />
      <text x="148" y="145" fill="#111" font-family="'Space Mono', monospace" font-size="9" font-weight="700">AVAILABLE</text>
    </g>
  </svg>`;
}

export function getInitialSeedData() {
  const now = new Date();
  const d = (daysAgo, hours = 0) => new Date(now.getTime() - (daysAgo * 24 * 3600 * 1000) + (hours * 3600 * 1000)).toISOString();
  const dFuture = (daysAhead, hours = 0) => new Date(now.getTime() + (daysAhead * 24 * 3600 * 1000) + (hours * 3600 * 1000)).toISOString();

  // Preset Users
  const users = [
    // 1. Preset Administrator (Not self-registerable)
    {
      id: 201,
      name: 'Dean Alice Cooper',
      email: 'admin@unihive.edu',
      password_hash: '5e348ecf3609b2482e748b5b088bfba14aeeb9d43998e90cc4baeb5103d9427e',
      password: 'Admin@UniHive2026!',
      role: 'admin',
      title: 'Dean of Technology & Central Lab Admin',
      trained_categories: 'Microcontrollers,Power & Batteries,Prototyping & Coils,3D Printing,Sensors & Actuators,Test & Tools,Electronics'
    },

    // 2. Preset Council Volunteers (Have power to add/remove components)
    {
      id: 101,
      name: 'Arun Patel (Council Lead)',
      email: 'volunteer@unihive.edu',
      password_hash: '73a43f58227e7691d93868c9b0920e0b5434004e30ec429817ae5429886d8681',
      password: 'Volunteer@UniHive2026!',
      role: 'volunteer',
      title: 'Student Technical Council Volunteer Lead',
      trained_categories: 'Microcontrollers,Power & Batteries,Prototyping & Coils,3D Printing,Sensors & Actuators,Electronics'
    },
    {
      id: 102,
      name: 'Priya Sharma (Robotics Volunteer)',
      email: 'priya@unihive.edu',
      password_hash: '73a43f58227e7691d93868c9b0920e0b5434004e30ec429817ae5429886d8681',
      password: 'Volunteer@UniHive2026!',
      role: 'volunteer',
      title: 'Robotics Club Council Volunteer',
      trained_categories: 'Microcontrollers,Sensors & Actuators,Test & Tools'
    },

    // 3. Preset Students
    {
      id: 1,
      name: 'Maya Chen',
      email: 'student@unihive.edu',
      password_hash: 'd14c5dad98d1ed19f86fa48a81f2c7da3537f7617c798f7d6f79a05ebdc92290',
      password: 'Student@UniHive2026!',
      role: 'student',
      department: 'Robotics & Mechatronics',
      student_id: 'UH-2024-042',
      trained_categories: 'Microcontrollers,Prototyping & Coils,Sensors & Actuators'
    },
    {
      id: 2,
      name: 'Liam Patel',
      email: 'liam@unihive.demo',
      password_hash: 'd14c5dad98d1ed19f86fa48a81f2c7da3537f7617c798f7d6f79a05ebdc92290',
      password: 'Student@UniHive2026!',
      role: 'student',
      department: 'Electrical Engineering',
      student_id: 'UH-2024-118',
      trained_categories: 'Microcontrollers,Power & Batteries,Test & Tools'
    },
    {
      id: 3,
      name: 'Sofia Rodriguez',
      email: 'sofia@unihive.demo',
      password_hash: 'd14c5dad98d1ed19f86fa48a81f2c7da3537f7617c798f7d6f79a05ebdc92290',
      password: 'Student@UniHive2026!',
      role: 'student',
      department: 'IoT & Embedded Systems',
      student_id: 'UH-2023-089',
      trained_categories: 'Microcontrollers,3D Printing,Sensors & Actuators'
    },
    {
      id: 8,
      name: 'Marcus Vance',
      email: 'marcus@unihive.demo',
      password_hash: 'd14c5dad98d1ed19f86fa48a81f2c7da3537f7617c798f7d6f79a05ebdc92290',
      password: 'Student@UniHive2026!',
      role: 'student',
      department: 'Electronics & Instrumentation',
      student_id: 'UH-2023-014',
      trained_categories: 'Test & Tools,Power & Batteries'
    }
  ];

  // Electronics Project Components Catalog
  const resources = [
    {
      id: 1,
      name: 'Arduino Uno R3 Microcontroller Board',
      category: 'Microcontrollers',
      component_code: 'CS-ARD-01',
      description: 'Standard ATmega328P DIP board with 14 digital I/O pins, 6 analog inputs, 16MHz crystal oscillator, and USB Type-B interface.',
      location: 'Electronics Lab · Bench 3',
      owner_id: 101,
      quantity_total: 12,
      quantity_available: 9,
      training_required: false,
      usage_rules: 'Do not short 5V to GND. Use external regulated power supply for motor loads > 200mA.',
      replacement_value: 30,
      tags: ['arduino', 'atmega328p', 'microcontroller', 'embedded'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:Arduino Uno - R3.jpg',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Arduino_Uno_-_R3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC BY 2.0',
      image_artist: 'SparkFun Electronics',
      description_url: 'https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg',
      svgArt: generateComponentSvg('arduino', 'Arduino Uno R3', 'CS-ARD-01')
    },
    {
      id: 2,
      name: 'ESP32 DevKit V1 Wi-Fi + BLE Module',
      category: 'Microcontrollers',
      component_code: 'CS-ESP-02',
      description: 'Dual-core Xtensa 32-bit LX6 MCU with integrated 2.4GHz Wi-Fi and Bluetooth BLE 4.2. Breadboard compatible 30-pin DIP layout.',
      location: 'IoT Makerspace · Cabinet A',
      owner_id: 101,
      quantity_total: 15,
      quantity_available: 11,
      training_required: false,
      usage_rules: 'Operating voltage is strictly 3.3V logic. 5V input permitted only on VIN pin.',
      replacement_value: 20,
      tags: ['esp32', 'wifi', 'bluetooth', 'iot'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:ESP32.jpg',
      image_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/ESP32.jpg/960px-ESP32.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      image_license: 'CC BY-SA 4.0',
      image_artist: 'Edwiyanto',
      description_url: 'https://commons.wikimedia.org/wiki/File:ESP32.jpg',
      svgArt: generateComponentSvg('esp32', 'ESP32 DevKit V1', 'CS-ESP-02')
    },
    {
      id: 3,
      name: 'Raspberry Pi 4 Model B (4GB RAM)',
      category: 'Microcontrollers',
      component_code: 'CS-RPI-03',
      description: 'Broadcom BCM2711 quad-core Cortex-A72 @ 1.5GHz single-board computer with Gigabit Ethernet, dual micro-HDMI 4K, and USB 3.0.',
      location: 'Embedded Systems Lab · Bay 2',
      owner_id: 102,
      quantity_total: 6,
      quantity_available: 4,
      training_required: true,
      usage_rules: 'Use certified 5.1V 3A USB-C PSU. Shut down via OS command before pulling power.',
      replacement_value: 75,
      tags: ['raspberry-pi', 'linux', 'sbc', 'python', 'ros'],
      auto_approve_trusted: false,
      active: true,
      wikimedia_file: 'File:Raspberry Pi 4 B.png',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Raspberry_Pi_4_B.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC0',
      image_artist: 'Batocera Team',
      description_url: 'https://commons.wikimedia.org/wiki/File:Raspberry_Pi_4_B.png',
      svgArt: generateComponentSvg('raspberry_pi', 'Raspberry Pi 4B', 'CS-RPI-03')
    },
    {
      id: 4,
      name: 'High-Q Toroid Inductor / 3D Print Coil Core',
      category: 'Prototyping & Coils',
      component_code: 'CS-COIL-04',
      description: 'Ferrite ring toroid core with heavy-gauge enameled copper wire winding (220μH) for inductive power coupling, filters, and wireless charging experiments.',
      location: 'Power Electronics Bay · Locker 4',
      owner_id: 101,
      quantity_total: 8,
      quantity_available: 6,
      training_required: false,
      usage_rules: 'Ensure insulation enamel remains intact. Check saturation current limits before high-frequency pulsing.',
      replacement_value: 18,
      tags: ['coil', 'toroid', 'inductor', 'wireless-power', '3d-print'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:Toroid electronic.jpg',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Toroid_electronic.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC BY-SA 3.0',
      image_artist: 'Wikimedia Commons',
      description_url: 'https://commons.wikimedia.org/wiki/File:Toroid_electronic.jpg',
      svgArt: generateComponentSvg('coil_inductor', 'Toroid Coil Inductor', 'CS-COIL-04')
    },
    {
      id: 5,
      name: '11.1V 3S LiPo High-Discharge Battery (2200mAh)',
      category: 'Power & Batteries',
      component_code: 'CS-BAT-05',
      description: '3-cell lithium polymer battery pack with 35C continuous discharge rating, XT60 high-current connector, and JST-XH balance lead.',
      location: 'Robotics Workshop · Fireproof Battery Safe',
      owner_id: 102,
      quantity_total: 10,
      quantity_available: 7,
      training_required: true,
      usage_rules: 'Always balance charge in designated LiPo fire safe bag. Never discharge below 3.3V per cell (9.9V total).',
      replacement_value: 45,
      tags: ['lipo', 'battery', 'drone', 'power', 'xt60'],
      auto_approve_trusted: false,
      active: true,
      wikimedia_file: 'File:Kindle-Reader Lithium-Polymer-Battery-01.jpg',
      image_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Kindle-Reader_Lithium-Polymer-Battery-01.jpg/960px-Kindle-Reader_Lithium-Polymer-Battery-01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      image_license: 'CC BY-SA 3.0',
      image_artist: 'CEphoto, Uwe Aranas',
      description_url: 'https://commons.wikimedia.org/wiki/File:Kindle-Reader_Lithium-Polymer-Battery-01.jpg',
      svgArt: generateComponentSvg('lipo_battery', '3S 11.1V 2200mAh LiPo', 'CS-BAT-05')
    },
    {
      id: 6,
      name: 'Dual 18650 Li-ion Cell & Protection Cradle Kit',
      category: 'Power & Batteries',
      component_code: 'CS-BAT-06',
      description: 'Pair of Samsung/LG 18650 3.7V 3000mAh rechargeable lithium-ion cells with keyed 2-slot spring contact battery enclosure and on-board BMS.',
      location: 'Electronics Lab · Cabinet C',
      owner_id: 101,
      quantity_total: 14,
      quantity_available: 12,
      training_required: false,
      usage_rules: 'Check polarity orientation before insertion. Do not puncture outer insulating wrap.',
      replacement_value: 28,
      tags: ['18650', 'battery', 'portable', 'lithium-ion'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:18650 and 21700 lithium ion battery cell.jpg',
      image_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/18650_and_21700_lithium_ion_battery_cell.jpg/960px-18650_and_21700_lithium_ion_battery_cell.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      image_license: 'CC0',
      image_artist: 'Sevenethics',
      description_url: 'https://commons.wikimedia.org/wiki/File:18650_and_21700_lithium_ion_battery_cell.jpg',
      svgArt: generateComponentSvg('18650_battery', 'Dual 18650 Battery Kit', 'CS-BAT-06')
    },
    {
      id: 7,
      name: 'PLA 3D Printer Filament Spool (1.75mm, 1kg)',
      category: '3D Printing',
      component_code: 'CS-FIL-07',
      description: 'High-precision 1.75mm PLA filament spool (tolerance ±0.02mm) suitable for rapid bracket prototyping, custom enclosures, and coil bobbins.',
      location: 'Rapid Prototyping Workshop · Bay 1',
      owner_id: 101,
      quantity_total: 8,
      quantity_available: 5,
      training_required: false,
      usage_rules: 'Store in desiccated vacuum seal bag after use to prevent moisture absorption. Recommended print temp 205-220°C.',
      replacement_value: 25,
      tags: ['3d-printing', 'filament', 'pla', 'prototyping'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:Bobina PLA.jpg',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bobina_PLA.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC BY-SA 4.0',
      image_artist: 'RaquelRendo',
      description_url: 'https://commons.wikimedia.org/wiki/File:Bobina_PLA.jpg',
      svgArt: generateComponentSvg('pla_filament', 'PLA Filament Spool 1kg', 'CS-FIL-07')
    },
    {
      id: 8,
      name: 'L298N Dual H-Bridge Motor Driver Module',
      category: 'Sensors & Actuators',
      component_code: 'CS-MOT-08',
      description: 'Dual DC motor / single stepper motor driver with heavy aluminum heat sink, 2A peak current per channel, and 5V on-board logic regulator.',
      location: 'Robotics Workshop · Storage Rack B',
      owner_id: 102,
      quantity_total: 16,
      quantity_available: 12,
      training_required: false,
      usage_rules: 'Tie common ground between microcontroller and motor supply. Remove 5V enable jumper if powering above 12V.',
      replacement_value: 12,
      tags: ['motor-driver', 'h-bridge', 'actuator', 'robotics'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:Dosmotorsl298n.jpg',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dosmotorsl298n.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC BY-SA 4.0',
      image_artist: 'Quel.soler',
      description_url: 'https://commons.wikimedia.org/wiki/File:Dosmotorsl298n.jpg',
      svgArt: generateComponentSvg('motor_driver', 'L298N Motor Driver', 'CS-MOT-08')
    },
    {
      id: 9,
      name: 'HC-SR04 Ultrasonic Distance Sensor',
      category: 'Sensors & Actuators',
      component_code: 'CS-SEN-09',
      description: 'Ultrasonic range detector operating at 40kHz with 2cm to 400cm non-contact measurement range, 5V trigger and echo pulses.',
      location: 'Sensors Locker · Drawer 2',
      owner_id: 101,
      quantity_total: 20,
      quantity_available: 17,
      training_required: false,
      usage_rules: 'Echo pin outputs 5V. Use resistor divider when interfacing with 3.3V ESP32 boards.',
      replacement_value: 8,
      tags: ['ultrasonic', 'sensor', 'distance', 'obstacle'],
      auto_approve_trusted: true,
      active: true,
      wikimedia_file: 'File:SparkFun HC-SR04 Ultrasonic-Sensor 13959-01a.jpg',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/SparkFun_HC-SR04_Ultrasonic-Sensor_13959-01a.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      image_license: 'CC BY 2.0',
      image_artist: 'SparkFun Electronics',
      description_url: 'https://commons.wikimedia.org/wiki/File:SparkFun_HC-SR04_Ultrasonic-Sensor_13959-01a.jpg',
      svgArt: generateComponentSvg('ultrasonic', 'HC-SR04 Sensor', 'CS-SEN-09')
    },
    {
      id: 10,
      name: 'DSO150 Handheld Digital Storage Oscilloscope',
      category: 'Test & Tools',
      component_code: 'CS-INS-10',
      description: 'Portable digital oscilloscope with 200kHz analog bandwidth, 1MSa/s real-time sampling rate, 2.4-inch color TFT display, and BNC test clip probe.',
      location: 'Instrumentation Lab · Shelf 1',
      owner_id: 101,
      quantity_total: 5,
      quantity_available: 3,
      training_required: true,
      usage_rules: 'Max input voltage is 50Vpk with 1X probe. Use 10X attenuation probe for signals above 50V.',
      replacement_value: 65,
      tags: ['oscilloscope', 'testing', 'debugging', 'waveform', 'signals'],
      auto_approve_trusted: false,
      active: true,
      wikimedia_file: 'File:Analog CRT oscilloscope Tektronix 475A (1977) and digital storage oscilloscope Tektronix TPS 2014B (c. 2012).jpg',
      image_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Analog_CRT_oscilloscope_Tektronix_475A_%281977%29_and_digital_storage_oscilloscope_Tektronix_TPS_2014B_%28c._2012%29.jpg/960px-Analog_CRT_oscilloscope_Tektronix_475A_%281977%29_and_digital_storage_oscilloscope_Tektronix_TPS_2014B_%28c._2012%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      image_license: 'CC BY-SA 3.0',
      image_artist: 'Tektronix, Wikimedia Commons',
      description_url: 'https://commons.wikimedia.org/wiki/File:Analog_CRT_oscilloscope_Tektronix_475A_(1977)_and_digital_storage_oscilloscope_Tektronix_TPS_2014B_(c._2012).jpg',
      svgArt: generateComponentSvg('oscilloscope', 'DSO150 Oscilloscope', 'CS-INS-10')
    }
  ];

  // Bookings with allotment and standard request examples
  const bookings = [
    // 1. ALLOTTED BY ADMIN: High priority project allotment directly granted to Maya Chen
    {
      id: 1,
      resource_id: 3, // Raspberry Pi 4B
      user_id: 1,     // Maya Chen
      start_at: d(2, 9),
      end_at: dFuture(3, 18),
      purpose: 'Autonomous Rover Vision & SLAM Navigation Unit.',
      status: 'allotted', // Admin direct allotment!
      decision_reason: 'Direct administrative allotment for Robotics Research Team.',
      allotted_by: 201, // Admin Dean Alice Cooper
      created_at: d(2, 8),
      checked_out_at: d(2, 9),
      returned_at: null,
      qr_token: 'CS-ALLOT-RPI-01'
    },

    // 2. Overdue booking highlight
    {
      id: 2,
      resource_id: 10, // DSO150 Oscilloscope
      user_id: 8,      // Marcus Vance
      start_at: d(5, 10),
      end_at: d(1, 16), // Ended yesterday => OVERDUE!
      purpose: 'DC-DC buck converter switching frequency analysis.',
      status: 'checked_out',
      decision_reason: 'Approved for senior capstone test.',
      allotted_by: null,
      created_at: d(6, 9),
      checked_out_at: d(5, 10),
      returned_at: null,
      qr_token: 'CS-QR-BK2-OVERDUE'
    },

    // 3. Pending request awaiting volunteer review
    {
      id: 3,
      resource_id: 1, // Arduino Uno R3
      user_id: 2,     // Liam Patel
      start_at: dFuture(1, 9),
      end_at: dFuture(2, 17),
      purpose: 'Smart agricultural soil moisture automated irrigation prototype.',
      status: 'pending',
      decision_reason: '',
      allotted_by: null,
      created_at: d(0, 4),
      checked_out_at: null,
      returned_at: null,
      qr_token: null
    },

    // 4. Approved booking ready for pickup
    {
      id: 4,
      resource_id: 2, // ESP32
      user_id: 3,     // Sofia Rodriguez
      start_at: dFuture(1, 10),
      end_at: dFuture(3, 17),
      purpose: 'LoRa and BLE gateway relay for campus environment sensor node.',
      status: 'approved',
      decision_reason: 'Approved by technical council.',
      allotted_by: null,
      created_at: d(1, 9),
      checked_out_at: null,
      returned_at: null,
      qr_token: 'CS-QR-BK4-ESP32'
    },

    // 5. Completed historical return (Maya Chen)
    {
      id: 5,
      resource_id: 4, // Toroid Coil
      user_id: 1,     // Maya Chen
      start_at: d(15, 9),
      end_at: d(12, 17),
      purpose: 'Wireless inductive power transmission bench test.',
      status: 'returned',
      decision_reason: 'Approved.',
      allotted_by: null,
      created_at: d(17),
      checked_out_at: d(15, 9),
      returned_at: d(12, 16),
      qr_token: 'CS-QR-BK5-HIST'
    }
  ];

  const conditionReports = [
    {
      id: 1,
      booking_id: 1,
      reporter_id: 201,
      stage: 'before',
      condition: 'good',
      notes: 'Brand new Raspberry Pi 4B kit with acrylic case and heatsinks pre-installed.',
      photoUrls: [],
      created_at: d(2, 9)
    },
    {
      id: 2,
      booking_id: 2,
      reporter_id: 101,
      stage: 'before',
      condition: 'good',
      notes: 'BNC probe verified with test square wave.',
      photoUrls: [],
      created_at: d(5, 10)
    },
    {
      id: 3,
      booking_id: 5,
      reporter_id: 1,
      stage: 'before',
      condition: 'good',
      notes: 'Coil intact with undamaged insulation.',
      photoUrls: [],
      created_at: d(15, 9)
    },
    {
      id: 4,
      booking_id: 5,
      reporter_id: 101,
      stage: 'after',
      condition: 'good',
      notes: 'Returned in original static safe bag.',
      photoUrls: [],
      created_at: d(12, 16)
    }
  ];

  const incidents = [];

  const auditEvents = [
    {
      id: 1,
      actor_id: 201,
      action: 'admin_allotment',
      entity_type: 'booking',
      entity_id: 1,
      details: 'Admin allotted Raspberry Pi 4 Model B (4GB RAM) to student Maya Chen for Capstone Robotics Project.',
      created_at: d(2, 8)
    },
    {
      id: 2,
      actor_id: 101,
      action: 'component_added',
      entity_type: 'resource',
      entity_id: 2,
      details: 'Council Volunteer Arun Patel registered ESP32 DevKit V1 stock.',
      created_at: d(20)
    }
  ];

  return {
    schemaVersion: 1,
    users,
    resources,
    bookings,
    conditionReports,
    incidents,
    auditEvents
  };
}
