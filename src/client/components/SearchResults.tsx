import React from 'react';

interface SearchResult {
  menu_item_id: number;
  dish_name: string;
  description: string | null;
  price: number;
  category: string | null;
  restaurant_id: number;
  restaurant_name: string;
  cuisine_type: string;
  address: string;
  zone: string;
  phone: string | null;
  website: string | null;
  relevance_score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0
  }).format(price);
};

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!text) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? 
      <mark key={i}>{part}</mark> : part
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({ results, query }) => {
  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>No se encontraron resultados para "{query}"</p>
        <p className="no-results-hint">
          Intenta con otros términos como "parrilla", "pasta", "sushi"...
        </p>
      </div>
    );
  }

  // Group results by restaurant
  const groupedByRestaurant = results.reduce((acc, result) => {
    if (!acc[result.restaurant_id]) {
      acc[result.restaurant_id] = {
        restaurant: {
          id: result.restaurant_id,
          name: result.restaurant_name,
          cuisine_type: result.cuisine_type,
          address: result.address,
          zone: result.zone,
          phone: result.phone,
          website: result.website
        },
        items: []
      };
    }
    acc[result.restaurant_id].items.push(result);
    return acc;
  }, {} as Record<number, { restaurant: any, items: SearchResult[] }>);

  return (
    <div className="search-results">
      <p className="results-count">
        {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
      </p>
      
      {Object.values(groupedByRestaurant).map(({ restaurant, items }) => (
        <div key={restaurant.id} className="restaurant-result">
          <div className="restaurant-header">
            <h3>{highlightMatch(restaurant.name, query)}</h3>
            <span className="cuisine-type">{restaurant.cuisine_type}</span>
          </div>
          
          <p className="restaurant-address">
            {restaurant.address}, {restaurant.zone}
          </p>
          
          <div className="menu-items-list">
            {items.map((item) => (
              <div key={item.menu_item_id} className="menu-item-card">
                <div className="menu-item-info">
                  <h4>{highlightMatch(item.dish_name, query)}</h4>
                  {item.description && (
                    <p className="menu-item-description">
                      {highlightMatch(item.description, query)}
                    </p>
                  )}
                  {item.category && (
                    <span className="menu-item-category">{item.category}</span>
                  )}
                </div>
                <div className="menu-item-price">
                  {formatPrice(item.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
