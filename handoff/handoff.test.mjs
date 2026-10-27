import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  formatHandoffPin,
  handoffPartyState,
  handoffPhaseForRental,
  handoffResultText,
  handoffText,
  mergeOwnRentals,
  normalizeHandoffRental,
  renderHandoffList,
  upsertHandoffRental,
} from '../assets/skister-handoff.mjs'

const owner = '11111111-1111-4111-8111-111111111111'
const borrower = '22222222-2222-4222-8222-222222222222'
const approved = {
  id: 'r1', ownerId: owner, borrowerId: borrower, status: 'approved',
  ownerName: 'Sharan', borrowerName: 'TestTest', gearItemName: 'QA Maestro Skip EN',
  ownerPickupAckAt: null, borrowerPickupAckAt: '2026-10-26T09:27:46Z',
}
const rawRow = {
  id: 'r1', owner_id: owner, borrower_id: borrower, status: 'approved',
  owner_name: 'Sharan', borrower_name: 'TestTest', gear_item_name: 'QA Maestro Skip EN',
  owner_pickup_ack_at: null, borrower_pickup_ack_at: '2026-10-26T09:27:46Z',
}

/** Minimal DOM stub: only what renderHandoffList touches. */
class FakeNode {
  constructor(tag) { this.tag = tag; this.kids = []; this.dataset = {}; this.own = ''; this.hidden = true }
  set textContent(value) { this.own = String(value); this.kids = [] }
  get textContent() { return [this.own, ...this.kids.map((kid) => kid.textContent)].join('\n') }
  append(...nodes) { this.kids.push(...nodes) }
  replaceChildren(...nodes) { this.kids = nodes }
  setAttribute(name, value) { this[name] = value }
  addEventListener(name, handler) { this[`on${name}`] = handler }
  all() { return this.kids.flatMap((kid) => [kid, ...kid.all()]) }
}

function mount() {
  globalThis.document = { createElement: (tag) => new FakeNode(tag) }
  const list = new FakeNode('div')
  return { list, textContent: '', querySelector: (sel) => (sel === '#handoff-list' ? list : null), get text() { return list.textContent } }
}

function cards(root) {
  return root.list.all().filter((node) => node.tag === 'article')
}

function buttons(root) {
  return root.list.all().filter((node) => node.tag === 'button').map((node) => node.own)
}

test('spaces an 8 digit handoff code', () => {
  assert.equal(formatHandoffPin('48295137'), '482 951 37')
})

test('offers pickup or return only to the two participants', () => {
  assert.equal(handoffPhaseForRental(approved, owner), 'pickup')
  assert.equal(handoffPhaseForRental(approved, borrower), 'pickup')
  assert.equal(handoffPhaseForRental(approved, '33333333-3333-4333-8333-333333333333'), null)
  assert.equal(handoffPhaseForRental({ ...approved, status: 'active' }, borrower), 'return')
  assert.equal(handoffPhaseForRental({ ...approved, status: 'pending' }, owner), null)
  assert.equal(handoffPhaseForRental({ ...approved, status: 'returned' }, owner), null)
})

test('normalizes the raw row returned by PIN resolve', () => {
  assert.deepEqual(normalizeHandoffRental(rawRow), normalizeHandoffRental(approved))
})

test('lists each rental once, across owner, borrower and PIN sources', () => {
  assert.equal(mergeOwnRentals([approved], [approved], owner).length, 1)
  assert.deepEqual(mergeOwnRentals([{ ...approved, status: 'returned' }], [], owner), [])
  assert.equal(mergeOwnRentals([{ ...approved, status: 'returned' }], [], owner, new Set(['r1'])).length, 1)
  const list = mergeOwnRentals([approved], [approved], owner)
  const withPin = upsertHandoffRental(list, rawRow)
  assert.equal(withPin.length, 1)
  assert.equal(withPin[0].ownerName, 'Sharan')
})

test('owner sees the borrower confirmed and gets exactly one confirm action', () => {
  const root = mount()
  renderHandoffList(root, { rentals: upsertHandoffRental(mergeOwnRentals([approved], [approved], owner), rawRow), userId: owner, lang: 'de', focusId: 'r1', onConfirm() {} })
  assert.equal(cards(root).length, 1)
  assert.deepEqual(buttons(root), ['Abholung bestätigen'])
  const text = root.text
  assert.match(text, /Besitzer · Du: wartet/)
  assert.match(text, /Ausleiher · TestTest: bestätigt/)
  assert.match(text, /TestTest hat bestätigt\. Bestätige jetzt deine Seite\./)
})

test('borrower who already confirmed has no confirm button and waits for the owner', () => {
  const root = mount()
  renderHandoffList(root, { rentals: [normalizeHandoffRental(approved)], userId: borrower, lang: 'en', onConfirm() {} })
  assert.deepEqual(buttons(root), [])
  assert.match(root.text, /Owner · Sharan: waiting/)
  assert.match(root.text, /Borrower · You: confirmed/)
  assert.match(root.text, /You confirmed\. Waiting for Sharan\./)
})

test('a finished pickup stays a completed pickup instead of offering return', () => {
  const root = mount()
  const active = normalizeHandoffRental({ ...approved, status: 'active', ownerPickupAckAt: 'x' })
  renderHandoffList(root, { rentals: [active], userId: owner, lang: 'de', phases: { r1: 'pickup' }, onConfirm() {} })
  assert.deepEqual(buttons(root), [])
  assert.match(root.text, /Abholung abgeschlossen/)
  renderHandoffList(root, { rentals: [active], userId: owner, lang: 'de', onConfirm() {} })
  assert.deepEqual(buttons(root), ['Rückgabe bestätigen'])
})

test('return completes with both sides and no further action', () => {
  const returned = { ...approved, status: 'returned', ownerReturnAckAt: 'x', borrowerReturnAckAt: 'y' }
  const state = handoffPartyState(normalizeHandoffRental(returned), 'return', borrower)
  assert.equal(state.complete, true)
  assert.equal(state.canConfirm, false)
})

test('describes both-party outcomes in German and English without treating a 404 as success', () => {
  assert.match(handoffResultText(200, { outcome: 'waiting_for_other_party' }), /andere Person/)
  assert.equal(handoffResultText(200, { outcome: 'committed_done' }), 'Beide haben bestätigt.')
  assert.equal(handoffResultText(200, { outcome: 'committed_done' }, 'en'), 'Both of you confirmed.')
  assert.match(handoffResultText(404, {}), /nicht freigeschaltet/)
  assert.match(handoffText('en', 'codeAccepted', { gear: 'Skis', phase: 'Pickup', name: 'Ann' }), /Code accepted: Skis \(Pickup\) with Ann/)
})

test('the public page calls party-confirm, has one rental container and is outside the app link paths', () => {
  const page = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../assets/skister-handoff.mjs', import.meta.url), 'utf8')
  const aasa = JSON.parse(readFileSync(new URL('../.well-known/apple-app-site-association', import.meta.url), 'utf8'))
  const android = readFileSync(new URL('../../Skister-theme-v2/android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8')
  assert.match(page, /data-skister-handoff/)
  assert.match(source, /\/party-confirm/)
  assert.match(source, /\/handoff\/pin\/resolve/)
  assert.match(page, /handoff-code/)
  assert.doesNotMatch(page, /handoff-match/)
  assert.doesNotMatch(source, /\/rentals\/\$\{rentalId\}\/status/)
  assert.doesNotMatch(page, /updateRentalStatus/)
  assert.deepEqual(aasa.applinks.details[0].paths, ['/invite', '/invite/*'])
  assert.doesNotMatch(android, /pathPrefix="\/handoff"/)
})
