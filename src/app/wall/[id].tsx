// src/app/wall/[id].tsx
import { PhotoTagger } from '@/components/photo-tagger';
import { useWalls } from '@/hooks/use-walls';
import { useAuth } from '@/hooks/use-auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WallDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getWallById, getWallHolds, getWallRoutes, loading } = useWalls();
  const [wall, setWall] = useState<any>(null);
  const [holds, setHolds] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'photo' | 'routes'>('photo');

  useEffect(() => {
    if (id) {
      loadWallData();
    }
  }, [id]);

  const loadWallData = async () => {
    if (!id) return;

    const [wallData, holdsData, routesData] = await Promise.all([
      getWallById(id),
      getWallHolds(id),
      getWallRoutes(id),
    ]);

    setWall(wallData);
    setHolds(holdsData || []);
    setRoutes(routesData || []);
  };

  const handleHoldSelect = (hold: any) => {
    Alert.alert(
      'Hold Details',
      `${hold.description}${hold.color ? `\nColor: ${hold.color}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const renderRoute = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      onPress={() => router.push(`/route/${item.id}`)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold">{item.name}</Text>
        {item.grade && (
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-800 font-semibold text-sm">{item.grade}</Text>
          </View>
        )}
      </View>
      
      {item.description && (
        <Text className="text-gray-600 mb-2" numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <Text className="text-gray-400 text-xs">
        Created {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !wall) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text>Loading wall...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!wall) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg mb-4">Wall not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = wall.created_by_user_id === user?.id;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          
          <View className="flex-row space-x-3">
            {isOwner && (
              <TouchableOpacity onPress={() => router.push(`/create-route?wallId=${id}`)}>
                <Text className="text-green-600 font-medium">+ Route</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push(`/create-game?wallId=${id}`)}>
              <Text className="text-blue-600 font-medium">🎮 Game</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wall Info */}
        <View className="mb-4">
          <Text className="text-2xl font-bold">{wall.name}</Text>
          <Text className="text-gray-600">{wall.location}</Text>
          {wall.description && (
            <Text className="text-gray-700 mt-2">{wall.description}</Text>
          )}
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'photo' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('photo')}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'photo' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              Photo ({holds.length} holds)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'routes' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('routes')}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'routes' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              Routes ({routes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'photo' ? (
        <PhotoTagger
          imageUri={wall.photo_url}
          holds={holds.map(hold => ({
            id: hold.id,
            x: hold.x_percentage,
            y: hold.y_percentage,
            description: hold.description,
            color: hold.color,
          }))}
          onHoldsChange={() => {}} // Read-only for now
          editable={false}
          onHoldSelect={handleHoldSelect}
        />
      ) : (
        <View className="flex-1">
          {routes.length > 0 ? (
            <FlatList
              data={routes}
              renderItem={renderRoute}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-gray-500 text-lg mb-2">No routes yet</Text>
              <Text className="text-gray-400 text-center mb-6">
                {isOwner 
                  ? 'Create the first route on this wall!' 
                  : 'No routes have been created on this wall yet.'
                }
              </Text>
              {isOwner && (
                <TouchableOpacity
                  className="bg-green-600 rounded-lg px-6 py-3"
                  onPress={() => router.push(`/create-route?wallId=${id}`)}
                >
                  <Text className="text-white font-semibold">Create Route</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}