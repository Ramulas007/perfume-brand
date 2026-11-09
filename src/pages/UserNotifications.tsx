import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trash2, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  target_url: string;
}

const UserNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
      toast({ title: 'Deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Bell size={32} className="text-primary" />
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border">
              <Inbox size={48} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium text-muted-foreground">No notifications yet</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll notify you when something important happens.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(item => (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-xl border transition-all ${item.is_read ? 'bg-card border-border opacity-70' : 'bg-primary/5 border-primary/20'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{item.title}</span>
                        {!item.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-foreground/80">{item.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                        <Clock size={12} /> {format(new Date(item.created_at), 'PPp')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!item.is_read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => markAsRead(item.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteNotification(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserNotifications;
