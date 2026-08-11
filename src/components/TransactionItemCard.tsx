import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../types';
import { formatMoney, getCurrencyInfo } from '../utils/currencies';
import { AppCard, AppIconBadge, AppBadge, AppText } from './ui';
import { TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react-native';
import theme from '../theme';

export interface TransactionItemCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  showCurrencyBadge?: boolean;
  showTime?: boolean;
  amountToDisplay?: number;
  installmentsLabel?: string;
  dateString?: string;
}

export const TransactionItemCard: React.FC<TransactionItemCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  showCurrencyBadge = false,
  showTime = false,
  amountToDisplay,
  installmentsLabel,
  dateString,
}) => {
  const isIncome = transaction.type === 'income';
  const currencyInfo = getCurrencyInfo(transaction.currency);

  const date = new Date(transaction.date);
  const isValidDate = !Number.isNaN(date.getTime());
  const formattedDate = dateString ?? (isValidDate
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : transaction.date);
  const formattedTime = showTime && isValidDate
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const displayAmount = amountToDisplay ?? transaction.amount;
  const instText = installmentsLabel ?? (
    transaction.installments && transaction.installments > 1
      ? `${transaction.installmentNumber || 1}/${transaction.installments}`
      : ''
  );

  return (
    <AppCard style={styles.txRow} padding="lg">
      <AppIconBadge
        icon={
          isIncome ? (
            <TrendingUp size={18} color={theme.colors.success} />
          ) : (
            <TrendingDown size={18} color={theme.colors.danger} />
          )
        }
        variant={isIncome ? 'success' : 'danger'}
        size="md"
      />

      <View style={styles.txMainInfo}>
        <AppText style={styles.txTitle}>{transaction.title}</AppText>
        <View style={styles.txMetaRow}>
          <AppText style={styles.txCategory}>{transaction.category}</AppText>
          {transaction.store ? (
            <>
              <AppText style={styles.dotSeparator}>•</AppText>
              <AppText style={styles.txStore}>{transaction.store}</AppText>
            </>
          ) : null}
          {transaction.paymentMethod ? (
            <>
              <AppText style={styles.dotSeparator}>•</AppText>
              <AppText style={styles.txPaymentMethod}>{transaction.paymentMethod}</AppText>
            </>
          ) : null}
          {instText ? (
            <>
              <AppText style={styles.dotSeparator}>•</AppText>
              <AppText style={styles.txInstallment}>{instText}</AppText>
            </>
          ) : null}
          <AppText style={styles.dotSeparator}>•</AppText>
          <AppText style={styles.txDate}>
            {formattedDate}{formattedTime ? ` ${formattedTime}` : ''}
          </AppText>
        </View>
        {transaction.notes ? <AppText style={styles.txNotes}>{transaction.notes}</AppText> : null}
      </View>

      <View style={styles.txRightCol}>
        <AppText
          style={[
            styles.txAmount,
            { color: isIncome ? theme.colors.success : theme.colors.danger },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatMoney(displayAmount, transaction.currency)}
        </AppText>

        <View style={styles.actionsRow}>
          {showCurrencyBadge && (
            <AppBadge
              label={`${currencyInfo.flag} ${transaction.currency}`}
              variant="neutral"
              size="sm"
            />
          )}

          <TouchableOpacity
            onPress={() => onEdit(transaction)}
            style={styles.editBtn}
            accessibilityLabel={`Edit ${transaction.title}`}
          >
            <Pencil size={14} color={theme.colors.accent} />
          </TouchableOpacity>

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(transaction)}
              style={styles.deleteBtn}
              accessibilityLabel={`Delete ${transaction.title}`}
            >
              <Trash2 size={14} color={theme.colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  txMainInfo: {
    flex: 1,
  },
  txTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
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
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  dotSeparator: {
    color: theme.colors.borderLight,
    fontSize: theme.fontSize.xs,
  },
  txNotes: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontStyle: 'italic',
    marginTop: theme.spacing.xxs,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  txAmount: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.extrabold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  editBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background,
  },
});
