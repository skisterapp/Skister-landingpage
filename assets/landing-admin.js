function cmsLogout() {
    sessionStorage.removeItem('landingAdminAuth');
    sessionStorage.removeItem('landingAdminPassword');
    sessionStorage.removeItem('adminAuthenticated');
    window.location.href = 'admin.html';
}

const API_BASE = 'https://ayomhapkzckbhgwxenwr.supabase.co/functions/v1/make-server-080ebf84';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b21oYXBremNrYmhnd3hlbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDU5NzEsImV4cCI6MjA4NzE4MTk3MX0.z5ZOt2q6wG75jgr2qM9cSguDAwrq9scwt6YzRlXuKO8';

const LANGUAGES = [
    { code: 'de', name: 'Deutsch', short: 'DE' },
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'fr', name: 'Français', short: 'FR' },
    { code: 'es', name: 'Español', short: 'ES' },
    { code: 'it', name: 'Italiano', short: 'IT' }
];

const SECTIONS = [
    { id: 'nav', title: 'Navigation' },
    { id: 'hero', title: 'Hero' },
    { id: 'messages', title: 'Messages' },
    { id: 'onboarding', title: 'Onboarding' },
    { id: 'features', title: 'Features' },
    { id: 'platform', title: 'Platform' },
    { id: 'home', title: 'Blog teaser' },
    { id: 'download', title: 'Download' },
    { id: 'faq', title: 'FAQ' },
    { id: 'disclaimer', title: 'Disclaimer' },
    { id: 'footer', title: 'Footer' },
    { id: 'modal', title: 'Modals' }
];

const SECTION_TABS = [{ id: 'images', title: 'Images' }].concat(SECTIONS).concat([{ id: 'links', title: 'Links' }]);

const DEFAULT_HERO_IMAGE = 'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterAppPro227.png';

const SECTION_ANCHORS = {
    nav: '',
    hero: '',
    messages: '',
    onboarding: '#how-it-works',
    features: '#features',
    platform: '#features',
    home: '#home-blog-strip',
    download: '#download',
    faq: '#faq',
    disclaimer: '.disclaimer',
    footer: 'footer',
    modal: ''
};

const ALL_KEYS = [
    'nav.howItWorks', 'nav.features', 'nav.faq', 'nav.blog', 'nav.contact', 'nav.download',
    'hero.title', 'hero.tagline', 'hero.subtitle', 'hero.emailPlaceholder', 'hero.submitBtn', 'hero.waitlistInfo',
    'messages.success', 'messages.duplicate', 'messages.error', 'messages.serverError',
    'onboarding.title', 'onboarding.subtitle',
    'onboarding.step1.title', 'onboarding.step1.description', 'onboarding.step1.feature1', 'onboarding.step1.feature2', 'onboarding.step1.feature3',
    'onboarding.step2.title', 'onboarding.step2.description', 'onboarding.step2.feature1', 'onboarding.step2.feature2', 'onboarding.step2.feature3',
    'onboarding.step3.title', 'onboarding.step3.description', 'onboarding.step3.feature1', 'onboarding.step3.feature2', 'onboarding.step3.feature3',
    'onboarding.step4.title', 'onboarding.step4.description', 'onboarding.step4.feature1', 'onboarding.step4.feature2', 'onboarding.step4.feature3',
    'onboarding.step5.title', 'onboarding.step5.description', 'onboarding.step5.feature1', 'onboarding.step5.feature2', 'onboarding.step5.feature3',
    'onboarding.step6.title', 'onboarding.step6.description', 'onboarding.step6.feature1', 'onboarding.step6.feature2', 'onboarding.step6.feature3',
    'onboarding.step7.title', 'onboarding.step7.description', 'onboarding.step7.feature1', 'onboarding.step7.feature2', 'onboarding.step7.feature3',
    'features.title', 'features.subtitle', 'features.share.title', 'features.share.description', 'features.family.title', 'features.family.description',
    'features.free.title', 'features.free.description', 'features.reminders.title', 'features.reminders.description',
    'features.private.title', 'features.private.description', 'features.local.title', 'features.local.description',
    'features.resorts.title', 'features.resorts.description',
    'platform.title', 'platform.ios', 'platform.android',
    'home.blog.title', 'home.blog.subtitle', 'home.blog.viewAll',
    'download.title', 'download.subtitle', 'download.apple.line1', 'download.apple.line2', 'download.android.line1', 'download.android.line2',
    'download.badge', 'download.hint',
    'faq.title', 'faq.q1', 'faq.a1', 'faq.q2', 'faq.a2', 'faq.q3', 'faq.a3', 'faq.q4', 'faq.a4', 'faq.q5', 'faq.a5',
    'disclaimer.title', 'disclaimer.text',
    'footer.product', 'footer.features', 'footer.faq', 'footer.feedback', 'footer.legal', 'footer.privacy', 'footer.terms',
    'footer.support', 'footer.contact', 'footer.rights', 'footer.madewith',
    'modal.privacy.title', 'modal.privacy.intro', 'modal.privacy.p1', 'modal.privacy.collection', 'modal.privacy.collectionText',
    'modal.privacy.usage', 'modal.privacy.usageText', 'modal.privacy.sharing', 'modal.privacy.sharingText', 'modal.privacy.contactEmail',
    'modal.terms.title', 'modal.terms.intro', 'modal.terms.acceptance', 'modal.terms.acceptanceText', 'modal.terms.service', 'modal.terms.serviceText',
    'modal.terms.liability', 'modal.terms.liabilityText',
    'modal.contact.title', 'modal.contact.intro', 'modal.contact.email', 'modal.contact.response',
    'modal.feedback.title', 'modal.feedback.intro', 'modal.feedback.email'
];

const KEY_LABELS = {
    'nav.howItWorks': 'How it works link',
    'nav.features': 'Features link',
    'nav.faq': 'FAQ link',
    'nav.blog': 'Blog link',
    'nav.contact': 'Contact link',
    'nav.download': 'Download link',
    'hero.title': 'Main headline',
    'hero.tagline': 'Tagline',
    'hero.subtitle': 'Subtitle',
    'hero.emailPlaceholder': 'Email placeholder',
    'hero.submitBtn': 'Submit button',
    'hero.waitlistInfo': 'Waitlist info text',
    'messages.success': 'Success message',
    'messages.duplicate': 'Duplicate email message',
    'messages.error': 'Error message',
    'messages.serverError': 'Server error message',
    'onboarding.title': 'Section title',
    'onboarding.subtitle': 'Section subtitle',
    'home.blog.title': 'Blog section title',
    'home.blog.subtitle': 'Blog section subtitle',
    'home.blog.viewAll': 'View all posts link',
    'faq.title': 'FAQ section title',
    'disclaimer.title': 'Disclaimer title',
    'disclaimer.text': 'Disclaimer body',
    'download.title': 'Download section title',
    'download.subtitle': 'Download section subtitle',
    'download.badge': 'Coming soon badge',
    'download.hint': 'Tap hint text'
};

let content = { translations: {}, images: {} };
let savedSnapshot = '';
let currentLang = 'de';
let currentSectionTab = 'hero';
let siteDefaults = null;
let previewReady = false;
let previewDebounceTimer = null;
let translateScope = 'section';
let fieldInputBound = false;

function getSection(key) {
    const parts = key.split('.');
    if (parts[0] === 'modal') return 'modal';
    if (parts[0] === 'home') return 'home';
    return parts[0];
}

function formatKeyLabel(key) {
    if (KEY_LABELS[key]) return KEY_LABELS[key];
    const parts = key.split('.');
    const last = parts[parts.length - 1];
    const readable = last.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1').trim();
    const section = parts.slice(0, -1).join(' ');
    return (section ? section + ' — ' : '') + readable.charAt(0).toUpperCase() + readable.slice(1);
}

function isLongField(key) {
    return key.indexOf('faq.a') === 0 || key.indexOf('modal.') === 0 || key === 'disclaimer.text'
        || key.indexOf('description') !== -1 || key.indexOf('Text') !== -1
        || key.indexOf('intro') !== -1 || key.indexOf('email') !== -1 || key === 'hero.subtitle';
}

function fieldId(key) {
    return 'key-' + currentLang + '-' + key.replace(/\./g, '-');
}

function getCompletionCount(lang) {
    const t = content.translations[lang] || {};
    let filled = 0;
    ALL_KEYS.forEach(function (key) {
        if (t[key] && String(t[key]).trim()) filled++;
    });
    return { filled, total: ALL_KEYS.length };
}

function snapshotContent() {
    return JSON.stringify({ translations: content.translations, images: content.images });
}

function updateUnsavedIndicator() {
    applyFormToContent();
    const dirty = snapshotContent() !== savedSnapshot;
    const el = document.getElementById('unsaved-indicator');
    if (el) el.classList.toggle('show', dirty);
}

function deepMerge(target, source) {
    const out = Object.assign({}, target);
    Object.keys(source || {}).forEach(function (key) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
            && typeof target[key] === 'object' && target[key]) {
            out[key] = deepMerge(target[key], source[key]);
        } else {
            out[key] = source[key];
        }
    });
    return out;
}

async function loadSiteDefaults() {
    try {
        const res = await fetch('index.html', { cache: 'no-store' });
        const html = await res.text();
        const marker = 'const translations = ';
        const start = html.indexOf(marker);
        if (start === -1) return null;
        const braceStart = html.indexOf('{', start);
        let depth = 0;
        let end = braceStart;
        for (let i = braceStart; i < html.length; i++) {
            if (html[i] === '{') depth++;
            if (html[i] === '}') depth--;
            if (depth === 0) {
                end = i + 1;
                break;
            }
        }
        const objectLiteral = html.slice(braceStart, end);
        return new Function('return ' + objectLiteral)();
    } catch (err) {
        console.warn('Could not load site defaults from index.html', err);
        return null;
    }
}

function mergeDefaultsWithOverrides(defaults, overrides) {
    const merged = {};
    LANGUAGES.forEach(function (lang) {
        merged[lang.code] = deepMerge((defaults && defaults[lang.code]) || {}, (overrides && overrides[lang.code]) || {});
    });
    return merged;
}

function normalizeLoadedContent(data) {
    if (!data || typeof data !== 'object') return null;
    let translations = {};
    let images = {};
    const c = data.content;
    if (c && typeof c === 'object') {
        if (c.translations && typeof c.translations === 'object') translations = c.translations;
        else if (c.de || c.en || c.fr || c.es || c.it) translations = c;
        if (c.images && typeof c.images === 'object') images = c.images;
    }
    if (data.translations && typeof data.translations === 'object') translations = data.translations;
    if (data.images && typeof data.images === 'object') images = data.images;
    return { translations, images };
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.remove('show');
    try {
        const res = await fetch(API_BASE + '/landing-admin-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + ANON_KEY,
                'X-Admin-Password': password
            }
        });
        const data = await res.json().catch(function () { return {}; });
        if (res.ok && data.ok) {
            sessionStorage.setItem('landingAdminAuth', 'true');
            sessionStorage.setItem('landingAdminPassword', password);
            showEditor();
        } else {
            errEl.classList.add('show');
        }
    } catch (err) {
        errEl.classList.add('show');
    }
}

function showEditor() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('editor').classList.add('show');
    initEditor();
}

async function initEditor() {
    await loadContent();
    renderSectionTabs();
    renderLangTabs();
    renderFields();
    initSectionTabFromHash();
    initPreview();
    bindFieldSearch();
    if (!fieldInputBound) {
        fieldInputBound = true;
        document.getElementById('form-panel').addEventListener('input', onFormInput);
    }
    attachImagePreviewListeners();
    window.addEventListener('beforeunload', function (e) {
        applyFormToContent();
        if (snapshotContent() !== savedSnapshot) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

async function checkAuth() {
    if (sessionStorage.getItem('landingAdminAuth')) showEditor();
}

async function loadContent() {
    try {
        siteDefaults = await loadSiteDefaults();
        const res = await fetch(API_BASE + '/landing-content', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY }
        });
        const data = await res.json().catch(function () { return {}; });
        let kvTranslations = {};
        let kvImages = {};
        if (res.ok) {
            const loaded = normalizeLoadedContent(data);
            if (loaded) {
                kvTranslations = loaded.translations && typeof loaded.translations === 'object' ? loaded.translations : {};
                kvImages = loaded.images && typeof loaded.images === 'object' ? loaded.images : {};
            }
        } else {
            showMessage('Failed to load content: ' + (data.error || res.status), true);
        }
        content = {
            translations: mergeDefaultsWithOverrides(siteDefaults, kvTranslations),
            images: Object.assign({ heroMascot: DEFAULT_HERO_IMAGE }, kvImages)
        };
        applyContentToForm();
        savedSnapshot = snapshotContent();
        updateUnsavedIndicator();
        updateSectionHint();
    } catch (err) {
        showMessage('Failed to load content.', true);
    }
}

function applyContentToForm() {
    const imgHero = document.getElementById('img-heroMascot');
    const imgOg = document.getElementById('img-ogImage');
    if (imgHero) imgHero.value = content.images.heroMascot || content.images.heroMascotUrl || '';
    if (imgOg) imgOg.value = content.images.ogImage || '';
    toggleImagePreviews();
    fillFieldValues();
}

function applyFormToContent() {
    const imgHero = document.getElementById('img-heroMascot');
    const imgOg = document.getElementById('img-ogImage');
    if (imgHero) content.images.heroMascot = imgHero.value.trim() || undefined;
    if (imgOg) content.images.ogImage = imgOg.value.trim() || undefined;
    if (!content.translations[currentLang]) content.translations[currentLang] = {};
    ALL_KEYS.forEach(function (key) {
        const el = document.getElementById(fieldId(key));
        if (el) content.translations[currentLang][key] = el.value;
    });
}

function renderLangTabs() {
    const html = LANGUAGES.map(function (l) {
        const c = getCompletionCount(l.code);
        const active = l.code === currentLang ? ' active' : '';
        return '<button type="button" class="landing-tab' + active + '" onclick="switchLang(\'' + l.code + '\')">' +
            l.name + '<span class="lang-badge">' + l.short + ' ' + c.filled + '/' + c.total + '</span></button>';
    }).join('');
    document.getElementById('lang-tabs').innerHTML = html;
}

function renderSectionTabs() {
    const container = document.getElementById('section-tab-nav');
    if (!container) return;
    container.innerHTML = SECTION_TABS.map(function (t) {
        const active = t.id === currentSectionTab ? ' active' : '';
        return '<button type="button" class="landing-section-tab-btn' + active + '" id="section-tab-' + t.id +
            '" onclick="switchSectionTab(\'' + t.id + '\')">' + t.title + '</button>';
    }).join('');
}

function switchLang(lang) {
    applyFormToContent();
    currentLang = lang;
    renderLangTabs();
    renderFields();
    applyFilterSearch();
    updateSectionHint();
    reloadPreviewLang();
    pushPreviewUpdate();
}

function updateSectionHint() {
    const el = document.getElementById('section-hint');
    if (!el) return;
    const langName = (LANGUAGES.find(function (l) { return l.code === currentLang; }) || {}).name || currentLang;
    if (currentSectionTab === 'links') {
        el.textContent = 'Reference only — choose Hero, FAQ, Download, etc. above to edit live page content.';
        return;
    }
    if (currentSectionTab === 'images') {
        el.textContent = 'Images shown on the landing page (hero mascot and social share preview).';
        return;
    }
    const sec = SECTIONS.find(function (s) { return s.id === currentSectionTab; });
    const keys = ALL_KEYS.filter(function (k) { return getSection(k) === currentSectionTab; });
    const previewParts = [];
    keys.slice(0, 2).forEach(function (key) {
        const val = ((content.translations[currentLang] || {})[key] || '').trim();
        if (val) previewParts.push(escapeHtml(formatKeyLabel(key) + ': “' + val.slice(0, 50) + (val.length > 50 ? '…' : '') + '”'));
    });
    el.innerHTML = '<strong>' + escapeHtml(sec ? sec.title : currentSectionTab) + '</strong> · ' + escapeHtml(langName) +
        ' · ' + keys.length + ' editable fields' +
        (previewParts.length ? '<br><span class="section-hint-preview">' + previewParts.join(' · ') + '</span>' : '');
}

function switchSectionTab(sectionId) {
    currentSectionTab = sectionId;
    document.querySelectorAll('.landing-section-tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.landing-section-tab-content').forEach(function (c) { c.classList.remove('active'); });
    const btn = document.getElementById('section-tab-' + sectionId);
    const panel = document.getElementById('tab-content-' + sectionId);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');
    const hash = sectionId === 'hero' ? '' : sectionId;
    if (location.hash !== '#' + hash) location.hash = hash ? '#' + hash : '#';
    updateSectionHint();
    scrollPreviewToSection(sectionId);
    const search = document.getElementById('field-search');
    if (search) {
        search.style.display = (sectionId === 'links' || sectionId === 'images') ? 'none' : '';
        search.value = '';
    }
    applyFilterSearch();
}

function initSectionTabFromHash() {
    const hash = (location.hash || '').replace(/^#/, '');
    const valid = SECTION_TABS.some(function (t) { return t.id === hash; });
    switchSectionTab(valid ? hash : 'hero');
}

function fillFieldValues() {
    ALL_KEYS.forEach(function (key) {
        const el = document.getElementById(fieldId(key));
        if (el) el.value = (content.translations[currentLang] || {})[key] || '';
    });
}

function renderFieldInput(key) {
    const id = fieldId(key);
    const label = formatKeyLabel(key);
    const long = isLongField(key);
    let html = '<div class="landing-field-row" data-field-key="' + key + '" data-field-label="' + label.toLowerCase() + '">';
    html += '<label>' + escapeHtml(label) + '<span class="field-key">' + escapeHtml(key) + '</span></label>';
    html += long
        ? '<textarea id="' + id + '" data-key="' + key + '"></textarea>'
        : '<input type="text" id="' + id + '" data-key="' + key + '">';
    html += '</div>';
    return html;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function renderFields() {
    const bySection = {};
    ALL_KEYS.forEach(function (key) {
        const section = getSection(key);
        if (!bySection[section]) bySection[section] = [];
        bySection[section].push(key);
    });

    SECTIONS.forEach(function (sec) {
        const keys = bySection[sec.id];
        const container = document.getElementById('section-fields-' + sec.id);
        if (!container || !keys || keys.length === 0) return;

        let html = '<h2>' + sec.title + '</h2>';

        if (sec.id === 'faq') {
            if (keys.includes('faq.title')) html += renderFieldInput('faq.title');
            for (let i = 1; i <= 5; i++) {
                const qKey = 'faq.q' + i;
                const aKey = 'faq.a' + i;
                html += '<div class="landing-faq-pair">';
                if (keys.includes(qKey)) html += renderFieldInput(qKey);
                if (keys.includes(aKey)) html += renderFieldInput(aKey);
                html += '</div>';
            }
        } else if (sec.id === 'modal') {
            const groups = { privacy: [], terms: [], contact: [], feedback: [] };
            keys.forEach(function (key) {
                const sub = key.split('.')[1];
                if (groups[sub]) groups[sub].push(key);
            });
            Object.keys(groups).forEach(function (name) {
                if (!groups[name].length) return;
                html += '<div class="landing-field-group"><div class="landing-field-group-title">' + name + ' modal</div>';
                groups[name].forEach(function (key) { html += renderFieldInput(key); });
                html += '</div>';
            });
        } else if (sec.id === 'onboarding') {
            const headerKeys = keys.filter(function (k) { return k === 'onboarding.title' || k === 'onboarding.subtitle'; });
            headerKeys.forEach(function (key) { html += renderFieldInput(key); });
            for (let i = 1; i <= 7; i++) {
                const stepKeys = keys.filter(function (k) { return k.indexOf('onboarding.step' + i + '.') === 0; });
                if (!stepKeys.length) continue;
                html += '<div class="landing-field-group"><div class="landing-field-group-title">Step ' + i + '</div>';
                stepKeys.forEach(function (key) { html += renderFieldInput(key); });
                html += '</div>';
            }
        } else {
            keys.forEach(function (key) { html += renderFieldInput(key); });
        }

        container.innerHTML = html;
    });
    fillFieldValues();
}

function bindFieldSearch() {
    const search = document.getElementById('field-search');
    if (!search) return;
    search.addEventListener('input', applyFilterSearch);
}

function applyFilterSearch() {
    const q = (document.getElementById('field-search').value || '').trim().toLowerCase();
    document.querySelectorAll('.landing-field-row[data-field-key]').forEach(function (row) {
        if (!q) {
            row.classList.remove('hidden-by-search');
            return;
        }
        const key = (row.getAttribute('data-field-key') || '').toLowerCase();
        const label = (row.getAttribute('data-field-label') || '').toLowerCase();
        row.classList.toggle('hidden-by-search', key.indexOf(q) === -1 && label.indexOf(q) === -1);
    });
}

function onFormInput() {
    updateUnsavedIndicator();
    schedulePreviewUpdate();
}

function toggleImagePreviews() {
    const mascot = document.getElementById('img-heroMascot').value.trim();
    const og = document.getElementById('img-ogImage').value.trim();
    const p1 = document.getElementById('preview-heroMascot');
    const p2 = document.getElementById('preview-ogImage');
    if (mascot) { p1.src = mascot; p1.style.display = 'block'; } else { p1.style.display = 'none'; }
    if (og) { p2.src = og; p2.style.display = 'block'; } else { p2.style.display = 'none'; }
}

function attachImagePreviewListeners() {
    const mascot = document.getElementById('img-heroMascot');
    const og = document.getElementById('img-ogImage');
    if (mascot) mascot.addEventListener('input', function () { toggleImagePreviews(); schedulePreviewUpdate(); updateUnsavedIndicator(); });
    if (og) og.addEventListener('input', function () { toggleImagePreviews(); schedulePreviewUpdate(); updateUnsavedIndicator(); });
}

function handleImageUpload(field, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const password = sessionStorage.getItem('landingAdminPassword') || '';
    const reader = new FileReader();
    reader.onload = async function () {
        try {
            const res = await fetch(API_BASE + '/landing/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + ANON_KEY,
                    'X-Admin-Password': password
                },
                body: JSON.stringify({ image: reader.result, fileName: file.name })
            });
            const data = await res.json();
            if (data.url) {
                document.getElementById('img-' + field).value = data.url;
                toggleImagePreviews();
                schedulePreviewUpdate();
                updateUnsavedIndicator();
                showMessage('Image uploaded. Click Save to publish.', false);
            } else {
                showMessage(data.error || 'Upload failed', true);
            }
        } catch (e) {
            showMessage('Upload failed', true);
        }
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function showMessage(text, isError) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = 'cms-message show ' + (isError ? 'error' : 'success');
    setTimeout(function () { el.classList.remove('show'); }, 5000);
}

function stripEmptyTranslationOverrides(translations) {
    const out = {};
    Object.keys(translations || {}).forEach(function (lang) {
        const langPack = translations[lang];
        if (!langPack || typeof langPack !== 'object') return;
        const cleaned = {};
        Object.keys(langPack).forEach(function (key) {
            const value = langPack[key];
            if (value != null && String(value).trim() !== '') cleaned[key] = value;
        });
        if (Object.keys(cleaned).length) out[lang] = cleaned;
    });
    return out;
}

/** Only persist values that differ from baked-in index.html defaults (per language). */
function getTranslationOverridesOnly(translations, defaults) {
    const out = {};
    LANGUAGES.forEach(function (lang) {
        const pack = (translations && translations[lang.code]) || {};
        const defPack = (defaults && defaults[lang.code]) || {};
        const cleaned = {};
        ALL_KEYS.forEach(function (key) {
            const value = pack[key];
            if (value == null || String(value).trim() === '') return;
            const defVal = defPack[key];
            if (defVal != null && String(defVal) === String(value)) return;
            cleaned[key] = value;
        });
        Object.keys(pack).forEach(function (key) {
            if (cleaned[key] !== undefined || ALL_KEYS.indexOf(key) === -1) {
                const value = pack[key];
                if (value != null && String(value).trim() !== '' && cleaned[key] === undefined) {
                    cleaned[key] = value;
                }
            }
        });
        if (Object.keys(cleaned).length) out[lang.code] = cleaned;
    });
    return out;
}

function countOverrideLangs(overrides) {
    return LANGUAGES.filter(function (l) {
        return overrides[l.code] && Object.keys(overrides[l.code]).length > 0;
    }).length;
}

async function saveContent() {
    applyFormToContent();
    const password = sessionStorage.getItem('landingAdminPassword');
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    const overrides = getTranslationOverridesOnly(content.translations, siteDefaults);
    const payload = {
        translations: overrides,
        images: content.images
    };
    try {
        const res = await fetch(API_BASE + '/landing-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + ANON_KEY,
                'X-Admin-Password': password || ''
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
                if (data.success) {
                    savedSnapshot = snapshotContent();
                    updateUnsavedIndicator();
                    const langCount = countOverrideLangs(overrides);
                    if (langCount === 1 && overrides.de && !overrides.en) {
                        showMessage('German saved. Other languages still use their defaults — use Translate → “All languages from Deutsch” to update EN, FR, ES, IT.', false);
                    } else {
                        showMessage('Content saved and published to the live site.', false);
                    }
                    reloadPreviewFrame();
                } else {
            showMessage(data.error || 'Save failed', true);
        }
    } catch (e) {
        showMessage('Save failed', true);
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-save"></i> Save';
}

function initPreview() {
    const frame = document.getElementById('preview-frame');
    if (!frame) return;
    window.addEventListener('message', function (event) {
        if (event.origin !== location.origin) return;
        if (event.data && event.data.type === 'skister-cms-preview-ready') {
            previewReady = true;
            pushPreviewUpdate();
            scrollPreviewToSection(currentSectionTab);
        }
    });
    reloadPreviewFrame();
}

function getPreviewUrl() {
    return 'index.html?cmsPreview=1&lang=' + encodeURIComponent(currentLang);
}

function reloadPreviewFrame() {
    previewReady = false;
    const frame = document.getElementById('preview-frame');
    if (frame) frame.src = getPreviewUrl();
}

function reloadPreviewLang() {
    previewReady = false;
    const frame = document.getElementById('preview-frame');
    if (frame) frame.src = getPreviewUrl();
}

function schedulePreviewUpdate() {
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(pushPreviewUpdate, 300);
}

function pushPreviewUpdate() {
    if (!previewReady) return;
    applyFormToContent();
    const frame = document.getElementById('preview-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
        type: 'skister-cms-preview',
        lang: currentLang,
        translations: content.translations,
        images: content.images
    }, location.origin);
}

function scrollPreviewToSection(sectionId) {
    const anchor = SECTION_ANCHORS[sectionId];
    if (!anchor || !previewReady) return;
    const frame = document.getElementById('preview-frame');
    if (!frame || !frame.contentWindow) return;
    try {
        const doc = frame.contentWindow.document;
        let el = null;
        if (anchor.startsWith('#')) el = doc.querySelector(anchor);
        else if (anchor.startsWith('.')) el = doc.querySelector(anchor);
        else el = doc.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { /* cross-origin guard */ }
}

function togglePreviewPanel() {
    const panel = document.getElementById('preview-panel');
    if (panel) panel.classList.toggle('collapsed');
}

function toggleTranslateMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('translate-menu');
    menu.classList.toggle('show');
}

document.addEventListener('click', function () {
    const menu = document.getElementById('translate-menu');
    if (menu) menu.classList.remove('show');
});

function openTranslateFromDeutsch() {
    document.getElementById('translate-menu').classList.remove('show');
    translateScope = 'all';
    document.getElementById('translate-modal-title').textContent = 'Translate all from Deutsch';
    document.getElementById('translate-modal-desc').textContent =
        'Translates every German field you customized into EN, FR, ES, and IT, replacing existing text in those languages.';
    const sourceSelect = document.getElementById('translate-source');
    sourceSelect.innerHTML = LANGUAGES.map(function (l) {
        return '<option value="' + l.code + '"' + (l.code === 'de' ? ' selected' : '') + '>' + l.name + '</option>';
    }).join('');
    sourceSelect.value = 'de';
    const targetsEl = document.getElementById('translate-targets');
    targetsEl.innerHTML = LANGUAGES.map(function (l) {
        return '<label class="cms-check-row"><input type="checkbox" class="translate-target-cb" value="' + l.code + '"' +
            (l.code !== 'de' ? ' checked' : '') + '> ' + l.name + '</label>';
    }).join('');
    document.querySelector('input[name="translate-mode"][value="overwrite"]').checked = true;
    document.getElementById('translate-modal').classList.add('show');
}

function openTranslateModal(scope) {
    translateScope = scope;
    document.getElementById('translate-menu').classList.remove('show');
    const title = document.getElementById('translate-modal-title');
    const desc = document.getElementById('translate-modal-desc');
    if (scope === 'section') {
        const sec = SECTIONS.find(function (s) { return s.id === currentSectionTab; });
        title.textContent = 'Translate this section';
        desc.textContent = 'Translate all filled fields in "' + (sec ? sec.title : currentSectionTab) + '" from the source language.';
    } else {
        title.textContent = 'Translate all languages';
        desc.textContent = 'Translate every filled field from the source language into the selected targets.';
    }
    const sourceSelect = document.getElementById('translate-source');
    sourceSelect.innerHTML = LANGUAGES.map(function (l) {
        const sel = l.code === currentLang ? ' selected' : '';
        return '<option value="' + l.code + '"' + sel + '>' + l.name + '</option>';
    }).join('');
    const targetsEl = document.getElementById('translate-targets');
    targetsEl.innerHTML = LANGUAGES.map(function (l) {
        return '<label class="cms-check-row"><input type="checkbox" class="translate-target-cb" value="' + l.code + '"' +
            (l.code !== currentLang ? ' checked' : '') + '> ' + l.name + '</label>';
    }).join('');
    document.querySelector('input[name="translate-mode"][value="fill"]').checked = true;
    document.getElementById('translate-modal').classList.add('show');
}

function closeTranslateModal() {
    document.getElementById('translate-modal').classList.remove('show');
}

function getKeysForTranslateScope() {
    if (translateScope === 'all') {
        const sourceLang = document.getElementById('translate-source')?.value || currentLang;
        const src = content.translations[sourceLang] || {};
        const defPack = (siteDefaults && siteDefaults[sourceLang]) || {};
        return ALL_KEYS.filter(function (key) {
            const val = src[key];
            if (!val || !String(val).trim()) return false;
            const defVal = defPack[key];
            return defVal == null || String(defVal) !== String(val);
        });
    }
    if (currentSectionTab === 'links' || currentSectionTab === 'images') return [];
    return ALL_KEYS.filter(function (key) { return getSection(key) === currentSectionTab; });
}

async function runTranslate() {
    applyFormToContent();
    const sourceLang = document.getElementById('translate-source').value;
    const targetLangs = Array.from(document.querySelectorAll('.translate-target-cb:checked'))
        .map(function (cb) { return cb.value; })
        .filter(function (code) { return code !== sourceLang; });
    const mode = document.querySelector('input[name="translate-mode"]:checked').value;
    const keys = getKeysForTranslateScope();
    const sourceTexts = {};
    const src = content.translations[sourceLang] || {};
    keys.forEach(function (key) {
        const val = src[key];
        if (val && String(val).trim()) sourceTexts[key] = String(val).trim();
    });
    const keyCount = Object.keys(sourceTexts).length;
    if (keyCount === 0) {
        showMessage('No text to translate in the source language for this scope.', true);
        return;
    }
    if (mode === 'overwrite' && !window.confirm('Overwrite existing translations for ' + keyCount + ' keys in ' + targetLangs.length + ' language(s)?')) {
        return;
    }
    if (!targetLangs.length) {
        showMessage('Select at least one target language.', true);
        return;
    }
    const btn = document.getElementById('translate-run-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Translating…';
    const password = sessionStorage.getItem('landingAdminPassword') || '';
    try {
        const res = await fetch(API_BASE + '/landing-translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + ANON_KEY,
                'X-Admin-Password': password
            },
            body: JSON.stringify({ sourceLang, texts: sourceTexts })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            if (res.status === 503) {
                showMessage('Translation not configured. Set GOOGLE_TRANSLATE_API_KEY in Supabase Edge secrets.', true);
            } else {
                showMessage(data.error || 'Translation failed', true);
            }
            return;
        }
        const translated = data.translations || {};
        targetLangs.forEach(function (lang) {
            if (!content.translations[lang]) content.translations[lang] = {};
            const langPack = translated[lang] || {};
            Object.keys(langPack).forEach(function (key) {
                if (!targetLangs.includes(lang)) return;
                const existing = (content.translations[lang][key] || '').trim();
                if (mode === 'fill' && existing) return;
                content.translations[lang][key] = langPack[key];
            });
        });
        closeTranslateModal();
        renderLangTabs();
        renderFields();
        applyFilterSearch();
        pushPreviewUpdate();
        updateUnsavedIndicator();
        showMessage('Translated ' + keyCount + ' strings. Review and click Save to publish.', false);
    } catch (e) {
        showMessage('Translation request failed.', true);
    }
    btn.disabled = false;
    btn.innerHTML = 'Translate';
}

window.addEventListener('DOMContentLoaded', checkAuth);
window.addEventListener('hashchange', function () {
    if (!document.getElementById('editor').classList.contains('show')) return;
    const hash = (location.hash || '').replace(/^#/, '');
    if (SECTION_TABS.some(function (t) { return t.id === hash; })) {
        currentSectionTab = hash;
        switchSectionTab(hash);
    }
});
