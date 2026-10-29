/**
 * UniHive Pure Business Rules Engine
 * Zero DOM dependencies; strictly functional and testable.
 */

export const BOOKING_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  CHECKED_OUT: 'checked_out',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  ALLOTTED: 'allotted' // Exclusively granted by Admin
};

export const ROLES = {
  STUDENT: 'student',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
  OWNER: 'volunteer' // Backwards compatibility with legacy fixtures
};

export const CATEGORY_CO2_SAVINGS_KG = {
  'Microcontrollers': 12,
  'Power & Batteries': 18,
  'Prototyping & Coils': 10,
  '3D Printing': 35,
  'Sensors & Actuators': 8,
  'Test & Tools': 25,
  'Electronics': 15,
  'Default': 10
};

/**
 * Checks if actor has permission to add or remove catalog components
 * (Both Admins and Council Volunteers have this permission)
 */
export function canManageComponents(actor) {
  if (!actor) return false;
  return actor.role === ROLES.ADMIN || actor.role === ROLES.VOLUNTEER || actor.role === 'owner';
}

/**
 * Checks if actor has permission to allot components directly to students
 * (EXCLUSIVELY restricted to Administrator)
 */
export function canAllotComponents(actor) {
  if (!actor) return false;
  return actor.role === ROLES.ADMIN;
}

/**
 * Checks if a booking is currently overdue.
 */
export function isOverdue(booking, now = new Date()) {
  if (!booking || (booking.status !== BOOKING_STATUSES.CHECKED_OUT && booking.status !== BOOKING_STATUSES.ALLOTTED)) {
    return false;
  }
  const nowDate = new Date(now).getTime();
  const endDate = new Date(booking.end_at).getTime();
  return nowDate > endDate;
}

/**
 * Checks if two date ranges overlap.
 */
export function isOverlapping(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return sA < eB && eA > sB;
}

/**
 * Finds any active approved, checked-out, or allotted booking overlapping the requested slot.
 */
export function findOverlappingBooking(resourceId, startAt, endAt, bookings = [], excludeBookingId = null) {
  return bookings.find(b => {
    if (b.resource_id !== resourceId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status !== BOOKING_STATUSES.APPROVED && b.status !== BOOKING_STATUSES.CHECKED_OUT && b.status !== BOOKING_STATUSES.ALLOTTED) return false;
    return isOverlapping(startAt, endAt, b.start_at, b.end_at);
  }) || null;
}

/**
 * Checks whether a user can make a request for a component.
 */
export function validateBookingRequest(user, resource, userActiveBookingsCount, startAt, endAt, purpose, now = new Date()) {
  if (!user) {
    return { valid: false, error: 'User must be signed in to request components.' };
  }
  if (!resource || !resource.active) {
    return { valid: false, error: 'Component is currently not in service or has been decommissioned.' };
  }
  if (!purpose || !purpose.trim()) {
    return { valid: false, error: 'A project purpose or course requirement description is required.' };
  }
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  const nowDate = new Date(now);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid start or end date.' };
  }
  if (startDate.getTime() <= nowDate.getTime()) {
    return { valid: false, error: 'Start time must be in the future.' };
  }
  if (endDate.getTime() <= startDate.getTime()) {
    return { valid: false, error: 'End time must be after start time.' };
  }

  // Fair use check: at most 4 active or pending bookings
  if (userActiveBookingsCount >= 4) {
    return {
      valid: false,
      error: 'Fair-use allocation limit reached: you may have at most four active or pending requests simultaneously.'
    };
  }

  // Training gate check
  if (resource.training_required) {
    const trained = isUserTrainedForCategory(user, resource.category);
    if (!trained) {
      return {
        valid: false,
        error: `This component requires verified lab certification for ${resource.category}.`
      };
    }
  }

  return { valid: true };
}

/**
 * Helper to check training eligibility.
 */
export function isUserTrainedForCategory(user, category) {
  if (!user || !user.trained_categories) return false;
  const categories = Array.isArray(user.trained_categories)
    ? user.trained_categories
    : String(user.trained_categories).split(',').map(c => c.trim().toLowerCase());
  return categories.includes(String(category).trim().toLowerCase());
}

/**
 * Determines whether a new booking becomes 'pending' or 'waitlisted'.
 */
export function determineInitialBookingStatus(resourceId, startAt, endAt, existingBookings = []) {
  const overlap = findOverlappingBooking(resourceId, startAt, endAt, existingBookings);
  return overlap ? BOOKING_STATUSES.WAITLISTED : BOOKING_STATUSES.PENDING;
}

/**
 * Permission check for booking management.
 */
export function canDecideBooking(actor, booking, resource) {
  if (!actor || !booking) return false;
  if (actor.role === ROLES.ADMIN) return true;
  if (actor.role === ROLES.VOLUNTEER || actor.role === 'owner') return true;
  return false;
}

/**
 * Pure state machine transition for deciding a booking.
 */
export function decideBooking(booking, decision, reason, resourceBookings = []) {
  if (booking.status !== BOOKING_STATUSES.PENDING && booking.status !== BOOKING_STATUSES.WAITLISTED) {
    return { success: false, error: 'Only pending or waitlisted requests can receive a decision.' };
  }
  if (decision !== BOOKING_STATUSES.APPROVED && decision !== BOOKING_STATUSES.REJECTED) {
    return { success: false, error: 'Decision must be approved or rejected.' };
  }

  if (decision === BOOKING_STATUSES.APPROVED) {
    const overlap = findOverlappingBooking(booking.resource_id, booking.start_at, booking.end_at, resourceBookings, booking.id);
    if (overlap) {
      return {
        success: false,
        waitlisted: true,
        status: BOOKING_STATUSES.WAITLISTED,
        reason: 'Another booking overlaps this time slot; placed in waitlist queue.'
      };
    }
    return {
      success: true,
      status: BOOKING_STATUSES.APPROVED,
      decision_reason: reason || 'Approved by council volunteer.'
    };
  }

  return {
    success: true,
    status: BOOKING_STATUSES.REJECTED,
    decision_reason: reason || 'Not approved by council review.'
  };
}

/**
 * Can a user cancel their booking?
 */
export function canCancelBooking(actor, booking) {
  if (!actor || !booking) return false;
  const isRequester = actor.id === booking.user_id;
  const isAdmin = actor.role === ROLES.ADMIN;
  const isVolunteer = actor.role === ROLES.VOLUNTEER || actor.role === 'owner';
  const cancellable = [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.WAITLISTED, BOOKING_STATUSES.APPROVED];
  return (isRequester || isAdmin || isVolunteer) && cancellable.includes(booking.status);
}

/**
 * Finds the oldest compatible waitlisted request eligible for auto-promotion.
 */
export function findWaitlistCandidateForPromotion(resourceId, allBookings = [], ignoreBookingId = null) {
  const activeBookings = allBookings.filter(b => 
    b.resource_id === resourceId &&
    b.id !== ignoreBookingId &&
    (b.status === BOOKING_STATUSES.APPROVED || b.status === BOOKING_STATUSES.CHECKED_OUT || b.status === BOOKING_STATUSES.ALLOTTED)
  );

  const waitlisted = allBookings
    .filter(b => b.resource_id === resourceId && b.id !== ignoreBookingId && b.status === BOOKING_STATUSES.WAITLISTED)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const candidate of waitlisted) {
    const hasConflict = activeBookings.some(ab => isOverlapping(candidate.start_at, candidate.end_at, ab.start_at, ab.end_at));
    if (!hasConflict) {
      return candidate;
    }
  }
  return null;
}

/**
 * Checks condition report eligibility.
 */
export function canAddConditionReport(actor, booking, stage, resource) {
  if (!actor || !booking) return false;
  const isRequester = actor.id === booking.user_id;
  const isStaff = actor.role === ROLES.ADMIN || actor.role === ROLES.VOLUNTEER || actor.role === 'owner';
  if (!isRequester && !isStaff) return false;

  if (stage === 'before') {
    return booking.status === BOOKING_STATUSES.APPROVED || booking.status === BOOKING_STATUSES.ALLOTTED;
  }
  if (stage === 'after') {
    return booking.status === BOOKING_STATUSES.CHECKED_OUT;
  }
  return false;
}

/**
 * Handover: Can check out?
 */
export function canCheckout(actor, booking, conditionReports = [], resource) {
  if (!canDecideBooking(actor, booking, resource)) return false;
  if (booking.status !== BOOKING_STATUSES.APPROVED && booking.status !== BOOKING_STATUSES.ALLOTTED) return false;
  const hasBeforeReport = conditionReports.some(r => r.booking_id === booking.id && r.stage === 'before');
  return hasBeforeReport;
}

/**
 * Handover: Can confirm return?
 */
export function canReturn(actor, booking, conditionReports = [], resource) {
  if (!canDecideBooking(actor, booking, resource)) return false;
  if (booking.status !== BOOKING_STATUSES.CHECKED_OUT) return false;
  const hasAfterReport = conditionReports.some(r => r.booking_id === booking.id && r.stage === 'after');
  return hasAfterReport;
}

/**
 * Can report an incident?
 */
export function canReportIncident(actor, booking, resource) {
  if (!actor || !booking) return false;
  const isRequester = actor.id === booking.user_id;
  const isStaff = actor.role === ROLES.ADMIN || actor.role === ROLES.VOLUNTEER || actor.role === 'owner';
  return isRequester || isStaff;
}

/**
 * Can resolve an incident?
 */
export function canResolveIncident(actor, incident, booking, resource) {
  if (!actor || !incident || incident.status !== 'open') return false;
  return actor.role === ROLES.ADMIN || actor.role === ROLES.VOLUNTEER || actor.role === 'owner';
}

/**
 * Trust Score Calculation
 */
export function calculateTrustScore(studentId, userBookings = [], userIncidents = [], conditionReports = []) {
  let score = 25; // Default starter baseline
  const breakdown = [];

  const studentBookings = userBookings.filter(b => b.user_id === studentId);
  const bookingIds = studentBookings.map(b => b.id);

  for (const b of studentBookings) {
    if (b.status === BOOKING_STATUSES.RETURNED) {
      const isLate = b.returned_at && new Date(b.returned_at) > new Date(b.end_at);
      const afterReport = conditionReports.find(r => r.booking_id === b.id && r.stage === 'after');
      const condition = afterReport ? afterReport.condition : 'good';

      if (isLate) {
        score -= 10;
        breakdown.push({ bookingId: b.id, change: -10, reason: 'Returned late' });
      } else if (condition === 'good') {
        score += 10;
        breakdown.push({ bookingId: b.id, change: +10, reason: 'On-time return in pristine condition' });
      } else if (condition === 'minor_issue') {
        score += 4;
        breakdown.push({ bookingId: b.id, change: +4, reason: 'On-time return with minor wear reported' });
      }
    } else if (isOverdue(b)) {
      score -= 15;
      breakdown.push({ bookingId: b.id, change: -15, reason: 'Currently overdue equipment' });
    }
  }

  // Damage penalty
  const confirmedDamageIncidents = userIncidents.filter(inc => 
    bookingIds.includes(inc.booking_id) &&
    inc.incident_type === 'damage' &&
    inc.status === 'resolved'
  );

  for (const inc of confirmedDamageIncidents) {
    score -= 20;
    breakdown.push({ incidentId: inc.id, change: -20, reason: `Resolved damage incident: ${inc.resolution || 'Damage confirmed'}` });
  }

  if (score < 0) score = 0;

  let level = 'Newcomer';
  let badgeClass = 'sticker-blue';
  if (score >= 100) {
    level = 'Campus Legend';
    badgeClass = 'sticker-lilac';
  } else if (score >= 50) {
    level = 'Trusted';
    badgeClass = 'sticker-mint';
  } else if (score >= 20) {
    level = 'Reliable';
    badgeClass = 'sticker-yellow';
  }

  return {
    score,
    level,
    badgeClass,
    breakdown
  };
}

/**
 * Impact calculation
 */
export function calculateImpactStats(resources = [], bookings = []) {
  const completedBookings = bookings.filter(b => b.status === BOOKING_STATUSES.RETURNED || b.status === BOOKING_STATUSES.CHECKED_OUT || b.status === BOOKING_STATUSES.ALLOTTED);
  const totalBookings = bookings.length;
  const uniqueItemsShared = new Set(completedBookings.map(b => b.resource_id)).size;

  let estimatedMoneySaved = 0;
  let estimatedCO2Kg = 0;
  let onTimeReturns = 0;
  let totalReturns = 0;

  const resourceUsageCount = {};

  for (const b of bookings) {
    resourceUsageCount[b.resource_id] = (resourceUsageCount[b.resource_id] || 0) + 1;

    const res = resources.find(r => r.id === b.resource_id);
    const cat = res ? res.category : 'Default';
    const repVal = res && res.replacement_value ? res.replacement_value : 250;

    if (b.status === BOOKING_STATUSES.RETURNED || b.status === BOOKING_STATUSES.CHECKED_OUT || b.status === BOOKING_STATUSES.ALLOTTED) {
      estimatedMoneySaved += Math.round(repVal * 0.18);
      estimatedCO2Kg += (CATEGORY_CO2_SAVINGS_KG[cat] || CATEGORY_CO2_SAVINGS_KG.Default);
    }

    if (b.status === BOOKING_STATUSES.RETURNED) {
      totalReturns++;
      if (b.returned_at && new Date(b.returned_at) <= new Date(b.end_at)) {
        onTimeReturns++;
      }
    }
  }

  const onTimeReturnRate = totalReturns > 0 ? Math.round((onTimeReturns / totalReturns) * 100) : 100;

  const topResources = resources
    .map(r => ({
      ...r,
      usageCount: resourceUsageCount[r.id] || 0
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  return {
    totalBookings,
    completedBookingsCount: completedBookings.length,
    uniqueItemsShared,
    estimatedMoneySaved,
    estimatedCO2Kg,
    onTimeReturnRate,
    topResources
  };
}
