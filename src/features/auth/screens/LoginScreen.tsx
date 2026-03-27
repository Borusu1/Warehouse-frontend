import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppInput } from '@/src/components/AppInput';
import { AppScreen } from '@/src/components/AppScreen';
import { useAuth } from '@/src/providers/AuthProvider';
import { useI18n } from '@/src/providers/LocaleProvider';
import { colors, spacing } from '@/src/theme';
import { validateLoginForm } from '@/src/utils/forms';

export function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setUsernameError(null);
    setPasswordError(null);

    const validationErrors = validateLoginForm({ username, password });

    if (validationErrors.username || validationErrors.password) {
      if (validationErrors.username) {
        setUsernameError(t('validationRequired'));
      }

      if (validationErrors.password) {
        setPasswordError(t('validationRequired'));
      }

      return;
    }

    try {
      setIsSubmitting(true);
      await login(username, password);
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      scrollable={false}
      subtitle={t('loginSubtitle')}
      title={t('loginTitle')}
    >
      <AppCard>
        <View style={styles.hintBlock}>
          <Text style={styles.hintTitle}>{t('demoAccessTitle')}</Text>
          <Text style={styles.hintText}>{t('demoAccessCredentials')}</Text>
        </View>

        <AppInput
          autoCapitalize="none"
          error={usernameError ?? undefined}
          label={t('usernameLabel')}
          onChangeText={setUsername}
          placeholder={t('usernamePlaceholder')}
          value={username}
        />
        <AppInput
          error={passwordError ?? error ?? undefined}
          label={t('passwordLabel')}
          onChangeText={setPassword}
          placeholder={t('passwordPlaceholder')}
          secureTextEntry
          value={password}
        />
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? t('signingIn') : t('signIn')}
          onPress={handleSubmit}
        />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hintBlock: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    gap: spacing.xs,
    padding: spacing.md,
  },
  hintTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
