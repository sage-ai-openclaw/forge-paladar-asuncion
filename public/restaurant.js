// Restaurant detail page logic

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  if (!id) {
    window.location.href = '/';
    return;
  }
  
  loadRestaurant(id);
});

async function loadRestaurant(id) {
  try {
    const res = await fetch(`/api/restaurants/${id}`);
    if (!res.ok) throw new Error('Restaurant not found');
    
    const restaurant = await res.json();
    renderRestaurant(restaurant);
  } catch (err) {
    document.getElementById('restaurant-detail').innerHTML = `
      <div class="no-results">Error al cargar el restaurante</div>
    `;
  }
}

function renderRestaurant(r) {
  const container = document.getElementById('restaurant-detail');
  
  const mapUrl = r.lat && r.lng 
    ? `https://www.google.com/maps?q=${r.lat},${r.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address || r.name + ' Asunción Paraguay')}`;
  
  const phoneLink = r.phone ? `tel:${r.phone.replace(/\s/g, '')}` : null;
  
  container.innerHTML = `
    <article class="restaurant-detail">
      <div class="restaurant-header">
        <h1>${escapeHtml(r.name)}</h1>
        <div class="restaurant-info">
          <div class="info-item">
            <span class="icon">🍽️</span>
            <span><span class="info-label">Cocina:</span> ${escapeHtml(r.cuisine_type || 'No especificada')}</span>
          </div>
          <div class="info-item">
            <span class="icon">📍</span>
            <span><span class="info-label">Zona:</span> ${escapeHtml(r.zone || 'No especificada')}</span>
          </div>
          <div class="info-item">
            <span class="icon">🏠</span>
            <span>
              <span class="info-label">Dirección:</span>
              <a href="${mapUrl}" target="_blank" rel="noopener">
                ${escapeHtml(r.address || 'Ver en mapa')} 🗺️
              </a>
            </span>
          </div>
          ${r.phone ? `
          <div class="info-item">
            <span class="icon">📞</span>
            <span>
              <span class="info-label">Teléfono:</span>
              <a href="${phoneLink}">${escapeHtml(r.phone)} 📲</a>
            </span>
          </div>
          ` : ''}
          ${r.hours ? `
          <div class="info-item">
            <span class="icon">🕐</span>
            <span>
              <span class="info-label">Horario:</span>
              <span class="hours-display">${escapeHtml(r.hours)}</span>
            </span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="icon">💰</span>
            <span>
              <span class="info-label">Precio promedio:</span>
              <span class="price-range">${formatPriceRange(r.price_range_min, r.price_range_max)}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div class="menu-section">
        <h2>📋 Menú</h2>
        ${renderMenu(r.menu)}
      </div>
    </article>
  `;
}

function renderMenu(menu) {
  if (!menu || Object.keys(menu).length === 0) {
    return '<p class="no-results">Menú no disponible</p>';
  }
  
  return Object.entries(menu).map(([category, items]) => `
    <div class="menu-category">
      <h3>${escapeHtml(category)}</h3>
      <div class="menu-items">
        ${items.map(item => `
          <div class="menu-item">
            <div class="menu-item-info">
              <div class="menu-item-name">${escapeHtml(item.name)}</div>
              ${item.description ? `<div class="menu-item-desc">${escapeHtml(item.description)}</div>` : ''}
            </div>
            <div class="menu-item-price">₲${item.price ? item.price.toLocaleString() : 'Consultar'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function formatPriceRange(min, max) {
  if (!min && !max) return 'No disponible';
  if (!max || min === max) return `₲${(min || 0).toLocaleString()}`;
  return `₲${(min || 0).toLocaleString()} - ₲${max.toLocaleString()}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
