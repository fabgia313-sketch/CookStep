import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}` as keyof typeof styles],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], styles[`textSize_${size}` as keyof typeof styles]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.radius.full,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  size_sm: { paddingHorizontal: Spacing.md, height: 36 },
  size_md: { paddingHorizontal: Spacing.lg, height: 48 },
  size_lg: { paddingHorizontal: Spacing.xl, height: 56 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: Typography.fontFamily.bold },
  text_primary: { color: '#FFFFFF' },
  text_secondary: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  textSize_sm: { fontSize: Typography.size.sm },
  textSize_md: { fontSize: Typography.size.md },
  textSize_lg: { fontSize: Typography.size.lg },
});
