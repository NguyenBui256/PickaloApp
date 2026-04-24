/**
 * Safe Image Picker Utility
 *
 * Handles react-native-image-picker with proper error checking
 * and fallback for when the native module isn't available.
 */

import { Alert } from 'react-native';
import { APP_CONFIG } from '@constants/app-config';

// Try to import the module, handle cases where it's not available
let ImagePicker: any = null;

try {
  const imagePickerModule = require('react-native-image-picker');
  if (imagePickerModule && imagePickerModule.launchImageLibrary) {
    ImagePicker = imagePickerModule;
  }
} catch (error) {
  console.warn('react-native-image-picker not available:', error);
}

export interface SafeImagePickerResult {
  didCancel: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Array<{
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  }>;
}

/**
 * Check if image picker is available
 */
export const isImagePickerAvailable = (): boolean => {
  return ImagePicker !== null && typeof ImagePicker.launchImageLibrary === 'function';
};

/**
 * Validate image file
 */
export const validateImageAsset = (asset: any): boolean => {
  if (!asset || !asset.uri) {
    return false;
  }

  // Check file size (5MB limit)
  if (asset.fileSize && asset.fileSize > APP_CONFIG.MAX_IMAGE_SIZE) {
    Alert.alert(
      'File Too Large',
      `Maximum file size is ${APP_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
    );
    return false;
  }

  // Check file type
  if (asset.type && !APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(asset.type as any)) {
    Alert.alert(
      'Invalid File Type',
      `Allowed types: ${APP_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`
    );
    return false;
  }

  return true;
};

/**
 * Safely launch image library with error handling
 */
export const safeLaunchImageLibrary = async (
  options: any = {}
): Promise<SafeImagePickerResult | null> => {
  // Check if image picker is available
  if (!isImagePickerAvailable()) {
    Alert.alert(
      'Image Picker Not Available',
      'The image picker feature is not available. This may be because:\n\n' +
      '1. The app needs to be rebuilt after installing dependencies\n' +
      '2. Native modules are not properly linked\n' +
      '3. Platform permissions are not granted\n\n' +
      'Please try:\n' +
      '• Run: npx react-native run-android\n' +
      '• Or rebuild the app manually\n' +
      '• Check app permissions for photo library access'
    );
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo' as const,
      selectionLimit: 1,
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      ...options,
    });

    return result;
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert(
      'Image Picker Error',
      'Failed to open image picker. Please check app permissions and try again.'
    );
    return null;
  }
};

/**
 * Select multiple images safely
 */
export const safeSelectMultipleImages = async (
  maxImages: number = 5
): Promise<SafeImagePickerResult | null> => {
  return safeLaunchImageLibrary({
    selectionLimit: maxImages,
  });
};

/**
 * Select single image safely
 */
export const safeSelectSingleImage = async (): Promise<SafeImagePickerResult | null> => {
  return safeLaunchImageLibrary({
    selectionLimit: 1,
  });
};

export default ImagePicker;