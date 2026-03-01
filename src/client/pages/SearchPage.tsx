import React, { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';

interface SearchResponse {
  query: string;
  count: number;
  results: any[];
}

interface RestaurantDetail {
  id: number;
  name: string;
  address: string;
  zone: string;
  phone?: string;
  hours?: string;
  cuisine_type?: string;
  menu_items?: any[];
}

export const SearchPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetail | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setSelectedRestaurant(null);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }
      
      const data = await response.json();
      setSearchData(data);
    } catch (err) {
      setError('No se pudo realizar la búsqueda. Intenta de nuevo.');
      setSearchData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectRestaurant = useCallback(async (restaurantId: number) => {
    setRestaurantLoading(true);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el restaurante');
      }
      
      const data = await response.json();
      setSelectedRestaurant(data);
    } catch (err) {
      setError('No se pudo cargar el restaurante. Intenta de nuevo.');
    } finally {
      setRestaurantLoading(false);
    }
  }, []);

  const handleBackToSearch = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  return (
    <div className="search-page">
      <header className="search-header">
        <h1>🍽️ Paladar Asunción</h1>
        <p>Encontrá los mejores platos en restaurantes de Asunción</p>
      </header>
      
      <main className="search-main">
        {!selectedRestaurant ? (
          <>
            <SearchBar onSearch={handleSearch} loading={loading} />
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {searchData && (
              <SearchResults 
                results={searchData.results} 
                query={searchData.query}
                onSelectRestaurant={handleSelectRestaurant}
              />
            )}
          </>
        ) : (
          <div className="restaurant-detail">
            <button 
              className="back-button" 
              onClick={handleBackToSearch}
              disabled={restaurantLoading}
            >
              ← Volver a búsqueda
            </button>
            
            <div className="restaurant-info">
              <h2>{selectedRestaurant.name}</h2>
              <p className="cuisine-type">{selectedRestaurant.cuisine_type}</p>
              <p className="address">{selectedRestaurant.address}, {selectedRestaurant.zone}</p>
              {selectedRestaurant.phone && (
                <p className="phone">📞 {selectedRestaurant.phone}</p>
              )}
              {selectedRestaurant.hours && (
                <p className="hours">🕐 {selectedRestaurant.hours}</p>
              )}
            </div>
            
            <div className="menu-section">
              <h3>Menú</h3>
              {selectedRestaurant.menu_items && selectedRestaurant.menu_items.length > 0 ? (
                <div className="menu-items">
                  {selectedRestaurant.menu_items.map((item: any) => (
                    <div key={item.id} className="menu-item">
                      <div className="menu-item-header">
                        <span className="menu-item-name">{item.name}</span>
                        <span className="menu-item-price">
                          {new Intl.NumberFormat('es-PY', {
                            style: 'currency',
                            currency: 'PYG',
                            minimumFractionDigits: 0
                          }).format(item.price_pyg)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="menu-item-description">{item.description}</p>
                      )}
                      <span className="menu-item-category">{item.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-menu-items">No hay items en el menú</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
