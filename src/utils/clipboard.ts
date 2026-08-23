import { Platform } from 'react-native';

/**
 * Copies a given text string to the system clipboard across Web and Native platforms.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) return true;
    }
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
  }

  return false;
}

/**
 * Reads text from the system clipboard if supported.
 */
export async function pasteFromClipboard(): Promise<string> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return text ? text.trim() : '';
    }
  } catch (err) {
    console.warn('Failed to read from clipboard:', err);
  }
  return '';
}
