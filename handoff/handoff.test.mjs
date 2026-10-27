import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { formatHandoffPin, handoffPhaseForRental, handoffResultText, mergeOwnRentals } from '../assets/skister-handoff.mjs'

const owner = '11111111-1111-4111-8111-111111111111'
const borrower = '22222222-2222-4222-8222-222222222222'

test('spaces an 8 digit handoff code', () => {
  assert.equal(formatHandoffPin('48295137'), '482 951 37')
})

test('offers pickup or return only to the two participants', () => {
  const approved = { id: 'r1', ownerId: owner, borrowerId: borrower, status: 'approved' }
  assert.equal(handoffPhaseForRental(approved, owner), 'pickup')
  assert.equal(handoffPhaseForRental(approved, borrower), 'pickup')
  assert.equal(handoffPhaseForRental(approved, '33333333-3333-4333-8333-333333333333'), null)
  assert.equal(handoffPhaseForRental({ ...approved, status: 'active' }, borrower), 'return')
  assert.equal(handoffPhaseForRental({ ...approved, status: 'pending' }, owner), null)
  assert.equal(handoffPhaseForRental({ ...approved, status: 'returned' }, owner), null)
})

test('lists each rental once', () => {
  const rental = { id: 'r1', ownerId: owner, borrowerId: borrower, status: 'approved' }
  assert.deepEqual(mergeOwnRentals([rental], [rental], owner), [rental])
  assert.deepEqual(mergeOwnRentals([{ ...rental, status: 'returned' }], [], owner), [])
})

test('describes both-party outcomes without treating a 404 as success', () => {
  assert.match(handoffResultText(200, { outcome: 'waiting_for_other_party' }), /andere Person/)
  assert.equal(handoffResultText(200, { outcome: 'committed_done' }), 'Beide haben bestätigt.')
  assert.match(handoffResultText(404, {}), /nicht freigeschaltet/)
})

test('the public page calls party-confirm and is outside the app link paths', () => {
  const page = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../assets/skister-handoff.mjs', import.meta.url), 'utf8')
  const aasa = JSON.parse(readFileSync(new URL('../.well-known/apple-app-site-association', import.meta.url), 'utf8'))
  const android = readFileSync(new URL('../../Skister-theme-v2/android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8')
  assert.match(page, /data-skister-handoff/)
  assert.match(source, /\/party-confirm/)
  assert.match(source, /\/handoff\/pin\/resolve/)
  assert.match(page, /handoff-code/)
  const renderRentals = source.slice(source.indexOf('function renderRentals'), source.indexOf('function bindHandoffCodeForm'))
  assert.match(renderRentals, /function renderRentals\(root, rentals, userId, onConfirm, supabase\)/)
  assert.match(renderRentals, /bindHandoffCodeForm\(root, codeForm, supabase\)/)
  assert.match(source, /renderRentals\(root, rentals, session\.user\.id, async \(rentalId, phase, button\) => \{[\s\S]*?\}, supabase\)/)
  assert.doesNotMatch(source, /\/rentals\/\$\{rentalId\}\/status/)
  assert.doesNotMatch(page, /updateRentalStatus/)
  assert.deepEqual(aasa.applinks.details[0].paths, ['/invite', '/invite/*'])
  assert.doesNotMatch(android, /pathPrefix="\/handoff"/)
})
