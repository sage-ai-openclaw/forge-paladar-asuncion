export interface Restaurant {
  id: number;
  name: string;
  address: string;
  zone: string;
  phone?: string;
  hours?: string;
  cuisine_type?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  price_pyg: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantInput {
  name: string;
  address: string;
  zone: string;
  phone?: string;
  hours?: string;
  cuisine_type?: string;
}

export interface MenuItemInput {
  restaurant_id: number;
  name: string;
  description?: string;
  price_pyg: number;
  category?: string;
}
