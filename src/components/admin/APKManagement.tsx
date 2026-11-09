import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toCdnUrl } from '@/lib/cdn';
import { 
  Smartphone, 
  Upload, 
  Download, 
  Trash2, 
  History, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  HardDrive
} from 'lucide-react';
import { format } from 'date-fns';

interface APKRecord {
  id: string;
  apk_url: string;
  version: string;
  release_notes: string | null;
  file_size: number | null;
  is_active: boolean;
  uploaded_at: string;
}

export const APKManagement = () => {
  const [apks, setApks] = useState<APKRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAPKs();
  }, []);

  const fetchAPKs = async () => {
    try {
      const { data, error } = await supabase
        .from('apk_management')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setApks(data || []);
    } catch (error: any) {
      console.error('Error fetching APKs:', error);
      toast({ title: 'Error', description: 'Failed to load APK history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !version) {
      if (!version) toast({ title: 'Missing Version', description: 'Please enter a version number first', variant: 'destructive' });
      return;
    }

    if (!file.name.endsWith('.apk')) {
      toast({ title: 'Invalid File', description: 'Please upload a valid .apk file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `static-vibes-v${version.replace(/\./g, '-')}-${Date.now()}.apk`;
      const { error: uploadError } = await supabase.storage
        .from('apks')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('apks').getPublicUrl(fileName);

      // Set all other APKs as inactive
      await supabase
        .from('apk_management')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new APK record
      const { error: insertError } = await supabase
        .from('apk_management')
        .insert({
          apk_url: toCdnUrl(publicUrl),
          version,
          release_notes: releaseNotes,
          file_size: file.size,
          is_active: true
        });

      if (insertError) throw insertError;

      toast({ title: 'Success', description: 'APK uploaded and activated successfully' });
      setVersion('');
      setReleaseNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAPKs();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const deleteAPK = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this APK?')) return;

    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('apks').remove([fileName]);
      }

      const { error } = await supabase
        .from('apk_management')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'APK removed successfully' });
      fetchAPKs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Upload New APK</h3>
        </div>

        <div className="grid gap-6 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="version">APK Version (e.g., 1.0.0)</Label>
            <Input 
              id="version" 
              value={version} 
              onChange={(e) => setVersion(e.target.value)} 
              placeholder="1.0.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Release Notes</Label>
            <Textarea 
              id="notes" 
              value={releaseNotes} 
              onChange={(e) => setReleaseNotes(e.target.value)} 
              placeholder="What's new in this version?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>APK File</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors"
            >
              <Smartphone size={24} className="text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to select APK file</p>
                <p className="text-xs text-muted-foreground">Standard Android APK file</p>
              </div>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".apk" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>

          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading || !version}
            className="w-full md:w-auto"
          >
            {uploading ? 'Uploading...' : 'Upload & Activate APK'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">APK History</h3>
        </div>

        <div className="space-y-4">
          {apks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No APKs uploaded yet.
            </div>
          ) : (
            apks.map((apk) => (
              <div 
                key={apk.id} 
                className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${apk.is_active ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">v{apk.version}</span>
                    {apk.is_active && (
                      <span className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(apk.uploaded_at), 'PPP')}</span>
                    <span className="flex items-center gap-1"><HardDrive size={12} /> {formatFileSize(apk.file_size)}</span>
                  </div>
                  {apk.release_notes && (
                    <p className="text-sm text-muted-foreground mt-2 border-l-2 border-border pl-3 italic">
                      {apk.release_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={apk.apk_url} download>
                      <Download size={14} className="mr-2" /> Download
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteAPK(apk.id, apk.apk_url)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};