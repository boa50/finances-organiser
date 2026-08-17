import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../../types';
import { formatMoney, getCurrencyInfo, convertCurrency, DEFAULT_CURRENCY } from '../../utils/currencies';
import { categoryService } from '../../services/categoryService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { bankService } from '../../services/bankService';
import { AppCard, AppIconBadge, AppBadge, AppText, AppIconButton } from '../ui';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import theme from '../../theme';

export interface TransactionItemCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  title?: string;
  showCurrencyBadge?: boolean;
  amountToDisplay?: number;
  installmentsLabel?: string;
  dateString?: string;
  categoryName?: string;
  paymentMethodName?: string;
  bankName?: string;
}

export const TransactionItemCard: React.FC<TransactionItemCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  onDuplicate,
  title,
  showCurrencyBadge = false,
  amountToDisplay,
  installmentsLabel,
  dateString,
  categoryName,
  paymentMethodName,
  bankName,
}) => {
  const { t, i18n } = useTranslation();
  const isIncome = transaction.type === 'income';
  const currencyInfo = getCurrencyInfo(transaction.currencyId);
  const displayTitle = title ?? transaction.title;

  const date = new Date(transaction.date);
  const isValidDate = !Number.isNaN(date.getTime());
  const formattedDate = dateString ?? (isValidDate
    ? date.toLocaleDateString(i18n.language || undefined, { month: 'short', day: 'numeric' })
    : transaction.date);

  const displayAmount = amountToDisplay ?? transaction.amount;
  const currencyCode = (transaction.currencyId || DEFAULT_CURRENCY).toUpperCase();
  const needsConversion = currencyCode !== DEFAULT_CURRENCY;
  const brlAmount = needsConversion
    ? convertCurrency(displayAmount, currencyCode, DEFAULT_CURRENCY)
    : displayAmount;

  const instText = installmentsLabel ?? (
    transaction.installments && transaction.installments > 1
      ? `${transaction.installmentNumber || 1}/${transaction.installments}`
      : ''
  );

  const resolvedCategory = categoryName || (() => {
    if (!transaction.categoryId) return t('common.uncategorized');
    const cats = categoryService.getCategoriesSync();
    const found = cats.find(
      (c) => c.id === transaction.categoryId || c.name.toLowerCase() === transaction.categoryId?.toLowerCase()
    );
    return found ? found.name : transaction.categoryId;
  })();

  const pmLabel = paymentMethodName || (() => {
    if (!transaction.paymentMethodId) return undefined;
    const pms = paymentMethodService.getPaymentMethodsSync();
    const found = pms.find(
      (p) => p.id === transaction.paymentMethodId || p.name.toLowerCase() === transaction.paymentMethodId?.toLowerCase()
    );
    return found ? found.name : transaction.paymentMethodId;
  })();

  const bkLabel = bankName || (() => {
    if (!transaction.bankId) return undefined;
    const bks = bankService.getBanksSync();
    const found = bks.find(
      (b) => b.id === transaction.bankId || b.name.toLowerCase() === transaction.bankId?.toLowerCase()
    );
    return found ? found.name : transaction.bankId;
  })();

  const catLabel = resolvedCategory;

  return (
    <AppCard style={styles.txRow} padding="lg">
      <AppIconBadge
        icon={
          isIncome ? (
            <TrendingUp size={18} color={theme.colors.success} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={18} color={theme.colors.danger} strokeWidth={2.5} />
          )
        }
        variant={isIncome ? 'success' : 'danger'}
        size="md"
      />

      <View style={styles.txMainInfo}>
        <View style={styles.txTopRow}>
          <AppText style={styles.txTitle} numberOfLines={1}>
            {displayTitle}
          </AppText>
          <View style={styles.amountContainer}>
            {needsConversion && (
              <AppText style={styles.originalAmount} tabularNums>
                {`(${formatMoney(displayAmount, currencyCode)})`}
              </AppText>
            )}
            <AppText
              style={[
                styles.txAmount,
                { color: isIncome ? theme.colors.success : theme.colors.danger },
              ]}
              tabularNums
            >
              {isIncome ? '+' : '-'}
              {formatMoney(brlAmount, DEFAULT_CURRENCY)}
            </AppText>
          </View>
        </View>

        <View style={styles.txBottomRow}>
          <View style={styles.txMetaLeft}>
            <AppText style={styles.txCategory}>{catLabel}</AppText>
            {transaction.store ? (
              <>
                <AppText style={styles.dotSeparator}>•</AppText>
                <AppText style={styles.txStore}>{transaction.store}</AppText>
              </>
            ) : null}
            {pmLabel ? (
              <>
                <AppText style={styles.dotSeparator}>•</AppText>
                <AppText style={styles.txPaymentMethod}>{pmLabel}</AppText>
              </>
            ) : null}
            {bkLabel ? (
              <>
                <AppText style={styles.dotSeparator}>•</AppText>
                <AppText style={styles.txPaymentMethod}>{bkLabel}</AppText>
              </>
            ) : null}
            {instText ? (
              <>
                <AppText style={styles.dotSeparator}>•</AppText>
                <AppText style={styles.txInstallment}>{instText}</AppText>
              </>
            ) : null}
            <AppText style={styles.dotSeparator}>•</AppText>
            <AppText style={styles.txDate}>{formattedDate}</AppText>
          </View>

          <View style={styles.actionsRow}>
            {showCurrencyBadge && (
              <AppBadge
                label={`${currencyInfo.flag} ${transaction.currencyId}`}
                variant="neutral"
                size="sm"
              />
            )}

            {transaction.subscriptionId ? (
              <AppBadge
                label={t('common.subscription')}
                variant="accent"
                size="sm"
              />
            ) : (
              <>
                {onDuplicate && (
                  <AppIconButton
                    variant="duplicate"
                    onPress={() => onDuplicate(transaction)}
                    accessibilityLabel={`Duplicate ${transaction.title}`}
                  />
                )}
                <AppIconButton
                  variant="edit"
                  onPress={() => onEdit(transaction)}
                  accessibilityLabel={`Edit ${transaction.title}`}
                />
              </>
            )}

            {onDelete && (
              <AppIconButton
                variant="delete"
                onPress={() => onDelete(transaction)}
                accessibilityLabel={`Delete ${transaction.title}`}
              />
            )}

          </View>
        </View>

        {transaction.notes ? <AppText style={styles.txNotes}>{transaction.notes}</AppText> : null}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  txMainInfo: {
    flex: 1,
    gap: 3,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  txTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  originalAmount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  txAmount: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.2,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  txMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    flex: 1,
  },
  txCategory: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  txStore: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  txPaymentMethod: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  txInstallment: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  txDate: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.xs,
  },
  dotSeparator: {
    color: theme.colors.borderLight,
    fontSize: theme.fontSize.xs,
  },
  txNotes: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

