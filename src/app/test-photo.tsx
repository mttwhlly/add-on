// src/app/test-photo.tsx - Simple test screen for photo capture
import { usePhotoCapture } from '@/hooks/use-photo-capture';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TestPhoto() {
  const { showPhotoOptions, uploadPhoto, loading } = usePhotoCapture();
  const [photoUri, setPhotoUri] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleAddPhoto = async () => {
    console.log('🎯 Add Photo button pressed');
    
    try {
      const uri = await showPhotoOptions();
      console.log('📸 Photo URI received:', uri);
      
      if (uri) {
        setPhotoUri(uri);
        console.log('✅ Photo URI set in state');
      } else {
        console.log('❌ No photo URI received');
      }
    } catch (error) {
      console.error('❌ Error in handleAddPhoto:', error);
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoUri) {
      Alert.alert('Error', 'No photo to upload');
      return;
    }

    console.log('⬆️ Starting photo upload...');
    
    const result = await uploadPhoto(photoUri, 'climbing-problems', 'test');
    
    if (result) {
      console.log('✅ Upload successful:', result);
      setUploadResult(result);
      Alert.alert(
        'Success!', 
        'Photo uploaded successfully! The photo system is working.',
        [
          {
            text: 'Create Wall',
            onPress: () => router.push('/create-wall'),
          },
          {
            text: 'Back to Home',
            onPress: () => router.push('/'),
          },
        ]
      );
    } else {
      console.log('❌ Upload failed');
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold ml-4">Photo Test</Text>
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        <Text className="text-xl font-bold mb-6">Photo Capture Test</Text>

        {/* Add Photo Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 px-6 mb-4"
          onPress={handleAddPhoto}
        >
          <Text className="text-white text-center font-semibold text-lg">
            📸 Add Photo
          </Text>
        </TouchableOpacity>

        {/* Photo Preview */}
        {photoUri ? (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Photo Preview:
            </Text>
            <Image
              source={{ uri: photoUri }}
              className="w-full h-64 rounded-lg bg-gray-200 mb-4"
              resizeMode="cover"
            />
            
            <TouchableOpacity
              className={`bg-green-600 rounded-lg py-3 px-6 ${loading ? 'opacity-50' : ''}`}
              onPress={handleUploadPhoto}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">
                {loading ? 'Uploading...' : '⬆️ Upload to Supabase'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-gray-100 rounded-lg p-8 items-center mb-4">
            <Text className="text-gray-500 text-center">
              No photo selected yet.{'\n'}Tap "Add Photo" to get started.
            </Text>
          </View>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <View className="bg-green-50 rounded-lg p-4">
            <Text className="text-green-800 font-semibold mb-2">Upload Result:</Text>
            <Text className="text-green-700 text-sm font-mono">
              URL: {uploadResult.url}
            </Text>
            <Text className="text-green-700 text-sm font-mono mt-1">
              Path: {uploadResult.path}
            </Text>
          </View>
        )}

        {/* Debug Info */}
        <View className="mt-6 bg-blue-50 rounded-lg p-4">
          <Text className="text-blue-800 font-semibold mb-2">Debug Info:</Text>
          <Text className="text-blue-700 text-sm">
            Photo URI: {photoUri || 'None'}
          </Text>
          <Text className="text-blue-700 text-sm">
            Loading: {loading ? 'Yes' : 'No'}
          </Text>
          <Text className="text-blue-700 text-sm">
            Upload Result: {uploadResult ? 'Success' : 'None yet'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}