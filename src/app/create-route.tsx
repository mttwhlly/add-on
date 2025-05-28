// src/app/create-route.tsx
import { PhotoTagger } from '@/components/photo-tagger';
import { useWalls } from '@/hooks/use-walls';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

interface RouteHold {
  id: string;
  x: number;
  y: number;
  description: string;
  color?: string;
  type?: 'start' | 'middle' | 'finish';
}

export default function CreateRoute() {
  const { wallId } = useLocalSearchParams<{ wallId?: string }>();
  const { getWallById, getWallHolds, createRoute, loading } = useWalls();
  
  const [wall, setWall] = useState<any>(null);
  const [allHolds, setAllHolds] = useState<any[]>([]);
  const [selectedHolds, setSelectedHolds] = useState<RouteHold[]>([]);
  const [routeName, setRouteName] = useState('');
  const [routeGrade, setRouteGrade] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [step, setStep] = useState<'details' | 'holds'>('details');

  useEffect(() => {
    if (wallId) {
      loadWallData();
    }
  }, [wallId]);

  const loadWallData = async () => {
    if (!wallId) return;

    const [wallData, holdsData] = await Promise.all([
      getWallById(wallId),
      getWallHolds(wallId),
    ]);

    setWall(wallData);
    setAllHolds(holdsData || []);
  };

  const handleHoldSelect = (hold: any) => {
    const routeHold: RouteHold = {
      id: hold.id,
      x: hold.x_percentage,
      y: hold.y_percentage,
      description: hold.description,
      color: hold.color,
      type: selectedHolds.length === 0 ? 'start' : 'middle',
    };

    // Check if hold is already selected
    const existingIndex = selectedHolds.findIndex(h => h.id === hold.id);
    
    if (existingIndex >= 0) {
      // Remove hold
      setSelectedHolds(prev => prev.filter(h => h.id !== hold.id));
    } else {
      // Add hold
      setSelectedHolds(prev => [...prev, routeHold]);
    }
  };

  const markAsFinish = (holdId: string) => {
    setSelectedHolds(prev => 
      prev.map(hold => ({
        ...hold,
        type: hold.id === holdId ? 'finish' : (hold.type === 'finish' ? 'middle' : hold.type),
      }))
    );
  };

  const handleCreateRoute = async () => {
    if (!wallId || !routeName.trim()) {
      Alert.alert('Error', 'Please fill in the route name');
      return;
    }

    if (selectedHolds.length < 2) {
      Alert.alert('Error', 'Please select at least 2 holds for the route');
      return;
    }

    // Ensure we have a finish hold
    const hasFinish = selectedHolds.some(h => h.type === 'finish');
    if (!hasFinish && selectedHolds.length > 0) {
      // Auto-mark the last selected hold as finish
      setSelectedHolds(prev => {
        const updated = [...prev];
        updated[updated.length - 1].type = 'finish';
        return updated;
      });
    }

    const routeData = {
      wall_id: wallId,
      name: routeName.trim(),
      grade: routeGrade.trim() || undefined,
      description: routeDescription.trim() || undefined,
      hold_sequence: selectedHolds.map(hold => ({
        hold_id: hold.id,
        hold_role: hold.type || 'middle',
      })),
    };

    const route = await createRoute(routeData);
    
    if (route) {
      Alert.alert(
        'Success!',
        'Route created successfully',
        [
          {
            text: 'View Route',
            onPress: () => router.push(`/route/${route.id}`),
          },
          {
            text: 'View Wall',
            onPress: () => router.push(`/wall/${wallId}`),
          },
        ]
      );
    }
  };

  const renderDetailsStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold mb-6">Route Details</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Route Name *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., Crimpy Corner, Overhang Challenge"
              value={routeName}
              onChangeText={setRouteName}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Grade (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="e.g., V2, 5.10a, Font 6A"
              value={routeGrade}
              onChangeText={setRouteGrade}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              placeholder="Describe the style, difficulty, or key moves..."
              value={routeDescription}
              onChangeText={setRouteDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 ${
            !routeName.trim() ? 'opacity-50' : ''
          }`}
          onPress={() => setStep('holds')}
          disabled={!routeName.trim()}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Continue to Select Holds
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderHoldsStep = () => {
    if (!wall) return null;

    // Convert holds for PhotoTagger
    const displayHolds = allHolds.map(hold => ({
      id: hold.id,
      x: hold.x_percentage,
      y: hold.y_percentage,
      description: hold.description,
      color: hold.color,
      type: selectedHolds.find(s => s.id === hold.id)?.type,
    }));

    return (
      <View className="flex-1">
        <PhotoTagger
          imageUri={wall.photo_url}
          holds={displayHolds}
          onHoldsChange={() => {}} // Not used in this context
          editable={false}
          onHoldSelect={handleHoldSelect}
        />
        
        <View className="px-6 py-4 bg-white border-t border-gray-200">
          <Text className="text-sm text-gray-600 mb-3 text-center">
            Selected: {selectedHolds.length} holds • Tap holds to select/deselect
          </Text>
          
          {selectedHolds.length > 0 && (
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-2">Hold sequence:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {selectedHolds.map((hold, index) => (
                    <TouchableOpacity
                      key={hold.id}
                      className={`px-3 py-1 rounded-full border ${
                        hold.type === 'start' ? 'bg-green-100 border-green-300' :
                        hold.type === 'finish' ? 'bg-red-100 border-red-300' :
                        'bg-blue-100 border-blue-300'
                      }`}
                      onPress={() => markAsFinish(hold.id)}
                    >
                      <Text className={`text-xs font-medium ${
                        hold.type === 'start' ? 'text-green-800' :
                        hold.type === 'finish' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {index + 1}. {hold.type || 'middle'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          <TouchableOpacity
            className={`bg-green-600 rounded-lg py-4 ${
              (loading || selectedHolds.length < 2) ? 'opacity-50' : ''
            }`}
            onPress={handleCreateRoute}
            disabled={loading || selectedHolds.length < 2}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Creating Route...' : 'Create Route'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!wall && wallId) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text>Loading wall...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => step === 'holds' ? setStep('details') : router.back()}
          >
            <Text className="text-blue-600 font-medium text-lg">
              ← {step === 'holds' ? 'Back' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold">Create Route</Text>
          
          {/* Step indicator */}
          <View className="flex-row space-x-2">
            <View className={`w-2 h-2 rounded-full ${
              step === 'details' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <View className={`w-2 h-2 rounded-full ${
              step === 'holds' ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          </View>
        </View>
        
        {wall && (
          <Text className="text-sm text-gray-600 mt-2">
            On: {wall.name}
          </Text>
        )}
      </View>

      {/* Content based on step */}
      {step === 'details' && renderDetailsStep()}
      {step === 'holds' && renderHoldsStep()}
    </SafeAreaView>
  );
}