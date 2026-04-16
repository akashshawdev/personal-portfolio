(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function smoothScrollTo(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  // Smooth scrolling for internal anchors
  function initSmoothAnchorScrolling() {
    document.addEventListener("click", (e) => {
      const a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const isNavLink = a.hasAttribute("data-nav-link");
      const isScroll = a.hasAttribute("data-scroll");
      const isScrollContact = a.getAttribute("data-action") === "scroll-contact";
      if (!isNavLink && !isScroll && !isScrollContact) return;

      e.preventDefault();
      smoothScrollTo(href);
    });
  }

  // Mobile navigation toggle
  function initMobileNav() {
    const toggle = $('[data-mobile-toggle]');
    const panel = $('[data-mobile-panel]');
    if (!toggle || !panel) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", () => {
      const open = !panel.classList.contains("is-open");
      setOpen(open);
    });

    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("is-open")) return;
      const clickedInside = e.target && panel.contains(e.target);
      const clickedToggle = e.target && toggle.contains(e.target);
      if (!clickedInside && !clickedToggle) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // Close when clicking any nav link
    $$('[data-mobile-panel] a[data-nav-link]').forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  }

  // Accordion rows (single-open behavior)
  function initAccordion() {
    const rows = $$("[data-acc]");
    if (!rows.length) return;

    rows.forEach((row) => {
      const btn = $(".acc-row__btn", row);
      const panel = $(".acc-row__panel", row);
      if (!btn || !panel) return;

      btn.addEventListener("click", () => {
        const isExpanded = btn.getAttribute("aria-expanded") === "true";

        // Collapse all first (editorial, tidy)
        rows.forEach((r) => {
          const b = $(".acc-row__btn", r);
          const p = $(".acc-row__panel", r);
          if (!b || !p) return;
          b.setAttribute("aria-expanded", "false");
          p.hidden = true;
        });

        if (!isExpanded) {
          btn.setAttribute("aria-expanded", "true");
          panel.hidden = false;
          // Ensure reveal feels responsive
          if (!prefersReducedMotion) panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
        }
      });
    });
  }

  // Project filter chips
  function initProjectFilters() {
    const chipRow = $('[data-chip-filter]');
    const items = $$(".case-card[data-category]");
    if (!chipRow || !items.length) return;

    const chips = $$("button[data-filter]", chipRow);

    const applyFilter = (filter) => {
      chips.forEach((c) => c.classList.toggle("is-selected", c.getAttribute("data-filter") === filter));

      items.forEach((card) => {
        const categories = String(card.getAttribute("data-category") || "").split(/\s+/).filter(Boolean);
        const visible = filter === "all" ? true : categories.includes(filter);
        card.style.display = visible ? "" : "none";
      });
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => applyFilter(chip.getAttribute("data-filter")));
    });

    // Default
    applyFilter("all");
  }

  // Contact form chips
  function initContactChips() {
    const chipRow = $('[data-chip-contact]');
    const chips = $$("[data-interest]", chipRow || document);
    if (!chipRow || !chips.length) return;

    // Hidden input that stores selection as CSV
    let hidden = $("#contact-interests");
    if (!hidden) {
      hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.id = "contact-interests";
      hidden.name = "interests";
      chipRow.appendChild(hidden);
    }

    const setHidden = () => {
      const selected = chips.filter((c) => c.classList.contains("is-selected")).map((c) => c.getAttribute("data-interest"));
      hidden.value = selected.join(",");
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("is-selected");
        setHidden();
      });
    });
  }

  function initContactForm() {
    const form = $(".contact-form");
    if (!form) return;
    const submitBtn = $("[data-submit]", form);
    const helper = $("[data-helper]", form);
    if (!submitBtn) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Basic HTML validity UX
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      const previousText = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      if (helper) helper.textContent = "Thanks! Sending your message…";

      window.setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = previousText;
        if (helper) helper.textContent = "Message received. I’ll get back to you soon.";
        showToast("Message sent. Thanks, Akash will reply soon.");
        form.reset();
        // Reset chip UI if any
        const chipRow = $('[data-chip-contact]', form);
        if (chipRow) {
          $$("[data-interest]", chipRow).forEach((c) => c.classList.remove("is-selected"));
          const hidden = $("#contact-interests");
          if (hidden) hidden.value = "";
        }
      }, 900);
    });
  }

  // Scroll reveal
  function initScrollReveal() {
    const elements = $$("[data-reveal]");
    if (!elements.length) return;
    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // Active section indicator
  function initActiveNav() {
    const links = $$('[data-nav-link]');
    if (!links.length) return;

    const sections = $$("main section[id]").filter((s) => s.id && s.id !== "main");
    if (!sections.length) return;

    const map = new Map();
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      map.set(href.slice(1), a);
    });

    const clear = () => links.forEach((a) => a.closest(".nav-item")?.setAttribute("data-active", "false"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          clear();
          const id = entry.target.id;
          const link = map.get(id);
          link?.closest(".nav-item")?.setAttribute("data-active", "true");
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.1 }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // Global actions
  function initGlobalActions() {
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest && e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      if (action === "download-resume") {
        e.preventDefault();
        showToast("Add your resume file at `assets/resume.pdf` and update the link in `index.html`.");
      }

      if (action === "scroll-contact") {
        e.preventDefault();
        smoothScrollTo("#contact");
      }
    });
  }

  // Initialization
  function init() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    initSmoothAnchorScrolling();
    initMobileNav();
    initAccordion();
    initProjectFilters();
    initContactChips();
    initContactForm();
    initScrollReveal();
    initActiveNav();
    initGlobalActions();

    // Ensure the "View Projects" CTA works even without data-scroll on all anchors
    // (graceful enhancement: if the browser scrolls normally, fine).
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

