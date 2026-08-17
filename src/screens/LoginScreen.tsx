import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Lock, LogIn, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { AppButton, AppText, AppTextInput, FeedbackMessage } from '../components/ui';
import theme from '../theme';

export interface LoginScreenProps {
  onAuthenticated: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setErrorMessage(t('auth.enterPasswordError'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.login(password);
      if (result.success) {
        onAuthenticated();
      } else {
        setErrorMessage(result.message || t('auth.invalidPasswordError'));
        setPassword('');
      }
    } catch (e) {
      setErrorMessage(t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.cardContainer}>
          {/* Header section with brand */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Wallet size={28} color={theme.colors.accent} strokeWidth={2.5} />
            </View>
            <AppText style={styles.title}>{t('header.title')}</AppText>
            <AppText style={styles.subtitle}>{t('auth.subtitle')}</AppText>
          </View>

          {/* Form section */}
          <View style={styles.form}>
            <AppTextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              autoFocus
              editable={!loading}
              error={Boolean(errorMessage)}
              icon={<Lock size={18} color={theme.colors.textSecondary} />}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />

            <FeedbackMessage message={errorMessage} type="error" visible={Boolean(errorMessage)} />

            <AppButton
              title={t('auth.unlock')}
              onPress={handleLogin}
              variant="primary"
              loading={loading}
              disabled={loading || !password.trim()}
              icon={<LogIn size={18} color={theme.colors.white} />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['4xl'],
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.modal,
    paddingHorizontal: theme.spacing['5xl'],
    paddingVertical: theme.spacing['6xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    boxShadow: '0px 20px 48px rgba(0, 0, 0, 0.55)',
    elevation: 12,
    gap: theme.spacing['5xl'],
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: theme.colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    boxShadow: '0px 4px 20px rgba(56, 189, 248, 0.25)',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing['2xl'],
  },
});
