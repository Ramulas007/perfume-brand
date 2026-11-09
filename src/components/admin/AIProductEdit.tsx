import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface AIProductEditProps {
  open: boolean;
  onClose: () => void;
  product: { id: string; name: string; image_url: string | null } | null;
  onUpdated?: () => void;
}

const SUGGESTIONS = [
  'Name ta aro catchy koro',
  'Price 10% komao and discount badge add koro',
  'Description Bangla te likho, premium tone e',
  'Stock out kore dao',
  'Badge "Best Seller" set koro maroon color e',
];

export const AIProductEdit = ({ open, onClose, product, onUpdated }: AIProductEditProps) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPatch, setLastPatch] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  const run = async () => {
    if (!product || !prompt.trim()) return;
    setLoading(true);
    setLastPatch(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-edit', {
        body: { productId: product.id, prompt: prompt.trim() },
      });
      if (error) throw error;
      if (!data?.success) {
        toast({
          title: 'AI could not update',
          description: data?.message || 'Try a more specific instruction.',
          variant: 'destructive',
        });
        return;
      }
      setLastPatch(data.patch || {});
      toast({ title: 'Product updated by AI', description: `${Object.keys(data.patch || {}).length} field(s) changed.` });
      setPrompt('');
      onUpdated?.();
    } catch (e: any) {
      toast({ title: 'AI edit failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            AI Edit Product
          </DialogTitle>
          <DialogDescription>
            Bolun ki change korte chan — AI apnar prompt onujayi product edit kore dibe.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
            )}
            <div className="text-sm font-medium truncate">{product.name}</div>
          </div>
        )}

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Ex: "Name aro attractive koro, price 1200 kore dao, description Bangla te likho"'
          rows={4}
          disabled={loading}
        />

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {lastPatch && Object.keys(lastPatch).length > 0 && (
          <div className="text-xs bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded p-2">
            <div className="font-semibold mb-1">Changed:</div>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastPatch, null, 2)}</pre>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X size={14} className="mr-1" /> Close
          </Button>
          <Button onClick={run} disabled={loading || !prompt.trim()}>
            {loading ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Editing…</>
            ) : (
              <><Sparkles size={14} className="mr-1" /> Apply with AI</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
