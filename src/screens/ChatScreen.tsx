import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Clipboard,
  Image,
  Animated,
  Keyboard,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList, Contact } from "../types/navigation";
import { Message } from "../types/models";
import * as db from "../services/db";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    height: 70,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    fontSize: 20,
    color: "#374151",
    fontWeight: "600",
  },

  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: 12,
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  nameSection: {
    flex: 1,
  },

  contactName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },

  statusText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  headerRight: {
    flexDirection: "row",
    gap: 8,
  },

  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  actionIcon: {
    fontSize: 16,
    color: "#374151",
  },

  chatArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  dateBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  msgContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
    gap: 8,
  },

  msgContainerMe: {
    justifyContent: "flex-end",
  },

  msgContainerOther: {
    justifyContent: "flex-start",
  },

  msgSelected: {
    opacity: 0.7,
  },

  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },

  myAvatar: {
    backgroundColor: "#4A90E2",
  },

  miniAvatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  myMessage: {
    backgroundColor: "#4A90E2",
    borderBottomRightRadius: 4,
  },

  otherMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#E5E7EB",
  },

  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 180,
  },

  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  voicePlayIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 2,
  },

  voiceWave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    gap: 2,
  },

  voiceBar: {
    width: 3,
    borderRadius: 2,
  },

  voiceTime: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },

  myText: {
    color: "#FFFFFF",
  },

  otherText: {
    color: "#111827",
  },

  reactionBadge: {
    position: "absolute",
    bottom: -8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  reactionEmoji: {
    fontSize: 14,
  },

  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },

  timeStamp: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  myTimeStamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  statusDots: {
    fontSize: 10,
    fontWeight: "700",
  },

  recordingBanner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
  },

  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },

  recordingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },

  stopRecording: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },

  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  attachIcon: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "400",
  },

  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingTop: 8,
    paddingBottom: 8,
  },

  emojiBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  emojiBtnIcon: {
    fontSize: 20,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },

  recordingActive: {
    backgroundColor: "#EF4444",
  },

  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  emojiDrawer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 12,
    maxHeight: 240,
  },

  emojiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  emojiTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  emojiClose: {
    fontSize: 20,
    color: "#9CA3AF",
  },

  emojiItem: {
    width: "20%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emojiChar: {
    fontSize: 28,
  },

  scrollFab: {
    position: "absolute",
    right: 20,
    bottom: 100,
  },

  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  fabText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
});
/* Types */
type ChatRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;

/* Helpers */
const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (ts: number) => {
  const today = new Date();
  const msgDate = new Date(ts);
  
  if (msgDate.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  return msgDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

const isDifferentDay = (a: number, b: number) =>
  new Date(a).toDateString() !== new Date(b).toDateString();

/* Main Component */
const ChatScreen: React.FC = () => {
  console.log("🔥 ChatScreen loaded - NEW VERSION"); 
  const navigation = useNavigation<ChatNavProp>();
  const route = useRoute<ChatRouteProp>();
  const contact: Contact = route.params?.contact;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const flatRef = useRef<FlatList<Message> | null>(null);
  const [showGoBottom, setShowGoBottom] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;

  // ✅ Helper components moved inside
  const DateSeparator: React.FC<{ timestamp: number }> = ({ timestamp }) => (
    <View style={styles.dateContainer}>
      <View style={styles.dateLine} />
      <View style={styles.dateBox}>
        <Text style={styles.dateText}>{formatDate(timestamp)}</Text>
      </View>
      <View style={styles.dateLine} />
    </View>
  );

  const StatusDots: React.FC<{ status?: Message['status'] }> = ({ status }) => {
    const getColor = () => {
      switch (status) {
        case "sending": return "#9CA3AF";
        case "sent": return "#9CA3AF";
        case "delivered": return "#60A5FA";
        case "seen": return "#10B981";
        case "failed": return "#EF4444";
        default: return "#9CA3AF";
      }
    };

    const getDots = () => {
      switch (status) {
        case "sending": return "○";
        case "sent": return "●";
        case "delivered": return "●●";
        case "seen": return "✓✓";
        case "failed": return "!";
        default: return "";
      }
    };

    return (
      <Text style={[styles.statusDots, { color: getColor() }]}>
        {getDots()}
      </Text>
    );
  };

  useEffect(() => {
    initializeChat();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      markAsRead();
    }, [contact.id])
  );

  const initializeChat = async () => {
    try {
      await db.openDatabase();
      const user = await db.getUser();
      
      if (user) {
        setCurrentUserId(user.deviceId);
      }
      
      await loadMessages();
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    }
  };

  const loadMessages = async () => {
    try {
      const conversationId = getConversationId(contact.id);
      const msgs = await db.getMessages(conversationId);
      setMessages(msgs);
      
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async () => {
    try {
      const conversationId = getConversationId(contact.id);
      await db.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getConversationId = (contactId: string) => {
    return [currentUserId, contactId].sort().join('_');
  };

  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: showGoBottom ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [showGoBottom]);

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnim.setValue(0);
    }
  }, [recording]);

  const onScroll = (ev: any) => {
    const offset = ev.nativeEvent.contentOffset.y;
    const contentHeight = ev.nativeEvent.contentSize?.height ?? 0;
    const layoutHeight = ev.nativeEvent.layoutMeasurement?.height ?? 0;
    const distanceFromBottom = contentHeight - (offset + layoutHeight);
    setShowGoBottom(distanceFromBottom > 150);
  };

  const goBottom = () => {
    flatRef.current?.scrollToEnd({ animated: true });
    setShowGoBottom(false);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const conversationId = getConversationId(contact.id);
    const newMsg: Message = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      sender: currentUserId,
      receiver: contact.id,
      body: message.trim(),
      type: 'text',
      timestamp: Date.now(),
      status: 'sending',
    };
    
    setMessages((p) => [...p, newMsg]);
    setMessage("");
    setShowEmoji(false);
    Keyboard.dismiss();
    
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await db.saveMessage(newMsg);

      setTimeout(async () => {
        await db.updateMessageStatus(newMsg.id, 'sent');
        setMessages((p) =>
          p.map((m) => (m.id === newMsg.id ? { ...m, status: 'sent' } : m))
        );
      }, 500);

      setTimeout(async () => {
        await db.updateMessageStatus(newMsg.id, 'delivered');
        setMessages((p) =>
          p.map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m))
        );
      }, 1200);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const onLongPressMessage = (m: Message) => {
    setSelectedMsg(m.id);

    const options: any[] = [];

    if (m.body) {
      options.push({
        text: "Copy Text",
        onPress: () => {
          Clipboard.setString(m.body!);
          Alert.alert("✓ Copied");
        },
      });
    }

    options.push({
      text: "React with Emoji",
      onPress: () => showReactionPicker(m.id),
    });

    if (m.sender === currentUserId) {
      options.push({
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await db.deleteMessage(m.id);
            setMessages((p) => p.filter((x) => x.id !== m.id));
            Alert.alert("✓ Deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete message");
          }
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("", "", options);
    setTimeout(() => setSelectedMsg(null), 300);
  };

  const showReactionPicker = (msgId: string) => {
    const reactions = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
    
    Alert.alert(
      "React to message",
      "Choose a reaction",
      [
        ...reactions.map((emoji) => ({
          text: emoji,
          onPress: () => addReaction(msgId, emoji),
        })),
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel" as any,
        },
      ]
    );
  };

  const addReaction = async (msgId: string, emoji: string) => {
    try {
      await db.addReactionToMessage(msgId, emoji);
      setMessages((p) =>
        p.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m))
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add reaction");
    }
  };

  const pickImage = async () => {
    try {
      const fakeImages = [
        "https://picsum.photos/400/300?random=1",
        "https://picsum.photos/400/300?random=2",
        "https://picsum.photos/400/300?random=3",
      ];
      const randomImage = fakeImages[Math.floor(Math.random() * fakeImages.length)];

      const conversationId = getConversationId(contact.id);
      const newMsg: Message = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        sender: currentUserId,
        receiver: contact.id,
        body: '',
        type: 'image',
        timestamp: Date.now(),
        imageUri: randomImage,
        status: 'sending',
      };
      
      setMessages((p) => [...p, newMsg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

      await db.saveMessage(newMsg);
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      
      const duration = Math.floor(Math.random() * 30) + 5;
      const conversationId = getConversationId(contact.id);
      const newMsg: Message = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        sender: currentUserId,
        receiver: contact.id,
        body: '',
        type: 'voice',
        timestamp: Date.now(),
        voiceUri: "voice_placeholder",
        durationSec: duration,
        status: 'sending',
      };
      
      setMessages((p) => [...p, newMsg]);
      await db.saveMessage(newMsg);
    } else {
      setRecording(true);
    }
  };

  const emojiList = [
    "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤔",
    "👍", "👏", "🙏", "💪", "🔥", "❤️", "💯", "✨", "🎉", "🚀"
  ];
  
  const addEmoji = (e: string) => {
    setMessage((m) => m + e);
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prev = messages[index - 1];
    const showDate = !prev || isDifferentDay(item.timestamp, prev.timestamp);
    const isMe = item.sender === currentUserId;
    const isSelected = selectedMsg === item.id;

    return (
      <View>
        {showDate && <DateSeparator timestamp={item.timestamp} />}

        <Animated.View
          style={[
            styles.msgContainer,
            isMe ? styles.msgContainerMe : styles.msgContainerOther,
            isSelected && styles.msgSelected,
          ]}
        >
          {!isMe && (
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>
                {contact?.name?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => item.reaction && Alert.alert("Reaction", item.reaction)}
            onLongPress={() => onLongPressMessage(item)}
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {item.imageUri && (
              <TouchableOpacity onPress={() => Alert.alert("Image", "Full screen")}>
                <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
              </TouchableOpacity>
            )}

            {item.voiceUri && (
              <View style={styles.voiceContainer}>
                <TouchableOpacity
                  style={styles.voicePlayBtn}
                  onPress={() => Alert.alert("Voice", "Play audio")}
                >
                  <Text style={styles.voicePlayIcon}>▶</Text>
                </TouchableOpacity>
                
                <View style={styles.voiceWave}>
                  {[...Array(15)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.voiceBar,
                        { 
                          height: Math.random() * 24 + 8,
                          backgroundColor: isMe ? "#4A90E2" : "#7B68EE",
                        },
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={styles.voiceTime}>{item.durationSec}s</Text>
              </View>
            )}

            {item.body && (
              <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
                {item.body}
              </Text>
            )}

            {item.reaction && (
              <View style={styles.reactionBadge}>
                <Text style={styles.reactionEmoji}>{item.reaction}</Text>
              </View>
            )}

            <View style={styles.messageFooter}>
              <Text style={[styles.timeStamp, isMe && styles.myTimeStamp]}>
                {formatTime(item.timestamp)}
              </Text>
              {isMe && <StatusDots status={item.status} />}
            </View>
          </TouchableOpacity>

          {isMe && (
            <View style={[styles.miniAvatar, styles.myAvatar]}>
              <Text style={styles.miniAvatarText}>Me</Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactInfo}
            onPress={() => navigation.navigate("ContactProfile", { contact })}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {contact?.name?.charAt(0).toUpperCase() ?? "?"}
              </Text>
              {contact?.status === "online" && <View style={styles.onlineDot} />}
            </View>
            
            <View style={styles.nameSection}>
              <Text style={styles.contactName} numberOfLines={1}>
                {contact?.name ?? "Contact"}
              </Text>
              <Text style={styles.statusText}>
                {contact?.status ?? "offline"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert("Search", "Search in chat")}
          >
            <Text style={styles.actionIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert("Options", "More options")}
          >
            <Text style={styles.actionIcon}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chatArea}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {showEmoji && (
        <View style={styles.emojiDrawer}>
          <View style={styles.emojiHeader}>
            <Text style={styles.emojiTitle}>Pick an emoji</Text>
            <TouchableOpacity onPress={() => setShowEmoji(false)}>
              <Text style={styles.emojiClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={emojiList}
            numColumns={5}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => addEmoji(item)}
                style={styles.emojiItem}
              >
                <Text style={styles.emojiChar}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {recording && (
          <Animated.View
            style={[
              styles.recordingBanner,
              {
                opacity: recordingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          >
            <View style={styles.recordingDot} />
            <Text style={styles.recordingLabel}>Recording voice message...</Text>
            <TouchableOpacity onPress={toggleRecording}>
              <Text style={styles.stopRecording}>Stop</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              onPress={() => setShowEmoji((s) => !s)}
              style={styles.emojiBtn}
            >
              <Text style={styles.emojiBtnIcon}>{showEmoji ? "⌨️" : "☺"}</Text>
            </TouchableOpacity>
          </View>

          {message.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, recording && styles.recordingActive]}
              onPress={toggleRecording}
            >
              <Text style={styles.sendIcon}>{recording ? "■" : "🎤"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <Animated.View
        pointerEvents={showGoBottom ? "auto" : "none"}
        style={[
          styles.scrollFab,
          {
            transform: [
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
              {
                scale: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
            opacity: fabAnim,
          },
        ]}
      >
        <TouchableOpacity onPress={goBottom} style={styles.fabButton}>
          <Text style={styles.fabText}>↓</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

/* ===== STYLES ===== */


export default ChatScreen;
