export type Carrier = 'shiprocket' | 'delhivery' | 'bluedart';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface OrderItemPayload {
  name: string;
  sku?: string;
  quantity: number;
  price: number; // in minor units or base currency
}

export interface LabelResult {
  awb?: string;
  shipmentId?: string;
  labelUrl?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier: Carrier;
}

export interface PickupResult {
  pickupScheduled: boolean;
  pickupId?: string;
  pickupDate?: string;
  message?: string;
}

export interface TrackingResult {
  trackingUrl: string;
  status?: string;
  details?: unknown;
}

export interface ShippingProvider {
  name: Carrier;
  generateLabel(input: {
    orderId: string;
    orderNumber?: string;
    items: OrderItemPayload[];
    shippingAddress: ShippingAddress;
    weightKg?: number;
    dimensionsCm?: { length: number; width: number; height: number };
    collectAmount?: number; // COD amount, if applicable
  }): Promise<LabelResult>;

  schedulePickup(input: {
    shipmentId?: string;
    awb?: string;
    pickupDate?: string; // ISO date string
    address?: ShippingAddress;
  }): Promise<PickupResult>;

  getTrackingUrl(trackingNumber: string): string;
  track(trackingNumber: string): Promise<TrackingResult>;
}