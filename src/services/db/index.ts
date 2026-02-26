import SQLite from "react-native-sqlite-storage";
import { Device, User } from '../../types/models';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

// ---------------------------------------------------
// OPEN DATABASE
// ---------------------------------------------------
export const openDatabase = async () => {
  if (db) return db;

  try {
    db = await SQLite.openDatabase({ name: "minichat.db", location: "default" });
    console.log("📁 SQLite Connected");

    // Users table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deviceId TEXT,
        username TEXT,
        phoneNumber TEXT,
        publicKey TEXT
      );
    `);
    console.log("✅ Users table ready");

    // Devices table (Phase 2)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS devices (
        deviceId TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        phoneNumber TEXT,
        publicKey TEXT,
        transport TEXT NOT NULL,
        signalStrength INTEGER DEFAULT 50,
        lastSeen INTEGER NOT NULL,
        isConnected INTEGER DEFAULT 0
      );
    `);
    console.log("✅ Devices table ready");

    // Contacts table (Phase 2)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS contacts (
        contactId TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        phoneNumber TEXT,
        publicKey TEXT NOT NULL,
        bleDeviceId TEXT,
        wifiMacAddress TEXT,
        nearbyId TEXT,
        avatarUri TEXT,
        addedAt INTEGER NOT NULL,
        lastSeen INTEGER
      );
    `);
    console.log("✅ Contacts table ready");

    return db;
  } catch (err) {
    console.log("❌ DB ERROR:", err);
    throw err;
  }
};

// ---------------------------------------------------
// USER FUNCTIONS
// ---------------------------------------------------

export const saveUser = async (user: {
  deviceId: string;
  username: string;
  phoneNumber: string;
  publicKey: string;
}) => {
  await openDatabase();

  return db!.executeSql(
    `INSERT OR REPLACE INTO users (deviceId, username, phoneNumber, publicKey)
     VALUES (?, ?, ?, ?);`,
    [user.deviceId, user.username, user.phoneNumber, user.publicKey]
  );
};

// ✅ UPDATED - Returns properly typed User
export const getUser = async (): Promise<User | null> => {
  await openDatabase();

  const result = await db!.executeSql(`SELECT * FROM users LIMIT 1;`);
  
  if (result[0].rows.length > 0) {
    const row = result[0].rows.item(0);
    
    // Map DB fields to User interface
    return {
      id: row.id?.toString() || row.deviceId,
      deviceId: row.deviceId || row.id?.toString(),
      userId: row.id?.toString() || row.deviceId,  // ✅ Map id to userId
      username: row.username,
      phoneNumber: row.phoneNumber,
      publicKey: row.publicKey,
    };
  }
  
  return null;
};

export const clearUser = async () => {
  await openDatabase();
  await db!.executeSql(`DELETE FROM users;`);
  console.log("🗑️ Local user cleared");
};

// ---------------------------------------------------
// DEVICE FUNCTIONS (Discovery)
// ---------------------------------------------------

export const getDevices = async (): Promise<Device[]> => {
  await openDatabase();

  const result = await db!.executeSql(`SELECT * FROM devices;`);
  const devices: Device[] = [];

  for (let i = 0; i < result[0].rows.length; i++) {
    const row = result[0].rows.item(i);
    devices.push({
      deviceId: row.deviceId,
      username: row.username,
      phoneNumber: row.phoneNumber,
      publicKey: row.publicKey,
      transport: row.transport,
      signalStrength: row.signalStrength,
      lastSeen: row.lastSeen,
      isConnected: row.isConnected === 1,
    });
  }

  console.log("📟 Loaded devices:", devices.length);
  return devices;
};

export const saveDevice = async (device: Device) => {
  await openDatabase();

  await db!.executeSql(
    `
      INSERT OR REPLACE INTO devices 
      (deviceId, username, phoneNumber, publicKey, transport, signalStrength, lastSeen, isConnected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      device.deviceId,
      device.username,
      device.phoneNumber || null,
      device.publicKey || null,
      device.transport,
      device.signalStrength ?? 50,
      device.lastSeen,
      device.isConnected ? 1 : 0,
    ]
  );

  console.log("✅ Device saved:", device.username);
};

export const updateDeviceStatus = async (
  deviceId: string,
  isConnected: boolean
) => {
  await openDatabase();

  await db!.executeSql(
    `
      UPDATE devices 
      SET isConnected = ?, lastSeen = ?
      WHERE deviceId = ?
    `,
    [isConnected ? 1 : 0, Date.now(), deviceId]
  );

  console.log("✅ Device status updated:", deviceId);
};

export const deleteDevice = async (deviceId: string) => {
  await openDatabase();
  await db!.executeSql(`DELETE FROM devices WHERE deviceId = ?`, [deviceId]);
  console.log("🗑️ Device deleted:", deviceId);
};

export const clearOldDevices = async () => {
  await openDatabase();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  await db!.executeSql(`DELETE FROM devices WHERE lastSeen < ?`, [oneHourAgo]);

  console.log("🗑️ Old devices cleared");
};

export const clearDevices = async () => {
  await openDatabase();
  await db!.executeSql(`DELETE FROM devices;`);
  console.log("🗑️ All devices cleared");
};

// ---------------------------------------------------
// CONTACT FUNCTIONS (Known People)
// ---------------------------------------------------

export const saveContact = async (contact: {
  contactId: string;
  username: string;
  phoneNumber?: string;
  publicKey: string;
  bleDeviceId?: string;
  wifiMacAddress?: string;
  nearbyId?: string;
  avatarUri?: string;
}) => {
  try {
    await openDatabase();

    await db!.executeSql(
      `
      INSERT OR REPLACE INTO contacts 
      (contactId, username, phoneNumber, publicKey, bleDeviceId, wifiMacAddress, nearbyId, avatarUri, addedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        contact.contactId,
        contact.username,
        contact.phoneNumber || null,
        contact.publicKey,
        contact.bleDeviceId || null,
        contact.wifiMacAddress || null,
        contact.nearbyId || null,
        contact.avatarUri || null,
        Date.now(),
      ]
    );

    console.log("✅ Contact saved:", contact.username);
  } catch (error) {
    console.error("❌ Error saving contact:", error);
    throw error;
  }
};

export const getContacts = async (): Promise<any[]> => {
  try {
    await openDatabase();

    const result = await db!.executeSql(`SELECT * FROM contacts ORDER BY username ASC;`);

    const contacts: any[] = [];

    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      contacts.push({
        id: row.contactId,
        name: row.username,
        phone: row.phoneNumber || row.contactId,
        publicKey: row.publicKey,
        bleDeviceId: row.bleDeviceId,
        wifiMacAddress: row.wifiMacAddress,
        nearbyId: row.nearbyId,
        avatarUri: row.avatarUri,
        status: 'offline', // Will be updated by discovery
        addedAt: row.addedAt,
        lastSeen: row.lastSeen,
      });
    }

    console.log("📇 Loaded contacts:", contacts.length);
    return contacts;
  } catch (error) {
    console.error("❌ Error getting contacts:", error);
    return [];
  }
};

export const getContactById = async (contactId: string) => {
  try {
    await openDatabase();

    const result = await db!.executeSql(
      `SELECT * FROM contacts WHERE contactId = ?`,
      [contactId]
    );

    if (result[0].rows.length > 0) {
      const row = result[0].rows.item(0);
      return {
        id: row.contactId,
        name: row.username,
        phone: row.phoneNumber,
        publicKey: row.publicKey,
        bleDeviceId: row.bleDeviceId,
        wifiMacAddress: row.wifiMacAddress,
        nearbyId: row.nearbyId,
        avatarUri: row.avatarUri,
        addedAt: row.addedAt,
        lastSeen: row.lastSeen,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting contact:", error);
    return null;
  }
};

export const deleteContact = async (contactId: string) => {
  try {
    await openDatabase();

    await db!.executeSql(`DELETE FROM contacts WHERE contactId = ?`, [contactId]);

    console.log("🗑️ Contact deleted:", contactId);
  } catch (error) {
    console.error("❌ Error deleting contact:", error);
    throw error;
  }
};

export const updateContactLastSeen = async (contactId: string) => {
  try {
    await openDatabase();

    await db!.executeSql(
      `UPDATE contacts SET lastSeen = ? WHERE contactId = ?`,
      [Date.now(), contactId]
    );

    console.log("✅ Contact last seen updated:", contactId);
  } catch (error) {
    console.error("❌ Error updating contact:", error);
  }
};

export const clearContacts = async () => {
  try {
    await openDatabase();
    await db!.executeSql(`DELETE FROM contacts;`);
    console.log("🗑️ All contacts cleared");
  } catch (error) {
    console.error("❌ Error clearing contacts:", error);
  }
};

// TEST ONLY - Add dummy contact
export const addDummyContact = async () => {
  await saveContact({
    contactId: 'contact_test_001',
    username: 'Test User',
    phoneNumber: '+919876543210',
    publicKey: 'key_test_123',
    bleDeviceId: 'BLE:A4:D3:52',
  });
};
