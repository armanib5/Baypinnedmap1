/* BayPinned admin tool: a private pin/zone editor, not linked from the
   public map. It edits an in-memory + localStorage-backed copy of the
   PLACES data and lets you export/download a replacement data/places.js -
   there's no backend yet, so nothing here is "live" until you paste the
   export over the real file and redeploy. */

var DRAFT_KEY = "baypinned-admin-draft-v1";
var workingPlaces = loadDraft();
var markerById = {};
var zoneLayerById = {};
var selectedId = null; // null means "creating a new pin"
var zoneMode = null;   // null | "corner1" | "corner2"
var zoneTargetId = null;
var zoneCorner1 = null;
var touched = {}; // id -> "added" | "edited" | "deleted" (for the pending list)
var tempMarker = null; // draggable placeholder shown while creating a new pin, before Save

var storageBroken = false;

function loadDraft() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { storageBroken = true; }
  return JSON.parse(JSON.stringify(PLACES));
}

/* Autosave silently failed before if localStorage.setItem threw - which it
   does on iOS Safari Private Browsing even for tiny strings, with zero
   visible error. Now every save updates an on-screen status line so you
   can actually see whether it worked instead of trusting it blindly. */
function saveDraft() {
  var el = document.getElementById("saveStatus");
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(workingPlaces));
    storageBroken = false;
    if (el) { el.textContent = "Autosaved to this browser at " + new Date().toLocaleTimeString(); el.className = "savestatus ok"; }
    return true;
  } catch (e) {
    storageBroken = true;
    if (el) { el.textContent = "Autosave is NOT working in this browser (private/incognito mode blocks it) - export or download before you close this tab, or your edits will be lost!"; el.className = "savestatus bad"; }
    return false;
  }
}

function catIcon(cat) {
  var info = CATS[cat] || { c: "#888" };
  var html = '<div style="width:26px;height:26px;border-radius:50%;background:' + info.c +
    ';border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.55);"></div>';
  return L.divIcon({ html: html, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
}

function populateSelects() {
  var catSel = document.getElementById("fCat");
  Object.keys(CATS).forEach(function (cat) {
    var opt = document.createElement("option");
    opt.value = cat; opt.textContent = CATS[cat].l;
    catSel.appendChild(opt);
  });
  var hoodSel = document.getElementById("fHood");
  HOODS.forEach(function (h) {
    var opt = document.createElement("option");
    opt.value = h.id; opt.textContent = h.l;
    hoodSel.appendChild(opt);
  });
}

function buildMarker(place) {
  var m = L.marker([place.lat, place.lng], { icon: catIcon(place.cat), draggable: true });
  m.bindTooltip(place.t);
  m.on("click", function () {
    if (zoneMode && recordZoneCorner(m.getLatLng())) return;
    selectPlace(place.id);
  });
  m.on("dragend", function () {
    var ll = m.getLatLng();
    place.lat = round4(ll.lat); place.lng = round4(ll.lng);
    if (selectedId === place.id) {
      document.getElementById("fLat").value = place.lat;
      document.getElementById("fLng").value = place.lng;
    }
    touch(place.id, "edited");
    saveDraft();
  });
  markerById[place.id] = m;
  m.addTo(map);
}

function round4(n) { return Math.round(n * 10000) / 10000; }

function refreshZoneLayer(place) {
  if (zoneLayerById[place.id]) { map.removeLayer(zoneLayerById[place.id]); delete zoneLayerById[place.id]; }
  if (place.zone) {
    var poly = L.polygon(place.zone, { color: "#dc2626", weight: 2, dashArray: "6 4", fillColor: "#dc2626", fillOpacity: 0.22 });
    poly.addTo(map);
    zoneLayerById[place.id] = poly;
  }
}

function touch(id, kind) { touched[id] = kind; renderPendingList(); }
function renderPendingList() {
  var el = document.getElementById("pendingList");
  var keys = Object.keys(touched);
  if (!keys.length) { el.innerHTML = "No unsaved changes yet this session."; return; }
  el.innerHTML = keys.map(function (id) {
    var label = touched[id] === "deleted" ? id : ((workingPlaces.find(function (p) { return p.id === id; }) || {}).t || id);
    return "<span>" + touched[id] + ": " + label + "</span>";
  }).join("");
}

function clearForm() {
  ["fName","fAddr","fWhen","fDesc","fPk","fTr","fWeb","fEd"].forEach(function (id) { document.getElementById(id).value = ""; });
  document.getElementById("fRecur").value = "";
  document.getElementById("fSh").value = "";
  document.getElementById("fEh").value = "";
  document.getElementById("fCat").value = "market";
  document.getElementById("fHood").value = HOODS[0].id;
}

function selectPlace(id) {
  selectedId = id;
  zoneMode = null; zoneTargetId = null; zoneCorner1 = null;
  clearTempMarker();
  document.getElementById("modeHint").textContent = "";
  var p = workingPlaces.find(function (x) { return x.id === id; });
  if (!p) return;
  document.getElementById("panelTitle").textContent = "Editing: " + p.t;
  document.getElementById("fCat").value = p.cat;
  document.getElementById("fHood").value = p.hood;
  document.getElementById("fName").value = p.t || "";
  document.getElementById("fAddr").value = p.a || "";
  document.getElementById("fLat").value = p.lat;
  document.getElementById("fLng").value = p.lng;
  document.getElementById("fWhen").value = p.w || "";
  document.getElementById("fRecur").value = p.d || "";
  document.getElementById("fSh").value = p.sh != null ? p.sh : "";
  document.getElementById("fEh").value = p.eh != null ? p.eh : "";
  document.getElementById("fEd").value = p.ed || "";
  document.getElementById("fWeb").value = p.wb || "";
  document.getElementById("fDesc").value = p.ds || "";
  document.getElementById("fPk").value = p.pk || "";
  document.getElementById("fTr").value = p.tr || "";
  document.getElementById("btnDelete").disabled = false;
}

function tempIcon() {
  var html = '<div style="width:30px;height:30px;border-radius:50%;background:rgba(184,134,11,.85);' +
    'border:3px dashed #fff;box-shadow:0 2px 8px rgba(0,0,0,.6);"></div>';
  return L.divIcon({ html: html, className: "", iconSize: [30, 30], iconAnchor: [15, 15] });
}

/* Starts a new pin at latlng AND drops a draggable placeholder marker
   there immediately, so you can drag it to the exact spot before ever
   touching the form - much easier on mobile than needing to click the
   precise right pixel among 40+ existing pins. */
function startNewPin(latlng) {
  selectedId = null;
  zoneMode = null; zoneTargetId = null; zoneCorner1 = null;
  document.getElementById("modeHint").textContent = "Drag the gold dashed pin to the exact spot, then fill in the form and Save.";
  document.getElementById("panelTitle").textContent = "New pin (unsaved) - fill in the form and click Save Pin";
  clearForm();
  document.getElementById("fLat").value = round4(latlng.lat);
  document.getElementById("fLng").value = round4(latlng.lng);
  document.getElementById("btnDelete").disabled = true;

  if (tempMarker) map.removeLayer(tempMarker);
  tempMarker = L.marker(latlng, { icon: tempIcon(), draggable: true });
  tempMarker.on("dragend", function () {
    var ll = tempMarker.getLatLng();
    document.getElementById("fLat").value = round4(ll.lat);
    document.getElementById("fLng").value = round4(ll.lng);
  });
  tempMarker.addTo(map);
}

function clearTempMarker() {
  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
}

function readForm() {
  var num = function (v) { return v === "" ? undefined : parseFloat(v); };
  var obj = {
    cat: document.getElementById("fCat").value,
    hood: document.getElementById("fHood").value,
    t: document.getElementById("fName").value.trim(),
    a: document.getElementById("fAddr").value.trim(),
    lat: parseFloat(document.getElementById("fLat").value),
    lng: parseFloat(document.getElementById("fLng").value),
    w: document.getElementById("fWhen").value.trim(),
    d: document.getElementById("fRecur").value || undefined,
    sh: num(document.getElementById("fSh").value),
    eh: num(document.getElementById("fEh").value),
    ed: document.getElementById("fEd").value || undefined,
    wb: document.getElementById("fWeb").value.trim() || undefined,
    ds: document.getElementById("fDesc").value.trim(),
    pk: document.getElementById("fPk").value.trim() || undefined,
    tr: document.getElementById("fTr").value.trim() || undefined
  };
  Object.keys(obj).forEach(function (k) { if (obj[k] === undefined) delete obj[k]; });
  return obj;
}

function savePin() {
  var data = readForm();
  if (!data.t || isNaN(data.lat) || isNaN(data.lng)) { alert("Name, latitude, and longitude are required."); return; }
  if (selectedId) {
    var p = workingPlaces.find(function (x) { return x.id === selectedId; });
    if (!p) return;
    var oldZone = p.zone;
    Object.keys(p).forEach(function (k) { delete p[k]; });
    Object.assign(p, { id: selectedId }, data);
    if (oldZone) p.zone = oldZone;
    var m = markerById[selectedId];
    m.setLatLng([p.lat, p.lng]);
    m.setIcon(catIcon(p.cat));
    m.setTooltipContent(p.t);
    touch(selectedId, "edited");
  } else {
    var id = "u" + Date.now();
    var np = Object.assign({ id: id }, data);
    workingPlaces.push(np);
    buildMarker(np);
    clearTempMarker();
    selectedId = id;
    document.getElementById("btnDelete").disabled = false;
    touch(id, "added");
  }
  document.getElementById("modeHint").textContent = "";
  document.getElementById("panelTitle").textContent = "Editing: " + data.t;
  saveDraft();
}

function deletePin() {
  if (!selectedId) return;
  if (!confirm("Delete this pin?")) return;
  var id = selectedId;
  if (markerById[id]) { map.removeLayer(markerById[id]); delete markerById[id]; }
  if (zoneLayerById[id]) { map.removeLayer(zoneLayerById[id]); delete zoneLayerById[id]; }
  workingPlaces = workingPlaces.filter(function (p) { return p.id !== id; });
  touch(id, "deleted");
  selectedId = null;
  document.getElementById("panelTitle").textContent = "No pin selected";
  clearForm();
  document.getElementById("btnDelete").disabled = true;
  saveDraft();
}

function startZone() {
  if (!selectedId) { alert("Select (or save) a pin first, then draw its zone."); return; }
  zoneMode = "corner1";
  zoneTargetId = selectedId;
  document.getElementById("modeHint").textContent = "Zone mode: click the map for corner 1 of 2.";
}

function clearZone() {
  if (!selectedId) return;
  var p = workingPlaces.find(function (x) { return x.id === selectedId; });
  if (!p) return;
  delete p.zone;
  if (zoneLayerById[selectedId]) { map.removeLayer(zoneLayerById[selectedId]); delete zoneLayerById[selectedId]; }
  touch(selectedId, "edited");
  saveDraft();
}

/* Shared by both the map's own click handler and each marker's click
   handler - while a zone is being drawn, clicking an existing pin near/at
   a corner should still count as placing that corner instead of
   selecting the pin (selectPlace() would otherwise cancel zone mode). */
function recordZoneCorner(latlng) {
  if (zoneMode === "corner1") {
    zoneCorner1 = latlng;
    zoneMode = "corner2";
    document.getElementById("modeHint").textContent = "Zone mode: click the map for corner 2 of 2.";
    return true;
  }
  if (zoneMode === "corner2") {
    var c1 = zoneCorner1, c2 = latlng;
    var n = Math.max(c1.lat, c2.lat), s = Math.min(c1.lat, c2.lat);
    var w = Math.min(c1.lng, c2.lng), ee = Math.max(c1.lng, c2.lng);
    var p = workingPlaces.find(function (x) { return x.id === zoneTargetId; });
    if (p) {
      p.zone = [[s, w], [s, ee], [n, ee], [n, w]];
      refreshZoneLayer(p);
      touch(p.id, "edited");
      saveDraft();
    }
    zoneMode = null; zoneTargetId = null; zoneCorner1 = null;
    document.getElementById("modeHint").textContent = "";
    return true;
  }
  return false;
}

function handleMapClick(e) {
  if (recordZoneCorner(e.latlng)) return;
  startNewPin(e.latlng);
}

function generateFileContents() {
  var out = "";
  out += "var CATS = " + JSON.stringify(CATS, null, 2) + ";\n\n";
  out += "var CAT_ORDER = " + JSON.stringify(CAT_ORDER) + ";\n\n";
  out += "var HOODS = " + JSON.stringify(HOODS, null, 2) + ";\n\n";
  out += "var PLACES = " + JSON.stringify(workingPlaces, null, 2) + ";\n";
  return out;
}

function exportData() {
  var box = document.getElementById("exportOut");
  box.value = generateFileContents();
  box.classList.add("show");
  box.select();
  try { document.execCommand("copy"); } catch (e) {}
}

function downloadData() {
  var blob = new Blob([generateFileContents()], { type: "text/javascript" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "places.js";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetDraft() {
  if (!confirm("Discard your local draft and reload the original data from data/places.js?")) return;
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  location.reload();
}

var map;
function initAdmin() {
  var start = HOODS[0];
  map = L.map("adminMap", { center: [start.lat, start.lng], zoom: start.zoom });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: "abcd", maxZoom: 20
  }).addTo(map);

  populateSelects();
  clearForm();
  workingPlaces.forEach(function (p) { buildMarker(p); refreshZoneLayer(p); });
  renderPendingList();

  map.on("click", handleMapClick);
  document.getElementById("btnSave").onclick = savePin;
  document.getElementById("btnDelete").onclick = deletePin;
  document.getElementById("btnZoneStart").onclick = startZone;
  document.getElementById("btnZoneClear").onclick = clearZone;
  document.getElementById("btnCancel").onclick = function () {
    selectedId = null; zoneMode = null; zoneTargetId = null; zoneCorner1 = null;
    clearTempMarker();
    document.getElementById("panelTitle").textContent = "No pin selected";
    document.getElementById("modeHint").textContent = "";
    clearForm();
    document.getElementById("btnDelete").disabled = true;
  };
  document.getElementById("btnAddHere").onclick = function () { startNewPin(map.getCenter()); };
  document.getElementById("btnExport").onclick = exportData;
  document.getElementById("btnDownload").onclick = downloadData;
  document.getElementById("btnResetDraft").onclick = resetDraft;
  document.getElementById("btnDelete").disabled = true;
  saveDraft(); // populate the save-status line immediately so you know up front if autosave works here
}

document.addEventListener("DOMContentLoaded", initAdmin);
