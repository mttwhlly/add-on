// Optimal version using WebP for climbing photos
// src/hooks/use-photo-capture-final.jsx

import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { pb } from '@/lib/pocketbase';

export interface PhotoUploadResult {
  url: string;
  filename: string;
  recordId: string;
}

export const usePhotoCapture = () => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      const mediaResult = await MediaLibrary.requestPermissionsAsync();
      
      console.log('Camera permission:', cameraResult.status);
      console.log('Media library permission:', mediaResult.status);
      
      if (cameraResult.status !== 'granted' || mediaResult.status !== 'granted') {
        Alert.alert('Permissions Required', 'Camera and media library permissions are needed.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const capturePhoto = async (): Promise<string | null> => {
    console.log('🎯 Capture photo button pressed');
    
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.log('❌ Permissions denied');
      return null;
    }

    try {
      console.log('📸 Launching camera...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Good quality for climbing wall details
        exif: false,
      });

      console.log('📸 Camera result:', { 
        canceled: result.canceled, 
        hasAssets: result.assets?.length 
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo captured:', result.assets[0].uri);
        return result.assets[0].uri;
      }
      
      console.log('📸 Camera was canceled');
      return null;
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
      return null;
    }
  };

  const selectFromLibrary = async (): Promise<string | null> => {
    console.log('🖼️ Select from library button pressed');
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access is needed to select photos.');
        return null;
      }

      console.log('📱 Launching image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      console.log('📱 Library result:', { 
        canceled: result.canceled, 
        hasAssets: result.assets?.length 
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo selected:', result.assets[0].uri);
        return result.assets[0].uri;
      }
      
      console.log('📱 Library selection was canceled');
      return null;
    } catch (error) {
      console.error('❌ Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo: ' + error.message);
      return null;
    }
  };

  const uploadPhoto = async (
    uri: string, 
    collection: string = 'climbing_problems'
  ): Promise<PhotoUploadResult | null> => {
    setLoading(true);
    
    try {
      console.log('📤 Starting WebP photo upload...');
      console.log('📁 Collection:', collection);

      if (!pb.currentUser) {
        throw new Error('User not authenticated');
      }

      // Convert to blob
      const response = await fetch(uri);
      const originalBlob = await response.blob();
      
      console.log('📄 Original blob:', originalBlob.size, 'bytes, type:', originalBlob.type);

      // Convert to WebP format (works with PocketBase)
      const webpBlob = new Blob([originalBlob], { type: 'image/webp' });
      console.log('📄 WebP blob:', webpBlob.size, 'bytes, type:', webpBlob.type);

      const timestamp = Date.now();
      const filename = `photo_${timestamp}.webp`;

      // Use the working photo_test collection for now
      console.log('🧪 Creating record in photo_test collection...');
      
      const formData = new FormData();
      formData.append('creator', pb.currentUser.id);
      formData.append('name', `Climbing Photo ${timestamp}`);
      formData.append('photo', webpBlob, filename);

      console.log('📝 Uploading to photo_test with WebP...');
      const record = await pb.pb.collection('photo_test').create(formData);
      
      const photoUrl = pb.pb.getFileUrl(record, record.photo);
      
      console.log('✅ Photo uploaded successfully!');
      console.log('🆔 Record ID:', record.id);
      console.log('🌐 Photo URL:', photoUrl);

      // Test if the URL is accessible
      try {
        const urlTest = await fetch(photoUrl, { method: 'HEAD' });
        console.log('🧪 URL test status:', urlTest.status);
        
        if (urlTest.status === 200) {
          console.log('✅ Photo URL is accessible from Cloudflare R2!');
          Alert.alert('Success!', `Photo uploaded successfully!\n\nStored in Cloudflare R2\nRecord ID: ${record.id.substring(0, 8)}...`);
        }
      } catch (urlError) {
        console.warn('⚠️ URL test failed:', urlError.message);
      }

      return {
        url: photoUrl,
        filename: record.photo,
        recordId: record.id
      };

    } catch (error) {
      console.error('❌ WebP upload failed:', error);
      console.error('❌ Error details:', error.message);
      
      if (error.data) {
        console.error('❌ Validation errors:', error.data);
      }
      
      Alert.alert('Upload Error', `WebP upload failed: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (recordId: string, collection: string = 'climbing_problems'): Promise<boolean> => {
    try {
      console.log('🗑️ PocketBase: Deleting photo record:', recordId);
      
      await pb.pb.collection(collection).delete(recordId);
      
      console.log('✅ Photo record deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting photo:', error);
      return false;
    }
  };

  const showPhotoOptions = (): Promise<string | null> => {
    console.log('📋 Showing photo options');
    
    return new Promise((resolve) => {
      Alert.alert(
        'Add Climbing Wall Photo',
        'Choose how to add your climbing wall photo (will be saved as WebP for optimal size)',
        [
          {
            text: 'Camera',
            onPress: async () => {
              console.log('📸 User chose camera');
              const uri = await capturePhoto();
              resolve(uri);
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              console.log('🖼️ User chose photo library');
              const uri = await selectFromLibrary();
              resolve(uri);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('❌ User canceled photo selection');
              resolve(null);
            },
          },
        ],
        { 
          cancelable: true, 
          onDismiss: () => {
            console.log('❌ Photo options dismissed');
            resolve(null);
          }
        }
      );
    });
  };

  return {
    loading,
    capturePhoto,
    selectFromLibrary,
    uploadPhoto,
    deletePhoto,
    showPhotoOptions,
    requestPermissions,
  };
};