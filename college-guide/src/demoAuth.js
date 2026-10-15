const ACCOUNTS_KEY = 'collegeguide.demo.accounts.v1';
const REMEMBERED_SESSION_KEY = 'collegeguide.demo.remembered-session.v1';
const SESSION_KEY = 'collegeguide.demo.session.v1';
const PBKDF2_ITERATIONS = 150000;

function readAccounts() {
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];

  const accounts = JSON.parse(raw);
  if (!Array.isArray(accounts)) {
    throw new Error('The saved demo account data is invalid. Clear this site’s storage and register again.');
  }

  return accounts;
}

function toBase64(bytes) {
  return window.btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error('Secure password hashing is unavailable in this browser context. Open the app on localhost or HTTPS.');
  }

  const key = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(result);
}

function setSession(email, rememberMe) {
  window.localStorage.removeItem(REMEMBERED_SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  const key = rememberMe ? REMEMBERED_SESSION_KEY : SESSION_KEY;
  storage.setItem(key, email);
}

export function getDemoSession() {
  const email =
    window.localStorage.getItem(REMEMBERED_SESSION_KEY) ||
    window.sessionStorage.getItem(SESSION_KEY);
  if (!email) return null;

  const account = readAccounts().find((item) => item.email === email);
  if (!account) {
    window.localStorage.removeItem(REMEMBERED_SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  return { email: account.email, profile: account.profile };
}

export async function registerDemoAccount({ email, password, profile, rememberMe }) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with this email already exists. Log in or use a different email address.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);
  accounts.push({
    email: normalizedEmail,
    salt: toBase64(salt),
    passwordHash: toBase64(passwordHash),
    profile,
  });
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  setSession(normalizedEmail, rememberMe);
  return { email: normalizedEmail, profile };
}

export async function loginDemoAccount({ email, password, rememberMe }) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === normalizedEmail);
  if (!account) {
    throw new Error('No demo account was found for that email. Sign up first or check the address.');
  }

  const actualHash = await hashPassword(password, fromBase64(account.salt));
  const expectedHash = fromBase64(account.passwordHash);
  const matches =
    actualHash.length === expectedHash.length &&
    actualHash.reduce((difference, byte, index) => difference | (byte ^ expectedHash[index]), 0) === 0;
  if (!matches) throw new Error('The email or password is incorrect.');

  setSession(normalizedEmail, rememberMe);
  return { email: account.email, profile: account.profile };
}

export function updateDemoProfile(email, profile) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((item) => item.email === normalizedEmail);
  if (accountIndex === -1) {
    throw new Error('Your demo account could not be found. Please log in again before saving changes.');
  }

  accounts[accountIndex] = { ...accounts[accountIndex], profile };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function logoutDemoAccount() {
  window.localStorage.removeItem(REMEMBERED_SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}
