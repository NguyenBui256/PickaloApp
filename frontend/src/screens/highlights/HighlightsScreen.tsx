import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import COLORS from '@theme/colors';
import { HIGHLIGHT_BANNERS } from '../../constants/mock-data';

const { width } = Dimensions.get('window');

const AnimatedCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 150, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(index * 150, withTiming(0, { duration: 600 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export const HighlightsScreen: React.FC = () => {
  const renderBanner = (banner: any, index: number) => {
    switch (banner.type) {
      case 'swin':
        return (
          <AnimatedCard key={banner.id} index={index}>
            <View style={styles.swinCard}>
              <View style={styles.swinLeft}>
                <Image source={{ uri: banner.logo }} style={styles.swinLogo} />
                <Text style={styles.swinTitle}>{banner.title}</Text>
                <Text style={styles.swinLocation}>{banner.location}</Text>
                <Text style={styles.swinPrice}>Chỉ từ {banner.price}</Text>
                <TouchableOpacity style={styles.swinBtn}>
                  <Text style={styles.swinBtnText}>ĐẶT LỊCH NGAY</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.swinRight}>
                <Image source={{ uri: banner.image }} style={styles.swinImage} />
              </View>
            </View>
          </AnimatedCard>
        );
      case 'coco':
        return (
          <AnimatedCard key={banner.id} index={index}>
            <View style={[styles.cocoCard, { backgroundColor: '#F39C12' }]}>
              <View style={styles.cocoOverlay}>
                <Text style={styles.cocoSubtitle}>{banner.subtitle}</Text>
                <Text style={styles.cocoTitle}>{banner.title}</Text>
                <Text style={styles.cocoPrice}>{banner.price}</Text>
              </View>
              <Image source={{ uri: banner.image }} style={styles.cocoImage} />
            </View>
          </AnimatedCard>
        );
      case 'university':
        return (
          <AnimatedCard key={banner.id} index={index}>
            <View style={[styles.uniCard, { backgroundColor: COLORS.PRIMARY }]}>
              <Image source={{ uri: banner.image }} style={styles.uniImage} />
              <View style={styles.uniOverlay}>
                <Text style={styles.uniTitle}>{banner.title}</Text>
                <Text style={styles.uniSubtitle}>{banner.subtitle}</Text>
              </View>
            </View>
          </AnimatedCard>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NỔI BẬT</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {HIGHLIGHT_BANNERS.map((banner, index) => renderBanner(banner, index))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  swinCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  swinLeft: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  swinLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  swinTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  swinLocation: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 4,
  },
  swinPrice: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  swinBtn: {
    backgroundColor: '#E3B129',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  swinBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.BLACK,
  },
  swinRight: {
    flex: 1,
  },
  swinImage: {
    width: '100%',
    height: '100%',
  },
  cocoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  cocoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  cocoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  cocoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cocoSubtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginBottom: 4,
  },
  cocoPrice: {
    fontSize: 18,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginTop: 8,
  },
  uniCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
  },
  uniImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  uniOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  uniTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.WHITE,
  },
  uniSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
