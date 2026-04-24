import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { expoSelectMultipleImages, validateImageAsset, expoLaunchImageLibrary } from '../../../utils/image-picker-expo';
import { uploadVenueImages } from '../../../services/image-service';
import { getImageUrl } from '../../../utils/image-upload-helper';
import { createVenue } from '../../../services/venue-service';
import type { Coordinates } from '../../../types/api-types';

type VenueRegistrationRouteProp = RouteProp<
  { VenueRegistration: { selectedLocation?: { lat: number; lng: number } } },
  'VenueRegistration'
>;

interface TempImage {
  uri: string;
  type?: 'image/jpeg' | 'image/png' | 'image/jpg' | undefined;
  fileName?: string | undefined;
}

export const VenueRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VenueRegistrationRouteProp>();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Pickleball' as const,
    price: '',
    description: '',
  });

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(
    route.params?.selectedLocation || null
  );

  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [coverImage, setCoverImage] = useState<TempImage | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLicense, setHasLicense] = useState(false);

  // Update location when returning from LocationPicker
  useEffect(() => {
    if (route.params?.selectedLocation) {
      setSelectedLocation(route.params.selectedLocation);
    }
  }, [route.params?.selectedLocation]);

  const handleAddImages = async () => {
    try {
      const result = await expoSelectMultipleImages(5 - tempImages.length);

      // Handle case where image picker is not available
      if (result === null) {
        return;
      }

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', result.errorMessage || 'Không thể chọn ảnh');
        return;
      }

      const assets = result.assets?.filter(validateImageAsset) || [];
      if (assets.length === 0) {
        return;
      }

      // Add temporary images
      const newTempImages: TempImage[] = assets
        .filter((asset) => asset.uri !== undefined)
        .map((asset) => ({
          uri: asset.uri || '',
          type: (asset.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/jpg',
          fileName: asset.fileName || `venue_${Date.now()}.jpg`,
        }));

      setTempImages((prev) => [...prev, ...newTempImages]);
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handlePickCoverImage = async () => {
    try {
      const result = await expoLaunchImageLibrary({ selectionLimit: 1 });
      if (result && !result.didCancel && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (validateImageAsset(asset)) {
          setCoverImage({
            uri: asset.uri,
            type: (asset.type || 'image/jpeg') as any,
            fileName: asset.fileName || `cover_${Date.now()}.jpg`,
          });
        }
      }
    } catch (error) {
      console.error('Pick cover image error:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc muốn xóa ảnh này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updatedTempImages = tempImages.filter((_, i) => i !== index);
          setTempImages(updatedTempImages);
        },
      },
    ]);
  };

  const uploadImagesToVenue = async (venueId: string): Promise<void> => {
    if (tempImages.length === 0) {
      return;
    }

    try {
      setIsUploading(true);

      let finalCoverUrl = '';
      let uploadedUrls: string[] = [];

      if (tempImages.length > 0) {
        const formData = new FormData();
        tempImages.forEach((image) => {
          formData.append('files', {
            uri: image.uri,
            type: image.type,
            name: image.fileName,
          } as any);
        });

        const response = await uploadVenueImages(venueId, formData);
        uploadedUrls = response.urls;
        finalCoverUrl = uploadedUrls[0];
      }
      
      if (coverImage) {
        const coverFormData = new FormData();
        coverFormData.append('files', {
          uri: coverImage.uri,
          type: coverImage.type,
          name: coverImage.fileName,
        } as any);
        const coverResponse = await uploadVenueImages(venueId, coverFormData);
        finalCoverUrl = coverResponse.urls[0];
      }

      if (finalCoverUrl) {
        await updateVenue(venueId, { cover_image: finalCoverUrl });
      }

      setUploadedImageUrls(uploadedUrls);

      Alert.alert(
        'Thành công',
        `Đã đăng ký sân thành công.`
      );
    } catch (error: any) {
      console.error('Image upload error:', error);
      console.warn('Venue created but image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.address || !formData.price) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn vị trí trên bản đồ');
      return;
    }

    try {
      setIsSubmitting(true);

      const venueData = {
        name: formData.name,
        address: formData.address,
        coordinates: selectedLocation,
        venue_type: formData.type,
        base_price_per_hour: parseInt(formData.price, 10),
        description: formData.description || undefined,
        images: [],
        cover_image: null,
      };

      if (tempImages.length > 5) {
        Alert.alert('Quá giới hạn', 'Sân chỉ được tối đa 5 hình ảnh.');
        return;
      }

      const response = await createVenue(venueData);

      if (tempImages.length > 0 || coverImage) {
        await uploadImagesToVenue(response.id);
      } else {
        Alert.alert(
          'Thành công',
          'Hồ sơ đăng ký sân của bạn đã được gửi và đang chờ duyệt.'
        );
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Venue registration error:', error);
      const errorMessage = error?.response?.data?.detail || 'Không thể đăng ký sân. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickLocation = () => {
    navigation.navigate('LocationPicker', {
      initialLocation: selectedLocation || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký sân mới</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Thông tin cơ bản</Text>
          <CustomInput
            type="email"
            placeholder="Tên sân (*)"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <CustomInput
            type="email"
            placeholder="Địa chỉ chi tiết (*)"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
          <CustomInput
            type="email"
            placeholder="Giá thuê cơ bản (vnđ/giờ) (*)"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Vị trí trên bản đồ</Text>
          <TouchableOpacity style={styles.mapPlaceholder} onPress={handlePickLocation}>
            {selectedLocation ? (
              <View style={styles.selectedLocationContainer}>
                <MaterialCommunityIcons name="map-marker-check" size={40} color={COLORS.PRIMARY} />
                <Text style={styles.mapTextSelected}>Đã chọn vị trí</Text>
                <Text style={styles.coordinatesText}>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Text>
                <Text style={styles.changeLocationText}>Nhấn để thay đổi vị trí</Text>
              </View>
            ) : (
              <View style={styles.unselectedLocationContainer}>
                <MaterialCommunityIcons name="map-marker-radius" size={40} color={COLORS.PRIMARY} />
                <Text style={styles.mapText}>Bấm để chọn vị trí trên bản đồ</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Ảnh bìa sân (*)</Text>
          <Text style={styles.helperText}>
            Ảnh đại diện chính hiển thị trên danh sách và trang chi tiết.
          </Text>
          <TouchableOpacity style={styles.coverImagePicker} onPress={handlePickCoverImage}>
            {coverImage ? (
              <Image source={{ uri: coverImage.uri }} style={styles.coverImagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={40} color={COLORS.GRAY_MEDIUM} />
                <Text style={styles.coverImageText}>Chọn ảnh bìa</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Hình ảnh sân</Text>
          <Text style={styles.helperText}>
            Tải lên hình ảnh sân của bạn (tối đa 5 hình, mỗi hình tối đa 5MB)
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handleAddImages}
              disabled={isUploading || isSubmitting || (tempImages.length + uploadedImageUrls.length) >= 5}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={30}
                    color={
                      isUploading || isSubmitting || (tempImages.length + uploadedImageUrls.length) >= 5
                        ? COLORS.GRAY_LIGHT
                        : COLORS.GRAY_MEDIUM
                    }
                  />
                  <Text
                    style={[
                      styles.addImageText,
                      (isUploading || isSubmitting || (tempImages.length + uploadedImageUrls.length) >= 5) &&
                        styles.addImageTextDisabled,
                    ]}
                  >
                    Thêm ảnh
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {tempImages.map((image, index) => (
              <View
                key={`temp-${index}`}
                style={styles.imageContainer}
              >
                <Image source={{ uri: image.uri }} style={styles.venueImage} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={22}
                    color="#FF4444"
                    style={styles.removeIconBg}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {uploadedImageUrls.map((imageUrl, index) => (
              <TouchableOpacity key={`uploaded-${index}`} style={styles.imageContainer}>
                <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.venueImage} resizeMode="cover" />
                <View style={styles.uploadedBadge}>
                  <MaterialCommunityIcons name="check" size={12} color="#388E3C" />
                </View>
              </TouchableOpacity>
            ))}

            {/* Placeholder for visual feedback when no images */}
            {tempImages.length === 0 && uploadedImageUrls.length === 0 && !isUploading && (
              <>
                <View style={styles.placeholderImage} />
                <View style={styles.placeholderImage} />
              </>
            )}
          </ScrollView>

          {(tempImages.length > 0 || uploadedImageUrls.length > 0) && (
            <Text style={styles.imageCount}>
              {tempImages.length + uploadedImageUrls.length} hình đã chọn
            </Text>
          )}
        </View>

        {/* License Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Giấy phép & Tài liệu</Text>
          <TouchableOpacity style={styles.licenseUpload} onPress={() => setHasLicense(!hasLicense)}>
            <MaterialCommunityIcons
              name={hasLicense ? 'file-check' : 'file-upload-outline'}
              size={24}
              color={hasLicense ? '#388E3C' : COLORS.GRAY_MEDIUM}
            />
            <Text style={styles.licenseText}>
              {hasLicense ? 'Đã tải giấy phép kinh doanh' : 'Tải lên giấy phép kinh doanh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <PrimaryButton
            text={isSubmitting ? 'Đang gửi...' : 'Đăng ký sân'}
            onPress={handleRegister}
            disabled={isSubmitting || isUploading}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtnHeader: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 8,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    marginTop: 8,
    color: COLORS.GRAY_MEDIUM,
    fontSize: 14,
  },
  mapTextSelected: {
    marginTop: 8,
    color: COLORS.PRIMARY,
    fontSize: 15,
    fontWeight: '600',
  },
  coordinatesText: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  changeLocationText: {
    marginTop: 4,
    color: COLORS.GRAY_MEDIUM,
    fontSize: 11,
  },
  coverImagePicker: {
    height: 180,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageText: {
    marginTop: 8,
    color: COLORS.GRAY_MEDIUM,
    fontSize: 14,
  },
  imageScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  addImageTextDisabled: {
    color: COLORS.GRAY_LIGHT,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  removeIconBg: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.5,
  },
  imageCount: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 4,
  },
  licenseUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  licenseText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  submitSection: {
    marginTop: 8,
    marginBottom: 24,
  },
});