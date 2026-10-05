/* =========================================================================
   SITE_CONFIG — the ONE place Jesse edits site-wide settings.
   -------------------------------------------------------------------------
   HOW TO USE:
   1. Open this file.
   2. Replace the placeholder values below with your real ones.
   3. Save, commit, push. Vercel redeploys automatically.

   Full walkthrough: see SETUP.md in the repo root.
   ========================================================================= */
window.SITE_CONFIG = {
  /* ---- Email capture ----------------------------------------------------
     Where lead-capture forms (free checklist form, chatbot) POST new leads.
     Must be an HTTPS endpoint that accepts a JSON POST body like:
         { "name": "Jane", "email": "jane@example.com", "source": "checklist_form" }
     Works out of the box with:
       • Formspree  → https://formspree.io/f/YOUR_FORM_ID
       • ConvertKit → create a form, use its "action" URL
       • Mailchimp  → use its embedded-form POST URL
     See SETUP.md for exactly where to find these URLs. */
  emailEndpoint: "https://example.com/REPLACE-ME",

  /* ---- Google Analytics 4 ------------------------------------------------
     Your GA4 "Measurement ID" — looks like G-XXXXXXXXXX.
     Find it in Google Analytics → Admin → Data Streams → your stream.
     While this is still the placeholder, NO tracking script is loaded
     (so there are no console errors and no data goes anywhere). */
  gaMeasurementId: "G-XXXXXXXXXX",

  /* ---- Calendly ----------------------------------------------------------
     Your real Calendly scheduling link, e.g.
         "https://calendly.com/jbizzwebdev/strategy-call"
     Every "Book Free Strategy Call" button on the site uses this.
     Currently set to Jesse's real link: https://calendly.com/jbizzweb/30min */
  calendlyUrl: "https://calendly.com/jbizzweb/30min",

  /* ---- Pricing -----------------------------------------------------------
     <!-- JESSE: confirm price --> — change a number here and every price
     on the site (pricing section, chatbot answers) updates automatically. */
  prices: {
    sprint: 997,     // Lead-Gen Sprint
    engine: 1997,    // AI Lead Engine
    premium: 2997    // Premium Build
  },

  /* ---- Misc -------------------------------------------------------------- */
  contactEmail: "hello@jbizzwebdev.com",
  siteName: "J Bizz Web Dev",
  siteUrl: "https://jbizzwebdev.com",
  checklistUrl: "free-checklist.html" // relative link to the free checklist page
};

/* Format a price from the table above, e.g. fmtPrice('sprint') → "$1,500" */
window.SITE_CONFIG.fmtPrice = function (key) {
  var n = window.SITE_CONFIG.prices[key];
  return "$" + Number(n).toLocaleString("en-US");
};
