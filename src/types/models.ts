export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  receiver: string;
  body: string;
  type: 'text' | 'image' | 'voice' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
  ttl?: number;
  hops?: number;
  signature?: string;
  reaction?: string;
  imageUri?: string;
  voiceUri?: string;
  durationSec?: number;
}

export interface Device {
  deviceId: string;
  username: string;
  phoneNumber?: string;
  publicKey?: string;
  transport: 'ble' | 'wifi' | 'nearby';
  signalStrength?: number;
  lastSeen: number;
  isConnected?: boolean;
}


export interface User {
  id?: string;           // ✅ Add this (DB returns id)
  deviceId: string;
  phoneNumber?: string;
  userId: string;        // ✅ You already have this
  username?: string;     // ✅ You already have this  
  publicKey?: string;    // ✅ You already have this
  createdAt?: number;    // ✅ Add this (DB returns createdAt)
  phone?: string;        // ✅ Add this (alias for phoneNumber)
}

export interface Conversation {
  id: string;
  participantId: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
}
export interface DiscoveryEvent {
  type: 'deviceFound';
  device: Device;
}
