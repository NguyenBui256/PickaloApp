import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '@theme/colors';
import { chatService } from '../../services/chat-service';
import { matchService } from '../../services/match-service';
import { getMyProfile } from '../../services/auth-service';
import { APP_CONFIG } from '@constants/app-config';
import type { ChatMessageResponse, UserResponse } from '../../types/api-types';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { roomId, requestId, initialStatus } = route.params;

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(initialStatus === 'REJECTED');
  const [localStatus, setLocalStatus] = useState<string | null>(initialStatus || 'PENDING');
  
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [roomId]);

  const initChat = async () => {
    try {
      const user = await getMyProfile();
      setCurrentUser(user);

      const history = await chatService.getRoomMessages(roomId);
      setMessages(history);

      const token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        const url = chatService.getWebSocketUrl(roomId, token);
        ws.current = new WebSocket(url);

        ws.current.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.error) {
            Alert.alert('Thông báo', data.error);
            if (data.error.includes('locked')) setIsLocked(true);
            return;
          }
          setMessages((prev) => [...prev, data]);
        };

        ws.current.onerror = (e) => console.error('WS Error:', e);
      }
    } catch (error) {
      console.error('Init Chat Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current || isLocked) return;
    ws.current.send(inputText.trim());
    setInputText('');
  };

  const handleRespond = async (accept: boolean) => {
    if (!requestId) return;
    Alert.alert(
      accept ? 'Chấp nhận tham gia' : 'Từ chối tham gia',
      accept ? 'Bạn đồng ý cho người này vào sân?' : 'Bạn sẽ từ chối và khóa đoạn chat này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            try {
              await matchService.respondToRequest(requestId, accept);
              Alert.alert('Thành công', accept ? 'Đã thêm thành viên!' : 'Đã từ chối yêu cầu.');
              
              setLocalStatus(accept ? 'ACCEPTED' : 'REJECTED');
              if (!accept) setIsLocked(true);
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể xử lý.');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessageResponse }) => {
    const isMe = item.sender_id === currentUser?.id;
    if (item.is_system_message) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgWrapper, isMe ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
        {!isMe && <View style={styles.avatarPlaceholder} />}
        <View style={[styles.msgBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.theirMsgText]}>
            {item.content}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Trò chuyện ghép kèo</Text>
          <Text style={styles.headerSubTitle}>Giao lưu vui vẻ, văn minh</Text>
        </View>
        
        {requestId && localStatus === 'PENDING' && !isLocked && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => handleRespond(false)} style={styles.rejectBtn}>
              <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRespond(true)} style={styles.acceptBtn}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          <View style={styles.inputArea}>
            {isLocked ? (
              <View style={styles.lockedNote}>
                <Text style={styles.lockedText}>Đoạn chat này đã bị đóng.</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity 
                   style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
                   onPress={sendMessage}
                   disabled={!inputText.trim()}
                >
                  <MaterialCommunityIcons name="send" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerInfo: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY },
  headerSubTitle: { fontSize: 12, color: COLORS.GRAY_MEDIUM },
  headerActions: { flexDirection: 'row', gap: 12 },
  rejectBtn: { padding: 4 },
  acceptBtn: { padding: 4 },
  listContent: { padding: 16, paddingBottom: 20 },
  msgWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '80%' },
  myMsgWrapper: { alignSelf: 'flex-end' },
  theirMsgWrapper: { alignSelf: 'flex-start' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', marginRight: 8, marginTop: 'auto' },
  msgBubble: { padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: COLORS.PRIMARY, borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: COLORS.WHITE, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  msgText: { fontSize: 15, lineHeight: 20 },
  myMsgText: { color: COLORS.WHITE },
  theirMsgText: { color: COLORS.TEXT_PRIMARY },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.6 },
  systemMsg: { alignSelf: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  systemMsgText: { fontSize: 12, color: COLORS.GRAY_MEDIUM, fontStyle: 'italic' },
  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.WHITE, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  lockedNote: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  lockedText: { color: '#EF4444', fontStyle: 'italic', fontSize: 14 },
});
