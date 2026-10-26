import { EDGE_BASE, SUPABASE_ANON_KEY } from './skister-prod-auth-core.mjs'
import { getProdSupabase } from './skister-prod-auth-shared.mjs'

export function handoffPhaseForRental(rental, userId) {
  if (!rental || !userId) return null
  if (rental.ownerId !== userId && rental.borrowerId !== userId) return null
  if (rental.status === 'approved') return 'pickup'
  if (rental.status === 'active') return 'return'
  return null
}

export function mergeOwnRentals(owned, borrowed, userId) {
  const byId = new Map()
  for (const rental of [...owned, ...borrowed]) {
    if (!handoffPhaseForRental(rental, userId) || !rental.id) continue
    byId.set(rental.id, rental)
  }
  return [...byId.values()]
}

export function handoffResultText(status, body) {
  if (status === 200 && body?.outcome === 'waiting_for_other_party') {
    return 'Gespeichert. Die andere Person muss auch bestätigen.'
  }
  if (status === 200 && body?.outcome === 'committed_done') return 'Beide haben bestätigt.'
  if (status === 200 && body?.outcome === 'already_committed') return 'Das war bereits bestätigt.'
  if (status === 404) return 'Diese Bestätigung ist noch nicht freigeschaltet.'
  return body?.error || 'Bestätigung fehlgeschlagen.'
}

function authHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
  }
}

export async function loadHandoffRentals(fetchImpl, token, userId) {
  const load = async (path) => {
    const response = await fetchImpl(`${EDGE_BASE}${path}`, { headers: authHeaders(token) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error || 'Ausleihen konnten nicht geladen werden.')
    return Array.isArray(body.rentals) ? body.rentals : []
  }
  const [owned, borrowed] = await Promise.all([
    load(`/rentals/by-owner/${userId}`),
    load(`/rentals/by-borrower/${userId}`),
  ])
  return mergeOwnRentals(owned, borrowed, userId)
}

export async function confirmHandoff(fetchImpl, token, rentalId, phase) {
  const response = await fetchImpl(`${EDGE_BASE}/rentals/${rentalId}/party-confirm`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify({ phase }),
  })
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body, message: handoffResultText(response.status, body) }
}

function setStatus(root, message, isError) {
  const status = root.querySelector('#handoff-status')
  if (!status) return
  status.hidden = !message
  status.textContent = message || ''
  status.className = isError ? 'alert' : 'info'
}

function renderRentals(root, rentals, userId, onConfirm) {
  const list = root.querySelector('#handoff-list')
  const signIn = root.querySelector('#handoff-signin')
  if (signIn) signIn.hidden = true
  if (!list) return
  list.hidden = false
  list.replaceChildren()
  if (rentals.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'info'
    empty.textContent = 'Keine Abholung oder Rückgabe wartet auf deine Bestätigung.'
    list.append(empty)
    return
  }
  for (const rental of rentals) {
    const phase = handoffPhaseForRental(rental, userId)
    const item = document.createElement('article')
    item.className = 'stack'
    const title = document.createElement('h2')
    title.textContent = rental.gearItemName || 'Ausrüstung'
    const meta = document.createElement('p')
    meta.className = 'subtitle'
    meta.textContent = phase === 'pickup' ? 'Abholung' : 'Rückgabe'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn btn-primary skister-btn-primary'
    button.textContent = phase === 'pickup' ? 'Abholung bestätigen' : 'Rückgabe bestätigen'
    button.addEventListener('click', () => onConfirm(rental.id, phase, button))
    item.append(title, meta, button)
    list.append(item)
  }
}

async function showRentals(root, supabase) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  setStatus(root, '', false)
  const rentals = await loadHandoffRentals(fetch, session.access_token, session.user.id)
  renderRentals(root, rentals, session.user.id, async (rentalId, phase, button) => {
    button.disabled = true
    const fresh = await supabase.auth.getSession()
    const token = fresh.data.session?.access_token
    if (!token) {
      setStatus(root, 'Bitte erneut anmelden.', true)
      button.disabled = false
      return
    }
    const result = await confirmHandoff(fetch, token, rentalId, phase)
    setStatus(root, result.message, result.status !== 200)
    button.disabled = false
  })
}

export async function initHandoffPage() {
  const root = document.querySelector('[data-skister-handoff]')
  if (!root) return
  const supabase = await getProdSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  const form = root.querySelector('#handoff-signin')
  if (!session?.user) {
    form?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const email = root.querySelector('#email')?.value ?? ''
      const password = root.querySelector('#password')?.value ?? ''
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setStatus(root, error.message, true)
        return
      }
      try {
        await showRentals(root, supabase)
      } catch (loadError) {
        setStatus(root, loadError instanceof Error ? loadError.message : 'Ausleihen konnten nicht geladen werden.', true)
      }
    })
    return
  }
  try {
    await showRentals(root, supabase)
  } catch (loadError) {
    setStatus(root, loadError instanceof Error ? loadError.message : 'Ausleihen konnten nicht geladen werden.', true)
  }
}
