import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

interface RadarOverlayProps {
  coordinate: { latitude: number, longitude: number };
  radiusInPixels: number;
}

const RadarOverlay: React.FC<RadarOverlayProps> = ({ coordinate, radiusInPixels }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  if (!radiusInPixels || radiusInPixels <= 0) return null;

  const size = radiusInPixels * 2;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents="none"
      flat={true}
      zIndex={10} // Ensure it's above the circle
      tracksViewChanges={true} // FORCE re-render for animation on Android
    >
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={[animatedStyle, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ 
            position: 'absolute', 
            bottom: radiusInPixels, 
            width: 120, // Increased width for better visibility
            height: radiusInPixels,
            alignItems: 'center',
          }}>
            {/* Wider neon fan effect */}
            <LinearGradient
              colors={['transparent', 'rgba(0, 255, 255, 0.05)', 'rgba(0, 150, 255, 0.4)']}
              style={{
                position: 'absolute',
                top: 0,
                width: 100,
                height: radiusInPixels,
                borderTopLeftRadius: 50,
                borderTopRightRadius: 50,
              }}
            />
            {/* Ultra-bright neon needle */}
            <LinearGradient
              colors={['transparent', '#00FFFF', '#007BFF']}
              style={{
                width: 4,
                height: radiusInPixels,
                borderRadius: 2,
                shadowColor: '#00FFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 10,
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Marker>
  );
};

export default RadarOverlay;
