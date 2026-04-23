/**
 * Expo-compatible Image Picker Utility
 *
 * Uses expo-image-picker for proper Expo/IOS support
 * Handles image selection with proper error checking and permissions.
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { APP_CONFIG } from '@constants/app-config';

export interface ExpoImagePickerResult {
  didCancel: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Array<{
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
  }>;
}

/**
 * Check if we have required permissions
 */
export const checkPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to make this work!',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  return true;
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
 * Safely launch image library with Expo
 */
export const expoLaunchImageLibrary = async (
  options: ImagePicker.ImagePickerOptions = {}
): Promise<ExpoImagePickerResult | null> => {
  try {
    // Check permissions first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      return null;
    }

    // Set default options
    const defaultOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      ...options,
    };

    const result = await ImagePicker.launchImageLibraryAsync(defaultOptions) as ImagePicker.ImagePickerResult & {
      assets?: ImagePicker.ImagePickerAsset[]
    };

    if (result.canceled) {
      return {
        didCancel: true,
        assets: result.assets ? result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
          uri: asset.uri,
          type: asset.mimeType,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        })) : [],
      };
    }

    return {
      didCancel: false,
      assets: result.assets ? result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
        uri: asset.uri,
        type: asset.mimeType,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      })) : [],
    };
  } catch (error) {
    console.error('Expo Image picker error:', error);
    Alert.alert(
      'Image Picker Error',
      'Failed to open image picker. Please check app permissions and try again.'
    );
    return null;
  }
};

/**
 * Select multiple images with Expo
 */
export const expoSelectMultipleImages = async (
  maxImages: number = 5
): Promise<ExpoImagePickerResult | null> => {
  return expoLaunchImageLibrary({
    selectionLimit: maxImages,
  });
};

/**
 * Select single image with Expo
 */
export const expoSelectSingleImage = async (): Promise<ExpoImagePickerResult | null> => {
  return expoLaunchImageLibrary({
    selectionLimit: 1,
  });
};

/**
 * Take a photo with camera
 */
export const expoTakePhoto = async (): Promise<ExpoImagePickerResult | null> => {
  try {
    // Check camera permissions
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to make this work!',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    }) as ImagePicker.ImagePickerResult & {
      assets?: ImagePicker.ImagePickerAsset[]
    };

    if (result.canceled) {
      return {
        didCancel: true,
        assets: result.assets ? result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
          uri: asset.uri,
          type: asset.mimeType,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
        })) : [],
      };
    }

    return {
      didCancel: false,
      assets: result.assets ? result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
        uri: asset.uri,
        type: asset.mimeType,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
      })) : [],
    };
  } catch (error) {
    console.error('Expo Camera error:', error);
    Alert.alert(
      'Camera Error',
      'Failed to open camera. Please check app permissions and try again.'
    );
    return null;
  }
};

export default ImagePicker;