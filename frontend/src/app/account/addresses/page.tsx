'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchAddresses();
  }, [token, router]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      if (response.data.success) {
        setAddresses(response.data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/addresses', form);
      if (response.data.success) {
        await fetchAddresses();
        setForm({ street: '', city: '', state: '', zipCode: '', country: 'India' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await api.delete(`/addresses/${id}`);
      if (response.data.success) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Addresses</h1>
          <Link href="/account" className="text-primary-600 hover:underline">
            Back to Account
          </Link>
        </div>

        {/* Add Address Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Address</h2>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label htmlFor="street" className="block text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Street</label>
                <input
                  id="street"
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border border-border rounded-lg bg-background-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[52px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">City</label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border border-border rounded-lg bg-background-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[52px]"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">State</label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border border-border rounded-lg bg-background-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[52px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zipCode" className="block text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">
                    Zip Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border border-border rounded-lg bg-background-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[52px]"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Country</label>
                  <select
                    id="country"
                    value="India"
                    className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border border-border rounded-lg bg-background-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[52px]"
                  >
                    <option value="India">India</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded hover:bg-neutral-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-neutral-600">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-4">No addresses yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Add First Address
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowForm(true)}
                className="mb-6 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Add New Address
              </button>

              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 border border-neutral-300 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">
                        {addr.street}
                        {addr.isDefault && (
                          <span className="ml-2 text-xs bg-info/10 text-info px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{addr.country}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
