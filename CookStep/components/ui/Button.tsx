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
  const viewStyles: ViewStyle[] = [
    styles.base,
    variantViewStyle[variant],
    sizeStyle[size],
    (disabled || loading) ? styles.disabled : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <Pressable
      style={({ pressed }) => [...viewStyles, pressed ? styles.pressed : undefined]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, variantTextStyle[variant], textSizeStyle[size]]}>
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
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: Typography.fontFamily.bold },
});

const variantViewStyle = StyleSheet.create({
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
});

const variantTextStyle = StyleSheet.create({
  primary: { color: '#FFFFFF' },
  secondary: { color: Colors.primary },
  ghost: { color: Colors.primary },
});

const sizeStyle = StyleSheet.create({
  sm: { paddingHorizontal: Spacing.md, height: 36 },
  md: { paddingHorizontal: Spacing.lg, height: 48 },
  lg: { paddingHorizontal: Spacing.xl, height: 56 },
});

const textSizeStyle = StyleSheet.create({
  sm: { fontSize: Typography.size.sm },
  md: { fontSize: Typography.size.md },
  lg: { fontSize: Typography.size.lg },
});
