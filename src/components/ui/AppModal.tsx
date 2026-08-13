import React from 'react';
import { Modal, View, Pressable, StyleSheet, ModalProps } from 'react-native';
import { AppText } from './AppText';
import { X } from 'lucide-react-native';
import theme from '../../theme';

export interface AppModalProps extends Omit<ModalProps, 'children'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  ...rest
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} {...rest}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title && <AppText style={styles.title}>{title}</AppText>}
                {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
              </View>
              <Pressable
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <X color={theme.colors.textMuted} size={20} />
              </Pressable>
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing['4xl'],
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['4xl'],
    maxWidth: 560,
    width: '100%',
    maxHeight: '90%',
    alignSelf: 'center',
    padding: theme.spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing['2xl'],
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.extrabold,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xxs,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});
