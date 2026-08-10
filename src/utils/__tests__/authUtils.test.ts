import { isValidPasswordInput, safeComparePasswords } from '../authUtils';

describe('Auth Utilities', () => {
  describe('safeComparePasswords', () => {
    it('should return true for matching passwords of equal length', () => {
      expect(safeComparePasswords('secret123', 'secret123')).toBe(true);
    });

    it('should return false for different passwords of equal length', () => {
      expect(safeComparePasswords('secret123', 'secret456')).toBe(false);
    });

    it('should return false for passwords of different lengths', () => {
      expect(safeComparePasswords('secret', 'secret123')).toBe(false);
    });

    it('should return false if any argument is not a string', () => {
      expect(safeComparePasswords(null as any, 'secret')).toBe(false);
      expect(safeComparePasswords('secret', undefined as any)).toBe(false);
    });
  });

  describe('isValidPasswordInput', () => {
    it('should return true for non-empty string', () => {
      expect(isValidPasswordInput('myPassword')).toBe(true);
    });

    it('should return false for empty string or whitespace only', () => {
      expect(isValidPasswordInput('')).toBe(false);
      expect(isValidPasswordInput('   ')).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(isValidPasswordInput(null as any)).toBe(false);
      expect(isValidPasswordInput(123 as any)).toBe(false);
    });
  });
});
