import { useEffect, useState } from 'react';
import { Shield, UserPlus, Trash2, Users, Crown, Mail, Phone, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  role: string | null;
  role_granted_at: string | null;
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [customers, setCustomers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const rows = (data || []) as UserRow[];
      setAdmins(rows.filter((row) => row.role === 'admin'));
      setCustomers(rows.filter((row) => row.role !== 'admin'));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addAdmin = async (emailOverride?: string) => {
    const email = (emailOverride || newEmail).trim();
    if (!email) return;
    setAdding(true);
    const { error } = await supabase.rpc('admin_add_role_by_email', {
      _email: email,
    });
    setAdding(false);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Admin added', description: email });
    setNewEmail('');
    load();
  };

  const removeAdmin = async (u: UserRow) => {
    if (!confirm(`Remove admin access from ${u.email}?`)) return;
    const { error } = await supabase.rpc('admin_remove_role', {
      _user_id: u.id,
    });
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Removed', description: u.email || '' });
    load();
  };

  const filteredCustomers = customers.filter(c =>
    !search ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} className="text-primary" /> User Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Admin add/remove করুন এবং সব registered user দেখুন।
        </p>
      </div>

      {/* Add admin */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Add New Admin</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          User কে আগে website-এ signup করতে হবে। তারপর তার email দিয়ে admin করুন।
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
          />
          <Button onClick={() => addAdmin()} disabled={adding || !newEmail.trim()}>
            {adding ? 'Adding...' : 'Make Admin'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admins" className="gap-2">
            <Crown size={16} /> Admins ({admins.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users size={16} /> Customers ({customers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">কোনো admin নেই</div>
            ) : (
              <div className="divide-y divide-border">
                {admins.map((a) => (
                  <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                      {(a.full_name || a.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{a.full_name || 'Unnamed'}</span>
                        {a.id === user?.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">YOU</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium uppercase">{a.provider}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1"><Mail size={12} />{a.email || '—'}</span>
                        {a.phone && <span className="flex items-center gap-1"><Phone size={12} />{a.phone}</span>}
                        <span className="flex items-center gap-1"><Shield size={12} />Admin since {fmt(a.role_granted_at)}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} />Joined {fmt(a.created_at)}</span>
                        <span>Last login: {fmt(a.last_sign_in_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdmin(a)}
                      disabled={a.id === user?.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="mb-3 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">কোনো customer পাওয়া যায়নি</div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center font-semibold flex-shrink-0">
                      {(c.full_name || c.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{c.full_name || 'Unnamed'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium uppercase">{c.provider}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1"><Mail size={12} />{c.email || '—'}</span>
                        {c.phone && <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                        <span className="flex items-center gap-1"><Calendar size={12} />Joined {fmt(c.created_at)}</span>
                        <span>Last login: {fmt(c.last_sign_in_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAdmin(c.email || '')}
                    >
                      <Crown size={14} className="mr-1" /> Make Admin
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
