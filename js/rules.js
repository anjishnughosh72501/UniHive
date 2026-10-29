/**
 * CampusShare Pure Business Rules Engine
 * Zero DOM dependencies; strictly functional and testable.
 */

export const BOOKING_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  CHECKED_OUT: 'checked_out',
  RETURNED: 'returned',
  CANCELLED: 'cancelled'
};

export const ROLES = {
  STUDENT: 'student',
  OWNER: 'owner',
  ADMIN: 'admin'
};

export const CATEGORY_CO2_SAVINGS_KG = {
  'Lab Kits': 15,
  'Electronics': 15,
  'Cameras': 25,
  'Photography': 25,
  'Audio': 12,
  'Sports': 8,
  'Drones': 35,
  '3D Printers': 45,
  'Laptops': 60,
  'AV Equipment': 20,
  'Default': 10
};

/**
 * Checks if a booking is currently overdue.
 */
export function isOverdue(booking, now = new Date()) {
  if (!booking || booking.status !== BOOKING_STATUSES.CHECKED_OUT) {
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
 * Finds any active approved or checked-out booking overlapping the requested slot.
 */
export function findOverlappingBooking(resourceId, startAt, endAt, bookings = [], excludeBookingId = null) {
  return bookings.find(b => {
    if (b.resource_id !== resourceId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status !== BOOKING_STATUSES.APPROVED && b.status !== BOOKING_STATUSES.CHECKED_OUT) return false;
    return isOverlapping(startAt, endAt, b.start_at, b.end_at);
  }) || null;
}

/**
 * Checks whether a user can make a request for a resource.
 */
export function validateBookingRequest(user, resource, userActiveBookingsCount, startAt, endAt, purpose, now = new Date()) {
  if (!user) {
    return { valid: false, error: 'User must be signed in.' };
  }
  if (!resource || !resource.active) {
    return { valid: false, error: 'Resource is not available or has been archived.' };
  }
  if (!purpose || !purpose.trim()) {
    return { valid: false, error: 'A clear purpose for the booking is required.' };
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

  // Fair use check: at most 3 active or pending bookings
  if (userActiveBookingsCount >= 3) {
    return {
      valid: false,
      error: 'Fair-use limit reached: you may have at most three active or pending requests at a time.'
    };
  }

  // Training gate check
  if (resource.training_required) {
    const trained = isUserTrainedForCategory(user, resource.category);
    if (!trained) {
      return {
        valid: false,
        error: `This resource requires verified training for ${resource.category}. Your profile has not completed this certification.`
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
  return actor.role === ROLES.OWNER && resource && resource.owner_id === actor.id;
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
      decision_reason: reason || 'Approved by resource owner.'
    };
  }

  return {
    success: true,
    status: BOOKING_STATUSES.REJECTED,
    decision_reason: reason || 'Not approved by resource owner.'
  };
}

/**
 * Can a user cancel their booking?
 */
export function canCancelBooking(actor, booking) {
  if (!actor || !booking) return false;
  const isRequester = actor.id === booking.user_id;
  const isAdmin = actor.role === ROLES.ADMIN;
  const cancellable = [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.WAITLISTED, BOOKING_STATUSES.APPROVED];
  return (isRequester || isAdmin) && cancellable.includes(booking.status);
}

/**
 * Finds the oldest compatible waitlisted request eligible for auto-promotion.
 */
export function findWaitlistCandidateForPromotion(resourceId, allBookings = [], ignoreBookingId = null) {
  const activeBookings = allBookings.filter(b => 
    b.resource_id === resourceId &&
    b.id !== ignoreBookingId &&
    (b.status === BOOKING_STATUSES.APPROVED || b.status === BOOKING_STATUSES.CHECKED_OUT)
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
  const isManager = actor.role === ROLES.ADMIN || (actor.role === ROLES.OWNER && resource && resource.owner_id === actor.id);
  if (!isRequester && !isManager) return false;

  if (stage === 'before') {
    return booking.status === BOOKING_STATUSES.APPROVED;
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
  if (booking.status !== BOOKING_STATUSES.APPROVED) return false;
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
  const isManager = actor.role === ROLES.ADMIN || (actor.role === ROLES.OWNER && resource && resource.owner_id === actor.id);
  return isRequester || isManager;
}

/**
 * Can resolve an incident?
 */
export function canResolveIncident(actor, incident, booking, resource) {
  if (!actor || !incident || incident.status !== 'open') return false;
  return actor.role === ROLES.ADMIN || (actor.role === ROLES.OWNER && resource && resource.owner_id === actor.id);
}

/**
 * Trust Score Calculation
 * 
 * Rules:
 * +10 on-time return with good condition
 * +3  on-time return with minor issue
 * -10 late return (returned_at > end_at, or currently overdue)
 * -15 per human-resolved damage incident (never from unconfirmed open reports!)
 * 
 * Score Tiers:
 * 0 - 19:   Newcomer
 * 20 - 49:  Reliable
 * 50 - 99:  Trusted
 * 100+:     Campus Legend
 */
export function calculateTrustScore(studentId, userBookings = [], userIncidents = [], conditionReports = []) {
  let score = 0;
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
        score += 3;
        breakdown.push({ bookingId: b.id, change: +3, reason: 'On-time return with minor wear reported' });
      }
    } else if (isOverdue(b)) {
      score -= 10;
      breakdown.push({ bookingId: b.id, change: -10, reason: 'Currently overdue equipment' });
    }
  }

  // Damage penalty: ONLY applied when an incident is human-resolved confirming damage
  const confirmedDamageIncidents = userIncidents.filter(inc => 
    bookingIds.includes(inc.booking_id) &&
    inc.incident_type === 'damage' &&
    inc.status === 'resolved'
  );

  for (const inc of confirmedDamageIncidents) {
    score -= 15;
    breakdown.push({ incidentId: inc.id, change: -15, reason: `Resolved damage incident: ${inc.resolution || 'Damage confirmed'}` });
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
    breakdown,
    advisoryNotice: 'Trust scores are strictly advisory transparency metrics and never automatically bar or penalize users.'
  };
}

/**
 * Checks if a booking request qualifies for instant auto-approval.
 * Conditions:
 * 1. Resource permits auto-approval for trusted students (auto_approve_trusted === true)
 * 2. Resource does NOT require training (!resource.training_required)
 * 3. User trust score >= 50 (Trusted or Campus Legend)
 * 4. Slot has no conflicts
 */
export function canAutoApprove(user, resource, userTrustScore, hasConflict = false) {
  if (!user || !resource) return false;
  if (hasConflict) return false;
  if (!resource.auto_approve_trusted) return false;
  if (resource.training_required) return false;
  return userTrustScore && userTrustScore.score >= 50;
}

/**
 * Calculates impact stats for the Impact Dashboard
 */
export function calculateImpactStats(resources = [], bookings = []) {
  const completedBookings = bookings.filter(b => b.status === BOOKING_STATUSES.RETURNED || b.status === BOOKING_STATUSES.CHECKED_OUT);
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
    const repVal = res && res.replacement_value ? res.replacement_value : 350;

    if (b.status === BOOKING_STATUSES.RETURNED || b.status === BOOKING_STATUSES.CHECKED_OUT) {
      // Estimated savings: calculated based on equipment rental/purchase avoidance
      estimatedMoneySaved += Math.round(repVal * 0.15);
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
