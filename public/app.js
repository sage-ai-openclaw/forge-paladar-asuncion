// Main application logic

let currentRestaurants = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFilters();
  searchRestaurants();
  
  // Event listeners
  document.getElementById('search-btn').addEventListener('click', searchRestaurants);
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchRestaurants();
  });
  
  document.getElementById('cuisine-filter').addEventListener('change', searchRestaurants);
  document.getElementById('zone-filter').addEventListener('change', searchRestaurants);
  document.getElementById('price-filter').addEventListener('change', searchRestaurants);
});

async function loadFilters() {
  try {
    const res = await fetch('/api/filters');
    const data = await res.json();
    
    const cuisineSelect = document.getElementById('cuisine-filter');
    data.cuisines.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      cuisineSelect.appendChild(opt);
    });
    
    const zoneSelect = document.getElementById('zone-filter');
    data.zones.forEach(z => {
      const opt = document.createElement('option');
      opt.value = z;
      opt.textContent = z;
      zoneSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading filters:', err);
  }
}

async function searchRestaurants() {
  const q = document.getElementById('search-input').value;
  const cuisine = document.getElementById('cuisine-filter').value;
  const zone = document.getElementById('zone-filter').value;
  const price = document.getElementById('price-filter').value;
  
  let url = '/api/restaurants?';
  if (q) url += `q=${encodeURIComponent(q)}&`;
  if (cuisine) url += `cuisine=${encodeURIComponent(cuisine)}&`;
  if (zone) url += `zone=${encodeURIComponent(zone)}&`;
  if (price) {
    const [min, max] = price.split('-');
    url += `minPrice=${min}&maxPrice=${max}&`;
  }
  
  try {
    const res = await fetch(url);
    currentRestaurants = await res.json();
    renderRestaurants(currentRestaurants);
  } catch (err) {
    console.error('Error searching:', err);
  }
}

function renderRestaurants(restaurants) {
  const container = document.getElementById('restaurants-list');
  
  if (restaurants.length === 0) {
    container.innerHTML = '<div class="no-results">No se encontraron restaurantes</div>';
    return;
  }
  
  container.innerHTML = restaurants.map(r => `
    <div class="restaurant-card" onclick="showRestaurantDetail(${r.id})">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="restaurant-meta">
        <span>🍽️ ${escapeHtml(r.cuisine_type || 'Sin categoría')}</span>
        <span>📍 ${escapeHtml(r.zone || 'Sin zona')}</span>
      </div>
      <div class="price-range">
        💰 ${formatPriceRange(r.price_range_min, r.price_range_max)}
      </div>
    </div>
  `).join('');
}

function showRestaurantDetail(id) {
  window.location.href = `/restaurant.html?id=${id}`;
}

function formatPriceRange(min, max) {
  if (!min && !max) return 'Precio no disponible';
  if (!max || min === max) return `₲${(min || 0).toLocaleString()}`;
  return `₲${(min || 0).toLocaleString()} - ₲${max.toLocaleString()}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
