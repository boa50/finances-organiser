import { Platform, Alert } from 'react-native';

export interface ConfirmActionOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function confirmAction(options: ConfirmActionOptions): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${options.title}\n\n${options.message}`)) {
      options.onConfirm();
    }
  } else {
    Alert.alert(
      options.title,
      options.message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          style: options.destructive ? 'destructive' : 'default',
          onPress: options.onConfirm,
        },
      ],
      { cancelable: true }
    );
  }
}
