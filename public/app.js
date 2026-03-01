// Paladar Asunción - Main App

const searchInput = document.getElementById('searchInput');
const cuisineFilter = document.getElementById('cuisineFilter');
const zoneFilter = document.getElementById('zoneFilter');
const minPriceSlider = document.getElementById('minPriceSlider');
const maxPriceSlider = document.getElementById('maxPriceSlider');
const minPriceDisplay = document.getElementById('minPriceDisplay');
const maxPriceDisplay = document.getElementById('maxPriceDisplay');
const searchBtn = document.getElementById('searchBtn');
const resultsList = document.getElementById('resultsList');
const resultsCount = document.getElementById('resultsCount');

let priceRange = { minPrice: 0, maxPrice: 100000 };

// Format price in Guaraníes
function formatPrice(price) {
  return 'Gs. ' + price.toLocaleString('es-PY');
}

// Load filter options
async function loadFilters() {
  try {
    // Load cuisines
    const cuisines = await fetch('/api/cuisines').then(r => r.json());
    cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.value = cuisine;
      option.textContent = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
      cuisineFilter.appendChild(option);
    });

    // Load zones
    const zones = await fetch('/api/zones').then(r => r.json());
    zones.forEach(zone => {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone.charAt(0).toUpperCase() + zone.slice(1);
      zoneFilter.appendChild(option);
    });

    // Load price range
    priceRange = await fetch('/api/price-range').then(r => r.json());
    minPriceSlider.min = priceRange.minPrice;
    minPriceSlider.max = priceRange.maxPrice;
    minPriceSlider.value = priceRange.minPrice;
    maxPriceSlider.min = priceRange.minPrice;
    maxPriceSlider.max = priceRange.maxPrice;
    maxPriceSlider.value = priceRange.maxPrice;
    
    updatePriceDisplay();
  } catch (err) {
    console.error('Error loading filters:', err);
  }
}

// Update price display
function updatePriceDisplay() {
  minPriceDisplay.textContent = formatPrice(parseInt(minPriceSlider.value));
  maxPriceDisplay.textContent = formatPrice(parseInt(maxPriceSlider.value));
}

// Handle price slider changes
minPriceSlider.addEventListener('input', () => {
  const minVal = parseInt(minPriceSlider.value);
  const maxVal = parseInt(maxPriceSlider.value);
  if (minVal > maxVal) {
    minPriceSlider.value = maxVal;
  }
  updatePriceDisplay();
});

maxPriceSlider.addEventListener('input', () => {
  const minVal = parseInt(minPriceSlider.value);
  const maxVal = parseInt(maxPriceSlider.value);
  if (maxVal < minVal) {
    maxPriceSlider.value = minVal;
  }
  updatePriceDisplay();
});

// Search function
async function search() {
  const params = new URLSearchParams();
  
  const query = searchInput.value.trim();
  if (query) params.append('q', query);
  
  const cuisine = cuisineFilter.value;
  if (cuisine !== 'all') params.append('cuisine', cuisine);
  
  const zone = zoneFilter.value;
  if (zone !== 'all') params.append('zone', zone);
  
  const minPrice = minPriceSlider.value;
  const maxPrice = maxPriceSlider.value;
  
  // Only add price params if they're different from the full range
  if (parseInt(minPrice) > priceRange.minPrice) {
    params.append('minPrice', minPrice);
  }
  if (parseInt(maxPrice) < priceRange.maxPrice) {
    params.append('maxPrice', maxPrice);
  }

  try {
    const results = await fetch(`/api/search?${params}`).then(r => r.json());
    displayResults(results);
  } catch (err) {
    console.error('Search error:', err);
    resultsList.innerHTML = '<div class="no-results">Error al buscar. Intenta de nuevo.</div>';
  }
}

// Display results
function displayResults(results) {
  resultsCount.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`;
  
  if (results.length === 0) {
    resultsList.innerHTML = '<div class="no-results">No se encontraron platos con esos filtros.</div>';
    return;
  }

  resultsList.innerHTML = results.map(item => `
    <div class="result-card">
      <div class="result-header">
        <div class="result-title">${escapeHtml(item.dishName)}</div>
        <div class="result-price">${formatPrice(item.price)}</div>
      </div>
      <div class="result-meta">
        <span>${escapeHtml(item.cuisine)}</span>
        <span>${escapeHtml(item.zone)}</span>
        ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}
      </div>
      ${item.description ? `<div class="result-description">${escapeHtml(item.description)}</div>` : ''}
      <div class="result-restaurant">
        🏪 ${escapeHtml(item.restaurantName)} • ${escapeHtml(item.address || 'Sin dirección')}
      </div>
    </div>
  `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
searchBtn.addEventListener('click', search);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') search();
});

// Debounced search on filter changes
let debounceTimer;
function debouncedSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, 300);
}

cuisineFilter.addEventListener('change', debouncedSearch);
zoneFilter.addEventListener('change', debouncedSearch);
minPriceSlider.addEventListener('change', debouncedSearch);
maxPriceSlider.addEventListener('change', debouncedSearch);

// Initialize
loadFilters();
search();
