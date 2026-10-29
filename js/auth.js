/**
 * UniHive Authentication & Security Module
 * Client-side cryptographic hashing with Web Crypto API (SHA-256)
 * Role-based authorization & session management
 */

import * as Store from './store.js';

const SESSION_TOKEN_KEY = 'unihive_session_user_id';

/**
 * SHA-256 Password Hasher with UniHive salt
 */
export async function hashPassword(plainTextPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainTextPassword + '_unihive_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if user is logged in
 */
export async function getSessionUser() {
  const userId = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!userId) return null;
  const user = await Store.getUserById(Number(userId));
  return user || null;
}

/**
 * Perform login
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  const users = await Store.listUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const inputHash = await hashPassword(password);
  
  if (user.password_hash !== inputHash && user.password !== password) {
    throw new Error('Invalid email or password.');
  }

  localStorage.setItem(SESSION_TOKEN_KEY, String(user.id));
  await Store.setCurrentUser(user.id);
  await Store.recordAuditEvent(user.id, 'user_login', 'user', user.id, `User logged in (${user.role})`);
  return user;
}

/**
 * Perform self signup (Students and Council Volunteers only)
 * Admin role is strictly preset and cannot be self-registered.
 */
export async function signup({ name, email, password, role, department = '', student_id = '' }) {
  if (!name || !name.trim()) {
    throw new Error('Full Name is required.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('A valid college email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  
  const allowedRoles = ['student', 'volunteer'];
  if (!allowedRoles.includes(role)) {
    throw new Error('Registration is only permitted for Students and Council Volunteers. Admin access is preset.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await Store.listUsers();
  const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    throw new Error('An account with this email address already exists.');
  }

  const password_hash = await hashPassword(password);

  const newUser = await Store.createUser({
    name: name.trim(),
    email: normalizedEmail,
    password_hash,
    password,
    role,
    department: department.trim() || 'General Engineering',
    student_id: student_id.trim() || `UH-${Math.floor(1000 + Math.random() * 9000)}`,
    trained_categories: role === 'volunteer' ? 'Electronics,Microcontrollers,Prototyping & Coils,Power & Batteries,3D Printing' : 'Microcontrollers,Electronics'
  });

  // Automatically authenticate upon successful registration
  localStorage.setItem(SESSION_TOKEN_KEY, String(newUser.id));
  await Store.setCurrentUser(newUser.id);
  await Store.recordAuditEvent(newUser.id, 'account_registered', 'user', newUser.id, `Self-registered as ${role}`);
  return newUser;
}

/**
 * Logout
 */
export async function logout() {
  const current = await getSessionUser();
  if (current) {
    try {
      await Store.recordAuditEvent(current.id, 'user_logout', 'user', current.id, 'User signed out');
    } catch (e) {}
  }
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem('unihive_session_user_id');
  localStorage.removeItem('unihive_current_user_id');
  await Store.setCurrentUser(null);
}

/**
 * Guard Helper
 */
export async function requireAuth(roles = []) {
  const user = await getSessionUser();
  if (!user) {
    return { authorized: false, reason: 'unauthenticated' };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { authorized: false, reason: 'unauthorized', user };
  }
  return { authorized: true, user };
}
