'use client';

/**
 * ORA Admin Panel - Customer Details Page
 * ========================================
 * 
 * Complete customer profile with order history,
 * activity timeline, tags, and notes
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Badge, Card, Spinner, Input, Textarea } from '../../components/ui';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Package,
  Heart,
  Crown,
  Send,
  Edit,
  Trash2,
  Tag,
  Clock,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
  X,
  User,
  Star,
  TrendingUp,
  IndianRupee,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  isVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  tags: string[];
  addresses: Address[];
  orders: Order[];
  wishlistCount: number;
  notes: Note[];
  lastOrderDate?: string;
  createdAt: string;
}

interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: number;
}

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

// ============================================
// CUSTOMER STATS
// ============================================

const CustomerStats = ({ customer }: { customer: Customer }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: 'Total Orders',
      value: customer.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'primary',
    },
    {
      label: 'Total Spent',
      value: formatCurrency(customer.totalSpent),
      icon: IndianRupee,
      color: 'gold',
    },
    {
      label: 'Average Order',
      value: formatCurrency(customer.averageOrderValue),
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: 'Wishlist Items',
      value: customer.wishlistCount.toString(),
      icon: Heart,
      color: 'error',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} padding="sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `var(--admin-${stat.color}-100)`,
              }}
            >
              <stat.icon
                size={20}
                style={{
                  color: `var(--admin-${stat.color}-600)`,
                }}
              />
            </div>
            <div>
              <p className="text-xs text-[var(--admin-text-muted)]">{stat.label}</p>
              <p className="font-bold text-[var(--admin-text-primary)]">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ============================================
// ORDER HISTORY
// ============================================

const OrderHistory = ({ orders }: { orders: Order[] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'secondary' | 'primary' }> = {
    Delivered: { variant: 'success' },
    Shipped: { variant: 'primary' },
    Processing: { variant: 'warning' },
    Pending: { variant: 'secondary' },
    Cancelled: { variant: 'error' },
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag size={40} className="mx-auto text-[var(--admin-text-muted)] mb-3" />
        <p className="text-sm text-[var(--admin-text-muted)]">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--admin-border)]">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/admin/v2/orders/${order.id}`}
          className="flex items-center justify-between py-4 hover:bg-[var(--admin-bg-secondary)] -mx-4 px-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-lg flex items-center justify-center">
              <Package size={18} className="text-[var(--admin-primary-600)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--admin-text-primary)]">{order.orderNumber}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">{formatDate(order.date)} · {order.items} items</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-[var(--admin-text-primary)]">{formatCurrency(order.total)}</p>
            <Badge variant={statusConfig[order.status]?.variant || 'secondary'} size="sm">
              {order.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
};

// ============================================
// ADDRESS CARD
// ============================================

const AddressCard = ({ address }: { address: Address }) => {
  return (
    <div className="border border-[var(--admin-border)] rounded-lg p-4 relative">
      {address.isDefault && (
        <div className="absolute top-2 right-2">
          <Badge variant="primary" size="sm">
            Default
          </Badge>
        </div>
      )}
      <p className="font-medium text-[var(--admin-text-primary)] mb-1">{address.name}</p>
      <p className="text-sm text-[var(--admin-text-muted)]">
        {address.line1}
        {address.line2 && <>, {address.line2}</>}
      </p>
      <p className="text-sm text-[var(--admin-text-muted)]">
        {address.city}, {address.state} - {address.pincode}
      </p>
    </div>
  );
};

// ============================================
// CUSTOMER NOTES
// ============================================

const CustomerNotes = ({ notes, onAddNote }: { notes: Note[]; onAddNote: (note: string) => void }) => {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote('');
      setIsAdding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--admin-text-primary)]">Notes</h3>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsAdding(true)}
        >
          Add Note
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this customer..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-[var(--admin-bg-secondary)] rounded-lg p-3"
          >
            <p className="text-sm text-[var(--admin-text-primary)]">{note.content}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--admin-text-muted)]">
              <span>{note.author}</span>
              <span>·</span>
              <span>{formatDate(note.createdAt)}</span>
            </div>
          </div>
        ))}

        {notes.length === 0 && !isAdding && (
          <p className="text-sm text-[var(--admin-text-muted)] text-center py-4">
            No notes for this customer
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================
// CUSTOMER TAGS
// ============================================

const CustomerTagsEditor = ({
  tags,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const availableTags = ['VIP', 'Repeat Buyer', 'High Value', 'New Customer', 'Wholesale', 'At Risk'];
  const suggestedTags = availableTags.filter(t => !tags.includes(t));

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onAddTag(tag);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const tagConfig: Record<string, { variant: 'gold' | 'primary' | 'secondary' | 'success' | 'error' }> = {
    VIP: { variant: 'gold' },
    'Repeat Buyer': { variant: 'success' },
    'New Customer': { variant: 'primary' },
    'High Value': { variant: 'gold' },
    Wholesale: { variant: 'secondary' },
    'At Risk': { variant: 'error' },
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={tagConfig[tag]?.variant || 'secondary'}
          >
            <div className="flex items-center gap-1">
              {tag === 'VIP' && <Crown size={12} />}
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 p-0.5 rounded-full hover:bg-black/10"
              >
                <X size={12} />
              </button>
            </div>
          </Badge>
        ))}
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-primary-600)] border border-dashed border-[var(--admin-border)] rounded-full hover:border-[var(--admin-primary-300)] transition-colors"
        >
          <Plus size={14} />
          Add Tag
        </button>
      </div>

      {isAdding && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Custom tag..."
              className="text-sm py-1.5"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
            />
            <Button size="sm" onClick={() => handleAddTag(newTag)}>Add</Button>
            <Button variant="secondary" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-[var(--admin-text-muted)]">Suggested:</span>
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--admin-bg-secondary)] hover:bg-[var(--admin-primary-100)] text-[var(--admin-text-muted)] hover:text-[var(--admin-primary-600)] transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        // TODO: API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        setCustomer({
          id: customerId,
          fullName: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+91 98765 43210',
          gender: 'Female',
          dateOfBirth: '1990-05-15',
          isVerified: true,
          totalOrders: 12,
          totalSpent: 245000,
          averageOrderValue: 20417,
          wishlistCount: 8,
          tags: ['VIP', 'Repeat Buyer'],
          addresses: [
            {
              id: '1',
              name: 'Home',
              line1: '123 MG Road, Bandra West',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400050',
              isDefault: true,
            },
            {
              id: '2',
              name: 'Office',
              line1: 'Tower B, Oberoi Business Park',
              line2: 'Goregaon East',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400063',
              isDefault: false,
            },
          ],
          orders: [
            {
              id: '1',
              orderNumber: 'ORA-2024-00123',
              date: new Date().toISOString(),
              status: 'Delivered',
              total: 35000,
              items: 2,
            },
            {
              id: '2',
              orderNumber: 'ORA-2024-00098',
              date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Delivered',
              total: 45000,
              items: 3,
            },
            {
              id: '3',
              orderNumber: 'ORA-2024-00067',
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'Delivered',
              total: 28000,
              items: 1,
            },
          ],
          notes: [
            {
              id: '1',
              content: 'Prefers gold jewelry over silver. Usually shops during festive seasons.',
              author: 'Admin',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          lastOrderDate: new Date().toISOString(),
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch (error) {
        console.error('Error fetching customer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handlers
  const handleAddTag = (tag: string) => {
    if (customer) {
      setCustomer({
        ...customer,
        tags: [...customer.tags, tag],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (customer) {
      setCustomer({
        ...customer,
        tags: customer.tags.filter(t => t !== tag),
      });
    }
  };

  const handleAddNote = (content: string) => {
    if (customer) {
      setCustomer({
        ...customer,
        notes: [
          {
            id: Date.now().toString(),
            content,
            author: 'Admin',
            createdAt: new Date().toISOString(),
          },
          ...customer.notes,
        ],
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  // Not found
  if (!customer) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--admin-text-primary)] mb-2">Customer not found</h2>
          <p className="text-[var(--admin-text-muted)] mb-4">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/v2/customers')}>
            Back to Customers
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={customer.fullName}
          description={`Customer since ${formatDate(customer.createdAt)}`}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Customers', href: '/admin/v2/customers' },
            { label: customer.fullName },
          ]}
          actions={
            <>
              <Button variant="secondary" leftIcon={<Mail size={18} />}>
                Send Email
              </Button>
              <Button variant="secondary" leftIcon={<Edit size={18} />}>
                Edit
              </Button>
            </>
          }
        />

        {/* Customer Stats */}
        <CustomerStats customer={customer} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Orders & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order History */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--admin-text-primary)]">Order History</h3>
                <Link
                  href={`/admin/v2/orders?customer=${customer.id}`}
                  className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
                >
                  View All
                </Link>
              </div>
              <OrderHistory orders={customer.orders} />
            </Card>

            {/* Notes */}
            <Card>
              <CustomerNotes notes={customer.notes} onAddNote={handleAddNote} />
            </Card>
          </div>

          {/* Right Column - Profile & Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--admin-primary-100)] flex items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--admin-primary-600)]">
                    {customer.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--admin-text-primary)]">{customer.fullName}</h3>
                    {customer.tags.includes('VIP') && (
                      <Crown size={16} className="text-[var(--admin-gold-500)]" />
                    )}
                  </div>
                  {customer.isVerified && (
                    <div className="mt-1">
                      <Badge variant="success" size="sm">
                        <CheckCircle size={12} className="mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-[var(--admin-text-muted)]" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-[var(--admin-primary-600)] hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-[var(--admin-text-muted)]" />
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-[var(--admin-text-primary)]"
                  >
                    {customer.phone}
                  </a>
                </div>
                {customer.gender && (
                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-[var(--admin-text-muted)]" />
                    <span className="text-[var(--admin-text-primary)]">{customer.gender}</span>
                  </div>
                )}
                {customer.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-[var(--admin-text-muted)]" />
                    <span className="text-[var(--admin-text-primary)]">{formatDate(customer.dateOfBirth)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Tags */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Tags</h3>
              <CustomerTagsEditor
                tags={customer.tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </Card>

            {/* Addresses */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Addresses</h3>
              <div className="space-y-3">
                {customer.addresses.map((address) => (
                  <AddressCard key={address.id} address={address} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
