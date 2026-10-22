import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildSkisterAppOpenDestination,
  classifyLoginCallback,
  classifyVerifyError,
  isEmailNotConfirmedError,
  isEmailVerifiedUser,
  isPasswordRecoveryAuthEvent,
  normalizeReferralCode,
  safeErrorMessage,
  shouldClearPendingReferralAfterApply,
} from '../assets/skister-prod-auth-core.mjs'

describe('skister-prod-auth-core', () => {
  it('classifyVerifyError detects expiry', () => {
    assert.equal(classifyVerifyError('otp_expired'), 'expired')
    assert.equal(classifyVerifyError('Email link expired'), 'expired')
    assert.equal(classifyVerifyError('invalid'), 'failed')
  })

  it('safeErrorMessage strips jwt-like tokens', () => {
    const out = safeErrorMessage('bad eyJhbGciOiJIUzI1NiJ9.abc.def token')
    assert.equal(out, 'Authentication link invalid or expired.')
  })

  it('normalizeReferralCode accepts SKI- pattern', () => {
    assert.equal(normalizeReferralCode('ski-ab12'), 'SKI-AB12')
    assert.equal(normalizeReferralCode('nope'), '')
  })

  it('isEmailVerifiedUser respects oauth providers', () => {
    assert.equal(isEmailVerifiedUser({ email_confirmed_at: '2020' }), true)
    assert.equal(
      isEmailVerifiedUser({ app_metadata: { providers: ['google'] } }),
      true,
    )
    assert.equal(isEmailVerifiedUser({ email: 'a@b.c' }), false)
  })

  it('isEmailNotConfirmedError matches supabase copy', () => {
    assert.equal(isEmailNotConfirmedError('Email not confirmed'), true)
    assert.equal(isEmailNotConfirmedError('Invalid login'), false)
  })
})

describe('PKCE recovery callback classification', () => {
  it('A — PASSWORD_RECOVERY event shows recovery form context', () => {
    assert.equal(isPasswordRecoveryAuthEvent('PASSWORD_RECOVERY'), true)
    assert.equal(
      classifyLoginCallback({
        authEvent: 'PASSWORD_RECOVERY',
        hasSession: true,
      }),
      'recovery_session',
    )
  })

  it('B — ordinary SIGNED_IN is not recovery', () => {
    assert.equal(
      classifyLoginCallback({
        authEvent: 'SIGNED_IN',
        hasSession: true,
      }),
      'signed_in_session',
    )
    assert.equal(isPasswordRecoveryAuthEvent('SIGNED_IN'), false)
  })

  it('C — expired recovery fails safely', () => {
    assert.equal(
      classifyLoginCallback({
        exchangeError: { message: 'Email link expired' },
        hasSession: false,
      }),
      'recovery_invalid',
    )
    assert.equal(
      classifyLoginCallback({
        recoveryFromUrl: true,
        hasSession: false,
      }),
      'recovery_invalid',
    )
  })
})

describe('referral retention and handoff', () => {
  it('D — failed apply retains code (no clear flag)', () => {
    assert.equal(shouldClearPendingReferralAfterApply(false, { ok: false, error: 'unknown' }), false)
    assert.equal(shouldClearPendingReferralAfterApply(true, { ok: false, error: 'code_not_found' }), false)
  })

  it('E — successful apply clears code', () => {
    assert.equal(shouldClearPendingReferralAfterApply(true, { ok: true, status: 'confirmed' }), true)
    assert.equal(shouldClearPendingReferralAfterApply(false, { ok: false, error: 'already_referred' }), true)
  })

  it('F — pending referral survives browser-to-app handoff', () => {
    assert.equal(
      buildSkisterAppOpenDestination({
        referralWasApplied: false,
        pendingCode: 'SKI-AB12',
      }),
      'invite?code=SKI-AB12',
    )
    assert.equal(
      buildSkisterAppOpenDestination({
        referralWasApplied: true,
        pendingCode: 'SKI-AB12',
      }),
      '',
    )
    assert.equal(
      buildSkisterAppOpenDestination({
        referralWasApplied: false,
        pendingCode: 'invalid',
      }),
      '',
    )
  })
})
