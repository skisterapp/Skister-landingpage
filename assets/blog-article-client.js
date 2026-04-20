/**
 * Static blog article page: prev/next, related posts, likes, comments (canonical /blog/slug/).
 * Expects document.body.dataset.blogSlug and matching DOM ids (see generateBlogs.js buildArticlePage).
 */
;(function () {
  var API_BASE = 'https://ayomhapkzckbhgwxenwr.supabase.co/functions/v1/make-server-080ebf84'
  var AUTH_HEADER = {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b21oYXBremNrYmhnd3hlbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDU5NzEsImV4cCI6MjA4NzE4MTk3MX0.z5ZOt2q6wG75jgr2qM9cSguDAwrq9scwt6YzRlXuKO8',
  }
  var BLOG_STORAGE_BASE =
    'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/make-080ebf84-blog-images'
  var PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'%3E%3Crect fill='%23111' width='120' height='80'/%3E%3C/svg%3E"

  function blogPath(slug) {
    return '/blog/' + encodeURIComponent(slug) + '/'
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
  }

  function resolveImageUrl(url) {
    if (!url || typeof url !== 'string') return null
    var trimmed = url.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('//')) return 'https:' + trimmed
    var path = trimmed.replace(/^\/+/, '')
    if (path) return BLOG_STORAGE_BASE + '/' + path.replace(/^make-080ebf84-blog-images\/?/, '')
    return null
  }

  function getFirstImageFromContent(html) {
    if (!html || typeof html !== 'string') return null
    var match = html.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i)
    return match ? match[1].trim() : null
  }

  function pickThumb(post) {
    var feat = resolveImageUrl(post.featuredImage)
    var first = resolveImageUrl(getFirstImageFromContent(post.content || ''))
    return feat || first || PLACEHOLDER
  }

  function formatDate(iso) {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (e) {
      return ''
    }
  }

  function getOrCreateVisitorId() {
    var key = 'skister_blog_visitor_id'
    try {
      var id = localStorage.getItem(key)
      if (id) return id
      id = 'v_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36)
      localStorage.setItem(key, id)
      return id
    } catch (e) {
      return 'v_anon_' + Date.now()
    }
  }

  function t(key) {
    var lang = 'en'
    try {
      lang = (localStorage && localStorage.getItem('skister-lang')) || 'en'
    } catch (e) {}
    var map = {
      prev: { en: 'Previous', de: 'Zurück' },
      next: { en: 'Next', de: 'Weiter' },
      noOlder: { en: 'First post', de: 'Erster Beitrag' },
      noNewer: { en: 'Latest post', de: 'Neuester Beitrag' },
      related: { en: 'More from the blog', de: 'Mehr vom Blog' },
    }
    var row = map[key]
    if (!row) return key
    return row[lang] || row.en
  }

  function navCardHtml(dir, post, isEmpty) {
    var label = dir === 'prev' ? t('prev') : t('next')
    var emptyTitle = dir === 'prev' ? t('noOlder') : t('noNewer')
    var baseCls = 'post-nav-btn post-nav-' + (dir === 'prev' ? 'prev' : 'next')
    if (isEmpty) {
      return (
        '<span class="' +
        baseCls +
        ' post-nav-empty" aria-disabled="true">' +
        '<span class="post-nav-inner">' +
        '<span class="post-nav-text-col">' +
        '<span class="post-nav-label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="post-nav-title">' +
        escapeHtml(emptyTitle) +
        '</span>' +
        '</span></span></span>'
      )
    }
    var thumb = pickThumb(post)
    var title = post.title || ''
    var href = blogPath(post.slug)
    var img =
      '<img class="post-nav-thumb" src="' +
      escapeHtml(thumb) +
      '" alt="" width="80" height="50" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' +
      PLACEHOLDER +
      "'\">"
    var col =
      '<span class="post-nav-text-col">' +
      '<span class="post-nav-label">' +
      escapeHtml(label) +
      '</span>' +
      '<span class="post-nav-title">' +
      escapeHtml(title) +
      '</span></span>'
    var inner = dir === 'prev' ? img + col : col + img
    return (
      '<a class="' + baseCls + '" href="' + escapeHtml(href) + '">' + '<span class="post-nav-inner">' + inner + '</span></a>'
    )
  }

  function loadRelatedNav(slug) {
    var navRow = document.getElementById('post-nav-row')
    var prevSlot = document.getElementById('post-nav-prev-slot')
    var nextSlot = document.getElementById('post-nav-next-slot')
    var wrap = document.getElementById('related-posts-wrap')
    var grid = document.getElementById('related-posts-grid')
    var details = document.getElementById('related-posts-details')
    if (!navRow || !prevSlot || !nextSlot) return

    fetch(API_BASE + '/blog/posts?forWebsite=1', { headers: AUTH_HEADER })
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        var posts = data.posts || (Array.isArray(data) ? data : [])
        var visible = posts.filter(function (p) {
          return p && !p.archived && p.showOnWebsite !== false
        })
        if (visible.length <= 1) {
          navRow.style.display = 'none'
          if (details) details.style.display = 'none'
          return
        }
        var chrono = visible.slice().sort(function (a, b) {
          return new Date(a.publishedTime) - new Date(b.publishedTime)
        })
        var idx = chrono.findIndex(function (p) {
          return p.slug === slug
        })
        if (idx === -1) {
          navRow.style.display = 'none'
        } else {
          navRow.style.display = 'grid'
          if (idx > 0) prevSlot.innerHTML = navCardHtml('prev', chrono[idx - 1], false)
          else prevSlot.innerHTML = navCardHtml('prev', null, true)
          if (idx < chrono.length - 1) nextSlot.innerHTML = navCardHtml('next', chrono[idx + 1], false)
          else nextSlot.innerHTML = navCardHtml('next', null, true)
        }

        if (wrap && grid) {
          var byNewest = visible.slice().sort(function (a, b) {
            return new Date(b.publishedTime) - new Date(a.publishedTime)
          })
          var related = byNewest
            .filter(function (p) {
              return p.slug !== slug
            })
            .slice(0, 6)
          if (related.length === 0) {
            if (details) details.style.display = 'none'
          } else {
            if (details) {
              details.style.display = ''
              var sum = details.querySelector('summary')
              if (sum) sum.textContent = t('related')
            }
            grid.innerHTML = related
              .map(function (p) {
                var imgUrl = pickThumb(p)
                return (
                  '<a href="' +
                  escapeHtml(blogPath(p.slug)) +
                  '" class="related-post-card" role="listitem">' +
                  '<img class="related-post-thumb" src="' +
                  escapeHtml(imgUrl) +
                  '" alt="' +
                  escapeHtml(p.title || '') +
                  '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' +
                  PLACEHOLDER +
                  '\'">' +
                  '<span class="related-post-heading">' +
                  escapeHtml(p.title || '') +
                  '</span></a>'
                )
              })
              .join('')
          }
        }
      })
      .catch(function (e) {
        console.warn('Related/nav failed', e)
      })
  }

  async function loadLikes(slug) {
    var visitorId = getOrCreateVisitorId()
    var el = document.getElementById('like-count')
    var btn = document.getElementById('btn-like')
    var icon = document.getElementById('like-icon')
    var text = document.getElementById('like-text')
    if (!btn) return
    try {
      var res = await fetch(
        API_BASE + '/blog/posts/' + encodeURIComponent(slug) + '/likes?visitorId=' + encodeURIComponent(visitorId),
        { headers: AUTH_HEADER },
      )
      var data = await res.json()
      if (data.success) {
        if (el) el.textContent = data.count === 1 ? '1 like' : data.count + ' likes'
        btn.classList.toggle('liked', data.liked)
        if (icon) icon.className = data.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'
        if (text) text.textContent = data.liked ? 'Liked' : 'Like'
      }
    } catch (e) {
      console.warn('likes', e)
    }
  }

  async function toggleLike(slug) {
    var visitorId = getOrCreateVisitorId()
    var btn = document.getElementById('btn-like')
    if (btn) btn.disabled = true
    try {
      var res = await fetch(API_BASE + '/blog/posts/' + encodeURIComponent(slug) + '/likes', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, AUTH_HEADER),
        body: JSON.stringify({ visitorId: visitorId }),
      })
      var data = await res.json()
      if (data.success) loadLikes(slug)
    } catch (e) {
      console.warn('like', e)
    }
    if (btn) btn.disabled = false
  }

  async function loadComments(slug) {
    var listEl = document.getElementById('comments-list')
    var loadingEl = document.getElementById('comments-loading')
    if (!listEl) return
    try {
      var res = await fetch(API_BASE + '/blog/posts/' + encodeURIComponent(slug) + '/comments', {
        headers: AUTH_HEADER,
      })
      var data = await res.json()
      if (loadingEl) loadingEl.remove()
      if (data.success && Array.isArray(data.comments)) {
        if (data.comments.length === 0) {
          listEl.innerHTML =
            '<p class="comments-empty" style="padding:1rem 0;color:#b0b0b0;">No comments yet. Be the first to comment!</p>'
        } else {
          listEl.innerHTML = data.comments
            .map(function (c) {
              var dateStr = c.createdAt ? formatDate(c.createdAt) : ''
              var safeName = (c.authorName || 'Anonymous').replace(/</g, '&lt;').replace(/"/g, '&quot;')
              var safeContent = (c.content || '')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
              return (
                '<div class="comment-item"><div class="comment-author">' +
                safeName +
                '</div><div class="comment-date">' +
                escapeHtml(dateStr) +
                '</div><div class="comment-body">' +
                safeContent +
                '</div></div>'
              )
            })
            .join('')
        }
      } else {
        listEl.innerHTML = '<p style="color:#b0b0b0;">Could not load comments.</p>'
      }
    } catch (e) {
      if (loadingEl) loadingEl.remove()
      listEl.innerHTML = '<p style="color:#b0b0b0;">Could not load comments.</p>'
    }
  }

  async function submitComment(slug, e) {
    e.preventDefault()
    var nameInput = document.getElementById('comment-name')
    var contentInput = document.getElementById('comment-content')
    var errEl = document.getElementById('comment-error')
    var name = (nameInput && nameInput.value) || ''
    name = String(name).trim()
    var content = (contentInput && contentInput.value) || ''
    content = String(content).trim()
    if (errEl) {
      errEl.style.display = 'none'
      errEl.textContent = ''
    }
    if (!name) {
      if (errEl) {
        errEl.textContent = 'Please enter your name.'
        errEl.style.display = 'block'
      }
      return
    }
    if (!content) {
      if (errEl) {
        errEl.textContent = 'Please enter a comment.'
        errEl.style.display = 'block'
      }
      return
    }
    try {
      var res = await fetch(API_BASE + '/blog/posts/' + encodeURIComponent(slug) + '/comments', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, AUTH_HEADER),
        body: JSON.stringify({ authorName: name, content: content }),
      })
      var data = await res.json()
      if (data.success) {
        if (nameInput) nameInput.value = ''
        if (contentInput) contentInput.value = ''
        var successMsg = document.getElementById('comment-success-msg')
        if (successMsg) {
          successMsg.textContent = "Thank you! Your comment will appear after it's approved."
          successMsg.style.display = 'block'
          setTimeout(function () {
            successMsg.style.display = 'none'
          }, 6000)
        }
        loadComments(slug)
      } else {
        if (errEl) {
          errEl.textContent = data.error || 'Failed to post comment.'
          errEl.style.display = 'block'
        }
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = 'Failed to post comment. Try again.'
        errEl.style.display = 'block'
      }
    }
  }

  function initEngagement(slug) {
    loadLikes(slug)
    loadComments(slug)
    var btnLike = document.getElementById('btn-like')
    if (btnLike)
      btnLike.addEventListener('click', function () {
        toggleLike(slug)
      })
    var form = document.getElementById('comment-form')
    if (form)
      form.addEventListener('submit', function (e) {
        submitComment(slug, e)
      })
  }

  function run() {
    var slug = document.body && document.body.getAttribute('data-blog-slug')
    if (!slug || !String(slug).trim()) return
    slug = String(slug).trim()
    loadRelatedNav(slug)
    initEngagement(slug)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
  else run()
})()
