import React, { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAppStore } from '../store/useAppStore';

type Props = {
  children: ReactNode;
};

const RINK_LINE_NHL_DARK = 'rgba(239, 68, 68, 0.16)';
const RINK_LINE_OLYMPICS_DARK = 'rgba(239, 68, 68, 0.16)';
const RINK_LINE_NHL_LIGHT = 'rgba(220, 38, 38, 0.2)';
const RINK_LINE_OLYMPICS_LIGHT = 'rgba(220, 38, 38, 0.2)';

export const IceBackground: React.FC<Props> = ({ children }) => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const darkMode = useAppStore(state => state.darkMode);
  const animatedBackground = useAppStore(state => state.animatedBackground);
  const rinkLine =
    mode === 'olympics'
      ? darkMode
        ? RINK_LINE_OLYMPICS_DARK
        : RINK_LINE_OLYMPICS_LIGHT
      : darkMode
        ? RINK_LINE_NHL_DARK
        : RINK_LINE_NHL_LIGHT;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceAlt]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {animatedBackground && (
        <>
          <View style={[styles.centerLine, { backgroundColor: rinkLine }]} />
          <View style={[styles.centerCircle, { borderColor: rinkLine }]} />
          <View style={[styles.faceoffCircle, styles.faceoffTopLeft, { borderColor: rinkLine }]} />
          <View style={[styles.faceoffCircle, styles.faceoffTopRight, { borderColor: rinkLine }]} />
          <View style={[styles.faceoffCircle, styles.faceoffBottomLeft, { borderColor: rinkLine }]} />
          <View style={[styles.faceoffCircle, styles.faceoffBottomRight, { borderColor: rinkLine }]} />
        </>
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor definido inline no componente (useThemeColors)
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '55%',
    marginTop: -0.5,
    height: 1,
  },
  centerCircle: {
    position: 'absolute',
    left: '50%',
    top: '55%',
    width: 160,
    height: 160,
    marginLeft: -80,
    marginTop: -80,
    borderRadius: 80,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  faceoffCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  faceoffTopLeft: {
    left: '18%',
    top: '27%',
    marginLeft: -44,
    marginTop: -44,
  },
  faceoffTopRight: {
    left: '82%',
    top: '27%',
    marginLeft: -44,
    marginTop: -44,
  },
  faceoffBottomLeft: {
    left: '18%',
    bottom: '18%',
    marginLeft: -44,
    marginBottom: -44,
  },
  faceoffBottomRight: {
    left: '82%',
    bottom: '18%',
    marginLeft: -44,
    marginBottom: -44,
  },
});
