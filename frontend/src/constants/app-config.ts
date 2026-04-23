/**
 * Application configuration constants.
 */

import { API_BASE_URL } from '@env';

export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: __DEV__ ? API_BASE_URL : 'https://api.alobo.vn/api/v1', // Production URL

  // Timeouts (in milliseconds)
  API_TIMEOUT: 30000,
  IMAGE_UPLOAD_TIMEOUT: 60000,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,

  // Timezone (fixed for Hanoi)
  TIMEZONE: 'Asia/Ho_Chi_Minh',

  // Map configuration
  MAP_DEFAULT_REGION: {
    latitude: 21.0285, // Hanoi center
    longitude: 105.8542,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },

  // Booking configuration
  BOOKING_EXPIRY_MINUTES: 15,
  MAX_BOOKING_DAYS_IN_ADVANCE: 30,

  // Image upload limits
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@alobo_access_token',
    REFRESH_TOKEN: '@alobo_refresh_token',
    USER_DATA: '@alobo_user_data',
    MERCHANT_DATA: '@alobo_merchant_data',
    ONBOARDING_COMPLETED: '@alobo_onboarding_completed',
  },
} as const;
