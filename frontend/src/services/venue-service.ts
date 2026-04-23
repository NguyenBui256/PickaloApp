/**
 * Venue Service — API Backend Venues
 *
 * Backend source: backend/app/api/v1/endpoints/venues.py
 * Router prefix: /venues
 */

import { apiClient } from './api-client';
import type {
  VenueListResponse,
  VenueResponse,
  VenueCreateRequest,
  VenueUpdateRequest,
  VenueSearchParams,
  AvailabilityResponse,
  VenueServiceCreateRequest,
  VenueServiceResponse,
  PricingSlotCreateRequest,
  PricingSlotResponse,
} from '../types/api-types';

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/** List venues with filters. BE: GET /venues */
export const fetchVenues = async (params?: VenueSearchParams): Promise<VenueListResponse> => {
  return apiClient.get('/venues', { params });
};

/** Search venues nearby. BE: GET /venues/search/nearby */
export const searchVenuesNearby = async (params: {
  lat: number;
  lng: number;
  radius?: number;
  venue_type?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}): Promise<VenueListResponse> => {
  return apiClient.get('/venues/search/nearby', { params });
};

/** Get venue detail. BE: GET /venues/{venue_id} */
export const fetchVenueById = async (venueId: string): Promise<VenueResponse> => {
  return apiClient.get(`/venues/${venueId}`);
};

/** Check slot availability by date. BE: GET /venues/{venue_id}/availability?date=... */
export const fetchVenueAvailability = async (
  venueId: string,
  date: string
): Promise<AvailabilityResponse> => {
  return apiClient.get(`/venues/${venueId}/availability`, { params: { date } });
};

/** List districts. BE: GET /venues/districts/list */
export const fetchDistrictsList = async (): Promise<{ districts: string[] }> => {
  return apiClient.get('/venues/districts/list');
};

// ==========================================
// MERCHANT ENDPOINTS
// ==========================================

/** Merchant creates venue. BE: POST /venues */
export const createVenue = async (data: VenueCreateRequest): Promise<VenueResponse> => {
  return apiClient.post('/venues', data);
};

/** Merchant updates venue. BE: PUT /venues/{venue_id} */
export const updateVenue = async (
  venueId: string,
  data: VenueUpdateRequest
): Promise<VenueResponse> => {
  return apiClient.put(`/venues/${venueId}`, data);
};

/** Merchant deactivates venue (soft delete). BE: DELETE /venues/{venue_id} */
export const deactivateVenue = async (venueId: string): Promise<void> => {
  await apiClient.delete(`/venues/${venueId}`);
};

// ==========================================
// VENUE SERVICES
// ==========================================

/** List venue services. BE: GET /venues/{venue_id}/services */
export const fetchVenueServices = async (venueId: string): Promise<VenueServiceResponse[]> => {
  return apiClient.get(`/venues/${venueId}/services`);
};

/** Add venue service. BE: POST /venues/{venue_id}/services */
export const createVenueService = async (
  venueId: string,
  data: VenueServiceCreateRequest
): Promise<VenueServiceResponse> => {
  return apiClient.post(`/venues/${venueId}/services`, data);
};

/** Update venue service. BE: PUT /venues/{venue_id}/services/{service_id} */
export const updateVenueService = async (
  venueId: string,
  serviceId: string,
  data: Partial<VenueServiceCreateRequest>
): Promise<VenueServiceResponse> => {
  return apiClient.put(`/venues/${venueId}/services/${serviceId}`, data);
};

/** Delete venue service. BE: DELETE /venues/{venue_id}/services/{service_id} */
export const deleteVenueService = async (venueId: string, serviceId: string): Promise<void> => {
  await apiClient.delete(`/venues/${venueId}/services/${serviceId}`);
};

// ==========================================
// PRICING SLOTS
// ==========================================

/** List pricing slots. BE: GET /venues/{venue_id}/pricing */
export const fetchPricingSlots = async (venueId: string): Promise<PricingSlotResponse[]> => {
  return apiClient.get(`/venues/${venueId}/pricing`);
};

/** Create pricing slot. BE: POST /venues/{venue_id}/pricing */
export const createPricingSlot = async (
  venueId: string,
  data: PricingSlotCreateRequest
): Promise<PricingSlotResponse> => {
  return apiClient.post(`/venues/${venueId}/pricing`, data);
};

// ==========================================
// ADMIN
// ==========================================

/** Admin verifies venue. BE: POST /venues/{venue_id}/verify */
export const verifyVenue = async (venueId: string): Promise<{ message: string }> => {
  return apiClient.post(`/venues/${venueId}/verify`);
};
