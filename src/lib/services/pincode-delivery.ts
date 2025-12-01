// Pin code delivery service for calculating delivery times based on Indian postal codes
// Company base location: Bangalore (Karnataka)

export interface DeliveryEstimate {
  standardDays: number;
  expressDays: number;
  premiumDays: number;
  zone: 'local' | 'regional' | 'national' | 'remote';
  serviceable: boolean;
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  state: string;
  zone: string;
}

// Bangalore pin code ranges for local delivery
const BANGALORE_PINCODES = {
  start: 560001,
  end: 560099
};

// Karnataka pin code ranges for regional delivery
const KARNATAKA_PINCODES = [
  { start: 560001, end: 591346 }, // Karnataka range
];

// Major metro cities with faster delivery
const METRO_CITIES_PINCODES = [
  // Mumbai
  { start: 400001, end: 400104 },
  // Delhi
  { start: 110001, end: 110096 },
  // Chennai
  { start: 600001, end: 603210 },
  // Kolkata
  { start: 700001, end: 700156 },
  // Hyderabad
  { start: 500001, end: 509412 },
  // Pune
  { start: 411001, end: 412411 },
  // Ahmedabad
  { start: 380001, end: 394907 },
];

// Remote areas with longer delivery times (North East, J&K, etc.)
const REMOTE_AREAS_PINCODES = [
  // Jammu & Kashmir
  { start: 180001, end: 194404 },
  // Himachal Pradesh (remote areas)
  { start: 171001, end: 177601 },
  // Arunachal Pradesh
  { start: 790001, end: 792131 },
  // Assam
  { start: 781001, end: 788931 },
  // Manipur
  { start: 795001, end: 795149 },
  // Meghalaya
  { start: 793001, end: 794115 },
  // Mizoram
  { start: 796001, end: 796901 },
  // Nagaland
  { start: 797001, end: 798627 },
  // Tripura
  { start: 799001, end: 799290 },
  // Sikkim
  { start: 737101, end: 737139 },
  // Andaman & Nicobar
  { start: 744101, end: 744304 },
  // Lakshadweep
  { start: 682551, end: 682559 },
];

/**
 * Determines the delivery zone based on pin code
 */
function getDeliveryZone(pincode: string): 'local' | 'regional' | 'national' | 'remote' {
  const pin = parseInt(pincode);
  
  if (isNaN(pin) || pincode.length !== 6) {
    return 'national'; // Default for invalid pin codes
  }

  // Check if it's Bangalore (local)
  if (pin >= BANGALORE_PINCODES.start && pin <= BANGALORE_PINCODES.end) {
    return 'local';
  }

  // Check if it's Karnataka (regional)
  for (const range of KARNATAKA_PINCODES) {
    if (pin >= range.start && pin <= range.end) {
      return 'regional';
    }
  }

  // Check if it's a remote area
  for (const range of REMOTE_AREAS_PINCODES) {
    if (pin >= range.start && pin <= range.end) {
      return 'remote';
    }
  }

  // Check if it's a metro city (faster national delivery)
  for (const range of METRO_CITIES_PINCODES) {
    if (pin >= range.start && pin <= range.end) {
      return 'national';
    }
  }

  // Default to national
  return 'national';
}

/**
 * Calculates delivery estimate based on pin code
 */
export function calculateDeliveryEstimate(pincode: string): DeliveryEstimate {
  const zone = getDeliveryZone(pincode);
  
  // Base delivery times based on zone
  const deliveryTimes = {
    local: {
      standardDays: 2, // 1-2 days for Bangalore
      expressDays: 1,  // Same day/next day
      premiumDays: 1,  // Same day with installation
      serviceable: true
    },
    regional: {
      standardDays: 4, // 3-4 days for Karnataka
      expressDays: 2,  // 1-2 days
      premiumDays: 2,  // 1-2 days with installation
      serviceable: true
    },
    national: {
      standardDays: 7, // 5-7 days for major cities
      expressDays: 4,  // 3-4 days
      premiumDays: 3,  // 2-3 days with installation
      serviceable: true
    },
    remote: {
      standardDays: 12, // 10-12 days for remote areas
      expressDays: 8,   // 7-8 days
      premiumDays: 6,   // 5-6 days with installation
      serviceable: true
    }
  };

  const estimate = deliveryTimes[zone];
  
  return {
    standardDays: estimate.standardDays,
    expressDays: estimate.expressDays,
    premiumDays: estimate.premiumDays,
    zone,
    serviceable: estimate.serviceable
  };
}

/**
 * Formats delivery time range for display
 */
export function formatDeliveryTime(days: number): string {
  if (days === 1) {
    return '1 day';
  } else if (days <= 2) {
    return `1-${days} days`;
  } else if (days <= 7) {
    return `${Math.max(1, days - 2)}-${days} days`;
  } else {
    return `${Math.max(1, days - 2)}-${days} days`;
  }
}

/**
 * Gets delivery date estimate
 */
export function getDeliveryDate(days: number): Date {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + days);
  return deliveryDate;
}

/**
 * Formats delivery date for display
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Validates Indian pin code format
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

/**
 * Gets state name from pin code (basic mapping)
 */
export function getStateFromPincode(pincode: string): string {
  const pin = parseInt(pincode);
  
  if (isNaN(pin)) return 'Unknown';
  
  const firstDigit = Math.floor(pin / 100000);
  
  const stateMapping: { [key: number]: string } = {
    1: 'Delhi/Haryana/Punjab',
    2: 'Himachal Pradesh/Jammu & Kashmir',
    3: 'Rajasthan/Gujarat',
    4: 'Maharashtra/Goa',
    5: 'Karnataka/Andhra Pradesh/Telangana',
    6: 'Tamil Nadu/Kerala/Puducherry',
    7: 'West Bengal/Odisha/Assam',
    8: 'Bihar/Jharkhand/Chhattisgarh',
    9: 'Uttar Pradesh/Uttarakhand'
  };
  
  return stateMapping[firstDigit] || 'India';
}