import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/theme';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Warehouse App</Text>
        <Text style={styles.title}>Expo bootstrap complete</Text>
        <Text style={styles.description}>
          Base structure is ready for auth, localization, data service and warehouse screens.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
});
