/**
 * Backwards compatibility alias for Volunteer Ops
 */
import { renderVolunteer } from './volunteer.js';

export async function renderOwnerDashboard(params, container) {
  return renderVolunteer(params, container);
}
