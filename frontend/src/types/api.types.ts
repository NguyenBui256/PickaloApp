/**
 * Common API type definitions shared across the application.
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TimeRange {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
}

export interface Money {
  amount: number;
  currency: 'VND';
}

export interface Image {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
}
