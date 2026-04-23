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
  CourtResponse,
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

/** Merchant creates venue. BE: POST /venues/merchant */
export const createVenue = async (data: VenueCreateRequest): Promise<VenueResponse> => {
  return apiClient.post('/venues/merchant', data);
};

/** Merchant updates venue. BE: PUT /venues/merchant/{venue_id} */
export const updateVenue = async (
  venueId: string,
  data: VenueUpdateRequest
): Promise<VenueResponse> => {
  return apiClient.put(`/venues/merchant/${venueId}`, data);
};

/** Merchant deactivates venue (soft delete). BE: DELETE /venues/merchant/{venue_id} */
export const deactivateVenue = async (venueId: string): Promise<void> => {
  await apiClient.delete(`/venues/merchant/${venueId}`);
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

/** Bulk create pricing slots. BE: POST /venues/{venue_id}/pricing/bulk */
export const bulkCreatePricingSlots = async (
  venueId: string,
  data: PricingBulkCreateRequest
): Promise<PricingSlotResponse[]> => {
  return apiClient.post(`/venues/${venueId}/pricing/bulk`, data);
};

/** Update pricing slot. BE: PUT /venues/{venue_id}/pricing/{slot_id} */
export const updatePricingSlot = async (
  venueId: string,
  slotId: string,
  data: Partial<PricingSlotCreateRequest>
): Promise<PricingSlotResponse> => {
  return apiClient.put(`/venues/${venueId}/pricing/${slotId}`, data);
};

/** Delete pricing slot. BE: DELETE /venues/{venue_id}/pricing/{slot_id} */
export const deletePricingSlot = async (venueId: string, slotId: string): Promise<void> => {
  await apiClient.delete(`/venues/${venueId}/pricing/${slotId}`);
};

// ==========================================
// COURTS
// ==========================================

/** Get venue courts. BE: GET /venues/{venue_id}/courts */
export const fetchVenueCourts = async (venueId: string): Promise<CourtResponse[]> => {
  return apiClient.get(`/venues/${venueId}/courts`);
};

/** Create court. BE: POST /venues/{venue_id}/courts */
export const createCourt = async (
  venue_id: string,
  data: { name: string }
): Promise<CourtResponse> => {
  return apiClient.post(`/venues/${venue_id}/courts`, data);
};

/** Bulk create courts. BE: POST /venues/{venue_id}/courts/bulk */
export const bulkCreateCourts = async (
  venue_id: string,
  data: { names: string[] }
): Promise<CourtResponse[]> => {
  return apiClient.post(`/venues/${venue_id}/courts/bulk`, data);
};

/** Update court. BE: PUT /venues/courts/{court_id} */
export const updateCourt = async (
  courtId: string,
  data: { name?: string }
): Promise<CourtResponse> => {
  return apiClient.put(`/venues/courts/${courtId}`, data);
};

/** Delete court. BE: DELETE /venues/courts/{court_id} */
export const deleteCourt = async (courtId: string): Promise<void> => {
  await apiClient.delete(`/venues/courts/${courtId}`);
};

// ==========================================
// PRICING PROFILES
// ==========================================

/** List pricing profiles. BE: GET /pricing-profiles */
export const fetchPricingProfiles = async (): Promise<PricingProfileResponse[]> => {
  return apiClient.get('/pricing-profiles');
};

/** Apply pricing profile to venue. BE: POST /pricing-profiles/apply/{profile_id}/to-venue/{venue_id} */
export const applyPricingProfile = async (
  venueId: string,
  profileId: string
): Promise<{ message: string }> => {
  return apiClient.post(`/pricing-profiles/apply/${profileId}/to-venue/${venueId}`);
};

/** Update pricing profile. BE: PUT /pricing-profiles/{profile_id} */
export const updatePricingProfile = async (
  profileId: string,
  data: { name?: string; description?: string }
): Promise<PricingProfileResponse> => {
  return apiClient.put(`/pricing-profiles/${profileId}`, data);
};

// ==========================================
// ADMIN
// ==========================================

/** Admin verifies venue. BE: POST /venues/{venue_id}/verify */
export const verifyVenue = async (venueId: string): Promise<{ message: string }> => {
  return apiClient.post(`/venues/${venueId}/verify`);
};
