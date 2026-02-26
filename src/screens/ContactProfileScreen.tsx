import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as db from '../services/db';
import { Device } from '../types/models';

type ContactProfileRouteProp = RouteProp<RootStackParamList, 'ContactProfile'>;
type ContactProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ContactProfile'
>;

const ContactProfileScreen = () => {
  const route = useRoute<ContactProfileRouteProp>();
  const navigation = useNavigation<ContactProfileNavProp>();
  const contact = route.params.contact;

  const [showZoom, setShowZoom] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const device = await db.getDevice(contact.id);
      setDeviceInfo(device);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load device info:', error);
      setLoading(false);
    }
  };

  // Handle Block/Unblock
  const handleBlock = () => {
    Alert.alert(
      isBlocked ? 'Unblock Contact' : 'Block Contact',
      isBlocked 
        ? `Unblock ${contact.name}? You will be able to call and message them.`
        : `Block ${contact.name}? They won't be able to call or message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setIsBlocked(!isBlocked);
              // TODO: Add block/unblock to database
              Alert.alert(
                '✓ Success',
                isBlocked 
                  ? `${contact.name} has been unblocked`
                  : `${contact.name} has been blocked`
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to update block status');
            }
          },
        },
      ]
    );
  };

  // Handle Delete Chat
  const handleDeleteChat = async () => {
    Alert.alert(
      'Delete Chat',
      `Delete chat with ${contact.name}? This will permanently delete all messages from this chat.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await db.getUser();
              if (user) {
                const conversationId = [user.deviceId, contact.id].sort().join('_');
                await db.deleteConversationMessages(conversationId);
                Alert.alert('✓ Success', `All messages with ${contact.name} have been deleted.`);
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete chat');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Handle Report
  const handleReport = () => {
    Alert.alert(
      'Report Contact',
      `Report ${contact.name} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement reporting mechanism
            Alert.alert('✓ Reported', `${contact.name} has been reported. Thank you for keeping the community safe.`);
          },
        },
      ]
    );
  };

  // Format last seen
  const getLastSeenText = () => {
    if (!deviceInfo) return 'Unknown';
    
    const now = Date.now();
    const diff = now - deviceInfo.lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get connection type
  const getConnectionType = () => {
    if (!deviceInfo) return 'Unknown';
    
    switch (deviceInfo.transport) {
      case 'wifi': return 'WiFi Direct';
      case 'bluetooth': return 'Bluetooth';
      case 'nearby': return 'Nearby Share';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => Alert.alert('More', 'More options coming soon')}
        >
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowZoom(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarLarge}>
              {contact.avatarUri ? (
                <Image
                  source={{ uri: contact.avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {contact.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Status Indicator Dot */}
            <View style={[styles.statusDot, styles[`${contact.status}Dot`]]} />
          </TouchableOpacity>

          {/* Contact Info */}
          <Text style={styles.name}>{contact.name}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, styles[contact.status]]}>
              <View style={[styles.statusIndicator, styles[`${contact.status}Indicator`]]} />
              <Text style={styles.statusText}>{contact.status}</Text>
            </View>
          </View>

          {isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedText}>🚫 Blocked</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>ℹ️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>About</Text>
                <Text style={styles.infoValue}>Hey there! I'm using Minichat</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🕐</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Seen</Text>
                <Text style={styles.infoValue}>{getLastSeenText()}</Text>
              </View>
            </View>
          </View>

          {deviceInfo && (
            <>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>📡</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Connection</Text>
                    <Text style={styles.infoValue}>{getConnectionType()}</Text>
                  </View>
                </View>
              </View>

              {deviceInfo.signalStrength && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.iconText}>📶</Text>
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Signal Strength</Text>
                      <Text style={styles.infoValue}>{deviceInfo.signalStrength}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🆔</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Device ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {contact.id.slice(0, 20)}...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Block Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={handleBlock}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, styles.blockIconCircle]}>
                <Text style={styles.actionIcon}>{isBlocked ? '✓' : '🚫'}</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonTitle}>
                  {isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </Text>
                <Text style={styles.actionButtonSubtitle}>
                  {isBlocked 
                    ? 'Allow messages and calls'
                    : 'Stop messages and calls'
                  }
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Delete Chat Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteChat}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, styles.deleteIconCircle]}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonTitle}>Delete Chat</Text>
                <Text style={styles.actionButtonSubtitle}>
                  Clear all messages permanently
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Report Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.reportButton]}
            onPress={handleReport}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, styles.reportIconCircle]}>
                <Text style={styles.actionIcon}>⚠️</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonTitle}>Report Contact</Text>
                <Text style={styles.actionButtonSubtitle}>
                  Report spam or abuse
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Additional spacing at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Enhanced Zoom Modal */}
      <Modal
        visible={showZoom}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowZoom(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowZoom(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{contact.name}</Text>
              <TouchableOpacity onPress={() => setShowZoom(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {contact.avatarUri ? (
              <Image
                source={{ uri: contact.avatarUri }}
                style={styles.modalImage}
              />
            ) : (
              <View style={styles.modalPlaceholder}>
                <Text style={styles.modalLetter}>
                  {contact.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default ContactProfileScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },

  // Header Styles
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: { 
    color: '#075E54', 
    fontSize: 24, 
    fontWeight: '600' 
  },

  headerTitle: { 
    color: '#1A1A1A', 
    fontSize: 18, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreButtonText: {
    color: '#075E54',
    fontSize: 20,
    fontWeight: '700',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  // Avatar with Status Dot
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },

  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F7FA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
  },

  // Status Dot
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  onlineDot: { backgroundColor: '#0ABF04' },
  offlineDot: { backgroundColor: '#9E9E9E' },
  nearbyDot: { backgroundColor: '#FF9800' },

  // Name and Status
  name: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 8,
    textAlign: 'center',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },

  online: { backgroundColor: '#0ABF04' },
  onlineIndicator: { backgroundColor: '#FFFFFF' },
  
  offline: { backgroundColor: '#9E9E9E' },
  offlineIndicator: { backgroundColor: '#FFFFFF' },
  
  nearby: { backgroundColor: '#FF9800' },
  nearbyIndicator: { backgroundColor: '#FFFFFF' },

  blockedBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },

  blockedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Info Section
  infoSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 20,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  infoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Action Buttons
  actionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  blockButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },

  deleteButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },

  reportButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },

  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  blockIconCircle: {
    backgroundColor: '#FEF3C7',
  },

  deleteIconCircle: {
    backgroundColor: '#FEE2E2',
  },

  reportIconCircle: {
    backgroundColor: '#EDE9FE',
  },

  actionIcon: {
    fontSize: 22,
  },

  actionTextContainer: {
    flex: 1,
  },

  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  actionButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  modalClose: {
    fontSize: 28,
    color: '#757575',
    fontWeight: '300',
  },

  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    resizeMode: 'cover',
  },

  modalPlaceholder: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalLetter: {
    fontSize: 120,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
