/**
 * CampusShare Data Access Layer
 * The ONLY module that touches persistent storage.
 * Designed with an asynchronous API to easily allow a Supabase/Postgres adapter replacement.
 */

import { getInitialSeedData } from './seed.js';
import * as Rules from './rules.js';

const STORAGE_KEY = 'campusshare_db_v1';
const CURRENT_USER_KEY = 'campusshare_current_user_id';
const SCHEMA_VERSION = 1;

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

  // Load active user or default to student Maya Chen (id: 1)
  try {
    const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUserId && inMemoryDb.users.some(u => u.id === Number(savedUserId))) {
      currentUserId = Number(savedUserId);
    } else {
      currentUserId = 1;
    }
  } catch (e) {
    currentUserId = 1;
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
  const user = inMemoryDb.users.find(u => u.id === currentUserId) || inMemoryDb.users[0];
  return { ...user };
}

export async function setCurrentUser(userId) {
  if (!inMemoryDb) await initStore();
  const idNum = Number(userId);
  const user = inMemoryDb.users.find(u => u.id === idNum);
  if (!user) throw new Error(`User id ${userId} not found`);
  currentUserId = idNum;
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, String(idNum));
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

export async function updateUser(id, updates) {
  if (!inMemoryDb) await initStore();
  const idx = inMemoryDb.users.findIndex(u => u.id === Number(id));
  if (idx === -1) throw new Error(`User ${id} not found`);
  inMemoryDb.users[idx] = { ...inMemoryDb.users[idx], ...updates };
  saveToStorage(inMemoryDb);
  return { ...inMemoryDb.users[idx] };
}

// ----------------- RESOURCES -----------------

export async function listResources(filter = {}) {
  if (!inMemoryDb) await initStore();
  let list = inMemoryDb.resources.map(r => ({ ...r }));

  if (filter.active !== undefined) {
    list = list.filter(r => r.active === filter.active);
  } else {
    // Default to active only unless specified
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
  const newResource = {
    id: newId,
    active: true,
    auto_approve_trusted: Boolean(resourceData.auto_approve_trusted),
    tags: Array.isArray(resourceData.tags) ? resourceData.tags : (resourceData.tags ? resourceData.tags.split(',').map(t => t.trim()) : []),
    ...resourceData
  };
  inMemoryDb.resources.push(newResource);
  await recordAuditEvent(resourceData.owner_id, 'resource_listed', 'resource', newId, `Listed new resource: ${newResource.name}`);
  saveToStorage(inMemoryDb);
  return { ...newResource };
}

export async function updateResource(id, updates) {
  if (!inMemoryDb) await initStore();
  const idx = inMemoryDb.resources.findIndex(r => r.id === Number(id));
  if (idx === -1) throw new Error(`Resource ${id} not found`);
  inMemoryDb.resources[idx] = { ...inMemoryDb.resources[idx], ...updates };
  saveToStorage(inMemoryDb);
  return { ...inMemoryDb.resources[idx] };
}

// ----------------- BOOKINGS -----------------

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

  // Sort descending by created_at by default
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

export async function createBooking({ resource_id, user_id, start_at, end_at, purpose }) {
  if (!inMemoryDb) await initStore();
  const user = await getUserById(user_id);
  const resource = await getResourceById(resource_id);

  // Active bookings count for fair use rule
  const userActiveCount = inMemoryDb.bookings.filter(b => 
    b.user_id === Number(user_id) &&
    [Rules.BOOKING_STATUSES.PENDING, Rules.BOOKING_STATUSES.APPROVED, Rules.BOOKING_STATUSES.CHECKED_OUT, Rules.BOOKING_STATUSES.WAITLISTED].includes(b.status)
  ).length;

  const validation = Rules.validateBookingRequest(user, resource, userActiveCount, start_at, end_at, purpose);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let initialStatus = Rules.determineInitialBookingStatus(resource.id, start_at, end_at, inMemoryDb.bookings);
  const newId = inMemoryDb.bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;
  const qrToken = `CS-QR-BK${newId}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Check auto-approval for Trusted students
  const userIncidents = inMemoryDb.incidents || [];
  const userReports = inMemoryDb.conditionReports || [];
  const trust = Rules.calculateTrustScore(user.id, inMemoryDb.bookings, userIncidents, userReports);
  const hasConflict = initialStatus === Rules.BOOKING_STATUSES.WAITLISTED;

  let decisionReason = '';
  if (hasConflict) {
    decisionReason = 'Time conflict with existing booking; queued in waitlist.';
  } else if (Rules.canAutoApprove(user, resource, trust, hasConflict)) {
    initialStatus = Rules.BOOKING_STATUSES.APPROVED;
    decisionReason = 'Instant auto-approval granted via Trusted Lender standing (Score >= 50).';
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
    created_at: new Date().toISOString(),
    checked_out_at: null,
    returned_at: null,
    qr_token: qrToken
  };

  inMemoryDb.bookings.push(newBooking);

  let eventAction = 'booking_requested';
  if (initialStatus === Rules.BOOKING_STATUSES.WAITLISTED) {
    eventAction = 'booking_waitlisted';
  } else if (initialStatus === Rules.BOOKING_STATUSES.APPROVED) {
    eventAction = 'booking_auto_approved';
  }

  await recordAuditEvent(user.id, eventAction, 'booking', newId, newBooking.decision_reason || `Requested ${resource.name}`);
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

  // If rejected, check if another waitlisted request can be auto-promoted!
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
  await recordAuditEvent(actorId, 'booking_cancelled', 'booking', booking.id, 'Booking cancelled by requester.');

  // Try auto-promoting waiting requests
  const promoted = await tryPromoteWaitlist(booking.resource_id, actorId);
  saveToStorage(inMemoryDb);
  return { ...booking, promoted };
}

async function tryPromoteWaitlist(resourceId, actorId) {
  const candidate = Rules.findWaitlistCandidateForPromotion(resourceId, inMemoryDb.bookings);
  if (candidate) {
    candidate.status = Rules.BOOKING_STATUSES.PENDING;
    candidate.decision_reason = 'Auto-promoted from waitlist following slot release. Ready for owner decision.';
    await recordAuditEvent(actorId || 0, 'waitlist_promoted', 'booking', candidate.id, 'Candidate promoted from waitlist to pending queue.');
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

  // Automatically open an Incident if damaged, requiring human review
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
    throw new Error('Cannot checkout: Ensure you are authorized and an initial (before) condition report has been logged.');
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
    throw new Error('Cannot complete return: Ensure you are authorized and a final (after) condition report has been logged.');
  }

  booking.status = Rules.BOOKING_STATUSES.RETURNED;
  booking.returned_at = new Date().toISOString();
  await recordAuditEvent(actorId, 'resource_returned', 'booking', booking.id, 'Return confirmed and recorded in audit log.');

  // Auto promote waitlist if applicable
  const promoted = await tryPromoteWaitlist(booking.resource_id, actorId);
  saveToStorage(inMemoryDb);
  return { ...booking, promoted };
}

// ----------------- INCIDENTS (HUMAN REVIEW) -----------------

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
    throw new Error('Only the resource owner or an administrator can resolve an incident.');
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

// ----------------- CSV EXPORT (GOVERNANCE) -----------------

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
  const headers = ['id', 'created_at', 'resource_id', 'user_id', 'start_at', 'end_at', 'status', 'decision_reason', 'purpose', 'qr_token'];
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
    b.qr_token || ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
