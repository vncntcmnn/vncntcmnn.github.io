/**
 * Portfolio site — main script
 *
 * Responsibilities (each isolated in its own init function):
 *  - Theme  : persist light/dark preference, wire toggle button
 *  - Nav    : highlight active nav link based on URL hash
 *  - Scroll : smooth-scroll anchor links, offset for fixed header
 *  - Mobile : hamburger open/close, close-on-outside-click
 *  - Loader : fetch and inject HTML partials into section containers
 */

'use strict';

/* ─── Theme ───────────────────────────────────────────────────────────────── */

function initTheme() {
    const root   = document.documentElement;
    const button = document.getElementById('theme-toggle');

    const stored = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme  = stored === 'dark' || stored === 'light' ? stored : (systemDark ? 'dark' : 'light');
    applyTheme(theme);

    button?.addEventListener('click', () => {
        applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
}

function applyTheme(theme) {
    const root   = document.documentElement;
    const button = document.getElementById('theme-toggle');

    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (!button) return;

    button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);

    const sun  = button.querySelector('.sun-icon');
    const moon = button.querySelector('.moon-icon');
    if (sun && moon) {
        sun.style.display  = theme === 'dark' ? 'block' : 'none';
        moon.style.display = theme === 'dark' ? 'none'  : 'block';
    }
}

/* ─── Nav highlight ───────────────────────────────────────────────────────── */

function initNavHighlight() {
    const navLinks = document.querySelectorAll('#navigation-menu a[href^="#"]');
    if (!navLinks.length) return;

    // Expose setter so smooth-scroll can call it directly.
    window.setActiveNavLink = (id) => setActiveLink(id, navLinks);

    const sectionIds = Array.from(navLinks).map(l => l.getAttribute('href').slice(1));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                window.setActiveNavLink(entry.target.id);
            }
        });
    }, {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
    });

    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

function setActiveLink(id, navLinks) {
    navLinks.forEach(link => {
        const active = id && link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', active);
        link.setAttribute('aria-current', active ? 'true' : 'false');
    });
}

/* ─── Smooth scroll ───────────────────────────────────────────────────────── */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const target   = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const header       = document.getElementById('main-header');
            const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
            const top          = window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;

            window.setActiveNavLink?.(targetId.slice(1));
            window.scrollTo({ top, behavior: 'smooth' });
            history.pushState(null, '', targetId);
        });
    });
}

/* ─── Mobile navigation ───────────────────────────────────────────────────── */

function initMobileNav() {
    const header = document.getElementById('main-header');
    const button = document.getElementById('toggle-navigation-menu');
    if (!header || !button) return;

    let isOpen = false;

    const open  = () => setMenuState(true,  header, button, state => { isOpen = state; });
    const close = () => setMenuState(false, header, button, state => { isOpen = state; });

    button.addEventListener('click', () => (isOpen ? close() : open()));

    // Close when a nav link is clicked (mobile full-screen overlay)
    document.querySelectorAll('#navigation-menu a').forEach(link => {
        link.addEventListener('click', () => { if (isOpen) close(); });
    });

    // Close on outside click or touch
    const closeIfOutside = (e) => {
        if (isOpen && !e.target.closest('#main-header')) close();
    };
    document.addEventListener('click',      closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside, { passive: true });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) close();
    });
}

function setMenuState(open, header, button, setState) {
    setState(open);
    header.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
}

/* ─── Section loader ──────────────────────────────────────────────────────── */

const SECTIONS = ['about', 'projects', 'resume'];

async function loadSections() {
    await Promise.all(SECTIONS.map(loadSection));
}

async function loadSection(name) {
    const container = document.getElementById(`${name}-content`);
    if (!container) return;

    try {
        const res = await fetch(`./${name}.html`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        container.innerHTML = await res.text();
    } catch (err) {
        container.innerHTML = `<p class="error-message">Could not load section "${name}" (${err.message}).</p>`;
    }
}

/* ─── Keyboard shortcuts ──────────────────────────────────────────────────── */

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + T  →  toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            document.getElementById('theme-toggle')?.click();
        }
    });
}

/* ─── Boot ────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavHighlight();
    initSmoothScroll();
    initMobileNav();
    initKeyboardShortcuts();
    loadSections();
});