import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { getReportedPosts, deletePost, banUserByPost } from '../../../services/admin-service';
import type { AdminReportedPostItem } from '../../../types/api-types';

export const AdminPostManagementScreen = () => {
  const [reports, setReports] = useState<AdminReportedPostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AdminReportedPostItem | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getReportedPosts();
      setReports(data);
    } catch (error) {
      console.error('Error loading reported posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'DELETE' | 'BAN', item: AdminReportedPostItem) => {
    const title = type === 'DELETE' ? 'Xóa bài viết' : 'Khóa người dùng';
    const message = type === 'DELETE' 
      ? 'Xóa bài viết vi phạm này khỏi hệ thống?' 
      : `Khóa tài khoản "${item.author_name}" vì vi phạm nhiều lần?`;

    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: type === 'DELETE' ? 'Xóa' : 'Khóa', 
        style: 'destructive',
        onPress: async () => {
          if (type === 'DELETE') await deletePost(item.id);
          else await banUserByPost(item.author_id);
          setSelectedPost(null);
          loadReports();
        }
      }
    ]);
  };

  const renderReportItem = ({ item }: { item: AdminReportedPostItem }) => (
    <TouchableOpacity style={styles.reportCard} onPress={() => setSelectedPost(item)}>
      <View style={styles.reportHeader}>
        <Text style={styles.authorName}>{item.author_name}</Text>
        <Text style={styles.reportDate}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
      </View>
      <View style={styles.reasonBadge}>
        <MaterialCommunityIcons name="alert-outline" size={14} color="#F44336" />
        <Text style={styles.reasonText}>{item.report_reason}</Text>
      </View>
      <Text style={styles.contentSnippet} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.viewMore}>Nhấn để xem chi tiết</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Báo cáo bài đăng</Text>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadReports}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle-outline" size={64} color="#4CAF50" />
            <Text style={styles.emptyText}>Tuyệt vời! Không có báo cáo mới</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedPost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết báo cáo</Text>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Người đăng:</Text>
                  <Text style={styles.value}>{selectedPost.author_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Lý do báo cáo:</Text>
                  <Text style={[styles.value, { color: '#F44336', fontWeight: 'bold' }]}>
                    {selectedPost.report_reason}
                  </Text>
                </View>

                {selectedPost.venue_name && (
                  <View style={styles.venueContext}>
                    <MaterialCommunityIcons name="stadium" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.venueContextText}>Gắn với sân: {selectedPost.venue_name}</Text>
                  </View>
                )}
                
                <Text style={styles.label}>Nội dung bài viết:</Text>
                <View style={styles.postContentBox}>
                  <Text style={styles.postText}>{selectedPost.content}</Text>
                  {selectedPost.venue_image && (
                    <Image 
                      source={{ uri: selectedPost.venue_image }} 
                      style={styles.postImage} 
                    />
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.banButton]}
                    onPress={() => handleAction('BAN', selectedPost)}
                  >
                    <MaterialCommunityIcons name="account-cancel" size={20} color="#FFF" />
                    <Text style={styles.modalActionText}>Khóa User</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.deletePostButton]}
                    onPress={() => handleAction('DELETE', selectedPost)}
                  >
                    <MaterialCommunityIcons name="trash-can" size={20} color="#FFF" />
                    <Text style={styles.modalActionText}>Xóa Post</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.ignoreButton}
                  onPress={() => setSelectedPost(null)}
                >
                  <Text style={styles.ignoreButtonText}>Bỏ qua (Giữ lại)</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.GRAY_LIGHT,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4433615',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  contentSnippet: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    lineHeight: 20,
  },
  viewMore: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: COLORS.GRAY_MEDIUM,
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    width: 120,
  },
  value: {
    fontSize: 14,
    color: COLORS.BLACK,
    flex: 1,
  },
  postContentBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  postText: {
    fontSize: 15,
    color: COLORS.BLACK,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#F0F0F0',
  },
  venueContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '10',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  venueContextText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    marginLeft: 6,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalActionButton: {
    flex: 0.48,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banButton: {
    backgroundColor: '#F44336',
  },
  deletePostButton: {
    backgroundColor: '#607D8B',
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ignoreButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ignoreButtonText: {
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '500',
  },
});
