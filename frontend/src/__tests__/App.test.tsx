import { describe, it, expect } from 'vitest';
import { getApiBaseUrl } from '../services/apiConfig';

describe('production API configuration', () => {
  it('fails clearly when the production API URL is missing', () => {
    expect(() => getApiBaseUrl('', true)).toThrow('VITE_API_BASE_URL is required for production');
  });

  it('accepts an explicit public HTTPS API URL', () => {
    expect(getApiBaseUrl('https://api.example.edu/api/', true)).toBe('https://api.example.edu/api');
  });
});
