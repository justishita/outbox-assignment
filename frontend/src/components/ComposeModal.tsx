import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';
import { emailApi } from '../api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onScheduled }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delayBetween, setDelayBetween] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('50');
  const [loading, setLoading] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);

  const parseRecipients = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches)]; // Dedupe
  };

  const handleRecipientsChange = (value: string) => {
    setRecipients(value);
    const emails = parseRecipients(value);
    setDetectedCount(emails.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emails = parseRecipients(recipients);
    if (emails.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    if (!subject || !body || !startTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await emailApi.schedule({
        subject,
        body,
        recipients: emails,
        startTime,
        delayBetweenMs: parseInt(delayBetween) * 1000,
        hourlyLimit: parseInt(hourlyLimit),
      });
      toast.success(`Scheduled ${emails.length} emails`);
      onClose();
      onScheduled();
      // Reset form
      setSubject('');
      setBody('');
      setRecipients('');
      setStartTime('');
      setDetectedCount(0);
    } catch (error) {
      toast.error('Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  // Set default start time to now + 1 minute
  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      setStartTime(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compose New Email</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
            <textarea
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-peacock-cyan focus:border-transparent outline-none transition-all min-h-[120px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipients (CSV or paste emails)
            </label>
            <textarea
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-peacock-cyan focus:border-transparent outline-none transition-all min-h-[80px]"
              value={recipients}
              onChange={(e) => handleRecipientsChange(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
            />
            {detectedCount > 0 && (
              <p className="text-sm text-peacock-cyan">{detectedCount} emails detected</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="Delay Between Emails (seconds)"
              type="number"
              min="1"
              value={delayBetween}
              onChange={(e) => setDelayBetween(e.target.value)}
              required
            />
          </div>

          <Input
            label="Hourly Limit per Sender"
            type="number"
            min="1"
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Scheduling...' : 'Schedule Emails'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
