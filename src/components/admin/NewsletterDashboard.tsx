'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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

export default function NewsletterDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'campaigns' | 'compose'>('overview');
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compose newsletter state
  const [composeData, setComposeData] = useState({
    subject: '',
    htmlContent: '',
    textContent: '',
    testEmail: '',
  });
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
      fetchSubscribers();
      fetchNewsletters();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    }
  };

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletter/send');
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (err) {
      console.error('Failed to fetch newsletters:', err);
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
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...composeData,
        }),
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
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeData.subject,
          htmlContent: composeData.htmlContent,
          textContent: composeData.textContent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setError(null);
        alert(`Newsletter sent successfully! Sent: ${result.sent}, Failed: ${result.failed}`);
        setComposeData({ subject: '', htmlContent: '', textContent: '', testEmail: '' });
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

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access the newsletter dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'subscribers', name: 'Subscribers', icon: '👥' },
              { id: 'campaigns', name: 'Campaigns', icon: '📧' },
              { id: 'compose', name: 'Compose', icon: '✍️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Subscribers ({subscribers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Newsletter Campaigns</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {newsletters.map((newsletter) => (
                    <tr key={newsletter.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{newsletter.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          newsletter.status === 'sent' ? 'bg-green-100 text-green-800' :
                          newsletter.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                          newsletter.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {newsletter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{newsletter.sentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{newsletter.openCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{newsletter.clickCount}</td>
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
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Compose Newsletter</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
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
                <label htmlFor="htmlContent" className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  id="htmlContent"
                  rows={12}
                  value={composeData.htmlContent}
                  onChange={(e) => setComposeData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter HTML content... You can use {{UNSUBSCRIBE_URL}} placeholder for unsubscribe links."
                />
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

              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Test Email Address
                    </label>
                    <input
                      type="email"
                      id="testEmail"
                      value={composeData.testEmail}
                      onChange={(e) => setComposeData(prev => ({ ...prev, testEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSendTestEmail}
                      disabled={composing}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-md transition duration-200"
                    >
                      {composing ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={handleSendNewsletter}
                  disabled={composing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
                >
                  {composing ? 'Sending Newsletter...' : `Send Newsletter to ${stats?.activeSubscribers || 0} Active Subscribers`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}