const errorBox = document.getElementById('map-error');
const searchInput = document.getElementById('country-search');
const countryList = document.getElementById('country-list');
const toggleBorders = document.getElementById('toggle-borders');
const toggleCapitals = document.getElementById('toggle-capitals');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

const theme = getComputedStyle(document.documentElement);
const colors = {
  land: theme.getPropertyValue('--land').trim(),
  accent: theme.getPropertyValue('--accent').trim(),
  accentHover: theme.getPropertyValue('--accent-hover').trim(),
  cardBg: theme.getPropertyValue('--card-bg').trim(),
  error: theme.getPropertyValue('--error').trim(),
};

const map = L.map('map', {
  minZoom: 1,
  maxZoom: 8,
  maxBounds: [
    [-90, -180],
    [90, 180],
  ],
  maxBoundsViscosity: 1,
}).setView([20, 0], 2);

const borderStyle = {
  color: colors.accent,
  weight: 1,
  fillColor: colors.land,
  fillOpacity: 0.85,
};

const borderHighlightStyle = {
  color: colors.accentHover,
  weight: 2,
  fillColor: colors.land,
  fillOpacity: 1,
};

const bordersLayer = L.geoJSON(null, {
  style: borderStyle,
  onEachFeature(feature, layer) {
    layer.bindTooltip(feature.properties.name, { sticky: true });
    layer.on('mouseover', () => layer.setStyle(borderHighlightStyle));
    layer.on('mouseout', () => layer.setStyle(borderStyle));
    layer.on('click', () => map.fitBounds(layer.getBounds(), { maxZoom: 5 }));
  },
});

const capitalsLayer = L.geoJSON(null, {
  pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      weight: 1,
      color: colors.cardBg,
      fillColor: colors.error,
      fillOpacity: 0.9,
    });
  },
  onEachFeature(feature, layer) {
    const { capital, country } = feature.properties;
    layer.bindPopup(`<div class="capital-popup"><strong>${capital}</strong>Capital of ${country}</div>`);
  },
});

const countryLayers = new Map();

async function loadBorders() {
  const res = await fetch('/data/countries.geojson');
  if (!res.ok) {
    throw new Error('Failed to load country borders.');
  }
  const geojson = await res.json();
  bordersLayer.addData(geojson);
  bordersLayer.addTo(map);

  const fragment = document.createDocumentFragment();
  bordersLayer.eachLayer((layer) => {
    const name = layer.feature.properties.name;
    countryLayers.set(name, layer);
    const option = document.createElement('option');
    option.value = name;
    fragment.appendChild(option);
  });
  countryList.appendChild(fragment);
}

async function loadCapitals() {
  const res = await fetch('/data/capitals.geojson');
  if (!res.ok) {
    throw new Error('Failed to load capital cities.');
  }
  const geojson = await res.json();
  capitalsLayer.addData(geojson);
  capitalsLayer.addTo(map);
}

Promise.all([loadBorders(), loadCapitals()]).catch((err) => showError(err.message));

toggleBorders.addEventListener('change', () => {
  if (toggleBorders.checked) {
    bordersLayer.addTo(map);
  } else {
    map.removeLayer(bordersLayer);
  }
});

toggleCapitals.addEventListener('change', () => {
  if (toggleCapitals.checked) {
    capitalsLayer.addTo(map);
  } else {
    map.removeLayer(capitalsLayer);
  }
});

searchInput.addEventListener('change', () => {
  const layer = countryLayers.get(searchInput.value.trim());
  if (!layer) {
    return;
  }
  map.fitBounds(layer.getBounds(), { maxZoom: 5 });
  layer.setStyle(borderHighlightStyle);
  layer.openTooltip();
  setTimeout(() => layer.setStyle(borderStyle), 2000);
});
