import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_HORIZONTAL_MARGIN = 16;
const BAR_WIDTH = SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2;

const ICON_MAP: { [key: string]: any } = {
  Home: require('../../assets/icons/home.png'),
  Weight: require('../../assets/icons/weight.png'),
  Reports: require('../../assets/icons/reports.png'),
  Account: require('../../assets/icons/account.png'),
};

const LABEL_MAP: { [key: string]: string } = {
  Home: 'Home',
  Weight: 'Weight',
  Reports: 'Reports',
  Account: 'Account',
};

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabCount = state.routes.length;
  const tabWidth = BAR_WIDTH / tabCount;

  const translateX = useRef(new Animated.Value(state.index * tabWidth)).current;
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      damping: 18,
      stiffness: 160,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    scaleAnims.forEach((anim, idx) => {
      if (idx === state.index) {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.18,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(anim, {
            toValue: 1.0,
            damping: 12,
            stiffness: 180,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.timing(anim, {
          toValue: 1.0,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [state.index, tabWidth]);

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.floatingWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 70 : 45} tint="light" style={styles.blurContainer}>
          <View style={styles.specularShine} />

          <Animated.View
            style={[
              styles.slidingLens,
              {
                width: tabWidth - 10,
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.lensHighlight} />
            <View style={styles.lensInnerGlow} />
          </Animated.View>

          <View style={styles.tabsRow}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const iconSource = ICON_MAP[route.name] || ICON_MAP.Home;
              const label = LABEL_MAP[route.name] || route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.75}
                  style={[styles.tabButton, { width: tabWidth }]}
                >
                  <Animated.View
                    style={[
                      styles.iconWrapper,
                      {
                        transform: [{ scale: scaleAnims[index] }],
                      },
                    ]}
                  >
                    <Image
                      source={iconSource}
                      style={[
                        styles.tabIcon,
                        {
                          tintColor: isFocused ? '#0f172a' : '#64748b',
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </Animated.View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingWrapper: {
    width: BAR_WIDTH,
    height: 70,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 16,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  slidingLens: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 5,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  lensHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
  },
  lensInnerGlow: {
    position: 'absolute',
    bottom: 2,
    left: 6,
    right: 6,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    color: '#0f172a',
    fontWeight: '700',
  },
  tabLabelUnfocused: {
    color: '#64748b',
    fontWeight: '500',
  },
});
