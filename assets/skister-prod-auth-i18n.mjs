/** @typedef {'de' | 'en'} AuthLang */

const STORAGE_KEY = 'skister-lang'

/** @param {string | null | undefined} stored */
export function resolveAuthLang(stored) {
  if (stored === 'en') return 'en'
  return 'de'
}

/** @returns {AuthLang} */
export function getAuthLang() {
  try {
    return resolveAuthLang(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'de'
  }
}

const STATIC = {
  de: {
    'verify.title': 'E-Mail bestätigen',
    'verify.lead': 'Prüfe dein Postfach auf den Bestätigungslink von Skister.',
    'verify.emailLabel': 'E-Mail',
    'verify.emailPlaceholder': 'deine@email.de',
    'verify.resend': 'Bestätigungsmail erneut senden',
    'verify.changeEmail': 'Falsche E-Mail? Vor der Bestätigung ändern',
    'verify.changeHint': 'Gib dein Registrierungs-Passwort ein, um die ausstehende Adresse zu aktualisieren.',
    'verify.newEmailLabel': 'Neue E-Mail',
    'verify.passwordLabel': 'Passwort',
    'verify.updateEmail': 'E-Mail aktualisieren',
    'verify.openApp': 'Skister-App öffnen',
    'verify.signInWeb': 'Im Browser anmelden',
    'verify.appNote':
      'Die Bestätigung im Browser meldet dich nicht automatisch in der App an. Melde dich dort mit derselben E-Mail und deinem Passwort an.',
    'login.title': 'Anmelden',
    'login.subtitle': 'Melde dich im Browser an oder öffne die Skister-App auf deinem Smartphone.',
    'login.recoverySubtitle': 'Wähle ein neues Passwort für dein Skister-Konto.',
    'login.openApp': 'Skister-App öffnen',
    'login.signOut': 'Im Browser abmelden',
    'login.emailLabel': 'E-Mail',
    'login.passwordLabel': 'Passwort',
    'login.submit': 'Anmelden',
    'login.forgot': 'Passwort vergessen?',
    'login.forgotHint': 'Wir senden dir einen sicheren Link zum Zurücksetzen (zeitlich begrenzt gültig).',
    'login.sendReset': 'Link senden',
    'login.backSignIn': 'Zurück zur Anmeldung',
    'login.newPassword': 'Neues Passwort',
    'login.confirmPassword': 'Passwort bestätigen',
    'login.savePassword': 'Neues Passwort speichern',
    'common.backHome': 'Zurück zu skister.app',
    'pageTitle.verify': 'Skister — E-Mail bestätigen',
    'pageTitle.login': 'Skister — Anmelden',
    'header.homeAria': 'Skister Startseite',
  },
  en: {
    'verify.title': 'Confirm your email',
    'verify.lead': 'Check your inbox for the verification link from Skister.',
    'verify.emailLabel': 'Email',
    'verify.emailPlaceholder': 'you@example.com',
    'verify.resend': 'Resend verification email',
    'verify.changeEmail': 'Wrong email? Change it before verifying',
    'verify.changeHint': 'Enter your signup password to update the pending address.',
    'verify.newEmailLabel': 'New email',
    'verify.passwordLabel': 'Password',
    'verify.updateEmail': 'Update email',
    'verify.openApp': 'Open Skister app',
    'verify.signInWeb': 'Sign in on the web',
    'verify.appNote':
      'Browser verification does not sign you into the mobile app automatically. Use the same email and password in the app.',
    'login.title': 'Sign in',
    'login.subtitle': 'Sign in on the web or open the Skister app on your phone.',
    'login.recoverySubtitle': 'Choose a new password for your Skister account.',
    'login.openApp': 'Open Skister app',
    'login.signOut': 'Sign out on this browser',
    'login.emailLabel': 'Email',
    'login.passwordLabel': 'Password',
    'login.submit': 'Sign in',
    'login.forgot': 'Forgot password?',
    'login.forgotHint': 'We will email a secure reset link (valid for a limited time).',
    'login.sendReset': 'Send reset link',
    'login.backSignIn': 'Back to sign in',
    'login.newPassword': 'New password',
    'login.confirmPassword': 'Confirm password',
    'login.savePassword': 'Save new password',
    'common.backHome': 'Back to skister.app',
    'pageTitle.verify': 'Skister — Verify email',
    'pageTitle.login': 'Skister — Sign in',
    'header.homeAria': 'Skister home',
  },
}

const VERIFY_VIEW = {
  de: {
    loading: {
      title: 'E-Mail wird bestätigt',
      body: 'Bitte warte, während wir deine Adresse bestätigen…',
      icon: '⏳',
      status: 'Wird verarbeitet…',
    },
    pending: {
      title: 'E-Mail bestätigen',
      bodyNoEmail: 'Prüfe dein Postfach auf den Bestätigungslink von Skister.',
      bodyWithEmail: (email) =>
        `Wir haben einen Link an ${email} gesendet. Öffne ihn auf diesem Gerät, um die Registrierung abzuschließen.`,
      icon: '✉️',
    },
    success: {
      title: 'E-Mail bestätigt',
      body:
        'Deine E-Mail ist bestätigt. Öffne die Skister-App und melde dich mit deinem Passwort an. ' +
        'Die Anmeldung hier meldet dich nicht automatisch in der mobilen App an.',
      icon: '✓',
    },
    already: {
      title: 'Bereits bestätigt',
      body: 'Diese E-Mail ist bereits bestätigt. Du kannst dich in der Skister-App anmelden.',
      icon: '✓',
    },
    expired: {
      title: 'Link abgelaufen',
      body: 'Dieser Bestätigungslink ist nicht mehr gültig. Fordere unten eine neue E-Mail an.',
      icon: '!',
    },
    failed: {
      title: 'Bestätigung fehlgeschlagen',
      body: 'Wir konnten diesen Link nicht bestätigen. Fordere eine neue E-Mail an oder schreib an support@skister.app.',
      icon: '!',
    },
  },
  en: {
    loading: {
      title: 'Verifying your email',
      body: 'Please wait while we confirm your address…',
      icon: '⏳',
      status: 'Working…',
    },
    pending: {
      title: 'Confirm your email',
      bodyNoEmail: 'Check your inbox for the verification link from Skister.',
      bodyWithEmail: (email) =>
        `We sent a link to ${email}. Open it on this device to finish signup.`,
      icon: '✉️',
    },
    success: {
      title: 'Email verified',
      body:
        'Your email is confirmed. Open the Skister app and sign in with your password to continue. ' +
        'Signing in here does not automatically sign you into the mobile app.',
      icon: '✓',
    },
    already: {
      title: 'Already verified',
      body: 'This email is already confirmed. You can sign in in the Skister app.',
      icon: '✓',
    },
    expired: {
      title: 'Link expired',
      body: 'This verification link is no longer valid. Request a new email below.',
      icon: '!',
    },
    failed: {
      title: 'Verification failed',
      body: 'We could not verify this link. Request a new email or contact support@skister.app.',
      icon: '!',
    },
  },
}

const MSG = {
  de: {
    verifyResendSent: 'Bestätigungsmail wurde gesendet.',
    verifyEnterEmail: 'Bitte gib deine E-Mail-Adresse ein.',
    verifyResendFailed: 'E-Mail konnte nicht erneut gesendet werden.',
    verifyAllFields: 'Alle Felder sind erforderlich.',
    verifyChangeFailed: 'E-Mail konnte nicht geändert werden.',
    verifyEmailUpdated: 'E-Mail aktualisiert. Prüfe dein Postfach für den neuen Link.',
    verifyNetwork: 'Netzwerkfehler. Bitte versuche es erneut.',
    verifyInvalidLink: 'Ungültiger Bestätigungslink.',
    referralApplied: 'Dein Einladungscode wurde angewendet.',
    referralNotApplied:
      'Der Einladungscode konnte nicht angewendet werden. Du kannst ihn in der App eingeben.',
    loginSignedInHint:
      'Du bist nur in diesem Browser angemeldet. Öffne die Skister-App und melde dich dort an, um dein Konto auf dem Smartphone zu nutzen.',
    loginResetInvalid:
      'Dieser Zurücksetz-Link ist ungültig, abgelaufen oder wurde bereits verwendet. Fordere eine neue E-Mail an.',
    loginResetInvalidShort: 'Dieser Zurücksetz-Link ist ungültig oder abgelaufen. Fordere eine neue E-Mail an.',
    loginCredentialsRequired: 'E-Mail und Passwort sind erforderlich.',
    loginEnterEmail: 'Bitte gib deine E-Mail-Adresse ein.',
    loginForgotSent: 'Wenn ein Konto mit dieser E-Mail existiert, haben wir einen Link gesendet.',
    loginOpenResetLink: 'Öffne den Link aus der E-Mail, um ein neues Passwort zu setzen.',
    loginPasswordConfirm: 'Gib dein neues Passwort ein und bestätige es.',
    loginPasswordMin: 'Das Passwort muss mindestens 6 Zeichen haben.',
    loginPasswordMismatch: 'Die Passwörter stimmen nicht überein.',
    loginResetExpired: 'Diese Zurücksetz-Sitzung ist abgelaufen. Fordere eine neue E-Mail an.',
    loginPasswordUpdated: 'Passwort aktualisiert. Du kannst dich in der Skister-App oder unten anmelden.',
    loginNetwork: 'Netzwerkfehler. Bitte versuche es erneut.',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
    errorAuthLink: 'Authentifizierungslink ungültig oder abgelaufen.',
    errorInvalidCredentials: 'E-Mail oder Passwort ist falsch.',
    errorEmailNotConfirmed: 'E-Mail noch nicht bestätigt.',
  },
  en: {
    verifyResendSent: 'Verification email sent.',
    verifyEnterEmail: 'Enter your email address.',
    verifyResendFailed: 'Could not resend email.',
    verifyAllFields: 'All fields are required.',
    verifyChangeFailed: 'Could not change email.',
    verifyEmailUpdated: 'Email updated. Check your inbox for the new link.',
    verifyNetwork: 'Network error. Try again.',
    verifyInvalidLink: 'Invalid verification link.',
    referralApplied: 'Your referral code was applied.',
    referralNotApplied: 'We could not apply your referral code. You can enter it in the app.',
    loginSignedInHint:
      'You are signed in on this browser only. Open the Skister app and sign in there to use your account on your phone.',
    loginResetInvalid:
      'This reset link is invalid, expired, or was already used. Request a new reset email.',
    loginResetInvalidShort: 'This reset link is invalid or expired. Request a new reset email.',
    loginCredentialsRequired: 'Email and password are required.',
    loginEnterEmail: 'Enter your email address.',
    loginForgotSent: 'If an account exists for this email, we sent a reset link.',
    loginOpenResetLink: 'Open the password reset link from your email to set a new password.',
    loginPasswordConfirm: 'Enter and confirm your new password.',
    loginPasswordMin: 'Password must be at least 6 characters.',
    loginPasswordMismatch: 'Passwords do not match.',
    loginResetExpired: 'This reset session expired. Request a new reset email.',
    loginPasswordUpdated: 'Password updated. You can sign in in the Skister app or below.',
    loginNetwork: 'Network error. Try again.',
    errorGeneric: 'Something went wrong. Please try again.',
    errorAuthLink: 'Authentication link invalid or expired.',
    errorInvalidCredentials: 'Invalid login credentials',
    errorEmailNotConfirmed: 'Email not confirmed',
  },
}

/** @param {AuthLang} [lang] */
export function authMsg(key, lang = getAuthLang()) {
  const bucket = MSG[lang] || MSG.de
  return bucket[key] ?? MSG.de[key] ?? key
}

/** @param {string} key @param {AuthLang} [lang] */
export function authStatic(key, lang = getAuthLang()) {
  const bucket = STATIC[lang] || STATIC.de
  return bucket[key] ?? STATIC.de[key] ?? key
}

/**
 * @param {string} view
 * @param {{ email?: string }} [detail]
 * @param {AuthLang} [lang]
 */
export function getVerifyViewCopy(view, detail = {}, lang = getAuthLang()) {
  const pack = VERIFY_VIEW[lang] || VERIFY_VIEW.de
  if (view === 'pending') {
    const email = detail.email?.trim()
    return {
      title: pack.pending.title,
      body: email ? pack.pending.bodyWithEmail(email) : pack.pending.bodyNoEmail,
      icon: pack.pending.icon,
    }
  }
  if (view === 'loading') {
    return { title: pack.loading.title, body: pack.loading.body, icon: pack.loading.icon, status: pack.loading.status }
  }
  const block = pack[view] || pack.failed
  return { title: block.title, body: block.body, icon: block.icon }
}

/** Apply data-auth-i18n / placeholders and document lang for static shell. */
export function applyAuthPageStaticI18n() {
  const lang = getAuthLang()
  document.documentElement.lang = lang
  const titleKey = document.body?.classList.contains('auth-page')
    ? document.querySelector('[data-skister-verify]')
      ? 'pageTitle.verify'
      : 'pageTitle.login'
    : null
  if (titleKey) {
    const titleEl = document.querySelector('title')
    if (titleEl) titleEl.textContent = authStatic(titleKey, lang)
  }
  const homeLink = document.querySelector('.auth-header a')
  if (homeLink) homeLink.setAttribute('aria-label', authStatic('header.homeAria', lang))
  document.querySelectorAll('[data-auth-i18n]').forEach((el) => {
    const key = el.getAttribute('data-auth-i18n')
    if (key) el.textContent = authStatic(key, lang)
  })
  document.querySelectorAll('[data-auth-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-auth-i18n-placeholder')
    if (key) el.setAttribute('placeholder', authStatic(key, lang))
  })
}

const SUPABASE_ERROR_MAP = [
  { match: (s) => /invalid login credentials/i.test(s), key: 'errorInvalidCredentials' },
  { match: (s) => /email not confirmed/i.test(s), key: 'errorEmailNotConfirmed' },
  { match: (s) => /email link expired|otp_expired/i.test(s), key: 'errorAuthLink' },
  { match: (s) => /code verifier|pkce/i.test(s), key: 'loginResetInvalidShort' },
  { match: (s) => /invalid verification link|missing verification token/i.test(s), key: 'verifyInvalidLink' },
]

/** @param {string | null | undefined} raw @param {AuthLang} [lang] */
export function localizedAuthError(raw, lang = getAuthLang()) {
  if (!raw || typeof raw !== 'string') return authMsg('errorGeneric', lang)
  const trimmed = raw.trim()
  if (!trimmed) return authMsg('errorGeneric', lang)
  if (/eyJ[A-Za-z0-9_-]{10,}/.test(trimmed)) return authMsg('errorAuthLink', lang)
  for (const rule of SUPABASE_ERROR_MAP) {
    if (rule.match(trimmed)) return authMsg(rule.key, lang)
  }
  if (trimmed.length > 240) return `${trimmed.slice(0, 240)}…`
  return trimmed
}
