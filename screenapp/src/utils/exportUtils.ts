import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

/**
 * Export data to a file with specified format
 * @param data The data to export
 * @param fileName The name of the file (without extension)
 * @param fileType The file type (json, csv, txt)
 * @returns Promise<boolean> indicating success or failure
 */
export async function exportToFile(data: any, fileName: string, fileType: 'json' | 'csv' | 'txt' = 'json'): Promise<boolean> {
  try {
    // Convert data to appropriate string format based on fileType
    let content = '';
    let mimeType = '';
    
    if (fileType === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else if (fileType === 'csv' && Array.isArray(data)) {
      content = convertToCSV(data);
      mimeType = 'text/csv';
    } else if (fileType === 'txt') {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      mimeType = 'text/plain';
    } else {
      throw new Error('Unsupported file type or data format');
    }
    
    // Ensure file name has correct extension
    const fullFileName = `${fileName}.${fileType}`;
    
    // Handle platform-specific file sharing
    if (Platform.OS === 'web') {
      // For web platform, create a download link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFileName;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } else {
      // For mobile platforms, use expo-file-system and expo-sharing
      const fileUri = `${FileSystem.documentDirectory}${fullFileName}`;
      await FileSystem.writeAsStringAsync(fileUri, content);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          UTI: fileType === 'json' ? 'public.json' : 
               fileType === 'csv' ? 'public.comma-separated-values-text' : 'public.plain-text'
        });
        return true;
      } else {
        throw new Error('Sharing is not available on this platform');
      }
    }
  } catch (error) {
    console.error('Error exporting file:', error);
    return false;
  }
}

/**
 * Convert an array of objects to CSV format
 * @param objArray Array of objects to convert
 * @returns CSV string
 */
function convertToCSV(objArray: any[]): string {
  if (objArray.length === 0) {
    return '';
  }
  
  // Get headers from first object
  const headers = Object.keys(objArray[0]);
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  csvContent += objArray.map(obj => {
    return headers.map(key => {
      let cell = obj[key] === null || obj[key] === undefined ? '' : obj[key];
      // Handle commas and quotes in cell content
      cell = String(cell).replace(/"/g, '""');
      return `"${cell}"`;
    }).join(',');
  }).join('\n');
  
  return csvContent;
}

/**
 * Get chat history from AsyncStorage
 * @returns Promise with array of message objects
 */
export async function getChatHistory() {
  try {
    const storedMessages = await AsyncStorage.getItem('chat_history');
    return storedMessages ? JSON.parse(storedMessages) : [];
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return [];
  }
}

/**
 * Get reminders from AsyncStorage
 * @returns Promise with array of reminder objects
 */
export async function getReminders() {
  try {
    const storedReminders = await AsyncStorage.getItem('reminders');
    return storedReminders ? JSON.parse(storedReminders) : [];
  } catch (error) {
    console.error('Error retrieving reminders:', error);
    return [];
  }
}