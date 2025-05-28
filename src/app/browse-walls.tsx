// src/app/browse-walls.tsx
import { useWalls } from '@/hooks/use-walls';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function BrowseWalls() {
  const { getWalls, searchWalls, loading } = useWalls();
  const [walls, setWalls] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalls();
  }, []);

  const loadWalls = async () => {
    console.log('🔄 Loading walls...');
    const data = await getWalls();
    console.log('📊 Walls loaded:', data.length, 'walls');
    data.forEach((wall, index) => {
      console.log(`Wall ${index + 1}:`, wall.name, '| Photo URL:', wall.photo_url ? 'Has photo' : 'No photo');
    });
    setWalls(data);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchWalls(query.trim());
      setWalls(results);
    } else {
      loadWalls();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await handleSearch(searchQuery);
    } else {
      await loadWalls();
    }
    setRefreshing(false);
  };

  const renderWall = ({ item }: { item: any }) => {
    console.log('🖼️ Rendering wall:', item.name, 'Photo URL:', item.photo_url);
    
    return (
      <TouchableOpacity
        className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
        onPress={() => router.push(`/wall/${item.id}`)}
      >
        {/* Wall Photo */}
        <View className="mb-3">
          {item.photo_url ? (
            <Image
              source={{ uri: item.photo_url }}
              className="w-full h-48 rounded-lg bg-gray-200"
              resizeMode="cover"
              onLoad={() => console.log('✅ Wall image loaded:', item.name)}
              onError={(error) => console.error('❌ Wall image error:', item.name, error)}
            />
          ) : (
            <View className="w-full h-48 rounded-lg bg-gray-200 justify-center items-center">
              <Text className="text-gray-500">📸</Text>
              <Text className="text-gray-500 text-sm">No photo</Text>
            </View>
          )}
        </View>

        {/* Wall Info */}
        <View className="mb-2">
          <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
          <Text className="text-gray-600 text-sm">{item.location}</Text>
        </View>

        {/* Description */}
        {item.description && (
          <Text className="text-gray-700 text-sm mb-2" numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Stats */}
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-500 text-xs">
            {item.route_count || 0} routes
          </Text>
          <Text className="text-gray-500 text-xs">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Debug Info */}
        <View className="mt-2 bg-blue-50 p-2 rounded">
          <Text className="text-blue-800 text-xs font-mono">
            Photo URL: {item.photo_url ? 'Found' : 'Missing'}
          </Text>
          {item.photo_url && (
            <Text className="text-blue-800 text-xs font-mono" numberOfLines={1}>
              {item.photo_url.substring(0, 60)}...
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Browse Walls</Text>
          <TouchableOpacity onPress={() => router.push('/create-wall')}>
            <Text className="text-blue-600 font-medium">+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Search walls by name or location..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Walls List */}
      <FlatList
        data={walls}
        renderItem={renderWall}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            {loading ? (
              <Text className="text-gray-500">Loading walls...</Text>
            ) : (
              <View className="items-center">
                <Text className="text-gray-500 text-lg mb-2">No walls found</Text>
                <Text className="text-gray-400 text-center mb-6">
                  {searchQuery ? 'Try a different search term' : 'Be the first to create a wall!'}
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 rounded-lg px-6 py-3"
                  onPress={() => router.push('/create-wall')}
                >
                  <Text className="text-white font-semibold">Create Wall</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}