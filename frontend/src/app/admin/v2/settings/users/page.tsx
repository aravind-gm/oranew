'use client';

/**
 * ORA Admin Panel - Users & Permissions Settings
 * ===============================================
 * 
 * Staff management, roles, and access control
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, Input, Select, Badge, Spinner, Alert, Checkbox } from '../../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../../components/ui/DataTable';
import {
  Users,
  Plus,
  Search,
  Mail,
  Shield,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Clock,
  Crown,
  Lock,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'disabled';
  lastActive?: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

// ============================================
// INVITE MODAL
// ============================================

const InviteModal = ({
  isOpen,
  onClose,
  roles,
}: {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // TODO: API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      console.error('Error sending invite:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[var(--admin-text-primary)] mb-4">Invite Staff Member</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Staff member's name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: '', label: 'Select a role' },
                ...roles.map(r => ({ value: r.id, label: r.name })),
              ]}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={sending} className="flex-1">
                Send Invite
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================
// USERS SETTINGS PAGE
// ============================================

export default function UsersSettingsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setStaff([
          {
            id: '1',
            name: 'Admin User',
            email: 'admin@orajewellery.com',
            role: 'Owner',
            status: 'active',
            lastActive: new Date().toISOString(),
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Priya Manager',
            email: 'priya@orajewellery.com',
            role: 'Manager',
            status: 'active',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            name: 'Rahul Staff',
            email: 'rahul@orajewellery.com',
            role: 'Staff',
            status: 'active',
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            name: 'New Staff',
            email: 'newstaff@orajewellery.com',
            role: 'Staff',
            status: 'invited',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);

        setRoles([
          {
            id: 'owner',
            name: 'Owner',
            description: 'Full access to all store settings and data',
            permissions: ['all'],
            isSystem: true,
          },
          {
            id: 'manager',
            name: 'Manager',
            description: 'Manage products, orders, and customers',
            permissions: ['products', 'orders', 'customers', 'analytics'],
            isSystem: true,
          },
          {
            id: 'staff',
            name: 'Staff',
            description: 'Process orders and manage inventory',
            permissions: ['orders', 'inventory'],
            isSystem: true,
          },
          {
            id: 'custom1',
            name: 'Marketing',
            description: 'Manage discounts, banners, and campaigns',
            permissions: ['marketing', 'content'],
            isSystem: false,
          },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query);
    }
    return true;
  });

  // Role badge variant
  const roleVariant = (role: string): 'gold' | 'primary' | 'secondary' => {
    if (role === 'Owner') return 'gold';
    if (role === 'Manager') return 'primary';
    return 'secondary';
  };

  // Status badge variant
  const statusVariant = (status: string): 'success' | 'warning' | 'error' => {
    if (status === 'active') return 'success';
    if (status === 'invited') return 'warning';
    return 'error';
  };

  // Table columns
  const staffColumns: Column<StaffMember>[] = [
    {
      id: 'member',
      header: 'Staff Member',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--admin-primary-100)] flex items-center justify-center flex-shrink-0">
            <span className="font-semibold text-[var(--admin-primary-600)]">
              {row.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-[var(--admin-text-primary)]">{row.name}</p>
            <p className="text-xs text-[var(--admin-text-muted)]">{row.email}</p>
          </div>
        </div>
      ),
      width: '35%',
    },
    {
      id: 'role',
      header: 'Role',
      accessor: (row) => (
        <Badge variant={roleVariant(row.role)}>
          {row.role === 'Owner' && <Crown size={12} className="mr-1" />}
          {row.role}
        </Badge>
      ),
      width: '15%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
      width: '15%',
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessor: (row) => (
        <span className="text-sm text-[var(--admin-text-muted)]">
          {formatTimeAgo(row.lastActive)}
        </span>
      ),
      width: '20%',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Users & Permissions"
          description="Manage staff accounts and access levels"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings', href: '/admin/v2/settings' },
            { label: 'Users & Permissions' },
          ]}
          actions={
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Staff
            </Button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--admin-border)]">
          {[
            { id: 'staff', label: 'Staff Members', icon: Users },
            { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--admin-primary-500)] text-[var(--admin-primary-600)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <>
            {/* Search */}
            <Card padding="sm">
              <Input
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                className="max-w-md"
              />
            </Card>

            {/* Staff Table */}
            <DataTable
              data={filteredStaff}
              columns={staffColumns}
              getRowId={(row: any) => row.id as string}
              rowActions={(row: any) => (
                <TableActions>
                  <TableActionItem icon={<Edit size={16} />} onClick={() => {}}>
                    Edit
                  </TableActionItem>
                  <TableActionItem icon={<Key size={16} />} onClick={() => {}}>
                    Reset Password
                  </TableActionItem>
                  <TableActionItem icon={<Mail size={16} />} onClick={() => {}}>
                    Resend Invite
                  </TableActionItem>
                  {row.role !== 'Owner' && (
                    <TableActionItem
                      icon={row.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      onClick={() => {}}
                    >
                      {row.status === 'active' ? 'Disable' : 'Enable'}
                    </TableActionItem>
                  )}
                  {row.role !== 'Owner' && (
                    <TableActionItem icon={<Trash2 size={16} />} onClick={() => {}} variant="danger">
                      Remove
                    </TableActionItem>
                  )}
                </TableActions>
              )}
              emptyState={
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--admin-text-primary)] mb-2">No staff members</h3>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">
                    Invite your team to help manage your store
                  </p>
                  <Button onClick={() => setShowInviteModal(true)}>
                    Invite Staff
                  </Button>
                </div>
              }
            />
          </>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                      <Shield size={20} className="text-[var(--admin-primary-600)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--admin-text-primary)]">{role.name}</h3>
                        {role.isSystem && (
                          <Badge variant="secondary" size="sm">
                            <Lock size={10} className="mr-1" />
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--admin-text-muted)] mt-1">{role.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {role.permissions.map((perm, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-[var(--admin-bg-secondary)] rounded text-[var(--admin-text-muted)]"
                          >
                            {perm === 'all' ? 'Full Access' : perm.charAt(0).toUpperCase() + perm.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <Button variant="secondary" size="sm" leftIcon={<Edit size={14} />}>
                      Edit
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            <Button variant="secondary" leftIcon={<Plus size={18} />} className="w-full border-dashed">
              Create Custom Role
            </Button>
          </div>
        )}

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roles={roles}
        />
      </div>
    </AdminLayout>
  );
}
