import React, { useEffect, useState } from 'react';
import { Search, Plus, Link as LinkIcon, Unlink } from 'lucide-react';
import { Header } from '../components/Header';
import { EmailTable } from '../components/EmailTable';
import { ComposeModal } from '../components/ComposeModal';
import { Tabs } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authApi, emailApi, slackApi } from '../api';
import toast from 'react-hot-toast';
import type { User, Email, SlackStatus } from '../types';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [slackStatus, setSlackStatus] = useState<SlackStatus>({ connected: false });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchSlackStatus();
    const interval = setInterval(fetchEmails, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch (error) {
      window.location.href = '/';
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      if (activeTab === 'scheduled') {
        const res = await emailApi.getScheduled();
        setScheduledEmails(res.data.emails);
      } else {
        const res = await emailApi.getSent();
        setSentEmails(res.data.emails);
      }
    } catch (error) {
      toast.error('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlackStatus = async () => {
    try {
      const res = await slackApi.getStatus();
      setSlackStatus(res.data);
    } catch (error) {
      // Ignore
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.href = '/';
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await emailApi.search(searchQuery);
      setSearchResults(res.data.emails);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSlackConnect = () => {
    slackApi.connect();
  };

  const handleSlackDisconnect = async () => {
    try {
      await slackApi.disconnect();
      setSlackStatus({ connected: false });
      toast.success('Slack disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Slack');
    }
  };

  if (!user) return null;

  const displayEmails = searchQuery ? searchResults : (activeTab === 'scheduled' ? scheduledEmails : sentEmails);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            {slackStatus.connected ? (
              <Button variant="secondary" onClick={handleSlackDisconnect}>
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect Slack
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleSlackConnect}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Slack
              </Button>
            )}
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Compose New Email
            </Button>
          </div>
        </div>

        {!searchQuery && (
          <Tabs
            tabs={[
              { id: 'scheduled', label: 'Scheduled Emails' },
              { id: 'sent', label: 'Sent Emails' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        <div className="mt-6">
          <EmailTable
            emails={displayEmails}
            loading={loading || searching}
          />
        </div>
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onScheduled={fetchEmails}
      />
    </div>
  );
};
