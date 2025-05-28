// src/app/create-wall.tsx
import { PhotoTagger } from '@/components/photo-tagger';
import { usePhotoCapture } from '@/hooks/use-photo-capture';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Hold {
  id: string;
  x: number;
  y: number;
  description: string;
  color?: string;
  type?: 'start' | 'middle' | 'finish';
}

const CreateWall: React.FC = () => {
  console.log('🏗️ CreateWall component rendering...');
  
  // Defensive hook calls with error handling
  let user, showPhotoOptions, uploadPhoto, photoLoading;
  
  try {
    const authHook = useAuth();
    user = authHook.user;
    console.log('🔐 Auth hook OK - User:', user?.email);
  } catch (error) {
    console.error('❌ Auth hook error:', error);
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">Authentication Error</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-blue-600 px-4 py-2 rounded"
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  try {
    const photoCaptureHook = usePhotoCapture();
    showPhotoOptions = photoCaptureHook.showPhotoOptions;
    uploadPhoto = photoCaptureHook.uploadPhoto;
    photoLoading = photoCaptureHook.loading;
    console.log('📸 Photo capture hook OK');
  } catch (error) {
    console.error('❌ Photo capture hook error:', error);
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">Photo Capture Error</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-blue-600 px-4 py-2 rounded"
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const [step, setStep] = useState<'photo' | 'details' | 'holds'>('photo');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [wallName, setWallName] = useState('');
  const [wallLocation, setWallLocation] = useState('');
  const [wallDescription, setWallDescription] = useState('');
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('🏗️ CreateWall state - Step:', step, 'Photo:', photoUri ? 'Yes' : 'No');

  const handlePhotoCapture = async () => {
    console.log('📸 Starting photo capture process...');
    try {
      const uri = await showPhotoOptions();
      if (uri) {
        console.log('✅ Photo captured, moving to details step');
        setPhotoUri(uri);
        setStep('details');
      } else {
        console.log('❌ No photo captured');
      }
    } catch (error) {
      console.error('❌ Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
    const handleContinueToHolds = () => {
    if (!wallName.trim() || !wallLocation.trim()) {
      Alert.alert('Error', 'Please fill in wall name and location');
      return;
    }
    setStep('holds');
  };

  const handleSaveWall = async () => {
    if (!user || !photoUri) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setLoading(true);
    
    try {
      // Upload photo first
      const photoResult = await uploadPhoto(
        photoUri, 
        'climbing-photos', 
        `walls/${user.id}`
      );
      
      if (!photoResult) {
        throw new Error('Failed to upload photo');
      }

      // Create wall record
      const { data: wall, error: wallError } = await supabase
        .from('climbing_walls')
        .insert([
          {
            created_by_user_id: user.id,
            name: wallName.trim(),
            location: wallLocation.trim(),
            description: wallDescription.trim() || null,
            photo_url: photoResult.url,
            photo_path: photoResult.path,
          },
        ])
        .select()
        .single();

      if (wallError) {
        throw wallError;
      }

      // Create holds if any
      if (holds.length > 0) {
        const holdsData = holds.map(hold => ({
          wall_id: wall.id,
          x_percentage: hold.x,
          y_percentage: hold.y,
          description: hold.description,
          color: hold.color || null,
          hold_type: hold.type || null,
        }));

        const { error: holdsError } = await supabase
          .from('wall_holds')
          .insert(holdsData);

        if (holdsError) {
          console.error('Error creating holds:', holdsError);
          // Don't fail the whole operation for holds
        }
      }

      Alert.alert(
        'Success!', 
        'Wall created successfully. You can now create routes on this wall.',
        [
          {
            text: 'Create Route',
            onPress: () => router.push(`/create-route?wallId=${wall.id}`),
          },
          {
            text: 'View Wall',
            onPress: () => router.push(`/wall/${wall.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating wall:', error);
      Alert.alert('Error', error.message || 'Failed to create wall');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoStep = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="items-center mb-8">
        <Text className="text-3xl mb-4">📸</Text>
        <Text className="text-2xl font-bold mb-2">Add Wall Photo</Text>
        <Text className="text-gray-600 text-center">
          Take or select a photo of the climbing wall where you want to create routes
        </Text>
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 px-8 w-full"
        onPress={handlePhotoCapture}
        disabled={photoLoading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {photoLoading ? 'Processing...' : 'Add Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold mb-6">Wall Details</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Name *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., Main Bouldering Wall, Cave Section"
              value={wallName}
              onChangeText={setWallName}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Location *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., Brooklyn Boulders Somerville, Red River Gorge"
              value={wallLocation}
              onChangeText={setWallLocation}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="Any additional details about this wall..."
              value={wallDescription}
              onChangeText={setWallDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 ${
            (!wallName.trim() || !wallLocation.trim()) ? 'opacity-50' : ''
          }`}
          onPress={handleContinueToHolds}
          disabled={!wallName.trim() || !wallLocation.trim()}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Continue to Tag Holds
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderHoldsStep = () => {
    if (!wall) return null;

    console.log('🏗️ Rendering holds step');
    console.log('📸 Wall photo URL:', wall.photo_url);
    console.log('🎯 Selected holds:', selectedHolds.length);

    // Convert holds for PhotoTagger
    const displayHolds = allHolds.map(hold => ({
      id: hold.id,
      x: hold.x_percentage,
      y: hold.y_percentage,
      description: hold.description,
      color: hold.color,
      type: selectedHolds.find(s => s.id === hold.id)?.type,
    }));

    console.log('📋 Display holds:', displayHolds.length);

    return (
      <View className="flex-1">
        <PhotoTagger
          imageUri={photoUri}
          holds={holds}
          onHoldsChange={setHolds}
          editable={true}
        />
        
        <View className="px-6 py-4 bg-white border-t border-gray-200">
          <Text className="text-sm text-gray-600 mb-3 text-center">
            Tag holds on the wall (optional). You can always add more later.
          </Text>
          
          <TouchableOpacity
            className={`bg-green-600 rounded-lg py-4 ${loading ? 'opacity-50' : ''}`}
            onPress={handleSaveWall}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Creating Wall...' : 'Create Wall'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold">Create Wall</Text>
          
          {/* Step indicator */}
          <View className="flex-row space-x-2">
            <View className={`w-2 h-2 rounded-full ${
              step === 'photo' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-2 h-2 rounded-full ${
              step === 'details' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-2 h-2 rounded-full ${
              step === 'holds' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          </View>
        </View>
      </View>

      {/* Content based on step */}
      {step === 'photo' && renderPhotoStep()}
      {step === 'details' && renderDetailsStep()}
      {step === 'holds' && renderHoldsStep()}
    </SafeAreaView>
  );
};


  const handleContinueToHolds = () => {
    if (!wallName.trim() || !wallLocation.trim()) {
      Alert.alert('Error', 'Please fill in wall name and location');
      return;
    }
    setStep('holds');
  };

  const handleSaveWall = async () => {
    if (!user || !photoUri) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setLoading(true);
    
    try {
      // Upload photo first
      const photoResult = await uploadPhoto(
        photoUri, 
        'climbing-photos', 
        `walls/${user.id}`
      );
      
      if (!photoResult) {
        throw new Error('Failed to upload photo');
      }

      // Create wall record
      const { data: wall, error: wallError } = await supabase
        .from('climbing_walls')
        .insert([
          {
            created_by_user_id: user.id,
            name: wallName.trim(),
            location: wallLocation.trim(),
            description: wallDescription.trim() || null,
            photo_url: photoResult.url,
            photo_path: photoResult.path,
          },
        ])
        .select()
        .single();

      if (wallError) {
        throw wallError;
      }

      // Create holds if any
      if (holds.length > 0) {
        const holdsData = holds.map(hold => ({
          wall_id: wall.id,
          x_percentage: hold.x,
          y_percentage: hold.y,
          description: hold.description,
          color: hold.color || null,
          hold_type: hold.type || null,
        }));

        const { error: holdsError } = await supabase
          .from('wall_holds')
          .insert(holdsData);

        if (holdsError) {
          console.error('Error creating holds:', holdsError);
          // Don't fail the whole operation for holds
        }
      }

      Alert.alert(
        'Success!', 
        'Wall created successfully. You can now create routes on this wall.',
        [
          {
            text: 'Create Route',
            onPress: () => router.push(`/create-route?wallId=${wall.id}`),
          },
          {
            text: 'View Wall',
            onPress: () => router.push(`/wall/${wall.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating wall:', error);
      Alert.alert('Error', error.message || 'Failed to create wall');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoStep = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="items-center mb-8">
        <Text className="text-3xl mb-4">📸</Text>
        <Text className="text-2xl font-bold mb-2">Add Wall Photo</Text>
        <Text className="text-gray-600 text-center">
          Take or select a photo of the climbing wall where you want to create routes
        </Text>
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 px-8 w-full"
        onPress={handlePhotoCapture}
        disabled={photoLoading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {photoLoading ? 'Processing...' : 'Add Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold mb-6">Wall Details</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Wall Name *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., Main Bouldering Wall, Cave Section"
              value={wallName}
              onChangeText={setWallName}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Location *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., Brooklyn Boulders Somerville, Red River Gorge"
              value={wallLocation}
              onChangeText={setWallLocation}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="Any additional details about this wall..."
              value={wallDescription}
              onChangeText={setWallDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 ${
            (!wallName.trim() || !wallLocation.trim()) ? 'opacity-50' : ''
          }`}
          onPress={handleContinueToHolds}
          disabled={!wallName.trim() || !wallLocation.trim()}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Continue to Tag Holds
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderHoldsStep = () => (
    <View className="flex-1">
      <PhotoTagger
        imageUri={photoUri}
        holds={holds}
        onHoldsChange={setHolds}
        editable={true}
      />
      
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <Text className="text-sm text-gray-600 mb-3 text-center">
          Tag holds on the wall (optional). You can always add more later.
        </Text>
        
        <TouchableOpacity
          className={`bg-green-600 rounded-lg py-4 ${loading ? 'opacity-50' : ''}`}
          onPress={handleSaveWall}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Creating Wall...' : 'Create Wall'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold">Create Wall</Text>
          
          {/* Step indicator */}
          <View className="flex-row space-x-2">
            <View className={`w-2 h-2 rounded-full ${
              step === 'photo' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-2 h-2 rounded-full ${
              step === 'details' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-2 h-2 rounded-full ${
              step === 'holds' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          </View>
        </View>
      </View>

      {/* Content based on step */}
      {step === 'photo' && renderPhotoStep()}
      {step === 'details' && renderDetailsStep()}
      {step === 'holds' && renderHoldsStep()}
    </SafeAreaView>
  );
}

export default CreateWall;