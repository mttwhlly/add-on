// src/app/my-walls.tsx
import { useWalls } from '@/hooks/use-walls';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MyWalls() {
  const { getUserWalls, getUserRoutes, loading } = useWalls();
  const [walls, setWalls] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'walls' | 'routes'>('walls');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [wallsData, routesData] = await Promise.all([
      getUserWalls(),
      getUserRoutes(),
    ]);
    setWalls(wallsData);
    setRoutes(routesData);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderWall = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
      onPress={() => router.push(`/wall/${item.id}`)}
    >
      {/* Wall Photo */}
      <View className="mb-3">
        <Image
          source={{ uri: item.photo_url }}
          className="w-full h-32 rounded-lg bg-gray-200"
          resizeMode="cover"
        />
      </View>

      {/* Wall Info */}
      <View className="mb-2">
        <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
        <Text className="text-gray-600 text-sm">{item.location}</Text>
      </View>

      {/* Stats */}
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-500 text-sm">
          {item.route_count || 0} routes
        </Text>
        <Text className="text-gray-500 text-xs">
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      
      <Text className="text-gray-600 text-sm mb-2">
        {item.climbing_walls?.name} - {item.climbing_walls?.location}
      </Text>
      
      {item.description && (
        <Text className="text-gray-700 mb-2" numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <Text className="text-gray-400 text-xs">
        Created {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">My Content</Text>
          <TouchableOpacity onPress={() => router.push('/create-wall')}>
            <Text className="text-blue-600 font-medium">+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'walls' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('walls')}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'walls' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              My Walls ({walls.length})
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
              My Routes ({routes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'walls' ? walls : routes}
        renderItem={activeTab === 'walls' ? renderWall : renderRoute}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            {loading ? (
              <Text className="text-gray-500">Loading...</Text>
            ) : (
              <View className="items-center">
                <Text className="text-gray-500 text-lg mb-2">
                  {activeTab === 'walls' ? 'No walls yet' : 'No routes yet'}
                </Text>
                <Text className="text-gray-400 text-center mb-6">
                  {activeTab === 'walls' 
                    ? 'Create your first climbing wall by taking a photo!'
                    : 'Create routes on your walls to share with others.'
                  }
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 rounded-lg px-6 py-3"
                  onPress={() => router.push(activeTab === 'walls' ? '/create-wall' : '/create-route')}
                >
                  <Text className="text-white font-semibold">
                    Create {activeTab === 'walls' ? 'Wall' : 'Route'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}