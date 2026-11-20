// main.js – UHI Pekanbaru WebGIS
// OpenLayers + Buffer Analysis + Spatial Query + Foto Survei
import "./style.css";

import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import { fromLonLat, toLonLat } from "ol/proj";
import { getDistance } from "ol/sphere";
import { Icon, Style, Fill, Stroke, Circle as CircleStyle, Text } from "ol/style";
import Overlay from "ol/Overlay";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import { circular } from "ol/geom/Polygon";

/* ==========================================================================
   BASEMAP LAYERS
   ========================================================================== */

const osmLayer = new TileLayer({
  source: new OSM(),
  visible: true,
});

const satelliteLayer = new TileLayer({
  source: new XYZ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attributions: "© Esri, Maxar, GeoEye",
  }),
  visible: false,
});

const darkLayer = new TileLayer({
  source: new XYZ({
    url: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attributions: "© CartoDB",
  }),
  visible: false,
});

/* ==========================================================================
   COLOR HELPERS
   ========================================================================== */

// Warna berdasarkan kategori UHI
function getUHIColor(kategori) {
  switch (kategori) {
    case "Rendah": return { fill: "rgba(33,150,243,0.75)", stroke: "#1565c0", size: 10 };
    case "Sedang": return { fill: "rgba(255,152,0,0.85)", stroke: "#e65100", size: 13 };
    case "Tinggi": return { fill: "rgba(244,67,54,0.9)", stroke: "#b71c1c", size: 16 };
    default:       return { fill: "rgba(158,158,158,0.8)", stroke: "#616161", size: 10 };
  }
}

// Warna berdasarkan kondisi vegetasi
function getVegetasiColor(veg) {
  switch (veg) {
    case "Rimbun":    return "#1b5e20";
    case "Sedang":    return "#388e3c";
    case "Jarang":    return "#f9a825";
    case "Tidak ada": return "#b71c1c";
    default:          return "#9e9e9e";
  }
}

// Style titik survei: ukuran = intensitas UHI, warna = kategori UHI
function getSurveyStyle(feature, selected = false) {
  const props = feature.getProperties();
  const { fill, stroke, size } = getUHIColor(props.Kategori_UHI);
  const extraSize = selected ? 4 : 0;

  return new Style({
    image: new CircleStyle({
      radius: size + extraSize,
      fill: new Fill({ color: fill }),
      stroke: new Stroke({
        color: selected ? "#fff" : stroke,
        width: selected ? 3 : 1.5,
      }),
    }),
    text: new Text({
      text: String(props.No || ""),
      font: "bold 10px sans-serif",
      fill: new Fill({ color: "#fff" }),
      stroke: new Stroke({ color: stroke, width: 2 }),
    }),
  });
}

// Warna kecamatan
const kecColors = [
  "rgba(255,99,132,0.45)", "rgba(54,162,235,0.45)", "rgba(255,206,86,0.45)",
  "rgba(75,192,192,0.45)", "rgba(153,102,255,0.45)", "rgba(255,159,64,0.45)",
  "rgba(103,58,183,0.45)", "rgba(233,30,99,0.45)",   "rgba(76,175,80,0.45)",
  "rgba(0,188,212,0.45)",  "rgba(121,85,72,0.45)",   "rgba(0,150,136,0.45)",
];
function getKecColor(name) {
  if (!name) return kecColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return kecColors[Math.abs(hash) % kecColors.length];
}

/* ==========================================================================
   VECTOR DATA LAYERS
   ========================================================================== */

// Kabupaten Riau
const kabRiau = new VectorLayer({
  source: new VectorSource({ url: "/data/kab_riau.json", format: new GeoJSON() }),
  style: {
    "fill-color": ["interpolate", ["linear"], ["get", "FID"], 1, "#e3f2fd", 13, "#1565c0"],
    "stroke-color": "#0d47a1",
    "stroke-width": 1.5,
  },
  visible: true,
});

// Kecamatan Pekanbaru
const kecPku = new VectorLayer({
  source: new VectorSource({ url: "/data/kec_pku.json", format: new GeoJSON() }),
  style: (feature) => {
    const nama = feature.get("NAMOBJ") || feature.get("WADMKC") || feature.get("Kecamatan") || "x";
    return new Style({
      fill: new Fill({ color: getKecColor(String(nama)) }),
      stroke: new Stroke({ color: "#fff", width: 1.5 }),
      text: new Text({
        text: String(nama).replace("Kecamatan ",""),
        font: "11px sans-serif",
        fill: new Fill({ color: "#1a237e" }),
        stroke: new Stroke({ color: "rgba(255,255,255,0.8)", width: 3 }),
        overflow: false,
      }),
    });
  },
  visible: true,
});

// Jalur Survei Lama (ruas jalan terpisah, dari data sebelumnya)
const surveyLines = new VectorLayer({
  source: new VectorSource({ url: "/data/Polyline.json", format: new GeoJSON() }),
  style: new Style({
    stroke: new Stroke({ color: "#1976d2", width: 2.5 }),
  }),
  visible: false,
});

// Layer Jalur GPS Avenza – diambil langsung dari TrackingSurveiKelembaban.kml (3.542 titik GPS riil)
const avenzaTrackLayer = new VectorLayer({
  source: new VectorSource({
    url: "/data/tracking_avenza.geojson",
    format: new GeoJSON(),
  }),
  style: new Style({
    stroke: new Stroke({
      color: "#e91e63",
      width: 4,
    }),
  }),
  visible: true,
  zIndex: 8,
});

// Layer Rute Urutan Survei (Garis hubung langsung antar titik 1 ke 30)
const routeSource = new VectorSource();
const routeLayer = new VectorLayer({
  source: routeSource,
  style: new Style({
    stroke: new Stroke({
      color: "#ff9800",
      width: 2.5,
      lineDash: [6, 4],
    }),
  }),
  visible: false,
  zIndex: 7,
});

// Titik Survei UHI – layer utama dengan GeoJSON baru (berisi foto & kategori)
const surveySource = new VectorSource({
  format: new GeoJSON(),
  url: "/data/titik_survey_foto.geojson",
});

const surveyPoints = new VectorLayer({
  source: surveySource,
  style: (feature) => getSurveyStyle(feature),
  zIndex: 10,
  visible: true,
});

// Buffer Layer (isi dinamis saat analisis)
const bufferSource = new VectorSource();
const bufferLayer = new VectorLayer({
  source: bufferSource,
  style: new Style({
    fill: new Fill({ color: "rgba(244,67,54,0.08)" }),
    stroke: new Stroke({ color: "#f44336", width: 2, lineDash: [6,4] }),
  }),
  visible: false,
  zIndex: 5,
});

/* ==========================================================================
   OVERLAY (POPUP)
   ========================================================================== */

const popupEl = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const popupCloser = document.getElementById("popup-closer");

const overlay = new Overlay({
  element: popupEl,
  autoPan: { animation: { duration: 250 } },
});

popupCloser.onclick = (e) => {
  e.preventDefault();
  overlay.setPosition(undefined);
  popupCloser.blur();
};

/* ==========================================================================
   MAP INITIALIZATION
   ========================================================================== */

const map = new Map({
  target: "map",
  layers: [
    osmLayer, satelliteLayer, darkLayer,
    kabRiau, kecPku,
    avenzaTrackLayer, routeLayer, surveyLines,
    bufferLayer,
    surveyPoints,
  ],
  overlays: [overlay],
  view: new View({
    center: fromLonLat([101.438309, 0.51044]),
    zoom: 12,
  }),
});

/* ==========================================================================
   BASEMAP SWITCHER
   ========================================================================== */

document.querySelectorAll('input[name="basemap"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    osmLayer.setVisible(radio.value === "osm");
    satelliteLayer.setVisible(radio.value === "satellite");
    darkLayer.setVisible(radio.value === "dark");
  });
});

/* ==========================================================================
   LAYER CHECKBOXES
   ========================================================================== */

const layerMap = {
  "chk-riau":    kabRiau,
  "chk-kec":     kecPku,
  "chk-survey":  surveyPoints,
  "chk-route":   routeLayer,
  "chk-track":   avenzaTrackLayer,
  "chk-line":    surveyLines,
  "chk-buffer":  bufferLayer,
};

Object.entries(layerMap).forEach(([id, layer]) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("change", () => layer.setVisible(el.checked));
  }
});

/* ==========================================================================
   FILTER PANEL – berdasarkan kategori UHI, vegetasi, dan range suhu
   ========================================================================== */

let activeUHI = new Set(["Rendah", "Sedang", "Tinggi"]);
let activeVeg  = new Set(["Rimbun", "Sedang", "Jarang", "Tidak ada"]);
let minSuhu = 27, maxSuhu = 31;

function applyFilter() {
  let count = 0;
  surveySource.getFeatures().forEach((f) => {
    const p = f.getProperties();
    const show =
      activeUHI.has(p.Kategori_UHI) &&
      activeVeg.has(p.Vegetasi) &&
      p.Suhu >= minSuhu && p.Suhu <= maxSuhu;
    f.setStyle(show ? undefined : new Style(null));
    if (show) count++;
  });
  const el = document.getElementById("visible-count");
  if (el) el.textContent = count;
}

// UHI filter checkboxes
document.querySelectorAll(".filter-uhi").forEach((cb) => {
  cb.addEventListener("change", () => {
    if (cb.checked) activeUHI.add(cb.value);
    else activeUHI.delete(cb.value);
    applyFilter();
  });
});

// Vegetasi filter checkboxes
document.querySelectorAll(".filter-veg").forEach((cb) => {
  cb.addEventListener("change", () => {
    if (cb.checked) activeVeg.add(cb.value);
    else activeVeg.delete(cb.value);
    applyFilter();
  });
});

// Range suhu
const suhuMinEl  = document.getElementById("suhu-min");
const suhuMaxEl  = document.getElementById("suhu-max");
const suhuMinVal = document.getElementById("suhu-min-val");
const suhuMaxVal = document.getElementById("suhu-max-val");

if (suhuMinEl) {
  suhuMinEl.addEventListener("input", () => {
    minSuhu = parseFloat(suhuMinEl.value);
    if (minSuhu > maxSuhu) { minSuhu = maxSuhu; suhuMinEl.value = minSuhu; }
    suhuMinVal.textContent = minSuhu;
    applyFilter();
  });
}
if (suhuMaxEl) {
  suhuMaxEl.addEventListener("input", () => {
    maxSuhu = parseFloat(suhuMaxEl.value);
    if (maxSuhu < minSuhu) { maxSuhu = minSuhu; suhuMaxEl.value = maxSuhu; }
    suhuMaxVal.textContent = maxSuhu;
    applyFilter();
  });
}

window.resetFilter = function () {
  activeUHI = new Set(["Rendah", "Sedang", "Tinggi"]);
  activeVeg  = new Set(["Rimbun", "Sedang", "Jarang", "Tidak ada"]);
  minSuhu = 27; maxSuhu = 31;
  document.querySelectorAll(".filter-uhi, .filter-veg").forEach((cb) => cb.checked = true);
  if (suhuMinEl) { suhuMinEl.value = 27; suhuMinVal.textContent = 27; }
  if (suhuMaxEl) { suhuMaxEl.value = 31; suhuMaxVal.textContent = 31; }
  surveySource.getFeatures().forEach((f) => f.setStyle(undefined));
  const el = document.getElementById("visible-count");
  if (el) el.textContent = surveySource.getFeatures().length;
};

// Re-apply filter and generate route after features load
surveySource.on("featuresloadend", () => {
  const feats = surveySource.getFeatures().slice().sort((a, b) => (a.get("No") || 0) - (b.get("No") || 0));
  if (feats.length > 1) {
    const coords = feats.map(f => f.getGeometry().getCoordinates());
    const routeFeature = new Feature({
      geometry: new LineString(coords),
      name: "Rute Perjalanan Survei (Titik 1 → 30)"
    });
    routeSource.clear();
    routeSource.addFeature(routeFeature);
  }
  applyFilter();
  updateStats();
});

/* ==========================================================================
   BUFFER ANALYSIS
   ========================================================================== */

window.runBuffer = function () {
  bufferSource.clear();
  const radiusM  = parseInt(document.getElementById("buffer-radius").value);
  const target   = document.getElementById("buffer-target").value;
  const features = surveySource.getFeatures();

  features.forEach((f) => {
    const p = f.getProperties();
    const shouldBuffer = target === "all" || p.Kategori_UHI === target;
    if (!shouldBuffer) return;

    const coords = f.getGeometry().getCoordinates();
    // Buat circle buffer (polygonize)
    const circle = circular(toLonLat(coords), radiusM, 64);
    circle.transform("EPSG:4326", "EPSG:3857");
    const bufFeat = new Feature(circle);
    bufFeat.set("type", "buffer");
    bufFeat.set("source_name", p.Name);
    bufFeat.set("radius", radiusM);
    bufferSource.addFeature(bufFeat);
  });

  // Tampilkan layer buffer
  bufferLayer.setVisible(true);
  document.getElementById("chk-buffer").checked = true;

  const count = bufferSource.getFeatures().length;
  alert(`✅ Buffer ${radiusM} m berhasil dibuat untuk ${count} titik ${target === "all" ? "survei" : "UHI " + target}`);
};

window.clearBuffer = function () {
  bufferSource.clear();
  bufferLayer.setVisible(false);
  document.getElementById("chk-buffer").checked = false;
};

/* ==========================================================================
   SPATIAL QUERY – titik dalam radius dari pusat kota
   ========================================================================== */

// Pusat kota Pekanbaru
const PUSAT_KOTA = [101.447222, 0.507222]; // lon, lat

window.runSpatialQuery = function () {
  const radiusKm = parseFloat(document.getElementById("query-radius").value);
  const radiusM  = radiusKm * 1000;
  const features = surveySource.getFeatures();
  let count = 0;

  features.forEach((f) => {
    const coords = f.getGeometry().getCoordinates();
    const lonLat = toLonLat(coords);
    const dist   = getDistance(PUSAT_KOTA, lonLat);
    const inRange = dist <= radiusM;

    if (inRange) {
      f.setStyle(getSurveyStyle(f, true));
      count++;
    } else {
      f.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "rgba(0,0,0,0.15)" }),
          stroke: new Stroke({ color: "#aaa", width: 1 }),
        }),
      }));
    }
  });

  const resEl = document.getElementById("query-result");
  const countEl = document.getElementById("query-count");
  if (resEl)   resEl.classList.remove("d-none");
  if (countEl) countEl.textContent = `${count} titik dalam radius ${radiusKm} km dari pusat kota`;
};

/* ==========================================================================
   STATISTIK DATA
   ========================================================================== */

window.updateStats = function () {
  const features = surveySource.getFeatures();
  if (!features.length) return;

  let suhuArr = [], humArr = [], uhiCount = { Rendah: 0, Sedang: 0, Tinggi: 0 };
  features.forEach((f) => {
    const p = f.getProperties();
    if (p.Suhu) suhuArr.push(p.Suhu);
    if (p.Kelembapan) humArr.push(p.Kelembapan);
    if (p.Kategori_UHI) uhiCount[p.Kategori_UHI] = (uhiCount[p.Kategori_UHI] || 0) + 1;
  });

  const avg = (arr) => (arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(1);
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setText("stat-suhu-avg",  avg(suhuArr) + "°C");
  setText("stat-suhu-max",  Math.max(...suhuArr) + "°C");
  setText("stat-suhu-min",  Math.min(...suhuArr) + "°C");
  setText("stat-hum-avg",   avg(humArr) + "%");
  setText("stat-uhi-high",  (uhiCount.Tinggi  || 0) + " titik");
  setText("stat-uhi-med",   (uhiCount.Sedang  || 0) + " titik");
  setText("stat-uhi-low",   (uhiCount.Rendah  || 0) + " titik");
};

/* ==========================================================================
   HOVER – tampilkan info di bawah peta
   ========================================================================== */

const hoverInfo = document.getElementById("hover-info");

map.on("pointermove", (evt) => {
  if (evt.dragging) return;
  const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
  map.getTargetElement().style.cursor = feature ? "pointer" : "";

  if (feature) {
    const p = feature.getProperties();
    if (p.Name && p.Suhu !== undefined) {
      hoverInfo.textContent =
        `📍 ${p.Name} | 🌡 ${p.Suhu}°C | 💧 ${p.Kelembapan}% | 🌿 ${p.Vegetasi} | UHI: ${p.Kategori_UHI}`;
    } else if (p.NAMOBJ || p.WADMKC) {
      hoverInfo.textContent = `📌 Kecamatan ${p.NAMOBJ || p.WADMKC}`;
    } else {
      hoverInfo.textContent = "Klik untuk detail";
    }
  } else {
    hoverInfo.textContent = "Arahkan ke fitur untuk info";
  }
});

/* ==========================================================================
   CLICK – POPUP dengan foto survei
   ========================================================================== */

map.on("singleclick", (evt) => {
  const result = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => ({ feature, layer }));

  if (!result) {
    overlay.setPosition(undefined);
    return;
  }

  const { feature, layer } = result;
  const props = feature.getProperties();
  popupContent.innerHTML = "";

  if (layer === surveyPoints) {
    // ---- POPUP TITIK SURVEI ----
    const uhi   = props.Kategori_UHI || "Tidak Diketahui";
    const fotoList = Array.isArray(props.Foto_List) && props.Foto_List.length > 0 
      ? props.Foto_List 
      : (props.Foto ? [props.Foto] : []);

    let fotoHtml = "";
    if (fotoList.length > 0) {
      fotoHtml = `
        <div class="popup-gallery mb-2">
          <div class="d-flex gap-1 overflow-auto pb-1" style="max-width:100%;">
            ${fotoList.map((f, i) => {
              const encPath = encodeURI('/' + f);
              const safeName = (props.Name || '').replace(/'/g, "\\'");
              return `
              <div class="foto-thumb-wrapper" style="${fotoList.length > 1 ? 'flex:0 0 48%;' : 'width:100%;'}">
                <img
                  src="${encPath}"
                  alt="Foto ${props.Name} (${i + 1})"
                  class="popup-foto-preview"
                  style="width:100%; height:${fotoList.length > 1 ? '90px' : '140px'}; object-fit:cover; cursor:pointer;"
                  onclick="openFotoModal('${encPath}', '${safeName} - Foto ${i + 1}', '${props.Suhu}°C | ${props.Kelembapan}% | ${props.Vegetasi}')"
                  onerror="this.parentElement.style.display='none'; const el = document.getElementById('no-foto-notice-${props.No}'); if(el) el.style.display='block';"
                >
              </div>`;
            }).join('')}
          </div>
          <div id="no-foto-notice-${props.No}" class="popup-foto-btn" style="display:none;" onclick="openFotoModal(null, '${props.Name}', 'Target file: ${fotoList.join(', ')}')">
            <i class="bi bi-camera me-1"></i> File foto belum ada di public/foto/<br>
            <span class="text-primary small">${fotoList.map(f => f.split('/').pop()).join(', ')}</span>
          </div>
        </div>
      `;
    } else {
      fotoHtml = `
        <div class="popup-foto-btn mb-2">
          <i class="bi bi-camera-slash me-1"></i> Foto survei belum diunggah
        </div>
      `;
    }

    popupContent.innerHTML = `
      <div class="popup-header">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold fs-6">📍 ${props.Name || "-"}</div>
            <div class="small opacity-75">Titik #${props.No} · ${props.Kecamatan || ""}</div>
          </div>
          <span class="uhi-badge uhi-${uhi} ms-2">${uhi}</span>
        </div>
      </div>
      <div class="popup-body">
        ${fotoHtml}
        <div class="mt-2">
          <div class="data-row">
            <span class="data-label">🌡 Suhu</span>
            <span class="data-val text-danger">${props.Suhu !== null ? props.Suhu + " °C" : "-"}</span>
          </div>
          <div class="data-row">
            <span class="data-label">💧 Kelembapan</span>
            <span class="data-val text-info">${props.Kelembapan !== null ? props.Kelembapan + "%" : "-"}</span>
          </div>
          <div class="data-row">
            <span class="data-label">🌿 Vegetasi</span>
            <span class="data-val" style="color:${getVegetasiColor(props.Vegetasi)}">${props.Vegetasi || "-"}</span>
          </div>
          <div class="data-row">
            <span class="data-label">⏱ Waktu</span>
            <span class="data-val">${props.Waktu || "-"} WIB</span>
          </div>
          ${props.Keterangan ? `
          <div class="mt-2 p-2 bg-light rounded small text-muted">
            <i class="bi bi-info-circle me-1"></i>${props.Keterangan}
          </div>` : ""}
        </div>
      </div>`;

  } else if (layer === kecPku) {
    // ---- POPUP KECAMATAN ----
    const nama = props.NAMOBJ || props.WADMKC || props.Kecamatan || "Tidak diketahui";
    popupContent.innerHTML = `
      <div class="popup-header">
        <div class="fw-bold">📌 Kecamatan ${nama}</div>
      </div>
      <div class="popup-body small text-muted">
        Klik titik survei (lingkaran) untuk data suhu &amp; vegetasi
      </div>`;

  } else if (layer === avenzaTrackLayer) {
    popupContent.innerHTML = `
      <div class="popup-header">
        <div class="fw-bold">🛣️ Jalur Tracking GPS (Avenza Maps)</div>
      </div>
      <div class="popup-body small">
        <p class="mb-1"><strong>Rute Asli Lapangan</strong></p>
        <span class="text-muted">Terekam 3.542 titik koordinat pergerakan tim survei dari Avenza Maps.</span>
      </div>`;
  } else if (layer === routeLayer || layer === surveyLines) {
    popupContent.innerHTML = `
      <div class="popup-header">
        <div class="fw-bold">🛣️ Rute Perjalanan Survei</div>
      </div>
      <div class="popup-body small text-muted">Garis hubung antar titik survei</div>`;
  } else if (layer === bufferLayer) {
    popupContent.innerHTML = `
      <div class="popup-header">
        <div class="fw-bold">⭕ Zona Buffer</div>
      </div>
      <div class="popup-body small">
        <div class="data-row"><span class="data-label">Pusat:</span><span class="data-val">${props.source_name || "-"}</span></div>
        <div class="data-row"><span class="data-label">Radius:</span><span class="data-val">${props.radius || "-"} m</span></div>
      </div>`;
  } else {
    overlay.setPosition(undefined);
    return;
  }

  overlay.setPosition(evt.coordinate);
});

/* ==========================================================================
   MODAL FOTO
   ========================================================================== */

window.openFotoModal = function (src, name, info) {
  const img   = document.getElementById("foto-modal-img");
  const title = document.getElementById("foto-modal-title");
  const infoEl= document.getElementById("foto-modal-info");

  if (src) {
    img.src = src;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }
  title.textContent   = "📸 " + (name || "Foto Survei");
  infoEl.textContent  = info || "";

  const modal = new bootstrap.Modal(document.getElementById("fotoModal"));
  modal.show();
};

/* ==========================================================================
   LOG LAYER LOAD STATUS
   ========================================================================== */

[
  { name: "Kabupaten Riau", layer: kabRiau },
  { name: "Kecamatan Pekanbaru", layer: kecPku },
  { name: "Jalur Avenza",   layer: avenzaTrackLayer },
  { name: "Survey Lines",   layer: surveyLines },
  { name: "Titik Survei",   layer: surveyPoints },
].forEach(({ name, layer }) => {
  const src = layer.getSource();
  src.on("featuresloadend",   () => console.log(`✅ ${name}: ${src.getFeatures().length} fitur`));
  src.on("featuresloaderror", () => console.error(`❌ ${name}: gagal dimuat`));
});
