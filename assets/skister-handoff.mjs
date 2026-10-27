import { EDGE_BASE, SUPABASE_ANON_KEY } from './skister-prod-auth-core.mjs'
import { getProdSupabase } from './skister-prod-auth-shared.mjs'

const COPY = {
  de: {
    title: 'Übergabe bestätigen',
    lead: 'Melde dich an, gib den 8-stelligen Übergabecode aus der App ein und bestätige deine Seite. Der QR-Code in der App bleibt gültig. Ein Code allein schließt die Übergabe nicht ab.',
    email: 'E-Mail',
    password: 'Passwort',
    signIn: 'Anmelden',
    forgot: 'Passwort vergessen?',
    codeLabel: 'Übergabecode',
    codeSubmit: 'Code prüfen',
    codeHint: 'Teile den Code nur mit der Person, die diese Ausrüstung übergibt.',
    back: 'Zurück zu skister.app',
    gear: 'Ausrüstung',
    pickup: 'Abholung',
    return: 'Rückgabe',
    confirmPickup: 'Abholung bestätigen',
    confirmReturn: 'Rückgabe bestätigen',
    owner: 'Besitzer',
    borrower: 'Ausleiher',
    you: 'Du',
    confirmed: 'bestätigt',
    waiting: 'wartet',
    withPerson: 'mit',
    mineDone: 'Du hast bestätigt. Warten auf {name}.',
    otherDone: '{name} hat bestätigt. Bestätige jetzt deine Seite.',
    pickupDone: 'Abholung abgeschlossen. Die Ausleihe ist aktiv.',
    returnDone: 'Rückgabe abgeschlossen. Die Ausrüstung ist wieder verfügbar.',
    empty: 'Keine Abholung oder Rückgabe wartet auf deine Bestätigung.',
    codeAccepted: 'Code akzeptiert: {gear} ({phase}) mit {name}. Prüfe Ausrüstung und Person, dann bestätige deine Seite.',
    codeLength: 'Gib den 8-stelligen Code ein.',
    codeInvalid: 'Dieser Code ist ungültig.',
    signInAgain: 'Bitte erneut anmelden.',
    loadFailed: 'Ausleihen konnten nicht geladen werden.',
    savedWaiting: 'Gespeichert. Die andere Person muss auch bestätigen.',
    bothDone: 'Beide haben bestätigt.',
    already: 'Das war bereits bestätigt.',
    notOpen: 'Diese Bestätigung ist noch nicht freigeschaltet.',
    failed: 'Bestätigung fehlgeschlagen.',
  },
  en: {
    title: 'Confirm handoff',
    lead: 'Sign in, enter the 8-digit handoff code from the app and confirm your side. The QR code in the app stays valid. A code alone never completes the handoff.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    forgot: 'Forgot password?',
    codeLabel: 'Handoff code',
    codeSubmit: 'Check code',
    codeHint: 'Only share the code with the person exchanging this equipment.',
    back: 'Back to skister.app',
    gear: 'Equipment',
    pickup: 'Pickup',
    return: 'Return',
    confirmPickup: 'Confirm pickup',
    confirmReturn: 'Confirm return',
    owner: 'Owner',
    borrower: 'Borrower',
    you: 'You',
    confirmed: 'confirmed',
    waiting: 'waiting',
    withPerson: 'with',
    mineDone: 'You confirmed. Waiting for {name}.',
    otherDone: '{name} confirmed. Confirm your side to finish.',
    pickupDone: 'Pickup complete. The rental is active.',
    returnDone: 'Return complete. The equipment is available again.',
    empty: 'No pickup or return is waiting for your confirmation.',
    codeAccepted: 'Code accepted: {gear} ({phase}) with {name}. Check the equipment and the person, then confirm your side.',
    codeLength: 'Enter the 8-digit code.',
    codeInvalid: 'That code is not valid.',
    signInAgain: 'Please sign in again.',
    loadFailed: 'Rentals could not be loaded.',
    savedWaiting: 'Saved. The other person must confirm too.',
    bothDone: 'Both of you confirmed.',
    already: 'That was already confirmed.',
    notOpen: 'This confirmation is not available yet.',
    failed: 'Confirmation failed.',
  },
}

export function handoffLang(stored) {
  return stored === 'en' ? 'en' : 'de'
}

export function handoffText(lang, key, vars = {}) {
  const template = (COPY[lang] ?? COPY.de)[key] ?? COPY.de[key] ?? key
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}

function currentLang() {
  try {
    return handoffLang(localStorage.getItem('skister-lang'))
  } catch {
    return 'de'
  }
}

export function formatHandoffPin(raw) {
  const pin = String(raw ?? '').replace(/\D/g, '').slice(0, 8)
  if (pin.length <= 3) return pin
  if (pin.length <= 6) return `${pin.slice(0, 3)} ${pin.slice(3)}`
  return `${pin.slice(0, 3)} ${pin.slice(3, 6)} ${pin.slice(6)}`
}

/** Accepts the API shape (camelCase) or a raw rentals row (snake_case, as PIN resolve returns it). */
export function normalizeHandoffRental(row) {
  if (!row || typeof row !== 'object') return null
  const pick = (camel, snake) => row[camel] ?? row[snake] ?? null
  return {
    id: pick('id', 'id'),
    status: pick('status', 'status'),
    ownerId: pick('ownerId', 'owner_id'),
    borrowerId: pick('borrowerId', 'borrower_id'),
    ownerName: pick('ownerName', 'owner_name') ?? '',
    borrowerName: pick('borrowerName', 'borrower_name') ?? '',
    gearItemName: pick('gearItemName', 'gear_item_name') ?? '',
    ownerPickupAckAt: pick('ownerPickupAckAt', 'owner_pickup_ack_at'),
    borrowerPickupAckAt: pick('borrowerPickupAckAt', 'borrower_pickup_ack_at'),
    ownerReturnAckAt: pick('ownerReturnAckAt', 'owner_return_ack_at'),
    borrowerReturnAckAt: pick('borrowerReturnAckAt', 'borrower_return_ack_at'),
  }
}

export function handoffPhaseForRental(rental, userId) {
  if (!rental || !userId) return null
  if (rental.ownerId !== userId && rental.borrowerId !== userId) return null
  if (rental.status === 'approved') return 'pickup'
  if (rental.status === 'active') return 'return'
  return null
}

export function handoffPartyState(rental, phase, userId) {
  const role = userId === rental.ownerId ? 'owner' : userId === rental.borrowerId ? 'borrower' : null
  const complete = phase === 'pickup'
    ? rental.status === 'active' || rental.status === 'returned'
    : rental.status === 'returned'
  const ownerConfirmed = complete || Boolean(phase === 'pickup' ? rental.ownerPickupAckAt : rental.ownerReturnAckAt)
  const borrowerConfirmed = complete || Boolean(phase === 'pickup' ? rental.borrowerPickupAckAt : rental.borrowerReturnAckAt)
  const mineConfirmed = role === 'owner' ? ownerConfirmed : role === 'borrower' ? borrowerConfirmed : false
  const otherConfirmed = role === 'owner' ? borrowerConfirmed : role === 'borrower' ? ownerConfirmed : false
  const open = (phase === 'pickup' && rental.status === 'approved') || (phase === 'return' && rental.status === 'active')
  return {
    role,
    ownerConfirmed,
    borrowerConfirmed,
    mineConfirmed,
    otherConfirmed,
    otherName: (role === 'owner' ? rental.borrowerName : rental.ownerName) || '',
    complete,
    canConfirm: Boolean(role) && open && !mineConfirmed,
  }
}

/** One entry per rental id: open handoffs plus any id in `keepIds` (acted on this session). */
export function mergeOwnRentals(owned, borrowed, userId, keepIds = new Set()) {
  const byId = new Map()
  for (const raw of [...owned, ...borrowed]) {
    const rental = normalizeHandoffRental(raw)
    if (!rental?.id) continue
    if (!handoffPhaseForRental(rental, userId) && !keepIds.has(rental.id)) continue
    byId.set(rental.id, rental)
  }
  return [...byId.values()]
}

/** Puts `rental` first and removes any other entry with the same id. */
export function upsertHandoffRental(list, raw) {
  const rental = normalizeHandoffRental(raw)
  if (!rental?.id) return list
  return [rental, ...list.filter((item) => item.id !== rental.id)]
}

export function handoffResultText(status, body, lang = 'de') {
  if (status === 200 && body?.outcome === 'waiting_for_other_party') return handoffText(lang, 'savedWaiting')
  if (status === 200 && body?.outcome === 'committed_done') return handoffText(lang, 'bothDone')
  if (status === 200 && body?.outcome === 'already_committed') return handoffText(lang, 'already')
  if (status === 404) return handoffText(lang, 'notOpen')
  return body?.error || handoffText(lang, 'failed')
}

function authHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
  }
}

export async function loadHandoffRentals(fetchImpl, token, userId, lang = 'de', keepIds = new Set()) {
  const load = async (path) => {
    const response = await fetchImpl(`${EDGE_BASE}${path}`, { headers: authHeaders(token) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error || handoffText(lang, 'loadFailed'))
    return Array.isArray(body.rentals) ? body.rentals : []
  }
  const [owned, borrowed] = await Promise.all([
    load(`/rentals/by-owner/${userId}`),
    load(`/rentals/by-borrower/${userId}`),
  ])
  return mergeOwnRentals(owned, borrowed, userId, keepIds)
}

export async function resolveHandoffPin(fetchImpl, token, pin) {
  const response = await fetchImpl(`${EDGE_BASE}/handoff/pin/resolve`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify({ pin: String(pin).replace(/\D/g, '') }),
  })
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}

export async function confirmHandoff(fetchImpl, token, rentalId, phase, lang = 'de') {
  const response = await fetchImpl(`${EDGE_BASE}/rentals/${rentalId}/party-confirm`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify({ phase }),
  })
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body, message: handoffResultText(response.status, body, lang) }
}

function setStatus(root, message, isError) {
  const status = root.querySelector('#handoff-status')
  if (!status) return
  status.hidden = !message
  status.textContent = message || ''
  status.className = isError ? 'alert' : 'info'
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * Renders one card per rental id. `phases` pins a card to the phase the user acted on,
 * so a finished pickup reads as complete instead of flipping to a return action.
 */
export function renderHandoffList(root, view) {
  const { rentals, userId, lang, focusId, busyId, onConfirm, phases = {} } = view
  const list = root.querySelector('#handoff-list')
  if (!list) return
  list.hidden = false
  list.replaceChildren()
  if (rentals.length === 0) {
    list.append(el('p', 'info', handoffText(lang, 'empty')))
    return
  }
  for (const rental of rentals) {
    const phase = phases[rental.id] ?? handoffPhaseForRental(rental, userId)
    if (!phase) continue
    const state = handoffPartyState(rental, phase, userId)
    const item = el('article', 'stack')
    item.dataset.rentalId = rental.id
    if (rental.id === focusId) item.setAttribute('aria-current', 'true')
    const phaseLabel = handoffText(lang, phase)
    item.append(
      el('h2', null, rental.gearItemName || handoffText(lang, 'gear')),
      el('p', 'subtitle', `${phaseLabel} · ${handoffText(lang, 'withPerson')} ${state.otherName}`),
    )
    const sideLine = (roleKey, name, isMine, done) =>
      el('p', null, `${handoffText(lang, roleKey)} · ${isMine ? handoffText(lang, 'you') : name}: ${handoffText(lang, done ? 'confirmed' : 'waiting')}`)
    item.append(
      sideLine('owner', rental.ownerName, state.role === 'owner', state.ownerConfirmed),
      sideLine('borrower', rental.borrowerName, state.role === 'borrower', state.borrowerConfirmed),
    )
    const note = state.complete
      ? handoffText(lang, phase === 'pickup' ? 'pickupDone' : 'returnDone')
      : state.mineConfirmed
        ? handoffText(lang, 'mineDone', { name: state.otherName })
        : state.otherConfirmed
          ? handoffText(lang, 'otherDone', { name: state.otherName })
          : ''
    if (note) item.append(el('p', 'info', note))
    if (state.canConfirm) {
      const button = el('button', 'btn btn-primary skister-btn-primary', handoffText(lang, phase === 'pickup' ? 'confirmPickup' : 'confirmReturn'))
      button.type = 'button'
      button.disabled = busyId === rental.id
      button.addEventListener('click', () => onConfirm(rental.id, phase))
      item.append(button)
    }
    list.append(item)
  }
}

function applyStaticCopy(root, lang) {
  document.documentElement.lang = lang
  for (const node of root.querySelectorAll('[data-handoff-i18n]')) {
    node.textContent = handoffText(lang, node.dataset.handoffI18n)
  }
}

async function freshToken(supabase) {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function startHandoff(root, supabase, session, lang) {
  const userId = session.user.id
  const view = { rentals: [], userId, lang, focusId: null, busyId: null, onConfirm: null, phases: {} }
  const signIn = root.querySelector('#handoff-signin')
  if (signIn) signIn.hidden = true

  const reload = async () => {
    const token = await freshToken(supabase)
    if (!token) throw new Error(handoffText(lang, 'signInAgain'))
    view.rentals = await loadHandoffRentals(fetch, token, userId, lang, new Set(Object.keys(view.phases)))
    if (view.focusId) {
      const match = view.rentals.find((item) => item.id === view.focusId)
      if (match) view.rentals = upsertHandoffRental(view.rentals, match)
    }
    renderHandoffList(root, view)
  }

  view.onConfirm = async (rentalId, phase) => {
    if (view.busyId) return
    const token = await freshToken(supabase)
    if (!token) {
      setStatus(root, handoffText(lang, 'signInAgain'), true)
      return
    }
    view.busyId = rentalId
    view.phases[rentalId] = phase
    renderHandoffList(root, view)
    try {
      const result = await confirmHandoff(fetch, token, rentalId, phase, lang)
      if (result.status === 200 && result.body?.rental) {
        view.rentals = view.rentals.map((item) => (item.id === rentalId ? normalizeHandoffRental(result.body.rental) : item))
      }
      setStatus(root, result.message, result.status !== 200)
    } finally {
      view.busyId = null
      await reload().catch(() => renderHandoffList(root, view))
    }
  }

  const form = root.querySelector('#handoff-code-form')
  if (form && form.dataset.bound !== '1') {
    form.dataset.bound = '1'
    form.hidden = false
    const input = form.querySelector('#handoff-code')
    input?.addEventListener('input', () => {
      input.value = formatHandoffPin(input.value)
    })
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const pin = input?.value ?? ''
      if (pin.replace(/\D/g, '').length !== 8) {
        setStatus(root, handoffText(lang, 'codeLength'), true)
        return
      }
      const token = await freshToken(supabase)
      if (!token) {
        setStatus(root, handoffText(lang, 'signInAgain'), true)
        return
      }
      const result = await resolveHandoffPin(fetch, token, pin)
      const rental = normalizeHandoffRental(result.body?.rental)
      if (result.status !== 200 || !rental?.id) {
        setStatus(root, result.body?.error || handoffText(lang, 'codeInvalid'), true)
        return
      }
      const phase = result.body.phase === 'return' ? 'return' : 'pickup'
      view.focusId = rental.id
      view.phases[rental.id] = phase
      view.rentals = upsertHandoffRental(view.rentals, rental)
      renderHandoffList(root, view)
      setStatus(root, handoffText(lang, 'codeAccepted', {
        gear: rental.gearItemName || handoffText(lang, 'gear'),
        phase: handoffText(lang, phase),
        name: handoffPartyState(rental, phase, userId).otherName,
      }), false)
    })
  }

  setStatus(root, '', false)
  await reload()
}

export async function initHandoffPage() {
  const root = document.querySelector('[data-skister-handoff]')
  if (!root) return
  const lang = currentLang()
  applyStaticCopy(root, lang)
  const supabase = await getProdSupabase()
  const start = async (session) => {
    try {
      await startHandoff(root, supabase, session, lang)
    } catch (loadError) {
      setStatus(root, loadError instanceof Error ? loadError.message : handoffText(lang, 'loadFailed'), true)
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    await start(session)
    return
  }
  const form = root.querySelector('#handoff-signin')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = root.querySelector('#email')?.value ?? ''
    const password = root.querySelector('#password')?.value ?? ''
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      setStatus(root, error?.message || handoffText(lang, 'signInAgain'), true)
      return
    }
    await start(data.session)
  })
}
