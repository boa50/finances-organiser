import { copyToClipboard, pasteFromClipboard } from '../clipboard';

describe('clipboard utils', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('returns false when text is empty', async () => {
    const result = await copyToClipboard('');
    expect(result).toBe(false);
  });

  it('copies text via navigator.clipboard.writeText when available', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: writeTextMock,
        },
      },
      writable: true,
      configurable: true,
    });

    const result = await copyToClipboard('tx_test_123');
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('tx_test_123');
  });

  it('pastes text via navigator.clipboard.readText when available', async () => {
    const readTextMock = jest.fn().mockResolvedValue(' tx_pasted_123 ');
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          readText: readTextMock,
        },
      },
      writable: true,
      configurable: true,
    });

    const result = await pasteFromClipboard();
    expect(result).toBe('tx_pasted_123');
    expect(readTextMock).toHaveBeenCalled();
  });
});
