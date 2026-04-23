import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { RECRUITMENT_POSTS, MY_BOOKINGS_FOR_POST } from '../../constants/mock-data';

const { width, height } = Dimensions.get('window');

export const HighlightsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState(RECRUITMENT_POSTS);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost = {
      id: `p-${Date.now()}`,
      user_name: 'Phạm Ngọc Long',
      user_avatar: 'https://i.pravatar.cc/150?u=long',
      content: newPostContent,
      venue_id: selectedBooking?.venue_id || '1',
      venue_name: selectedBooking?.venue_name || 'Sân tự chọn',
      booking_date: selectedBooking?.date || 'Chưa chọn ngày',
      booking_time: selectedBooking?.time || 'Chưa chọn giờ',
      created_at: new Date().toISOString(),
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setSelectedBooking(null);
    setModalVisible(false);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `c-${Date.now()}`,
              user_name: 'Phạm Ngọc Long',
              content: text,
              created_at: new Date().toISOString(),
              is_mine: true,
            }
          ]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(c => c.id !== commentId)
        };
      }
      return post;
    });
    setPosts(updatedPosts);
  };

  const handleReportPost = (postId: string) => {
    alert('Cảm ơn bạn! Chúng tôi đã ghi nhận báo cáo và sẽ xem xét bài viết này.');
  };

  const handleVenuePress = (venueId: string) => {
    if (venueId) {
      navigation.navigate('MapVenueDetailOverlay', { venueId, hideMap: true });
    }
  };

  const renderPost = (post: any) => (
    <View key={post.id} style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image source={{ uri: post.user_avatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{post.user_name}</Text>
          <Text style={styles.timeAgo}>Vừa xong</Text>
        </View>
        <TouchableOpacity onPress={() => handleReportPost(post.id)}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={COLORS.GRAY_MEDIUM} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Associated Venue Info */}
      <TouchableOpacity 
        style={styles.venueInfoCard}
        onPress={() => handleVenuePress(post.venue_id)}
        activeOpacity={0.8}
      >
        <View style={styles.venueIconContainer}>
          <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.venueTextContainer}>
          <Text style={styles.venueNameText}>{post.venue_name}</Text>
          <Text style={styles.venueDetailText}>{post.booking_date} • {post.booking_time}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.GRAY_MEDIUM} />
      </TouchableOpacity>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        {post.comments.map((comment: any) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentContent}>
              <Text style={styles.commentUser}>{comment.user_name}</Text>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
            {comment.is_mine && (
              <TouchableOpacity onPress={() => handleDeleteComment(post.id, comment.id)}>
                <MaterialCommunityIcons name="delete-outline" size={16} color={COLORS.ERROR} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Add Comment Input */}
      <View style={styles.commentInputRow}>
        <TextInput
          placeholder="Viết bình luận..."
          style={styles.commentInput}
          value={commentInputs[post.id] || ''}
          onChangeText={(val) => setCommentInputs({ ...commentInputs, [post.id]: val })}
        />
        <TouchableOpacity onPress={() => handleAddComment(post.id)}>
          <MaterialCommunityIcons name="send" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TUYỂN THÀNH VIÊN</Text>
        </View>

        {/* Create Post Bar */}
        <TouchableOpacity 
          style={styles.createPostBar} 
          onPress={() => setModalVisible(true)}
        >
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?u=long' }} 
            style={styles.avatarSmall} 
          />
          <View style={styles.fakeInput}>
            <Text style={styles.fakeInputText}>Bạn đang cần tuyển thành viên?</Text>
          </View>
          <MaterialCommunityIcons name="image-plus" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {posts.map(renderPost)}
        </ScrollView>
      </SafeAreaView>

      {/* Create Post Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Pressable style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tạo bài đăng mới</Text>
                <TouchableOpacity 
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim()}
                >
                  <Text style={[styles.postBtn, !newPostContent.trim() && styles.disabledText]}>Đăng</Text>
                </TouchableOpacity>
              </View>

              <ScrollView>
                <TextInput
                  placeholder="Hôm nay bạn muốn chơi ở đâu, tuyển bao nhiêu người..."
                  multiline
                  style={styles.modalInput}
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  autoFocus
                />

                <Text style={styles.sectionLabel}>Gắn sân bạn đã đặt:</Text>
                {MY_BOOKINGS_FOR_POST.map((booking) => (
                  <TouchableOpacity 
                    key={booking.id}
                    style={[
                      styles.bookingOption,
                      selectedBooking?.id === booking.id && styles.selectedBooking
                    ]}
                    onPress={() => setSelectedBooking(booking)}
                  >
                    <MaterialCommunityIcons 
                      name={selectedBooking?.id === booking.id ? "checkbox-marked-circle" : "circle-outline"} 
                      size={20} 
                      color={selectedBooking?.id === booking.id ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM} 
                    />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.bookingVenueName}>{booking.venue_name}</Text>
                      <Text style={styles.bookingTimeText}>{booking.date} • {booking.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Facebook-like light gray
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    letterSpacing: 1,
  },
  createPostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 12,
    marginVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fakeInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  fakeInputText: {
    color: COLORS.GRAY_MEDIUM,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: COLORS.WHITE,
    marginBottom: 10,
    padding: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 15,
  },
  venueInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 15,
  },
  venueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7F5ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  venueNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  venueDetailText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 2,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  disabledText: {
    color: COLORS.GRAY_LIGHT,
  },
  modalInput: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 12,
  },
  bookingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedBooking: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#E7F5ED',
  },
  bookingVenueName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  bookingTimeText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
});
