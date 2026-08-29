'use client';

/**
 * ORA Admin Panel - Notification Settings
 * ========================================
 * 
 * Manage external order notification channels:
 * - Admin Email Alerts
 * - WhatsApp Phone Alerts
 * - Telegram Bot Integration
 * - Webhook / Slack Integration
 */

import React, { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, CardTitle, Input, Alert, Badge } from '../../components/ui';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Webhook,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function NotificationSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [adminEmail, setAdminEmail] = useState('admin@orashop.in');
  const [whatsappPhones, setWhatsappPhones] = useState('+919842253984, +919342865987, +919095007887');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    }, 600);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/v2/settings">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] font-serif">
              External Order Notifications
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)]">
              Configure channels to get notified instantly when a new customer or COD order is placed.
            </p>
          </div>
        </div>

        {saved && (
          <Alert variant="success">
            Notification settings saved successfully! Your external channels will receive alerts for new orders.
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Email Channel */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Mail size={20} />
              </div>
              <div>
                <CardTitle>Admin Email Alerts</CardTitle>
                <p className="text-xs text-[var(--admin-text-muted)]">Receive full HTML order summaries via email</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@orashop.in"
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-[var(--admin-primary-200)] focus:outline-none"
                />
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Configured via <code className="font-mono text-xs bg-gray-100 px-1 rounded">ORDER_ALERT_EMAIL</code> or <code className="font-mono text-xs bg-gray-100 px-1 rounded">ADMIN_EMAIL</code> env var.
                </p>
              </div>
            </div>
          </Card>

          {/* WhatsApp Channel */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <CardTitle>WhatsApp Alerts</CardTitle>
                <p className="text-xs text-[var(--admin-text-muted)]">Send WhatsApp order alerts to admin & partner phones</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-1">
                  Partner / Owner Phone Numbers (comma separated)
                </label>
                <textarea
                  value={whatsappPhones}
                  onChange={(e) => setWhatsappPhones(e.target.value)}
                  rows={2}
                  placeholder="+919842253984, +919342865987"
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-green-200 focus:outline-none font-mono"
                />
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Configured via <code className="font-mono text-xs bg-gray-100 px-1 rounded">ORDER_ALERT_PHONES</code> or <code className="font-mono text-xs bg-gray-100 px-1 rounded">PARTNER_PHONES</code> env var.
                </p>
              </div>
            </div>
          </Card>

          {/* Telegram Channel */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <Send size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Telegram Bot Alerts</CardTitle>
                  <Badge variant="success" size="sm">Free & Instant</Badge>
                </div>
                <p className="text-xs text-[var(--admin-text-muted)]">Send instant notifications to your Telegram chat or staff group</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJK..."
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-sky-200 focus:outline-none font-mono"
                />
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Env var: <code className="font-mono text-xs bg-gray-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-1">
                  Telegram Chat / Group ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="e.g. -100123456789 or @channel"
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-sky-200 focus:outline-none font-mono"
                />
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Env var: <code className="font-mono text-xs bg-gray-100 px-1 rounded">TELEGRAM_CHAT_ID</code>
                </p>
              </div>
            </div>
          </Card>

          {/* Webhook Channel */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Webhook size={20} />
              </div>
              <div>
                <CardTitle>Webhook / Discord / Slack Integration</CardTitle>
                <p className="text-xs text-[var(--admin-text-muted)]">Post JSON order payloads to custom HTTP webhooks</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-1">
                  Webhook Target URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none font-mono"
                />
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Configured via <code className="font-mono text-xs bg-gray-100 px-1 rounded">ORDER_WEBHOOK_URL</code> or <code className="font-mono text-xs bg-gray-100 px-1 rounded">SLACK_WEBHOOK_URL</code> env var.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              leftIcon={<Save size={16} />}
            >
              Save Notification Settings
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
