/**
 * Admin Content Screen - Content moderation (posts & comments).
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';
import { getAdminPosts, deletePost } from '@services/admin-service';
import type { AdminReportedPostItem } from '@types/api-types';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

interface AdminContentScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminContentScreen({ navigation }: AdminContentScreenProps): React.JSX.Element {
  const [posts, setPosts] = useState<AdminReportedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await getAdminPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = (post: AdminReportedPostItem) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài đăng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              fetchPosts();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bài đăng');
            }
          } 
        }
      ]
    );
  };

  const renderPostItem = ({ item }: { item: AdminReportedPostItem }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.author_name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.author_name}</Text>
            <Text style={styles.postDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(item)}>
          <Ionicons name="trash-outline" size={20} color="#DC3545" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      
      <View style={styles.postFooter}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{item.post_type}</Text>
        </View>
        <View style={styles.commentInfo}>
          <Ionicons name="chatbubble-outline" size={14} color="#6C757D" />
          <Text style={styles.commentCount}>{item.comments_count} bình luận</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Moderation</Text>
        <Text style={styles.subtitle}>Review and moderate user-generated content</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchPosts();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#DEE2E6" />
              <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066CC20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#0066CC',
    fontWeight: '700',
    fontSize: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
  },
  postDate: {
    fontSize: 11,
    color: '#6C757D',
  },
  deleteButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  tagBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#495057',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  commentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    fontSize: 12,
    color: '#6C757D',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#ADB5BD',
    fontSize: 16,
    marginTop: 12,
  },
});
