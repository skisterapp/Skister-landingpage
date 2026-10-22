import {
  SUPABASE_ANON_KEY,
  EDGE_BASE,
  classifyVerifyError,
  clearPendingVerifyEmail,
  isEmailVerifiedUser,
  peekPendingVerifyEmail,
  stashPendingVerifyEmail,
  stripAuthParamsFromUrl,
} from './skister-prod-auth-core.mjs'
import {
  buildSkisterAppOpenDestination,
  peekPendingReferralCode,
} from './skister-prod-auth-core.mjs'
import { applyReferralAfterAuth, getProdSupabase, openSkisterApp } from './skister-prod-auth-shared.mjs'
import {
  applyAuthPageStaticI18n,
  authMsg,
  getVerifyViewCopy,
  localizedAuthError,
} from './skister-prod-auth-i18n.mjs'

/** @type {boolean} */
let referralAppliedOnPage = false

function bindOpenAppButton(openAppBtn) {
  if (!openAppBtn) return
  openAppBtn.addEventListener('click', () => {
    const dest = buildSkisterAppOpenDestination({
      referralWasApplied: referralAppliedOnPage,
      pendingCode: peekPendingReferralCode(),
    })
    openSkisterApp(dest)
  })
}

function setView(root, view, detail) {
  const title = root.querySelector('#title')
  const body = root.querySelector('#body')
  const icon = root.querySelector('#icon')
  const panelPending = root.querySelector('#panel-pending')
  const panelSuccess = root.querySelector('#panel-success')
  const panelChange = root.querySelector('#panel-change')
  const alert = root.querySelector('#alert')
  const status = root.querySelector('#status')

  const c = getVerifyViewCopy(view, { email: detail?.email })
  if (title) title.textContent = c.title
  if (body) body.textContent = c.body
  if (icon) icon.textContent = c.icon
  if (status) {
    if (view === 'loading') status.textContent = c.status || ''
    else status.textContent = detail?.status || ''
  }

  const showPending = view === 'pending' || view === 'expired' || view === 'failed'
  if (panelPending) panelPending.hidden = !showPending
  if (panelSuccess) panelSuccess.hidden = view !== 'success' && view !== 'already'
  if (panelChange) panelChange.hidden = !showPending

  if (alert) {
    if (detail?.error && view !== 'loading') {
      alert.hidden = false
      alert.textContent = localizedAuthError(detail.error)
    } else {
      alert.hidden = true
      alert.textContent = ''
    }
  }
}

function referralStatusAfterApply(hadCodeBefore) {
  if (referralAppliedOnPage) return authMsg('referralApplied')
  if (hadCodeBefore && peekPendingReferralCode()) return authMsg('referralNotApplied')
  return ''
}

async function runVerification(root, supabase, params) {
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const typeParam = params.get('type')
  if (!code && !tokenHash) return

  setView(root, 'loading', {})
  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } else if (tokenHash && typeParam) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: typeParam,
      })
      if (error) throw error
    } else {
      throw new Error('Missing verification token')
    }

    stripAuthParamsFromUrl('/verify-email/')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const hadReferral = Boolean(peekPendingReferralCode())
    if (session?.access_token) {
      const applyResult = await applyReferralAfterAuth(session.access_token)
      if (applyResult.referralCleared && applyResult.ok) referralAppliedOnPage = true
    }

    clearPendingVerifyEmail()
    const status = referralStatusAfterApply(hadReferral)
    setView(root, user && isEmailVerifiedUser(user) ? 'success' : 'success', { status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    stripAuthParamsFromUrl('/verify-email/')
    setView(root, classifyVerifyError(msg), { error: msg })
  }
}

export async function initVerifyEmailPage() {
  applyAuthPageStaticI18n()

  const root = document.querySelector('[data-skister-verify]')
  if (!root) return

  const params = new URLSearchParams(window.location.search)
  const emailInput = root.querySelector('#email')
  const resendBtn = root.querySelector('#resend')
  const changeToggle = root.querySelector('#toggle-change')
  const changeForm = root.querySelector('#change-form')
  const openAppBtn = root.querySelector('#open-app')
  const signInLink = root.querySelector('#sign-in')

  let email =
    params.get('email') ||
    peekPendingVerifyEmail() ||
    (emailInput && emailInput.value) ||
    ''

  if (emailInput) emailInput.value = email
  if (email) stashPendingVerifyEmail(email)

  bindOpenAppButton(openAppBtn)
  if (signInLink) {
    signInLink.addEventListener('click', (e) => {
      e.preventDefault()
      window.location.href = '/login/'
    })
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const value = (emailInput && emailInput.value.trim()) || email
      if (!value) {
        setView(root, 'pending', { email: '', error: authMsg('verifyEnterEmail') })
        return
      }
      resendBtn.disabled = true
      setView(root, 'pending', { email: value })
      try {
        const res = await fetch(`${EDGE_BASE}/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: value,
            redirectTo: 'https://skister.app/verify-email',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setView(root, 'pending', {
            email: value,
            error: data.error || authMsg('verifyResendFailed'),
          })
          return
        }
        if (data.alreadyVerified) {
          setView(root, 'already', {})
          return
        }
        stashPendingVerifyEmail(value)
        setView(root, 'pending', { email: value, status: authMsg('verifyResendSent') })
      } catch {
        setView(root, 'pending', { email: value, error: authMsg('verifyNetwork') })
      } finally {
        resendBtn.disabled = false
      }
    })
  }

  if (changeToggle && changeForm) {
    changeToggle.addEventListener('click', () => {
      changeForm.hidden = !changeForm.hidden
    })
    changeForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const current = (emailInput && emailInput.value.trim()) || ''
      const newEmail = root.querySelector('#new-email')?.value?.trim() || ''
      const password = root.querySelector('#change-password')?.value || ''
      if (!current || !newEmail || !password) {
        setView(root, 'pending', { email: current, error: authMsg('verifyAllFields') })
        return
      }
      try {
        const res = await fetch(`${EDGE_BASE}/auth/change-pending-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            currentEmail: current,
            newEmail,
            password,
            redirectTo: 'https://skister.app/verify-email',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setView(root, 'pending', {
            email: current,
            error: data.error || authMsg('verifyChangeFailed'),
          })
          return
        }
        if (emailInput) emailInput.value = newEmail.toLowerCase()
        stashPendingVerifyEmail(newEmail)
        changeForm.hidden = true
        setView(root, 'pending', { email: newEmail, status: authMsg('verifyEmailUpdated') })
      } catch {
        setView(root, 'pending', { email: current, error: authMsg('verifyNetwork') })
      }
    })
  }

  const errorDesc = params.get('error_description') || params.get('error') || ''
  if (errorDesc) {
    setView(root, classifyVerifyError(errorDesc), { error: errorDesc })
    stripAuthParamsFromUrl('/verify-email/')
    return
  }

  if (params.get('pending') === '1' || params.get('mode') === 'pending') {
    setView(root, 'pending', { email })
    return
  }

  const supabase = await getProdSupabase()
  if (params.get('code') || params.get('token_hash')) {
    await runVerification(root, supabase, params)
    return
  }

  if (typeof window !== 'undefined' && /access_token=/i.test(window.location.hash || '')) {
    setView(root, 'loading', {})
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      stripAuthParamsFromUrl('/verify-email/')
      if (error || !session) throw error || new Error('Invalid verification link')
      const hadReferral = Boolean(peekPendingReferralCode())
      if (session.access_token) {
        const applyResult = await applyReferralAfterAuth(session.access_token)
        if (applyResult.referralCleared && applyResult.ok) referralAppliedOnPage = true
      }
      clearPendingVerifyEmail()
      setView(root, 'success', { status: referralStatusAfterApply(hadReferral) })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setView(root, classifyVerifyError(msg), { error: msg })
    }
    return
  }

  setView(root, 'pending', { email })
}
