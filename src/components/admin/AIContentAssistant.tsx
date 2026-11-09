import { useState, useEffect } from 'react';
import {
  Sparkles, Wand2, FileText, Hash, Search, Share2, Zap,
  Star, MessageCircle, Loader2, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type Task =
  | 'description_short' | 'description_long' | 'description_seo'
  | 'title_enhance' | 'title_variations'
  | 'tags'
  | 'seo_title' | 'seo_meta' | 'seo_keywords'
  | 'social_facebook' | 'social_instagram' | 'social_promo'
  | 'flash_title' | 'flash_description'
  | 'review_summary' | 'query_summary';

interface AIContentAssistantProps {
  productName: string;
  productCategory: string;
  productDescription?: string;
  onInsertDescription?: (text: string) => void;
  onInsertName?: (text: string) => void;
  dailyLimit?: number;
  monthlyLimit?: number;
}

interface GroupDef {
  id: string;
  icon: any;
  title: string;
  color: string;
  tasks: { key: Task; label: string; needsExtra?: boolean; extraPlaceholder?: string; insertTo?: 'name' | 'description' }[];
}

const GROUPS: GroupDef[] = [
  {
    id: 'desc', icon: FileText, title: 'Product Description Generator', color: 'text-blue-600',
    tasks: [
      { key: 'description_short', label: 'Short Description', insertTo: 'description' },
      { key: 'description_long', label: 'Long Description', insertTo: 'description' },
      { key: 'description_seo', label: 'SEO Description', insertTo: 'description' },
    ],
  },
  {
    id: 'title', icon: Wand2, title: 'Product Title Enhancer', color: 'text-purple-600',
    tasks: [
      { key: 'title_enhance', label: 'Enhance Title', insertTo: 'name' },
      { key: 'title_variations', label: '5 Title Variations' },
    ],
  },
  {
    id: 'tags', icon: Hash, title: 'Product Tags Generator', color: 'text-emerald-600',
    tasks: [{ key: 'tags', label: 'Generate Tags' }],
  },
  {
    id: 'seo', icon: Search, title: 'SEO Assistant', color: 'text-amber-600',
    tasks: [
      { key: 'seo_title', label: 'SEO Title' },
      { key: 'seo_meta', label: 'Meta Description' },
      { key: 'seo_keywords', label: 'Focus Keywords' },
    ],
  },
  {
    id: 'social', icon: Share2, title: 'Social Media Caption', color: 'text-pink-600',
    tasks: [
      { key: 'social_facebook', label: 'Facebook' },
      { key: 'social_instagram', label: 'Instagram' },
      { key: 'social_promo', label: 'Promotional' },
    ],
  },
  {
    id: 'flash', icon: Zap, title: 'Flash Sale Content', color: 'text-orange-600',
    tasks: [
      { key: 'flash_title', label: 'Flash Title' },
      { key: 'flash_description', label: 'Flash Description' },
    ],
  },
  {
    id: 'reviews', icon: Star, title: 'Review Summary', color: 'text-yellow-600',
    tasks: [{ key: 'review_summary', label: 'Summarize Reviews', needsExtra: true, extraPlaceholder: 'Paste customer reviews here...' }],
  },
  {
    id: 'query', icon: MessageCircle, title: 'Customer Query Summarizer', color: 'text-cyan-600',
    tasks: [{ key: 'query_summary', label: 'Generate FAQ', needsExtra: true, extraPlaceholder: 'Paste customer questions...' }],
  },
];

const stringifySafe = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getObjectMessage = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value?.message === 'string') return value.message;
  if (typeof value?.error === 'string') return value.error;
  if (typeof value?.details === 'string') return value.details;
  return stringifySafe(value);
};

const getFunctionErrorMessage = async (error: any) => {
  const fallback = getObjectMessage(error) || 'AI request failed';
  const context = error?.context;

  if (context instanceof Response) {
    try {
      const bodyText = await context.clone().text();
      if (!bodyText) return fallback;
      try {
        const parsed = JSON.parse(bodyText);
        return getObjectMessage(parsed) || bodyText;
      } catch {
        return bodyText;
      }
    } catch (readError) {
      console.error('[AI Content Error Body Read]', {
        error: readError,
        type: typeof readError,
        constructor: (readError as any)?.constructor?.name,
      });
      return fallback;
    }
  }

  if (typeof context === 'string') return context || fallback;
  if (context?.body && typeof context.body === 'object') return getObjectMessage(context.body) || fallback;
  if (typeof context?.body === 'string') return context.body;
  return fallback;
};

export const AIContentAssistant = ({
  productName, productCategory, productDescription,
  onInsertDescription, onInsertName,
  dailyLimit = 100, monthlyLimit = 1000,
}: AIContentAssistantProps) => {
  const { toast } = useToast();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ desc: true });
  const [loadingTask, setLoadingTask] = useState<Task | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [usage, setUsage] = useState({ daily: 0, monthly: 0 });

  useEffect(() => { fetchUsage(); }, []);

  const fetchUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [{ count: daily }, { count: monthly }] = await Promise.all([
      supabase.from('ai_generation_logs').select('*', { count: 'exact', head: true })
        .eq('admin_id', user.id).gte('created_at', dayStart),
      supabase.from('ai_generation_logs').select('*', { count: 'exact', head: true })
        .eq('admin_id', user.id).gte('created_at', monthStart),
    ]);
    setUsage({ daily: daily || 0, monthly: monthly || 0 });
  };

  const handleGenerate = async (task: Task) => {
    if (!productName.trim()) {
      toast({ title: 'Product name required', description: 'Enter a product name first.', variant: 'destructive' });
      return;
    }
    if (usage.daily >= dailyLimit) {
      toast({ title: 'Daily limit reached', variant: 'destructive' });
      return;
    }
    setLoadingTask(task);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-assistant', {
        body: {
          task,
          context: {
            name: productName,
            category: productCategory || 'General',
            description: productDescription,
            extra: extras[task],
          },
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if (data?.success === false || data?.error) throw new Error(getObjectMessage(data) || 'AI returned an error.');
      setResults((r) => ({ ...r, [task]: data.content }));
      fetchUsage();
    } catch (e: any) {
      console.error('[AI Content Generate]', {
        error: e,
        type: typeof e,
        constructor: e?.constructor?.name,
      });
      toast({ title: 'AI Error', description: getObjectMessage(e), variant: 'destructive' });
    } finally {
      setLoadingTask(null);
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleGroup = (id: string) => setOpenGroups((g) => ({ ...g, [id]: !g[id] }));

  const dailyPct = Math.min(100, (usage.daily / dailyLimit) * 100);
  const monthlyPct = Math.min(100, (usage.monthly / monthlyLimit) * 100);

  return (
    <div className="border border-border rounded-xl bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">AI Content Assistant</h3>
            <p className="text-xs text-muted-foreground">Generate professional product content instantly</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1"><TrendingUp size={12} />{usage.daily}/{dailyLimit} today</Badge>
      </div>

      {/* Usage dashboard */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-border bg-card/30">
        <div className="space-y-1">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Daily Usage</span><span className="font-semibold">{usage.daily}/{dailyLimit}</span></div>
          <Progress value={dailyPct} className="h-1.5" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Monthly Usage</span><span className="font-semibold">{usage.monthly}/{monthlyLimit}</span></div>
          <Progress value={monthlyPct} className="h-1.5" />
        </div>
      </div>

      {/* Groups */}
      <div className="divide-y divide-border">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups[group.id];
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={group.color} />
                  <span className="font-medium text-sm">{group.title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 space-y-3">
                      {group.tasks.map((t) => {
                        const result = results[t.key];
                        const loading = loadingTask === t.key;
                        return (
                          <div key={t.key} className="bg-card border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-medium">{t.label}</span>
                              <div className="flex gap-1">
                                <Button
                                  type="button" size="sm" variant="outline"
                                  onClick={() => handleGenerate(t.key)} disabled={loading}
                                  className="h-7 text-xs gap-1"
                                >
                                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                  {result ? 'Regenerate' : 'Generate'}
                                </Button>
                              </div>
                            </div>
                            {t.needsExtra && (
                              <Textarea
                                placeholder={t.extraPlaceholder}
                                value={extras[t.key] || ''}
                                onChange={(e) => setExtras((x) => ({ ...x, [t.key]: e.target.value }))}
                                rows={2} className="text-xs"
                              />
                            )}
                            {result && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-secondary/30 rounded-md p-2 space-y-2">
                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{result}</p>
                                <div className="flex gap-1 flex-wrap">
                                  <Button type="button" size="sm" variant="ghost"
                                    onClick={() => copy(t.key, result)} className="h-6 text-[10px] gap-1">
                                    {copiedKey === t.key ? <Check size={10} /> : <Copy size={10} />}
                                    {copiedKey === t.key ? 'Copied' : 'Copy'}
                                  </Button>
                                  {t.insertTo === 'description' && onInsertDescription && (
                                    <Button type="button" size="sm" variant="ghost"
                                      onClick={() => { onInsertDescription(result); toast({ title: 'Inserted into Description' }); }}
                                      className="h-6 text-[10px]">Insert → Description</Button>
                                  )}
                                  {t.insertTo === 'name' && onInsertName && (
                                    <Button type="button" size="sm" variant="ghost"
                                      onClick={() => { onInsertName(result); toast({ title: 'Inserted into Name' }); }}
                                      className="h-6 text-[10px]">Insert → Name</Button>
                                  )}
                                  <Button type="button" size="sm" variant="ghost"
                                    onClick={() => handleGenerate(t.key)} className="h-6 text-[10px] gap-1">
                                    <RefreshCw size={10} /> Regenerate
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
