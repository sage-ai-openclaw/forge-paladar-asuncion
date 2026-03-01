// Paladar Asunción - Admin Panel

const restaurantForm = document.getElementById('restaurantForm');
const menuItemForm = document.getElementById('menuItemForm');
const selectRestaurant = document.getElementById('selectRestaurant');
const restaurantsList = document.getElementById('restaurantsList');

// Load restaurants
async function loadRestaurants() {
  try {
    const restaurants = await fetch('/api/restaurants').then(r => r.json());
    
    // Update select dropdown
    selectRestaurant.innerHTML = '<option value="">Seleccionar restaurante</option>';
    restaurants.forEach(r => {
      const option = document.createElement('option');
      option.value = r.id;
      option.textContent = r.name;
      selectRestaurant.appendChild(option);
    });
    
    // Update list
    restaurantsList.innerHTML = restaurants.map(r => `
      <div class="restaurant-item">
        <h4>${escapeHtml(r.name)}</h4>
        <p>${escapeHtml(r.cuisine)} • ${escapeHtml(r.zone)}</p>
        <p>${escapeHtml(r.address || 'Sin dirección')} ${r.phone ? `• ${escapeHtml(r.phone)}` : ''}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading restaurants:', err);
  }
}

// Add restaurant
restaurantForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('restName').value,
    cuisine: document.getElementById('restCuisine').value.toLowerCase(),
    zone: document.getElementById('restZone').value.toLowerCase(),
    address: document.getElementById('restAddress').value,
    phone: document.getElementById('restPhone').value
  };
  
  try {
    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    restaurantForm.reset();
    loadRestaurants();
    alert('Restaurante agregado exitosamente');
  } catch (err) {
    alert('Error al agregar restaurante');
  }
});

// Add menu item
menuItemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    restaurant_id: parseInt(document.getElementById('selectRestaurant').value),
    name: document.getElementById('dishName').value,
    description: document.getElementById('dishDesc').value,
    price: parseInt(document.getElementById('dishPrice').value),
    category: document.getElementById('dishCategory').value
  };
  
  try {
    await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    menuItemForm.reset();
    alert('Plato agregado exitosamente');
  } catch (err) {
    alert('Error al agregar plato');
  }
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
loadRestaurants();
