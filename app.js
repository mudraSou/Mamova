/* ============================================================
   POSTPARTUM GUIDE – app.js
   Plain ES6 single-page app. No frameworks, no build step.
   Serves from the same folder as index.html.

   Flow:
     init()
       ├─ getProfile() → null?
       │     └─ showOnboarding()     First-time setup (Phase 1a)
       └─ profile exists?
             ├─ updateTopBar()       Time-aware greeting
             ├─ showHome()           Day N home screen (Phase 1a)
             ├─ loadCards()          → Symptoms tab
             ├─ loadPositions()      → Positions tab
             └─ loadReviewers()      → Reviewer badges

   Card tap   → showSymptomDetail(slug)
   Position tap → showPositionDetail(slug)
   Back btn   → showSymptomList() / showPositionList()
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────── */

/** All SymptomCard objects once loaded from JSON. */
let allCards = [];

/** All Position objects once loaded from JSON. */
let allPositions = [];

/** Escalation card content loaded from JSON. */
let escalationCard = null;

/** Chat message history for current session. */
let chatMessages = [];

/**
 * Reviewer records keyed by id for fast lookup.
 * Loaded once from reviewers.json (Phase 1).
 * Phase 1b: replaced by a Supabase query on app init.
 * Shape: { [id]: { id, name, title, credentials[], specialization, hospital, city } }
 */
let reviewersById = {};


/* ─────────────────────────────────────────────────────────────
   ENTRY POINT
   ──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Wire up bottom nav tab switching
  document.getElementById('nav-symptoms')
    .addEventListener('click', () => {
      if (allCards.length > 0) showSymptomList();
      else loadCards(true);
    });

  document.getElementById('nav-positions')
    .addEventListener('click', () => {
      if (allPositions.length > 0) showPositionList();
      else loadPositions(true);
    });

  document.getElementById('nav-more')
    .addEventListener('click', () => {
      showChat();
    });

  // Dark mode — respect system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      document.documentElement.classList.toggle('dark', e.matches);
    });

  // Load reviewers in background — non-blocking
  loadReviewers();

  // ── Phase 1a: Profile-based routing ───────────────────────
  const profile = getProfile();
  if (!profile) {
    showOnboarding();
  } else {
    updateTopBar(profile);
    Promise.all([loadCards(false), loadPositions(false)]).then(() => showHome(profile));
  }
}


/* ═════════════════════════════════════════════════════════════
   PHASE 1A — PROFILE, ONBOARDING, HOME SCREEN
   ══════════════════════════════════════════════════════════ */

const PROFILE_KEY = 'pp_profile';

function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
}

function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/**
 * Time-aware greeting copy.
 * @returns {{ title: string, sub: string }}
 */
function getTimeGreeting(babyName) {
  const h    = new Date().getHours();
  const name = babyName ? `, ${babyName}` : '';
  if (h >= 1 && h < 5)  return { title: `3am is the hardest hour${name}.`,  sub: "You're still here. That's everything." };
  if (h >= 5 && h < 9)  return { title: `Good morning${name}.`,             sub: 'One feed at a time.' };
  if (h >= 9 && h < 17) return { title: `Hi${name}.`,                        sub: "What's worrying you today?" };
  if (h >= 17 && h < 21) return { title: `Evening${name}.`,                  sub: "You've done so much today." };
  return                         { title: `Night feed${name}?`,               sub: "We've got you." };
}

/**
 * Update the top bar with a personalised Day N + greeting.
 */
function updateTopBar(profile) {
  const titleEl = document.getElementById('top-bar-title');
  const subEl   = document.getElementById('top-bar-sub');
  if (!titleEl || !subEl) return;
  if (profile?.deliveryDate) {
    const day = calcDayN(profile.deliveryDate);
    titleEl.textContent = `Day ${day}${profile.babyName ? ' · ' + profile.babyName : ''}`;
    subEl.textContent   = getTimeGreeting().sub;
  } else {
    const g = getTimeGreeting(profile?.babyName);
    titleEl.textContent = g.title;
    subEl.textContent   = g.sub;
  }
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: ONBOARDING
   3-step form → localStorage. No server, no account.
   Phase 1b: replaced by Supabase magic link.
   ──────────────────────────────────────────────────────────── */

function showOnboarding() {
  const todayISO = new Date().toISOString().slice(0, 10);

  setContent(`
    <div class="onboarding-screen">

      <div class="onboarding-hero">
        <div class="onboarding-hero__icon" aria-hidden="true">
          <span class="material-symbols-outlined"
                style="font-variation-settings:'FILL' 1,'wght' 300,'GRAD' 0,'opsz' 48;">
            favorite
          </span>
        </div>
        <h1>Before we begin</h1>
        <p>Three quick things so we can personalise this for you.</p>
      </div>

      <form id="onboarding-form" class="onboarding-form" novalidate>

        <div class="onboarding-field">
          <label for="ob-name">Your baby's name</label>
          <input id="ob-name" type="text" placeholder="e.g. Meera"
                 autocomplete="off" maxlength="40" />
        </div>

        <div class="onboarding-field">
          <label for="ob-date">Delivery date <span aria-hidden="true">*</span></label>
          <input id="ob-date" type="date" max="${todayISO}" required />
          <p class="onboarding-field__hint">Used to show what's normal for your stage.</p>
        </div>

        <div class="onboarding-field">
          <label>Delivery type</label>
          <div class="delivery-type-group" role="radiogroup" aria-label="Delivery type">
            <label class="delivery-type-option">
              <input type="radio" name="delivery-type" value="vaginal" checked />
              <span class="delivery-type-option__label">
                <span class="material-symbols-outlined" aria-hidden="true">child_care</span>
                Vaginal
              </span>
            </label>
            <label class="delivery-type-option">
              <input type="radio" name="delivery-type" value="c-section" />
              <span class="delivery-type-option__label">
                <span class="material-symbols-outlined" aria-hidden="true">medical_services</span>
                C-section
              </span>
            </label>
          </div>
        </div>

        <p id="ob-error" class="onboarding-error" aria-live="polite" hidden></p>

        <button type="submit" class="onboarding-submit">
          Let's begin
          <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </button>

      </form>

      <p class="onboarding-privacy">
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        Saved only on this device. Never sent anywhere.
      </p>

    </div>
  `);

  const form    = document.getElementById('onboarding-form');
  const errorEl = document.getElementById('ob-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorEl.hidden = true;

    const babyName     = document.getElementById('ob-name').value.trim();
    const deliveryDate = document.getElementById('ob-date').value;
    const deliveryType = form.querySelector('input[name="delivery-type"]:checked')?.value ?? 'vaginal';

    if (!deliveryDate) {
      errorEl.textContent = 'Please enter your delivery date.';
      errorEl.hidden = false;
      document.getElementById('ob-date').focus();
      return;
    }

    const profile = { babyName, deliveryDate, deliveryType };
    saveProfile(profile);
    updateTopBar(profile);
    Promise.all([loadCards(false), loadPositions(false)])
      .then(() => showHome(profile));
  });
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: HOME
   Personalised Day N dashboard. Surfaces day-relevant symptoms
   and a delivery-type appropriate position.
   ──────────────────────────────────────────────────────────── */

const DAY_RANGES = [
  { days: [1, 3],  kw: ['afterpain', 'colostrum', 'first 24', 'first day'] },
  { days: [3, 7],  kw: ['day 3', 'day 4', 'day 5', 'milk comes in', 'engorg'] },
  { days: [5, 14], kw: ['cracked', 'mastit', 'first week', 'week 1', 'week 2'] },
  { days: [7, 30], kw: ['cluster', 'supply', 'week 2', 'week 3', 'week 4'] },
  { days: [14, 42],kw: ['ppd', 'postpartum depression', 'emotional', 'week 3', 'week 5', 'week 6'] },
];

function isDayRelevant(card, dayN) {
  const text = ((card.peak_timing ?? '') + ' ' + (card.what_it_is ?? '')).toLowerCase();
  return DAY_RANGES.some(r => dayN >= r.days[0] && dayN <= r.days[1] && r.kw.some(k => text.includes(k)));
}

function showHome(profile) {
  setNavActive('symptoms');
  const dayN       = calcDayN(profile.deliveryDate);
  const { title, sub } = getTimeGreeting(profile.babyName);
  const isCSection = profile.deliveryType === 'c-section';

  const todayCards = allCards.filter(c => isDayRelevant(c, dayN)).slice(0, 3);
  const featSlug   = isCSection ? 'football-hold' : 'cradle-hold';
  const featured   = allPositions.find(p => p.slug === featSlug);

  const todayHtml = todayCards.length > 0 ? `
    <section class="home-section" aria-labelledby="today-heading">
      <h2 id="today-heading" class="home-section__title">Common around Day ${dayN}</h2>
      <div class="home-quick-cards">
        ${todayCards.map(c => `
          <button class="home-quick-card" data-slug="${esc(c.slug)}" data-type="symptom" type="button">
            ${severityPill(c.severity)}
            <p class="home-quick-card__title">${esc(c.title_user)}</p>
            <p class="home-quick-card__cta">See what helps <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></p>
          </button>
        `).join('')}
      </div>
    </section>
  ` : '';

  const featHtml = featured ? `
    <section class="home-section" aria-labelledby="position-heading">
      <h2 id="position-heading" class="home-section__title">
        ${isCSection ? 'Recommended for C-section recovery' : 'Good place to start'}
      </h2>
      <button class="home-featured-position" data-slug="${esc(featured.slug)}" data-type="position" type="button">
        <div class="home-featured-position__icon" aria-hidden="true">
          <span class="material-symbols-outlined">${esc(featured.icon)}</span>
        </div>
        <div class="home-featured-position__text">
          <p class="home-featured-position__title">${esc(featured.title)}</p>
          <p class="home-featured-position__tagline">${esc(featured.tagline)}</p>
        </div>
        <span class="material-symbols-outlined home-featured-position__arrow" aria-hidden="true">chevron_right</span>
      </button>
    </section>
  ` : '';

  setContent(`
    <div class="home-screen">

      <header class="home-greeting">
        <div class="home-greeting__day" aria-label="Day ${dayN} of your postpartum journey">Day ${dayN}</div>
        <h1 class="home-greeting__title">${esc(title)}</h1>
        <p class="home-greeting__sub">${esc(sub)}</p>
      </header>

      <div class="home-nav-row" aria-label="Quick access">
        <button class="home-nav-btn" id="home-to-symptoms" type="button">
          <span class="material-symbols-outlined" aria-hidden="true">health_metrics</span>
          What's wrong?
        </button>
        <button class="home-nav-btn" id="home-to-positions" type="button">
          <span class="material-symbols-outlined" aria-hidden="true">self_care</span>
          How to feed
        </button>
        <button class="home-nav-btn" id="home-to-coach" type="button">
          <span class="material-symbols-outlined" aria-hidden="true">chat</span>
          Ask me
        </button>
      </div>

      ${todayHtml}
      ${featHtml}

      <div class="encouragement-banner" aria-hidden="true">
        <h4>You showed up. That's everything.</h4>
        <p>Every question you ask makes you a better mother. We're here at any hour.</p>
        <span class="material-symbols-outlined deco-icon">favorite</span>
      </div>

    </div>
  `);

  document.getElementById('home-to-symptoms')
    .addEventListener('click', () => { setNavActive('symptoms'); showSymptomList(); });
  document.getElementById('home-to-positions')
    .addEventListener('click', () => { setNavActive('positions'); showPositionList(); });
  document.getElementById('home-to-coach')
    .addEventListener('click', () => showChat());

  root().querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.type === 'symptom')  showSymptomDetail(btn.dataset.slug);
      if (btn.dataset.type === 'position') showPositionDetail(btn.dataset.slug);
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   DATA LOADING
   ──────────────────────────────────────────────────────────── */

/**
 * Fetch symptom cards. Returns a promise so callers can await it.
 * Only navigates to the list when called directly from nav — not from init().
 * @param {boolean} [navigate=true]  Pass false to load silently (home screen pre-fetch)
 */
async function loadCards(navigate = true) {
  if (navigate) showLoading();
  try {
    const res = await fetch('bf_symptom_cards.json');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    allCards = await res.json();
    if (!Array.isArray(allCards)) throw new Error('Unexpected data format');
    if (navigate) showSymptomList();
  } catch (err) {
    if (navigate) showError(err.message);
  }
}


/* ─────────────────────────────────────────────────────────────
   RENDER HELPERS
   ──────────────────────────────────────────────────────────── */

/** Shorthand for the root container. */
const root = () => document.getElementById('app-root');

/**
 * Write HTML into #app-root and trigger the screen-enter animation
 * defined in styles.css.
 * @param {string} html
 */
function setContent(html) {
  const el = root();
  el.innerHTML = html;
  // Attach animation to the first child so only new content animates
  const first = el.firstElementChild;
  if (first) {
    first.classList.remove('screen-enter'); // reset if re-rendering same screen
    void first.offsetWidth;                 // force reflow so animation replays
    first.classList.add('screen-enter');
  }
  // ── Item 7: Focus management — move focus to first heading ──
  // Screen readers announce the new screen; keyboard users land in the right place.
  const heading = el.querySelector('h1, h2, [role="heading"]');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

/**
 * ── Item 2: Day N calculation ───────────────────────────────
 * Clinical convention: Day 1 = day of birth (not Day 0).
 * "Days 1–3: afterpains" per the postpartum timeline.
 *
 * @param {string|Date} deliveryDate  ISO date string or Date object
 * @param {Date} [today]              Defaults to now; injectable for testing
 * @returns {number}  Day number (minimum 1, no upper cap — caller decides)
 */
function calcDayN(deliveryDate, today = new Date()) {
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - delivery) / 86_400_000);
  return Math.max(1, diff + 1); // +1: Day 1 on birth day; max 1: guard against future dates
}

/**
 * Safely escape a string so it can't inject HTML.
 * Used for all data coming out of the JSON.
 * @param {string|null|undefined} str
 * @returns {string}
 */
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


/* ─────────────────────────────────────────────────────────────
   SEVERITY PILL HELPER
   Maps the severity string from JSON → readable label + CSS class
   ──────────────────────────────────────────────────────────── */

const SEVERITY_MAP = {
  red:    { label: 'Urgent Care',      cls: 'severity-pill--red'    },
  yellow: { label: 'Attention Needed', cls: 'severity-pill--yellow' },
  green:  { label: 'All Good',         cls: 'severity-pill--green'  },
};

/**
 * Returns an HTML string for a coloured severity pill.
 * @param {string} severity  'red' | 'yellow' | 'green'
 * @returns {string}
 */
function severityPill(severity) {
  const s = SEVERITY_MAP[severity] ?? SEVERITY_MAP.green;
  return `<span class="severity-pill ${s.cls}">${s.label}</span>`;
}


/* ─────────────────────────────────────────────────────────────
   CATEGORY LABEL HELPER
   Maps the slug-style category value → display text
   ──────────────────────────────────────────────────────────── */

const CATEGORY_MAP = {
  'breast':         'Breast',
  'nipple':         'Nipple',
  'baby-behaviour': 'Baby Behaviour',
  'emotional':      'Emotional',
};

/**
 * Returns a human-readable category label.
 * Falls back gracefully to the raw value if not in the map.
 * @param {string} cat
 * @returns {string}
 */
function formatCategory(cat) {
  return CATEGORY_MAP[cat] ?? cat;
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: LOADING
   Structure matches symptoms-loading.html exactly:
   – Page header with pulsing dot
   – 5 skeleton cards (varied widths, last two fading out)
   – Each card has title bar, sub-label bar, icon square, two pill bars
   Uses .skeleton-pulse breathing animation from styles.css.
   Tailwind classes work here because the CDN is loaded on the page.
   ──────────────────────────────────────────────────────────── */

function showLoading() {
  // Title-bar widths, sub-label widths, pill widths, opacity — one entry per card
  const cards = [
    { title: 'w-3/4', sub: 'w-1/2', pill1: 'w-24', pill2: 'w-32', extra: '' },
    { title: 'w-2/3', sub: 'w-2/5', pill1: 'w-20', pill2: 'w-28', extra: '' },
    { title: 'w-5/6', sub: 'w-1/3', pill1: 'w-24', pill2: 'w-24', extra: '' },
    { title: 'w-3/5', sub: 'w-1/2', pill1: 'w-28', pill2: 'w-20', extra: '' },
    { title: 'w-1/2', sub: 'w-1/4', pill1: 'w-24', pill2: '',      extra: 'opacity-60' },
  ];

  const skeletons = cards.map(c => `
    <div class="bg-surface-container-low rounded-3xl p-6 transition-all ${c.extra}">
      <div class="flex justify-between items-start mb-6">
        <div class="space-y-3 flex-1">
          <div class="h-6 ${c.title} bg-surface-container-highest rounded-full skeleton-pulse"></div>
          <div class="h-4 ${c.sub}  bg-surface-container-high  rounded-full skeleton-pulse"></div>
        </div>
        <!-- Icon-placeholder square (matches the arrow_forward icon area in real cards) -->
        <div class="w-10 h-10 bg-surface-container-high rounded-2xl skeleton-pulse flex-shrink-0 ml-4"></div>
      </div>
      <div class="flex gap-3">
        <div class="h-8 ${c.pill1} bg-primary-container/30   rounded-full skeleton-pulse"></div>
        ${c.pill2 ? `<div class="h-8 ${c.pill2} bg-secondary-container/30 rounded-full skeleton-pulse"></div>` : ''}
      </div>
    </div>
  `).join('');

  setContent(`
    <div class="pt-6 pb-4 px-2">

      <!-- Page heading + animated loading indicator -->
      <div class="mb-10 text-center md:text-left px-2">
        <h1 class="font-headline text-4xl text-on-surface mb-3">Breastfeeding symptoms</h1>
        <div class="loading-status justify-center md:justify-start">
          <div class="loading-dot skeleton-pulse"></div>
          <p class="text-on-surface-variant">Loading symptoms…</p>
        </div>
      </div>

      <!-- Skeleton card list -->
      <div class="space-y-8">
        ${skeletons}
      </div>

    </div>
  `);
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: ERROR
   Structure matches symptom error state.html:
   – SVG organic blob behind the icon circle
   – cloud_off icon (light weight, secondary colour)
   – Heading + body copy
   – Primary gradient "Try again" button
   – Secondary "Back to home" text link (only shown if cards
     were previously loaded so there is a list to return to)
   – Two ambient background blobs (fixed, pointer-events-none)
   ──────────────────────────────────────────────────────────── */

/**
 * @param {string} [message]  Optional technical detail shown in tiny print.
 */
function showError(message = '') {
  setContent(`
    <div class="flex flex-col items-center justify-center text-center px-8 pt-12 pb-32 min-h-[55vh]">

      <!-- Icon illustration: SVG organic blob + icon circle -->
      <div class="relative mb-12">

        <!-- Soft atmospheric glow behind everything -->
        <div class="absolute -inset-10 bg-secondary-container/20 blur-3xl rounded-full"></div>

        <!-- Centred icon circle, layered on top of SVG -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 rounded-full bg-surface-container-low
                      border border-outline-variant/20
                      flex items-center justify-center">
            <span
              class="material-symbols-outlined text-secondary text-5xl"
              style="font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24;"
            >cloud_off</span>
          </div>
        </div>

        <!-- Organic blob SVG (decorative backdrop shape) -->
        <svg
          class="w-48 h-48 text-surface-container-high/40"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M45.7,-77.6C58.1,-69.5,66.4,-54.6,73.4,-39.8C80.4,-25.1,86.1,-10.5,85.6,3.9
               C85,18.3,78.2,32.5,69.5,45.3C60.8,58.1,50.1,69.5,37.3,75.8C24.4,82.1,9.4,83.4,
               -5,82.4C-19.4,81.4,-33.1,78.1,-46.3,71.5C-59.5,64.9,-72.1,55,-79.1,42.2
               C-86.2,29.4,-87.7,13.7,-85.4,-1.3C-83.1,-16.3,-77,-30.6,-68.2,-43.3
               C-59.4,-56,-47.9,-67.2,-34.5,-74.6C-21,-82,-10.5,-85.7,2.5,-90
               C15.4,-94.3,33.3,-85.8,45.7,-77.6Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <!-- Copy -->
      <div class="max-w-md mx-auto">
        <h1 class="text-3xl md:text-4xl text-on-surface font-semibold leading-tight mb-6 font-headline">
          We couldn't load the symptom cards right now.
        </h1>
        <p class="text-lg text-on-surface-variant leading-relaxed mb-12">
          Please check your connection or try again in a moment.
        </p>

        <!-- Buttons -->
        <div class="flex flex-col gap-6 items-center">

          <!-- Primary CTA – gradient pill button matching DESIGN.md -->
          <button
            id="retry-btn"
            type="button"
            class="group relative w-full sm:w-64 h-14
                   bg-gradient-to-r from-primary to-primary-dim
                   text-on-primary rounded-full font-semibold
                   shadow-[0_12px_24px_rgba(70,103,67,0.15)]
                   hover:shadow-[0_16px_32px_rgba(70,103,67,0.20)]
                   transition-all flex items-center justify-center gap-3"
          >
            <span class="material-symbols-outlined text-xl group-hover:rotate-45 transition-transform">
              refresh
            </span>
            Try again
          </button>

          <!-- Secondary link – only shown when a previous list load succeeded -->
          ${allCards.length > 0 ? `
            <button
              id="back-home-btn"
              type="button"
              class="text-primary font-bold px-8 py-3 rounded-full
                     hover:bg-primary-container/30 transition-colors
                     flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              Back to symptoms
            </button>
          ` : ''}

          <!-- Technical detail (non-alarming, tiny) -->
          ${message ? `
            <p class="text-[0.6875rem] text-on-surface-variant opacity-60 text-center">
              ${esc(message)}
            </p>
          ` : ''}

        </div>
      </div>

    </div>

    <!-- Ambient background glows – fixed so they fill the viewport -->
    <div class="fixed top-[20%] -left-20 w-80 h-80 bg-primary-container/10
                rounded-full blur-[100px] pointer-events-none -z-10"
         aria-hidden="true"></div>
    <div class="fixed bottom-[10%] -right-20 w-96 h-96 bg-secondary-container/15
                rounded-full blur-[120px] pointer-events-none -z-10"
         aria-hidden="true"></div>
  `);

  document.getElementById('retry-btn')
    .addEventListener('click', loadCards);

  // Only wired up when the button is actually rendered
  const backBtn = document.getElementById('back-home-btn');
  if (backBtn) backBtn.addEventListener('click', showSymptomList);
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: SYMPTOM LIST
   Renders all 25 cards from allCards.
   Matches the "symptoms_list.html" design.
   ──────────────────────────────────────────────────────────── */

function showSymptomList() {
  // Keep the Symptoms tab looking active in the bottom nav
  setNavActive('symptoms');

  // Build one card button per SymptomCard
  const cardsHtml = allCards.map(card => `
    <button
      class="symptom-card"
      data-slug="${esc(card.slug)}"
      aria-label="View symptom: ${esc(card.title_user)}"
      type="button"
    >
      <div class="symptom-card__top">
        <div>
          <p class="symptom-card__category">${esc(formatCategory(card.category))}</p>
          <p class="symptom-card__title">${esc(card.title_user)}</p>
          <p class="symptom-card__clinical">Clinical: ${esc(card.title_clinical)}</p>
        </div>
        ${severityPill(card.severity)}
      </div>
      <div class="symptom-card__action">
        View guide
        <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </div>
    </button>
  `).join('');

  setContent(`
    <div>
      <!-- Page heading -->
      <header class="symptoms-header">
        <h1>Breastfeeding<br>symptoms</h1>
        <p>Tap the symptom that feels closest to what you're experiencing.</p>
      </header>

      <!-- Card list -->
      <section class="symptom-card-list" aria-label="Breastfeeding symptom cards">
        ${cardsHtml}
      </section>

      <!-- Warm encouragement banner at the bottom of the list -->
      <div class="encouragement-banner" aria-hidden="true">
        <h4>You're doing great, Mama.</h4>
        <p>It's normal to have questions. We're here to guide you through every feed.</p>
        <span class="material-symbols-outlined deco-icon">favorite</span>
      </div>
    </div>
  `);

  // Wire up each card button → detail screen
  root().querySelectorAll('.symptom-card').forEach(btn => {
    btn.addEventListener('click', () => showSymptomDetail(btn.dataset.slug));
  });
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: SYMPTOM DETAIL
   Matches the "symptom detail.html" design.
   Renders all rich fields from the matching SymptomCard.
   ──────────────────────────────────────────────────────────── */

/**
 * Find the card by slug and render the full detail view.
 * @param {string} slug  e.g. 'engorgement'
 */
function showSymptomDetail(slug) {
  const card = allCards.find(c => c.slug === slug);

  // Guard: unknown slug (shouldn't happen in practice)
  if (!card) {
    showError(`Could not find symptom: ${slug}`);
    return;
  }

  // ── Build sub-sections ──────────────────────────────────────

  // Numbered relief steps
  const stepsHtml = (card.immediate_relief_steps ?? [])
    .sort((a, b) => a.order - b.order)
    .map(step => `
      <div class="step-card">
        <div class="step-number" aria-hidden="true">${step.order}</div>
        <div class="step-body">
          <p class="step-title">${esc(step.title)}</p>
          <p class="step-desc">${esc(step.description)}</p>
        </div>
      </div>
    `).join('');

  // Do's bullet items
  const dosHtml = (card.dos ?? [])
    .map(d => `<li>${esc(d)}</li>`)
    .join('');

  // Don'ts bullet items
  const dontsHtml = (card.donts ?? [])
    .map(d => `<li>${esc(d)}</li>`)
    .join('');

  // Red flag bullet items
  const redFlagsHtml = (card.red_flags ?? [])
    .map(f => `<li>${esc(f)}</li>`)
    .join('');

  // ── Assemble the full detail page ──────────────────────────

  setContent(`
    <div style="padding:1.25rem 1rem 2rem;">

      <!-- ── Back button ──────────────────────────────────── -->
      <button class="detail-back-btn" id="back-btn" type="button" aria-label="Back to symptoms list">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Symptoms
      </button>

      <!-- ── Severity pill + category badge ───────────────── -->
      <div class="detail-badges">
        ${severityPill(card.severity)}
        <span class="category-badge">${esc(formatCategory(card.category))}</span>
      </div>

      <!-- ── Main title (what the mother feels) ────────────── -->
      <h1 class="detail-title">${esc(card.title_user)}</h1>

      <!-- ── Clinical name ─────────────────────────────────── -->
      <p class="detail-clinical">
        <span class="material-symbols-outlined" aria-hidden="true">clinical_notes</span>
        Clinical: ${esc(card.title_clinical)}
      </p>

      <!-- ── "What this likely is" intro card ─────────────── -->
      <div class="detail-intro-card">
        <h3>What this likely is</h3>
        <p>${esc(card.what_it_is)}</p>
        ${card.peak_timing ? `
          <p>
            <strong style="color:var(--primary-dim);font-weight:700;">Typical timing:</strong>
            ${esc(card.peak_timing)}
          </p>` : ''}
      </div>

      <!-- ── Immediate relief steps ───────────────────────── -->
      <section aria-labelledby="steps-heading">
        <div class="detail-section-header">
          <div class="detail-section-divider" aria-hidden="true"></div>
          <h3 id="steps-heading">Immediate relief steps</h3>
          <div class="detail-section-divider" aria-hidden="true"></div>
        </div>
        <div class="step-list">
          ${stepsHtml || '<p style="color:var(--on-surface-variant);font-size:0.875rem;">No specific steps listed.</p>'}
        </div>
      </section>

      <!-- ── Do's and Don'ts bento grid ───────────────────── -->
      <section aria-label="Dos and Don'ts">
        <div class="dos-donts-grid">

          <div class="dos-box">
            <div class="dos-box__header">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              Do's
            </div>
            <ul>${dosHtml}</ul>
          </div>

          <div class="donts-box">
            <div class="donts-box__header">
              <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
              Don'ts
            </div>
            <ul>${dontsHtml}</ul>
          </div>

        </div>
      </section>

      <!-- ── Red flags callout ─────────────────────────────── -->
      <section class="red-flags-box" aria-labelledby="red-flags-heading">
        <div class="red-flags-box__header">
          <span class="material-symbols-outlined" aria-hidden="true">warning</span>
          <h3 id="red-flags-heading">Red flags — see a doctor if…</h3>
        </div>
        <ul>${redFlagsHtml}</ul>
        ${card.recommended_action_if_red_flags ? `
          <p class="red-flags-action">${esc(card.recommended_action_if_red_flags)}</p>
        ` : ''}
      </section>

      <!-- ── When to expect improvement ───────────────────── -->
      ${card.when_to_expect_improvement ? `
        <div class="improvement-block">
          <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
          <h4>When to expect improvement</h4>
          <p>${esc(card.when_to_expect_improvement)}</p>
        </div>
      ` : ''}

      <!-- ── Medical disclaimer ────────────────────────────── -->
      <footer class="disclaimer-footer">
        ${reviewerBadge(card.reviewed_by_id)}
        <span class="disclaimer-label">Medical Disclaimer</span>
        <p>${esc(card.disclaimer)}</p>
      </footer>

    </div>
  `);

  // Scroll smoothly to the top so the user sees the back button
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Wire up the back button → return to list
  document.getElementById('back-btn')
    .addEventListener('click', showSymptomList);
}


/* ─────────────────────────────────────────────────────────────
   NAVIGATION STATE
   Sets aria-current on the active bottom nav tab.
   Kept simple and extensible: pass the tab name as a string.
   ──────────────────────────────────────────────────────────── */

/**
 * Mark one bottom-nav tab as the current page.
 * @param {'symptoms'|'positions'|'more'} tab
 */
function setNavActive(tab) {
  ['symptoms', 'positions', 'more'].forEach(id => {
    const btn = document.getElementById(`nav-${id}`);
    if (!btn) return;
    const isActive = id === tab;
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');

    if (id === 'positions') {
      // Positions uses a CSS class for active state (Tailwind can't toggle inline)
      btn.classList.toggle('is-active', isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    } else if (id === 'symptoms') {
      btn.classList.toggle('bg-primary-container/60', isActive);
      btn.classList.toggle('text-primary', isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    } else if (id === 'more') {
      btn.classList.toggle('is-active', isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    }
  });
}


/* ═════════════════════════════════════════════════════════════
   IDEA A — BREASTFEEDING POSITIONS
   ══════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────
   DATA LOADING — POSITIONS
   ──────────────────────────────────────────────────────────── */

/**
 * Fetch positions. Returns a promise.
 * @param {boolean} [navigate=true]  Pass false to load silently.
 */
async function loadPositions(navigate = true) {
  if (navigate) { showLoading(); setNavActive('positions'); }
  try {
    const res = await fetch('bf_positions.json');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    allPositions = await res.json();
    if (!Array.isArray(allPositions)) throw new Error('Unexpected data format');
    if (navigate) showPositionList();
  } catch (err) {
    if (navigate) showError(err.message);
  }
}


/* ─────────────────────────────────────────────────────────────
   DATA LOADING — REVIEWERS
   ──────────────────────────────────────────────────────────── */

/**
 * Fetch reviewers.json and index records by id into reviewersById.
 * Called once on init — non-blocking; reviewer attribution degrades
 * gracefully if the file is unavailable.
 * Phase 1b: replace with a Supabase `select * from reviewers where active = true`.
 */
async function loadReviewers() {
  try {
    const res = await fetch('reviewers.json');
    if (!res.ok) return; // non-critical — don't surface errors to the user
    const list = await res.json();
    if (!Array.isArray(list)) return;
    list.forEach(r => { reviewersById[r.id] = r; });
  } catch {
    // Reviewer attribution is informational — never block the UI on this
  }
}


/* ─────────────────────────────────────────────────────────────
   REVIEWER BADGE HELPER
   ──────────────────────────────────────────────────────────── */

/**
 * Returns an HTML string for a reviewer attribution line.
 * Three states:
 *   - null id  → "review pending" notice (shown until doctors are assigned)
 *   - known id → reviewer name, credentials, specialisation
 *   - unknown id (stale FK) → empty string (silent degrade)
 *
 * @param {string|null} reviewedById  Value from content JSON's reviewed_by_id field
 * @returns {string}
 */
function reviewerBadge(reviewedById) {
  if (!reviewedById) {
    return `
      <p class="reviewer-pending">
        <span class="material-symbols-outlined" aria-hidden="true">pending</span>
        Medical review pending
      </p>`;
  }
  const r = reviewersById[reviewedById];
  if (!r) return ''; // stale reference — degrade silently

  const creds    = (r.credentials ?? []).join(', ');
  const location = [r.hospital, r.city].filter(Boolean).join(', ');

  return `
    <div class="reviewer-badge">
      <span class="material-symbols-outlined" aria-hidden="true">verified</span>
      <div class="reviewer-badge__info">
        <p class="reviewer-badge__name">
          Reviewed by ${esc(r.title)} ${esc(r.name)}${creds ? ` &mdash; ${esc(creds)}` : ''}
        </p>
        <p class="reviewer-badge__meta">
          ${esc(r.specialization)}${location ? ` &middot; ${esc(location)}` : ''}
        </p>
      </div>
    </div>`;
}


/* ─────────────────────────────────────────────────────────────
   DIFFICULTY LABEL HELPER
   ──────────────────────────────────────────────────────────── */

const DIFFICULTY_MAP = {
  beginner:     'Beginner-friendly',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
};

function formatDifficulty(d) {
  return DIFFICULTY_MAP[d] ?? d;
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: POSITION LIST
   ──────────────────────────────────────────────────────────── */

function showPositionList() {
  setNavActive('positions');

  const cardsHtml = allPositions.map(pos => {
    const tagsHtml = (pos.best_for ?? [])
      .map(t => `<span class="best-for-tag">${esc(t)}</span>`)
      .join('');

    return `
      <button
        class="position-card"
        data-slug="${esc(pos.slug)}"
        aria-label="View position: ${esc(pos.title)}"
        type="button"
      >
        <div class="position-card__top">
          <div class="position-card__icon" aria-hidden="true">
            <span class="material-symbols-outlined">${esc(pos.icon)}</span>
          </div>
          <div class="position-card__text">
            <p class="position-card__difficulty">${esc(formatDifficulty(pos.difficulty))}</p>
            <p class="position-card__title">${esc(pos.title)}</p>
            <p class="position-card__tagline">${esc(pos.tagline)}</p>
          </div>
        </div>
        ${tagsHtml ? `<div class="position-card__tags">${tagsHtml}</div>` : ''}
        <div class="position-card__action">
          View steps
          <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </div>
      </button>
    `;
  }).join('');

  setContent(`
    <div>
      <header class="positions-header">
        <h1>Breastfeeding<br>positions</h1>
        <p>Pick the position that feels right for you and your baby today.</p>
      </header>

      <section class="position-card-list" aria-label="Breastfeeding position guides">
        ${cardsHtml}
      </section>

      <div class="encouragement-banner" aria-hidden="true">
        <h4>Every latch is a learning moment.</h4>
        <p>It takes most mothers 4–6 weeks to feel confident. You're already doing it.</p>
        <span class="material-symbols-outlined deco-icon">spa</span>
      </div>
    </div>
  `);

  root().querySelectorAll('.position-card').forEach(btn => {
    btn.addEventListener('click', () => showPositionDetail(btn.dataset.slug));
  });
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: POSITION DETAIL
   Step-by-step cards + latch checklist + common mistakes
   ──────────────────────────────────────────────────────────── */

/**
 * @param {string} slug  e.g. 'cradle-hold'
 */
function showPositionDetail(slug) {
  const pos = allPositions.find(p => p.slug === slug);
  if (!pos) {
    showError(`Could not find position: ${slug}`);
    return;
  }

  // ── Steps ──────────────────────────────────────────────────
  const stepsHtml = (pos.steps ?? [])
    .sort((a, b) => a.order - b.order)
    .map(step => `
      <div class="step-card">
        <div class="step-number" aria-hidden="true">${step.order}</div>
        <div class="step-body">
          <p class="step-title">${esc(step.title)}</p>
          <p class="step-desc">${esc(step.instruction)}</p>
          ${step.tip ? `
            <div class="step-tip">
              <span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>
              ${esc(step.tip)}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

  // ── Latch checklist ────────────────────────────────────────
  const checklistHtml = (pos.latch_checklist ?? [])
    .map((item, i) => `
      <li data-check-index="${i}" role="checkbox" aria-checked="false" tabindex="0">
        ${esc(item)}
      </li>
    `).join('');

  // ── Common mistakes ────────────────────────────────────────
  const mistakesHtml = (pos.common_mistakes ?? [])
    .map(m => `
      <div class="mistake-card">
        <p class="mistake-card__label">Common mistake</p>
        <p class="mistake-card__mistake">${esc(m.mistake)}</p>
        <p class="mistake-card__fix-label">The fix</p>
        <p class="mistake-card__fix">${esc(m.fix)}</p>
      </div>
    `).join('');

  // ── Not ideal for ──────────────────────────────────────────
  const notIdealHtml = (pos.not_ideal_for ?? []).length > 0 ? `
    <div class="not-ideal-box" aria-label="When this position may not suit you">
      <div class="not-ideal-box__header">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        May not suit you if…
      </div>
      <ul>
        ${pos.not_ideal_for.map(n => `<li>${esc(n)}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  // ── Best for tags ──────────────────────────────────────────
  const tagsHtml = (pos.best_for ?? [])
    .map(t => `<span class="best-for-tag">${esc(t)}</span>`)
    .join('');

  setContent(`
    <div style="padding:1.25rem 1rem 2rem;">

      <!-- Back button -->
      <button class="detail-back-btn" id="back-btn" type="button" aria-label="Back to positions list">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Positions
      </button>

      <!-- Hero -->
      <div class="position-detail-hero">
        <div class="position-detail-hero__icon" aria-hidden="true">
          <span class="material-symbols-outlined">${esc(pos.icon)}</span>
        </div>
        <div class="position-detail-hero__text">
          <h1>${esc(pos.title)}</h1>
          <p>${esc(pos.tagline)}</p>
        </div>
      </div>

      <!-- Best for tags -->
      ${tagsHtml ? `
        <div style="margin-bottom:1.5rem;">
          <div class="detail-section-header" style="margin-bottom:0.625rem;">
            <h3 style="font-size:0.9375rem;font-family:var(--font-body);font-weight:700;color:var(--on-surface);">Best for</h3>
            <div class="detail-section-divider" aria-hidden="true"></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">${tagsHtml}</div>
        </div>
      ` : ''}

      <!-- Steps -->
      <section aria-labelledby="steps-heading">
        <div class="detail-section-header">
          <div class="detail-section-divider" aria-hidden="true"></div>
          <h3 id="steps-heading">Step-by-step</h3>
          <div class="detail-section-divider" aria-hidden="true"></div>
        </div>
        <div class="step-list">
          ${stepsHtml}
        </div>
      </section>

      <!-- Latch checklist -->
      <section aria-labelledby="latch-heading">
        <div class="detail-section-header">
          <div class="detail-section-divider" aria-hidden="true"></div>
          <h3 id="latch-heading">Latch checklist</h3>
          <div class="detail-section-divider" aria-hidden="true"></div>
        </div>
        <p style="font-size:0.875rem;color:var(--on-surface-variant);margin-bottom:1rem;line-height:1.6;">
          Tap each item to check it off during your feed.
        </p>
        <ul class="latch-checklist" aria-label="Latch quality checklist">
          ${checklistHtml}
        </ul>
      </section>

      <!-- Common mistakes -->
      ${mistakesHtml ? `
        <section aria-labelledby="mistakes-heading">
          <div class="detail-section-header">
            <div class="detail-section-divider" aria-hidden="true"></div>
            <h3 id="mistakes-heading">Common mistakes</h3>
            <div class="detail-section-divider" aria-hidden="true"></div>
          </div>
          <div class="mistakes-list">
            ${mistakesHtml}
          </div>
        </section>
      ` : ''}

      <!-- Not ideal for -->
      ${notIdealHtml}

      <!-- Disclaimer -->
      <footer class="disclaimer-footer">
        ${reviewerBadge(pos.reviewed_by_id)}
        <span class="disclaimer-label">Medical Disclaimer</span>
        <p>${esc(pos.disclaimer)}</p>
      </footer>

    </div>
  `);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Back button → positions list
  document.getElementById('back-btn')
    .addEventListener('click', showPositionList);

  // Latch checklist — tap to toggle
  // (keeping comment to preserve context for next block)
  root().querySelectorAll('.latch-checklist li').forEach(li => {
    function toggle() {
      const checked = li.classList.toggle('is-checked');
      li.setAttribute('aria-checked', String(checked));
    }
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });
  });
}


/* ═════════════════════════════════════════════════════════════
   CHAT / AI COACH — SAFETY GATE + SCREEN
   Safety sub-agent runs before any AI call.
   Phase 3: replace the stub response with a real Claude API call.
   ══════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────
   LOAD ESCALATION CARD
   ──────────────────────────────────────────────────────────── */

async function loadEscalationCard() {
  if (escalationCard) return escalationCard;
  try {
    const res = await fetch('escalation_card.json');
    if (!res.ok) throw new Error(`${res.status}`);
    escalationCard = await res.json();
  } catch (e) {
    // Fallback: hardcoded — never fail silently on safety content.
    // mental_health MUST include crisis numbers even in this fallback.
    escalationCard = {
      categories: {
        mental_health: {
          title: 'Please reach out right now',
          icon: 'favorite',
          severity: 'red',
          body: 'What you\'re feeling is real and you deserve support immediately. Thoughts of harming yourself or your baby are a medical emergency — not a sign that you\'re a bad mother.',
          actions: [
            { priority: 1, label: 'iCall (India): 9152987821',           detail: 'Mon–Sat, 8am–10pm' },
            { priority: 2, label: 'Vandrevala Foundation: 1860-2662-345', detail: '24/7, free' },
            { priority: 3, label: 'Tell someone you trust right now',     detail: 'Your partner, mother, a friend — anyone. Don\'t be alone with these thoughts.' },
            { priority: 4, label: 'Call your doctor or go to hospital',   detail: 'Tell them exactly what you told us.' },
          ],
          reassurance: '1 in 5 mothers experience postpartum depression. You are not alone, and this is not your fault.',
          disclaimer: 'If you are in immediate danger, call emergency services (112 in India, 911 in US/Canada).',
        },
        infection: {
          title: 'This needs medical attention today',
          icon: 'local_hospital',
          severity: 'red',
          body: 'Fever, red streaks, or a hot painful breast may need treatment today. Mastitis can progress quickly.',
          actions: [
            { priority: 1, label: 'Call your doctor or midwife now',   detail: 'Ask about antibiotics if you have fever + a hard, hot, red area.' },
            { priority: 2, label: 'Go to urgent care if unreachable',  detail: 'Don\'t wait to see if it improves on its own when fever is involved.' },
            { priority: 3, label: 'Keep feeding or pumping if you can', detail: 'Stopping milk removal makes infection worse.' },
          ],
          reassurance: 'Getting treatment doesn\'t mean you have to stop breastfeeding.',
          disclaimer: 'This is not a diagnosis. Only a healthcare provider can evaluate and treat a breast infection.',
        },
        bleeding: {
          title: 'Bleeding needs to be checked',
          icon: 'emergency',
          severity: 'red',
          body: 'Cracked nipples that bleed are often a latch problem. Heavy bleeding or a wound that won\'t heal needs a professional.',
          actions: [
            { priority: 1, label: 'Contact a lactation consultant (IBCLC)', detail: 'Bleeding nipples are almost always a latch problem — fixable in one session.' },
            { priority: 2, label: 'Call your doctor if wound looks open',   detail: 'Signs: yellow discharge, smell, increasing pain after day 5.' },
          ],
          reassurance: 'Bleeding nipples are one of the most common — and most fixable — reasons mothers stop breastfeeding.',
          disclaimer: 'This is not a diagnosis. A healthcare provider or IBCLC should assess any bleeding that concerns you.',
        },
        baby_emergency: {
          title: 'Your baby needs emergency care now',
          icon: 'emergency',
          severity: 'red',
          body: 'The signs you\'ve described need immediate medical evaluation. Do not wait.',
          actions: [
            { priority: 1, label: 'Call 112 (India) or your local emergency number now', detail: 'Tell them your baby\'s age and symptoms.' },
          ],
          reassurance: null,
          disclaimer: 'Do not delay emergency care for a newborn showing signs of distress.',
        },
        default: {
          title: 'This needs medical attention',
          icon: 'local_hospital',
          severity: 'red',
          body: 'What you\'ve described is outside what we can safely guide you through here. Please contact your doctor, midwife, or a certified lactation consultant (IBCLC) today.',
          actions: [
            { priority: 1, label: 'Call your doctor or midwife',   detail: 'Describe your symptoms exactly as you described them here.' },
            { priority: 2, label: 'Find an IBCLC: ilca.org',       detail: 'International directory of certified lactation consultants.' },
          ],
          reassurance: 'Asking for help is the right call.',
          disclaimer: 'This is not a diagnosis. Always consult a qualified healthcare provider.',
        },
      }
    };
  }
  return escalationCard;
}


/* ─────────────────────────────────────────────────────────────
   CLASSIFY ESCALATION CATEGORY
   Maps the user message to the right escalation card category.
   ──────────────────────────────────────────────────────────── */

const ESCALATION_CATEGORY_PATTERNS = {
  mental_health: [
    /\bwant\s+to\s+(hurt|harm|kill)\s+(myself|my\s+baby|him|her)\b/i,
    /\bsuicid(e|al)\b/i,
    /\bdon.{0,5}t\s+want\s+to\s+(live|be\s+here)\b/i,
    /\bthoughts?\s+of\s+(harming|hurting|killing)\b/i,
  ],
  baby_emergency: [
    /\bbaby\s+(won.{0,5}t?\s+wake|is\s+not\s+waking|can.{0,5}t?\s+wake\s+baby)\b/i,
    /\bbaby\s+(is\s+)?(limp|floppy|unresponsive|not\s+respond)\b/i,
    /\bbaby\s+(is\s+)?(turn(ing)?\s+(blue|purple)|not\s+breath)\b/i,
  ],
  bleeding: [
    /\bcrack(ed|ing)?.{0,20}bleed(ing)?\b/i,
    /\bbleed(ing)?.{0,20}crack(ed|ing)?\b/i,
    /\bnipple\s+is\s+bleeding\b/i,
    /\bblood\s+in\s+(the\s+)?milk\b/i,
    /\bwound.{0,20}open(ed|ing)?\b/i,
  ],
  infection: [
    /\bfever\b/i,
    /\bred\s+streak/i,
    /\bpus\b/i,
    /\bmastitis\b/i,
    /\babscess\b/i,
    /\bbreast\s+(is\s+)?(hot|infected)\b/i,
  ],
};

function classifyEscalationCategory(message) {
  for (const [category, patterns] of Object.entries(ESCALATION_CATEGORY_PATTERNS)) {
    if (patterns.some(p => p.test(message))) return category;
  }
  return 'default';
}


/* ─────────────────────────────────────────────────────────────
   RENDER ESCALATION CARD IN CHAT
   ──────────────────────────────────────────────────────────── */

function renderEscalationCard(category, card) {
  const c = card.categories[category] ?? card.categories.default;
  const actionsHtml = (c.actions ?? [])
    .sort((a, b) => a.priority - b.priority)
    .map(a => `
      <div class="chat-escalation__action">
        <p class="chat-escalation__action-label">${esc(a.label)}</p>
        <p class="chat-escalation__action-detail">${esc(a.detail)}</p>
      </div>
    `).join('');

  return `
    <div class="chat-escalation" role="alert" aria-live="assertive">
      <div class="chat-escalation__header">
        <span class="material-symbols-outlined" aria-hidden="true">${esc(c.icon)}</span>
        ${esc(c.title)}
      </div>
      <p class="chat-escalation__body">${esc(c.body)}</p>
      <div class="chat-escalation__actions">${actionsHtml}</div>
      ${c.reassurance ? `<p class="chat-escalation__reassurance">${esc(c.reassurance)}</p>` : ''}
      <p class="chat-escalation__disclaimer">${esc(c.disclaimer)}</p>
    </div>
  `;
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: CHAT
   ──────────────────────────────────────────────────────────── */

async function showChat() {
  setNavActive('more');
  await loadEscalationCard();

  const suggestedPrompts = [
    'My baby keeps slipping off during a feed — what am I doing wrong?',
    'How do I know if my baby is getting enough milk?',
    'My nipples hurt every time I latch — is this normal?',
  ];

  const promptChipsHtml = suggestedPrompts.map(p => `
    <button class="chat-prompt-chip" type="button" data-prompt="${esc(p)}">
      ${esc(p)}
    </button>
  `).join('');

  setContent(`
    <div class="chat-screen">

      <!-- Messages area -->
      <div class="chat-messages" id="chat-messages" aria-live="polite" aria-label="Conversation">

        <!-- Empty state — hidden once messages exist -->
        <div class="chat-empty" id="chat-empty">
          <div class="chat-empty__icon" aria-hidden="true">
            <span class="material-symbols-outlined">sentiment_calm</span>
          </div>
          <span class="coach-coming-soon">
            <span class="material-symbols-outlined" style="font-size:0.8rem;">construction</span>
            AI coach — coming soon
          </span>
          <h2>Ask anything about breastfeeding</h2>
          <p>Try a question below, or type your own. The safety gate is already live.</p>
          <div class="chat-prompts" role="list" aria-label="Suggested questions">
            ${promptChipsHtml}
          </div>
        </div>

      </div>

      <!-- Input bar -->
      <div class="chat-input-bar">
        <div class="chat-input-row">
          <textarea
            id="chat-input"
            rows="1"
            placeholder="Describe what you're experiencing…"
            aria-label="Type your question"
            maxlength="500"
          ></textarea>
          <button
            id="chat-send"
            class="chat-send-btn"
            type="button"
            aria-label="Send message"
            disabled
          >
            <span class="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>

    </div>
  `);

  // ── Wire up input ────────────────────────────────────────────
  const inputEl  = document.getElementById('chat-input');
  const sendBtn  = document.getElementById('chat-send');
  const messagesEl = document.getElementById('chat-messages');

  // Auto-grow textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + 'px';
    sendBtn.disabled = inputEl.value.trim().length === 0;
  });

  // Send on Enter (not Shift+Enter)
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleChatSend();
    }
  });

  sendBtn.addEventListener('click', handleChatSend);

  // Prompt chips → pre-fill input
  root().querySelectorAll('.chat-prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputEl.value = chip.dataset.prompt;
      inputEl.dispatchEvent(new Event('input'));
      inputEl.focus();
    });
  });

  function handleChatSend() {
    const message = inputEl.value.trim();
    if (!message) return;

    // Clear input immediately
    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;

    // Hide empty state
    const emptyEl = document.getElementById('chat-empty');
    if (emptyEl) emptyEl.remove();

    // Render user bubble
    appendBubble('user', message);

    // ── SAFETY GATE (point 4) ─────────────────────────────────
    // window.Safety is loaded from safety.js before app.js
    const safe = window.Safety.isSafeToCoach(message);

    if (!safe) {
      // Classify which escalation category fits best
      const category = classifyEscalationCategory(message);

      // Log matched flags for internal review (never shown to user)
      const flags = window.Safety.getMatchedFlags(message);
      console.info('[Safety gate triggered]', { category, flags });

      // Render escalation card — from reviewed JSON, not from Claude
      appendEscalation(category);
      return;
    }

    // ── PHASE 3: Replace this stub with a real Claude API call ──
    // POST /api/chat with { message, history: chatMessages }
    // Stream the response and call appendBubble('coach', chunk)
    appendBubble('coach',
      '✦ AI coach coming in Phase 3. The safety gate you just tested is live and working.'
    );
  }

  function appendBubble(role, text) {
    chatMessages.push({ role, text });
    const div = document.createElement('div');
    div.className = `chat-bubble chat-bubble--${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendEscalation(category) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderEscalationCard(category, escalationCard);
    messagesEl.appendChild(wrapper.firstElementChild);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}
