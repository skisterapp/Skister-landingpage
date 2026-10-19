;(function () {
  'use strict'

  var LANG_STORAGE_KEY = 'skister-lang'
  var SUPPORTED = ['de', 'en', 'fr', 'es', 'it']

  function readStoredLang() {
    try {
      var stored = localStorage.getItem(LANG_STORAGE_KEY)
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored
    } catch (e) {}
    return null
  }

  function persistLang(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch (e) {}
  }

  function setMobileNavOpen(isOpen) {
    var links = document.getElementById('primary-nav-links')
    var toggle = document.getElementById('nav-menu-toggle')
    if (!links || !toggle) return
    links.classList.toggle('is-open', isOpen)
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
    var icon = toggle.querySelector('i')
    if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'
    var label = toggle.getAttribute('data-label-open')
    var labelClosed = toggle.getAttribute('data-label-closed')
    if (isOpen && label) toggle.setAttribute('aria-label', label)
    else if (!isOpen && labelClosed) toggle.setAttribute('aria-label', labelClosed)
  }

  function initMobileNav() {
    var toggle = document.getElementById('nav-menu-toggle')
    var links = document.getElementById('primary-nav-links')
    if (!toggle || !links) return
    toggle.addEventListener('click', function (e) {
      e.stopPropagation()
      var willOpen = toggle.getAttribute('aria-expanded') !== 'true'
      setMobileNavOpen(willOpen)
    })
    document.addEventListener('click', function (event) {
      if (!links.classList.contains('is-open')) return
      var nav = document.querySelector('nav')
      if (nav && !nav.contains(event.target)) setMobileNavOpen(false)
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMobileNavOpen(false)
    })
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 769px)').matches) setMobileNavOpen(false)
    })
  }

  function initLanguageButtons(onSelect) {
    var dropdown = document.getElementById('language-dropdown')
    var btn = document.querySelector('.language-btn')
    if (!dropdown) return
    dropdown.querySelectorAll('[data-lang]').forEach(function (option) {
      option.addEventListener('click', function () {
        var lang = option.getAttribute('data-lang')
        if (lang && onSelect) onSelect(lang)
      })
      option.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          var lang = option.getAttribute('data-lang')
          if (lang && onSelect) onSelect(lang)
        }
      })
    })
    document.addEventListener('click', function (event) {
      var selector = document.querySelector('.language-selector')
      if (!selector || !dropdown) return
      if (!selector.contains(event.target)) dropdown.classList.remove('active')
    })
    if (btn) {
      btn.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') dropdown.classList.remove('active')
      })
    }
  }

  function toggleLanguageDropdown() {
    var dropdown = document.getElementById('language-dropdown')
    var btn = document.querySelector('.language-btn')
    if (!dropdown) return
    var willOpen = !dropdown.classList.contains('active')
    dropdown.classList.toggle('active', willOpen)
    if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
  }

  function applyPageTitle(title) {
    if (title) document.title = title
  }

  window.SkisterLegalPageShell = {
    LANG_STORAGE_KEY: LANG_STORAGE_KEY,
    SUPPORTED: SUPPORTED,
    readStoredLang: readStoredLang,
    persistLang: persistLang,
    initMobileNav: initMobileNav,
    initLanguageButtons: initLanguageButtons,
    toggleLanguageDropdown: toggleLanguageDropdown,
    setMobileNavOpen: setMobileNavOpen,
    applyPageTitle: applyPageTitle,
  }
})()
