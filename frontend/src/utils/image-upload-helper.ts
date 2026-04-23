/**
 * Image Upload Utility Functions for React Native
 *
 * This file provides helper functions to integrate with the new MinIO image upload APIs.
 * You can use these functions in your screens to handle image selection and uploading.
 */

import { Alert } from 'react-native';
import { APP_CONFIG } from '@constants/app-config';
import { uploadAvatar } from '@services/auth-service';
import { uploadVenueImages, uploadCourtImages } from '@services/image-service';
import { expoSelectSingleImage, expoSelectMultipleImages, validateImageAsset } from './image-picker-expo';

/**
 * Validate image file before upload
 * @deprecated Use validateImageAsset from image-picker-safe instead
 */
export const validateImageFile = (file: any): boolean => {
  return validateImageAsset(file);
};

/**
 * Select and upload user avatar
 */
export const selectAndUploadAvatar = async (
  onSuccess: (avatarUrl: string) => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const result = await expoSelectSingleImage();

    // Handle case where image picker is not available
    if (result === null) {
      return;
    }

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      onError?.(`Image picker error: ${result.errorMessage}`);
      return;
    }

    const asset = result.assets?.[0];
    if (!asset || !validateImageAsset(asset)) {
      return;
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || 'avatar.jpg',
    } as any);

    // Upload to backend
    const response = await uploadAvatar(formData);
    onSuccess(response.avatar_url);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    onError?.(errorMessage);
    Alert.alert('Upload Failed', errorMessage);
  }
};

/**
 * Select and upload venue images
 */
export const selectAndUploadVenueImages = async (
  venueId: string,
  currentImages: string[] = [],
  onSuccess: (urls: string[]) => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const result = await expoSelectMultipleImages(5);

    // Handle case where image picker is not available
    if (result === null) {
      return;
    }

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      onError?.(`Image picker error: ${result.errorMessage}`);
      return;
    }

    const assets = result.assets?.filter(validateImageAsset) || [];
    if (assets.length === 0) {
      return;
    }

    // Create FormData for upload
    const formData = new FormData();
    assets.forEach((asset) => {
      formData.append('files', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `venue_${Date.now()}.jpg`,
      } as any);
    });

    // Upload to backend
    const response = await uploadVenueImages(venueId, formData);
    const updatedImages = [...currentImages, ...response.urls];
    onSuccess(updatedImages);

    Alert.alert(
      'Success',
      `Uploaded ${response.count} image${response.count > 1 ? 's' : ''} successfully`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    onError?.(errorMessage);
    Alert.alert('Upload Failed', errorMessage);
  }
};

/**
 * Select and upload court images
 */
export const selectAndUploadCourtImages = async (
  courtId: string,
  currentImages: string[] = [],
  onSuccess: (urls: string[]) => void,
  onError?: (error: string) => void
): Promise<void> => {
  try {
    const result = await expoSelectMultipleImages(3);

    // Handle case where image picker is not available
    if (result === null) {
      return;
    }

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      onError?.(`Image picker error: ${result.errorMessage}`);
      return;
    }

    const assets = result.assets?.filter(validateImageAsset) || [];
    if (assets.length === 0) {
      return;
    }

    // Create FormData for upload
    const formData = new FormData();
    assets.forEach((asset) => {
      formData.append('files', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `court_${Date.now()}.jpg`,
      } as any);
    });

    // Upload to backend
    const response = await uploadCourtImages(courtId, formData);
    const updatedImages = [...currentImages, ...response.urls];
    onSuccess(updatedImages);

    Alert.alert(
      'Success',
      `Uploaded ${response.count} image${response.count > 1 ? 's' : ''} successfully`
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    onError?.(errorMessage);
    Alert.alert('Upload Failed', errorMessage);
  }
};

/**
 * Get image URL with fallback
 */
export const getImageUrl = (
  imageUrl: string | null | undefined,
  fallback: string = 'https://via.placeholder.com/150'
): string => {
  if (!imageUrl) {
    return fallback;
  }

  // If it's already a full URL, return it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Otherwise, it might be a relative path - this shouldn't happen with our MinIO setup
  // but adding this as a safety check
  return imageUrl;
};