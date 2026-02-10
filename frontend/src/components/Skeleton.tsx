import React from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  rounded?: boolean;
};

export const Skeleton: React.FC<Props> = ({ width = '100%', height = 16, style, rounded = false }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true })
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            width,
            height,
            borderRadius: rounded ? radius.pill : radius.md,
            opacity
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  shimmer: {
    backgroundColor: colors.surfaceAlt
  }
});

