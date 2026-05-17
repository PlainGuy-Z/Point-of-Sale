import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildReceipt, type ReceiptData } from '../utils/escpos';

export interface BluetoothDevice {
  name: string;
  address: string;
}

const STORAGE_KEY = 'selected_printer';

export const bluetoothPrinter = {
  scan: async (): Promise<BluetoothDevice[]> => {
    // Placeholder — requires react-native-thermal-receipt-printer-image
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { name: 'Thermal Printer 58mm', address: '00:11:22:33:44:55' },
          { name: 'RPP02N', address: 'AA:BB:CC:DD:EE:FF' },
          { name: 'BlueTooth Printer', address: '11:22:33:44:55:66' },
        ]);
      }, 1500);
    });
  },

  saveDevice: async (device: BluetoothDevice) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(device));
  },

  getSavedDevice: async (): Promise<BluetoothDevice | null> => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  print: async (data: ReceiptData, _deviceAddress: string): Promise<void> => {
    try {
      const escposData = buildReceipt(data);
      console.log('ESC/POS data generated, length:', escposData.length);
      // Actual BT print implementation would go here
      return Promise.resolve();
    } catch (err) {
      console.error('Print failed:', err);
      throw err;
    }
  },

  testPrint: async (deviceAddress: string): Promise<void> => {
    const testData: ReceiptData = {
      shopName: 'Test Print',
      cashierName: 'System',
      transactionId: 'TEST-123',
      createdAt: new Date(),
      orderType: 'Test',
      items: [
        { name: 'Test Item', quantity: 1, price: 1000, subtotal: 1000 }
      ],
      subtotal: 1000,
      tax: 0,
      taxRate: 0,
      grandTotal: 1000,
      paymentMethod: 'cash',
      paperSize: '58mm',
    };
    return bluetoothPrinter.print(testData, deviceAddress);
  },
};
