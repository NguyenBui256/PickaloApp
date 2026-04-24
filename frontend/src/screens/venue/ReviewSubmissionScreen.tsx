import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { createReview, updateReview, deleteReview, fetchVenueReviews } from '../../services/review-service';
import { PrimaryButton } from '../../components/PrimaryButton';

type RootStackParamList = {
  ReviewSubmission: {
    venueId: string;
    venueName: string;
    bookingId: string;
    reviewId?: string | null;
  };
};

type ReviewSubmissionRouteProp = RouteProp<RootStackParamList, 'ReviewSubmission'>;

export const ReviewSubmissionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ReviewSubmissionRouteProp>();
  const { venueId, venueName, bookingId, reviewId } = route.params;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Giả lập load dữ liệu cũ nếu là chế độ Sửa
  React.useEffect(() => {
    if (reviewId) {
      if (reviewId === 'r-mock-456') {
        setRating(5);
        setComment('Dịch vụ tuyệt vời, sân rất chuyên nghiệp!');
      } else {
        setRating(4);
        setComment('Nội dung đánh giá cũ: Sân rất tốt nhưng tôi muốn sửa lại...');
      }
    }
  }, [reviewId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (reviewId) {
        await updateReview(reviewId, { rating, comment });
        Alert.alert('Thành công', 'Đánh giá của bạn đã được cập nhật!');
      } else {
        await createReview(venueId, { rating, comment });
        Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá dịch vụ!');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thực hiện tác vụ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa đánh giá này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              if (reviewId) {
                await deleteReview(reviewId);
                Alert.alert('Thành công', 'Đánh giá đã được xóa.');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa đánh giá.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={28} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{reviewId ? 'Sửa đánh giá' : 'Viết đánh giá'}</Text>
        {reviewId ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="delete-outline" size={24} color={COLORS.ERROR} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueLabel}>{reviewId ? 'Đánh giá của bạn về' : 'Bạn nghĩ gì về'}</Text>
          <Text style={styles.venueName}>{venueName}</Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionLabel}>Đánh giá của bạn</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? COLORS.YELLOW : COLORS.GRAY_LIGHT}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Kém' : 'Rất kém'}
          </Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionLabel}>Nhận xét chi tiết (không bắt buộc)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Chia sẻ trải nghiệm của bạn tại đây..."
            placeholderTextColor={COLORS.GRAY_MEDIUM}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          text={reviewId ? "CẬP NHẬT" : "GỬI ĐÁNH GIÁ"}
          onPress={handleSubmit}
          loading={isSubmitting || isDeleting}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    padding: 24,
  },
  venueInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  venueLabel: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 4,
  },
  venueName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingHint: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  commentSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 120,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
});
