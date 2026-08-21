import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CurrencyInfo } from '../../types';
import { VALID_CURRENCIES } from '../../utils/currencies';
import { AppButton, AppModal, AppText, FeedbackMessage } from '../../components/ui';
import theme, { useTheme } from '../../theme';
import { Check } from 'lucide-react-native';

interface CurrencyAddModalProps {
  visible: boolean;
  onClose: () => void;
  enabledCurrencies: CurrencyInfo[];
  saving: boolean;
  errorMsg: string | null;
  onAddCurrency: (code: string) => void;
}

export const CurrencyAddModal: React.FC<CurrencyAddModalProps> = ({
  visible,
  onClose,
  enabledCurrencies,
  saving,
  errorMsg,
  onAddCurrency,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const availableOptions = VALID_CURRENCIES.filter(
    (option) => !enabledCurrencies.some((e) => e.code.toUpperCase() === option.code.toUpperCase())
  );

  const handleSave = () => {
    if (selectedCode) {
      onAddCurrency(selectedCode);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t('management.addAvailableCurrency')}
      subtitle={t('management.currencyModalSubtitle', { defaultValue: 'Select a currency to enable' })}
    >
      <View style={styles.content}>
        {errorMsg && (
          <View style={styles.errorWrapper}>
            <FeedbackMessage type="error" message={errorMsg} />
          </View>
        )}

        {availableOptions.length === 0 ? (
          <AppText style={[styles.noOptionsText, { color: theme.colors.textSecondary }]}>
            {t('management.allCurrenciesEnabled')}
          </AppText>
        ) : (
          <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsContainer}>
            {availableOptions.map((item) => {
              const isSelected = selectedCode === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setSelectedCode(item.code)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? theme.colors.accentBgStrong : theme.colors.surfaceRecessed,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.borderLight,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel={`Select currency ${item.code}`}
                >
                  <AppText style={styles.flag}>{item.flag}</AppText>
                  <View style={styles.optionDetails}>
                    <AppText style={[styles.code, { color: theme.colors.textPrimary }]}>
                      {item.code}
                    </AppText>
                    <AppText style={[styles.name, { color: theme.colors.textSecondary }]}>
                      {t(`currencies.${item.code}`, { defaultValue: item.name })}
                    </AppText>
                  </View>
                  <AppText style={[styles.symbol, { color: theme.colors.accent }]}>
                    {item.symbol}
                  </AppText>
                  {isSelected && <Check size={18} color={theme.colors.accent} />}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <View style={styles.btnWrapper}>
            <AppButton variant="ghost" onPress={onClose} title={t('common.cancel')} fullWidth={false} />
          </View>
          {availableOptions.length > 0 && (
            <View style={styles.btnWrapper}>
              <AppButton
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={!selectedCode || saving}
                title={t('management.addCurrency')}
                fullWidth={false}
              />
            </View>
          )}
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  errorWrapper: {
    marginBottom: theme.spacing.xs,
  },
  noOptionsText: {
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  flag: {
    fontSize: theme.fontSize['2xl'],
  },
  optionDetails: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  code: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  name: {
    fontSize: theme.fontSize.xs,
  },
  symbol: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    marginRight: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  btnWrapper: {
    minWidth: 110,
  },
});
