import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Globe, Lock, LogIn, Moon, Sun, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { toggleAppLanguage } from '../i18n';
import { authService } from '../services/authService';
import { AppButton, AppText, AppTextInput, FeedbackMessage } from '../components/ui';
import theme, { useTheme } from '../theme';

export interface LoginScreenProps {
  onAuthenticated: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const { t, i18n } = useTranslation();
  const { theme, isDark, mode, toggleTheme } = useTheme();
  const currentLang = i18n.language?.startsWith('en') ? 'EN' : 'BR';
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
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <View style={styles.topControlBar}>
        <Pressable
          style={({ pressed }) => [
            styles.iconActionBtn,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderLight,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={toggleTheme}
          accessibilityLabel={mode === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}
        >
          {mode === 'dark' ? (
            <Moon size={14} color={theme.colors.accent} />
          ) : (
            <Sun size={14} color={theme.colors.accent} />
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconActionBtn,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderLight,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => toggleAppLanguage()}
          accessibilityLabel={t('header.switchLanguage')}
        >
          <Globe size={13} color={theme.colors.accent} />
          <AppText style={[styles.langBtnText, { color: theme.colors.accent }]}>{currentLang}</AppText>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderLight,
              boxShadow: theme.colors.cardShadow,
            },
          ]}
        >
          {/* Header section with brand */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandBadge,
                {
                  backgroundColor: theme.colors.accentBg,
                  borderColor: theme.colors.borderAccent,
                },
              ]}
            >
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing['4xl'],
    paddingVertical: theme.spacing.md,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['4xl'],
    marginTop: -40,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.radii.modal,
    paddingHorizontal: theme.spacing['5xl'],
    paddingVertical: theme.spacing['6xl'],
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing['2xl'],
  },
});
