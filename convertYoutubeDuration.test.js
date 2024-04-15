const convertYoutubeDuration = require('./server');

describe('convertYoutubeDuration', () => {
    test('Converts duration format without hours', () => {
      expect(convertYoutubeDuration('PT2M30S')).toBe('0:2:30');
    });
  
    test('Converts duration format with hours', () => {
      expect(convertYoutubeDuration('PT1H2M30S')).toBe('1:2:30');
    });
  
    test('Converts duration format with days, hours, minutes, and seconds', () => {
      expect(convertYoutubeDuration('P1DT2H30M15S')).toBe('1:2:30:15');
    });
  
    test('Handles invalid duration format', () => {
      expect(convertYoutubeDuration('invalid')).toBe('Invalid duration format');
    });
  });