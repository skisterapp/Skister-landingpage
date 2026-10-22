/** @typedef {'success' | 'expired' | 'failed' | 'already' | 'pending' | 'loading'} VerifyView */

export const SUPABASE_URL = 'https://ayomhapkzckbhgwxenwr.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b21oYXBremNrYmhnd3hlbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDU5NzEsImV4cCI6MjA4NzE4MTk3MX0.z5ZOt2q6wG75jgr2qM9cSguDAwrq9scwt6YzRlXuKO8'
export const EDGE_BASE = `${SUPABASE_URL}/functions/v1/make-server-080ebf84`
export const PENDING_VERIFY_EMAIL_KEY = 'skister_pending_verify_email'
export const PENDING_REFERRAL_CODE_KEY = 'skister_pending_referral_code'
export const REFERRAL_CODE_PATTERN = /^SKI-[A-Z0-9]{4}$/
export const DEVICE_ID_KEY = 'skister_referral_device_id'

const TRUSTED_OAUTH = new Set(['google', 'apple'])

const SENSITIVE_QUERY_KEYS = new Set([
  'code',
  'token_hash',
  'type',
  'access_token',
  'refresh_token',
  'error',
  'error_description',
  'error_code',
])

/**
 * User-safe error text — strips token-like substrings.
 * @param {string | null | undefined} raw
 */
export function safeErrorMessage(raw) {
  if (!raw || typeof raw !== 'string') return 'Something went wrong. Please try again.'
  const trimmed = raw.trim()
  if (!trimmed) return 'Something went wrong. Please try again.'
  if (/eyJ[A-Za-z0-9_-]{10,}/.test(trimmed)) return 'Authentication link invalid or expired.'
  if (trimmed.length > 240) return `${trimmed.slice(0, 240)}…`
  return trimmed
}

/** @param {string | null | undefined} message */
export function classifyVerifyError(message) {
  if (!message) return 'failed'
  const lower = message.toLowerCase()
  if (lower.includes('expired') || lower.includes('otp_expired')) return 'expired'
  return 'failed'
}

/** @param {string} code */
export function normalizeReferralCode(code) {
  const upper = String(code || '').trim().toUpperCase()
  if (!upper) return ''
  return REFERRAL_CODE_PATTERN.test(upper) ? upper : ''
}

export function getReferralDeviceHash() {
  let deviceId = ''
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY) || ''
    if (!deviceId) {
      deviceId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
  } catch {
    deviceId = `dev-${Date.now()}`
  }
  const parts = [deviceId]
  if (typeof navigator !== 'undefined') {
    parts.push(navigator.userAgent || '')
    parts.push(String(navigator.language || ''))
  }
  if (typeof screen !== 'undefined') {
    parts.push(`${screen.width}x${screen.height}`)
  }
  return parts.join('|').slice(0, 256)
}

/** @param {Record<string, unknown> | null | undefined} user */
export function isEmailVerifiedUser(user) {
  if (!user || typeof user !== 'object') return false
  if (user.email_confirmed_at || user.confirmed_at) return true
  const meta = user.app_metadata
  if (meta && typeof meta === 'object' && Array.isArray(meta.providers)) {
    if (meta.providers.some((p) => TRUSTED_OAUTH.has(String(p)))) return true
  }
  const identities = user.identities
  if (Array.isArray(identities)) {
    if (identities.some((i) => i && TRUSTED_OAUTH.has(String(i.provider || '')))) return true
  }
  return false
}

/** @param {string | null | undefined} message */
export function isEmailNotConfirmedError(message) {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes('email not confirmed') ||
    lower.includes('email_not_confirmed') ||
    lower.includes('confirm your email')
  )
}

/**
 * Remove auth parameters from the visible URL (does not log the prior URL).
 * @param {string} pathname
 */
export function stripAuthParamsFromUrl(pathname) {
  if (typeof window === 'undefined') return
  const path = pathname || window.location.pathname
  const search = new URLSearchParams(window.location.search)
  for (const key of [...search.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key)) search.delete(key)
  }
  const qs = search.toString()
  const next = qs ? `${path}?${qs}` : path
  window.history.replaceState(null, '', next)
  if (window.location.hash && /access_token|refresh_token|type=recovery/i.test(window.location.hash)) {
    window.history.replaceState(null, '', next)
  }
}

/** @param {URLSearchParams} params */
export function hashParams() {
  const raw = (typeof window !== 'undefined' && window.location.hash) || ''
  return new URLSearchParams(raw.replace(/^#/, ''))
}

export function isRecoverySession(params, hash) {
  const type = params.get('type') || hash.get('type')
  return type === 'recovery'
}

export function stashPendingVerifyEmail(email) {
  try {
    sessionStorage.setItem(PENDING_VERIFY_EMAIL_KEY, String(email).trim().toLowerCase())
  } catch {
    /* ignore */
  }
}

export function peekPendingVerifyEmail() {
  try {
    return sessionStorage.getItem(PENDING_VERIFY_EMAIL_KEY)
  } catch {
    return null
  }
}

export function clearPendingVerifyEmail() {
  try {
    sessionStorage.removeItem(PENDING_VERIFY_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

export function peekPendingReferralCode() {
  try {
    const raw = localStorage.getItem(PENDING_REFERRAL_CODE_KEY)
    return raw ? normalizeReferralCode(raw) : ''
  } catch {
    return ''
  }
}

export function clearPendingReferralCode() {
  try {
    localStorage.removeItem(PENDING_REFERRAL_CODE_KEY)
  } catch {
    /* ignore */
  }
}

export function consumePendingReferralCode() {
  const code = peekPendingReferralCode()
  if (code) clearPendingReferralCode()
  return code
}

/** @param {string | null | undefined} event */
export function isPasswordRecoveryAuthEvent(event) {
  return event === 'PASSWORD_RECOVERY'
}

/**
 * After PKCE exchange on /login, decide UI mode without treating every code as recovery.
 * @param {{ authEvent?: string | null, exchangeError?: { message?: string } | null, recoveryFromUrl?: boolean, hasSession?: boolean }} input
 */
export function classifyLoginCallback(input) {
  const { authEvent, exchangeError, recoveryFromUrl, hasSession } = input
  if (exchangeError) {
    const msg = String(exchangeError.message || '').toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('already been used')) {
      return 'recovery_invalid'
    }
    return 'exchange_failed'
  }
  if (recoveryFromUrl && hasSession) return 'recovery_session'
  if (isPasswordRecoveryAuthEvent(authEvent) && hasSession) return 'recovery_session'
  if (authEvent === 'SIGNED_IN' && hasSession) return 'signed_in_session'
  if (hasSession) return 'signed_in_session'
  if (recoveryFromUrl) return 'recovery_invalid'
  return 'no_session'
}

/**
 * @param {boolean} httpOk
 * @param {{ ok?: boolean, error?: string } | null | undefined} body
 */
export function shouldClearPendingReferralAfterApply(httpOk, body) {
  if (httpOk && body?.ok === true) return true
  const err = body?.error
  if (err === 'already_referred' || err === 'self_referral') return true
  return false
}

/**
 * Native deep-link path for open-app (empty = skister:// home).
 * @param {{ referralWasApplied?: boolean, pendingCode?: string }} opts
 */
export function buildSkisterAppOpenDestination(opts) {
  if (opts?.referralWasApplied) return ''
  const normalized = normalizeReferralCode(opts?.pendingCode || '')
  if (!normalized) return ''
  return `invite?code=${encodeURIComponent(normalized)}`
}
