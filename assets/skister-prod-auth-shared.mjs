import {
  EDGE_BASE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearPendingReferralCode,
  getReferralDeviceHash,
  isPasswordRecoveryAuthEvent,
  peekPendingReferralCode,
  shouldClearPendingReferralAfterApply,
} from './skister-prod-auth-core.mjs'

let supabasePromise = null

export async function getProdSupabase() {
  if (!supabasePromise) {
    supabasePromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }),
    )
  }
  return supabasePromise
}

export function openSkisterApp(deepPath) {
  const suffix = deepPath ? String(deepPath).replace(/^\//, '') : ''
  const deepLink = suffix ? `skister://${suffix}` : 'skister://'
  const isAndroid = /Android/i.test(navigator.userAgent || '')
  if (isAndroid && suffix) {
    const intent =
      `intent://${suffix}#Intent;scheme=skister;package=com.skister.app;` +
      `S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`
    window.location.href = intent
    return
  }
  window.location.href = deepLink
}

/**
 * Exchange PKCE ?code= on /login and capture Supabase auth event (recovery vs sign-in).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} code
 */
export async function exchangeLoginPkceCode(supabase, code) {
  let authEvent = null
  let authSession = null

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (isPasswordRecoveryAuthEvent(event)) {
      authEvent = event
      authSession = session
      return
    }
    if (event === 'SIGNED_IN' && session && !isPasswordRecoveryAuthEvent(authEvent)) {
      authEvent = event
      authSession = session
    }
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
  subscription.unsubscribe()

  const session = authSession || data?.session || null
  return {
    error,
    event: authEvent,
    session,
    isRecovery: isPasswordRecoveryAuthEvent(authEvent),
  }
}

/**
 * Apply stashed referral after authenticated session (best-effort).
 * @param {string} accessToken
 */
export async function applyReferralAfterAuth(accessToken) {
  const code = peekPendingReferralCode()
  if (!code || !accessToken) {
    return { ok: false, skipped: true, referralCleared: false, pendingCode: code }
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    apikey: SUPABASE_ANON_KEY,
  }

  try {
    const applyRes = await fetch(`${EDGE_BASE}/referrals/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        referralCode: code,
        deviceHash: getReferralDeviceHash(),
      }),
    })
    const applyBody = await applyRes.json().catch(() => ({}))

    if (shouldClearPendingReferralAfterApply(applyRes.ok, applyBody)) {
      clearPendingReferralCode()
      await fetch(`${EDGE_BASE}/referrals/me`, { method: 'GET', headers })
      return {
        ok: applyRes.ok && applyBody?.ok === true,
        skipped: false,
        referralCleared: true,
        pendingCode: '',
        body: applyBody,
      }
    }

    return {
      ok: false,
      skipped: false,
      referralCleared: false,
      pendingCode: peekPendingReferralCode(),
      body: applyBody,
    }
  } catch {
    return {
      ok: false,
      skipped: false,
      referralCleared: false,
      pendingCode: peekPendingReferralCode(),
    }
  }
}
