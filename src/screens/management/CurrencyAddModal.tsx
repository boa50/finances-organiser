import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CurrencyInfo } from '../../types';
import { VALID_CURRENCIES } from '../../utils/currencies';
import { AppButton, AppModal, AppText, FeedbackMessage } from '../../components/ui';
import theme from '../../theme';
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
    >
      <View style={styles.content}>
        {errorMsg && (
          <View style={styles.errorWrapper}>
            <FeedbackMessage type="error" message={errorMsg} />
          </View>
        )}

        {availableOptions.length === 0 ? (
          <AppText style={styles.noOptionsText}>
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
                    isSelected && styles.optionCardSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <AppText style={styles.flag}>{item.flag}</AppText>
                  <View style={styles.optionDetails}>
                    <AppText style={styles.code}>{item.code}</AppText>
                    <AppText style={styles.name}>
                      {t(`currencies.${item.code}`, { defaultValue: item.name })}
                    </AppText>
                  </View>
                  <AppText style={styles.symbol}>{item.symbol}</AppText>
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
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionsContainer: {
    gap: theme.spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  optionCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  flag: {
    fontSize: theme.fontSize.xl,
  },
  optionDetails: {
    flex: 1,
  },
  code: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  name: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  symbol: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginRight: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  btnWrapper: {
    minWidth: 100,
  },
});
