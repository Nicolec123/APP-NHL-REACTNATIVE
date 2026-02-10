import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

const ICON_MAP: Record<string, string> = {
  home: '⌂',
  trophy: '🏆',
  star: '★',
  'star-outline': '☆',
  newspaper: '📰',
  images: '🖼',
  person: '👤',
  calendar: '📅',
  snow: '❄',
  'ice-cream': '🏒',
  'shield-checkmark': '🛡',
  'ice-cream': '🏒',
};

type Props = {
  name: keyof typeof ICON_MAP | string;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export const AppIcon: React.FC<Props> = ({
  name,
  size = 22,
  color = '#fff',
  style
}) => {
  const char = ICON_MAP[name] ?? '•';
  return (
    <Text
      style={[
        styles.icon,
        { fontSize: size, color },
        style
      ]}
      allowFontScaling={false}
    >
      {char}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
