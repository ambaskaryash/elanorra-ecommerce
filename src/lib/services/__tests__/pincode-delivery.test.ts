import { describe, it, expect } from 'vitest';
import { 
  calculateDeliveryEstimate, 
  getDeliveryDate, 
  formatDeliveryDate,
  isValidPincode
} from '../pincode-delivery';

describe('Pincode Delivery Service', () => {
  describe('isValidPincode', () => {
    it('should validate correct 6-digit pincodes', () => {
      expect(isValidPincode('560001')).toBe(true);
      expect(isValidPincode('110001')).toBe(true);
    });

    it('should invalidate incorrect pincodes', () => {
      expect(isValidPincode('56000')).toBe(false); // too short
      expect(isValidPincode('5600001')).toBe(false); // too long
      expect(isValidPincode('abcde')).toBe(false); // non-numeric
      expect(isValidPincode('')).toBe(false); // empty
    });
  });

  describe('calculateDeliveryEstimate', () => {
    it('should return faster delivery for local Bangalore pincodes', () => {
      const estimate = calculateDeliveryEstimate('560001');
      expect(estimate.zone).toBe('local');
      expect(estimate.standardDays).toBeLessThan(3);
    });

    it('should return regional delivery for Karnataka pincodes', () => {
      const estimate = calculateDeliveryEstimate('570001'); // Mysore
      expect(estimate.zone).toBe('regional');
      expect(estimate.standardDays).toBeGreaterThan(1);
    });

    it('should return remote delivery for NE/J&K pincodes', () => {
      const estimate = calculateDeliveryEstimate('790001'); // Arunachal
      expect(estimate.zone).toBe('remote');
      expect(estimate.standardDays).toBeGreaterThan(5);
    });

    it('should return national delivery for other major cities', () => {
      const estimate = calculateDeliveryEstimate('110001'); // Delhi
      expect(estimate.zone).toBe('national');
    });
  });

  describe('getDeliveryDate', () => {
    it('should calculate correct date based on days', () => {
      const today = new Date();
      const daysToAdd = 5;
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() + daysToAdd);
      
      const result = getDeliveryDate(daysToAdd);
      
      // Compare dates (ignoring time)
      expect(result.getDate()).toBe(expectedDate.getDate());
      expect(result.getMonth()).toBe(expectedDate.getMonth());
      expect(result.getFullYear()).toBe(expectedDate.getFullYear());
    });
  });
});
