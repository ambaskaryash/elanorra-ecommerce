import { medusaFetch } from './client';

export type MedusaCustomer = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
};

export type MedusaAddress = {
  id?: string;
  customer_id?: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  province?: string;
  postal_code: string;
  phone?: string;
  metadata?: Record<string, any>;
};

export async function createCustomer(data: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>('/store/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.customer;
}

export async function getCustomer(email?: string) {
  // Medusa doesn't have a direct "get by email" store endpoint for customers without auth
  // But we can list customers if we have admin privileges, or rely on the current session.
  // In a real storefront, we'd use the JWT from Medusa auth.
  // For now, we'll try to list and filter if possible, or assume we create/update.
  const response = await medusaFetch<{ customers: MedusaCustomer[] }>('/store/customers', {
    query: { email },
  });
  return response.customers[0] || null;
}

export async function updateCustomer(customerId: string, data: Partial<MedusaCustomer>) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>(`/store/customers/me`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.customer;
}

export async function addAddress(customerId: string, address: MedusaAddress) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>(`/store/customers/me/addresses`, {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
  return response.customer;
}

export async function getAddresses() {
  const response = await medusaFetch<{ addresses: MedusaAddress[] }>('/store/customers/me/addresses');
  return response.addresses;
}
