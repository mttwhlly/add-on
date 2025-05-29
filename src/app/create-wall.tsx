// src/app/create-wall.jsx (updated for PocketBase)
import { PhotoTagger } from '@/components/photo-tagger';
import { usePhotoCapture } from '@/hooks/use-photo-capture';
import { useWalls } from '@/hooks/use-walls';
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
  let user, showPhotoOptions, photoLoading, createProblem, wallsLoading;
  
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

  try {
    const wallsHook = useWalls();
    createProblem = wallsHook.createProblem;
    wallsLoading = wallsHook.loading;
    console.log('🧗 Walls hook OK');
  } catch (error) {
    console.error('❌ Walls hook error:', error);
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">Walls Hook Error</Text>
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
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [wallName, setWallName] = useState('');
  const [wallLocation, setWallLocation] = useState('');
  const [wallDescription, setWallDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('🏗️ CreateWall state - Step:', step, 'Photo:', photoUri ? 'Yes' : 'No');

  const handlePhotoCapture = async () => {
    console.log('📸 Starting photo capture process...');
    try {
      const uri = await showPhotoOptions();
      if (uri) {
        console.log('✅ Photo captured, converting to blob...');
        
        // Convert URI to blob for PocketBase upload
        const response = await fetch(uri);
        const blob = await response.blob();
        
        setPhotoUri(uri);
        setPhotoBlob(blob);
        setStep('details');
        console.log('✅ Moving to details step');
      } else {
        console.log('❌ No photo captured');
      }
    } catch (error) {
      console.error('❌ Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleContinueToHolds = () => {
    if (!wallName.trim() || !wallLocation.trim()) {
      Alert.alert('Error', 'Please fill in wall name and location');
      return;
    }
    setStep('holds');
  };

  const handleSaveProblem = async () => {
    if (!user || !photoBlob) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🧗 Creating climbing problem...');
      
      const problemData = {
        name: wallName.trim(),
        location: wallLocation.trim(),
        description: wallDescription.trim() || undefined,
        difficulty: difficulty || undefined,
        wall_photo: photoBlob,
        holds: holds,
        is_public: true,
        tags: [] // Can be extended later
      };

      const problem = await createProblem(problemData);
      
      if (!problem) {
        throw new Error('Failed to create climbing problem');
      }

      console.log('✅ Problem created successfully:', problem.id);

      Alert.alert(
        'Success!', 
        'Climbing problem created successfully! Others can now try your route.',
        [
          {
            text: 'View Problem',
            onPress: () => router.push(`/problem/${problem.id}`),
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setStep('photo');
              setPhotoUri('');
              setPhotoBlob(null);
              setWallName('');
              setWallLocation('');
              setWallDescription('');
              setDifficulty('');
              setHolds([]);
            },
          },
          {
            text: 'Go Home',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creating problem:', error);
      Alert.alert('Error', error.message || 'Failed to create climbing problem');
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
          Take or select a photo of the climbing wall where you want to create a problem
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
        <Text className="text-2xl font-bold mb-6">Problem Details</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Difficulty (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., V3, 5.10a"
              value={difficulty}
              onChangeText={setDifficulty}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="Describe the climbing style, key moves, or any tips..."
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
          Tag holds to create your climbing problem. Tap on holds and mark them as start, middle, or finish holds.
        </Text>
        
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-medium text-gray-700">
            Tagged Holds: {holds.length}
          </Text>
          {holds.length > 0 && (
            <Text className="text-sm text-blue-600">
              {holds.filter(h => h.type === 'start').length} start, {' '}
              {holds.filter(h => h.type === 'middle').length} middle, {' '}
              {holds.filter(h => h.type === 'finish').length} finish
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          className={`bg-green-600 rounded-lg py-4 ${(loading || wallsLoading) ? 'opacity-50' : ''}`}
          onPress={handleSaveProblem}
          disabled={loading || wallsLoading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading || wallsLoading ? 'Creating Problem...' : 'Create Climbing Problem'}
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
          
          <Text className="text-lg font-semibold">Create Problem</Text>
          
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

export default CreateWall;