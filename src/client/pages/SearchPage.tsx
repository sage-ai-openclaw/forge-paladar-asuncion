import React, { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';

interface SearchResponse {
  query: string;
  count: number;
  results: any[];
}

export const SearchPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
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

  return (
    <div className="search-page">
      <header className="search-header">
        <h1>🍽️ Paladar Asunción</h1>
        <p>Encontrá los mejores platos en restaurantes de Asunción</p>
      </header>
      
      <main className="search-main">
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
          />
        )}
      </main>
    </div>
  );
};
