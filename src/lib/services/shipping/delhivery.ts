import { ShippingProvider, LabelResult, PickupResult, TrackingResult, Carrier, ShippingAddress, OrderItemPayload } from './types';

const DELHIVERY_BASE = process.env.DELHIVERY_API_BASE || 'https://track.delhivery.com';
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN;

export class DelhiveryProvider implements ShippingProvider {
  name: Carrier = 'delhivery';

  getTrackingUrl(trackingNumber: string): string {
    // Public tracking URL pattern
    return `https://www.delhivery.com/track/${trackingNumber}`;
  }

  async track(trackingNumber: string): Promise<TrackingResult> {
    return { trackingUrl: this.getTrackingUrl(trackingNumber), status: 'unknown' };
  }

  async generateLabel(input: {
    orderId: string;
    orderNumber?: string;
    items: OrderItemPayload[];
    shippingAddress: ShippingAddress;
    weightKg?: number;
    dimensionsCm?: { length: number; width: number; height: number };
    collectAmount?: number;
  }): Promise<LabelResult> {
    // Delhivery label generation generally requires waybill and manifest creation.
    // Provide a minimal mock unless credentials are configured.
    if (!DELHIVERY_TOKEN) {
      const trackingNumber = `DLV-MOCK-${input.orderId}`;
      return {
        carrier: 'delhivery',
        trackingNumber,
        trackingUrl: this.getTrackingUrl(trackingNumber),
        labelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/uploads/mock-label-delhivery-${input.orderId}.pdf`,
      };
    }

    // TODO: Implement real Delhivery order creation & label generation using CMS/Packages API.
    const trackingNumber = `DLV-${input.orderId}`;
    return {
      carrier: 'delhivery',
      trackingNumber,
      trackingUrl: this.getTrackingUrl(trackingNumber),
      labelUrl: undefined,
    };
  }

  async schedulePickup(input: {
    shipmentId?: string;
    awb?: string;
    pickupDate?: string;
    address?: ShippingAddress;
  }): Promise<PickupResult> {
    if (!DELHIVERY_TOKEN) {
      return {
        pickupScheduled: true,
        pickupId: `DLV-PICKUP-MOCK-${input.awb || input.shipmentId || 'X'}`,
        pickupDate: input.pickupDate || new Date().toISOString().slice(0, 10),
        message: 'Mock pickup scheduled; set Delhivery credentials for real pickups.',
      };
    }

    // TODO: Implement real pickup scheduling via Delhivery pickup API.
    return { pickupScheduled: true, pickupId: `DLV-${Date.now()}`, pickupDate: input.pickupDate };
  }
}