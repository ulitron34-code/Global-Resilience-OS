import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const AUTH_SECRET = process.env.AUTH_SECRET || 'global-resilience-local-demo-secret';
const revokedSessions = new Map();
const MAX_REVOKED_SESSIONS = 10_000;
const USERS = [
  createUser('admin@resilience.local', 'demo123', 'admin', 'Platform Admin'),
  createUser('analyst@resilience.local', 'demo123', 'risk_analyst', 'Risk Analyst'),
  createUser('viewer@resilience.local', 'demo123', 'viewer', 'Read Only Viewer'),
  createUser('tenant-a-admin@resilience.local', 'demo123', 'admin', 'Tenant A Admin', 'tenant-a-demo'),
  createUser('tenant-b-admin@resilience.local', 'demo123', 'admin', 'Tenant B Admin', 'tenant-b-demo'),
  createUser('tenant-a@resilience.local', 'demo123', 'risk_analyst', 'Tenant A Analyst', 'tenant-a-demo'),
  createUser('tenant-b@resilience.local', 'demo123', 'risk_analyst', 'Tenant B Analyst', 'tenant-b-demo'),
];

function createUser(email, password, role, name, organizationId = 'nashadi-demo') {
  return { id: email.split('@')[0], email, name, role, organizationId, passwordHash: hashPassword(password) };
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expected] = storedHash.split(':');
  const actual = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function sign(value) {
  return createHmac('sha256', AUTH_SECRET).update(value).digest('base64url');
}

function encodeToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function purgeRevokedSessions(now = Date.now()) {
  for (const [jti, expiresAt] of revokedSessions) {
    if (expiresAt <= now) revokedSessions.delete(jti);
  }
  while (revokedSessions.size > MAX_REVOKED_SESSIONS) {
    const oldest = revokedSessions.keys().next().value;
    if (!oldest) break;
    revokedSessions.delete(oldest);
  }
}

function decodeToken(token) {
  try {
    purgeRevokedSessions();
    const [body, signature] = String(token || '').split('.');
    if (!body || !signature) return null;
    const expected = Buffer.from(sign(body));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    const revokedUntil = revokedSessions.get(payload.jti);
    if (revokedUntil && revokedUntil > Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function login(email, password) {
  if (process.env.APP_MODE === 'production') return null;
  const user = USERS.find((candidate) => candidate.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  const payload = { sub: user.id, jti: randomBytes(16).toString('hex'), email: user.email, name: user.name, role: user.role, organizationId: user.organizationId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  return { token: encodeToken(payload), user: publicUser(user), expiresIn: TOKEN_TTL_SECONDS };
}

export function readToken(token) { return decodeToken(token); }
export function revokeToken(token) {
  const payload = decodeToken(token);
  if (!payload?.jti) return false;
  revokedSessions.set(payload.jti, payload.exp * 1000);
  purgeRevokedSessions();
  return true;
}
export function publicUser(user) { return { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId }; }
export function listUsers() { return process.env.APP_MODE === 'production' ? [] : USERS.map(publicUser); }
export function listRoles() {
  return [
    { id: 'admin', label: 'Platform Admin', permissions: ['read', 'operate', 'manage_webhooks', 'manage_users'] },
    { id: 'risk_analyst', label: 'Risk Analyst', permissions: ['read', 'operate', 'comment'] },
    { id: 'viewer', label: 'Read Only Viewer', permissions: ['read'] },
  ];
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = readToken(token);
  if (!user) return res.status(401).json({ error: 'Autenticación requerida' });
  req.user = user;
  next();
}

export function authIfConfigured(req, res, next) {
  const tenantId = req.get('x-tenant-id') || process.env.VITE_TENANT_ID;
  if (process.env.AUTH_REQUIRED === 'true') {
    return requireAuth(req, res, (err) => {
      if (err) return next(err);
      if (req.user && tenantId) req.user.organizationId = tenantId;
      next();
    });
  } else {
    req.user = req.user || { role: 'admin' };
    if (tenantId) req.user.organizationId = tenantId;
    return next();
  }
}

export function roleIfConfigured(...roles) {
  return (req, res, next) => {
    if (process.env.AUTH_REQUIRED !== 'true') return next();
    return requireRole(...roles)(req, res, next);
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Rol insuficiente' });
    next();
  };
}
