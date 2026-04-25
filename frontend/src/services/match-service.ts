import { apiClient } from './api-client';
import {
  MatchCreateRequest,
  MatchResponse,
  MatchRequestCreateRequest,
  MatchRequestResponse,
  MatchSkillLevel,
} from '../types/api-types';

export const matchService = {
  /**
   * Create a public match from an existing booking
   */
  createMatch: async (data: MatchCreateRequest): Promise<MatchResponse> => {
    return apiClient.post<MatchResponse>('/matches/', data);
  },

  /**
   * Search for nearby open matches
   */
  searchNearbyMatches: async (params: {
    lat: number;
    lng: number;
    radius?: number;
    skill_level?: MatchSkillLevel;
    min_slots?: number;
    date?: string;
    start_time?: string;
    end_time?: string;
    skip?: number;
    limit?: number;
  }): Promise<MatchResponse[]> => {
    return apiClient.get<MatchResponse[]>('/matches/nearby', { params });
  },
  
  /**
   * Get all open matches for a specific venue
   */
  getVenueMatches: async (venueId: string): Promise<MatchResponse[]> => {
    return apiClient.get<MatchResponse[]>(`/matches/venue/${venueId}`);
  },

  /**
   * Get match details
   */
  getMatch: async (matchId: string): Promise<MatchResponse> => {
    return apiClient.get<MatchResponse>(`/matches/${matchId}`);
  },

  /**
   * Request to join a match
   */
  joinMatch: async (
    matchId: string,
    data: MatchRequestCreateRequest,
    initialMessage?: string
  ): Promise<MatchRequestResponse> => {
    const params = initialMessage ? { initial_message: initialMessage } : undefined;
    return apiClient.post<MatchRequestResponse>(`/matches/${matchId}/requests`, data, { params });
  },

  /**
   * Host responds to a match request
   */
  respondToRequest: async (
    requestId: string,
    accept: boolean
  ): Promise<MatchRequestResponse> => {
    return apiClient.post<MatchRequestResponse>(
      `/matches/requests/${requestId}/respond`,
      null,
      { params: { accept } }
    );
  },

  /**
   * Host kicks an already accepted member
   */
  kickMember: async (requestId: string): Promise<MatchRequestResponse> => {
    return apiClient.post<MatchRequestResponse>(`/matches/requests/${requestId}/kick`);
  },
  
  /**
   * Cancel a join request
   */
  cancelJoinRequest: async (requestId: string): Promise<void> => {
    return apiClient.delete(`/matches/requests/${requestId}`);
  },

  /**
   * Cancel a match (stop matchmaking, case 6)
   */
  cancelMatch: async (matchId: string): Promise<MatchResponse> => {
    return apiClient.post<MatchResponse>(`/matches/${matchId}/cancel`);
  },

  /**
   * Delete a match (for host)
   */
  deleteMatch: async (matchId: string): Promise<void> => {
    return apiClient.delete(`/matches/${matchId}`);
  },
};

