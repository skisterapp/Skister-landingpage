(function () {
  const SUPABASE_URL = 'https://ayomhapkzckbhgwxenwr.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b21oYXBremNrYmhnd3hlbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDU5NzEsImV4cCI6MjA4NzE4MTk3MX0.z5ZOt2q6wG75jgr2qM9cSguDAwrq9scwt6YzRlXuKO8'
  const EDGE = SUPABASE_URL + '/functions/v1/make-server-080ebf84'

  let supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
  let cmsRole = null
  let currentPage = 'dashboard'
  let chartInstances = []

  const $ = (sel) => document.querySelector(sel)
  const content = $('#content')
  const pageTitle = $('#page-title')
  const topbarActions = $('#topbar-actions')

  function toast(msg, isErr) {
    const el = $('#toast')
    el.textContent = msg
    el.className = 'toast' + (isErr ? ' error' : '')
    el.classList.remove('hidden')
    setTimeout(() => el.classList.add('hidden'), isErr ? 8000 : 4000)
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  async function api(path, opts) {
    if (!supa) throw new Error('Supabase not loaded')
    const { data: { session } } = await supa.auth.getSession()
    if (!session?.access_token) throw new Error('No session. Sign in again.')
    const headers = Object.assign({ Authorization: 'Bearer ' + session.access_token, apikey: SUPABASE_ANON_KEY }, opts?.headers || {})
    const res = await fetch(EDGE + path, Object.assign({}, opts, { headers }))
    const text = await res.text()
    let json = {}
    try { json = text ? JSON.parse(text) : {} } catch { throw new Error('Invalid server response') }
    if (!res.ok) throw new Error(json.error || res.statusText || 'Request failed')
    return json
  }

  function showLogin() {
    $('#login-view').classList.remove('hidden')
    $('#app').classList.add('hidden')
  }

  function showApp() {
    $('#login-view').classList.add('hidden')
    $('#app').classList.remove('hidden')
  }

  function destroyCharts() {
    chartInstances.forEach((c) => c.destroy())
    chartInstances = []
  }

  function switchPage(page) {
    currentPage = page
    document.querySelectorAll('.nav-link[data-page]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-page') === page)
    })
    const titles = {
      dashboard: 'Dashboard',
      resorts: 'Ski Resorts',
      pending: 'Pending Requests',
      countries: 'Countries',
      regions: 'Regions',
      areas: 'Areas',
      import: 'Import / Sync',
      analytics: 'Home Ski Network Analytics',
      communities: 'Communities',
      clubs: 'Ski Clubs',
      events: 'Ski Network Events',
      moderation: 'Moderation',
      settings: 'Settings',
      editor: 'Ski Resort Editor',
    }
    pageTitle.textContent = titles[page] || page
    topbarActions.innerHTML = ''
    destroyCharts()
    if (page === 'dashboard') renderDashboard()
    else if (page === 'resorts') renderResortsList()
    else if (page === 'pending') renderPending()
    else if (page === 'countries') renderHierarchy('countries')
    else if (page === 'regions') renderHierarchy('regions')
    else if (page === 'areas') renderHierarchy('areas')
    else if (page === 'import') renderImport()
    else if (page === 'analytics') renderAnalytics()
    else if (page === 'communities') renderCommunities()
    else if (page === 'clubs') renderClubs()
    else if (page === 'events') renderEvents()
    else if (page === 'moderation') renderModeration()
    else if (page === 'settings') renderSettings()
  }

  async function afterLogin() {
    const me = await api('/landing-cms/me')
    if (me.role !== 'admin') {
      const err = $('#login-error')
      err.textContent = 'Admin access required. Add your user id to LANDING_CMS_BOOTSTRAP_ADMIN_IDS in Supabase Edge secrets.'
      err.classList.add('show')
      await supa.auth.signOut()
      return
    }
    cmsRole = me.role
    $('#user-bar').textContent = me.email || me.userId
    showApp()
    switchPage('dashboard')
  }

  $('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = $('#login-btn')
    const err = $('#login-error')
    err.classList.remove('show')
    btn.disabled = true
    try {
      const email = $('#login-email').value.trim()
      const password = $('#login-password').value
      const { error } = await supa.auth.signInWithPassword({ email, password })
      if (error) throw error
      await afterLogin()
    } catch (ex) {
      err.textContent = ex.message || 'Sign in failed'
      err.classList.add('show')
    }
    btn.disabled = false
  })

  $('#logout-btn')?.addEventListener('click', async () => {
    await supa.auth.signOut()
    cmsRole = null
    showLogin()
  })

  document.querySelectorAll('.nav-link[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => switchPage(btn.getAttribute('data-page')))
  })

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => $('#modal').classList.add('hidden'))
  })

  function openModal(title, bodyHtml, footerHtml) {
    $('#modal-title').textContent = title
    $('#modal-body').innerHTML = bodyHtml
    $('#modal-footer').innerHTML = footerHtml || ''
    $('#modal').classList.remove('hidden')
  }

  async function renderDashboard() {
    content.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading dashboard…</div>'
    try {
      const data = await api('/ski-resorts/admin/dashboard')
      const s = data.stats
      content.innerHTML = `
        <div class="stats">
          <div class="stat"><div class="num">${s.totalResorts}</div><div class="lbl">Ski Resorts</div></div>
          <div class="stat"><div class="num">${s.pendingRequests}</div><div class="lbl">Pending Requests</div></div>
          <div class="stat"><div class="num">${s.countries}</div><div class="lbl">Countries</div></div>
          <div class="stat"><div class="num">${s.regions}</div><div class="lbl">Regions</div></div>
          <div class="stat"><div class="num">${s.areas}</div><div class="lbl">Areas</div></div>
          <div class="stat"><div class="num">${s.resortsThisMonth}</div><div class="lbl">Added This Month</div></div>
        </div>
        <div class="charts">
          <div class="chart-card"><h3>New ski resorts over time</h3><canvas id="chart-growth"></canvas></div>
          <div class="chart-card"><h3>Pending requests</h3><canvas id="chart-pending"></canvas></div>
          <div class="chart-card"><h3>Top home Ski Networks</h3><canvas id="chart-home"></canvas></div>
          <div class="chart-card"><h3>Most searched</h3><canvas id="chart-search"></canvas></div>
        </div>`
      const charts = data.charts
      if (window.Chart) {
        chartInstances.push(new Chart($('#chart-growth'), {
          type: 'line',
          data: {
            labels: (charts.resortsOverTime || []).map((x) => x.month),
            datasets: [{ label: 'Resorts', data: (charts.resortsOverTime || []).map((x) => x.count), borderColor: '#228B22', tension: 0.3 }],
          },
          options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#b0b0b0' } }, y: { ticks: { color: '#b0b0b0' } } } },
        }))
        chartInstances.push(new Chart($('#chart-pending'), {
          type: 'bar',
          data: {
            labels: (charts.pendingRequests || []).map((x) => x.week),
            datasets: [{ label: 'Pending', data: (charts.pendingRequests || []).map((x) => x.count), backgroundColor: '#f59e0b' }],
          },
          options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#b0b0b0' } }, y: { ticks: { color: '#b0b0b0' } } } },
        }))
        const homeTop = (charts.topHomeResorts || []).slice(0, 10)
        chartInstances.push(new Chart($('#chart-home'), {
          type: 'bar',
          data: {
            labels: homeTop.map((x) => x.official_name),
            datasets: [{ data: homeTop.map((x) => x.home_selection_count), backgroundColor: '#228B22' }],
          },
          options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#b0b0b0' } }, y: { ticks: { color: '#b0b0b0', font: { size: 10 } } } } },
        }))
        const searchTop = (charts.topSearchedResorts || []).slice(0, 10)
        chartInstances.push(new Chart($('#chart-search'), {
          type: 'bar',
          data: {
            labels: searchTop.map((x) => x.official_name),
            datasets: [{ data: searchTop.map((x) => x.search_hit_count), backgroundColor: '#2da82d' }],
          },
          options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#b0b0b0' } }, y: { ticks: { color: '#b0b0b0', font: { size: 10 } } } } },
        }))
      }
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  let resortsState = { q: '', sort: 'name', page: 1 }

  async function renderResortsList() {
    topbarActions.innerHTML = '<button type="button" class="btn btn-primary btn-small" id="btn-new-resort"><i class="fa-solid fa-plus"></i> Add ski resort</button>'
    $('#btn-new-resort')?.addEventListener('click', () => openResortEditor(null))

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span>Ski resorts</span>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <input type="search" class="search-input" id="resort-search" placeholder="Search name, slug…" value="${esc(resortsState.q)}">
            <select id="resort-sort" class="search-input">
              <option value="name">Alphabetical</option>
              <option value="popular">Popularity</option>
              <option value="newest">Newest</option>
              <option value="edited">Recently edited</option>
            </select>
          </div>
        </div>
        <div class="card-body" id="resorts-table-wrap"><div class="skeleton"></div></div>
      </div>`
    $('#resort-sort').value = resortsState.sort
    $('#resort-search').addEventListener('input', (e) => {
      resortsState.q = e.target.value
      resortsState.page = 1
      loadResortsTable()
    })
    $('#resort-sort').addEventListener('change', (e) => {
      resortsState.sort = e.target.value
      resortsState.page = 1
      loadResortsTable()
    })
    loadResortsTable()
  }

  async function loadResortsTable() {
    const wrap = $('#resorts-table-wrap')
    try {
      const sp = new URLSearchParams({ q: resortsState.q, sort: resortsState.sort, page: String(resortsState.page), pageSize: '25' })
      const data = await api('/ski-resorts/admin/resorts?' + sp.toString())
      const rows = data.resorts || []
      if (!rows.length) {
        wrap.innerHTML = '<p style="color:var(--text-muted)">No resorts found.</p>'
        return
      }
      wrap.innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Home</th><th>Searches</th><th></th></tr></thead>
        <tbody>${rows.map((r) => `<tr>
          <td><strong>${esc(r.officialName)}</strong><br><span style="color:var(--text-muted);font-size:0.8rem">${esc(r.slug || '')}</span></td>
          <td>${esc([r.areaName, r.regionName, r.countryName].filter(Boolean).join(' · '))}</td>
          <td><span class="badge badge-${r.visibilityStatus === 'active' ? 'approved' : 'pending'}">${esc(r.visibilityStatus)}</span></td>
          <td>${r.homeSelectionCount ?? 0}</td>
          <td>${r.searchHitCount ?? 0}</td>
          <td><button type="button" class="btn btn-secondary btn-small" data-edit-resort="${r.id}">Edit</button></td>
        </tr>`).join('')}</tbody></table></div>
        <div class="pagination">
          <button type="button" class="btn btn-secondary btn-small" id="prev-page" ${resortsState.page <= 1 ? 'disabled' : ''}>Prev</button>
          <span>Page ${data.pagination.page} · ${data.pagination.total} total</span>
          <button type="button" class="btn btn-secondary btn-small" id="next-page" ${resortsState.page * data.pagination.pageSize >= data.pagination.total ? 'disabled' : ''}>Next</button>
        </div>`
      wrap.querySelectorAll('[data-edit-resort]').forEach((btn) => {
        btn.addEventListener('click', () => openResortEditor(btn.getAttribute('data-edit-resort')))
      })
      $('#prev-page')?.addEventListener('click', () => { resortsState.page--; loadResortsTable() })
      $('#next-page')?.addEventListener('click', () => { resortsState.page++; loadResortsTable() })
    } catch (err) {
      wrap.innerHTML = '<p class="badge badge-rejected">' + esc(err.message) + '</p>'
    }
  }

  async function openResortEditor(id) {
    pageTitle.textContent = id ? 'Edit Resort' : 'New Resort'
    topbarActions.innerHTML = '<button type="button" class="btn btn-secondary btn-small" id="back-to-list"><i class="fa-solid fa-arrow-left"></i> Back</button>'
    $('#back-to-list').addEventListener('click', () => switchPage('resorts'))

    content.innerHTML = '<div class="loading">Loading editor…</div>'
    let resort = { active: true, visibilityStatus: 'active', aliases: [], galleryUrls: [] }
    let history = []
    if (id) {
      const data = await api('/ski-resorts/admin/resorts/' + encodeURIComponent(id))
      resort = data.resort
      history = data.history || []
    }

    const [countries, regions, areas] = await Promise.all([
      api('/ski-resorts/admin/countries'),
      api('/ski-resorts/admin/regions'),
      api('/ski-resorts/admin/areas'),
    ])

    content.innerHTML = `
      <form id="resort-form" class="card"><div class="card-header">${id ? 'Edit' : 'Create'} resort</div><div class="card-body">
        <div class="form-grid">
          <div class="form-group"><label>Name *</label><input name="officialName" value="${esc(resort.officialName || '')}" required></div>
          <div class="form-group"><label>Slug</label><input name="slug" value="${esc(resort.slug || '')}"></div>
          <div class="form-group"><label>Alternate names (comma-separated)</label><input name="aliases" value="${esc((resort.aliases || []).join(', '))}"></div>
          <div class="form-group full"><label>Description</label><textarea name="description">${esc(resort.description || '')}</textarea></div>
          <div class="form-group"><label>Country *</label><select name="countryId" required>${(countries.countries || []).map((c) => `<option value="${c.id}" ${c.id === resort.countryId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Region *</label><select name="regionId" required>${(regions.regions || []).map((r) => `<option value="${r.id}" ${r.id === resort.regionId ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Area *</label><select name="areaId" required>${(areas.areas || []).map((a) => `<option value="${a.id}" ${a.id === resort.areaId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Latitude</label><input name="latitude" type="number" step="any" value="${resort.latitude ?? ''}"></div>
          <div class="form-group"><label>Longitude</label><input name="longitude" type="number" step="any" value="${resort.longitude ?? ''}"></div>
          <div class="form-group"><label>Elevation base (m)</label><input name="elevationBase" type="number" value="${resort.elevationBase ?? ''}"></div>
          <div class="form-group"><label>Elevation peak (m)</label><input name="elevationTop" type="number" value="${resort.elevationTop ?? ''}"></div>
          <div class="form-group"><label>Lift count</label><input name="liftCount" type="number" value="${resort.liftCount ?? ''}"></div>
          <div class="form-group"><label>Ski runs</label><input name="skiRuns" type="number" value="${resort.skiRuns ?? ''}"></div>
          <div class="form-group"><label>Longest run (km)</label><input name="longestRunKm" type="number" step="0.1" value="${resort.longestRunKm ?? ''}"></div>
          <div class="form-group"><label>Snow parks</label><input name="snowParks" type="number" value="${resort.snowParks ?? ''}"></div>
          <div class="form-group"><label>Website</label><input name="website" value="${esc(resort.website || '')}"></div>
          <div class="form-group"><label>Snow report URL</label><input name="snowReportUrl" value="${esc(resort.snowReportUrl || '')}"></div>
          <div class="form-group"><label>Webcam URL</label><input name="webcamUrl" value="${esc(resort.webcamUrl || '')}"></div>
          <div class="form-group"><label><input type="checkbox" name="hasParking" ${resort.hasParking ? 'checked' : ''}> Parking</label></div>
          <div class="form-group"><label><input type="checkbox" name="hasRentals" ${resort.hasRentals ? 'checked' : ''}> Rentals</label></div>
          <div class="form-group"><label><input type="checkbox" name="hasSkiSchool" ${resort.hasSkiSchool ? 'checked' : ''}> Ski school</label></div>
          <div class="form-group"><label><input type="checkbox" name="hasSnowmaking" ${resort.hasSnowmaking ? 'checked' : ''}> Snowmaking</label></div>
          <div class="form-group"><label><input type="checkbox" name="hasRestaurants" ${resort.hasRestaurants ? 'checked' : ''}> Restaurants</label></div>
          <div class="form-group"><label><input type="checkbox" name="hasHotels" ${resort.hasHotels ? 'checked' : ''}> Hotels</label></div>
          <div class="form-group"><label>Opening date</label><input name="openingDate" type="date" value="${esc(resort.openingDate || '')}"></div>
          <div class="form-group"><label>Closing date</label><input name="closingDate" type="date" value="${esc(resort.closingDate || '')}"></div>
          <div class="form-group full"><label>Parking info</label><textarea name="parkingInfo">${esc(resort.parkingInfo || '')}</textarea></div>
          <div class="form-group full"><label>Ski school info</label><textarea name="skiSchoolInfo">${esc(resort.skiSchoolInfo || '')}</textarea></div>
          <div class="form-group full"><label>Rental info</label><textarea name="rentalInfo">${esc(resort.rentalInfo || '')}</textarea></div>
          <div class="form-group"><label>Visibility</label><select name="visibilityStatus">
            ${['active', 'hidden', 'closed', 'seasonal'].map((v) => `<option value="${v}" ${resort.visibilityStatus === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select></div>
          <div class="form-group"><label>Meta title</label><input name="metaTitle" value="${esc(resort.metaTitle || '')}"></div>
          <div class="form-group full"><label>Meta description</label><textarea name="metaDescription">${esc(resort.metaDescription || '')}</textarea></div>
        </div>
        <div id="duplicates-panel" class="card" style="margin-top:1rem;display:none"><div class="card-header">Possible duplicates</div><div class="card-body" id="duplicates-list"></div></div>
        ${id ? `<div class="card" style="margin-top:1rem"><div class="card-header">Images</div><div class="card-body form-grid">
          <div class="form-group"><label>Logo</label><input type="file" accept="image/*" data-upload="logo"></div>
          <div class="form-group"><label>Hero image</label><input type="file" accept="image/*" data-upload="hero"></div>
          <div class="form-group"><label>Gallery</label><input type="file" accept="image/*" multiple data-upload="gallery"></div>
        </div></div>` : ''}
        <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button type="submit" class="btn btn-primary">Save & publish</button>
          ${id ? '<button type="button" class="btn btn-danger" id="btn-merge-resort">Merge into…</button>' : ''}
        </div>
      </div></form>
      ${history.length ? `<div class="card"><div class="card-header">Change history</div><div class="card-body table-wrap"><table><thead><tr><th>When</th><th>Action</th><th>Actor</th></tr></thead><tbody>${history.map((h) => `<tr><td>${esc(new Date(h.created_at).toLocaleString())}</td><td>${esc(h.action)}</td><td>${esc(h.actor_id || '—')}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`

    const nameInput = content.querySelector('[name="officialName"]')
    let dupTimer
    nameInput?.addEventListener('input', () => {
      clearTimeout(dupTimer)
      dupTimer = setTimeout(async () => {
        const name = nameInput.value.trim()
        if (name.length < 2) return
        try {
          const d = await api('/ski-resorts/admin/duplicates?name=' + encodeURIComponent(name) + (id ? '&excludeId=' + id : ''))
          const panel = $('#duplicates-panel')
          const list = $('#duplicates-list')
          if ((d.duplicates || []).length) {
            panel.style.display = 'block'
            list.innerHTML = '<ul class="duplicate-list">' + d.duplicates.map((x) => `<li><span>${esc(x.official_name)} · ${esc(x.area_name)} (${Math.round((x.similarity_score || 0) * 100)}%)</span><button type="button" class="btn btn-small btn-secondary" data-merge-target="${x.id}">Merge</button></li>`).join('') + '</ul>'
            list.querySelectorAll('[data-merge-target]').forEach((btn) => {
              btn.addEventListener('click', () => mergeResorts(id, btn.getAttribute('data-merge-target')))
            })
          } else panel.style.display = 'none'
        } catch (_) { /* ignore */ }
      }, 400)
    })

    content.querySelectorAll('[data-upload]').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const files = e.target.files
        if (!files?.length || !id) return
        for (const file of files) {
          const b64 = await fileToBase64(file)
          await api('/ski-resorts/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resortId: id, type: input.getAttribute('data-upload'), image: b64, fileName: file.name }),
          })
        }
        toast('Image uploaded')
        openResortEditor(id)
      })
    })

    $('#btn-merge-resort')?.addEventListener('click', async () => {
      const targetId = prompt('Enter target resort ID to merge this resort into:')
      if (targetId) await mergeResorts(id, targetId)
    })

    $('#resort-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)
      const body = Object.fromEntries(fd.entries())
      body.aliases = String(body.aliases || '').split(',').map((s) => s.trim()).filter(Boolean)
      body.hasParking = !!fd.get('hasParking')
      body.hasRentals = !!fd.get('hasRentals')
      body.hasSkiSchool = !!fd.get('hasSkiSchool')
      body.hasSnowmaking = !!fd.get('hasSnowmaking')
      body.hasRestaurants = !!fd.get('hasRestaurants')
      body.hasHotels = !!fd.get('hasHotels')
      try {
        if (id) {
          await api('/ski-resorts/admin/resorts/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        } else {
          await api('/ski-resorts/admin/resorts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        }
        toast('Resort saved — live in mobile app on next refresh')
        switchPage('resorts')
      } catch (err) {
        toast(err.message, true)
      }
    })
  }

  async function mergeResorts(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return
    if (!confirm('Merge source resort into target? Users will be moved.')) return
    try {
      await api('/ski-resorts/admin/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId, targetId }) })
      toast('Resorts merged')
      switchPage('resorts')
    } catch (err) {
      toast(err.message, true)
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function renderPending() {
    content.innerHTML = '<div class="loading">Loading requests…</div>'
    try {
      const data = await api('/ski-resorts/admin/pending?status=pending')
      const rows = data.requests || []
      content.innerHTML = `<div class="card"><div class="card-header">Pending resort requests (${rows.length})</div>
        <div class="card-body table-wrap">${rows.length ? `<table><thead><tr>
          <th>Resort</th><th>Area</th><th>Region</th><th>Country</th><th>Requested by</th><th>Date</th><th>Notes</th><th>Actions</th>
        </tr></thead><tbody>${rows.map((r) => `<tr>
          <td>${esc(r.resortName)}</td>
          <td>${esc(r.areaName || '—')}</td>
          <td>${esc(r.regionName)}</td>
          <td>${esc(r.countryName)}</td>
          <td>${esc(r.requestedBy)}</td>
          <td>${esc(new Date(r.createdAt).toLocaleDateString())}</td>
          <td>${esc(r.notes || '—')}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-primary btn-small" data-approve="${r.id}">Approve</button>
            <button class="btn btn-secondary btn-small" data-reject="${r.id}">Reject</button>
            <button class="btn btn-danger btn-small" data-delete="${r.id}">Delete</button>
          </td>
        </tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted)">No pending requests.</p>'}
        </div></div>`
      content.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => handleApprove(btn.getAttribute('data-approve'))))
      content.querySelectorAll('[data-reject]').forEach((btn) => btn.addEventListener('click', () => handleReject(btn.getAttribute('data-reject'))))
      content.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => handleDeleteRequest(btn.getAttribute('data-delete'))))
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function handleApprove(requestId) {
    const row = await api('/ski-resorts/admin/pending?status=pending').then((d) => (d.requests || []).find((r) => r.id === requestId))
    if (!row) return
    let dupHtml = ''
    try {
      const d = await api('/ski-resorts/admin/duplicates?name=' + encodeURIComponent(row.resortName))
      if ((d.duplicates || []).length) {
        dupHtml = '<p><strong>Possible duplicates:</strong></p><ul class="duplicate-list">' + d.duplicates.map((x) => `<li><span>${esc(x.official_name)} (${Math.round((x.similarity_score || 0) * 100)}%)</span></li>`).join('') + '</ul>'
      }
    } catch (_) { /* ignore */ }

    openModal('Approve request', `
      ${dupHtml}
      <div class="form-group"><label>Mode</label><select id="approve-mode">
        <option value="create">Create new resort</option>
        <option value="merge">Merge into existing</option>
        <option value="keep">Keep existing (link only)</option>
        <option value="rename">Create with new name</option>
      </select></div>
      <div class="form-group" id="target-group" style="display:none"><label>Target resort ID</label><input id="approve-target"></div>
      <div class="form-group" id="rename-group" style="display:none"><label>New name</label><input id="approve-rename" value="${esc(row.resortName)}"></div>
    `, '<button type="button" class="btn btn-primary" id="confirm-approve">Approve</button>')

    const modeEl = $('#approve-mode')
    modeEl.addEventListener('change', () => {
      const m = modeEl.value
      $('#target-group').style.display = m === 'merge' || m === 'keep' ? 'block' : 'none'
      $('#rename-group').style.display = m === 'rename' ? 'block' : 'none'
    })
    $('#confirm-approve').addEventListener('click', async () => {
      try {
        await api('/ski-resorts/admin/pending/' + requestId + '/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: modeEl.value,
            targetResortId: $('#approve-target')?.value || null,
            renameTo: $('#approve-rename')?.value || null,
          }),
        })
        $('#modal').classList.add('hidden')
        toast('Request approved')
        renderPending()
      } catch (err) {
        toast(err.message, true)
      }
    })
  }

  async function handleReject(requestId) {
    const reason = prompt('Rejection reason (required):')
    if (!reason?.trim()) return
    try {
      await api('/ski-resorts/admin/pending/' + requestId + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      toast('Request rejected')
      renderPending()
    } catch (err) {
      toast(err.message, true)
    }
  }

  async function handleDeleteRequest(requestId) {
    if (!confirm('Delete this request?')) return
    try {
      await api('/ski-resorts/admin/pending/' + requestId, { method: 'DELETE' })
      toast('Deleted')
      renderPending()
    } catch (err) {
      toast(err.message, true)
    }
  }

  async function renderHierarchy(entity) {
    content.innerHTML = '<div class="loading">Loading…</div>'
    try {
      const data = await api('/ski-resorts/admin/' + entity)
      const rows = data[entity] || []
      content.innerHTML = `<div class="card"><div class="card-header">${entity}</div><div class="card-body table-wrap">
        <table><thead><tr>${entity === 'countries' ? '<th>ISO</th><th>Name</th><th>Active</th>' : entity === 'regions' ? '<th>Name</th><th>Slug</th><th>Country</th>' : '<th>Name</th><th>Slug</th><th>Region</th>'}</tr></thead>
        <tbody>${rows.map((r) => {
          if (entity === 'countries') return `<tr><td>${esc(r.iso_code)}</td><td>${esc(r.name)}</td><td>${r.active ? 'Yes' : 'No'}</td></tr>`
          if (entity === 'regions') return `<tr><td>${esc(r.name)}</td><td>${esc(r.slug)}</td><td>${esc(r.country_id)}</td></tr>`
          return `<tr><td>${esc(r.name)}</td><td>${esc(r.slug)}</td><td>${esc(r.region_id)}</td></tr>`
        }).join('')}</tbody></table></div></div>`
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function renderImport() {
    content.innerHTML = `
      <div class="card"><div class="card-header">Import resorts</div><div class="card-body">
        <p style="color:var(--text-muted);margin-bottom:1rem">Upload JSON or CSV. For OSM bulk import, run <code>node scripts/import-ski-resorts.mjs --osm</code> from the Skisterapp repo.</p>
        <input type="file" id="import-file" accept=".json,.csv,application/json,text/csv">
        <div id="import-preview" style="margin-top:1rem"></div>
        <button type="button" class="btn btn-primary" id="btn-import" disabled style="margin-top:1rem">Import</button>
        <pre id="import-report" style="margin-top:1rem;font-size:0.8rem;white-space:pre-wrap"></pre>
      </div></div>`
    let parsedRows = []
    $('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      parsedRows = file.name.endsWith('.csv') ? parseCsv(text) : JSON.parse(text)
      if (!Array.isArray(parsedRows)) parsedRows = parsedRows.resorts || []
      const preview = await api('/ski-resorts/admin/import/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: parsedRows }) })
      $('#import-preview').innerHTML = '<p>' + preview.total + ' rows · ' + (preview.preview || []).filter((x) => x.valid).length + ' valid (preview)</p>'
      $('#btn-import').disabled = !parsedRows.length
    })
    $('#btn-import').addEventListener('click', async () => {
      if (!parsedRows.length || !confirm('Import ' + parsedRows.length + ' rows?')) return
      try {
        const report = await api('/ski-resorts/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: parsedRows }) })
        $('#import-report').textContent = JSON.stringify(report.report, null, 2)
        toast('Import complete')
      } catch (err) {
        toast(err.message, true)
      }
    })
  }

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const vals = line.split(',')
      const row = {}
      headers.forEach((h, i) => { row[h] = (vals[i] || '').trim() })
      return row
    })
  }

  async function renderAnalytics() {
    content.innerHTML = '<div class="loading">Loading analytics…</div>'
    try {
      const [homeData, platformData] = await Promise.all([
        api('/ski-resorts/admin/analytics/home-resorts'),
        api('/ski-resorts/admin/analytics/platform').catch(() => null),
      ])
      const rows = homeData.topHomeResorts || []
      const platform = platformData?.stats
      content.innerHTML = `
        ${platform ? `<div class="stats">
          <div class="stat"><div class="num">${platform.totalCommunities}</div><div class="lbl">Communities</div></div>
          <div class="stat"><div class="num">${platform.totalClubs}</div><div class="lbl">Clubs</div></div>
          <div class="stat"><div class="num">${platform.upcomingEvents}</div><div class="lbl">Upcoming Events</div></div>
          <div class="stat"><div class="num">${platform.gearListingsAtResorts}</div><div class="lbl">Gear at Resorts</div></div>
          <div class="stat"><div class="num">${platform.pendingReports}</div><div class="lbl">Pending Reports</div></div>
        </div>` : ''}
        <div class="card"><div class="card-header">Top 50 home Ski Networks</div><div class="card-body table-wrap">
        <table><thead><tr><th>Resort</th><th>Users</th><th>Searches</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.official_name)}</td><td>${r.home_selection_count ?? 0}</td><td>${r.search_hit_count ?? 0}</td></tr>`).join('')}</tbody></table></div></div>`
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function renderCommunities() {
    content.innerHTML = '<div class="loading">Loading communities…</div>'
    try {
      const data = await api('/ski-resorts/admin/communities')
      const rows = data.communities || []
      content.innerHTML = `<div class="card"><div class="card-header">Resort communities (${rows.length})</div>
        <div class="card-body table-wrap">${rows.length ? `<table><thead><tr><th>Name</th><th>Resort</th><th>Members</th><th>Slug</th></tr></thead>
        <tbody>${rows.map((r) => {
          const resort = r.ski_resorts
          return `<tr><td>${esc(r.name)}</td><td>${esc(resort?.official_name || r.resort_id)}</td><td>${r.member_count ?? 0}</td><td>${esc(r.slug)}</td></tr>`
        }).join('')}</tbody></table>` : '<p style="color:var(--text-muted)">No communities yet.</p>'}</div></div>`
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function renderClubs() {
    content.innerHTML = '<div class="loading">Loading clubs…</div>'
    try {
      const data = await api('/ski-resorts/admin/clubs')
      const rows = data.clubs || []
      content.innerHTML = `<div class="card"><div class="card-header">Ski clubs</div><div class="card-body table-wrap">
        ${rows.length ? `<table><thead><tr><th>Name</th><th>Resort</th><th>Members</th><th>Verified</th><th>Featured</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.ski_resorts?.official_name || '')}</td><td>${r.member_count ?? 0}</td><td>${r.is_verified ? 'Yes' : 'No'}</td><td>${r.is_featured ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted)">No clubs yet.</p>'}
      </div></div>`
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function renderEvents() {
    content.innerHTML = '<div class="loading">Loading events…</div>'
    try {
      const data = await api('/ski-resorts/admin/events')
      const rows = data.events || []
      content.innerHTML = `<div class="card"><div class="card-header">Resort events</div><div class="card-body table-wrap">
        ${rows.length ? `<table><thead><tr><th>Title</th><th>Resort</th><th>Type</th><th>Starts</th><th>Attendees</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.title)}</td><td>${esc(r.ski_resorts?.official_name || '')}</td><td>${esc(r.event_type)}</td><td>${esc(new Date(r.starts_at).toLocaleString())}</td><td>${r.attendee_count ?? 0}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted)">No events yet.</p>'}
      </div></div>`
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  async function renderModeration() {
    content.innerHTML = '<div class="loading">Loading moderation queue…</div>'
    try {
      const [reports, feed] = await Promise.all([
        api('/ski-resorts/admin/reports?status=pending'),
        api('/ski-resorts/admin/feed?status=approved'),
      ])
      const reportRows = reports.reports || []
      const feedRows = feed.posts || []
      content.innerHTML = `
        <div class="card"><div class="card-header">Pending reports (${reportRows.length})</div><div class="card-body table-wrap">
          ${reportRows.length ? `<table><thead><tr><th>Type</th><th>Reason</th><th>Reporter</th><th>Date</th><th></th></tr></thead>
          <tbody>${reportRows.map((r) => `<tr>
            <td>${esc(r.target_type)}</td><td>${esc(r.reason)}</td><td>${esc(r.reporter?.name || '—')}</td>
            <td>${esc(new Date(r.created_at).toLocaleDateString())}</td>
            <td><button class="btn btn-small btn-secondary" data-dismiss-report="${r.id}" data-target="${r.target_id}">Dismiss</button>
            <button class="btn btn-small btn-danger" data-hide-report="${r.id}" data-target="${r.target_id}">Hide post</button></td>
          </tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted)">No pending reports.</p>'}
        </div></div>
        <div class="card" style="margin-top:1rem"><div class="card-header">Recent community posts</div><div class="card-body">
          ${feedRows.slice(0, 10).map((p) => `<div style="padding:0.75rem 0;border-bottom:1px solid var(--border)"><strong>${esc(p.profiles?.name || 'User')}</strong><p style="margin:0.25rem 0;font-size:0.9rem">${esc(p.content)}</p><span style="font-size:0.75rem;color:var(--text-muted)">${esc(new Date(p.created_at).toLocaleString())}</span></div>`).join('') || '<p style="color:var(--text-muted)">No posts.</p>'}
        </div></div>`
      content.querySelectorAll('[data-dismiss-report]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api('/ski-resorts/admin/reports/' + btn.getAttribute('data-dismiss-report') + '/moderate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dismiss' }),
          })
          toast('Report dismissed')
          renderModeration()
        })
      })
      content.querySelectorAll('[data-hide-report]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api('/ski-resorts/admin/reports/' + btn.getAttribute('data-hide-report') + '/moderate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'hide', targetId: btn.getAttribute('data-target') }),
          })
          toast('Content hidden')
          renderModeration()
        })
      })
    } catch (err) {
      content.innerHTML = '<div class="card"><div class="card-body">' + esc(err.message) + '</div></div>'
    }
  }

  function renderSettings() {
    content.innerHTML = `<div class="card"><div class="card-header">Settings</div><div class="card-body">
      <p>Resort data is published immediately to the mobile app via Supabase. Changes appear after app refresh or cache expiry.</p>
      <p style="margin-top:0.75rem;color:var(--text-muted)">Admin access uses Supabase Auth + <code>LANDING_CMS_BOOTSTRAP_ADMIN_IDS</code> or Team members in SEO CMS.</p>
      <p style="margin-top:0.75rem"><a href="seo-admin.html" class="btn btn-secondary btn-small">Manage CMS team</a></p>
    </div></div>`
  }

  async function init() {
    if (!supa) {
      $('#login-error').textContent = 'Supabase client failed to load.'
      $('#login-error').classList.add('show')
      return
    }
    const { data: { session } } = await supa.auth.getSession()
    if (session) {
      try {
        await afterLogin()
      } catch (err) {
        showLogin()
        $('#login-error').textContent = err.message
        $('#login-error').classList.add('show')
      }
    } else {
      showLogin()
    }
  }

  init()
})()
