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

export async function getCustomer(email: string) {
  // Use Admin API to find customer by email
  const response = await medusaFetch<{ customers: MedusaCustomer[] }>('/admin/customers', {
    query: { q: email },
  });
  return response.customers.find(c => c.email === email) || null;
}

export async function updateCustomer(customerId: string, data: Partial<MedusaCustomer>) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>(`/admin/customers/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.customer;
}

export async function addAddress(customerId: string, address: MedusaAddress) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>(`/admin/customers/${customerId}/addresses`, {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
  return response.customer;
}

export async function getAddresses(customerId: string) {
  const response = await medusaFetch<{ customer: MedusaCustomer }>(`/admin/customers/${customerId}`, {
    query: {
      fields: '*addresses',
    },
  });
  return response.customer?.addresses || [];
}

export async function deleteAddress(customerId: string, addressId: string) {
  const response = await medusaFetch<any>(`/admin/customers/${customerId}/addresses/${addressId}`, {
    method: 'DELETE',
  });
  return response;
}

export async function syncCustomer(data: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const existing = await getCustomer(data.email);
    if (existing) {
      return await updateCustomer(existing.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        metadata: {
          ...existing.metadata,
          ...data.metadata,
        },
      });
    } else {
      return await createCustomer(data);
    }
  } catch (error) {
    console.error('Error syncing Medusa customer:', error);
    throw error;
  }
}

