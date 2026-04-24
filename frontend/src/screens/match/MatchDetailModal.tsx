import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { useNavigation } from '@react-navigation/native';
import { matchService } from '../../services/match-service';
import Toast from 'react-native-toast-message';

interface MatchDetailModalProps {
  visible: boolean;
  match: any;
  matches?: any[];
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  visible,
  match,
  matches,
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const [memberCount, setMemberCount] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [internalSelectedMatch, setInternalSelectedMatch] = useState<any>(null);

  // Use the single match or the one selected from the list
  const activeMatch = internalSelectedMatch || match;

  const handleClose = () => {
    setInternalSelectedMatch(null);
    setMemberCount(1);
    setMessage('');
    onClose();
  };

  if (!visible) return null;

  const handleRequest = async () => {
    if (!activeMatch) return;
    try {
      setSubmitting(true);
      const res = await matchService.joinMatch(activeMatch.id, {
        member_count: memberCount,
      }, message);

      Toast.show({
        type: 'success',
        text1: 'Gửi yêu cầu thành công',
        text2: 'Vui lòng chờ chủ kèo chấp nhận.',
      });
      
      handleClose();
      // Navigate to chat room immediately
      navigation.navigate('Chat', { 
        roomId: res.chat_room_id,
        matchId: activeMatch.id,
        requestId: res.id,
        partnerName: activeMatch.host_name || 'Chủ kèo'
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: err.response?.data?.detail || 'Không thể gửi yêu cầu lúc này.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDirections = () => {
    if (!activeMatch) return;
    const { lat, lng } = activeMatch.location;
    handleClose(); 
    navigation.setParams({
      showRoute: true,
      destination: { latitude: lat, longitude: lng }
    });
    Toast.show({ type: 'info', text1: 'Đang tìm đường đi...', position: 'bottom' });
  };

  const incrementMembers = () => {
    if (activeMatch && memberCount < activeMatch.available_slots) {
      setMemberCount(prev => prev + 1);
    }
  };

  const decrementMembers = () => {
    if (memberCount > 1) {
      setMemberCount(prev => prev - 1);
    }
  };

  const renderMatchItem = (item: any) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.matchListItem}
      onPress={() => setInternalSelectedMatch(item)}
    >
      <View style={styles.matchListHeader}>
        <Text style={styles.hostName}>{item.host_name || 'Người dùng'}</Text>
        <Text style={styles.skillBadge}>{item.skill_level}</Text>
      </View>
      <View style={styles.matchListInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.infoRowText}>{item.start_time} - {item.end_time}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="currency-usd" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.infoRowText}>{item.price_per_slot?.toLocaleString()}đ</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.infoRowText}>Còn {item.available_slots} chỗ</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.GRAY_LIGHT} style={styles.listChevron} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIndicator} />
            {internalSelectedMatch ? (
               <TouchableOpacity style={styles.backBtn} onPress={() => setInternalSelectedMatch(null)}>
                 <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
               </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
             {!activeMatch && matches ? (
               <View>
                 <Text style={styles.venueName}>{matches[0].venue_name || 'Danh sách kèo'}</Text>
                 <Text style={styles.addressText}>{matches[0].venue_address}</Text>
                 <Text style={styles.listTitle}>Chọn một kèo tham gia ({matches.length})</Text>
                 <View style={styles.matchList}>
                    {matches.map(renderMatchItem)}
                 </View>
               </View>
             ) : activeMatch ? (
               <View>
                {/* VENUE INFO */}
                <Text style={styles.venueName}>{activeMatch.venue_name || 'Thông tin sân'}</Text>
                <View style={styles.addressContainer}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.addressText}>{activeMatch.venue_address || 'Địa chỉ đang cập nhật'}</Text>
                </View>

                <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                  <MaterialCommunityIcons name="directions" size={20} color={COLORS.WHITE} />
                  <Text style={styles.directionsText}>Chỉ đường</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* MATCH DETAILS */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.TEXT_SECONDARY} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Thời gian</Text>
                      <Text style={styles.infoValue}>{activeMatch.start_time} - {activeMatch.end_time}</Text>
                      <Text style={styles.infoSubText}>{activeMatch.booking_date}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="account-tie" size={20} color={COLORS.TEXT_SECONDARY} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Chủ kèo</Text>
                      <Text style={styles.infoValue}>{activeMatch.host_name || 'Người dùng'}</Text>
                      <Text style={styles.infoSubText}>Host</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="star-circle" size={20} color={COLORS.TEXT_SECONDARY} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Trình độ</Text>
                      <Text style={[styles.infoValue, { color: COLORS.PRIMARY }]}>{activeMatch.skill_level}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="currency-usd" size={20} color={COLORS.TEXT_SECONDARY} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Phí dự kiến</Text>
                      <Text style={styles.infoValue}>{activeMatch.price_per_slot?.toLocaleString()}đ</Text>
                      <Text style={styles.infoSubText}>mỗi người</Text>
                    </View>
                  </View>
                </View>

                {activeMatch.note && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>Ghi chú:</Text>
                    <Text style={styles.noteText}>{activeMatch.note}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                {/* JOIN FORM */}
                <Text style={styles.sectionTitle}>Đăng ký tham gia</Text>
                <View style={styles.slotsInfo}>
                    <Text style={styles.slotsLeft}>Còn trống {activeMatch.available_slots} chỗ</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số lượng người tham gia cùng bạn</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity 
                      style={[styles.stepperBtn, memberCount <= 1 && styles.stepperBtnDisabled]} 
                      onPress={decrementMembers}
                      disabled={memberCount <= 1}
                    >
                      <MaterialCommunityIcons name="minus" size={24} color={memberCount <= 1 ? COLORS.GRAY_MEDIUM : COLORS.TEXT_PRIMARY} />
                    </TouchableOpacity>
                    <View style={styles.stepperValue}>
                      <Text style={styles.stepperValueText}>{memberCount}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.stepperBtn, memberCount >= activeMatch.available_slots && styles.stepperBtnDisabled]} 
                      onPress={incrementMembers}
                      disabled={memberCount >= activeMatch.available_slots}
                    >
                      <MaterialCommunityIcons name="plus" size={24} color={memberCount >= activeMatch.available_slots ? COLORS.GRAY_MEDIUM : COLORS.TEXT_PRIMARY} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Lời nhắn (tùy chọn)</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Chào bạn, mình muốn tham gia kèo này..."
                    multiline
                    numberOfLines={3}
                    value={message}
                    onChangeText={setMessage}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.requestBtn, submitting && styles.requestBtnDisabled]} 
                  onPress={handleRequest}
                  disabled={submitting}
                >
                  <Text style={styles.requestBtnText}>
                    {submitting ? 'Đang gửi...' : 'Xin tham gia ngay'}
                  </Text>
                </TouchableOpacity>
               </View>
             ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 10,
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 6,
  },
  directionsText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    width: '45%',
    alignItems: 'center',
    gap: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  infoSubText: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
  },
  noteBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  slotsInfo: {
    marginBottom: 15,
  },
  slotsLeft: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperBtnDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  stepperValue: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  messageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  requestBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  requestBtnDisabled: {
    backgroundColor: COLORS.GRAY_MEDIUM,
  },
  requestBtnText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 10,
    padding: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 10,
  },
  matchList: {
    gap: 12,
    marginBottom: 20,
  },
  matchListItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  matchListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hostName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  skillBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  matchListInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoRowText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  listChevron: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
});
