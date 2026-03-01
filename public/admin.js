const { useState, useEffect } = React;
const { BrowserRouter, Routes, Route, Link, useParams, useNavigate } = window.ReactRouterDOM;

// API client
const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// Restaurant List Component
function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      const data = await apiFetch('/restaurants');
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este restaurante?')) return;
    try {
      await apiFetch(`/restaurants/${id}`, { method: 'DELETE' });
      loadRestaurants();
    } catch (err) {
      alert('Error al eliminar');
    }
  }

  if (loading) return React.createElement('div', { className: 'loading' }, 'Cargando...');

  return React.createElement('div', { className: 'container' },
    React.createElement('div', { className: 'header' },
      React.createElement('h1', null, 'Restaurantes'),
      React.createElement('button', {
        className: 'btn btn-primary',
        onClick: () => navigate('/restaurants/new')
      }, '+ Nuevo Restaurante')
    ),
    React.createElement('div', { className: 'grid' },
      restaurants.map(r =>
        React.createElement('div', { key: r.id, className: 'card' },
          React.createElement('h3', null, r.name),
          React.createElement('p', { className: 'text-muted' }, r.cuisine_type, ' • ', r.zone),
          React.createElement('p', null, r.address),
          React.createElement('div', { className: 'actions' },
            React.createElement('button', {
              className: 'btn btn-secondary',
              onClick: () => navigate(`/restaurants/${r.id}/menu`)
            }, 'Menú'),
            React.createElement('button', {
              className: 'btn btn-secondary',
              onClick: () => navigate(`/restaurants/${r.id}/edit`)
            }, 'Editar'),
            React.createElement('button', {
              className: 'btn btn-danger',
              onClick: () => handleDelete(r.id)
            }, 'Eliminar')
          )
        )
      )
    )
  );
}

// Restaurant Form Component
function RestaurantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    zone: '',
    phone: '',
    hours: '',
    cuisine_type: ''
  });

  useEffect(() => {
    if (isEdit) {
      loadRestaurant();
    }
  }, [id]);

  async function loadRestaurant() {
    try {
      const data = await apiFetch(`/restaurants/${id}`);
      setFormData(data);
    } catch (err) {
      console.error('Failed to load restaurant:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isEdit) {
        await apiFetch(`/restaurants/${id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/restaurants', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      navigate('/');
    } catch (err) {
      alert('Error al guardar');
    }
  }

  const zones = ['Centro', 'Villa Morra', 'Lambare', 'San Cristóbal', 'Los Laureles', 'Mburicaó'];
  const cuisines = ['Paraguaya', 'Italiana', 'Japonesa', 'China', 'Mexicana', 'Brasileña', 'Americana', 'Parrilla', 'Mariscos', 'Vegetariana'];

  return React.createElement('div', { className: 'container' },
    React.createElement('h1', null, isEdit ? 'Editar Restaurante' : 'Nuevo Restaurante'),
    React.createElement('form', { onSubmit: handleSubmit, className: 'form' },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Nombre'),
        React.createElement('input', {
          type: 'text',
          value: formData.name,
          onChange: e => setFormData({ ...formData, name: e.target.value }),
          required: true
        })
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Dirección'),
        React.createElement('input', {
          type: 'text',
          value: formData.address,
          onChange: e => setFormData({ ...formData, address: e.target.value }),
          required: true
        })
      ),
      React.createElement('div', { className: 'form-row' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Zona'),
          React.createElement('select', {
            value: formData.zone,
            onChange: e => setFormData({ ...formData, zone: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Seleccionar...'),
            zones.map(z => React.createElement('option', { key: z, value: z }, z))
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Tipo de Cocina'),
          React.createElement('select', {
            value: formData.cuisine_type,
            onChange: e => setFormData({ ...formData, cuisine_type: e.target.value }),
            required: true
          },
            React.createElement('option', { value: '' }, 'Seleccionar...'),
            cuisines.map(c => React.createElement('option', { key: c, value: c }, c))
          )
        )
      ),
      React.createElement('div', { className: 'form-row' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Teléfono'),
          React.createElement('input', {
            type: 'tel',
            value: formData.phone,
            onChange: e => setFormData({ ...formData, phone: e.target.value })
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Horarios'),
          React.createElement('input', {
            type: 'text',
            value: formData.hours,
            onChange: e => setFormData({ ...formData, hours: e.target.value }),
            placeholder: 'Ej: Lun-Dom 10:00-22:00'
          })
        )
      ),
      React.createElement('div', { className: 'form-actions' },
        React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => navigate('/') }, 'Cancelar'),
        React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, 'Guardar')
      )
    )
  );
}

// Menu Items Component
function MenuItems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price_pyg: '', category: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [restData, itemsData] = await Promise.all([
        apiFetch(`/restaurants/${id}`),
        apiFetch(`/restaurants/${id}/menu-items`)
      ]);
      setRestaurant(restData);
      setMenuItems(itemsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await apiFetch('/menu-items', {
        method: 'POST',
        body: JSON.stringify({ ...formData, restaurant_id: Number(id), price_pyg: Number(formData.price_pyg) })
      });
      setFormData({ name: '', description: '', price_pyg: '', category: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert('Error al guardar');
    }
  }

  async function handleDelete(itemId) {
    if (!confirm('¿Eliminar este item?')) return;
    try {
      await apiFetch(`/menu-items/${itemId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Error al eliminar');
    }
  }

  const categories = ['Entrada', 'Plato Principal', 'Postre', 'Bebida', 'Menú del Día', 'Especial'];

  return React.createElement('div', { className: 'container' },
    React.createElement('div', { className: 'header' },
      React.createElement('div', null,
        React.createElement('h1', null, restaurant?.name || 'Menú'),
        React.createElement('p', { className: 'text-muted' }, 'Gestión de items del menú')
      ),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: () => navigate('/')
      }, '← Volver')
    ),
    
    !showForm && React.createElement('button', {
      className: 'btn btn-primary mb-4',
      onClick: () => setShowForm(true)
    }, '+ Agregar Item'),

    showForm && React.createElement('form', { onSubmit: handleSubmit, className: 'form card' },
      React.createElement('h3', null, 'Nuevo Item'),
      React.createElement('div', { className: 'form-row' },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Nombre'),
          React.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: e => setFormData({ ...formData, name: e.target.value }),
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Precio (PYG)'),
          React.createElement('input', {
            type: 'number',
            value: formData.price_pyg,
            onChange: e => setFormData({ ...formData, price_pyg: e.target.value }),
            required: true
          })
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Categoría'),
        React.createElement('select', {
          value: formData.category,
          onChange: e => setFormData({ ...formData, category: e.target.value }),
          required: true
        },
          React.createElement('option', { value: '' }, 'Seleccionar...'),
          categories.map(c => React.createElement('option', { key: c, value: c }, c))
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', null, 'Descripción'),
        React.createElement('textarea', {
          value: formData.description,
          onChange: e => setFormData({ ...formData, description: e.target.value }),
          rows: 2
        })
      ),
      React.createElement('div', { className: 'form-actions' },
        React.createElement('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowForm(false) }, 'Cancelar'),
        React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, 'Guardar')
      )
    ),

    React.createElement('div', { className: 'menu-list' },
      menuItems.length === 0 
        ? React.createElement('p', { className: 'text-muted' }, 'No hay items en el menú')
        : menuItems.map(item =>
            React.createElement('div', { key: item.id, className: 'menu-item' },
              React.createElement('div', null,
                React.createElement('h4', null, item.name),
                React.createElement('span', { className: 'badge' }, item.category),
                item.description && React.createElement('p', { className: 'text-muted' }, item.description)
              ),
              React.createElement('div', { className: 'menu-item-actions' },
                React.createElement('span', { className: 'price' }, `Gs. ${Number(item.price_pyg).toLocaleString()}`),
                React.createElement('button', {
                  className: 'btn btn-danger btn-sm',
                  onClick: () => handleDelete(item.id)
                }, 'Eliminar')
              )
            )
          )
    )
  );
}

// CSV Import Component
function CsvImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6); // Preview first 6 lines
      setPreview(lines.map(l => l.split(',')));
    };
    reader.readAsText(selectedFile);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert('Error al importar');
    } finally {
      setImporting(false);
    }
  }

  return React.createElement('div', { className: 'container' },
    React.createElement('h1', null, 'Importar desde CSV'),
    
    React.createElement('div', { className: 'card' },
      React.createElement('h3', null, 'Formato esperado:'),
      React.createElement('code', null, 'restaurant_name,address,zone,phone,cuisine_type,item_name,item_description,price_pyg,item_category'),
      React.createElement('p', { className: 'text-muted mt-2' }, 'La primera fila debe ser el encabezado.')
    ),

    React.createElement('div', { className: 'form-group mt-4' },
      React.createElement('label', null, 'Archivo CSV'),
      React.createElement('input', {
        type: 'file',
        accept: '.csv',
        onChange: handleFileChange
      })
    ),

    preview.length > 0 && React.createElement('div', { className: 'preview' },
      React.createElement('h4', null, 'Vista previa:'),
      React.createElement('table', { className: 'table' },
        React.createElement('thead', null,
          React.createElement('tr', null, preview[0].map((col, i) => React.createElement('th', { key: i }, col)))
        ),
        React.createElement('tbody', null,
          preview.slice(1).map((row, i) =>
            React.createElement('tr', { key: i }, row.map((col, j) => React.createElement('td', { key: j }, col)))
          )
        )
      )
    ),

    file && React.createElement('button', {
      className: 'btn btn-primary',
      onClick: handleImport,
      disabled: importing
    }, importing ? 'Importando...' : 'Importar'),

    result && React.createElement('div', { className: 'result mt-4' },
      React.createElement('h4', null, 'Resultado:'),
      React.createElement('p', null, `${result.restaurantsCreated} restaurantes creados`),
      React.createElement('p', null, `${result.menuItemsCreated} items de menú creados`),
      result.errors.length > 0 && React.createElement('div', { className: 'errors' },
        React.createElement('h5', null, 'Errores:'),
        React.createElement('ul', null, result.errors.map((e, i) => React.createElement('li', { key: i }, e)))
      )
    )
  );
}

// Navigation
function Navigation() {
  return React.createElement('nav', { className: 'nav' },
    React.createElement('div', { className: 'nav-brand' }, 'Paladar Admin'),
    React.createElement('div', { className: 'nav-links' },
      React.createElement(Link, { to: '/', className: 'nav-link' }, 'Restaurantes'),
      React.createElement(Link, { to: '/import', className: 'nav-link' }, 'Importar CSV')
    )
  );
}

// App Component
function App() {
  return React.createElement(BrowserRouter, null,
    React.createElement('div', null,
      React.createElement(Navigation),
      React.createElement('div', { className: 'content' },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(RestaurantList) }),
          React.createElement(Route, { path: '/restaurants/new', element: React.createElement(RestaurantForm) }),
          React.createElement(Route, { path: '/restaurants/:id/edit', element: React.createElement(RestaurantForm) }),
          React.createElement(Route, { path: '/restaurants/:id/menu', element: React.createElement(MenuItems) }),
          React.createElement(Route, { path: '/import', element: React.createElement(CsvImport) })
        )
      )
    )
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));