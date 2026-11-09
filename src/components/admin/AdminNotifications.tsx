import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Send, 
  History, 
  Settings2, 
  Users, 
  Smartphone, 
  Globe,
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationSetting {
  key: string;
  enabled: boolean;
}

export const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, settingsRes] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('notification_settings').select('*')
      ]);

      if (historyRes.error) throw historyRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setHistory(historyRes.data || []);
      setSettings(settingsRes.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !message) {
      toast({ title: 'Missing info', description: 'Please enter title and message', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // 1. Save to notification history
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          target_url: targetUrl || '/',
          type: 'manual'
        });

      if (insertError) throw insertError;

      // 2. Trigger push notification edge function (placeholder for now)
      // In a real implementation, we would call an edge function that iterates through push_subscriptions
      // await supabase.functions.invoke('send-push-notification', {
      //   body: { title, message, targetUrl, targetGroup }
      // });

      toast({ title: 'Success', description: 'Notification sent successfully' });
      setTitle('');
      setMessage('');
      setTargetUrl('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const toggleSetting = async (key: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ enabled })
        .eq('key', key);

      if (error) throw error;
      setSettings(settings.map(s => s.key === key ? { ...s, enabled } : s));
      toast({ title: 'Setting updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Notification */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Send className="text-primary" size={24} />
            <h3 className="text-lg font-semibold">Send Custom Notification</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Arrivals!" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Check out our latest collection..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Target URL (Optional)</Label>
              <Input id="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="/shop" />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Users', icon: Users },
                  { id: 'web', label: 'Web Only', icon: Globe },
                  { id: 'android', label: 'App Only', icon: Smartphone }
                ].map(group => (
                  <Button 
                    key={group.id}
                    variant={targetGroup === group.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetGroup(group.id)}
                    className="gap-2"
                  >
                    <group.icon size={14} /> {group.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="text-primary" size={24} />
            <h3 className="text-lg font-semibold">Automation Settings</h3>
          </div>
          <div className="space-y-6">
            {settings.map(setting => (
              <div key={setting.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="capitalize">{setting.key.replace(/_/g, ' ')}</Label>
                  <p className="text-xs text-muted-foreground">Automatically notify users when this happens</p>
                </div>
                <Switch 
                  checked={setting.enabled} 
                  onCheckedChange={(val) => toggleSetting(setting.key, val)} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Notification History</h3>
        </div>
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No history available</div>
          ) : (
            history.map(item => (
              <div key={item.id} className="p-4 rounded-lg border border-border flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.title}</span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded uppercase">{item.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock size={12} /> {format(new Date(item.created_at), 'PPp')}
                  </div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
