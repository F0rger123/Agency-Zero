/*
 * L&M Tire and Wheel: shared site script.
 * Renders the shared chrome (icons, header, menu, footer, cart, quick-action bar),
 * runs the cart, the product sheet, the forms, the hours status, galleries and reveals.
 * Plain ES5-friendly JS, no build step. Every page sets <body data-page="...">.
 */
(function () {
  "use strict";

  var PHONE = "717-259-0567";
  var TEL = "tel:+17172590567";
  var MAPS_DIR = "https://www.google.com/maps/dir/?api=1&destination=L%26M+Tire+and+Wheel%2C+185+West+King+Street%2C+Abbottstown%2C+PA+17301";
  var REVIEWS_URL = "https://share.google/DiG5vSC5TweEVVtUW";
  var page = document.body.getAttribute("data-page") || "";

  /* ---------------------------------------------------------------- utils */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function money0(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function icon(id, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : "") + ' aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function store(key, val) {
    try {
      if (val === undefined) { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(key, JSON.stringify(val));
    } catch { return null; }
    return val;
  }
  // Affirm-style estimate: 12 monthly payments at 15% APR (Affirm rates run 0-36% APR).
  function monthly(amount, months, apr) {
    months = months || 12; apr = apr === undefined ? 15 : apr;
    if (apr === 0) return amount / months;
    var r = apr / 100 / 12;
    return amount * r / (1 - Math.pow(1 + r, -months));
  }
  window.LM = { money: money, monthly: monthly, esc: esc, icon: icon };

  /* ---------------------------------------------------------------- icons */
  var sprite =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-wheel" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v7.5M12 14.5V22M2 12h7.5M14.5 12H22M4.9 4.9l5.3 5.3M13.8 13.8l5.3 5.3M19.1 4.9l-5.3 5.3M10.2 13.8l-5.3 5.3"/></symbol>' +
    '<symbol id="i-tire" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></symbol>' +
    '<symbol id="i-shirt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 6.6 16 4a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.5 1.2l1.2 3.4a1 1 0 0 0 1.3.6L7 11.3V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8.7l1.4.5a1 1 0 0 0 1.3-.6l1.2-3.4a1 1 0 0 0-.5-1.2z"/></symbol>' +
    '<symbol id="i-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2.5-6h13l2.5 6v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/></symbol>' +
    '<symbol id="i-ruler" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2-2M10.5 13.5l2-2M13.5 16.5l2-2"/></symbol>' +
    '<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>' +
    '<symbol id="i-wrench" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/></symbol>' +
    '<symbol id="i-rotate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></symbol>' +
    '<symbol id="i-balance" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14M3 7h18"/><path d="m6 7-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/></symbol>' +
    '<symbol id="i-gauge" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/></symbol>' +
    '<symbol id="i-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></symbol>' +
    '<symbol id="i-store" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4h14v12H1zM15 9h4l4 4v3h-8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></symbol>' +
    '<symbol id="i-lift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10M8 7l4-4 4 4"/><path d="M4 17h16"/><circle cx="7" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></symbol>' +
    '<symbol id="i-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/></symbol>' +
    '<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>' +
    '<symbol id="i-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/></symbol>' +
    '<symbol id="i-card" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></symbol>' +
    '<symbol id="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></symbol>' +
    '<symbol id="i-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></symbol>' +
    '<symbol id="i-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></symbol>' +
    '<symbol id="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></symbol>' +
    '<symbol id="i-fb" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.2C16.7 2.1 15.6 2 14.4 2 11.8 2 10 3.6 10 6.5v2H7.3v3.7H10V22h4v-9.8h2.8l.4-3.7z"/></symbol>' +
    '<symbol id="i-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></symbol>' +
    '<symbol id="i-tt" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.3-1.5z"/></symbol>' +
    '<symbol id="i-google" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></symbol>' +
    '</defs></svg>';
  document.body.insertAdjacentHTML("afterbegin", sprite);

  /* --------------------------------------------------------------- chrome */
  var NAV = [
    ["shop", "shop.html", "Shop"],
    ["services", "services.html", "Services"],
    ["financing", "financing.html", "Financing"],
    ["builds", "index.html#builds", "Builds"],
    ["reviews", "index.html#reviews", "Reviews"],
    ["contact", "contact.html", "Contact"]
  ];
  function navLinks(cls) {
    return NAV.map(function (n) {
      return '<a href="' + n[1] + '"' + (page === n[0] ? ' aria-current="page"' : "") + (cls ? ' ' + cls : "") + '>' + n[2] + '</a>';
    }).join("");
  }

  var header =
    '<div class="topbar"><div class="wrap">' +
    '<span>#SupportLocal &middot; Family owned &amp; operated since 1987</span>' +
    '<span>No appointment needed &middot; Same-day installation</span>' +
    '<span>Call <a href="' + TEL + '">' + PHONE + '</a></span>' +
    '</div></div>' +
    '<header class="nav"><div class="wrap">' +
    '<a class="nav-logo" href="index.html" aria-label="L&amp;M Tire and Wheel home"><img src="assets/logo-light.png" alt="L&amp;M Tire and Wheel" width="512" height="166"></a>' +
    '<nav class="nav-links" aria-label="Main">' + navLinks() + '</nav>' +
    '<div class="nav-cta">' +
    '<a class="nav-phone" href="' + TEL + '">' + PHONE + '</a>' +
    '<a class="btn btn-red btn-sm shop-cta" href="shop.html">Shop now</a>' +
    '<button class="cart-btn" type="button" aria-label="Open cart" data-cart-open>' + icon("cart") + '<span class="cart-count" data-cart-count>0</span></button>' +
    '<button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer" data-menu-open>' + icon("menu") + '</button>' +
    '</div></div></header>' +
    '<div class="drawer" id="drawer" aria-hidden="true">' +
    '<div class="drawer-head"><img src="assets/logo-light.png" alt="L&amp;M Tire and Wheel" width="512" height="166" style="height:36px;width:auto">' +
    '<button class="menu-btn" type="button" aria-label="Close menu" data-menu-close>' + icon("close") + '</button></div>' +
    '<nav aria-label="Mobile">' + '<a href="index.html" data-menu-close>Home</a>' + navLinks("data-menu-close") + '</nav>' +
    '<a class="btn btn-red" href="' + TEL + '">' + icon("phone") + ' Call ' + PHONE + '</a>' +
    '</div>';

  var footer =
    '<footer><div class="wrap"><div class="foot">' +
    '<div><img src="assets/logo-light.png" alt="L&amp;M Tire and Wheel" width="512" height="166" loading="lazy">' +
    '<p>Custom wheels, tires and lift kits. Family owned and operated in Abbottstown, PA since 1987.</p>' +
    '<div class="socials">' +
    '<a href="https://www.facebook.com/LMTireAndWheel" target="_blank" rel="noopener" aria-label="Facebook">' + icon("fb") + '</a>' +
    '<a href="https://www.instagram.com/lmtirewheel/" target="_blank" rel="noopener" aria-label="Instagram">' + icon("ig") + '</a>' +
    '<a href="https://www.tiktok.com/@lmtirewheel" target="_blank" rel="noopener" aria-label="TikTok">' + icon("tt") + '</a>' +
    '</div></div>' +
    '<div><h4>Shop</h4><ul>' +
    '<li><a href="shop.html?type=wheel">Wheels</a></li><li><a href="shop.html?type=tire">Tires</a></li>' +
    '<li><a href="shop.html?type=apparel">Apparel</a></li><li><a href="financing.html">Financing</a></li></ul></div>' +
    '<div><h4>Company</h4><ul>' +
    '<li><a href="index.html#about">About us</a></li><li><a href="services.html">Services</a></li>' +
    '<li><a href="index.html#reviews">Reviews</a></li><li><a href="contact.html">Contact us</a></li></ul></div>' +
    '<div><h4>Visit</h4><ul>' +
    '<li><a href="' + TEL + '">' + PHONE + '</a></li>' +
    '<li><a href="' + MAPS_DIR + '" target="_blank" rel="noopener">185 West King Street<br>Abbottstown, PA 17301</a></li>' +
    '<li style="color:var(--muted);font-size:14px">Mon 9&ndash;5 &middot; Tue&ndash;Wed 9&ndash;6<br>Thu&ndash;Fri 9&ndash;5</li></ul></div>' +
    '</div><div class="legal"><span>&copy; ' + new Date().getFullYear() + ' L&amp;M Tire and Wheel. All rights reserved.</span>' +
    '<span>Website by Agency Zero</span></div></div></footer>' +
    '<nav class="mbar" aria-label="Quick actions">' +
    '<a href="' + TEL + '" class="primary">' + icon("phone") + 'Call</a>' +
    '<a href="' + MAPS_DIR + '" target="_blank" rel="noopener">' + icon("pin") + 'Directions</a>' +
    '<a href="shop.html">' + icon("wheel") + 'Shop</a></nav>' +
    '<div class="scrim" data-scrim></div>' +
    '<aside class="cart-panel" aria-label="Your cart" aria-hidden="true" data-cart-panel>' +
    '<div class="cart-head"><b>Your cart</b><button class="menu-btn" type="button" aria-label="Close cart" data-cart-close>' + icon("close") + '</button></div>' +
    '<div class="cart-items" data-cart-items></div>' +
    '<div class="cart-foot" data-cart-foot></div></aside>' +
    '<div class="toast" role="status" aria-live="polite" data-toast></div>';

  var headerSlot = $("[data-chrome=header]");
  if (headerSlot) headerSlot.outerHTML = header;
  var footerSlot = $("[data-chrome=footer]");
  if (footerSlot) footerSlot.outerHTML = footer;

  // Preview pill: tells anyone testing that this is the not-yet-live preview.
  var pillHidden = false;
  try { pillHidden = sessionStorage.getItem("lm_pill") === "0"; } catch { /* ignore */ }
  if (!pillHidden && page !== "compare") {
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="preview-bar" data-pill><div class="wrap"><span><i></i>Preview of your new website, not live yet</span>' +
      '<a href="compare.html">See before &amp; after ' + icon("arrow") + '</a>' +
      '<button type="button" aria-label="Hide preview note" data-pill-close>&times;</button></div></div>');
    $("[data-pill-close]").addEventListener("click", function () {
      $("[data-pill]").remove();
      try { sessionStorage.setItem("lm_pill", "0"); } catch { /* ignore */ }
    });
  }

  /* --------------------------------------------------------------- drawer */
  var drawer = $("#drawer");
  var openBtn = $("[data-menu-open]");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    openBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (openBtn) openBtn.addEventListener("click", function () { setDrawer(true); });
  $$("[data-menu-close]").forEach(function (el) { el.addEventListener("click", function () { setDrawer(false); }); });

  /* ---------------------------------------------------------------- toast */
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(html) {
    if (!toastEl) return;
    toastEl.innerHTML = icon("check") + "<span>" + html + "</span>";
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3600);
  }

  /* ----------------------------------------------------------------- cart */
  var catalog = window.LM_CATALOG || [];
  var byId = {};
  catalog.forEach(function (p) { byId[p.id] = p; });
  var cart = store("lm_cart") || [];

  function cartCount() { return cart.reduce(function (n, i) { return n + i.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (n, i) { return n + i.unit * i.qty; }, 0); }
  function saveCart() { store("lm_cart", cart); renderCart(); }

  function addToCart(p, option, qty, unit) {
    var key = p.id + "|" + (option || "");
    var line = cart.filter(function (i) { return i.key === key; })[0];
    if (line) line.qty = Math.min(line.qty + qty, 24);
    else cart.push({ key: key, id: p.id, kind: p.kind, brand: p.brand, model: p.model, finish: p.finish || "", img: p.img, option: option || "", unit: unit, qty: qty });
    saveCart();
    var b = $("[data-cart-open]") || document.createElement("i");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    toast("Added " + qty + " &times; " + esc(p.model) + ' <a href="#" data-cart-open-link>View cart</a>');
    var l = $("[data-cart-open-link]");
    if (l) l.addEventListener("click", function (e) { e.preventDefault(); setCart(true); });
  }

  function optionLabel(i) {
    if (!i.option) return i.kind === "apparel" ? "" : "Size confirmed with you";
    if (i.kind === "wheel") return i.option + "″ diameter";
    if (i.kind === "tire") return "Size " + i.option;
    return "Size " + i.option;
  }

  function lineHtml(i, compact) {
    return '<div class="citem">' +
      '<img src="' + esc(i.img) + '" alt="" loading="lazy"' + (i.kind === "apparel" ? ' class="cover"' : "") + '>' +
      '<div><small>' + esc(i.brand) + '</small><b>' + esc(i.model) + '</b>' +
      '<span class="opt">' + esc([i.finish, optionLabel(i)].filter(Boolean).join(" · ")) + '</span></div>' +
      '<div class="right"><b>' + money(i.unit * i.qty) + '</b>' +
      (compact ? '<span class="opt">' + i.qty + ' &times; ' + money(i.unit) + '</span>' :
        '<span class="qty"><button type="button" aria-label="Decrease" data-q="-1" data-key="' + esc(i.key) + '">&minus;</button><output>' + i.qty + '</output>' +
        '<button type="button" aria-label="Increase" data-q="1" data-key="' + esc(i.key) + '">+</button></span>' +
        '<button class="link-btn" type="button" data-remove="' + esc(i.key) + '">Remove</button>') +
      '</div></div>';
  }

  function totalsHtml() {
    var t = cartTotal();
    return '<div class="row"><span>Estimated subtotal</span><b>' + money(t) + '</b></div>' +
      '<div class="row"><span>Or with Affirm</span><b>from ' + money0(monthly(t)) + '/mo*</b></div>';
  }

  function renderCart() {
    var n = cartCount();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.classList.toggle("has", n > 0); });
    var items = $("[data-cart-items]");
    var foot = $("[data-cart-foot]");
    if (!items) return;
    if (!cart.length) {
      items.innerHTML = '<div class="cart-empty">' + icon("cart") + '<b style="color:#fff">Your cart is empty</b><span>Browse wheels, tires and L&amp;M gear.</span>' +
        '<a class="btn btn-red" href="shop.html">Start shopping</a></div>';
      foot.innerHTML = "";
    } else {
      items.innerHTML = cart.map(function (i) { return lineHtml(i, false); }).join("");
      foot.innerHTML = totalsHtml() +
        '<a class="btn btn-red" href="checkout.html">Check out ' + icon("arrow") + '</a>' +
        '<p class="fine" style="margin:0">No payment is taken online. We confirm fitment, final price and your install time before anything is ordered. *Estimate at 15% APR for 12 months; Affirm rates 0&ndash;36% APR, subject to eligibility.</p>';
    }
    document.dispatchEvent(new CustomEvent("lm:cart"));
  }

  var cartPanel = $("[data-cart-panel]");
  var scrim = $("[data-scrim]");
  function setCart(open) {
    if (!cartPanel) return;
    cartPanel.classList.toggle("open", open);
    cartPanel.setAttribute("aria-hidden", String(!open));
    scrim.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("[data-cart-close]").focus();
  }
  $$("[data-cart-open]").forEach(function (b) { b.addEventListener("click", function () { setCart(true); }); });
  if (cartPanel) {
    $("[data-cart-close]").addEventListener("click", function () { setCart(false); });
    scrim.addEventListener("click", function () { setCart(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setCart(false); setDrawer(false); }
  });
  document.addEventListener("click", function (e) {
    var q = e.target.closest("[data-q]");
    var r = e.target.closest("[data-remove]");
    if (q) {
      var line = cart.filter(function (i) { return i.key === q.getAttribute("data-key"); })[0];
      if (line) {
        line.qty = Math.max(1, Math.min(24, line.qty + Number(q.getAttribute("data-q"))));
        saveCart();
      }
    }
    if (r) {
      cart = cart.filter(function (i) { return i.key !== r.getAttribute("data-remove"); });
      saveCart();
    }
  });
  renderCart();

  window.LM.cart = {
    items: function () { return cart.slice(); },
    total: cartTotal,
    clear: function () { cart = []; saveCart(); },
    lineHtml: lineHtml,
    totalsHtml: totalsHtml
  };

  /* -------------------------------------------------------- product sheet */
  var sheet = document.createElement("dialog");
  sheet.className = "sheet-dialog";
  sheet.setAttribute("aria-label", "Product details");
  document.body.appendChild(sheet);
  sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener("close", function () {
    if (location.hash.indexOf("#p=") === 0) history.replaceState(null, "", location.pathname + location.search);
  });
  function closeSheet() { if (sheet.open) sheet.close(); }

  function unitFor(p, option) {
    if (p.options) {
      var o = p.options.filter(function (x) { return x[0] === option; })[0];
      if (o) return o[1];
    }
    return p.price;
  }

  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    var isApparel = p.kind === "apparel";
    var qty = isApparel ? 1 : 4;
    var optHtml = "";
    if (p.kind === "wheel") {
      optHtml = '<div class="field"><label for="pd-opt">Wheel diameter</label><select class="select" id="pd-opt">' +
        (p.diameters && p.diameters.length ? p.diameters.map(function (d) { return '<option value="' + d + '">' + d + '″</option>'; }).join("") : "") +
        '<option value="">Not sure, help me choose</option></select></div>';
    } else if (p.kind === "tire") {
      optHtml = '<div class="field"><label for="pd-opt">Tire size' + (p.sizeCount ? ' <span style="color:var(--dim);font-weight:500">(' + p.sizeCount + ' available)</span>' : "") + '</label>' +
        '<select class="select" id="pd-opt"><option value="">Not sure, match my vehicle</option>' +
        (p.sizes || []).map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join("") +
        '</select></div>';
    } else if (p.options) {
      optHtml = '<div class="field"><label for="pd-opt">Size</label><select class="select" id="pd-opt">' +
        p.options.map(function (o) { return '<option value="' + o[0] + '">' + o[0] + (o[1] !== p.price ? " (+" + money(o[1] - p.price) + ")" : "") + '</option>'; }).join("") +
        '</select></div>';
    }
    var unitWord = p.kind === "wheel" ? "wheel" : p.kind === "tire" ? "tire" : "each";
    var perks = p.kind === "apparel" ? ["Pick up at the shop or we'll set it aside for you", "Rep the shop that's been here since 1987"] :
      ["Fitment checked by our team before we order", "Installed by ASE certified technicians, most the same day",
        p.kind === "tire" ? "Free rotations with any set of 4 tires" : "Road-force balancing available", "Pay over time with Affirm"];
    var sizeLine = p.kind === "wheel" ? (p.diameters && p.diameters.length ? "Available in " + p.diameters.join("″, ") + "″" : "Multiple sizes, ask us for yours") :
      p.kind === "tire" ? (p.sizeCount ? p.sizeCount + (p.sizeCount === 1 ? " size" : " sizes") + " available" : "Multiple sizes available") : "";
    var tags = (p.tags || []).map(function (t) { return t === "3PMS" ? "Severe snow rated (3PMS)" : t; });
    if (p.warranty) tags.push(p.warranty);
    if (p.seat) tags.push(p.seat);
    if (p.moreFinishes) tags.push(p.moreFinishes + " more finish" + (p.moreFinishes > 1 ? "es" : "") + " available");

    sheet.innerHTML =
      '<button class="sheet-close" type="button" aria-label="Close" data-sheet-close>' + icon("close") + '</button>' +
      '<div class="pd"><div class="pd-media' + (isApparel ? " cover" : "") + '"><img src="' + esc(p.img) + '" alt="' + esc(p.brand + " " + p.model) + '"></div>' +
      '<div class="pd-body">' +
      '<small class="brand">' + esc(p.brand) + (p.kind === "apparel" ? " apparel" : "") + '</small>' +
      '<h2>' + esc(p.model) + '</h2>' +
      (p.finish || sizeLine ? '<p class="pd-sub">' + esc([p.finish, sizeLine].filter(Boolean).join(" · ")) + '</p>' : "") +
      '<div class="pd-price"><span>' + (p.priceLabel === "from" ? "Starting at" : "") + '</span><b data-pd-unit>' + money(p.price) + '</b><span>/' + unitWord + '</span></div>' +
      (p.rebate ? '<div class="note">' + icon("tag") + '<span><b>' + esc(p.rebate) + '</b> on this tire. Ask us about it when we call to confirm.</span></div>' : "") +
      (tags.length ? '<div class="pd-tags">' + tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + '</div>' : "") +
      optHtml +
      '<div class="pd-actions"><span class="qty"><button type="button" aria-label="Fewer" data-pd-q="-1">&minus;</button><output data-pd-qty>' + qty + '</output><button type="button" aria-label="More" data-pd-q="1">+</button></span>' +
      '<button class="btn btn-red" type="button" data-pd-add>' + icon("cart") + ' Add to cart</button></div>' +
      '<div class="pd-total"><span>Estimated total</span><b data-pd-total></b></div>' +
      '<ul class="pd-list">' + perks.map(function (t) { return "<li>" + icon("check") + "<span>" + esc(t) + "</span></li>"; }).join("") + '</ul>' +
      '</div></div>';

    var opt = $("#pd-opt", sheet);
    function refresh() {
      var unit = unitFor(p, opt ? opt.value : "");
      $("[data-pd-unit]", sheet).textContent = money(unit);
      $("[data-pd-total]", sheet).textContent = money(unit * qty) + (p.kind === "apparel" ? "" : " · or " + money0(monthly(unit * qty)) + "/mo with Affirm");
      $("[data-pd-qty]", sheet).textContent = qty;
    }
    $$("[data-pd-q]", sheet).forEach(function (b) {
      b.addEventListener("click", function () { qty = Math.max(1, Math.min(24, qty + Number(b.getAttribute("data-pd-q")))); refresh(); });
    });
    if (opt) opt.addEventListener("change", refresh);
    $("[data-pd-add]", sheet).addEventListener("click", function () {
      var o = opt ? opt.value : "";
      addToCart(p, o, qty, unitFor(p, o));
      closeSheet();
    });
    $("[data-sheet-close]", sheet).addEventListener("click", closeSheet);
    refresh();
    if (typeof sheet.showModal === "function") sheet.showModal(); else sheet.setAttribute("open", "");
    if (location.hash !== "#p=" + id) history.replaceState(null, "", "#p=" + id);
  }
  window.LM.openProduct = openProduct;
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-product]");
    if (t) { e.preventDefault(); openProduct(t.getAttribute("data-product")); }
  });
  function fromHash() {
    var m = /^#p=([\w-]+)/.exec(location.hash);
    if (m && byId[m[1]]) openProduct(m[1]);
  }
  window.addEventListener("hashchange", fromHash);
  setTimeout(fromHash, 0);

  /* ----------------------------------------------------- product card html */
  window.LM.cardHtml = function (p) {
    var unitWord = p.kind === "wheel" ? "/wheel" : p.kind === "tire" ? "/tire" : "";
    var meta = p.kind === "wheel" ? [p.finish, p.diameters && p.diameters.length ? p.diameters.join("″ · ") + "″" : ""] :
      p.kind === "tire" ? [(p.tags || []).filter(function (t) { return t !== "3PMS"; }).slice(0, 2).join(" · "), p.sizeCount ? p.sizeCount + (p.sizeCount === 1 ? " size" : " sizes") : ""] :
        [p.options ? "Sizes S–XXL" : "One size"];
    var badge = p.featured ? '<span class="badge">Staff pick</span>' : p.rebate ? '<span class="badge alt">Rebate</span>' : "";
    return '<button class="pcard' + (p.kind === "apparel" ? " apparel" : "") + '" type="button" data-product="' + p.id + '">' + badge +
      '<div class="prod-img"><img src="' + esc(p.img) + '" alt="" loading="lazy" width="440" height="330"></div>' +
      '<small>' + esc(p.brand) + '</small><h3>' + esc(p.model) + '</h3>' +
      '<span class="meta">' + esc(meta.filter(Boolean).join(" · ")) + '</span>' +
      '<div class="price-row"><span>' + (p.priceLabel === "from" ? "From" : "") + '</span><b>' + money(p.price) + '<span> ' + unitWord + '</span></b></div>' +
      (p.kind === "apparel" ? "" : '<div class="mo">or <b>' + money0(monthly(p.price * 4)) + '/mo</b> for a set of 4*</div>') +
      '</button>';
  };

  /* ---------------------------------------------------------------- forms */
  var PHONE_RE = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validate(form) {
    var ok = true;
    $$(".field", form).forEach(function (f) {
      var el = $("input, select, textarea", f);
      if (!el || el.disabled || f.closest("[hidden]")) return;
      var v = (el.value || "").trim();
      var bad = false;
      if (el.required && !v) bad = true;
      else if (v && el.type === "tel" && !PHONE_RE.test(v)) bad = true;
      else if (v && el.type === "email" && !EMAIL_RE.test(v)) bad = true;
      f.classList.toggle("invalid", bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    $$("[data-need-one]", form).forEach(function (g) {
      var any = $$("input", g).some(function (i) { return i.checked; });
      g.classList.toggle("invalid", !any);
      if (!any && ok) { ok = false; g.scrollIntoView({ block: "center" }); }
    });
    return ok;
  }
  document.addEventListener("input", function (e) {
    var f = e.target.closest(".field.invalid");
    if (f) f.classList.remove("invalid");
  });
  function reference(prefix) {
    var n = Math.floor(10000 + Math.random() * 89999);
    return prefix + "-" + n;
  }
  // Every form on the site posts here. In this preview nothing leaves the browser;
  // at launch this becomes one POST to the shop's inbox / text alerts.
  window.LM.submit = function (form, kind, extra) {
    if (!validate(form)) return null;
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = data[k] ? data[k] + ", " + v : v; });
    var ref = reference(kind === "order" ? "LM" : "REQ");
    var log = store("lm_submissions") || [];
    log.push({ ref: ref, kind: kind, at: new Date().toISOString(), data: data, extra: extra || null });
    store("lm_submissions", log.slice(-20));
    return ref;
  };
  window.LM.successHtml = function (title, ref, body) {
    return '<div class="success">' +
      '<span class="tick-big">' + icon("check") + '</span>' +
      '<h2>' + title + '</h2>' +
      '<p>Reference <span class="ref">' + ref + '</span></p>' +
      '<p>' + body + '</p>' +
      '<div class="note" style="text-align:left;max-width:520px">' + icon("info") + '<span><b>Preview mode:</b> this request stays in your browser and isn\'t sent anywhere yet. When the site goes live it goes straight to the shop\'s phone and inbox.</span></div>' +
      '<div class="hero-actions" style="justify-content:center"><a class="btn btn-ghost" href="index.html">Back to home</a><a class="btn btn-red" href="' + TEL + '">' + icon("phone") + ' Call ' + PHONE + '</a></div>' +
      '</div>';
  };
  $$("form[data-simple-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ref = window.LM.submit(form, form.getAttribute("data-simple-form"));
      if (!ref) return;
      form.innerHTML = window.LM.successHtml(form.getAttribute("data-success-title") || "Message sent", ref,
        form.getAttribute("data-success-body") || "Thanks! Someone from L&amp;M will get back to you during shop hours, usually the same day.");
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  // Pre-select a form topic or service from the URL, e.g. contact.html?topic=wholesale
  var params = new URLSearchParams(location.search);
  $$("[data-param]").forEach(function (el) {
    var v = params.get(el.getAttribute("data-param"));
    if (!v) return;
    if (el.tagName === "SELECT") { el.value = v; }
    else { $$('input[value="' + v + '"]', el).forEach(function (i) { i.checked = true; }); }
  });

  /* -------------------------------------------------------- vehicle store */
  window.LM.vehicle = {
    get: function () { return store("lm_vehicle"); },
    set: function (v) { store("lm_vehicle", v); document.dispatchEvent(new CustomEvent("lm:vehicle")); }
  };
  window.LM.MAKES = ["Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia", "Land Rover",
    "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram", "Rivian", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other"];
  window.LM.fillYearMake = function (yearSel, makeSel) {
    var now = new Date().getFullYear() + 1;
    var y = '<option value="">Year</option>';
    for (var i = now; i >= 1980; i--) y += '<option>' + i + '</option>';
    yearSel.innerHTML = y;
    makeSel.innerHTML = '<option value="">Make</option>' + window.LM.MAKES.map(function (m) { return "<option>" + m + "</option>"; }).join("");
  };

  /* --------------------------------------------------------------- hours */
  var hours = { 0: null, 1: [9, 17], 2: [9, 18], 3: [9, 18], 4: [9, 17], 5: [9, 17], 6: null };
  try {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    var now = (parseInt(get("hour"), 10) % 24) + parseInt(get("minute"), 10) / 60;
    $$("[data-hours] tr").forEach(function (tr) {
      if (tr.getAttribute("data-days").split(",").indexOf(String(day)) !== -1) tr.classList.add("today");
    });
    var h = hours[day];
    var label;
    var open = !!(h && now >= h[0] && now < h[1]);
    if (open) label = "Open now · until " + (h[1] - 12) + "pm";
    else {
      var next = day, guard = 0;
      do { next = (next + 1) % 7; guard++; } while (!hours[next] && guard < 7);
      var opensToday = h && now < h[0];
      label = "Closed · opens " + (opensToday ? "today" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][next]) + " at 9am";
    }
    $$("[data-status]").forEach(function (s) { s.classList.toggle("open", open); $("span", s).textContent = label; });
  } catch { /* keep static label */ }

  /* ------------------------------------------------------------- reveals */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
  document.body.classList.remove("no-js");

  /* ----------------------------------------------- mobile quick-action bar */
  var mbar = $(".mbar");
  var hero = $(".hero, .page-hero");
  if (mbar && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { mbar.classList.toggle("show", !entries[0].isIntersecting); }).observe(hero);
  } else if (mbar) {
    mbar.classList.add("show");
  }

  /* ------------------------------------------------------------- gallery */
  var moreBtn = $("[data-gallery-more]");
  if (moreBtn) moreBtn.addEventListener("click", function () {
    $$(".shot.is-hidden").forEach(function (s) { s.classList.remove("is-hidden"); });
    moreBtn.remove();
  });
  var lb = $(".lightbox");
  if (lb) {
    var shots = $$(".shot");
    var lbImg = $("img", lb);
    var lbCount = $(".lb-count", lb);
    var current = 0;
    var visible = function () { return shots.filter(function (s) { return !s.classList.contains("is-hidden"); }); };
    var show = function (i) {
      var list = visible();
      current = (i + list.length) % list.length;
      lbImg.src = list[current].getAttribute("data-full");
      lbImg.alt = $("img", list[current]).alt;
      lbCount.textContent = (current + 1) + " / " + list.length;
    };
    shots.forEach(function (s) {
      s.addEventListener("click", function () {
        show(visible().indexOf(s));
        if (typeof lb.showModal === "function") lb.showModal(); else window.open(s.getAttribute("data-full"), "_blank");
      });
    });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { show(current - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------------------------------------------------- review read-more */
  $$(".review").forEach(function (r) {
    var q = $(".clamp", r);
    var b = $(".more", r);
    if (!q || !b) return;
    if (q.scrollHeight > q.clientHeight + 4) {
      b.hidden = false;
      b.addEventListener("click", function () {
        var openNow = r.classList.toggle("expanded");
        b.textContent = openNow ? "Show less" : "Read more";
      });
    }
  });

  /* -------------------------------------------------------- generic tabs */
  $$("[data-tabs]").forEach(function (group) {
    var btns = $$("[role=tab]", group);
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) {
          var on = b === btn;
          b.setAttribute("aria-selected", String(on));
          var panel = document.getElementById(b.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
      });
    });
  });

  window.LM.reviewsUrl = REVIEWS_URL;
})();
