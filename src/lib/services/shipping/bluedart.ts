import { ShippingProvider, LabelResult, PickupResult, TrackingResult, Carrier, ShippingAddress, OrderItemPayload } from './types';

export class BluedartProvider implements ShippingProvider {
  name: Carrier = 'bluedart';

  getTrackingUrl(trackingNumber: string): string {
    // Public tracking URL pattern (Bluedart AWB/Waybill)
    return `https://www.bluedart.com/track?awb=${trackingNumber}`;
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
    const trackingNumber = `BD-${input.orderId}`;
    return {
      carrier: 'bluedart',
      trackingNumber,
      trackingUrl: this.getTrackingUrl(trackingNumber),
      labelUrl: undefined, // Requires contracted API; left as future enhancement
    };
  }

  async schedulePickup(input: {
    shipmentId?: string;
    awb?: string;
    pickupDate?: string;
    address?: ShippingAddress;
  }): Promise<PickupResult> {
    return { pickupScheduled: true, pickupId: `BD-${Date.now()}`, pickupDate: input.pickupDate };
  }
}