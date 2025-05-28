// src/components/EnhancedPhotoTagger.tsx - For future use with draggable holds
import { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  Alert,
  PanGestureHandler,
  State,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

interface Hold {
  id: string;
  x: number;
  y: number;
  description: string;
  color?: string;
  type?: 'start' | 'middle' | 'finish';
}

interface EnhancedPhotoTaggerProps {
  imageUri: string;
  holds: Hold[];
  onHoldsChange: (holds: Hold[]) => void;
  editable?: boolean;
  onHoldSelect?: (hold: Hold) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function EnhancedPhotoTagger({ 
  imageUri, 
  holds, 
  onHoldsChange, 
  editable = false,
  onHoldSelect 
}: EnhancedPhotoTaggerProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState({ x: 0, y: 0 });
  const [holdDescription, setHoldDescription] = useState('');
  const [holdColor, setHoldColor] = useState('');
  const [selectedHoldId, setSelectedHoldId] = useState<string | null>(null);

  const updateHoldPosition = (holdId: string, newX: number, newY: number) => {
    const updatedHolds = holds.map(hold => 
      hold.id === holdId 
        ? { ...hold, x: newX, y: newY }
        : hold
    );
    onHoldsChange(updatedHolds);
  };

  const DraggableHold = ({ hold, index }: { hold: Hold; index: number }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const gestureHandler = useAnimatedGestureHandler({
      onStart: () => {
        runOnJS(setSelectedHoldId)(hold.id);
      },
      onActive: (event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      },
      onEnd: (event) => {
        const newX = Math.max(0, Math.min(100, hold.x + (event.translationX / imageSize.width) * 100));
        const newY = Math.max(0, Math.min(100, hold.y + (event.translationY / imageSize.height) * 100));
        
        runOnJS(updateHoldPosition)(hold.id, newX, newY);
        runOnJS(setSelectedHoldId)(null);
        
        translateX.value = 0;
        translateY.value = 0;
      },
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    }));

    if (!editable) {
      // Non-draggable version for viewing
      return (
        <TouchableOpacity
          key={hold.id}
          className="absolute"
          style={{
            left: `${hold.x}%`,
            top: `${hold.y}%`,
            transform: [{ translateX: -15 }, { translateY: -15 }],
          }}
          onPress={() => onHoldSelect?.(hold)}
        >
          <View className={`w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow-lg ${
            hold.color ? `bg-${hold.color}-500` : 'bg-red-500'
          }`}>
            <Text className="text-white text-xs font-bold">{index + 1}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Draggable version for editing
    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <AnimatedTouchableOpacity
          style={[
            {
              position: 'absolute',
              left: `${hold.x}%`,
              top: `${hold.y}%`,
              transform: [{ translateX: -15 }, { translateY: -15 }],
            },
            animatedStyle,
          ]}
          onLongPress={() => {
            Alert.alert(
              'Hold Options',
              hold.description,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => {
                  setHoldDescription(hold.description);
                  setHoldColor(hold.color || '');
                  setSelectedPosition({ x: hold.x, y: hold.y });
                  setShowHoldModal(true);
                }},
                { text: 'Remove', style: 'destructive', onPress: () => {
                  onHoldsChange(holds.filter(h => h.id !== hold.id));
                }},
              ]
            );
          }}
        >
          <View className={`w-8 h-8 rounded-full border-2 items-center justify-center shadow-lg ${
            selectedHoldId === hold.id 
              ? 'border-yellow-400 bg-yellow-500' 
              : 'border-white ' + (hold.color ? `bg-${hold.color}-500` : 'bg-red-500')
          }`}>
            <Text className="text-white text-xs font-bold">{index + 1}</Text>
          </View>
        </AnimatedTouchableOpacity>
      </PanGestureHandler>
    );
  };

  const handleImagePress = (event: any) => {
    if (!editable) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const xPercentage = (locationX / imageSize.width) * 100;
    const yPercentage = (locationY / imageSize.height) * 100;
    
    setSelectedPosition({ x: xPercentage, y: yPercentage });
    setShowHoldModal(true);
  };

  const addHold = () => {
    if (!holdDescription.trim()) return;
    
    const newHold: Hold = {
      id: Date.now().toString(),
      x: selectedPosition.x,
      y: selectedPosition.y,
      description: holdDescription.trim(),
      color: holdColor || undefined,
    };
    
    onHoldsChange([...holds, newHold]);
    setHoldDescription('');
    setHoldColor('');
    setShowHoldModal(false);
  };

  return (
    <View className="flex-1">
      {/* Controls */}
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-semibold">
          {editable ? 'Tap to add • Drag to move • Long press for options' : 'Route Preview'}
        </Text>
        <Text className="text-gray-600">{holds.length} holds</Text>
      </View>

      {/* Photo with holds */}
      <View className="flex-1 bg-gray-100">
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleImagePress}
          className="flex-1"
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setImageSize({ width, height });
            }}
          />
          
          {/* Render holds */}
          {holds.map((hold, index) => (
            <DraggableHold key={hold.id} hold={hold} index={index} />
          ))}
        </TouchableOpacity>
      </View>

      {/* Hold editing modal */}
      <Modal visible={showHoldModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowHoldModal(false)}>
              <Text className="text-blue-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Hold Details</Text>
            <TouchableOpacity onPress={addHold}>
              <Text className="text-blue-600 text-lg font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          <View className="p-6">
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-4"
              placeholder="Describe this hold..."
              value={holdDescription}
              onChangeText={setHoldDescription}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View className="flex-row flex-wrap gap-2 mb-4">
              {['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'gray'].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setHoldColor(color)}
                  className={`w-10 h-10 rounded-full bg-${color}-500 border-2 ${
                    holdColor === color ? 'border-black' : 'border-gray-300'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}