import {
  classifyLoginCallback,
  hashParams,
  isEmailNotConfirmedError,
  isEmailVerifiedUser,
  isRecoverySession,
  safeErrorMessage,
  stashPendingVerifyEmail,
  stripAuthParamsFromUrl,
} from './skister-prod-auth-core.mjs'
import {
  applyReferralAfterAuth,
  exchangeLoginPkceCode,
  getProdSupabase,
  openSkisterApp,
} from './skister-prod-auth-shared.mjs'

function showAlert(root, message) {
  const alert = root.querySelector('#alert')
  if (!alert) return
  if (!message) {
    alert.hidden = true
    alert.textContent = ''
    return
  }
  alert.hidden = false
  alert.textContent = safeErrorMessage(message)
}

function setRecoveryMode(root, enabled) {
  const signInPanel = root.querySelector('#panel-signin')
  const recoveryPanel = root.querySelector('#panel-recovery')
  const forgotPanel = root.querySelector('#panel-forgot')
  const signedInPanel = root.querySelector('#panel-signed-in')
  const subtitle = root.querySelector('#subtitle')
  if (signInPanel) signInPanel.hidden = enabled
  if (forgotPanel) forgotPanel.hidden = true
  if (signedInPanel) signedInPanel.hidden = true
  if (recoveryPanel) recoveryPanel.hidden = !enabled
  if (subtitle) {
    subtitle.textContent = enabled
      ? 'Choose a new password for your Skister account.'
      : 'Sign in on the web or open the Skister app on your phone.'
  }
  if (enabled) {
    root.dataset.recoveryActive = '1'
  } else {
    delete root.dataset.recoveryActive
  }
}

function showSignedInPanel(root, signInPanel) {
  const signedIn = root.querySelector('#panel-signed-in')
  if (signInPanel) signInPanel.hidden = true
  if (signedIn) {
    signedIn.hidden = false
    const hint = signedIn.querySelector('#signed-in-hint')
    if (hint) {
      hint.textContent =
        'You are signed in on this browser only. Open the Skister app and sign in there to use your account on your phone.'
    }
  }
}

export async function initLoginPage() {
  const root = document.querySelector('[data-skister-login]')
  if (!root) return

  const params = new URLSearchParams(window.location.search)
  const hash = hashParams()
  const supabase = await getProdSupabase()

  const signInForm = root.querySelector('#signin-form')
  const forgotForm = root.querySelector('#forgot-form')
  const recoveryForm = root.querySelector('#recovery-form')
  const forgotToggle = root.querySelector('#forgot-toggle')
  const forgotBack = root.querySelector('#forgot-back')
  const openAppBtn = root.querySelector('#open-app')
  const signInPanel = root.querySelector('#panel-signin')
  const forgotPanel = root.querySelector('#panel-forgot')

  if (openAppBtn) {
    openAppBtn.addEventListener('click', () => openSkisterApp(''))
  }

  const oauthError =
    params.get('error_description') || params.get('error') || hash.get('error_description') || hash.get('error')
  if (oauthError) {
    showAlert(root, oauthError)
    stripAuthParamsFromUrl('/login/')
  }

  const recoveryFromUrl = isRecoverySession(params, hash)
  let isRecoveryFlow = recoveryFromUrl
  let initialSession = null

  const code = params.get('code')
  const recoveryTypeHint = params.get('type') === 'recovery'
  if (code) {
    const exchange = await exchangeLoginPkceCode(supabase, code)
    stripAuthParamsFromUrl('/login/')
    initialSession = exchange.session
    const callbackKind = classifyLoginCallback({
      authEvent: exchange.event,
      exchangeError: exchange.error,
      recoveryFromUrl: false,
      hasSession: Boolean(initialSession),
    })

    if (callbackKind === 'recovery_invalid' || callbackKind === 'exchange_failed') {
      showAlert(
        root,
        exchange.error?.message ||
          'This reset link is invalid, expired, or was already used. Request a new reset email.',
      )
      if (forgotPanel) forgotPanel.hidden = false
      if (signInPanel) signInPanel.hidden = true
    } else if (exchange.isRecovery || (recoveryTypeHint && initialSession)) {
      isRecoveryFlow = true
    }
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    initialSession = session
    if (recoveryFromUrl || hash.get('type') === 'recovery') {
      isRecoveryFlow = true
    }
  }

  if (isRecoveryFlow) {
    setRecoveryMode(root, true)
    stripAuthParamsFromUrl('/login/')
    const callbackKind = classifyLoginCallback({
      authEvent: null,
      exchangeError: null,
      recoveryFromUrl: true,
      hasSession: Boolean(initialSession),
    })
    if (callbackKind === 'recovery_invalid') {
      showAlert(root, 'This reset link is invalid or expired. Request a new reset email.')
      setRecoveryMode(root, false)
      if (forgotPanel) forgotPanel.hidden = false
      if (signInPanel) signInPanel.hidden = true
    }
  } else if (initialSession?.user && isEmailVerifiedUser(initialSession.user)) {
    showSignedInPanel(root, signInPanel)
    void applyReferralAfterAuth(initialSession.access_token)
  }

  if (forgotToggle && forgotPanel && signInPanel) {
    forgotToggle.addEventListener('click', (e) => {
      e.preventDefault()
      signInPanel.hidden = true
      forgotPanel.hidden = false
      showAlert(root, null)
    })
  }
  if (forgotBack && forgotPanel && signInPanel) {
    forgotBack.addEventListener('click', () => {
      forgotPanel.hidden = true
      signInPanel.hidden = false
      showAlert(root, null)
    })
  }

  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      showAlert(root, null)
      const email = root.querySelector('#email')?.value?.trim() || ''
      const password = root.querySelector('#password')?.value || ''
      if (!email || !password) {
        showAlert(root, 'Email and password are required.')
        return
      }
      const submit = signInForm.querySelector('button[type="submit"]')
      if (submit) submit.disabled = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (isEmailNotConfirmedError(error.message)) {
            stashPendingVerifyEmail(email)
            window.location.href = `/verify-email/?pending=1&email=${encodeURIComponent(email)}`
            return
          }
          showAlert(root, error.message)
          return
        }
        if (data.session?.access_token) {
          await applyReferralAfterAuth(data.session.access_token)
        }
        if (data.user && !isEmailVerifiedUser(data.user)) {
          stashPendingVerifyEmail(email)
          window.location.href = `/verify-email/?pending=1&email=${encodeURIComponent(email)}`
          return
        }
        window.location.reload()
      } catch {
        showAlert(root, 'Network error. Try again.')
      } finally {
        if (submit) submit.disabled = false
      }
    })
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      showAlert(root, null)
      const email = root.querySelector('#forgot-email')?.value?.trim() || ''
      if (!email) {
        showAlert(root, 'Enter your email address.')
        return
      }
      const submit = forgotForm.querySelector('button[type="submit"]')
      if (submit) submit.disabled = true
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://skister.app/login',
        })
        if (error) {
          showAlert(root, error.message)
          return
        }
        const info = root.querySelector('#forgot-sent')
        if (info) {
          info.hidden = false
          info.textContent = 'If an account exists for this email, we sent a reset link.'
        }
      } catch {
        showAlert(root, 'Network error. Try again.')
      } finally {
        if (submit) submit.disabled = false
      }
    })
  }

  if (recoveryForm) {
    recoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      showAlert(root, null)
      if (root.dataset.recoveryActive !== '1') {
        showAlert(root, 'Open the password reset link from your email to set a new password.')
        return
      }
      const pw = root.querySelector('#new-password')?.value || ''
      const confirm = root.querySelector('#confirm-password')?.value || ''
      if (!pw || !confirm) {
        showAlert(root, 'Enter and confirm your new password.')
        return
      }
      if (pw.length < 6) {
        showAlert(root, 'Password must be at least 6 characters.')
        return
      }
      if (pw !== confirm) {
        showAlert(root, 'Passwords do not match.')
        return
      }
      const submit = recoveryForm.querySelector('button[type="submit"]')
      if (submit) submit.disabled = true
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          showAlert(root, 'This reset session expired. Request a new reset email.')
          setRecoveryMode(root, false)
          if (forgotPanel) forgotPanel.hidden = false
          return
        }
        const { error } = await supabase.auth.updateUser({ password: pw })
        if (error) {
          showAlert(root, error.message)
          return
        }
        stripAuthParamsFromUrl('/login/')
        setRecoveryMode(root, false)
        const info = root.querySelector('#recovery-done')
        if (info) {
          info.hidden = false
          info.textContent = 'Password updated. You can sign in in the Skister app or below.'
        }
        if (signInPanel) signInPanel.hidden = false
      } catch {
        showAlert(root, 'Network error. Try again.')
      } finally {
        if (submit) submit.disabled = false
      }
    })
  }

  const signOutBtn = root.querySelector('#sign-out')
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut({ scope: 'local' })
      window.location.reload()
    })
  }
}
