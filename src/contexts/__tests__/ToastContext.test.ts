import React from 'react';
import { ToastProvider, useToast } from '../ToastContext';

describe('ToastContext & ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws error when useToast is used outside of ToastProvider', () => {
    const mockUseContext = jest.spyOn(React, 'useContext').mockReturnValue(null);
    expect(() => useToast()).toThrow('useToast must be used within a ToastProvider');
    mockUseContext.mockRestore();
  });

  it('returns context value when useToast is used inside a valid context', () => {
    const mockValue = {
      activeToast: null,
      showToast: jest.fn(),
      updateToast: jest.fn(),
      dismissToast: jest.fn(),
      dismissAll: jest.fn(),
    };
    const mockUseContext = jest.spyOn(React, 'useContext').mockReturnValue(mockValue);

    const result = useToast();
    expect(result).toBe(mockValue);
    expect(result.showToast).toBeDefined();
    mockUseContext.mockRestore();
  });

  it('instantiates ToastProvider element correctly', () => {
    const element = React.createElement(ToastProvider, null, React.createElement('div', null, 'child'));
    expect(element).toBeDefined();
    expect(element.type).toBe(ToastProvider);
  });
});
