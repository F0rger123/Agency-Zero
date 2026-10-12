/* Home page: catalog finder toggle, brand marquee loop, staff-pick rails. */
(function () {
  "use strict";
  var LM = window.LM;
  var catalog = window.LM_CATALOG || [];

  // Brand marquee: duplicate the track once for a seamless loop.
  var track = document.querySelector(".marquee-track");
  if (track) {
    Array.prototype.slice.call(track.children).forEach(function (a) {
      var c = a.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.tabIndex = -1; track.appendChild(c);
    });
  }

  // Finder: wheels / tires toggle swaps the three shortcuts.
  var finder = {
    wheel: { size: "Shop by wheel size", sizeSub: "Pick a diameter from 15″ to 24″.", all: "Browse all wheels", allSub: "Fuel, Method, KG1, TIS & more." },
    tire: { size: "Shop by tire size", sizeSub: "Type the size on your sidewall, like 275/65R18.", all: "Browse all tires", allSub: "Nitto, Toyo, BFGoodrich, Michelin & more." }
  };
  function setFinder(kind) {
    document.querySelectorAll("[data-finder]").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-finder") === (kind === "wheel" ? "wheels" : "tires")));
    });
    var l = finder[kind];
    document.querySelector("[data-label-size]").textContent = l.size;
    document.querySelector("[data-sub-size]").textContent = l.sizeSub;
    document.querySelector("[data-label-all]").textContent = l.all;
    document.querySelector("[data-sub-all]").textContent = l.allSub;
    document.querySelector('[data-finder-link="vehicle"]').href = "shop.html?type=" + kind + "&vehicle=1";
    document.querySelector('[data-finder-link="size"]').href = "shop.html?type=" + kind + "&size=1";
    document.querySelector('[data-finder-link="all"]').href = "shop.html?type=" + kind;
  }
  document.querySelectorAll("[data-finder]").forEach(function (btn) {
    btn.addEventListener("click", function () { setFinder(btn.getAttribute("data-finder") === "wheels" ? "wheel" : "tire"); });
  });
  if (document.querySelector("[data-finder-link]")) setFinder("wheel");

  // Staff picks rails: the shop's own featured products, then a few more of the same kind.
  document.querySelectorAll("[data-rail-list]").forEach(function (rail) {
    var kind = rail.getAttribute("data-rail-list");
    var picks = catalog.filter(function (p) { return p.kind === kind && p.featured; });
    var extra = catalog.filter(function (p) { return p.kind === kind && !p.featured && p.price && (kind === "wheel" ? p.stock !== "Low Stock" : (p.sizeCount || 0) > 10); });
    picks = picks.concat(extra.slice(0, Math.max(0, 8 - picks.length)));
    rail.innerHTML = picks.map(function (p) {
      return '<button class="prod" type="button" data-product="' + p.id + '" style="text-align:left;color:inherit;cursor:pointer">' +
        '<div class="prod-img"><img src="' + LM.esc(p.img) + '" alt="" loading="lazy"></div>' +
        '<small>' + LM.esc(p.brand) + '</small><h3>' + LM.esc(p.model) + '</h3>' +
        '<div class="price"><span>Starting at</span><b>' + LM.money(p.price) + ' <i>/' + kind + '</i></b></div></button>';
    }).join("");
  });

  // Rails tabs (Tires / Wheels)
  document.querySelectorAll("[data-rail]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-rail");
      document.querySelectorAll("[data-rail]").forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
      document.getElementById("rail-tires").hidden = kind !== "tires";
      document.getElementById("rail-wheels").hidden = kind !== "wheels";
    });
  });
})();
