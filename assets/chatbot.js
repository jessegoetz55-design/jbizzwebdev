/* =========================================================================
   J Bizz Web Dev — "Bolt" chat widget
   Rule/intent-based sales assistant. No API key, no monthly cost.
   Lazy-loaded by assets/site.js. Reads prices/links from window.SITE_CONFIG.

   What makes it elite:
   - Named persona (Bolt) with confident, direct copy — no corporate fluff
   - Multi-turn qualification flow ("Get a custom quote") with conversational
     lead capture (name -> email), posted to SITE_CONFIG.emailEndpoint
   - Objection handling (too expensive, why you, SEO, redesign, ecommerce)
   - Proactive: teaser bubble, unread badge nudge, one-per-session exit intent
   - Session memory (no re-greeting), analytics hooks, keyboard accessible,
     reduced-motion support, mobile bottom-sheet layout
   ========================================================================= */
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;

  var CFG = window.SITE_CONFIG || {};
  var BOT_NAME = "Bolt";

  /* ---------------- tiny utils ------------------------------------------ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
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
  function fmt(key) {
    return (typeof CFG.fmtPrice === "function") ? CFG.fmtPrice(key) : "$" + ((CFG.prices || {})[key] || "?");
  }
  function calendly() { return CFG.calendlyUrl || "https://calendly.com/jbizzweb/30min"; }
  function checklist() { return CFG.checklistUrl || "free-checklist.html"; }

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem("jbz_" + k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem("jbz_" + k, v); } catch (e) {} }
  };

  function normalize(t) {
    return (" " + String(t).toLowerCase().replace(/[^a-z0-9$.\s]/g, " ").replace(/\s+/g, " ") + " ");
  }

  /* ---------------- knowledge base --------------------------------------- */
  var INTENTS = [
    {
      id: "greeting",
      kw: ["hello", "hi", "hey", "yo", "sup", "good morning", "good afternoon", "good evening", "howdy", "hola", "greetings"],
      reply: function () {
        return "Hey — welcome to J Bizz Web Dev. Ask me about <b>pricing</b>, <b>timelines</b>, or the <b>AI features</b> Jesse builds. I reply instantly.";
      },
      quick: ["cost", "services", "book"]
    },
    {
      id: "pricing",
      kw: ["price", "pricing", "cost", "charge", "much", "package", "rate", "rates", "budget", "afford", "how much"],
      reply: function () {
        return "Straight numbers — three packages:<br><b>Lead-Gen Sprint — " + fmt("sprint") + "</b><br><b>AI Lead Engine — " + fmt("engine") + "</b> (most popular)<br><b>Premium Build — " + fmt("premium") + "</b><br>Every one is scoped to a single goal: more leads, more booked calls. Want an exact quote for your project?";
      },
      quick: ["quote", "book", "expensive"]
    },
    {
      id: "expensive",
      kw: ["expensive", "too much", "cheaper", "discount", "cheep", "overpriced", "can't afford", "cant afford", "pricey"],
      reply: function () {
        return "Fair pushback. The math most clients do: <b>one extra booked job a month</b> usually covers the Sprint. And you approve a design preview <i>before</i> anything is built — no surprises, no sunk cost. Cheap sites cost more when they don't convert. Want an exact quote for yours?";
      },
      quick: ["quote", "book"]
    },
    {
      id: "why",
      kw: ["why you", "why jesse", "why jbizz", "vs ", "versus", "competitor", "different", "better than", "wix", "squarespace", "wordpress", "go daddy", "godaddy", "fiverr", "upwork"],
      reply: function () {
        return "Three reasons:<br><b>1. Lead-gen obsession.</b> Every pixel exists to turn visitors into calls — not to win design awards.<br><b>2. AI specialty.</b> Chatbots and automation most designers can't build. You're literally talking to a demo of it right now.<br><b>3. Speed + direct.</b> 1–3 week turnaround, and you deal with Jesse — not an account manager relay.";
      },
      quick: ["cost", "book", "quote"]
    },
    {
      id: "timeline",
      kw: ["how long", "timeline", "turnaround", "launch", "fast", "when can", "delivery", "deadline", "weeks", "days", "how soon", "rush"],
      reply: function () {
        return "Most lead-gen sites launch in <b>1–3 weeks</b>. You approve a design preview before the build starts, so there are zero surprises. Bigger builds with custom AI run a bit longer — Jesse gives you an exact date on the free strategy call.";
      },
      quick: ["cost", "book"]
    },
    {
      id: "ai",
      kw: ["ai", "chatbot", "bot", "automation", "automate", "chatgpt", "artificial intelligence", "24/7", "24 7", "always on"],
      reply: function () {
        return "The AI work is Jesse's specialty: <b>chatbots that answer your customers 24/7</b>, smart lead-capture forms, and automated follow-ups that work while you sleep.<br>Fun fact — <i>I'm</i> a live demo of exactly that, running on this site. That's the AI Lead Engine package (" + fmt("engine") + ").";
      },
      quick: ["cost", "quote", "book"]
    },
    {
      id: "services",
      kw: ["service", "offer", "what do you do", "redesign", "landing page", "build", "design", "website"],
      reply: function () {
        return "Three things:<br><b>1.</b> Lead-generation websites that turn visitors into booked calls.<br><b>2.</b> AI features — chatbots, automation, smart forms.<br><b>3.</b> Premium design &amp; build — fast, mobile-first, modern.<br>One goal behind all of it: more leads.";
      },
      quick: ["cost", "ai", "quote"]
    },
    {
      id: "process",
      kw: ["process", "how it works", "steps", "how do we start", "getting started", "start", "work with"],
      reply: function () {
        return "Four steps, no mystery:<br><b>1.</b> Free 20-min strategy call.<br><b>2.</b> Design preview — you approve the look before it's built.<br><b>3.</b> Build &amp; launch, mobile-first, AI wired in.<br><b>4.</b> Grow &amp; support, with tracking in place.<br>Step 1 is free — want it?";
      },
      quick: ["book", "cost"]
    },
    {
      id: "booking",
      kw: ["book", "call", "schedule", "talk", "contact", "calendly", "strategy", "consult", "appointment", "meet", "phone number", "phone"],
      reply: function () {
        return 'Grab a <b>free 20-minute strategy call</b> here:<br><a href="' + esc(calendly()) + '" target="_blank" rel="noopener">Book your call</a><br>No pitch — your goals, your customers, and a straight answer on whether Jesse can help.';
      },
      quick: ["cost", "timeline"],
      track: ["book_call", { method: "chatbot" }]
    },
    {
      id: "checklist",
      kw: ["checklist", "free", "download", "guide", "audit", "freebie", "ebook"],
      reply: function () {
        return 'Grab the <b>free 44-point Website Conversion Checklist</b> — the same audit Jesse runs on client sites, condensed into a 20-minute self-check:<br><a href="' + esc(checklist()) + '">Get the checklist</a>';
      },
      quick: ["cost", "book"]
    },
    {
      id: "seo",
      kw: ["seo", "google", "rank", "ranking", "search engine", "traffic", "found online"],
      reply: function () {
        return "Every site ships with <b>technical SEO foundations</b> — fast load times, mobile-first, proper titles and meta, clean structure. That's what Google rewards first. Full ongoing SEO campaigns are a separate conversation, but your site won't launch with SEO holes.";
      },
      quick: ["cost", "quote"]
    },
    {
      id: "redesign",
      kw: ["redesign", "revamp", "refresh", "update my site", "existing site", "current site", "already have"],
      reply: function () {
        return "Redesigns are a sweet spot — most start with the free 44-point checklist audit to find exactly what's leaking leads, then we rebuild around the fixes instead of guessing. Want Jesse to take a look at your current site?";
      },
      quick: ["quote", "checklist"]
    },
    {
      id: "ecommerce",
      kw: ["ecommerce", "e-commerce", "shop", "store", "sell online", "products online", "stripe", "payment"],
      reply: function () {
        return "Yes — stores and online payments can be built in. Pricing depends on catalog size and payment setup, so this one's quote-only. Tell me what you're selling and Jesse will price it precisely.";
      },
      quick: ["quote"]
    },
    {
      id: "products",
      kw: ["product", "spreadsheet", "cashflow", "template", "digital", "tool"],
      reply: function () {
        return "Jesse also sells digital tools — right now it's the <b>Freelancer Cashflow OS</b> ($24): turns irregular freelance income into a predictable paycheck, with auto tax-split tracking and overdue-invoice alarms. Check the Products section.";
      },
      quick: ["cost", "book"]
    },
    {
      id: "reviews",
      kw: ["review", "testimonial", "proof", "portfolio", "work examples", "past work", "clients", "results"],
      reply: function () {
        return "Straight answer: JBizz is a newer studio, so there are no borrowed testimonials here. What you get instead: a <b>design preview before anything is built</b>, a 1–3 week turnaround in writing, and direct access to Jesse the whole way. The portfolio section above shows the caliber of the work.";
      },
      quick: ["quote", "book"]
    },
    {
      id: "location",
      kw: ["florida", "where", "location", "based", "remote", "nationwide", "local", "area", "fort lauderdale"],
      reply: function () {
        return "<b>Fort Lauderdale, Florida</b> — working with clients <b>nationwide</b>. Calls, previews, launch: all remote, all smooth. Location has never been an issue.";
      },
      quick: ["book", "cost"]
    },
    {
      id: "human",
      kw: ["human", "person", "real person", "jesse", "follow up", "followup", "call me", "email me", "owner", "founder", "someone"],
      reply: function () {
        return "You got it — I'll hand you straight to Jesse. Two quick questions so he shows up prepared.";
      },
      quick: [],
      flow: "contact"
    },
    {
      id: "thanks",
      kw: ["thank", "thanks", "thx", "awesome", "great", "cool", "perfect", "nice", "helpful"],
      reply: function () {
        return "Anytime. Fastest next step is the free strategy call — or run the free checklist on your own site first and bring the results.";
      },
      quick: ["book", "checklist"]
    },
    {
      id: "bye",
      kw: ["bye", "goodbye", "see you", "later", "gtg", "good night"],
      reply: function () {
        return "Catch you later. The checklist and the free call aren't going anywhere.";
      },
      quick: []
    }
  ];

  var QUICK_LABELS = {
    cost: "What does it cost?",
    services: "What do you do?",
    timeline: "How long does it take?",
    ai: "What AI features?",
    book: "Book a free call",
    checklist: "Free checklist",
    quote: "Get a custom quote",
    expensive: "That sounds expensive"
  };

  function matchIntent(text) {
    var t = normalize(text);
    var best = null, bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i], score = 0;
      for (var k = 0; k < it.kw.length; k++) {
        var kw = normalize(it.kw[k]).trim();
        if (kw && t.indexOf(kw) !== -1) score += kw.length;
      }
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return bestScore > 0 ? best : null;
  }

  /* ---------------- multi-turn flows -------------------------------------- */
  var flow = null; // { name, step, data }
  var leadCaptured = false;

  var FLOWS = {
    /* Custom quote: need -> timeline -> name -> email -> done */
    quote: [
      {
        say: function () { return "Love it — I'll line up a precise quote. Three quick questions. First: <b>what do you need?</b>"; },
        quick: ["quote_new", "quote_redesign", "quote_ai"],
        handle: function (text, d) {
          var t = normalize(text);
          if (t.indexOf("redesign") !== -1 || t.indexOf("revamp") !== -1) d.need = "Website redesign";
          else if (t.indexOf("ai") !== -1 || t.indexOf("chatbot") !== -1 || t.indexOf("automation") !== -1) d.need = "AI features";
          else d.need = "New website";
          return true;
        }
      },
      {
        say: function (d) { return "Got it — <b>" + esc(d.need) + "</b>. When are you looking to launch?"; },
        quick: ["quote_asap", "quote_month", "quote_exploring"],
        handle: function (text, d) {
          var t = normalize(text);
          if (t.indexOf("asap") !== -1 || t.indexOf("soon") !== -1 || t.indexOf("now") !== -1) d.timeline = "ASAP";
          else if (t.indexOf("month") !== -1 || t.indexOf("weeks") !== -1) d.timeline = "Within a month";
          else d.timeline = "Just exploring";
          return true;
        }
      },
      {
        say: function () { return "And your <b>name</b>?"; },
        quick: [],
        handle: function (text, d) {
          var name = String(text).trim().slice(0, 60);
          if (name.length < 2) return false;
          d.name = name;
          return true;
        },
        retry: "Just your first name is fine — what should I call you?"
      },
      {
        say: function (d) { return "Thanks, " + esc(d.name) + ". Where should Jesse send the quote — your <b>email</b>?"; },
        quick: [],
        handle: function (text, d) {
          var email = String(text).trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
          d.email = email;
          return true;
        },
        retry: "Hmm, that email doesn't look right — mind double-checking it?"
      }
    ],
    /* Direct handoff: name -> email -> done */
    contact: [
      {
        say: function () { return "First — your <b>name</b>?"; },
        quick: [],
        handle: function (text, d) {
          var name = String(text).trim().slice(0, 60);
          if (name.length < 2) return false;
          d.name = name;
          return true;
        },
        retry: "Just your first name works — what is it?"
      },
      {
        say: function (d) { return "Thanks, " + esc(d.name) + ". And the best <b>email</b> to reach you?"; },
        quick: [],
        handle: function (text, d) {
          var email = String(text).trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
          d.email = email;
          return true;
        },
        retry: "That email looks off — one more try?"
      }
    ]
  };

  var FLOW_QUICK = {
    quote_new: "New website",
    quote_redesign: "Redesign my site",
    quote_ai: "AI features",
    quote_asap: "ASAP",
    quote_month: "Within a month",
    quote_exploring: "Just exploring"
  };

  function startFlow(name) {
    flow = { name: name, step: 0, data: {} };
    track("chat_flow_start", { flow: name });
    runFlowStep();
  }

  function runFlowStep() {
    var steps = FLOWS[flow.name];
    var step = steps[flow.step];
    var msg = step.say(flow.data);
    var quick = (step.quick || []).map(function (k) { return { key: k, label: FLOW_QUICK[k] || k }; });
    showTyping(function () {
      botSay(msg, []);
      renderQuickKeys(quick);
    });
  }

  function flowInput(text) {
    var steps = FLOWS[flow.name];
    var step = steps[flow.step];
    var key = Object.keys(FLOW_QUICK).filter(function (k) { return FLOW_QUICK[k] === text; })[0];
    var value = key ? FLOW_QUICK[key] : text;
    if (!step.handle(value, flow.data)) {
      showTyping(function () { botSay(step.retry || "Didn't quite get that — one more try?", []); });
      return;
    }
    flow.step++;
    if (flow.step >= steps.length) {
      finishFlow();
    } else {
      runFlowStep();
    }
  }

  function finishFlow() {
    var d = flow.data, name = flow.name;
    flow = null;
    renderQuickKeys([]);
    var payload = { name: d.name, email: d.email, source: "chatbot_" + name, page: location.href };
    if (d.need) payload.need = d.need;
    if (d.timeline) payload.timeline = d.timeline;
    showTyping(function () {
      botSay("Sending that over…", []);
      postLead(payload).then(function () {
        leadCaptured = true;
        track("chat_lead", { source: "chatbot_" + name });
        var extra = name === "quote"
          ? "Jesse will send your custom quote within <b>one business day</b>."
          : "Jesse will personally follow up within <b>one business day</b>.";
        botSay("Done" + (d.name ? ", " + esc(d.name) : "") + ". " + extra +
          '<br><br>Impatient? <a href="' + esc(calendly()) + '" target="_blank" rel="noopener">Book a free call right now</a> — no waiting.',
          ["book", "checklist"]);
      });
    });
  }

  /* ---------------- UI ----------------------------------------------------- */
  var panel, messages, quickWrap, input, fab, teaser;

  var CHAT_SVG = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

  function buildUI() {
    fab = document.createElement("button");
    fab.id = "jbz-chat-fab";
    fab.setAttribute("aria-label", "Chat with " + BOT_NAME);
    fab.innerHTML = CHAT_SVG + '<span class="jbz-badge"></span><span class="jbz-ping"></span>';

    teaser = document.createElement("button");
    teaser.id = "jbz-teaser";
    teaser.setAttribute("aria-label", "Open chat");
    teaser.innerHTML = "<b>Questions about cost or timelines?</b><span>" + BOT_NAME + " replies instantly</span>";

    panel = document.createElement("div");
    panel.id = "jbz-chat-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with " + BOT_NAME);
    panel.innerHTML =
      '<div class="jbz-chat-header">' +
        '<div class="jbz-chat-avatar">B</div>' +
        '<div><div class="jbz-chat-title">' + BOT_NAME + ' <span>· JBizz AI Assistant</span></div>' +
        '<div class="jbz-chat-status"><span class="dot"></span>Online — replies instantly</div></div>' +
        '<button class="jbz-chat-close" aria-label="Close chat">&times;</button>' +
      "</div>" +
      '<div id="jbz-chat-messages" aria-live="polite"></div>' +
      '<div class="jbz-quick" id="jbz-chat-quick"></div>' +
      '<div class="jbz-chat-input">' +
        '<input id="jbz-chat-text" type="text" placeholder="Ask about pricing, timelines, AI…" autocomplete="off" maxlength="500" aria-label="Type your message">' +
        '<button id="jbz-chat-send" aria-label="Send">&#10148;</button>' +
      "</div>";

    document.body.appendChild(fab);
    document.body.appendChild(teaser);
    document.body.appendChild(panel);

    messages = panel.querySelector("#jbz-chat-messages");
    quickWrap = panel.querySelector("#jbz-chat-quick");
    input = panel.querySelector("#jbz-chat-text");

    fab.addEventListener("click", function () { toggle(); });
    teaser.addEventListener("click", function () { hideTeaser(); toggle(true); });
    panel.querySelector(".jbz-chat-close").addEventListener("click", function () { toggle(false); });
    panel.querySelector("#jbz-chat-send").addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) toggle(false);
    });

    scheduleProactive();
  }

  var opened = false;

  function toggle(force) {
    var willOpen = typeof force === "boolean" ? force : !panel.classList.contains("open");
    if (willOpen) {
      opened = true;
      store.set("opened", "1");
      hideTeaser();
      fab.classList.remove("has-unread");
      fab.classList.add("is-open");
      panel.classList.add("open");
      track("chat_open", {});
      if (messages.children.length === 0) greet();
      setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }, 250);
    } else {
      fab.classList.remove("is-open");
      panel.classList.remove("open");
    }
  }

  function greet() {
    track("chat_greet", {});
    if (store.get("greeted")) {
      botSay("Welcome back. Still weighing a website? Ask me anything — <b>pricing</b>, <b>timelines</b>, <b>AI features</b>.", ["cost", "quote", "book"]);
    } else {
      store.set("greeted", "1");
      botSay("Hey — I'm <b>" + BOT_NAME + "</b>, the JBizz assistant. I answer instantly, 24/7.<br>Ask me about <b>pricing</b>, <b>timelines</b>, or the <b>AI features</b> Jesse builds — or tap one below.", ["cost", "services", "book"]);
    }
  }

  function scheduleProactive() {
    // Teaser bubble after 18s (once per session, only if never opened)
    setTimeout(function () {
      if (!opened && !store.get("teaser_seen") && !panel.classList.contains("open")) {
        store.set("teaser_seen", "1");
        teaser.classList.add("show");
        track("chat_teaser", {});
        setTimeout(hideTeaser, 14000);
      }
    }, 18000);
    // Unread badge nudge after 45s
    setTimeout(function () {
      if (!opened) fab.classList.add("has-unread");
    }, 45000);
    // Exit intent (desktop pointers only), once per session
    try {
      if (window.matchMedia && window.matchMedia("(pointer:fine)").matches) {
        document.addEventListener("mouseout", function (e) {
          if (!e.relatedTarget && e.clientY <= 0 && !opened && !store.get("exit_seen")) {
            store.set("exit_seen", "1");
            track("chat_exit_intent", {});
            toggle(true);
            setTimeout(function () {
              botSay("Quick one before you go — <b>what's holding you back</b> on the website? Price, timing, or just not sure where to start?", ["cost", "timeline", "quote"]);
            }, 600);
          }
        });
      }
    } catch (e) {}
  }

  function hideTeaser() { if (teaser) teaser.classList.remove("show"); }

  function scrollDown() { messages.scrollTop = messages.scrollHeight; }

  function botSay(html, quick) {
    var d = document.createElement("div");
    d.className = "jbz-msg bot";
    d.innerHTML = html;
    messages.appendChild(d);
    renderQuickKeys((quick || []).map(function (k) { return { key: k, label: QUICK_LABELS[k] || k }; }));
    scrollDown();
  }

  function userSay(text) {
    var d = document.createElement("div");
    d.className = "jbz-msg user";
    d.textContent = text;
    messages.appendChild(d);
    scrollDown();
  }

  function renderQuickKeys(items) {
    quickWrap.innerHTML = "";
    (items || []).forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = item.label;
      b.addEventListener("click", function () { handleUserText(item.label); });
      quickWrap.appendChild(b);
    });
  }

  function showTyping(cb, text) {
    var d = document.createElement("div");
    d.className = "jbz-msg bot typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(d);
    scrollDown();
    // Realistic delay scaled to reply length
    var delay = Math.min(1600, 450 + (text ? text.replace(/<[^>]*>/g, "").length * 12 : 300));
    setTimeout(function () { d.remove(); cb(); }, delay);
  }

  /* ---------------- conversation ------------------------------------------- */
  var fallbackCount = 0;

  function send() {
    var t = input.value.trim();
    if (!t) return;
    input.value = "";
    handleUserText(t);
  }

  function handleUserText(text) {
    userSay(text);
    renderQuickKeys([]);
    if (flow) { flowInput(text); return; }

    var intent = matchIntent(text);
    if (!intent) {
      fallbackCount++;
      if (fallbackCount >= 2 && !leadCaptured) {
        showTyping(function () {
          botSay("I want to give you a real answer, not a guess — let me hand you to Jesse directly.", []);
          setTimeout(function () { startFlow("contact"); }, 800);
        }, "handover");
      } else {
        showTyping(function () {
          botSay("Didn't quite catch that. I can help with <b>pricing</b>, <b>timelines</b>, <b>AI features</b>, a <b>custom quote</b>, or <b>booking a free call</b> — which one?", ["cost", "quote", "ai", "book"]);
        }, "fallback");
      }
      return;
    }
    fallbackCount = 0;

    // Special actions
    if (intent.id === "quote_trigger") { startFlow("quote"); return; }
    if (intent.flow) { startFlow(intent.flow); return; }

    var reply = intent.reply();
    if (intent.track) track(intent.track[0], intent.track[1]);
    showTyping(function () { botSay(reply, intent.quick); }, reply);
  }

  // "Get a custom quote" needs to be matchable from free text too
  INTENTS.push({
    id: "quote_trigger",
    kw: ["quote", "estimate", "how much for my", "what would it cost", "custom quote", "get a quote"],
    reply: function () { return ""; },
    quick: []
  });

  /* ---------------- boot ---------------------------------------------------- */
  buildUI();
  window.jbzChat = {
    open: function () { toggle(true); },
    close: function () { toggle(false); }
  };
  // Exposed for automated testing only
  window.__jbzChat = { matchIntent: matchIntent, esc: esc, normalize: normalize, INTENTS: INTENTS };
})();
