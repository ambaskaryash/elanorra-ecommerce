import { ShippingProvider, LabelResult, PickupResult, TrackingResult, Carrier, ShippingAddress, OrderItemPayload } from './types';

const SHIPROCKET_BASE = process.env.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in/v1';
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

async function shiprocketAuthToken(): Promise<string | null> {
  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) return null;
  try {
    const res = await fetch(`${SHIPROCKET_BASE}/external/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

function toShiprocketOrderPayload(params: {
  orderId: string;
  orderNumber?: string;
  items: OrderItemPayload[];
  shippingAddress: ShippingAddress;
  weightKg?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  collectAmount?: number;
}) {
  const {
    orderId,
    orderNumber,
    items,
    shippingAddress,
    weightKg,
    dimensionsCm,
    collectAmount,
  } = params;

  return {
    order_id: orderNumber || orderId,
    order_date: new Date().toISOString(),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    channel_id: process.env.SHIPROCKET_CHANNEL_ID || '',
    billing_customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
    billing_address: shippingAddress.address1,
    billing_address_2: shippingAddress.address2 || '',
    billing_city: shippingAddress.city,
    billing_pincode: shippingAddress.zipCode,
    billing_state: shippingAddress.state,
    billing_country: shippingAddress.country,
    billing_email: '',
    billing_phone: shippingAddress.phone || '',
    shipping_is_billing: true,
    order_items: items.map((it) => ({
      name: it.name,
      sku: it.sku || it.name,
      units: it.quantity,
      selling_price: it.price,
    })),
    payment_method: collectAmount && collectAmount > 0 ? 'COD' : 'Prepaid',
    sub_total: items.reduce((s, it) => s + (it.price * it.quantity), 0),
    length: dimensionsCm?.length || 10,
    breadth: dimensionsCm?.width || 10,
    height: dimensionsCm?.height || 10,
    weight: weightKg || 0.5,
    cod_amount: collectAmount || 0,
  };
}

export class ShiprocketProvider implements ShippingProvider {
  name: Carrier = 'shiprocket';

  getTrackingUrl(trackingNumber: string): string {
    return `https://shiprocket.co/tracking/${trackingNumber}`;
  }

  async track(trackingNumber: string): Promise<TrackingResult> {
    // Shiprocket offers tracking details via AWB/shipment APIs, but for simplicity return URL
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
    const token = await shiprocketAuthToken();

    // If no credentials, return a mocked label result
    if (!token) {
      const trackingNumber = `SR-MOCK-${input.orderId}`;
      return {
        carrier: 'shiprocket',
        awb: trackingNumber,
        trackingNumber,
        trackingUrl: this.getTrackingUrl(trackingNumber),
        labelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/uploads/mock-label-${input.orderId}.pdf`,
      };
    }

    try {
      // 1) Create order
      const orderPayload = toShiprocketOrderPayload(input);
      const createRes = await fetch(`${SHIPROCKET_BASE}/external/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });
      const created = await createRes.json();
      const shipmentId = created?.shipment_id || created?.data?.shipment_id;

      // 2) Assign AWB
      let awb: string | undefined;
      if (shipmentId) {
        const awbRes = await fetch(`${SHIPROCKET_BASE}/courier/assign/awb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shipment_id: shipmentId }),
        });
        const awbData = await awbRes.json();
        awb = awbData?.awb_code || awbData?.data?.awb_code;
      }

      // 3) Generate label
      let labelUrl: string | undefined;
      if (shipmentId) {
        const labelRes = await fetch(`${SHIPROCKET_BASE}/courier/generate/label`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shipment_id: [shipmentId] }),
        });
        const labelData = await labelRes.json();
        labelUrl = labelData?.label_url || labelData?.data?.label_url;
      }

      const trackingNumber = awb || shipmentId || input.orderId;
      return {
        carrier: 'shiprocket',
        awb,
        shipmentId,
        trackingNumber,
        trackingUrl: this.getTrackingUrl(trackingNumber),
        labelUrl,
      };
    } catch (e) {
      const trackingNumber = `SR-ERR-${input.orderId}`;
      return {
        carrier: 'shiprocket',
        trackingNumber,
        trackingUrl: this.getTrackingUrl(trackingNumber),
        labelUrl: undefined,
      };
    }
  }

  async schedulePickup(input: {
    shipmentId?: string;
    awb?: string;
    pickupDate?: string;
    address?: ShippingAddress;
  }): Promise<PickupResult> {
    const token = await shiprocketAuthToken();
    if (!token) {
      return {
        pickupScheduled: true,
        pickupId: `SR-PICKUP-MOCK-${input.awb || input.shipmentId || 'X'}`,
        pickupDate: input.pickupDate || new Date().toISOString().slice(0, 10),
        message: 'Mock pickup scheduled; set Shiprocket credentials to enable real pickups.',
      };
    }

    try {
      const res = await fetch(`${SHIPROCKET_BASE}/courier/generate/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [input.shipmentId], pickup_date: input.pickupDate }),
      });
      const data = await res.json();
      return {
        pickupScheduled: true,
        pickupId: data?.pickup_id || data?.data?.pickup_id,
        pickupDate: input.pickupDate,
      };
    } catch (e) {
      return { pickupScheduled: false, message: 'Failed to schedule pickup' };
    }
  }
}