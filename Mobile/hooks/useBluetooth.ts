import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bluetoothPrinter, type BluetoothDevice } from '../services/bluetoothPrinter';

export function useBluetooth() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('58mm');

  // Load saved device + paper size on mount
  useEffect(() => {
    (async () => {
      const saved = await bluetoothPrinter.getSavedDevice();
      if (saved) setSelectedDevice(saved);
      const size = await AsyncStorage.getItem('paper_size');
      if (size === '58mm' || size === '80mm') setPaperSize(size);
    })();
  }, []);

  const scan = useCallback(async () => {
    setIsScanning(true);
    try {
      const found = await bluetoothPrinter.scan();
      setDevices(found);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const selectDevice = useCallback(async (device: BluetoothDevice): Promise<boolean> => {
    const prev = selectedDevice;
    setSelectedDevice(device);
    try {
      const ok = await bluetoothPrinter.saveDevice(device);
      if (!ok) {
        setSelectedDevice(prev ?? null);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error saving device:', err);
      setSelectedDevice(prev ?? null);
      return false;
    }
  }, [selectedDevice]);

  const changePaperSize = useCallback(async (size: '58mm' | '80mm'): Promise<boolean> => {
    const prev = paperSize;
    setPaperSize(size);
    try {
      await AsyncStorage.setItem('paper_size', size);
      return true;
    } catch (err) {
      console.error('Failed saving paper size:', err);
      setPaperSize(prev);
      return false;
    }
  }, [paperSize]);

  const testPrint = useCallback(async () => {
    if (!selectedDevice) return;
    setIsPrinting(true);
    try {
      await bluetoothPrinter.testPrint(selectedDevice.address);
    } finally {
      setIsPrinting(false);
    }
  }, [selectedDevice]);

  return {
    devices,
    selectedDevice,
    isScanning,
    isPrinting,
    paperSize,
    scan,
    selectDevice,
    changePaperSize,
    testPrint,
  };
}
