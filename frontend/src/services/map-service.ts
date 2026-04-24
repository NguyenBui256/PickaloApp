/**
 * Map Service
 * Handles geocoding and address searching using Nominatim (OpenStreetMap).
 */

import axios from 'axios';

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

/**
 * Search for an address and return coordinates.
 * @param query The address to search for
 */
export const searchAddress = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 5,
        countrycodes: 'vn', // Restrict to Vietnam
      },
      headers: {
        'User-Agent': 'PickaloApp/1.0', // Nominatim requires a user agent
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching address:', error);
    return [];
  }
};

/**
 * Get address from coordinates.
 * @param lat Latitude
 * @param lon Longitude
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
      },
      headers: {
        'User-Agent': 'PickaloApp/1.0',
      },
    });
    return response.data.display_name || 'Vị trí đã chọn';
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return 'Vị trí đã chọn';
  }
};
