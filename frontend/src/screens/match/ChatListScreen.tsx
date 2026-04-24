import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { chatService } from '../../services/chat-service';

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = async () => {
    try {
      const data = await chatService.getMyRooms();
      setRooms(data);
    } catch (error) {
      console.error('Fetch rooms error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return { label: 'Đã duyệt', color: '#10B981', icon: 'check-decagram' };
      case 'REJECTED': return { label: 'Từ chối', color: '#EF4444', icon: 'close-octagon' };
      default: return { label: 'Đang chờ', color: '#F59E0B', icon: 'clock-outline' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.roomItem}
        onPress={() => navigation.navigate('Chat', { 
          roomId: item.id, 
          requestId: item.is_host ? item.match_request_id : undefined,
          initialStatus: item.status 
        })}
      >
        <View style={styles.avatar}>
          <MaterialCommunityIcons 
            name={item.is_host ? "account-star" : "account-group"} 
            size={24} 
            color={COLORS.PRIMARY} 
          />
        </View>
        
        <View style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <Text style={styles.otherName} numberOfLines={1}>
              {item.is_host ? `Người xin: ${item.other_party_name}` : `Chủ kèo: ${item.other_party_name}`}
            </Text>
            <Text style={styles.timeText}>
               {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.roomFooter}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.lastMsg} numberOfLines={1}>Bấm để thảo luận chi tiết...</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.GRAY_LIGHT} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn ghép kèo</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-off-outline" size={64} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>Chưa có cuộc hội thoại nào.</Text>
              <Text style={styles.emptySubText}>Hãy đăng kèo hoặc xin tham gia kèo trên bản đồ nhé!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  list: {
    padding: 16,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    maxWidth: '70%',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  lastMsg: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 40,
  },
});
