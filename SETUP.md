# Setup Guide — Conversion Fixes Branch

Everything on this branch works out of the box in **demo mode** (no console errors,
no broken links). To go fully live, replace 4 placeholders. Total time: ~30 minutes.

All settings live in **one file**: `assets/site-config.js` — open it, replace the
values, save, commit, push. Vercel redeploys automatically.

---

## 1. Calendly URL — ✅ DONE

**File:** `assets/site-config.js` → `calendlyUrl`

Already set to Jesse's real link: `https://calendly.com/jbizzweb/30min`
("Free Strategy Call", 30 min). Every booking CTA on the site uses it automatically.

> ⚠️ Copy mismatch flagged: the site copy says "free **20-minute** call" but the
> Calendly event is **30 minutes**. Wording was left as-is per instructions —
> Jesse should decide whether to update the site copy to "30-minute" or shorten
> the Calendly event to 20 minutes.

---

## 2. Email capture endpoint (~10 min)

**File:** `assets/site-config.js` → `emailEndpoint`

This is where the **free-checklist form** and the **chatbot lead capture** POST new
leads as JSON: `{ "name": "...", "email": "...", "source": "checklist_form" | "chatbot" }`.

Pick one provider:

**Option A — Formspree (easiest, free tier)**
1. Sign up at [formspree.io](https://formspree.io) → New Form → name it "Checklist leads".
2. Copy the endpoint: `https://formspree.io/f/xxxxxxxx`.
3. Paste it as `emailEndpoint`. Done — JSON POSTs work out of the box.

**Option B — ConvertKit**
1. ConvertKit → Grow → Landing Pages & Forms → Create a form → **Inline**.
2. Go to the form's **Settings → Embed** and copy the `<form action="...">` URL.
3. ConvertKit expects form-encoded fields, not JSON. Easiest path: in ConvertKit,
   go to the form → **Incentive email** → attach the checklist as the incentive,
   and set the form action URL as `emailEndpoint`. If JSON POSTs fail, switch to
   Option A or C — both accept JSON natively.

**Option C — Mailchimp**
1. Mailchimp → Audience → Signup forms → Form builder → copy the form's POST URL
   (it contains `u=` and `id=` parameters).
2. Same caveat as ConvertKit: Mailchimp's default endpoint wants form-encoded data.
   The reliable JSON-native route is a tiny serverless function (Vercel makes this
   trivial) — or just use Formspree (Option A) in front and forward to Mailchimp.

> While `emailEndpoint` is still the placeholder, forms show a success state and
> link the checklist directly (demo mode), and the attempt is logged to the console.
> No visitor ever sees an error.

**Then load the email sequence:** open `email-sequence.md` and paste the 5 emails
into your provider. Timing: Day 0, 1, 3, 5, 8. Set Email #1 to deliver the checklist
link: `https://jbizzwebdev.com/free-checklist.html`.

---

## 3. Google Analytics 4 (~10 min)

**File:** `assets/site-config.js` → `gaMeasurementId`

1. Go to [analytics.google.com](https://analytics.google.com) → **Admin** →
   **Create Property** → add a **Web data stream** for `https://jbizzwebdev.com`.
2. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
3. Paste it as `gaMeasurementId`.

That's it — the site loads the GA4 script only when a real ID is present, and these
events fire automatically:

| Event | When it fires |
|---|---|
| `generate_lead` | free-checklist form submitted |
| `chat_lead` | visitor gives email in the chatbot |
| `book_call` | any Calendly button clicked |
| `begin_checkout` | $24 Cashflow OS button clicked |

In GA4, mark `generate_lead` and `chat_lead` as **conversions**: Admin → Events →
toggle "Mark as conversion".

> While the ID is still the placeholder, no tracking script loads and event calls
> are harmless no-ops. Nothing is sent anywhere.

---

## 4. Confirm pricing (~2 min)

**File:** `assets/site-config.js` → `prices`

Suggested defaults are already in place (each marked `<!-- JESSE: confirm price -->`):

| Key | Package | Suggested |
|---|---|---|
| `sprint` | Lead-Gen Sprint | $1,500 |
| `engine` | AI Lead Engine (Most popular) | $3,500 |
| `premium` | Premium Build | $6,000 |

Change a number once — the pricing section and the chatbot's answers update
everywhere automatically. The anchor line "Projects start at $1,500" reads from
`sprint`, so they stay in sync.

---

## Files added on this branch

| File | What it is |
|---|---|
| `assets/site-config.js` | **The one file you edit** — all settings & placeholders |
| `assets/site.js` | Form handling, Calendly/price injection, GA4 events, chatbot lazy-loader |
| `assets/chatbot.js` / `assets/chatbot.css` | Floating AI chat widget (bottom-right, mobile-friendly) |
| `free-checklist.html` | The free 44-point checklist lead magnet (print/PDF-friendly) |
| `email-sequence.md` | 5 ready-to-paste nurture emails (Day 0/1/3/5/8) |
| `SETUP.md` | This file |

## New sections in `index.html`

- **Pricing** (`#pricing`, after Process): anchor line + 3 packages, middle highlighted.
- **Free checklist capture** (`#checklist`, after Work): headline, 3 benefits, name+email form → success state with download link.
- **GA4**: loads only with a real measurement ID; events wired for all key actions.
- Nav now links **Pricing** too.

## Checklist before you push

- [x] `calendlyUrl` is your real scheduling link: https://calendly.com/jbizzweb/30min (test-book it once)
- [ ] `emailEndpoint` receives a test signup (check your provider's inbox)
- [ ] `gaMeasurementId` is real → visit the site → check GA4 Realtime
- [ ] Prices confirmed (or changed) in `assets/site-config.js`
- [ ] Email sequence pasted into your provider, Day 0 email sends the checklist link
- [ ] Chatbot: open it, ask "what does it cost", submit a test email
