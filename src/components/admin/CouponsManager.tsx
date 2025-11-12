'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { couponAPI } from '@/lib/services/api';

type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | string;
  value: number;
  minAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
};

export default function CouponsManager() {
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: 0,
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validTo: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCoupons(page = 1) {
    setLoading(true);
    try {
      const data = await couponAPI.getCoupons({ page, limit: pagination.limit });
      setCoupons(data.coupons as Coupon[]);
      setPagination(data.pagination);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      setCreating(true);
      const payload: any = {
        code: form.code.trim(),
        type: form.type,
        value: form.type === 'free_shipping' ? undefined : Number(form.value),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        validFrom: form.validFrom || new Date().toISOString(),
        validTo: form.validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: form.isActive,
      };
      await couponAPI.createCoupon(payload);
      toast.success('Coupon created');
      setForm({ code: '', type: 'percentage', value: 0, minAmount: '', maxDiscount: '', usageLimit: '', validFrom: '', validTo: '', isActive: true });
      fetchCoupons(pagination.page);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    try {
      const payload: any = {
        code: editing.code,
        type: editing.type,
        value: editing.type === 'free_shipping' ? undefined : Number(editing.value),
        minAmount: editing.minAmount ?? undefined,
        maxDiscount: editing.maxDiscount ?? undefined,
        usageLimit: editing.usageLimit ?? undefined,
        validFrom: editing.validFrom,
        validTo: editing.validTo,
        isActive: editing.isActive,
      };
      await couponAPI.updateCoupon(editing.id, payload);
      toast.success('Coupon updated');
      setEditing(null);
      fetchCoupons(pagination.page);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update coupon');
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await couponAPI.deactivateCoupon(id);
      toast.success('Coupon deactivated');
      fetchCoupons(pagination.page);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to deactivate coupon');
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Coupon */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Coupon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border rounded-md px-3 py-2" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <select className="border rounded-md px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          {form.type !== 'free_shipping' && (
            <input type="number" className="border rounded-md px-3 py-2" placeholder="Value" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} />
          )}
          <input type="number" className="border rounded-md px-3 py-2" placeholder="Min Amount" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })} />
          <input type="number" className="border rounded-md px-3 py-2" placeholder="Max Discount" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
          <input type="number" className="border rounded-md px-3 py-2" placeholder="Usage Limit" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
          <input type="datetime-local" className="border rounded-md px-3 py-2" placeholder="Valid From" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} />
          <input type="datetime-local" className="border rounded-md px-3 py-2" placeholder="Valid To" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })} />
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="mt-4">
          <button onClick={handleCreate} disabled={creating || !form.code.trim()} className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:bg-gray-400">
            {creating ? 'Creating…' : 'Create Coupon'}
          </button>
        </div>
      </section>

      {/* List Coupons */}
      <section className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Coupons</h2>
          <div className="text-sm text-gray-500">Page {pagination.page} / {pagination.pages}</div>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Disc</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.code}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{c.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{c.type === 'free_shipping' ? '—' : c.value}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{c.minAmount ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{c.maxDiscount ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className="px-4 py-2 text-xs text-gray-700">{new Date(c.validFrom).toLocaleString()} → {new Date(c.validTo).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={c.isActive ? 'text-green-600' : 'text-gray-400'}>{c.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-2 flex items-center space-x-2">
                      <button onClick={() => setEditing(c)} className="text-sm text-rose-600 hover:text-rose-700">Edit</button>
                      {c.isActive && (
                        <button onClick={() => handleDeactivate(c.id)} className="text-sm text-gray-600 hover:text-gray-800">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <button disabled={pagination.page <= 1} onClick={() => fetchCoupons(pagination.page - 1)} className="text-sm px-3 py-2 border rounded-md disabled:opacity-50">Previous</button>
          <button disabled={pagination.page >= pagination.pages} onClick={() => fetchCoupons(pagination.page + 1)} className="text-sm px-3 py-2 border rounded-md disabled:opacity-50">Next</button>
        </div>
      </section>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Coupon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="border rounded-md px-3 py-2" placeholder="Code" value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
              <select className="border rounded-md px-3 py-2" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
              {editing.type !== 'free_shipping' && (
                <input type="number" className="border rounded-md px-3 py-2" placeholder="Value" value={editing.value} onChange={e => setEditing({ ...editing, value: Number(e.target.value) })} />
              )}
              <input type="number" className="border rounded-md px-3 py-2" placeholder="Min Amount" value={editing.minAmount ?? ''} onChange={e => setEditing({ ...editing, minAmount: Number(e.target.value) })} />
              <input type="number" className="border rounded-md px-3 py-2" placeholder="Max Discount" value={editing.maxDiscount ?? ''} onChange={e => setEditing({ ...editing, maxDiscount: Number(e.target.value) })} />
              <input type="number" className="border rounded-md px-3 py-2" placeholder="Usage Limit" value={editing.usageLimit ?? ''} onChange={e => setEditing({ ...editing, usageLimit: Number(e.target.value) })} />
              <input type="datetime-local" className="border rounded-md px-3 py-2" placeholder="Valid From" value={new Date(editing.validFrom).toISOString().slice(0,16)} onChange={e => setEditing({ ...editing, validFrom: e.target.value })} />
              <input type="datetime-local" className="border rounded-md px-3 py-2" placeholder="Valid To" value={new Date(editing.validTo).toISOString().slice(0,16)} onChange={e => setEditing({ ...editing, validTo: e.target.value })} />
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}