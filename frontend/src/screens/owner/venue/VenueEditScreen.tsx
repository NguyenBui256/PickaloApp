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
import { fetchVenueById, updateVenue } from '../../../services/venue-service';
import { uploadVenueImages } from '../../../services/image-service';
import { getImageUrl } from '../../../utils/image-upload-helper';
import type { Coordinates, VenueType } from '../../../types/api-types';

type VenueEditRouteProp = RouteProp<
  { VenueEdit: { venueId: string } },
  'VenueEdit'
>;

interface TempImage {
  uri: string;
  type?: 'image/jpeg' | 'image/png' | 'image/jpg' | undefined;
  fileName?: string | undefined;
}

export const VenueEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VenueEditRouteProp>();
  const { venueId } = route.params;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Pickleball' as VenueType,
    price: '',
    description: '',
  });

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [venueImages, setVenueImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [newCoverImage, setNewCoverImage] = useState<TempImage | null>(null);
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing venue data
  useEffect(() => {
    loadVenueData();
  }, [venueId]);

  const loadVenueData = async () => {
    try {
      setIsLoading(true);
      const venue = await fetchVenueById(venueId);

      // Populate form with existing data
      setFormData({
        name: venue.name,
        address: venue.address,
        type: venue.venue_type,
        price: venue.base_price_per_hour.toString(),
        description: venue.description || '',
      });

      setSelectedLocation(venue.location);
      setVenueImages((venue.images || []).filter((img: any) => 
        typeof img === 'string' && 
        img.trim() !== '' && 
        (img.startsWith('http') || img.match(/\.(jpg|jpeg|png|webp|gif)/i))
      ));
      setCoverImage(venue.cover_image || null);
    } catch (error: any) {
      console.error('Error loading venue:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sân. Vui lòng thử lại.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Validation
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

      // Prepare venue update data
      const updateData = {
        name: formData.name,
        address: formData.address,
        coordinates: selectedLocation,
        venue_type: formData.type,
        base_price_per_hour: parseInt(formData.price, 10),
        description: formData.description || undefined,
        images: venueImages,
        cover_image: coverImage || null,
      };

      if (venueImages.length + tempImages.length > 5) {
        Alert.alert('Quá giới hạn', 'Sân chỉ được tối đa 5 hình ảnh.');
        return;
      }

      // Update venue
      await updateVenue(venueId, updateData);

      // Upload new cover image if selected
      if (newCoverImage) {
        const coverFormData = new FormData();
        coverFormData.append('files', {
          uri: newCoverImage.uri,
          type: newCoverImage.type,
          name: newCoverImage.fileName,
        } as any);
        const coverResponse = await uploadVenueImages(venueId, coverFormData);
        await updateVenue(venueId, { cover_image: coverResponse.urls[0] });
      }

      // Upload new images if any were selected
      if (tempImages.length > 0) {
        await uploadNewImages();
      } else {
        Alert.alert('Thành công', 'Cập nhật thông tin sân thành công.');
      }

      // Navigate back
      navigation.goBack();
    } catch (error: any) {
      console.error('Venue update error:', error);
      const errorMessage = error?.response?.data?.detail || 'Không thể cập nhật sân. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadNewImages = async () => {
    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      tempImages.forEach((image) => {
        formData.append('files', {
          uri: image.uri,
          type: image.type,
          name: image.fileName,
        } as any);
      });

      // Upload images
      const response = await uploadVenueImages(venueId, formData);
      setVenueImages((prev) => [...prev, ...response.urls]);
      setTempImages([]);

      Alert.alert(
        'Thành công',
        `Cập nhật sân thành công và tải lên ${response.count} hình ảnh mới.`
      );
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Thành công', 'Cập nhật sân thành công nhưng không thể tải lên hình ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickLocation = () => {
    navigation.navigate('LocationPicker' as never, {
      initialLocation: selectedLocation || undefined,
    });
  };

  const handleAddImages = async () => {
    try {
      const result = await expoSelectMultipleImages(5 - venueImages.length - tempImages.length);

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
          setNewCoverImage({
            uri: asset.uri,
            type: (asset.type || 'image/jpeg') as any,
            fileName: asset.fileName || `cover_${Date.now()}.jpg`,
          });
          setCoverImage(null); // Clear existing cover if new one picked
        }
      }
    } catch (error) {
      console.error('Pick cover image error:', error);
    }
  };

  const handleRemoveImage = (index: number, isTemp: boolean) => {
    if (isTemp) {
      const updatedTempImages = tempImages.filter((_, i) => i !== index);
      setTempImages(updatedTempImages);
    } else {
      Alert.alert('Xóa ảnh', 'Bạn có chắc muốn xóa ảnh này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const updatedImages = venueImages.filter((_, i) => i !== index);
            setVenueImages(updatedImages);
          },
        },
      ]);
    }
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa sân</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Basic Information Section */}
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

        {/* Map Location Section */}
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

        {/* Cover Image Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Ảnh bìa sân (*)</Text>
          <Text style={styles.helperText}>
            Ảnh đại diện chính hiển thị trên danh sách và trang chi tiết.
          </Text>
          <TouchableOpacity style={styles.coverImagePicker} onPress={handlePickCoverImage}>
            {newCoverImage ? (
              <Image source={{ uri: newCoverImage.uri }} style={styles.coverImagePreview} resizeMode="cover" />
            ) : coverImage ? (
              <Image source={{ uri: getImageUrl(coverImage) }} style={styles.coverImagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={40} color={COLORS.GRAY_MEDIUM} />
                <Text style={styles.coverImageText}>Chọn ảnh bìa</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Images Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Hình ảnh sân</Text>
          <Text style={styles.helperText}>
            Tải lên hình ảnh sân của bạn (tối đa 5 hình, mỗi hình tối đa 5MB)
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {/* Add Image Button */}
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handleAddImages}
              disabled={isUploading || isSubmitting || venueImages.length + tempImages.length >= 5}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={30}
                    color={
                      isUploading || isSubmitting || venueImages.length + tempImages.length >= 5
                        ? COLORS.GRAY_LIGHT
                        : COLORS.GRAY_MEDIUM
                    }
                  />
                  <Text
                    style={[
                      styles.addImageText,
                      (isUploading || isSubmitting || venueImages.length + tempImages.length >= 5) &&
                        styles.addImageTextDisabled,
                    ]}
                  >
                    Thêm ảnh
                  </Text>
                </>
              )}
            </TouchableOpacity>

             {/* Existing Images */}
             {venueImages.map((imageUrl, index) => (
               <View
                 key={`existing-${index}`}
                 style={styles.imageContainer}
               >
                 <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.venueImage} resizeMode="cover" />
                 <TouchableOpacity
                   style={styles.removeImageButton}
                   onPress={() => handleRemoveImage(index, false)}
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

             {/* Temp Images (local URIs) */}
             {tempImages.map((image, index) => (
               <View
                 key={`temp-${index}`}
                 style={styles.imageContainer}
               >
                 <Image source={{ uri: image.uri }} style={styles.venueImage} resizeMode="cover" />
                 <TouchableOpacity
                   style={styles.removeImageButton}
                   onPress={() => handleRemoveImage(index, true)}
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

            {/* Placeholder for visual feedback when no images */}
            {venueImages.length === 0 && tempImages.length === 0 && !isUploading && (
              <>
                <View style={styles.placeholderImage} />
                <View style={styles.placeholderImage} />
              </>
            )}
          </ScrollView>

          {venueImages.length + tempImages.length > 0 && (
            <Text style={styles.imageCount}>
              {venueImages.length + tempImages.length} hình đã chọn
            </Text>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <PrimaryButton
            text={isSubmitting ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            onPress={handleUpdate}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
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
  submitSection: {
    marginTop: 8,
    marginBottom: 24,
  },
});