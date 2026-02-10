import React, { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAppStore } from '../store/useAppStore';

type Props = {
  children: ReactNode;
};

const RINK_LINE_NHL = 'rgba(56, 189, 248, 0.12)';
const RINK_LINE_OLYMPICS = 'rgba(0, 129, 200, 0.14)';

export const IceBackground: React.FC<Props> = ({ children }) => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const rinkLine = mode === 'olympics' ? RINK_LINE_OLYMPICS : RINK_LINE_NHL;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, mode === 'olympics' ? '#051218' : '#05101d', colors.surfaceAlt]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Linha central (meio da quadra) */}
      <View style={[styles.centerLine, { backgroundColor: rinkLine }]} />

      {/* Círculo central (faceoff centro) */}
      <View style={[styles.centerCircle, { borderColor: rinkLine }]} />

      {/* Círculos de faceoff – zona ofensiva (topo) */}
      <View style={[styles.faceoffCircle, styles.faceoffTopLeft, { borderColor: rinkLine }]} />
      <View style={[styles.faceoffCircle, styles.faceoffTopRight, { borderColor: rinkLine }]} />

      {/* Círculos de faceoff – zona defensiva (baixo) */}
      <View style={[styles.faceoffCircle, styles.faceoffBottomLeft, { borderColor: rinkLine }]} />
      <View style={[styles.faceoffCircle, styles.faceoffBottomRight, { borderColor: rinkLine }]} />

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
    top: '50%',
    marginTop: -0.5,
    height: 1,
  },
  centerCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
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
    top: '22%',
    marginLeft: -44,
    marginTop: -44,
  },
  faceoffTopRight: {
    left: '82%',
    top: '22%',
    marginLeft: -44,
    marginTop: -44,
  },
  faceoffBottomLeft: {
    left: '18%',
    bottom: '22%',
    marginLeft: -44,
    marginBottom: -44,
  },
  faceoffBottomRight: {
    left: '82%',
    bottom: '22%',
    marginLeft: -44,
    marginBottom: -44,
  },
});
