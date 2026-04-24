import { apiClient } from './api-client';
import { ChatMessageResponse } from '../types/api-types';
import { APP_CONFIG } from '@constants/app-config';

export const chatService = {
  /**
   * Get chat history for a specific room
   */
  getRoomMessages: async (
    roomId: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<ChatMessageResponse[]> => {
    return apiClient.get<ChatMessageResponse[]>(`/chat/rooms/${roomId}/messages`, {
      params: { skip, limit },
    });
  },

  /**
   * Get all chat rooms for the current user
   */
  getMyRooms: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/chat/rooms');
  },


  /**
   * Construct WebSocket URL for real-time chat
   */
  getWebSocketUrl: (roomId: string, token: string): string => {
    const baseUrl = APP_CONFIG.API_BASE_URL;
    // Convert http/https to ws/wss
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsBaseUrl}/chat/ws/${roomId}?token=${token}`;
  },
};
