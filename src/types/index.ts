export interface Restaurant {
  id: number;
  name: string;
  address: string;
  zone: string;
  phone: string | null;
  hours: string | null;
  cuisine_type: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price_pyg: number;
  category: string;
  restaurant_id: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantWithMenu extends Restaurant {
  menu_items: MenuItem[];
}

export interface RestaurantInput {
  name: string;
  address: string;
  zone: string;
  phone?: string;
  hours?: string;
  cuisine_type: string;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price_pyg: number;
  category: string;
  restaurant_id: number;
}
