'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  TrashIcon, 
  PencilIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentIcon,
  DocumentDuplicateIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  source: string;
  createdAt: string;
  preferences?: {
    categories?: string[];
    frequency?: string;
  };
}

interface Newsletter {
  id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
}

interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalNewsletters: number;
  averageOpenRate: number;
}

interface EditSubscriberData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
  isActive: boolean;
  isDefault: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewsletterDashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'campaigns' | 'compose' | 'analytics'>('overview');
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Subscriber management state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<EditSubscriberData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

  // Compose newsletter state
  const [composeData, setComposeData] = useState({
    subject: '',
    htmlContent: '',
    textContent: '',
    testEmail: '',
  });
  const [composing, setComposing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    }
  }, []);

  const fetchNewsletters = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/send');
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (err) {
      console.error('Failed to fetch newsletters:', err);
    }
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/newsletter/templates');
      if (response.ok) {
        const data = await response.json();
        setEmailTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch email templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSubscribers(),
        fetchNewsletters(),
        fetchEmailTemplates()
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Filter subscribers based on search and status
  useEffect(() => {
    let filtered = subscribers;
    
    if (searchTerm) {
      filtered = filtered.filter(subscriber => 
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subscriber.firstName && subscriber.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (subscriber.lastName && subscriber.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(subscriber => 
        statusFilter === 'active' ? subscriber.isActive : !subscriber.isActive
      );
    }
    
    setFilteredSubscribers(filtered);
  }, [subscribers, searchTerm, statusFilter]);

  // Template management functions
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setComposeData(prev => ({
      ...prev,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    }));
  };

  const handleCreateTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      const response = await fetch('/api/newsletter/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setSuccess('Template created successfully');
        fetchEmailTemplates();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create template');
      }
    } catch (err) {
      setError('Failed to create template');
    }
  };

  // Subscriber management functions
  const handleAddSubscriber = async () => {
    if (!newSubscriber.email) {
      setError('Email is required');
      return;
    }

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscriber),
      });

      if (response.ok) {
        setSuccess('Subscriber added successfully');
        setNewSubscriber({ email: '', firstName: '', lastName: '' });
        setShowAddModal(false);
        fetchSubscribers();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add subscriber');
      }
    } catch (err) {
      setError('Failed to add subscriber');
    }
  };

  const handleEditSubscriber = async () => {
    if (!editingSubscriber) return;

    try {
      const response = await fetch(`/api/newsletter/subscribers/${editingSubscriber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingSubscriber.email,
          firstName: editingSubscriber.firstName,
          lastName: editingSubscriber.lastName,
          isActive: editingSubscriber.isActive,
        }),
      });

      if (response.ok) {
        setSuccess('Subscriber updated successfully');
        setEditingSubscriber(null);
        setShowEditModal(false);
        fetchSubscribers();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update subscriber');
      }
    } catch (err) {
      setError('Failed to update subscriber');
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const response = await fetch(`/api/newsletter/subscribers/${subscriberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Subscriber deleted successfully');
        fetchSubscribers();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete subscriber');
      }
    } catch (err) {
      setError('Failed to delete subscriber');
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedSubscribers.length === 0) {
      setError('Please select subscribers first');
      return;
    }

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedSubscribers.length} subscribers?`
      : `Are you sure you want to ${action} ${selectedSubscribers.length} subscribers?`;

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/newsletter/subscribers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          subscriberIds: selectedSubscribers,
        }),
      });

      if (response.ok) {
        setSuccess(`Successfully ${action}d ${selectedSubscribers.length} subscribers`);
        setSelectedSubscribers([]);
        fetchSubscribers();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} subscribers`);
      }
    } catch (err) {
      setError(`Failed to ${action} subscribers`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const handleExportSubscribers = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Status', 'Source', 'Joined Date'],
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.firstName || '',
        sub.lastName || '',
        sub.isActive ? 'Active' : 'Inactive',
        sub.source,
        new Date(sub.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import subscribers from CSV
  const handleImportSubscribers = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/newsletter/subscribers/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Successfully imported ${result.imported} subscribers`);
        fetchSubscribers();
      } else {
        throw new Error('Failed to import subscribers');
      }
    } catch (error) {
      setError(`Error importing subscribers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!composeData.testEmail || !composeData.subject || !composeData.htmlContent) {
      setError('Please fill in test email, subject, and content');
      return;
    }

    setComposing(true);
    try {
      const requestBody: any = {
        subject: composeData.subject,
        content: composeData.htmlContent, // API expects 'content', not 'htmlContent'
        plainText: composeData.textContent,
        testEmail: composeData.testEmail,
      };

      // Add template variables if a template is selected
      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate.id;
        requestBody.variables = selectedTemplate.variables;
      }

      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setError(null);
        alert('Test email sent successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send test email');
      }
    } catch (err) {
      setError('Failed to send test email');
    } finally {
      setComposing(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!composeData.subject || !composeData.htmlContent) {
      setError('Please fill in subject and content');
      return;
    }

    if (!confirm('Are you sure you want to send this newsletter to all active subscribers?')) {
      return;
    }

    setComposing(true);
    try {
      const requestBody: any = {
        subject: composeData.subject,
        content: composeData.htmlContent,
        plainText: composeData.textContent,
      };

      // Add template variables if a template is selected
      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate.id;
        requestBody.variables = selectedTemplate.variables;
      }

      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setError(null);
        alert(`Newsletter sent successfully! Sent: ${result.sent}, Failed: ${result.failed}`);
        setComposeData({ subject: '', htmlContent: '', textContent: '', testEmail: '' });
        setSelectedTemplate(null);
        fetchNewsletters();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send newsletter');
      }
    } catch (err) {
      setError('Failed to send newsletter');
    } finally {
      setComposing(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access the newsletter dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your ElanorraLiving Community subscribers and campaigns</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'subscribers', name: 'Subscribers', icon: UserPlusIcon },
              { id: 'campaigns', name: 'Campaigns', icon: EnvelopeIcon },
              { id: 'compose', name: 'Compose', icon: PencilIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-600">{success}</p>
            <button 
              onClick={() => setSuccess(null)}
              className="mt-2 text-sm text-green-500 hover:text-green-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalSubscribers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscribers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.activeSubscribers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Campaigns Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalNewsletters || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg. Open Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.averageOpenRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
              </div>
              <div className="p-6">
                {newsletters.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {newsletters.slice(0, 5).map((newsletter) => (
                      <div key={newsletter.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">{newsletter.subject}</p>
                          <p className="text-sm text-gray-500">
                            {newsletter.sentAt ? `Sent ${new Date(newsletter.sentAt).toLocaleDateString()}` : `Created ${new Date(newsletter.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            newsletter.status === 'sent' ? 'bg-green-100 text-green-800' :
                            newsletter.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                            newsletter.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {newsletter.status}
                          </span>
                          {newsletter.status === 'sent' && (
                            <p className="text-sm text-gray-500 mt-1">{newsletter.sentCount} sent</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No campaigns yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            {/* Subscriber Management Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Subscribers ({filteredSubscribers.length} of {subscribers.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Manage your newsletter subscribers</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition duration-200"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Add Subscriber
                  </button>
                  <button
                    onClick={handleExportSubscribers}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subscribers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedSubscribers.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      {selectedSubscribers.length} subscriber(s) selected
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('activate')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition duration-200"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition duration-200"
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSubscribers.includes(subscriber.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubscribers([...selectedSubscribers, subscriber.id]);
                              } else {
                                setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriber.id));
                              }
                            }}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subscriber.firstName || subscriber.lastName 
                            ? `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim()
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscriber.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {subscriber.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.source}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscriber.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingSubscriber({
                                  id: subscriber.id,
                                  email: subscriber.email,
                                  firstName: subscriber.firstName || '',
                                  lastName: subscriber.lastName || '',
                                  isActive: subscriber.isActive,
                                });
                                setShowEditModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(subscriber.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredSubscribers.length === 0 && (
                <div className="text-center py-12">
                  <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No subscribers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first subscriber.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Campaign Management</h3>
                <p className="text-sm text-gray-500">Manage and track your newsletter campaigns</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('compose')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Create Campaign
                </button>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                    <p className="text-2xl font-semibold text-gray-900">{newsletters.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.filter(n => n.status === 'sent').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PencilIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Drafts</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.filter(n => n.status === 'draft').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Scheduled</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.filter(n => n.status === 'scheduled').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {newsletters.map((newsletter) => (
                      <tr key={newsletter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{newsletter.subject}</div>
                              <div className="text-sm text-gray-500">Campaign #{newsletter.id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            newsletter.status === 'sent' 
                              ? 'bg-green-100 text-green-800'
                              : newsletter.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : newsletter.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {newsletter.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.sentCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.openCount || 0}
                          {newsletter.sentCount > 0 && (
                            <span className="text-gray-500 ml-1">
                              ({((newsletter.openCount / newsletter.sentCount) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.clickCount || 0}
                          {newsletter.sentCount > 0 && (
                            <span className="text-gray-500 ml-1">
                              ({((newsletter.clickCount / newsletter.sentCount) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {newsletter.sentAt 
                            ? new Date(newsletter.sentAt).toLocaleDateString()
                            : new Date(newsletter.createdAt).toLocaleDateString()
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-red-600 hover:text-red-900" title="View Details">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {newsletter.status === 'draft' && (
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Campaign"
                                onClick={() => setActiveTab('compose')}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-900" title="Duplicate Campaign">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            {newsletter.status === 'draft' && (
                              <button className="text-red-600 hover:text-red-900" title="Delete Campaign">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {newsletters.length === 0 && (
                <div className="text-center py-12">
                  <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first newsletter campaign.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('compose')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Create Campaign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                    <p className="text-sm text-gray-500">Choose a template or start from scratch</p>
                  </div>
                  <button
                    onClick={fetchEmailTemplates}
                    disabled={templatesLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {templatesLoading ? 'Loading...' : 'Refresh Templates'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {templatesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading templates...</p>
                  </div>
                ) : emailTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                    <p className="mt-1 text-sm text-gray-500">Create your first email template to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={`border-2 rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-500'
                        }`}
                      >
                        <div className="flex justify-center mb-3">
                          {template.category === 'general' && <DocumentIcon className="h-12 w-12 text-gray-400" />}
                          {template.category === 'newsletter' && <EnvelopeIcon className="h-12 w-12 text-blue-500" />}
                          {template.category === 'promotional' && <ChartBarIcon className="h-12 w-12 text-green-500" />}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedTemplate && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Selected: {selectedTemplate.name}</h4>
                        <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setComposeData(prev => ({
                            ...prev,
                            subject: '',
                            htmlContent: '',
                            textContent: '',
                          }));
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compose Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Compose Newsletter</h3>
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Preview
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      <DocumentIcon className="h-4 w-4 mr-2" />
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={composeData.subject}
                      onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter newsletter subject..."
                    />
                  </div>
                  <div>
                    <label htmlFor="preheader" className="block text-sm font-medium text-gray-700 mb-2">
                      Preheader Text
                    </label>
                    <input
                      type="text"
                      id="preheader"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Preview text that appears after subject..."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="htmlContent" className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Content *
                  </label>
                  <div className="border border-gray-300 rounded-md">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button className="text-sm text-gray-600 hover:text-gray-900">Bold</button>
                        <button className="text-sm text-gray-600 hover:text-gray-900">Italic</button>
                        <button className="text-sm text-gray-600 hover:text-gray-900">Link</button>
                        <button className="text-sm text-gray-600 hover:text-gray-900">Image</button>
                      </div>
                      <div className="text-xs text-gray-500">
                         Use {'{'}{'{'} UNSUBSCRIBE_URL {'}'}{'}'}  for unsubscribe links
                       </div>
                    </div>
                    <textarea
                      id="htmlContent"
                      rows={15}
                      value={composeData.htmlContent}
                      onChange={(e) => setComposeData(prev => ({ ...prev, htmlContent: e.target.value }))}
                      className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none"
                      placeholder="Enter HTML content... You can use {{UNSUBSCRIBE_URL}} placeholder for unsubscribe links."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
                    Plain Text Content (Optional)
                  </label>
                  <textarea
                    id="textContent"
                    rows={6}
                    value={composeData.textContent}
                    onChange={(e) => setComposeData(prev => ({ ...prev, textContent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter plain text version..."
                  />
                </div>

                {/* Scheduling Options */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Delivery Options</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="send-now"
                        name="delivery"
                        type="radio"
                        defaultChecked
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <label htmlFor="send-now" className="ml-3 block text-sm font-medium text-gray-700">
                        Send immediately
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="schedule"
                        name="delivery"
                        type="radio"
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <label htmlFor="schedule" className="ml-3 block text-sm font-medium text-gray-700">
                        Schedule for later
                      </label>
                    </div>
                    <div className="ml-7 grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Email Section */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Test Email</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="email"
                        id="testEmail"
                        value={composeData.testEmail}
                        onChange={(e) => setComposeData(prev => ({ ...prev, testEmail: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="your@email.com"
                      />
                    </div>
                    <button
                      onClick={handleSendTestEmail}
                      disabled={composing}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-md transition duration-200"
                    >
                      {composing ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>

                {/* Send Newsletter Section */}
                <div className="border-t pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleSendNewsletter}
                      disabled={composing}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
                    >
                      {composing ? 'Sending Newsletter...' : `Send Newsletter to ${stats?.activeSubscribers || 0} Active Subscribers`}
                    </button>
                    <button
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition duration-200"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.reduce((sum, n) => sum + n.sentCount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EyeIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Opens</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.reduce((sum, n) => sum + n.openCount, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Click Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.length > 0 
                        ? ((newsletters.reduce((sum, n) => sum + n.clickCount, 0) / newsletters.reduce((sum, n) => sum + n.sentCount, 0)) * 100).toFixed(1)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {newsletters.filter(n => {
                        const sentDate = new Date(n.sentAt || n.createdAt);
                        const now = new Date();
                        return sentDate.getMonth() === now.getMonth() && sentDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {newsletters.filter(n => n.status === 'sent').map((newsletter) => (
                      <tr key={newsletter.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {newsletter.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.sentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.openCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.sentCount > 0 
                            ? ((newsletter.openCount / newsletter.sentCount) * 100).toFixed(1)
                            : 0
                          }%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.clickCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {newsletter.sentCount > 0 
                            ? ((newsletter.clickCount / newsletter.sentCount) * 100).toFixed(1)
                            : 0
                          }%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {newsletter.sentAt 
                            ? new Date(newsletter.sentAt).toLocaleDateString()
                            : new Date(newsletter.createdAt).toLocaleDateString()
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {newsletters.filter(n => n.status === 'sent').length === 0 && (
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign data</h3>
                  <p className="mt-1 text-sm text-gray-500">Send some newsletters to see analytics here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Subscriber</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newSubscriber.email}
                    onChange={(e) => setNewSubscriber(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="subscriber@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newSubscriber.firstName}
                    onChange={(e) => setNewSubscriber(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newSubscriber.lastName}
                    onChange={(e) => setNewSubscriber(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSubscriber({ email: '', firstName: '', lastName: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubscriber}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200"
                >
                  Add Subscriber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {showEditModal && editingSubscriber && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Subscriber</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editingSubscriber.email}
                    onChange={(e) => setEditingSubscriber(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingSubscriber.firstName}
                    onChange={(e) => setEditingSubscriber(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingSubscriber.lastName}
                    onChange={(e) => setEditingSubscriber(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSubscriber.isActive}
                      onChange={(e) => setEditingSubscriber(prev => prev ? ({ ...prev, isActive: e.target.checked }) : null)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active subscriber</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSubscriber(null);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubscriber}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200"
                >
                  Update Subscriber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}