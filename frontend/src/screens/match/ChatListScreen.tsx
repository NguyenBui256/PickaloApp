import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import COLORS from '@theme/colors';
import { chatService } from '../../services/chat-service';
import { matchService } from '../../services/match-service';

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'PENDING' | 'RESPONDED'>('ALL');

  const FILTER_OPTIONS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'TODAY', label: 'Hôm nay' },
    { id: 'PENDING', label: 'Chưa phản hồi' },
    { id: 'RESPONDED', label: 'Đã phản hồi' },
  ];

  const fetchRooms = useCallback(async () => {
    try {
      const data = await chatService.getMyRooms();
      setRooms(data);
    } catch (error) {
      console.error('Fetch rooms error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const handleWithdraw = (requestId: string) => {
    Alert.alert(
      'Rút lui khỏi kèo',
      'Bạn chắc chắn muốn hủy yêu cầu tham gia kèo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Rút lui', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await matchService.cancelJoinRequest(requestId);
              Alert.alert('Thành công', 'Đã rút lui khỏi kèo.');
              fetchRooms();
            } catch (err: any) {
              Alert.alert('Lỗi', err.detail || 'Không thể rút lui lúc này.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === 'ALL') return true;
    if (filter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      return room.match_date === today;
    }
    if (filter === 'PENDING') return room.status === 'PENDING';
    if (filter === 'RESPONDED') return room.status === 'ACCEPTED' || room.status === 'REJECTED' || room.status === 'CANCELLED';
    return true;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return { label: 'Đã duyệt', color: '#10B981', icon: 'check-decagram' };
      case 'REJECTED': return { label: 'Từ chối', color: '#EF4444', icon: 'close-octagon' };
      case 'CANCELLED': return { label: 'Đã hủy', color: '#9CA3AF', icon: 'minus-circle-outline' };
      default: return { label: 'Đang chờ', color: '#F59E0B', icon: 'clock-outline' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getStatusInfo(item.status);
    
    // Format time/date safely
    const matchDate = item.match_date ? new Date(item.match_date).toLocaleDateString('vi-VN') : '---';
    const startTime = item.start_time ? item.start_time.substring(0, 5) : '--:--';

    return (
      <TouchableOpacity 
        style={styles.roomItem}
        onPress={() => navigation.navigate('Chat', { 
          roomId: item.id, 
          requestId: item.is_host ? item.match_request_id : undefined,
          initialStatus: item.status,
          venueName: item.venue_name || 'Kèo chưa xác định',
          matchTime: item.start_time ? `${startTime} - ${matchDate}` : 'Giờ chưa cập nhật',
          partnerName: item.other_party_name,
          isHost: item.is_host
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
          
          <View style={styles.matchInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="stadium-variant" size={14} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.matchText} numberOfLines={1}>{item.venue_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.matchText}>{startTime} | {matchDate}</Text>
            </View>
          </View>

          <View style={styles.roomFooter}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            
            {!item.is_host && (item.status === 'PENDING' || item.status === 'ACCEPTED') && (
              <TouchableOpacity 
                style={styles.withdrawBtn} 
                onPress={() => handleWithdraw(item.match_request_id)}
              >
                <MaterialCommunityIcons name="logout" size={14} color="#EF4444" />
                <Text style={styles.withdrawText}>Rút lui</Text>
              </TouchableOpacity>
            )}
            
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

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity 
              key={opt.id}
              style={[styles.filterChip, filter === opt.id && styles.filterChipActive]}
              onPress={() => setFilter(opt.id as any)}
            >
              <Text style={[styles.filterText, filter === opt.id && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="message-off-outline" size={64} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>
                {filter === 'ALL' ? 'Chưa có cuộc hội thoại nào.' : 'Không tìm thấy kết quả phù hợp.'}
              </Text>
              <Text style={styles.emptySubText}>
                {filter === 'ALL' ? 'Hãy đăng kèo hoặc xin tham gia kèo trên bản đồ nhé!' : 'Thử đổi bộ lọc khác xem sao.'}
              </Text>
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
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
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
    marginBottom: 2,
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
  matchInfo: {
    marginVertical: 4,
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  matchText: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
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
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  withdrawText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
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
