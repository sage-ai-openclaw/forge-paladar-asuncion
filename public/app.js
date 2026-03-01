// Paladar Asunción - Search App

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');
const resultsInfo = document.getElementById('resultsInfo');
const zoneFilter = document.getElementById('zoneFilter');
const cuisineFilter = document.getElementById('cuisineFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');

let searchTimeout;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFilters();
  searchInput.focus();
});

// Event listeners
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  
  if (query.length >= 2) {
    searchTimeout = setTimeout(() => performSearch(), 300);
  } else if (query.length === 0) {
    showEmptyState();
  }
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(searchTimeout);
    performSearch();
  }
});

searchBtn.addEventListener('click', performSearch);

[zoneFilter, cuisineFilter, minPrice, maxPrice].forEach(el => {
  el.addEventListener('change', () => {
    if (searchInput.value.trim().length >= 2) {
      performSearch();
    }
  });
});

async function loadFilters() {
  try {
    const [zonesRes, cuisinesRes] = await Promise.all([
      fetch('/api/zones'),
      fetch('/api/cuisines')
    ]);
    
    const zones = await zonesRes.json();
    const cuisines = await cuisinesRes.json();
    
    zones.forEach(zone => {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone;
      zoneFilter.appendChild(option);
    });
    
    cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.value = cuisine;
      option.textContent = cuisine;
      cuisineFilter.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load filters:', err);
  }
}

async function performSearch() {
  const query = searchInput.value.trim();
  
  if (query.length < 2) {
    resultsDiv.innerHTML = '<div class="empty-state"><p>Escribí al menos 2 caracteres para buscar</p></div>';
    resultsInfo.classList.add('hidden');
    return;
  }
  
  resultsDiv.innerHTML = '<div class="loading">Buscando...</div>';
  resultsInfo.classList.add('hidden');
  
  const params = new URLSearchParams();
  params.append('q', query);
  
  if (zoneFilter.value) params.append('zone', zoneFilter.value);
  if (cuisineFilter.value) params.append('cuisine', cuisineFilter.value);
  if (minPrice.value) params.append('minPrice', minPrice.value);
  if (maxPrice.value) params.append('maxPrice', maxPrice.value);
  
  try {
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();
    
    displayResults(data, query);
  } catch (err) {
    console.error('Search error:', err);
    resultsDiv.innerHTML = '<div class="no-results"><p>❌ Error al buscar. Intentá de nuevo.</p></div>';
  }
}

function displayResults(data, query) {
  const { results, total } = data;
  
  // Update results info
  if (total > 0) {
    resultsInfo.innerHTML = `Encontramos <strong>${total}</strong> resultado${total !== 1 ? 's' : ''} para "<strong>${escapeHtml(query)}</strong>"`;
    resultsInfo.classList.remove('hidden');
  } else {
    resultsInfo.classList.add('hidden');
  }
  
  if (results.length === 0) {
    resultsDiv.innerHTML = `
      <div class="no-results">
        <p>😕 No encontramos platos que coincidan con "${escapeHtml(query)}"</p>
        <p style="margin-top: 10px; font-size: 0.95rem;">Probá con otro término o verificá la ortografía</p>
      </div>
    `;
    return;
  }
  
  resultsDiv.innerHTML = results.map(group => `
    <div class="restaurant-card">
      <div class="restaurant-header">
        <h3>${escapeHtml(group.restaurant.name)}</h3>
        <div class="restaurant-meta">
          ${group.restaurant.cuisine_type ? `<span>🍴 ${escapeHtml(group.restaurant.cuisine_type)}</span>` : ''}
          ${group.restaurant.zone ? `<span>📍 ${escapeHtml(group.restaurant.zone)}</span>` : ''}
          ${group.restaurant.address ? `<span>🏠 ${escapeHtml(group.restaurant.address)}</span>` : ''}
          ${group.restaurant.phone ? `<span>📞 ${escapeHtml(group.restaurant.phone)}</span>` : ''}
        </div>
      </div>
      <div class="dishes-list">
        ${group.dishes.map(dish => `
          <div class="dish-item">
            <div class="dish-info">
              <h4>${highlightMatch(escapeHtml(dish.name), query)}</h4>
              ${dish.description ? `<p>${escapeHtml(dish.description)}</p>` : ''}
              ${dish.category ? `<span class="dish-category">${escapeHtml(dish.category)}</span>` : ''}
            </div>
            <div class="dish-price">Gs. ${formatPrice(dish.price)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function showEmptyState() {
  resultsDiv.innerHTML = '<div class="empty-state"><p>🔍 Escribí el nombre de un plato para empezar a buscar</p></div>';
  resultsInfo.classList.add('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatPrice(price) {
  return Math.round(price).toLocaleString('es-PY');
}
