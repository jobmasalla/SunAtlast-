// -----------------------------
// SUNATLAS FULL SCRIPT.JS
// -----------------------------

// Initialize map
const map = L.map("map").setView([0, 0], 2);

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Africa Mode button
function focusAfrica() {
  map.setView([2, 20], 4);
}

// Load notes from localStorage
let notes = JSON.parse(localStorage.getItem("sunAtlasNotes")) || [];

// Map click event
map.on("click", async function (e) {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;

  // Get solar data
  const avg = await getSolarData(lat, lon);

  // Remove previous marker
  if (window.lastMarker) {
    map.removeLayer(window.lastMarker);
  }

  // Get color and radius
  const color = getHeatColor(avg);
  const radius = getHeatRadius(avg);

  // Add circle marker
  window.lastMarker = L.circle([lat, lon], {
    color: color,
    fillColor: color,
    fillOpacity: 0.5,
    radius: radius,
  }).addTo(map);

  // Add popup info
  window.lastMarker.bindPopup(
    `<b>Solar Irradiance:</b> ${avg.toFixed(2)} kWh/m²/day<br>
     <b>Suitability:</b> ${getRating(avg)}<br>
     <b>Solar Score:</b> ${getScore(avg)}/100`
  ).openPopup();

  // Show existing notes if any
  showNotes(lat, lon, window.lastMarker);
});

// -----------------------------
// GET SOLAR DATA (NASA POWER API)
// -----------------------------
async function getSolarData(lat, lon) {
  const url =
    "https://power.larc.nasa.gov/api/temporal/daily/point" +
    "?parameters=ALLSKY_SFC_SW_DWN" +
    "&latitude=" + lat +
    "&longitude=" + lon +
    "&format=JSON";

  try {
    const response = await fetch(url);
    const data = await response.json();
    const values = data.properties.parameter.ALLSKY_SFC_SW_DWN;
    const avg =
      Object.values(values).reduce((a, b) => a + b, 0) /
      Object.values(values).length;

    // Update bottom panel
    document.getElementById("result").innerHTML =
      `<b>Solar Irradiance:</b> ${avg.toFixed(2)} kWh/m²/day<br>` +
      `<b>Suitability:</b> ${getRating(avg)}<br>` +
      `<b>Solar Score:</b> ${getScore(avg)}/100`;

    return avg;
  } catch (err) {
    console.error(err);
    document.getElementById("result").innerText =
      "Failed to load solar data.";
    return 0;
  }
}

// -----------------------------
// RATING AND SCORE
// -----------------------------
function getRating(avg) {
  if (avg >= 6) return "Excellent";
  if (avg >= 4) return "Good";
  if (avg >= 2) return "Fair";
  return "Poor";
}

function getScore(avg) {
  return Math.min(100, Math.round((avg / 7) * 100));
}

// -----------------------------
// DEMO-FRIENDLY HEAT COLOR
// -----------------------------
function getHeatColor(avg) {
  // Normalize for demo visibility
  const demoAvg = avg + 2; // Boost low values for demo
  if (demoAvg >= 5) return "green";   // Excellent
  if (demoAvg >= 3) return "yellow";  // Good
  return "red";                        // Poor
}

// -----------------------------
// DYNAMIC CIRCLE RADIUS
// -----------------------------
function getHeatRadius(avg) {
  const demoAvg = avg + 2; // same boost for demo
  if (demoAvg >= 5) return 300000;  // Green → big
  if (demoAvg >= 3) return 200000;  // Yellow → medium
  return 100000;                     // Red → small
}

// -----------------------------
// COMMUNITY NOTES
// -----------------------------
function addNote() {
  const input = document.getElementById("note-input");
  const text = input.value.trim();
  if (!text) {
    alert("Please enter a note.");
    return;
  }

  if (!window.lastMarker) {
    alert("Click a location on the map first!");
    return;
  }

  const lat = window.lastMarker.getLatLng().lat.toFixed(4);
  const lon = window.lastMarker.getLatLng().lng.toFixed(4);

  // Save note
  const noteObj = { lat, lon, text };
  notes.push(noteObj);
  localStorage.setItem("sunAtlasNotes", JSON.stringify(notes));
 
  // Update popup
  window.lastMarker.bindPopup(
    window.lastMarker.getPopup().getContent() +
    `<br><b>Note:</b> ${text}`
  ).openPopup();

  input.value = ""; 
}

// Show notes for a marker
function showNotes(lat, lon, marker) {
  notes.forEach(n => {
    if (n.lat === lat.toFixed(4) && n.lon === lon.toFixed(4)) {
      marker.bindPopup(
        marker.getPopup().getContent() + `<br><b>Note:</b> ${n.text}`
      ).openPopup();
    }
  });
}
