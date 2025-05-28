// src/hooks/use-photo-capture.tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { supabase } from '@/lib/supabase';

export interface PhotoUploadResult {
  url: string;
  path: string;
}

export const usePhotoCapture = () => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions  
      const mediaResult = await MediaLibrary.requestPermissionsAsync();
      
      console.log('Camera permission:', cameraResult.status);
      console.log('Media library permission:', mediaResult.status);
      
      if (cameraResult.status !== 'granted' || mediaResult.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are needed to capture and save photos. Please enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use the old API for now
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
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
      // Request media library permissions specifically for selecting
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library access is needed to select photos.'
        );
        return null;
      }

      console.log('📱 Launching image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use the old API for now
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
    bucket: string = 'climbing-photos',
    folder?: string
  ): Promise<PhotoUploadResult | null> => {
    setLoading(true);
    
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const filename = `${timestamp}_${randomString}.jpg`;
      const path = folder ? `${folder}/${filename}` : filename;

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log('📤 Upload complete!');
      console.log('📁 Storage path:', path);
      console.log('🌐 Public URL:', publicUrl);
      console.log('🔧 Bucket:', bucket);

      // Test if URL is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log('🧪 URL test status:', testResponse.status);
        if (testResponse.status !== 200) {
          console.warn('⚠️ URL not publicly accessible - check storage policies');
        }
      } catch (testError) {
        console.warn('⚠️ URL test failed:', testError.message);
      }

      return {
        url: publicUrl,
        path: path,
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Error', 'Failed to upload photo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (
    path: string, 
    bucket: string = 'climbing-photos'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  };

  const showPhotoOptions = (): Promise<string | null> => {
    console.log('📋 Showing photo options');
    
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'Choose how to add your climbing wall photo',
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