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

  const selectDevice = useCallback(async (device: BluetoothDevice) => {
    setSelectedDevice(device);
    await bluetoothPrinter.saveDevice(device);
  }, []);

  const changePaperSize = useCallback(async (size: '58mm' | '80mm') => {
    setPaperSize(size);
    await AsyncStorage.setItem('paper_size', size);
  }, []);

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
