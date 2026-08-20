import React from 'react';
import { Modal, View, Pressable, StyleSheet, ModalProps, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { AppText } from './AppText';
import { X } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';

export interface AppModalProps extends Omit<ModalProps, 'children'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  cardStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  cardStyle,
  maxWidth = 560,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const isSmallScreen = Dimensions.get('window').width < 600;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} {...rest}>
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.overlay },
          isSmallScreen && styles.overlayMobile,
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderLight,
              boxShadow: theme.colors.cardShadow,
              maxWidth,
            },
            isSmallScreen && styles.cardMobile,
            cardStyle,
          ]}
        >
          {isSmallScreen && (
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.borderLight }]} />
          )}
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title && (
                  <AppText style={[styles.title, { color: theme.colors.textPrimary }]}>
                    {title}
                  </AppText>
                )}
                {subtitle && (
                  <AppText style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {subtitle}
                  </AppText>
                )}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: theme.colors.surfaceRecessed,
                    borderColor: theme.colors.borderSubtle,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onClose}
                accessibilityLabel="Close modal"
              >
                <X color={theme.colors.textMuted} size={18} />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  overlayMobile: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.radii.modal,
    borderWidth: 1,
    width: '100%',
    maxHeight: '90%',
    padding: theme.spacing['5xl'],
    elevation: 12,
  },
  cardMobile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '85%',
    paddingHorizontal: theme.spacing['4xl'],
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['6xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing['2xl'],
    gap: theme.spacing.md,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceRecessed,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
