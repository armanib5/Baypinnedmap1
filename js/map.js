/* BayPinned interactive map — Leaflet-based, replaces the old hand-drawn
   SVG map while keeping the wood-frame/gold vintage container around it. */

var ICONS = {
  leaf: "\u{1F343}", fork: "\u{1F374}", cup: "\u{1F378}", palette: "\u{1F3A8}",
  art: "\u{1F5BC}", mask: "\u{1F3AD}", star: "⭐", bag: "\u{1F6CD}",
  P: "P", restroom: "\u{1F6BB}", train: "\u{1F686}"
};

var map, clusterGroup, userMarker, activeHood = "downtown", activeCat = "all";
var markerById = {};

function pinDivIcon(cat) {
  var info = CATS[cat] || { c: "#666", icon: "leaf" };
  var glyph = ICONS[info.icon] || "\u{1F4CD}";
  var html =
    '<div class="bp-pin">' +
    '<svg width="34" height="44" viewBox="0 0 34 44">' +
    '<path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" ' +
    'fill="' + info.c + '" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="17" cy="17" r="11" fill="rgba(255,255,255,.92)"/>' +
    '</svg>' +
    '<div style="position:absolute;top:5px;left:0;right:0;text-align:center;font-size:14px;line-height:1;">' + glyph + '</div>' +
    '</div>';
  return L.divIcon({ html: html, className: "", iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -40] });
}

function clusterIcon(cluster) {
  var count = cluster.getChildCount();
  var size = count < 10 ? "small" : count < 25 ? "medium" : "large";
  var px = size === "small" ? 40 : size === "medium" ? 50 : 60;
  return L.divIcon({
    html: '<div class="bp-cluster ' + size + '">' + count + '</div>',
    className: "", iconSize: [px, px]
  });
}

function haversine(lat1, lng1, lat2, lng2) {
  var R = 3958.8, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

var userLoc = null;

function popupHtml(p) {
  var info = CATS[p.cat] || { l: p.cat, c: "#666" };
  var mu = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.a || p.t);
  var distLine = "";
  if (userLoc) {
    var d = haversine(userLoc.lat, userLoc.lng, p.lat, p.lng);
    distLine = "<div><b>Distance:</b> " + d.toFixed(1) + " mi from you</div>";
  }
  var html = '<div class="bp-card">';
  html += '<span class="bp-cat" style="background:' + info.c + '">' + info.l + '</span>';
  html += '<h3>' + p.t + '</h3>';
  if (p.ds) html += '<div class="bp-desc">' + p.ds + '</div>';
  html += '<div class="bp-meta">';
  if (p.a) html += '<div><b>Address:</b> ' + p.a + '</div>';
  html += distLine;
  if (p.pk) html += '<div><b>Parking:</b> ' + p.pk + '</div>';
  if (p.tr) html += '<div><b>Transit:</b> ' + p.tr + '</div>';
  html += '</div>';
  html += '<div class="bp-btnrow">';
  html += '<a class="bp-btn blue" href="' + mu + '" target="_blank" rel="noopener">Directions</a>';
  html += '<button class="bp-btn gold" onclick="alert(\'Full details coming soon.\')">Full Details</button>';
  if (p.wb) html += '<a class="bp-btn purple" href="' + p.wb + '" target="_blank" rel="noopener">Website</a>';
  html += '</div></div>';
  return html;
}

function buildMarkers() {
  clusterGroup = L.markerClusterGroup({ iconCreateFunction: clusterIcon, maxClusterRadius: 50 });
  PLACES.forEach(function (p) {
    var m = L.marker([p.lat, p.lng], { icon: pinDivIcon(p.cat) });
    m.bindPopup(popupHtml(p), { closeButton: true, autoPanPadding: [20, 20] });
    m.on("popupopen", function () { m.setPopupContent(popupHtml(p)); });
    m.bpPlace = p;
    markerById[p.id] = m;
    clusterGroup.addLayer(m);
  });
  map.addLayer(clusterGroup);
}

function applyFilters() {
  clusterGroup.eachLayer(function (m) { clusterGroup.removeLayer(m); });
  PLACES.forEach(function (p) {
    var hoodOk = p.hood === activeHood;
    var catOk = activeCat === "all" || p.cat === activeCat;
    if (hoodOk && catOk) clusterGroup.addLayer(markerById[p.id]);
  });
}

function initHoodRow() {
  var row = document.getElementById("hoodRow");
  HOODS.forEach(function (h) {
    var b = document.createElement("button");
    b.className = "hoodbtn" + (h.id === activeHood ? " on" : "");
    b.textContent = h.l;
    b.onclick = function () {
      document.querySelectorAll(".hoodbtn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      activeHood = h.id;
      document.getElementById("mapTitle").textContent = h.l + " Map";
      map.flyTo([h.lat, h.lng], h.zoom, { duration: 1.1 });
      applyFilters();
    };
    row.appendChild(b);
  });
}

function initFilterRow() {
  var row = document.getElementById("filtRow");
  var all = document.createElement("button");
  all.className = "filtbtn on"; all.textContent = "All"; all.dataset.cat = "all";
  all.onclick = function () { setActiveFilter(all, "all"); };
  row.appendChild(all);
  CAT_ORDER.forEach(function (cat) {
    var info = CATS[cat];
    var b = document.createElement("button");
    b.className = "filtbtn";
    b.dataset.cat = cat;
    b.innerHTML = '<span class="filtdot" style="background:' + info.c + '"></span>' + info.l;
    b.onclick = function () { setActiveFilter(b, cat); };
    row.appendChild(b);
  });
}
function setActiveFilter(btn, cat) {
  document.querySelectorAll(".filtbtn").forEach(function (x) { x.classList.remove("on"); });
  btn.classList.add("on");
  activeCat = cat;
  applyFilters();
}

function initSearch() {
  var input = document.getElementById("msInput"), results = document.getElementById("msResults"), clear = document.getElementById("msClear");
  function render(q) {
    q = q.trim().toLowerCase();
    if (!q) { results.classList.remove("show"); return; }
    var matches = PLACES.filter(function (p) { return p.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
    results.innerHTML = "";
    if (!matches.length) {
      results.innerHTML = '<div class="msempty">No matches</div>';
    } else {
      matches.forEach(function (p) {
        var info = CATS[p.cat] || { c: "#666", l: p.cat };
        var row = document.createElement("div");
        row.className = "msrow";
        row.innerHTML = '<span class="msdot" style="background:' + info.c + '"></span><span class="msname">' + p.t + '</span><span class="mstype">' + info.l + '</span>';
        row.onclick = function () { selectPlace(p); results.classList.remove("show"); input.value = p.t; };
        results.appendChild(row);
      });
    }
    results.classList.add("show");
  }
  input.addEventListener("input", function () {
    clear.classList.toggle("show", !!input.value);
    render(input.value);
  });
  clear.addEventListener("click", function () { input.value = ""; clear.classList.remove("show"); results.classList.remove("show"); });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".mapsearch")) results.classList.remove("show");
  });
}

function selectPlace(p) {
  var hood = HOODS.find(function (h) { return h.id === p.hood; });
  if (hood && activeHood !== p.hood) {
    document.querySelectorAll(".hoodbtn").forEach(function (x) { x.classList.remove("on"); });
    var idx = HOODS.indexOf(hood);
    document.querySelectorAll(".hoodbtn")[idx].classList.add("on");
    activeHood = p.hood;
    document.getElementById("mapTitle").textContent = hood.l + " Map";
  }
  document.querySelectorAll(".filtbtn").forEach(function (x) { x.classList.remove("on"); });
  document.querySelector('.filtbtn[data-cat="all"]').classList.add("on");
  activeCat = "all";
  applyFilters();
  map.flyTo([p.lat, p.lng], 17, { duration: 1 });
  setTimeout(function () {
    var m = markerById[p.id];
    if (m) { clusterGroup.zoomToShowLayer(m, function () { m.openPopup(); }); }
  }, 300);
}

function locateUser() {
  if (!navigator.geolocation) { alert("Geolocation is not supported on this device."); return; }
  navigator.geolocation.getCurrentPosition(function (pos) {
    userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([userLoc.lat, userLoc.lng], {
      radius: 8, color: "#fff", weight: 2, fillColor: "#2c5f8a", fillOpacity: 1
    }).addTo(map).bindPopup("You are here");
    map.flyTo([userLoc.lat, userLoc.lng], 16, { duration: 1 });
  }, function () {
    alert("Could not get your location. Check location permissions.");
  }, { enableHighAccuracy: true, timeout: 8000 });
}

function initLegend() {
  var lg = document.getElementById("mapLegend");
  CAT_ORDER.forEach(function (cat) {
    var info = CATS[cat];
    var row = document.createElement("div");
    row.className = "li";
    row.innerHTML = '<div class="ld" style="background:' + info.c + '"></div>' + info.l;
    lg.appendChild(row);
  });
}

function initMap() {
  var start = HOODS[0];
  map = L.map("leafletMap", { zoomControl: false, center: [start.lat, start.lng], zoom: start.zoom });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd", maxZoom: 20
  }).addTo(map);

  buildMarkers();
  applyFilters();
  initHoodRow();
  initFilterRow();
  initSearch();
  initLegend();

  document.getElementById("zIn").onclick = function () { map.zoomIn(); };
  document.getElementById("zOut").onclick = function () { map.zoomOut(); };
  document.getElementById("zReset").onclick = function () { map.flyTo([start.lat, start.lng], start.zoom, { duration: .8 }); };
  document.getElementById("myLoc").onclick = locateUser;
}

document.addEventListener("DOMContentLoaded", initMap);
