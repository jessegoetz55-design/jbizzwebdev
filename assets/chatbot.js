/* =========================================================================
   J Bizz Web Dev — AI chat widget (rule/intent-based, no API key needed)
   Lazy-loaded by site.js. Reads prices/links from window.SITE_CONFIG.
   Captures name+email when it can't answer or the visitor shows interest.
   ========================================================================= */
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;

  var CFG = window.SITE_CONFIG || {};
  var leadCaptured = false;
  var fallbackCount = 0;
  var opened = false;

  function track(name, params) {
    try {
      if (typeof window.jbizzTrack === "function") window.jbizzTrack(name, params);
      else if (typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e) {}
  }

  function postLead(payload) {
    if (typeof window.jbizzPostLead === "function") return window.jbizzPostLead(payload);
    return Promise.resolve(true);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(key) {
    return (typeof CFG.fmtPrice === "function") ? CFG.fmtPrice(key) : "$" + ((CFG.prices || {})[key] || "?");
  }
  function calendly() { return CFG.calendlyUrl || "https://calendly.com/YOUR-LINK"; }
  function checklist() { return CFG.checklistUrl || "free-checklist.html"; }

  /* ---------------- Knowledge base: intents ------------------------------ */
  var INTENTS = [
    {
      id: "greeting",
      kw: ["hello", "hi", "hey", "yo", "sup", "good morning", "good afternoon", "good evening", "howdy"],
      reply: function () {
        return "Hey — welcome to J Bizz Web Dev. I can answer questions about services, pricing, timelines, and the AI features Jesse builds. What's on your mind?";
      },
      quick: ["pricing", "timeline", "ai"]
    },
    {
      id: "pricing",
      kw: ["price", "pricing", "cost", "charge", "much", "package", "rate", "rates", "budget", "expensive", "afford"],
      reply: function () {
        return "Straight numbers: projects start at " + fmt("sprint") + ". " +
          "Three packages — <b>Lead-Gen Sprint (" + fmt("sprint") + ")</b>, " +
          "<b>AI Lead Engine (" + fmt("engine") + ")</b> (most popular), " +
          "<b>Premium Build (" + fmt("premium") + ")</b>. " +
          "Full breakdown is in the pricing section above. Want a precise quote for your project? I can have Jesse follow up — just drop your email below.";
      },
      quick: ["book", "timeline"],
      capture: true
    },
    {
      id: "timeline",
      kw: ["how long", "timeline", "turnaround", "launch", "fast", "when can", "delivery", "deadline", "weeks", "days"],
      reply: function () {
        return "Most lead-generation sites launch in <b>1–3 weeks</b> depending on scope. You get a design preview before anything is built, so there are no surprises. Bigger builds with custom AI features can run a bit longer — Jesse gives you an exact timeline on the free strategy call.";
      },
      quick: ["pricing", "book"]
    },
    {
      id: "ai",
      kw: ["ai", "chatbot", "bot", "automation", "automate", "chatgpt", "artificial intelligence", "24/7"],
      reply: function () {
        return "The AI stuff is Jesse's specialty: <b>chatbots that answer your customers 24/7</b>, smart lead-capture forms, and automated follow-ups that work while you sleep. " +
          "Fun fact — <i>this chat widget is a live demo</i> of exactly that kind of thing, running on your own site. Want one on yours? That's the AI Lead Engine package (" + fmt("engine") + ").";
      },
      quick: ["pricing", "book"]
    },
    {
      id: "services",
      kw: ["service", "offer", "what do you do", "website", "redesign", "landing page", "build", "design"],
      reply: function () {
        return "Three things: <b>1)</b> Lead-generation websites that turn visitors into booked calls. <b>2)</b> AI-powered features — chatbots, automation, smart forms. <b>3)</b> Premium design &amp; build: fast, mobile-first, clean modern look. Everything is scoped to one goal: more leads, more clients.";
      },
      quick: ["pricing", "ai"]
    },
    {
      id: "process",
      kw: ["process", "how it works", "steps", "how do we start", "getting started", "start"],
      reply: function () {
        return "Simple, four steps: <b>1)</b> Free 20-min strategy call. <b>2)</b> Design preview — you approve the look before it's built. <b>3)</b> Build &amp; launch, mobile-first with AI wired in. <b>4)</b> Grow &amp; support with tracking in place. Want to kick off step 1?";
      },
      quick: ["book", "pricing"]
    },
    {
      id: "booking",
      kw: ["book", "call", "schedule", "talk", "contact", "calendly", "strategy", "consult", "appointment", "meet"],
      reply: function () {
        return "You can grab a <b>free 20-minute strategy call</b> right here: <a href=\"" + esc(calendly()) + "\" target=\"_blank\" rel=\"noopener\">Book your call</a>. " +
          "No pitch — just your goals, your customers, and a straight answer on whether Jesse can help. Prefer email? It's on the contact section below.";
      },
      quick: ["pricing", "timeline"],
      track: ["book_call", { method: "chatbot" }]
    },
    {
      id: "checklist",
      kw: ["checklist", "free", "download", "guide", "audit", "freebie", "ebook"],
      reply: function () {
        return "Grab the <b>free 44-point Website Conversion Checklist</b> — the same audit Jesse runs on client sites, condensed into a 20-minute self-check: <a href=\"" + esc(checklist()) + "\">Get the checklist</a>. " +
          "Want it emailed to you too? Drop your email below.";
      },
      quick: ["pricing", "book"],
      capture: true
    },
    {
      id: "products",
      kw: ["product", "spreadsheet", "cashflow", "template", "digital", "tool"],
      reply: function () {
        return "Jesse also sells digital tools — right now it's the <b>Freelancer Cashflow OS</b> ($24): turn irregular freelance income into a predictable paycheck, with auto tax-split tracking and overdue-invoice alarms. Scroll to the Products section to grab it.";
      },
      quick: ["pricing", "book"]
    },
    {
      id: "location",
      kw: ["florida", "where", "location", "based", "remote", "nationwide", "local", "area"],
      reply: function () {
        return "Florida-based, working with clients <b>nationwide</b>. Everything is handled remotely — calls, previews, launch. Location hasn't been an issue for any client so far.";
      },
      quick: ["book", "pricing"]
    },
    {
      id: "human",
      kw: ["human", "person", "real person", "jesse", "follow up", "followup", "call me", "email me", "owner", "founder"],
      reply: function () {
        return "Absolutely — I'll make sure Jesse personally follows up. Drop your name and email below and he'll get back to you within one business day. (And yes, I'm a bot — a shamelessly effective demo of what he builds.)";
      },
      capture: true,
      quick: []
    },
    {
      id: "thanks",
      kw: ["thank", "thanks", "thx", "awesome", "great", "cool", "perfect", "nice"],
      reply: function () {
        return "Anytime. If you want to go deeper, the free strategy call is the fastest way — or grab the free checklist and audit your own site first.";
      },
      quick: ["book", "checklist"]
    },
    {
      id: "bye",
      kw: ["bye", "goodbye", "see you", "later", "gtg"],
      reply: function () {
        return "Catch you later. The free checklist and the strategy call aren't going anywhere — good luck with the site.";
      },
      quick: []
    }
  ];

  var QUICK_LABELS = {
    pricing: "What does it cost?",
    timeline: "How long does it take?",
    ai: "What AI features?",
    book: "Book a free call",
    checklist: "Free checklist",
    human: "Talk to Jesse"
  };

  function matchIntent(text) {
    var t = " " + text.toLowerCase() + " ";
    var best = null, bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i], score = 0;
      for (var k = 0; k < it.kw.length; k++) {
        if (t.indexOf(it.kw[k]) !== -1) score += it.kw[k].length; // longer keywords weigh more
      }
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return bestScore > 0 ? best : null;
  }

  /* ---------------- UI ---------------------------------------------------- */
  var panel, messages, quickWrap, input, fab;

  function buildUI() {
    fab = document.createElement("button");
    fab.id = "jbz-chat-fab";
    fab.setAttribute("aria-label", "Chat with us");
    fab.innerHTML = "&#128172;<span class='jbz-badge'></span>";

    panel = document.createElement("div");
    panel.id = "jbz-chat-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat");
    panel.innerHTML =
      '<div class="jbz-chat-header">' +
        '<div class="jbz-chat-avatar">J</div>' +
        '<div><div class="jbz-chat-title">J Bizz Assistant</div>' +
        '<div class="jbz-chat-status"><span class="dot"></span>Online — replies instantly</div></div>' +
        '<button class="jbz-chat-close" aria-label="Close chat">&times;</button>' +
      "</div>" +
      '<div id="jbz-chat-messages"></div>' +
      '<div class="jbz-quick" id="jbz-chat-quick"></div>' +
      '<div class="jbz-chat-input">' +
        '<input id="jbz-chat-text" type="text" placeholder="Ask about pricing, timelines, AI…" autocomplete="off" maxlength="500" aria-label="Type your message">' +
        '<button id="jbz-chat-send" aria-label="Send">&#10148;</button>' +
      "</div>";

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    messages = panel.querySelector("#jbz-chat-messages");
    quickWrap = panel.querySelector("#jbz-chat-quick");
    input = panel.querySelector("#jbz-chat-text");

    fab.addEventListener("click", toggle);
    panel.querySelector(".jbz-chat-close").addEventListener("click", toggle);
    panel.querySelector("#jbz-chat-send").addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    // Proactive nudge: badge after 30s if never opened
    setTimeout(function () {
      if (!opened) fab.classList.add("has-unread");
    }, 30000);
  }

  function toggle() {
    opened = true;
    fab.classList.remove("has-unread");
    var isOpen = panel.classList.toggle("open");
    fab.innerHTML = isOpen ? "&times;" : "&#128172;<span class='jbz-badge'></span>";
    if (isOpen && messages.children.length === 0) {
      greet();
    }
    if (isOpen) setTimeout(function () { input.focus(); }, 300);
  }

  function greet() {
    botSay(INTENTS[0].reply(), INTENTS[0].quick);
  }

  function scrollDown() {
    messages.scrollTop = messages.scrollHeight;
  }

  function botSay(html, quick) {
    var d = document.createElement("div");
    d.className = "jbz-msg bot";
    d.innerHTML = html;
    messages.appendChild(d);
    renderQuick(quick || []);
    scrollDown();
  }

  function userSay(text) {
    var d = document.createElement("div");
    d.className = "jbz-msg user";
    d.textContent = text;
    messages.appendChild(d);
    scrollDown();
  }

  function renderQuick(keys) {
    quickWrap.innerHTML = "";
    (keys || []).forEach(function (k) {
      if (!QUICK_LABELS[k]) return;
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = QUICK_LABELS[k];
      b.addEventListener("click", function () { handleUserText(QUICK_LABELS[k]); });
      quickWrap.appendChild(b);
    });
  }

  function showTyping(cb) {
    var d = document.createElement("div");
    d.className = "jbz-msg bot typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(d);
    scrollDown();
    setTimeout(function () { d.remove(); cb(); }, 650);
  }

  /* ---------------- Lead capture form ------------------------------------ */
  function leadFormHTML(contextLabel) {
    return '<form class="jbz-lead-form" data-jbz-lead>' +
      '<input type="text" name="name" placeholder="Your name" autocomplete="name" maxlength="80">' +
      '<input type="email" name="email" placeholder="Email address" autocomplete="email" required maxlength="120">' +
      '<button type="submit">Have Jesse follow up</button>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.5)">' + esc(contextLabel) + "</div>" +
      "</form>";
  }

  function bindLeadForm(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.querySelector('[name="email"]').focus();
        return;
      }
      var btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Sending…";
      postLead({ name: name, email: email, source: "chatbot", page: location.href })
        .then(function () {
          leadCaptured = true;
          track("chat_lead", { source: "chatbot" });
          var wrap = document.createElement("div");
          wrap.className = "jbz-msg bot";
          wrap.innerHTML = "You're in" + (name ? ", " + esc(name) : "") +
            ". Jesse will personally follow up within one business day. " +
            'Meanwhile, grab the <a href="' + esc(checklist()) + '">free 44-point checklist</a> — it\'s the fastest way to see where your site stands.';
          form.replaceWith(wrap);
          scrollDown();
        });
    });
  }

  function askForLead(reason) {
    var d = document.createElement("div");
    d.className = "jbz-msg bot";
    d.innerHTML = esc(reason) + leadFormHTML("No spam, no list-selling — just Jesse, following up.");
    messages.appendChild(d);
    bindLeadForm(d.querySelector("[data-jbz-lead]"));
    renderQuick([]);
    scrollDown();
  }

  /* ---------------- Conversation ------------------------------------------ */
  function send() {
    var t = input.value.trim();
    if (!t) return;
    input.value = "";
    handleUserText(t);
  }

  function handleUserText(text) {
    userSay(text);
    renderQuick([]);
    var intent = matchIntent(text);

    showTyping(function () {
      if (intent) {
        if (intent.track) track(intent.track[0], intent.track[1]);
        botSay(intent.reply(), intent.quick);
        if (intent.capture && !leadCaptured) {
          setTimeout(function () {
            askForLead("If you'd like, leave your details and Jesse will take it from here:");
          }, 900);
        }
        fallbackCount = 0;
      } else {
        fallbackCount++;
        if (!leadCaptured && fallbackCount >= 1) {
          // Can't answer confidently → graceful handoff + lead capture
          botSay("Good question — I don't have a confident answer for that one, and I'd rather not guess.", []);
          setTimeout(function () {
            askForLead("Want Jesse himself to answer it? Leave your name and email:");
          }, 900);
        } else {
          botSay("Hmm, I didn't quite catch that. I can help with <b>pricing</b>, <b>timelines</b>, <b>AI features</b>, <b>booking a free call</b>, or the <b>free checklist</b> — which one?", ["pricing", "timeline", "ai", "book"]);
        }
      }
    });
  }

  /* ---------------- Boot ---------------------------------------------------- */
  buildUI();
  window.jbzChat = { open: function () { if (!panel.classList.contains("open")) toggle(); }, matchIntent: matchIntent };
  // Exposed for automated testing only
  window.__jbzChat = { matchIntent: matchIntent, esc: esc };
})();
