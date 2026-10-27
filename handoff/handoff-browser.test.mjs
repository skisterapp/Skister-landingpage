import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtempSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import test from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

const root = new URL('..', import.meta.url)
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const fakeAuth = `
const calls = []
globalThis.__handoffFixtureCalls = calls
const params = new URLSearchParams(location.search)
const signedIn = params.get('session') !== '0'
const scenario = params.get('scenario')
const owner = '11111111-1111-4111-8111-111111111111'
const borrower = '22222222-2222-4222-8222-222222222222'
const userId = scenario === 'test18' ? (params.get('user') === 'borrower' ? borrower : owner) : 'user-1'
const session = signedIn ? { access_token: 'fixture-token', user: { id: userId } } : null
const db = {
  id: 'c9ea1200-fb19-4a1b-b2f0-910dc501967c', gear_id: 'g1', owner_id: owner, borrower_id: borrower,
  owner_name: 'Sharan G Estone', borrower_name: 'TestTest', gear_item_name: 'QA Maestro Skip EN',
  status: 'approved', owner_pickup_ack_at: null, borrower_pickup_ack_at: '2026-10-26T09:27:46Z',
  owner_return_ack_at: null, borrower_return_ack_at: null,
}
const api = () => ({
  id: db.id, ownerId: db.owner_id, borrowerId: db.borrower_id, ownerName: db.owner_name, borrowerName: db.borrower_name,
  gearItemName: db.gear_item_name, status: db.status, ownerPickupAckAt: db.owner_pickup_ack_at,
  borrowerPickupAckAt: db.borrower_pickup_ack_at, ownerReturnAckAt: db.owner_return_ack_at, borrowerReturnAckAt: db.borrower_return_ack_at,
})
globalThis.fetch = async (url, opts = {}) => {
  const target = String(url)
  calls.push({ url: target, method: opts.method || 'GET', body: String(opts.body || '') })
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  if (scenario === 'test18') {
    if (target.includes('/rentals/by-')) return json(200, { rentals: [api()] })
    if (target.includes('/handoff/pin/resolve')) {
      if (!String(opts.body).includes('12345678')) return json(400, { error: 'Dieser Code ist ungültig.' })
      return json(200, { success: true, phase: 'pickup', rental: { ...db }, ownerConfirmed: false, borrowerConfirmed: true, requiresPartyConfirm: true })
    }
    if (target.includes('/party-confirm')) {
      if (session.user.id === owner) db.owner_pickup_ack_at ??= '2026-10-27T15:00:00Z'
      else db.borrower_pickup_ack_at ??= '2026-10-27T15:00:00Z'
      const both = db.owner_pickup_ack_at && db.borrower_pickup_ack_at
      const outcome = db.status === 'active' ? 'already_committed' : both ? 'committed_done' : 'waiting_for_other_party'
      if (both) db.status = 'active'
      return json(200, { success: true, outcome, status: db.status, rental: api() })
    }
    return json(599, { error: 'unexpected request' })
  }
  if (target.includes('/party-confirm')) return json(500, { error: 'confirm must not run from code lookup' })
  if (target.includes('/handoff/pin/resolve')) return json(400, { error: 'Dieser Code ist ungültig.' })
  if (target.includes('/rentals/by-')) return json(200, { rentals: [] })
  return json(599, { error: 'unexpected request' })
}
export async function getProdSupabase() {
  return { auth: { async getSession() { return { data: { session } } }, async signInWithPassword() { return { error: null } } } }
}
`

function startSite() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (url.pathname === '/assets/skister-prod-auth-shared.mjs') {
      res.writeHead(200, { 'content-type': 'text/javascript' })
      res.end(fakeAuth)
      return
    }
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'
    const file = join(root.pathname, pathname)
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('missing')
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function cdp(ws) {
  let id = 0
  const pending = new Map()
  const events = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
      return
    }
    events.push(message)
  })
  return {
    events,
    send(method, params = {}, sessionId) {
      const messageId = ++id
      ws.send(JSON.stringify({ id: messageId, method, params, sessionId }))
      return new Promise((resolve) => pending.set(messageId, resolve))
    },
  }
}

async function openPage(browserWs, url) {
  const browser = cdp(browserWs)
  const created = await browser.send('Target.createTarget', { url: 'about:blank' })
  const attached = await browser.send('Target.attachToTarget', { targetId: created.result.targetId, flatten: true })
  const sessionId = attached.result.sessionId
  const page = {
    events: browser.events,
    send: (method, params) => browser.send(method, params, sessionId),
  }
  await page.send('Runtime.enable')
  await page.send('Page.enable')
  await page.send('Page.navigate', { url })
  const started = Date.now()
  while (Date.now() - started < 8000) {
    const ready = await page.send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('[data-skister-handoff]') && globalThis.__handoffFixtureCalls)`,
      returnByValue: true,
    })
    if (ready.result?.result?.value) return page
    await sleep(50)
  }
  throw new Error(`handoff page did not initialize: ${url}`)
}

/** Launches headless Chrome against a local copy of the site and passes the CDP socket. */
async function withBrowser(run) {
  const server = await startSite()
  const port = server.address().port
  const profile = mkdtempSync(join(tmpdir(), 'skister-handoff-'))
  const chromeProc = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
  let debugPort = 0
  chromeProc.stderr.setEncoding('utf8')
  chromeProc.stderr.on('data', (chunk) => {
    const match = String(chunk).match(/127\.0\.0\.1:(\d+)/)
    if (match) debugPort = Number(match[1])
  })
  try {
    for (let i = 0; i < 100 && !debugPort; i += 1) await sleep(100)
    assert.ok(debugPort)
    let version
    for (let i = 0; i < 50; i += 1) {
      try {
        version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((response) => response.json())
        break
      } catch {
        await sleep(100)
      }
    }
    assert.ok(version?.webSocketDebuggerUrl)
    const browserWs = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      browserWs.addEventListener('open', resolve, { once: true })
      browserWs.addEventListener('error', reject, { once: true })
    })
    await run(browserWs, port)
    browserWs.close()
  } finally {
    chromeProc.kill('SIGKILL')
    await new Promise((resolve) => server.close(resolve))
  }
}

const handoffErrors = (events) => events
  .filter((event) => event.method === 'Runtime.exceptionThrown')
  .map((event) => ({
    text: event.params?.exceptionDetails?.exception?.description || event.params?.exceptionDetails?.text,
    url: event.params?.exceptionDetails?.url,
  }))
  .filter((error) => !String(error.url).endsWith('/scripts/site-canonical.js'))

/** Evaluates an expression in the page and returns its value. */
async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result?.result?.value
}

/** Polls an expression until it is truthy or fails after ~4s. */
async function waitFor(page, expression) {
  for (let i = 0; i < 80; i += 1) {
    const value = await evaluate(page, expression)
    if (value) return value
    await sleep(50)
  }
  throw new Error(`timed out waiting for: ${expression}`)
}

const listState = `({
  cards: document.querySelectorAll('#handoff-list article').length,
  buttons: [...document.querySelectorAll('#handoff-list article button')].map((b) => b.textContent),
  text: document.querySelector('#handoff-list').textContent,
  status: document.querySelector('#handoff-status').textContent,
  confirms: globalThis.__handoffFixtureCalls.filter((c) => c.url.includes('/party-confirm')).length,
})`

test('signed-in handoff page binds the PIN form without a supabase ReferenceError', async () => {
  await withBrowser(async (browserWs, port) => {
      const signedIn = await openPage(browserWs, `http://127.0.0.1:${port}/handoff/?session=1`)
      assert.deepEqual(handoffErrors(signedIn.events), [])
      const state = await signedIn.send('Runtime.evaluate', {
        expression: `({
          signInHidden: document.querySelector('#handoff-signin').hidden,
          codeHidden: document.querySelector('#handoff-code-form').hidden,
          status: document.querySelector('#handoff-status').textContent
        })`,
        returnByValue: true,
      })
      assert.equal(state.result.result.value.signInHidden, true)
      assert.equal(state.result.result.value.codeHidden, false)
      assert.equal(state.result.result.value.status, '')
      await signedIn.send('Runtime.evaluate', {
        expression: `document.querySelector('#handoff-code').value = '00000000'; document.querySelector('#handoff-code-form').requestSubmit()`,
      })
      let invalid = ''
      for (let i = 0; i < 40; i += 1) {
        const status = await signedIn.send('Runtime.evaluate', {
          expression: `document.querySelector('#handoff-status').textContent`,
          returnByValue: true,
        })
        invalid = status.result.result.value
        if (invalid) break
        await sleep(50)
      }
      assert.equal(invalid, 'Dieser Code ist ungültig.')
      const calls = await signedIn.send('Runtime.evaluate', {
        expression: `JSON.stringify(globalThis.__handoffFixtureCalls)`,
        returnByValue: true,
      })
      const recorded = JSON.parse(calls.result.result.value)
      assert.equal(recorded.some((call) => call.url.includes('/handoff/pin/resolve') && call.body.includes('00000000')), true)
      assert.equal(recorded.some((call) => call.url.includes('/party-confirm')), false)

      const signedOut = await openPage(browserWs, `http://127.0.0.1:${port}/handoff/?session=0`)
      assert.deepEqual(handoffErrors(signedOut.events), [])
      const login = await signedOut.send('Runtime.evaluate', {
        expression: `({
          signInHidden: document.querySelector('#handoff-signin').hidden,
          codeHidden: document.querySelector('#handoff-code-form').hidden,
          email: Boolean(document.querySelector('#email')),
          password: Boolean(document.querySelector('#password'))
        })`,
        returnByValue: true,
      })
      assert.equal(login.result.result.value.signInHidden, false)
      assert.equal(login.result.result.value.codeHidden, true)
      assert.equal(login.result.result.value.email, true)
      assert.equal(login.result.result.value.password, true)

  })
})

test('Test 18 shape: one card, owner confirms once, PIN never confirms, pickup reads complete', async () => {
  await withBrowser(async (browserWs, port) => {
    const page = await openPage(browserWs, `http://127.0.0.1:${port}/handoff/?session=1&scenario=test18&user=owner`)
    await waitFor(page, `document.querySelectorAll('#handoff-list article').length > 0`)
    let state = await evaluate(page, listState)
    assert.equal(state.cards, 1)
    assert.deepEqual(state.buttons, ['Abholung bestätigen'])
    assert.match(state.text, /Besitzer · Du: wartet/)
    assert.match(state.text, /Ausleiher · TestTest: bestätigt/)
    assert.match(state.text, /TestTest hat bestätigt/)

    await evaluate(page, `document.querySelector('#handoff-code').value = '12345678'; document.querySelector('#handoff-code-form').requestSubmit()`)
    await waitFor(page, `document.querySelector('#handoff-status').textContent.includes('Code akzeptiert')`)
    state = await evaluate(page, listState)
    assert.equal(state.cards, 1)
    assert.deepEqual(state.buttons, ['Abholung bestätigen'])
    assert.match(state.status, /QA Maestro Skip EN \(Abholung\) mit TestTest/)
    assert.equal(state.confirms, 0)

    await evaluate(page, `document.querySelector('#handoff-list article button').click()`)
    await waitFor(page, `document.querySelector('#handoff-list').textContent.includes('Abholung abgeschlossen')`)
    state = await evaluate(page, listState)
    assert.equal(state.cards, 1)
    assert.deepEqual(state.buttons, [])
    assert.equal(state.confirms, 1)
    assert.equal(state.status, 'Beide haben bestätigt.')
    assert.deepEqual(handoffErrors(page.events), [])
  })
})

test('borrower who already confirmed sees no button; English copy applies', async () => {
  await withBrowser(async (browserWs, port) => {
    const page = await openPage(browserWs, `http://127.0.0.1:${port}/handoff/?session=1&scenario=test18&user=borrower`)
    await evaluate(page, `localStorage.setItem('skister-lang', 'en'); location.reload()`)
    await sleep(300)
    await waitFor(page, `document.querySelectorAll('#handoff-list article').length > 0 && document.querySelector('h1').textContent === 'Confirm handoff'`)
    const state = await evaluate(page, listState)
    assert.equal(state.cards, 1)
    assert.deepEqual(state.buttons, [])
    assert.match(state.text, /Owner · Sharan G Estone: waiting/)
    assert.match(state.text, /You confirmed\. Waiting for Sharan G Estone\./)
    assert.equal(await evaluate(page, `document.documentElement.lang`), 'en')
  })
})
