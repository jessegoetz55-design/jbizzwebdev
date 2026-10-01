/* =========================================================================
   site.js — shared behavior for jbizzwebdev.com
   - Applies SITE_CONFIG (Calendly links, prices)
   - Handles the free-checklist email capture form (+ GA4 generate_lead)
   - Click tracking for Calendly + product checkout
   - Lazy-loads the AI chatbot widget
   No build step. No dependencies.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};

  /* ---- Safe GA4 event helper (works even while GA4 ID is a placeholder) -- */
  function trackEvent(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      } else {
        (window.dataLayer = window.dataLayer || []).push(
          Object.assign({ event: name }, params || {})
        );
      }
    } catch (e) { /* tracking must never break the page */ }
  }
  window.jbizzTrack = trackEvent;

  function isPlaceholderEndpoint(url) {
    return !url || /REPLACE-ME|example\.com/i.test(url);
  }

  /* ---- 1. Calendly links -------------------------------------------------- */
  function applyCalendly() {
    if (!CFG.calendlyUrl) return;
    document.querySelectorAll("[data-calendly]").forEach(function (a) {
      a.setAttribute("href", CFG.calendlyUrl);
    });
  }

  /* ---- 2. Prices (single source of truth = SITE_CONFIG.prices) ------------ */
  function applyPrices() {
    if (!CFG.prices || typeof CFG.fmtPrice !== "function") return;
    document.querySelectorAll("[data-price]").forEach(function (el) {
      el.textContent = CFG.fmtPrice(el.getAttribute("data-price"));
    });
  }

  /* ---- 3. Click tracking --------------------------------------------------- */
  function bindClickTracking() {
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-track]");
      if (!el) return;
      var kind = el.getAttribute("data-track");
      if (kind === "book_call") {
        trackEvent("book_call", { method: "calendly", location: el.getAttribute("data-location") || "unknown" });
      } else if (kind === "begin_checkout") {
        trackEvent("begin_checkout", { currency: "USD", value: 24, items: [{ item_name: "Freelancer Cashflow OS" }] });
      }
    }, { passive: true });
  }

  /* ---- 4. Free-checklist email capture form -------------------------------- */
  function postLead(payload) {
    // Returns a Promise that resolves true on "captured".
    if (isPlaceholderEndpoint(CFG.emailEndpoint)) {
      // Demo mode: no real endpoint configured yet. Log + resolve so the
      // visitor still gets the checklist. Jesse: set emailEndpoint (SETUP.md).
      if (window.console) console.info("[jbizz] emailEndpoint is a placeholder — lead captured locally only:", payload);
      return Promise.resolve(true);
    }
    return fetch(CFG.emailEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }
  window.jbizzPostLead = postLead;

  function bindChecklistForm() {
    var form = document.getElementById("checklist-form");
    if (!form) return;
    var nameInput = form.querySelector('[name="name"]');
    var emailInput = form.querySelector('[name="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var err = document.getElementById("checklist-error");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = (nameInput.value || "").trim();
      var email = (emailInput.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = "Please enter a valid email address.";
        err.classList.remove("hidden");
        emailInput.focus();
        return;
      }
      err.classList.add("hidden");
      btn.disabled = true;
      btn.textContent = "Sending…";

      postLead({ name: name, email: email, source: "checklist_form", page: location.href })
        .then(function (ok) {
          trackEvent("generate_lead", { source: "checklist_form", value: ok ? 1 : 0 });
          document.getElementById("checklist-form-wrap").classList.add("hidden");
          var done = document.getElementById("checklist-success");
          done.classList.remove("hidden");
          var link = done.querySelector('[data-checklist-link]');
          if (link && CFG.checklistUrl) link.setAttribute("href", CFG.checklistUrl);
          if (!ok) {
            var note = done.querySelector("[data-delivery-note]");
            if (note) note.textContent = "Heads up: the email didn't go through on our end, but your checklist is ready below — grab it now.";
          }
        });
    });
  }

  /* ---- 5. Lazy-load the chatbot widget ------------------------------------- */
  var chatLoaded = false;
  function loadChatbot() {
    if (chatLoaded) return;
    chatLoaded = true;
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "assets/chatbot.css";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = "assets/chatbot.js";
    js.defer = true;
    document.head.appendChild(js);
  }
  window.jbizzLoadChatbot = loadChatbot;

  /* ---- Init ---------------------------------------------------------------- */
  function init() {
    applyCalendly();
    applyPrices();
    bindClickTracking();
    bindChecklistForm();
    // Lazy-load chat: after the page is idle, so it never blocks rendering.
    if ("requestIdleCallback" in window) {
      requestIdleCallback(function () { setTimeout(loadChatbot, 1500); }, { timeout: 6000 });
    } else {
      window.addEventListener("load", function () { setTimeout(loadChatbot, 2500); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
