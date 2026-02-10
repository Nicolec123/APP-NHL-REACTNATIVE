import React from 'react';
import { View, StyleSheet } from 'react-native';
import { olympicsRingColors } from '../theme';

type Props = {
  size?: number;
};

/**
 * Ícone dos anéis olímpicos desenhado em código (sempre visível, sem depender de imagem).
 * Layout oficial: 3 anéis em cima (azul, preto, vermelho), 2 embaixo (amarelo, verde).
 */
export const OlympicRingsIcon: React.FC<Props> = ({ size = 20 }) => {
  const s = size;
  const ringSize = s * 0.36;
  const stroke = Math.max(1.2, s / 14);
  const overlap = s * -0.04;

  const ring = (color: string, extraStyle?: object) => (
    <View
      style={[
        styles.ring,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: stroke,
          borderColor: color,
        },
        extraStyle,
      ]}
    />
  );

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      <View style={[styles.row, { marginBottom: overlap }]}>
        {ring(olympicsRingColors.blue)}
        {ring(olympicsRingColors.black, { marginLeft: overlap })}
        {ring(olympicsRingColors.red, { marginLeft: overlap })}
      </View>
      <View style={[styles.row, { marginTop: overlap * 2 }]}>
        <View style={{ width: ringSize / 2 + overlap }} />
        {ring(olympicsRingColors.yellow)}
        {ring(olympicsRingColors.green, { marginLeft: overlap })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    backgroundColor: 'transparent',
  },
});
