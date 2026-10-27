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
const signedIn = new URLSearchParams(location.search).get('session') !== '0'
const session = signedIn ? { access_token: 'fixture-token', user: { id: 'user-1' } } : null
globalThis.fetch = async (url, opts = {}) => {
  const target = String(url)
  calls.push({ url: target, method: opts.method || 'GET', body: String(opts.body || '') })
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
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

test('signed-in handoff page binds the PIN form without a supabase ReferenceError', async () => {
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
    const signedIn = await openPage(browserWs, `http://127.0.0.1:${port}/handoff/?session=1`)
    const handoffErrors = (events) => events
      .filter((event) => event.method === 'Runtime.exceptionThrown')
      .map((event) => ({
        text: event.params?.exceptionDetails?.exception?.description || event.params?.exceptionDetails?.text,
        url: event.params?.exceptionDetails?.url,
      }))
      .filter((error) => !String(error.url).endsWith('/scripts/site-canonical.js'))
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
    browserWs.close()
  } finally {
    chromeProc.kill('SIGKILL')
    await new Promise((resolve) => server.close(resolve))
  }
})
