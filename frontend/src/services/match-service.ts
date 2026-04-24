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
};
