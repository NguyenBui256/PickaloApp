import { apiClient } from './api-client';
import { VenueListResponse } from '../types/api-types';

export interface FavoriteToggleResponse {
  venue_id: string;
  is_favorite: boolean;
  message: string;
}

/**
 * Toggle favorite status for a venue
 */
export const toggleFavorite = async (venueId: string): Promise<FavoriteToggleResponse> => {
  return apiClient.post<FavoriteToggleResponse>(`/favorites/toggle/${venueId}`);
};

/**
 * Get list of favorited venues
 */
export const fetchFavoriteVenues = async (page: number = 1, limit: number = 20): Promise<VenueListResponse> => {
  return apiClient.get<VenueListResponse>('/favorites', {
    params: { page, limit }
  });
};
