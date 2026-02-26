export type Contact = {
  id: string;
  name: string;
  phone: string;
  status: "online" | "offline" | "nearby";
  avatarUri?: string | null;
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  OTPVerify: undefined;
  Contacts: undefined;
  Chat: { contact: Contact };
  ContactProfile: { contact: Contact };
  UserProfile: undefined;
  Settings: undefined;
};   