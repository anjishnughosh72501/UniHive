/**
 * UniHive Data Access Layer
 * Persistent storage with LocalStorage & in-memory fallback
 * Version 3: UniHive Rebrand & Direct Admin Allotments
 */

import { getInitialSeedData } from './seed.js';
import * as Rules from './rules.js';

const STORAGE_KEY = 'unihive_db_v6';
const CURRENT_USER_KEY = 'unihive_current_user_id';
const SESSION_USER_KEY = 'unihive_session_user_id';
const SCHEMA_VERSION = 6;

let inMemoryDb = null;
let currentUserId = null;

function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function loadFromStorage() {
  if (isLocalStorageAvailable()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion === SCHEMA_VERSION) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading from localStorage; using initial seed.', e);
    }
  }
  return null;
}

function saveToStorage(data) {
  inMemoryDb = data;
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed saving to localStorage; in-memory fallback active.', e);
    }
  }
}

export async function initStore() {
  let data = loadFromStorage();
  if (!data) {
    data = getInitialSeedData();
    saveToStorage(data);
  } else {
    inMemoryDb = data;
  }

  // Check session token
  try {
    const sessionUserId = localStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (sessionUserId && inMemoryDb.users.some(u => u.id === Number(sessionUserId))) {
      currentUserId = Number(sessionUserId);
    } else {
      currentUserId = null;
    }
  } catch (e) {
    currentUserId = null;
  }

  return inMemoryDb;
}

export async function resetStore() {
  const fresh = getInitialSeedData();
  saveToStorage(fresh);
  return fresh;
}

export async function getCurrentUser() {
  if (!inMemoryDb) await initStore();
  const sessionUserId = localStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
  if (sessionUserId) {
    const user = inMemoryDb.users.find(u => u.id === Number(sessionUserId));
    if (user) return { ...user };
  }
  if (currentUserId) {
    const user = inMemoryDb.users.find(u => u.id === currentUserId);
    if (user) return { ...user };
  }
  return null;
}

export async function setCurrentUser(userId) {
  if (!inMemoryDb) await initStore();
  if (!userId) {
    currentUserId = null;
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    }
    return null;
  }
  const idNum = Number(userId);
  const user = inMemoryDb.users.find(u => u.id === idNum);
  if (!user) throw new Error(`User id ${userId} not found`);
  currentUserId = idNum;
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, String(idNum));
      localStorage.setItem(SESSION_USER_KEY, String(idNum));
    } catch (e) {}
  }
  return { ...user };
}

export async function listUsers() {
  if (!inMemoryDb) await initStore();
  return inMemoryDb.users.map(u => ({ ...u }));
}

export async function getUserById(id) {
  if (!inMemoryDb) await initStore();
  const user = inMemoryDb.users.find(u => u.id === Number(id));
  return user ? { ...user } : null;
}

export async function createUser(userData) {
  if (!inMemoryDb) await initStore();
  const newId = inMemoryDb.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const newUser = {
    id: newId,
    name: userData.name,
    email: userData.email,
    password_hash: userData.password_hash || '',
    password: userData.password || '',
    role: userData.role || 'student',
    department: userData.department || 'General Engineering',
    student_id: userData.student_id || `CS-${newId}`,
    trained_categories: userData.trained_categories || 'Microcontrollers,Electronics',
    created_at: new Date().toISOString()
  };
  inMemoryDb.users.push(newUser);
  saveToStorage(inMemoryDb);
  return { ...newUser };
}

export async function updateUser(id, updates) {
  if (!inMemoryDb) await initStore();
  const idx = inMemoryDb.users.findIndex(u => u.id === Number(id));
  if (idx === -1) throw new Error(`User ${id} not found`);
  inMemoryDb.users[idx] = { ...inMemoryDb.users[idx], ...updates };
  saveToStorage(inMemoryDb);
  return { ...inMemoryDb.users[idx] };
}

// ----------------- COMPONENTS / RESOURCES -----------------

export async function listResources(filter = {}) {
  if (!inMemoryDb) await initStore();
  let list = inMemoryDb.resources.map(r => ({ ...r }));

  if (filter.active !== undefined) {
    list = list.filter(r => r.active === filter.active);
  } else {
    list = list.filter(r => r.active !== false);
  }

  if (filter.category) {
    list = list.filter(r => r.category.toLowerCase() === filter.category.toLowerCase());
  }

  if (filter.ownerId) {
    list = list.filter(r => r.owner_id === Number(filter.ownerId));
  }

  if (filter.query) {
    const q = filter.query.toLowerCase().trim();
    list = list.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      (r.component_code && r.component_code.toLowerCase().includes(q)) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return list;
}

export async function getResourceById(id) {
  if (!inMemoryDb) await initStore();
  const item = inMemoryDb.resources.find(r => r.id === Number(id));
  return item ? { ...item } : null;
}

export async function createResource(resourceData) {
  if (!inMemoryDb) await initStore();
  const newId = inMemoryDb.resources.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const quantity = Number(resourceData.quantity_total) || 1;
  const newResource = {
    id: newId,
    active: true,
    component_code: resourceData.component_code || `CS-HW-${String(newId).padStart(2, '0')}`,
    quantity_total: quantity,
    quantity_available: quantity,
    auto_approve_trusted: Boolean(resourceData.auto_approve_trusted),
    tags: Array.isArray(resourceData.tags) ? resourceData.tags : (resourceData.tags ? resourceData.tags.split(',').map(t => t.trim()) : []),
    ...resourceData
  };
  inMemoryDb.resources.push(newResource);
  await recordAuditEvent(resourceData.owner_id, 'component_added', 'resource', newId, `Added component: ${newResource.name} (${newResource.component_code})`);
  saveToStorage(inMemoryDb);
  return { ...newResource };
}

export async function updateResource(id, updates) {
  if (!inMemoryDb) await initStore();
  const idx = inMemoryDb.resources.findIndex(r => r.id === Number(id));
  if (idx === -1) throw new Error(`Component ${id} not found`);
  inMemoryDb.resources[idx] = { ...inMemoryDb.resources[idx], ...updates };
  saveToStorage(inMemoryDb);
  return { ...inMemoryDb.resources[idx] };
}

export async function deleteResource(id, actorId) {
  if (!inMemoryDb) await initStore();
  const idx = inMemoryDb.resources.findIndex(r => r.id === Number(id));
  if (idx === -1) throw new Error(`Component ${id} not found`);
  const comp = inMemoryDb.resources[idx];
  inMemoryDb.resources.splice(idx, 1);
  await recordAuditEvent(actorId, 'component_removed', 'resource', id, `Removed component: ${comp.name} (${comp.component_code || ''})`);
  saveToStorage(inMemoryDb);
  return true;
}

// ----------------- ADMIN ALLOTMENT & BOOKINGS -----------------

export async function listBookings(filter = {}) {
  if (!inMemoryDb) await initStore();
  let list = inMemoryDb.bookings.map(b => ({ ...b }));

  if (filter.userId) {
    list = list.filter(b => b.user_id === Number(filter.userId));
  }
  if (filter.resourceId) {
    list = list.filter(b => b.resource_id === Number(filter.resourceId));
  }
  if (filter.status) {
    list = list.filter(b => b.status === filter.status);
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return list;
}

export async function getBookingById(id) {
  if (!inMemoryDb) await initStore();
  const item = inMemoryDb.bookings.find(b => b.id === Number(id));
  return item ? { ...item } : null;
}

export async function getBookingByQrToken(token) {
  if (!inMemoryDb) await initStore();
  const clean = String(token).trim().toUpperCase();
  const item = inMemoryDb.bookings.find(b => b.qr_token && b.qr_token.toUpperCase() === clean);
  return item ? { ...item } : null;
}

/**
 * Standard Student Request Flow
 */
export async function createBooking({ resource_id, user_id, start_at, end_at, purpose }) {
  if (!inMemoryDb) await initStore();
  const user = await getUserById(user_id);
  const resource = await getResourceById(resource_id);

  const userActiveCount = inMemoryDb.bookings.filter(b => 
    b.user_id === Number(user_id) &&
    [Rules.BOOKING_STATUSES.PENDING, Rules.BOOKING_STATUSES.APPROVED, Rules.BOOKING_STATUSES.CHECKED_OUT, Rules.BOOKING_STATUSES.WAITLISTED, Rules.BOOKING_STATUSES.ALLOTTED].includes(b.status)
  ).length;

  const validation = Rules.validateBookingRequest(user, resource, userActiveCount, start_at, end_at, purpose);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let initialStatus = Rules.determineInitialBookingStatus(resource.id, start_at, end_at, inMemoryDb.bookings);
  const newId = inMemoryDb.bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;
  const qrToken = `CS-QR-BK${newId}-${Math.floor(1000 + Math.random() * 9000)}`;

  let decisionReason = '';
  if (initialStatus === Rules.BOOKING_STATUSES.WAITLISTED) {
    decisionReason = 'Time conflict with existing booking; queued in waitlist.';
  }

  const newBooking = {
    id: newId,
    resource_id: Number(resource_id),
    user_id: Number(user_id),
    start_at: new Date(start_at).toISOString(),
    end_at: new Date(end_at).toISOString(),
    purpose: purpose.trim(),
    status: initialStatus,
    decision_reason: decisionReason,
    allotted_by: null,
    created_at: new Date().toISOString(),
    checked_out_at: null,
    returned_at: null,
    qr_token: qrToken
  };

  inMemoryDb.bookings.push(newBooking);

  await recordAuditEvent(user.id, 'booking_requested', 'booking', newId, `Requested ${resource.name}`);
  saveToStorage(inMemoryDb);
  return { ...newBooking };
}

/**
 * Exclusive Admin Allotment Flow
 * Admin can directly allot components to students, immediately activating custody
 */
export async function allotComponentToStudent({ resource_id, student_id, admin_id, start_at, end_at, purpose, quantity = 1 }) {
  if (!inMemoryDb) await initStore();
  const admin = await getUserById(admin_id);
  if (!admin || !Rules.canAllotComponents(admin)) {
    throw new Error('Unauthorized: Only Administrators have the authority to allot components directly to students.');
  }

  const student = await getUserById(student_id);
  if (!student) throw new Error('Student account not found.');

  const resource = await getResourceById(resource_id);
  if (!resource || !resource.active) {
    throw new Error('Component is currently inactive or not available for allotment.');
  }

  const newId = inMemoryDb.bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;
  const qrToken = `CS-ALLOT-${student.student_id || student.id}-${Math.floor(1000 + Math.random() * 9000)}`;

  const startDate = start_at ? new Date(start_at).toISOString() : new Date().toISOString();
  const endDate = end_at ? new Date(end_at).toISOString() : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const newBooking = {
    id: newId,
    resource_id: Number(resource_id),
    user_id: Number(student_id),
    start_at: startDate,
    end_at: endDate,
    purpose: purpose ? purpose.trim() : 'Administrative project allotment',
    status: Rules.BOOKING_STATUSES.ALLOTTED,
    decision_reason: `Allotted directly by Administrator ${admin.name}`,
    allotted_by: Number(admin_id),
    created_at: new Date().toISOString(),
    checked_out_at: new Date().toISOString(),
    returned_at: null,
    qr_token: qrToken,
    quantity: Number(quantity) || 1
  };

  inMemoryDb.bookings.push(newBooking);

  if (resource.quantity_available !== undefined && resource.quantity_available > 0) {
    resource.quantity_available = Math.max(0, resource.quantity_available - (Number(quantity) || 1));
  }

  await recordAuditEvent(admin_id, 'admin_allotment', 'booking', newId, `Allotted ${resource.name} to ${student.name} (${student.email})`);
  saveToStorage(inMemoryDb);
  return { ...newBooking };
}

export async function decideBooking(bookingId, decision, reason, actorId) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(bookingId));
  if (!booking) throw new Error('Booking not found');
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);
  const actor = inMemoryDb.users.find(u => u.id === Number(actorId));

  if (!Rules.canDecideBooking(actor, booking, resource)) {
    throw new Error('You do not have permission to decide this booking.');
  }

  const result = Rules.decideBooking(booking, decision, reason, inMemoryDb.bookings);
  if (!result.success) {
    if (result.waitlisted) {
      booking.status = Rules.BOOKING_STATUSES.WAITLISTED;
      booking.decision_reason = result.reason;
      await recordAuditEvent(actorId, 'booking_waitlisted', 'booking', booking.id, result.reason);
      saveToStorage(inMemoryDb);
      return { ...booking, waitlisted: true, message: result.reason };
    }
    throw new Error(result.error);
  }

  booking.status = result.status;
  booking.decision_reason = result.decision_reason;
  await recordAuditEvent(actorId, `booking_${decision}`, 'booking', booking.id, result.decision_reason);

  let promoted = null;
  if (decision === Rules.BOOKING_STATUSES.REJECTED) {
    promoted = await tryPromoteWaitlist(booking.resource_id, actorId);
  }

  saveToStorage(inMemoryDb);
  return { ...booking, promoted };
}

export async function cancelBooking(bookingId, actorId) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(bookingId));
  if (!booking) throw new Error('Booking not found');
  const actor = inMemoryDb.users.find(u => u.id === Number(actorId));

  if (!Rules.canCancelBooking(actor, booking)) {
    throw new Error('You cannot cancel this booking.');
  }

  booking.status = Rules.BOOKING_STATUSES.CANCELLED;
  booking.decision_reason = 'Cancelled by user or administrator.';
  await recordAuditEvent(actorId, 'booking_cancelled', 'booking', booking.id, 'Booking cancelled.');

  const promoted = await tryPromoteWaitlist(booking.resource_id, actorId);
  saveToStorage(inMemoryDb);
  return { ...booking, promoted };
}

async function tryPromoteWaitlist(resourceId, actorId) {
  const candidate = Rules.findWaitlistCandidateForPromotion(resourceId, inMemoryDb.bookings);
  if (candidate) {
    candidate.status = Rules.BOOKING_STATUSES.PENDING;
    candidate.decision_reason = 'Auto-promoted from waitlist following slot release.';
    await recordAuditEvent(actorId || 0, 'waitlist_promoted', 'booking', candidate.id, 'Promoted from waitlist to pending queue.');
    return { ...candidate };
  }
  return null;
}

// ----------------- CONDITION REPORTS & HANDOVER -----------------

export async function addConditionReport({ booking_id, reporter_id, stage, condition, notes = '', photoUrls = [] }) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(booking_id));
  if (!booking) throw new Error('Booking not found');
  const reporter = inMemoryDb.users.find(u => u.id === Number(reporter_id));
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);

  if (!Rules.canAddConditionReport(reporter, booking, stage, resource)) {
    throw new Error(`Cannot submit ${stage} condition report in current status (${booking.status}).`);
  }

  const newId = inMemoryDb.conditionReports.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const newReport = {
    id: newId,
    booking_id: Number(booking_id),
    reporter_id: Number(reporter_id),
    stage,
    condition,
    notes: notes.trim(),
    photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
    created_at: new Date().toISOString()
  };

  inMemoryDb.conditionReports.push(newReport);
  await recordAuditEvent(reporter_id, `condition_${stage}_recorded`, 'booking', booking.id, `${condition}: ${notes}`);

  let incident = null;
  if (condition === 'damaged') {
    incident = await reportIncident({
      booking_id: booking.id,
      reporter_id,
      incident_type: 'damage',
      description: notes || `Damage reported during ${stage} condition check.`
    });
  }

  saveToStorage(inMemoryDb);
  return { report: { ...newReport }, incident };
}

export async function checkoutBooking(bookingId, actorId) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(bookingId));
  if (!booking) throw new Error('Booking not found');
  const actor = inMemoryDb.users.find(u => u.id === Number(actorId));
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);

  if (!Rules.canCheckout(actor, booking, inMemoryDb.conditionReports, resource)) {
    throw new Error('Cannot checkout: Initial condition report must be logged before physical release.');
  }

  booking.status = Rules.BOOKING_STATUSES.CHECKED_OUT;
  booking.checked_out_at = new Date().toISOString();
  await recordAuditEvent(actorId, 'resource_checked_out', 'booking', booking.id, 'Physical handover completed.');
  saveToStorage(inMemoryDb);
  return { ...booking };
}

export async function returnBooking(bookingId, actorId) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(bookingId));
  if (!booking) throw new Error('Booking not found');
  const actor = inMemoryDb.users.find(u => u.id === Number(actorId));
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);

  if (!Rules.canReturn(actor, booking, inMemoryDb.conditionReports, resource)) {
    throw new Error('Cannot complete return: Return condition inspection report must be logged first.');
  }

  booking.status = Rules.BOOKING_STATUSES.RETURNED;
  booking.returned_at = new Date().toISOString();
  
  if (resource && resource.quantity_available !== undefined) {
    resource.quantity_available = Math.min(resource.quantity_total || 10, resource.quantity_available + (booking.quantity || 1));
  }

  await recordAuditEvent(actorId, 'resource_returned', 'booking', booking.id, 'Return confirmed and recorded in audit log.');

  const promoted = await tryPromoteWaitlist(booking.resource_id, actorId);
  saveToStorage(inMemoryDb);
  return { ...booking, promoted };
}

// ----------------- INCIDENTS -----------------

export async function listIncidents(filter = {}) {
  if (!inMemoryDb) await initStore();
  let list = inMemoryDb.incidents.map(inc => ({ ...inc }));
  if (filter.status) {
    list = list.filter(i => i.status === filter.status);
  }
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return list;
}

export async function getIncidentById(id) {
  if (!inMemoryDb) await initStore();
  const inc = inMemoryDb.incidents.find(i => i.id === Number(id));
  return inc ? { ...inc } : null;
}

export async function reportIncident({ booking_id, reporter_id, incident_type, description }) {
  if (!inMemoryDb) await initStore();
  const booking = inMemoryDb.bookings.find(b => b.id === Number(booking_id));
  if (!booking) throw new Error('Booking not found');
  const reporter = inMemoryDb.users.find(u => u.id === Number(reporter_id));
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);

  if (!Rules.canReportIncident(reporter, booking, resource)) {
    throw new Error('You do not have permission to report an incident on this booking.');
  }

  const newId = inMemoryDb.incidents.reduce((max, i) => Math.max(max, i.id), 0) + 1;
  const newIncident = {
    id: newId,
    booking_id: Number(booking_id),
    reporter_id: Number(reporter_id),
    incident_type,
    description: description.trim(),
    status: 'open',
    resolution: '',
    created_at: new Date().toISOString()
  };

  inMemoryDb.incidents.push(newIncident);
  await recordAuditEvent(reporter_id, 'incident_opened', 'incident', newId, `${incident_type}: ${description.trim()}`);
  saveToStorage(inMemoryDb);
  return { ...newIncident };
}

export async function resolveIncident(incidentId, actorId, resolution) {
  if (!inMemoryDb) await initStore();
  const incident = inMemoryDb.incidents.find(i => i.id === Number(incidentId));
  if (!incident) throw new Error('Incident not found');
  const booking = inMemoryDb.bookings.find(b => b.id === incident.booking_id);
  const resource = inMemoryDb.resources.find(r => r.id === booking.resource_id);
  const actor = inMemoryDb.users.find(u => u.id === Number(actorId));

  if (!Rules.canResolveIncident(actor, incident, booking, resource)) {
    throw new Error('Only council volunteers or administrators can resolve an incident.');
  }

  if (!resolution || !resolution.trim()) {
    throw new Error('Resolution summary is required for human governance review.');
  }

  incident.status = 'resolved';
  incident.resolution = resolution.trim();
  await recordAuditEvent(actorId, 'incident_resolved', 'incident', incident.id, resolution.trim());
  saveToStorage(inMemoryDb);
  return { ...incident };
}

// ----------------- AUDIT EVENTS -----------------

export async function listAuditEvents(filter = {}) {
  if (!inMemoryDb) await initStore();
  let list = inMemoryDb.auditEvents.map(e => ({ ...e }));
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return list;
}

export async function recordAuditEvent(actorId, action, entityType, entityId, details = '') {
  if (!inMemoryDb) await initStore();
  const newId = inMemoryDb.auditEvents.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  const newEvent = {
    id: newId,
    actor_id: actorId ? Number(actorId) : null,
    action,
    entity_type: entityType,
    entity_id: Number(entityId),
    details: details ? details.trim() : '',
    created_at: new Date().toISOString()
  };
  inMemoryDb.auditEvents.push(newEvent);
  return newEvent;
}

export async function getConditionReports(bookingId = null) {
  if (!inMemoryDb) await initStore();
  if (bookingId) {
    return inMemoryDb.conditionReports.filter(c => c.booking_id === Number(bookingId));
  }
  return inMemoryDb.conditionReports.map(c => ({ ...c }));
}

// ----------------- CSV EXPORT -----------------

export async function exportAuditEventsCsv() {
  if (!inMemoryDb) await initStore();
  const headers = ['id', 'created_at', 'actor_id', 'action', 'entity_type', 'entity_id', 'details'];
  const rows = inMemoryDb.auditEvents.map(e => [
    e.id,
    e.created_at,
    e.actor_id || '',
    `"${(e.action || '').replace(/"/g, '""')}"`,
    e.entity_type,
    e.entity_id,
    `"${(e.details || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function exportBookingsCsv() {
  if (!inMemoryDb) await initStore();
  const headers = ['id', 'created_at', 'resource_id', 'user_id', 'start_at', 'end_at', 'status', 'decision_reason', 'purpose', 'allotted_by', 'qr_token'];
  const rows = inMemoryDb.bookings.map(b => [
    b.id,
    b.created_at,
    b.resource_id,
    b.user_id,
    b.start_at,
    b.end_at,
    b.status,
    `"${(b.decision_reason || '').replace(/"/g, '""')}"`,
    `"${(b.purpose || '').replace(/"/g, '""')}"`,
    b.allotted_by || '',
    b.qr_token || ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
