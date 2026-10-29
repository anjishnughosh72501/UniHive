/**
 * CampusShare Seed Data
 * Generates 14+ resources across 7 categories, 8 students with varied profiles,
 * 3 owners, 1 admin, 30+ historical bookings across 60 days, 1 currently overdue booking,
 * open & resolved incidents, and audit events.
 */

function generateSvgArt(category, title) {
  const bgColors = {
    'Electronics': '#FFD93D',
    'Lab Kits': '#FFEAA7',
    'Photography': '#4D96FF',
    'Audio': '#B983FF',
    'Sports': '#6BCB77',
    'Drones': '#FF6B6B',
    '3D Printers': '#FD79A8',
    'Laptops': '#74B9FF'
  };
  const bg = bgColors[category] || '#FFD93D';
  
  // Neo-brutalist SVG badge art with bold lines and geometric stamps
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="100%" height="100%" style="background:${bg};">
    <defs>
      <pattern id="pat-${category.replace(/\s+/g, '')}" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="#111" opacity="0.12" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pat-${category.replace(/\s+/g, '')})" />
    <g transform="translate(24, 24)">
      <rect x="0" y="0" width="352" height="172" fill="#FFFFFF" stroke="#111111" stroke-width="3" rx="4" filter="drop-shadow(4px 4px 0 #111)" />
      <!-- Header banner -->
      <rect x="0" y="0" width="352" height="34" fill="#111111" />
      <text x="12" y="23" fill="#FFF8E7" font-family="'Space Mono', monospace" font-size="12" font-weight="700" letter-spacing="1.5">${category.toUpperCase()} // ASSET</text>
      <!-- Center Graphic Illustration -->
      <circle cx="80" cy="100" r="38" fill="${bg}" stroke="#111111" stroke-width="3" />
      <rect x="62" y="82" width="36" height="36" fill="#111" stroke="#111" rx="2" />
      <polygon points="80,72 100,105 60,105" fill="#FFF8E7" />
      
      <!-- Typography in tile -->
      <text x="138" y="80" fill="#111111" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="800">${escapeXml(title.substring(0, 22))}</text>
      <text x="138" y="104" fill="#666666" font-family="'Space Mono', monospace" font-size="11">STANDARDIZED KIT</text>
      <rect x="138" y="118" width="75" height="20" fill="${bg}" stroke="#111" stroke-width="1.5" rx="3" />
      <text x="146" y="132" fill="#111111" font-family="'Space Mono', monospace" font-size="10" font-weight="700">VERIFIED</text>
    </g>
  </svg>`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export function getInitialSeedData() {
  const now = new Date();
  const d = (daysAgo, hours = 0) => {
    const dt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000));
    return dt.toISOString();
  };
  const dFuture = (daysAhead, hours = 0) => {
    const dt = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000));
    return dt.toISOString();
  };

  const users = [
    // Students
    { id: 1, name: 'Maya Chen', email: 'maya@campusshare.demo', role: 'student', trained_categories: 'Electronics,3D Printers,Lab Kits' },
    { id: 2, name: 'Liam Patel', email: 'liam@campusshare.demo', role: 'student', trained_categories: 'Photography,Audio' },
    { id: 3, name: 'Sofia Rodriguez', email: 'sofia@campusshare.demo', role: 'student', trained_categories: 'Drones,Electronics,Photography' },
    { id: 4, name: 'Tariq Al-Mansoor', email: 'tariq@campusshare.demo', role: 'student', trained_categories: 'Laptops' },
    { id: 5, name: 'Aisha Bello', email: 'aisha@campusshare.demo', role: 'student', trained_categories: 'Audio,Photography' },
    { id: 6, name: 'Jin Woo', email: 'jin@campusshare.demo', role: 'student', trained_categories: 'Electronics,Lab Kits' },
    { id: 7, name: 'Clara Oswald', email: 'clara@campusshare.demo', role: 'student', trained_categories: 'Sports' },
    { id: 8, name: 'Marcus Vance', email: 'marcus@campusshare.demo', role: 'student', trained_categories: '3D Printers,Electronics' },

    // Owners
    { id: 101, name: 'Dr. Aris Miller', email: 'miller@campusshare.demo', role: 'owner', title: 'Director, Engineering Makerspace', trained_categories: 'Electronics,Lab Kits,3D Printers' },
    { id: 102, name: 'Sarah Jenkins', email: 'sarah@campusshare.demo', role: 'owner', title: 'Media Center Coordinator', trained_categories: 'Photography,Audio,Drones' },
    { id: 103, name: 'Coach Robert Shaw', email: 'shaw@campusshare.demo', role: 'owner', title: 'Athletics & Campus Rec Supervisor', trained_categories: 'Sports' },

    // Admin
    { id: 201, name: 'Dean Alice Cooper', email: 'alice@campusshare.demo', role: 'admin', title: 'Dean of Campus Facilities', trained_categories: 'Electronics,Photography,Audio,Sports,Drones,3D Printers,Laptops,Lab Kits' }
  ];

  const resources = [
    // Lab Kits & Electronics
    {
      id: 1,
      name: 'Digital Storage Oscilloscope 100MHz',
      category: 'Electronics',
      description: 'Dual-channel 100MHz digital storage oscilloscope with 1GSa/s sampling rate, USB export and 2 passive 10X probes for electronic circuit design and validation.',
      location: 'Engineering Lab · Hall B204',
      owner_id: 101,
      training_required: true,
      usage_rules: 'Wear anti-static wrist strap. Do not exceed 300V CAT II input. Power off mains before disconnecting leads.',
      replacement_value: 850,
      tags: ['circuits', 'testing', 'hardware', 'lab'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Electronics', 'Digital Storage Oscilloscope')
    },
    {
      id: 2,
      name: 'IoT Prototyping & Sensor Suite',
      category: 'Lab Kits',
      description: 'Comprehensive embedded electronics kit with ESP32, Raspberry Pi Pico, 30+ environmental sensors, breadboards, jumper wires, and logic analyzers.',
      location: 'Makerspace · Bench 12',
      owner_id: 101,
      training_required: false,
      usage_rules: 'Return all 34 sensor modules in their labeled compartment cases. Report missing Dupont cables.',
      replacement_value: 320,
      tags: ['iot', 'esp32', 'sensors', 'arduino'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Lab Kits', 'IoT Sensor Suite')
    },
    {
      id: 3,
      name: 'FPGA Development Board (Xilinx Artix-7)',
      category: 'Electronics',
      description: 'Digital logic synthesiser board with 256MB DDR3, dual Gigabit Ethernet, HDMI video out, and Pmod expansion headers for high-speed VLSI coursework.',
      location: 'VLSI Research Suite · Room 310',
      owner_id: 101,
      training_required: true,
      usage_rules: 'Store in ESD-shielded static bag when not powered. Do not jumper live 5V/3.3V pins.',
      replacement_value: 550,
      tags: ['fpga', 'vlsi', 'verilog', 'hardware'],
      auto_approve_trusted: false,
      active: true,
      svgArt: generateSvgArt('Electronics', 'FPGA Artix-7 Board')
    },

    // Cameras & Photography
    {
      id: 4,
      name: 'Sony Alpha A7 IV Cinema Rig',
      category: 'Photography',
      description: '33MP full-frame hybrid camera equipped with 24-70mm f/2.8 GM II lens, dual 128GB V90 SD cards, Rode shotgun mic, and SmallRig cage with top handle.',
      location: 'Media Arts Annex · Studio C',
      owner_id: 102,
      training_required: false,
      usage_rules: 'Always wear neck or wrist strap. Keep lens cap installed when not shooting. Never clean sensor without authorized kit.',
      replacement_value: 3200,
      tags: ['4k', 'film', 'photo', 'cinema'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Photography', 'Sony A7 IV Cinema Rig')
    },
    {
      id: 5,
      name: 'Canon EOS R6 Mark II + 50mm Lens',
      category: 'Photography',
      description: 'High-speed 24.2MP mirrorless body with Canon RF 50mm f/1.8 lens, 3 LP-E6NH batteries, dual chargers, and rugged weather-sealed sling bag.',
      location: 'Media Arts Annex · Studio C',
      owner_id: 102,
      training_required: false,
      usage_rules: 'Do not expose to rain without weather housing. Wipe down body before returning.',
      replacement_value: 2600,
      tags: ['photo', 'portraits', 'events'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Photography', 'Canon EOS R6 Mk II')
    },
    {
      id: 6,
      name: 'GoPro HERO12 Creator Edition',
      category: 'Photography',
      description: '5.3K60 action camera bundle with Volta battery grip, Media Mod directional mic, Light Mod, magnetic latch mounts, and waterproof dive housing.',
      location: 'Media Desk · Library Ground Floor',
      owner_id: 102,
      training_required: false,
      usage_rules: 'Rinse with fresh water and dry thoroughly after any aquatic or outdoor wet shoot.',
      replacement_value: 599,
      tags: ['action', 'waterproof', 'vlog', '4k'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Photography', 'GoPro HERO12 Creator')
    },

    // Audio
    {
      id: 7,
      name: 'Røde Wireless PRO Dual Mic System',
      category: 'Audio',
      description: 'Dual-channel wireless microphone setup with 32-bit float onboard recording, smart gain, lavalier mics, and magnetic clip accessories.',
      location: 'Audio Production Lab · Room 104',
      owner_id: 102,
      training_required: false,
      usage_rules: 'Return both transmitters inside charging dock. Untangle and coil lavalier cables loosely.',
      replacement_value: 450,
      tags: ['wireless', 'podcast', 'interview', 'audio'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Audio', 'Rode Wireless PRO Mics')
    },
    {
      id: 8,
      name: 'Zoom H6 Handy Field Audio Recorder',
      category: 'Audio',
      description: '6-track portable field audio recorder with interchangeable X/Y and mid-side microphone capsules, 4 XLR/TRS combo inputs, and high-gain preamps.',
      location: 'Audio Production Lab · Room 104',
      owner_id: 102,
      training_required: false,
      usage_rules: 'Ensure gain wheels are zeroed before plugging phantom-powered condenser mics.',
      replacement_value: 380,
      tags: ['sound', 'recorder', 'xlr', 'field-recording'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Audio', 'Zoom H6 Field Recorder')
    },

    // Drones
    {
      id: 9,
      name: 'DJI Mavic 3 Pro Cine Drone',
      category: 'Drones',
      description: 'Triple-camera aerial platform with Apple ProRes recording, Hasselblad 4/3 CMOS camera, omnidirectional obstacle sensing, and 3 flight batteries.',
      location: 'Robotics & Flight Lab · Hangar 1',
      owner_id: 102,
      training_required: true,
      usage_rules: 'Campus airspace certification mandatory. Maintain visual line of sight at all times. Max flight ceiling 120m.',
      replacement_value: 3900,
      tags: ['drone', 'aerial', 'prores', 'gis'],
      auto_approve_trusted: false,
      active: true,
      svgArt: generateSvgArt('Drones', 'DJI Mavic 3 Pro Drone')
    },

    // 3D Printers
    {
      id: 10,
      name: 'Bambu Lab X1 Carbon High-Speed 3D Printer',
      category: '3D Printers',
      description: 'CoreXY AI-monitored 3D printer with 16-color AMS multi-material unit, 300°C nozzle, lidar bed leveling, and carbon fiber print capability.',
      location: 'Rapid Prototyping Workshop · Bay 4',
      owner_id: 101,
      training_required: true,
      usage_rules: 'Only use approved Bambu/eSun filaments. Clean PEI build plate with 99% isopropyl alcohol after each print.',
      replacement_value: 1500,
      tags: ['3d-printing', 'rapid-proto', 'ams', 'cad'],
      auto_approve_trusted: false,
      active: true,
      svgArt: generateSvgArt('3D Printers', 'Bambu Lab X1 Carbon')
    },
    {
      id: 11,
      name: 'Prusa MK4 Open-Source 3D Printer',
      category: '3D Printers',
      description: 'Workhorse FDM printer with Nextruder automatic first layer calibration, quick-swap nozzles, and magnetic spring steel textured sheet.',
      location: 'Rapid Prototyping Workshop · Bay 2',
      owner_id: 101,
      training_required: true,
      usage_rules: 'Do not use metal scrapers on smooth PEI sheet. Check first layer print before leaving station.',
      replacement_value: 950,
      tags: ['3d-printing', 'prusa', 'open-source'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('3D Printers', 'Prusa MK4 3D Printer')
    },

    // Laptops & Workstations
    {
      id: 12,
      name: 'MacBook Pro 16" M3 Max (36GB RAM / 1TB)',
      category: 'Laptops',
      description: 'High-end mobile workstation pre-loaded with Xcode, Adobe Creative Cloud, Blender, Unity, and PyTorch CUDA/MPS development environments.',
      location: 'IT Services Loan Desk · Central Hall',
      owner_id: 101,
      training_required: false,
      usage_rules: 'Save all personal work to external SSD or cloud. Unit undergoes automated cryptographic wipe upon return.',
      replacement_value: 3499,
      tags: ['dev', 'apple', 'rendering', 'laptop'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Laptops', 'MacBook Pro 16 M3 Max')
    },
    {
      id: 13,
      name: 'Dell XPS 15 RTX 4070 CAD Workstation',
      category: 'Laptops',
      description: 'Intel i9 14-core workstation with NVIDIA RTX 4070 GPU, 32GB DDR5, and 3.5K OLED touch display optimized for SolidWorks and ANSYS simulations.',
      location: 'IT Services Loan Desk · Central Hall',
      owner_id: 101,
      training_required: false,
      usage_rules: 'Use provided 130W USB-C charger. Keep ventilation grills clear while running heavy compute benchmarks.',
      replacement_value: 2800,
      tags: ['windows', 'cad', 'gpu', 'simulation'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Laptops', 'Dell XPS 15 Workstation')
    },

    // Sports & Campus Rec
    {
      id: 14,
      name: 'Spikeball Pro Tournament Official Set',
      category: 'Sports',
      description: 'Official tournament edition roundnet set with reinforced 33% stronger rim and legs, ball pump with pressure gauge, and 2 Pro balls.',
      location: 'Student Activity Center · Gear Locker 7',
      owner_id: 103,
      training_required: false,
      usage_rules: 'Check net tension with official gauge. Deflate slightly before packing in canvas backpack.',
      replacement_value: 120,
      tags: ['sports', 'recreation', 'outdoor', 'roundnet'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Sports', 'Spikeball Pro Set')
    },
    {
      id: 15,
      name: 'Garmin Forerunner GPS & HRM Pro Biometrics',
      category: 'Sports',
      description: 'Triathlon performance monitoring pack with dual-frequency GPS watch, chest-strap heart rate monitor, and cadence/power stride sensors.',
      location: 'Varsity Athletics Training Facility',
      owner_id: 103,
      training_required: false,
      usage_rules: 'Rinse chest strap in cold water after use. Clean sensor charging pins with dry microfiber cloth.',
      replacement_value: 650,
      tags: ['fitness', 'gps', 'biometrics', 'running'],
      auto_approve_trusted: true,
      active: true,
      svgArt: generateSvgArt('Sports', 'Garmin Biometrics Pack')
    }
  ];

  // 30+ Bookings across past 60 days + 1 currently overdue booking + active demo bookings
  const bookings = [
    // --- 1. CURRENTLY OVERDUE BOOKING (Demo highlight!) ---
    {
      id: 1,
      resource_id: 1, // Digital Storage Oscilloscope
      user_id: 8,     // Marcus Vance
      start_at: d(4, 9),
      end_at: d(1, 17), // Ended yesterday! Still checked out => OVERDUE!
      purpose: 'Senior design high-frequency RF filter debugging test bench.',
      status: 'checked_out',
      decision_reason: 'Approved for urgent senior capstone debug.',
      created_at: d(5, 10),
      checked_out_at: d(4, 9),
      returned_at: null,
      qr_token: 'CS-QR-BK1-0982'
    },

    // --- 2. CURRENTLY ACTIVE / APPROVED / WAITLISTED BOOKINGS ---
    {
      id: 2,
      resource_id: 4, // Sony A7 IV
      user_id: 1,     // Maya Chen
      start_at: dFuture(1, 10),
      end_at: dFuture(2, 18),
      purpose: 'Filming robotics symposium showcase recap video.',
      status: 'approved',
      decision_reason: 'Approved. Please pick up morning of.',
      created_at: d(1, 8),
      checked_out_at: null,
      returned_at: null,
      qr_token: 'CS-QR-BK2-3419'
    },
    {
      id: 3,
      resource_id: 4, // Sony A7 IV (Waitlisted due to overlap with booking #2!)
      user_id: 5,     // Aisha Bello
      start_at: dFuture(1, 14),
      end_at: dFuture(2, 12),
      purpose: 'Documenting campus cultural night festival performances.',
      status: 'waitlisted',
      decision_reason: 'Another booking overlaps this time slot; placed in waitlist queue.',
      created_at: d(1, 11),
      checked_out_at: null,
      returned_at: null,
      qr_token: null
    },
    {
      id: 4,
      resource_id: 10, // Bambu Lab X1 3D Printer
      user_id: 1,      // Maya Chen
      start_at: dFuture(3, 9),
      end_at: dFuture(3, 19),
      purpose: '3D printing drone arm replacement brackets in PETG-CF.',
      status: 'pending',
      decision_reason: '',
      created_at: d(0, 3),
      checked_out_at: null,
      returned_at: null,
      qr_token: null
    },

    // --- 3. 28 HISTORICAL COMPLETED BOOKINGS (Spanning 60 days) ---
    // (Maya Chen - Trusted student, all pristine on-time)
    {
      id: 10,
      resource_id: 2,
      user_id: 1,
      start_at: d(45, 9),
      end_at: d(43, 17),
      purpose: 'Autonomous greenhouse temperature logger prototype.',
      status: 'returned',
      decision_reason: 'Approved for IoT project.',
      created_at: d(47),
      checked_out_at: d(45, 9),
      returned_at: d(43, 16), // On time
      qr_token: 'CS-QR-BK10-HIST'
    },
    {
      id: 11,
      resource_id: 11,
      user_id: 1,
      start_at: d(35, 10),
      end_at: d(34, 18),
      purpose: 'Custom ergonomic solder fume extractor duct.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(37),
      checked_out_at: d(35, 10),
      returned_at: d(34, 17), // On time
      qr_token: 'CS-QR-BK11-HIST'
    },
    {
      id: 12,
      resource_id: 1,
      user_id: 1,
      start_at: d(20, 10),
      end_at: d(18, 17),
      purpose: 'PWM motor controller signal waveform analysis.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(22),
      checked_out_at: d(20, 10),
      returned_at: d(18, 16), // On time
      qr_token: 'CS-QR-BK12-HIST'
    },
    {
      id: 13,
      resource_id: 12,
      user_id: 1,
      start_at: d(12, 9),
      end_at: d(10, 17),
      purpose: 'ROS2 robotics simulation rendering.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(14),
      checked_out_at: d(12, 9),
      returned_at: d(10, 16), // On time
      qr_token: 'CS-QR-BK13-HIST'
    },

    // (Sofia Rodriguez - Campus Legend, 7 bookings, impeccable record)
    {
      id: 14,
      resource_id: 9,
      user_id: 3,
      start_at: d(55, 9),
      end_at: d(54, 18),
      purpose: 'Geographic GIS campus tree canopy survey.',
      status: 'returned',
      decision_reason: 'Approved for GIS lab.',
      created_at: d(57),
      checked_out_at: d(55, 9),
      returned_at: d(54, 17),
      qr_token: 'CS-QR-BK14-HIST'
    },
    {
      id: 15,
      resource_id: 9,
      user_id: 3,
      start_at: d(40, 9),
      end_at: d(39, 18),
      purpose: 'Architectural roof solar panel thermal mapping.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(42),
      checked_out_at: d(40, 9),
      returned_at: d(39, 17),
      qr_token: 'CS-QR-BK15-HIST'
    },
    {
      id: 16,
      resource_id: 4,
      user_id: 3,
      start_at: d(32, 10),
      end_at: d(30, 18),
      purpose: 'Documentary on student wind tunnel experiments.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(34),
      checked_out_at: d(32, 10),
      returned_at: d(30, 17),
      qr_token: 'CS-QR-BK16-HIST'
    },
    {
      id: 17,
      resource_id: 3,
      user_id: 3,
      start_at: d(24, 9),
      end_at: d(22, 17),
      purpose: 'Hardware acceleration of FFT algorithms.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(26),
      checked_out_at: d(24, 9),
      returned_at: d(22, 16),
      qr_token: 'CS-QR-BK17-HIST'
    },
    {
      id: 18,
      resource_id: 12,
      user_id: 3,
      start_at: d(15, 9),
      end_at: d(13, 18),
      purpose: 'Point cloud photogrammetry processing.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(17),
      checked_out_at: d(15, 9),
      returned_at: d(13, 17),
      qr_token: 'CS-QR-BK18-HIST'
    },

    // (Liam Patel - Reliable, 4 bookings, minor wear on one)
    {
      id: 19,
      resource_id: 5,
      user_id: 2,
      start_at: d(50, 10),
      end_at: d(48, 18),
      purpose: 'Alumni homecoming gala photo coverage.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(52),
      checked_out_at: d(50, 10),
      returned_at: d(48, 17),
      qr_token: 'CS-QR-BK19-HIST'
    },
    {
      id: 20,
      resource_id: 7,
      user_id: 2,
      start_at: d(38, 13),
      end_at: d(37, 18),
      purpose: 'Student government candidate debate podcast recording.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(40),
      checked_out_at: d(38, 13),
      returned_at: d(37, 17),
      qr_token: 'CS-QR-BK20-HIST'
    },
    {
      id: 21,
      resource_id: 8,
      user_id: 2,
      start_at: d(25, 9),
      end_at: d(24, 17),
      purpose: 'Acoustic field recordings in student center atrium.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(27),
      checked_out_at: d(25, 9),
      returned_at: d(24, 16),
      qr_token: 'CS-QR-BK21-HIST'
    },

    // (Aisha Bello - Reliable, 3 bookings, on time)
    {
      id: 22,
      resource_id: 6,
      user_id: 5,
      start_at: d(42, 9),
      end_at: d(40, 17),
      purpose: 'Rowing club regatta action footage.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(44),
      checked_out_at: d(42, 9),
      returned_at: d(40, 16),
      qr_token: 'CS-QR-BK22-HIST'
    },
    {
      id: 23,
      resource_id: 7,
      user_id: 5,
      start_at: d(28, 14),
      end_at: d(27, 19),
      purpose: 'Senior recital acoustic vocal tracking.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(30),
      checked_out_at: d(28, 14),
      returned_at: d(27, 18),
      qr_token: 'CS-QR-BK23-HIST'
    },

    // (Jin Woo - Trusted, electronics specialist)
    {
      id: 24,
      resource_id: 1,
      user_id: 6,
      start_at: d(52, 10),
      end_at: d(50, 16),
      purpose: 'Solar inverter efficiency waveform measurement.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(54),
      checked_out_at: d(52, 10),
      returned_at: d(50, 15),
      qr_token: 'CS-QR-BK24-HIST'
    },
    {
      id: 25,
      resource_id: 2,
      user_id: 6,
      start_at: d(33, 9),
      end_at: d(31, 17),
      purpose: 'LoRaWAN smart campus weather node.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(35),
      checked_out_at: d(33, 9),
      returned_at: d(31, 16),
      qr_token: 'CS-QR-BK25-HIST'
    },
    {
      id: 26,
      resource_id: 13,
      user_id: 6,
      start_at: d(18, 9),
      end_at: d(16, 17),
      purpose: 'Finite element structural stress analysis.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(20),
      checked_out_at: d(18, 9),
      returned_at: d(16, 16),
      qr_token: 'CS-QR-BK26-HIST'
    },

    // (Clara Oswald - Sports enthusiast, on time)
    {
      id: 27,
      resource_id: 14,
      user_id: 7,
      start_at: d(48, 14),
      end_at: d(47, 18),
      purpose: 'Intramural weekend Spikeball tournament.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(50),
      checked_out_at: d(48, 14),
      returned_at: d(47, 17),
      qr_token: 'CS-QR-BK27-HIST'
    },
    {
      id: 28,
      resource_id: 15,
      user_id: 7,
      start_at: d(22, 8),
      end_at: d(21, 14),
      purpose: 'Half-marathon campus training pacing trials.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(24),
      checked_out_at: d(22, 8),
      returned_at: d(21, 13),
      qr_token: 'CS-QR-BK28-HIST'
    },

    // (Marcus Vance - Had 1 late return, and 1 damage incident resolved)
    {
      id: 29,
      resource_id: 11, // Prusa MK4
      user_id: 8,
      start_at: d(58, 9),
      end_at: d(56, 17),
      purpose: 'Quadcopter frame prototype iteration.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(60),
      checked_out_at: d(58, 9),
      returned_at: d(55, 12), // RETURNED 1 DAY LATE (-10)
      qr_token: 'CS-QR-BK29-HIST'
    },
    {
      id: 30,
      resource_id: 10, // Bambu Lab X1
      user_id: 8,
      start_at: d(44, 9),
      end_at: d(42, 17),
      purpose: 'Robotics chassis mounting hubs.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(46),
      checked_out_at: d(44, 9),
      returned_at: d(42, 16),
      qr_token: 'CS-QR-BK30-HIST'
    },

    // (Tariq Al-Mansoor - Newcomer, 1 successful return)
    {
      id: 31,
      resource_id: 13,
      user_id: 4,
      start_at: d(16, 9),
      end_at: d(14, 18),
      purpose: 'Python machine learning image classification assignment.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(18),
      checked_out_at: d(16, 9),
      returned_at: d(14, 17),
      qr_token: 'CS-QR-BK31-HIST'
    },

    // More variety bookings
    {
      id: 32,
      resource_id: 6,
      user_id: 2,
      start_at: d(14, 10),
      end_at: d(13, 16),
      purpose: 'Cycling club trail ride footage.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(16),
      checked_out_at: d(14, 10),
      returned_at: d(13, 15),
      qr_token: 'CS-QR-BK32-HIST'
    },
    {
      id: 33,
      resource_id: 14,
      user_id: 4,
      start_at: d(8, 14),
      end_at: d(7, 19),
      purpose: 'Dorm outdoor recreation afternoon.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(10),
      checked_out_at: d(8, 14),
      returned_at: d(7, 18),
      qr_token: 'CS-QR-BK33-HIST'
    },
    {
      id: 34,
      resource_id: 8,
      user_id: 5,
      start_at: d(36, 10),
      end_at: d(35, 17),
      purpose: 'Campus radio broadcast interview series.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(38),
      checked_out_at: d(36, 10),
      returned_at: d(35, 16),
      qr_token: 'CS-QR-BK34-HIST'
    },
    {
      id: 35,
      resource_id: 5,
      user_id: 3,
      start_at: d(29, 9),
      end_at: d(28, 18),
      purpose: 'Robotics lab prototype high-speed camera documentation.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(31),
      checked_out_at: d(29, 9),
      returned_at: d(28, 17),
      qr_token: 'CS-QR-BK35-HIST'
    },
    {
      id: 36,
      resource_id: 15,
      user_id: 7,
      start_at: d(11, 8),
      end_at: d(10, 16),
      purpose: 'Track & field relay squad split timing calibration.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(13),
      checked_out_at: d(11, 8),
      returned_at: d(10, 15),
      qr_token: 'CS-QR-BK36-HIST'
    },
    {
      id: 37,
      resource_id: 3,
      user_id: 1,
      start_at: d(27, 9),
      end_at: d(25, 17),
      purpose: 'Digital Signal Processing hardware accelerator synthesis.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(29),
      checked_out_at: d(27, 9),
      returned_at: d(25, 16),
      qr_token: 'CS-QR-BK37-HIST'
    },
    {
      id: 38,
      resource_id: 12,
      user_id: 6,
      start_at: d(21, 10),
      end_at: d(19, 18),
      purpose: 'Embedded systems RTOS kernel benchmark testing.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(23),
      checked_out_at: d(21, 10),
      returned_at: d(19, 17),
      qr_token: 'CS-QR-BK38-HIST'
    },
    {
      id: 39,
      resource_id: 7,
      user_id: 2,
      start_at: d(6, 12),
      end_at: d(5, 18),
      purpose: 'Engineering symposium keynote speech audio capture.',
      status: 'returned',
      decision_reason: 'Approved.',
      created_at: d(8),
      checked_out_at: d(6, 12),
      returned_at: d(5, 17),
      qr_token: 'CS-QR-BK39-HIST'
    }
  ];

  // Condition reports for bookings
  const conditionReports = [
    // Marcus Vance Booking #1 (Overdue) - Before report logged
    {
      id: 1,
      booking_id: 1,
      reporter_id: 8,
      stage: 'before',
      condition: 'good',
      notes: 'Oscilloscope powered on clean; both probe cables in good shape.',
      created_at: d(4, 9)
    },
    // Maya Chen Booking #2 - Before report logged (ready for checkout demo!)
    {
      id: 2,
      booking_id: 2,
      reporter_id: 1,
      stage: 'before',
      condition: 'good',
      notes: 'Cinema rig checked. Sensor clear, both batteries at 100%.',
      created_at: d(0, 2)
    },
    // Marcus Vance Booking #30 - Damaged report leading to Incident #1
    {
      id: 3,
      booking_id: 30,
      reporter_id: 101, // Owner reported on return
      stage: 'after',
      condition: 'damaged',
      notes: 'PEI magnetic build plate deeply gouged by nozzle due to incorrect z-offset override.',
      created_at: d(42, 16)
    },
    // Liam Patel Booking #20 - Minor issue report
    {
      id: 4,
      booking_id: 20,
      reporter_id: 2,
      stage: 'after',
      condition: 'minor_issue',
      notes: 'Lavalier wire outer insulation has slight fray near 3.5mm plug; still functional.',
      created_at: d(37, 17)
    }
  ];

  // Incidents: Human-reviewed governance demonstration
  const incidents = [
    {
      id: 1,
      booking_id: 30,
      reporter_id: 101, // Dr. Miller
      incident_type: 'damage',
      description: 'PEI build plate scraped and ruined on Bambu X1 printer.',
      status: 'resolved',
      resolution: 'Human Review Meeting with Marcus Vance: Student admitted error and agreed to assist lab tech with nozzle calibration workshop. No monetary fine levied per educational policy. Plate replaced from lab consumable budget.',
      created_at: d(42, 16)
    },
    {
      id: 2,
      booking_id: 1, // Open incident for overdue oscilloscope!
      reporter_id: 101, // Dr. Miller
      incident_type: 'delay',
      description: 'Digital Storage Oscilloscope is past scheduled return date and required for B204 lab session.',
      status: 'open',
      resolution: '',
      created_at: d(0, 12)
    },
    {
      id: 3,
      booking_id: 20,
      reporter_id: 102, // Sarah Jenkins
      incident_type: 'damage',
      description: 'Frayed lavalier cable reported on Rode Wireless kit.',
      status: 'open',
      resolution: '',
      created_at: d(37, 18)
    }
  ];

  // Audit Events: complete immutable history trail
  const auditEvents = [
    {
      id: 1,
      actor_id: 201,
      action: 'system_initialized',
      entity_type: 'system',
      entity_id: 1,
      details: 'CampusShare equipment accountability system seeded with 15 resources.',
      created_at: d(60)
    },
    {
      id: 2,
      actor_id: 101,
      action: 'resource_listed',
      entity_type: 'resource',
      entity_id: 1,
      details: 'Listed Digital Storage Oscilloscope 100MHz with training gate.',
      created_at: d(60)
    },
    {
      id: 3,
      actor_id: 8,
      action: 'booking_requested',
      entity_type: 'booking',
      entity_id: 1,
      details: 'Requested Digital Storage Oscilloscope 100MHz.',
      created_at: d(5, 10)
    },
    {
      id: 4,
      actor_id: 101,
      action: 'booking_approved',
      entity_type: 'booking',
      entity_id: 1,
      details: 'Approved request for senior design RF test bench.',
      created_at: d(4, 8)
    },
    {
      id: 5,
      actor_id: 8,
      action: 'condition_before_recorded',
      entity_type: 'booking',
      entity_id: 1,
      details: 'Initial condition: good.',
      created_at: d(4, 9)
    },
    {
      id: 6,
      actor_id: 101,
      action: 'resource_checked_out',
      entity_type: 'booking',
      entity_id: 1,
      details: 'Handover confirmed via physical equipment desk.',
      created_at: d(4, 9)
    },
    {
      id: 7,
      actor_id: 101,
      action: 'incident_opened',
      entity_type: 'incident',
      entity_id: 2,
      details: 'Delay flagged: Equipment overdue by 24h+.',
      created_at: d(0, 12)
    },
    {
      id: 8,
      actor_id: 1,
      action: 'booking_requested',
      entity_type: 'booking',
      entity_id: 2,
      details: 'Requested Sony Alpha A7 IV Cinema Rig.',
      created_at: d(1, 8)
    },
    {
      id: 9,
      actor_id: 102,
      action: 'booking_approved',
      entity_type: 'booking',
      entity_id: 2,
      details: 'Approved for robotics showcase video.',
      created_at: d(1, 9)
    },
    {
      id: 10,
      actor_id: 5,
      action: 'booking_waitlisted',
      entity_type: 'booking',
      entity_id: 3,
      details: 'Conflict detected with Booking #2; automatically placed in waitlist queue.',
      created_at: d(1, 11)
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
