import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from "../types/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const UserProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Profile state
  const [name, setName] = useState("You");
  const [about, setAbout] = useState("Hey there! I am using Minichat.");
  const phone = "+91 9999999999";

  // Edit modals
  const [editName, setEditName] = useState(false);
  const [editAbout, setEditAbout] = useState(false);

  // Temporary values for editing
  const [tempName, setTempName] = useState("");
  const [tempAbout, setTempAbout] = useState("");

  const handleEditName = () => {
    setTempName(name);
    setEditName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setName(tempName.trim());
      setEditName(false);
    }
  };

  const handleEditAbout = () => {
    setTempAbout(about);
    setEditAbout(true);
  };

  const handleSaveAbout = () => {
    if (tempAbout.trim()) {
      setAbout(tempAbout.trim());
      setEditAbout(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            // Add your logout logic here
            navigation.navigate("Login");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          {/* PROFILE PHOTO */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={require("../assets/rakesh_img.jpg")}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity>
              <Text style={styles.changePhoto}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* NAME CARD */}
          <View style={styles.infoSection}>
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>

            <TouchableOpacity
              style={styles.infoCard}
              onPress={handleEditName}
              activeOpacity={0.7}
            >
              <View style={styles.infoLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>👤</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Display Name</Text>
                  <Text style={styles.value}>{name}</Text>
                </View>
              </View>
              <View style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>

            {/* PHONE CARD */}
            <View style={styles.infoCard}>
              <View style={styles.infoLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>📱</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Phone Number</Text>
                  <Text style={styles.value}>{phone}</Text>
                </View>
              </View>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒</Text>
              </View>
            </View>

            {/* ABOUT CARD */}
            <TouchableOpacity
              style={styles.infoCard}
              onPress={handleEditAbout}
              activeOpacity={0.7}
            >
              <View style={styles.infoLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>ℹ️</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>About</Text>
                  <Text style={styles.valueMultiline} numberOfLines={2}>
                    {about}
                  </Text>
                </View>
              </View>
              <View style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.iconCircle, styles.settingsIconCircle]}>
                <Text style={styles.iconEmoji}>⚙️</Text>
              </View>
              <Text style={styles.settingsText}>Settings</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutLeft}>
              <View style={[styles.iconCircle, styles.logoutIconCircle]}>
                <Text style={styles.iconEmoji}>🚪</Text>
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* EDIT NAME MODAL */}
      <Modal 
        visible={editName} 
        transparent 
        animationType="fade"
        onRequestClose={() => setEditName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Name</Text>
                <TouchableOpacity 
                  onPress={() => setEditName(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  style={styles.modalInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  autoFocus
                  maxLength={30}
                />
                <Text style={styles.charCount}>{tempName.length}/30</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setEditName(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={handleSaveName}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT ABOUT MODAL */}
      <Modal 
        visible={editAbout} 
        transparent 
        animationType="fade"
        onRequestClose={() => setEditAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit About</Text>
                <TouchableOpacity 
                  onPress={() => setEditAbout(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={tempAbout}
                  onChangeText={setTempAbout}
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Enter your about"
                  placeholderTextColor="#999"
                  autoFocus
                  multiline
                  maxLength={139}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{tempAbout.length}/139</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setEditAbout(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={handleSaveAbout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F7FA" 
  },

  // Header
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },

  back: { 
    fontSize: 24, 
    fontWeight: "600", 
    color: "#075E54" 
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.3,
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
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 24,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#128C7E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#128C7E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  cameraIcon: {
    fontSize: 18,
  },

  changePhoto: {
    color: "#128C7E",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 16,
  },

  sectionLabel: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#757575",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Info Cards
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  iconEmoji: {
    fontSize: 20,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#9E9E9E",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  valueMultiline: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
    lineHeight: 20,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  editIcon: { 
    fontSize: 16 
  },

  lockedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },

  lockedText: {
    fontSize: 14,
  },

  // Actions Section
  actionsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  settingsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingsIconCircle: {
    backgroundColor: "#F5F7FA",
  },

  settingsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 12,
  },

  arrowIcon: {
    fontSize: 20,
    color: "#9E9E9E",
  },

  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },

  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoutIconCircle: {
    backgroundColor: "#FFE5E5",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E53E3E",
    marginLeft: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },

  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCloseText: {
    fontSize: 20,
    color: "#757575",
    fontWeight: "300",
  },

  inputContainer: {
    marginBottom: 20,
  },

  modalInput: {
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#F9FAFB",
  },

  modalTextArea: {
    height: 100,
    paddingTop: 12,
  },

  charCount: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "right",
    marginTop: 6,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },

  modalCancel: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#757575",
    fontWeight: "700",
    fontSize: 15,
  },

  modalSave: {
    flex: 1,
    backgroundColor: "#128C7E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#128C7E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modalSaveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
