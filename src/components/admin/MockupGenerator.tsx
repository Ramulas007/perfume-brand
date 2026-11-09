import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Sparkles, Wand2, Package, Check, 
  ChevronRight, AlertCircle, ShoppingBag, 
  Info, ShieldCheck, Trash2, 
  ArrowRight, Search, FileText, Image as ImageIcon,
  Loader2, Calculator, Save, Eye, Download, X,
  Layers, Maximize2, Move, Settings2,
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  RotateCcw, RotateCw, AlignCenter, AlignJustify, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JSZip from 'jszip';

interface MockupFile {
  file: File;
  preview: string;
  name: string;
}

interface DesignFile {
  file: File;
  preview: string;
  name: string;
}

interface GeneratedMockup {
  id: string;
  url: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const stringifySafe = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getErrorMessage = async (error: any) => {
  const fallback =
    typeof error === 'string'
      ? error
      : error?.message || error?.error || stringifySafe(error) || 'Mockup generation failed';

  const context = error?.context;
  if (context instanceof Response) {
    try {
      const bodyText = await context.clone().text();
      if (!bodyText) return fallback;
      try {
        const parsed = JSON.parse(bodyText);
        return parsed?.message || parsed?.error || parsed?.details || bodyText;
      } catch {
        return bodyText;
      }
    } catch (readError) {
      console.error('[MockupGen] Error body read failed', {
        error: readError,
        type: typeof readError,
        constructor: (readError as any)?.constructor?.name,
      });
      return fallback;
    }
  }

  if (typeof context === 'string') return context || fallback;
  if (context?.body && typeof context.body === 'object') return context.body?.message || context.body?.error || stringifySafe(context.body);
  if (typeof context?.body === 'string') return context.body;
  return fallback;
};


export const MockupGenerator = () => {
  const [mockups, setMockups] = useState<MockupFile[]>([]);
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedMockup[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  
  // Settings
  const [printSize, setPrintSize] = useState([40]);
  const [rotation, setRotation] = useState([0]);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Percentage
  const [curvature, setCurvature] = useState([0]);
  const [opacity, setOpacity] = useState([100]);
  const [warp, setWarp] = useState([0]);
  const [viewType, setViewType] = useState('front');

  // Usage tracking
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lastGenAt, setLastGenAt] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const [{ count: today }, { count: total }, { data: latest }] = await Promise.all([
        supabase
          .from('ai_generation_logs')
          .select('id', { count: 'exact', head: true })
          .eq('result_status', 'success')
          .gte('created_at', startOfDay.toISOString()),
        supabase
          .from('ai_generation_logs')
          .select('id', { count: 'exact', head: true })
          .eq('result_status', 'success'),
        supabase
          .from('ai_generation_logs')
          .select('created_at')
          .eq('result_status', 'success')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setTodayCount(today ?? 0);
      setTotalCount(total ?? 0);
      setLastGenAt(latest?.created_at ?? null);
    } catch (e) {
      console.warn('fetchUsage failed', e);
    }
  };

  useEffect(() => {
    fetchUsage();
    // Reset at midnight (re-fetch)
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(fetchUsage, msUntilMidnight + 1000);
    return () => clearTimeout(t);
  }, []);

  const logGeneration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('ai_generation_logs').insert({
        admin_id: user.id,
        prompt_used: 'mockup-generator',
        result_status: 'success',
      });
    } catch (e) {
      console.warn('logGeneration failed', e);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);

  const mockupInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();


  const handleMockupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMockups = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setMockups(prev => [...prev, ...newMockups]);
    if (activeStep === 1 && newMockups.length > 0) setActiveStep(2);
  };

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDesigns = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setDesigns(prev => [...prev, ...newDesigns]);
    if (activeStep === 2 && newDesigns.length > 0) setActiveStep(3);
  };

  const removeMockup = (index: number) => {
    setMockups(prev => prev.filter((_, i) => i !== index));
  };

  const removeDesign = (index: number) => {
    setDesigns(prev => prev.filter((_, i) => i !== index));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const nudge = (dx: number, dy: number) => {
    setPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + dx)),
      y: Math.max(0, Math.min(100, prev.y + dy))
    }));
  };

  const applyPreset = (type: string) => {
    switch (type) {
      case 'center': setPosition({ x: 50, y: 45 }); setPrintSize([40]); break;
      case 'full': setPosition({ x: 50, y: 50 }); setPrintSize([80]); break;
      case 'pocket': setPosition({ x: 30, y: 35 }); setPrintSize([15]); break;
      case 'back': setPosition({ x: 50, y: 40 }); setPrintSize([45]); break;
      case 'sleeve': setPosition({ x: 80, y: 40 }); setPrintSize([20]); break;
    }
  };

  const handleGenerate = async () => {
    if (mockups.length === 0 || designs.length === 0) {
      toast({ title: "Files required", description: "Please upload both mockups and designs.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setActiveStep(4);
    
    try {
      const combinations = [];
      for (const mockup of mockups) {
        for (const design of designs) {
          combinations.push({ mockup, design });
        }
      }

      const generatedResults: GeneratedMockup[] = [];

      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];
        const comboId = `combo-${i}-${Date.now()}`;
        
        // Add pending result
        setResults(prev => [...prev, {
          id: comboId,
          url: '',
          name: `${combo.mockup.name}-${combo.design.name}`,
          status: 'processing'
        }]);

        try {
          console.group(`[MockupGen] Combination ${i + 1}/${combinations.length}`);
          console.log('Mockup file:', combo.mockup.name, combo.mockup.file.size, 'bytes');
          console.log('Design file:', combo.design.name, combo.design.file.size, 'bytes');

          const mockupB64 = await fileToBase64(combo.mockup.file);
          const designB64 = await fileToBase64(combo.design.file);
          console.log('Base64 lengths:', mockupB64.length, designB64.length);

          const requestBody = {
            mockupImage: mockupB64,
            designImage: designB64,
            settings: {
              printSize: printSize[0],
              position,
              rotation: rotation[0],
              curvature: curvature[0],
              opacity: opacity[0],
              warp: warp[0],
              viewType,
            },
          };
          console.log('Invoking edge function with settings:', requestBody.settings);

          const { data, error } = await supabase.functions.invoke('generate-mockup', {
            body: requestBody,
          });

          console.log('Response data:', data);
          console.log('Response error:', error);

          if (error) {
            throw new Error(await getErrorMessage(error));
          }

          if (data?.error) throw new Error(data.error);
          if (!data?.imageUrl) throw new Error('No image returned by AI');

          setResults((prev) =>
            prev.map((res) =>
              res.id === comboId ? { ...res, url: data.imageUrl, status: 'completed' } : res,
            ),
          );
          await logGeneration();
          setTodayCount((c) => c + 1);
          setTotalCount((c) => c + 1);
          setLastGenAt(new Date().toISOString());
          console.log('✅ Success');
          console.groupEnd();
        } catch (err: any) {
          const msg = err?.message || String(err);
          console.error(`❌ Error generating mockup ${i + 1}:`, err);
          console.error('Stack:', err?.stack);
          console.groupEnd();
          setResults((prev) =>
            prev.map((res) =>
              res.id === comboId ? { ...res, status: 'failed', error: msg } : res,
            ),
          );
        }
      }

      toast({ title: "Generation complete", description: `Successfully generated ${combinations.length} mockups.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completedResults = results.filter(r => r.status === 'completed');
    
    if (completedResults.length === 0) return;

    for (const res of completedResults) {
      const response = await fetch(res.url);
      const blob = await response.blob();
      zip.file(`${res.name}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mockups.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8 animate-pulse" />
            AI Mockup Generator
          </h2>
          <p className="text-muted-foreground mt-2">Professional mockups generated automatically using AI.</p>
        </div>
        {results.length > 0 && (
          <Button onClick={downloadAll} className="gap-2">
            <Download size={18} /> Download All (ZIP)
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mb-12">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                activeStep >= step ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {step < activeStep ? <Check size={20} /> : step}
            </div>
            {step < 4 && (
              <div className={`w-16 md:w-32 h-1 mx-2 rounded-full ${activeStep > step ? 'bg-primary' : 'bg-secondary'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Steps */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card rounded-2xl border border-border p-8 text-center"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Product Mockups</h3>
                  <p className="text-muted-foreground mb-8">Upload one or more blank product images (T-shirts, hoodies, mugs, etc.)</p>
                  
                  <div 
                    onClick={() => mockupInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Upload size={48} className="text-muted-foreground mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <p className="font-medium">Click to upload mockups</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <input type="file" ref={mockupInputRef} onChange={handleMockupUpload} className="hidden" multiple accept="image/*" />
                </div>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card rounded-2xl border border-border p-8 text-center"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wand2 size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Design Files</h3>
                  <p className="text-muted-foreground mb-8">Upload the designs you want to place on the products.</p>
                  
                  <div 
                    onClick={() => designInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Upload size={48} className="text-muted-foreground mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <p className="font-medium">Click to upload designs</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG, JPG</p>
                  </div>
                  <input type="file" ref={designInputRef} onChange={handleDesignUpload} className="hidden" multiple accept="image/*" />
                </div>
              </motion.div>
            )}

            {activeStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Settings2 size={18} className="text-primary" />
                    AI Generation Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Print Size ({printSize}%)</Label>
                          <span className="text-xs text-muted-foreground">Adjust scale</span>
                        </div>
                        <Slider 
                          value={printSize} 
                          onValueChange={setPrintSize} 
                          max={100} 
                          step={1} 
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Rotation ({rotation}°)</Label>
                        </div>
                        <Slider 
                          value={rotation} 
                          onValueChange={setRotation} 
                          min={-180}
                          max={180} 
                          step={1} 
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Fabric Curve ({curvature}%)</Label>
                        </div>
                        <Slider 
                          value={curvature} 
                          onValueChange={setCurvature} 
                          max={100} 
                          step={1} 
                          className="py-4"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Position Presets</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => applyPreset('center')}>Center</Button>
                            <Button size="sm" variant="outline" onClick={() => applyPreset('pocket')}>Pocket</Button>
                            <Button size="sm" variant="outline" onClick={() => applyPreset('back')}>Back</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Nudge</Label>
                          <div className="grid grid-cols-3 gap-1 w-24">
                            <div />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nudge(0, -1)}><ArrowUp size={14}/></Button>
                            <div />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nudge(-1, 0)}><ChevronLeftIcon size={14}/></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPosition({x: 50, y: 50})}><Move size={14}/></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nudge(1, 0)}><ChevronRightIcon size={14}/></Button>
                            <div />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nudge(0, 1)}><ArrowDown size={14}/></Button>
                            <div />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>View Type</Label>
                        <Select value={viewType} onValueChange={setViewType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select view" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="front">Front View</SelectItem>
                            <SelectItem value="back">Back View</SelectItem>
                            <SelectItem value="side">Side View</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle View</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Design Editor</h4>
                      <div 
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="aspect-[3/4] bg-white rounded-lg relative overflow-hidden flex items-center justify-center border border-border shadow-inner cursor-crosshair select-none"
                      >
                        {/* Print Safe Area */}
                        <div className="absolute inset-[15%] border-2 border-dashed border-primary/20 pointer-events-none rounded-lg" />
                        
                        {mockups[0] && (
                          <img src={mockups[0].preview} alt="Mockup" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
                        )}
                        
                        {designs[0] && (
                          <motion.div
                            style={{ 
                              position: 'absolute',
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                              width: `${printSize}%`,
                              x: '-50%',
                              y: '-50%',
                              rotate: rotation[0],
                              opacity: opacity[0] / 100,
                            }}
                            className="relative z-10"
                          >
                            <img 
                              src={designs[0].preview} 
                              alt="Design" 
                              className="w-full h-auto shadow-2xl"
                              style={{
                                filter: `drop-shadow(0 0 5px rgba(0,0,0,0.1))`,
                                // Simulating curve with perspective
                                transform: `perspective(500px) rotateX(${curvature[0] / 4}deg)`
                              }}
                            />
                            {/* Alignment guides when centered */}
                            {Math.abs(position.x - 50) < 1 && <div className="absolute top-[-1000%] bottom-[-1000%] left-1/2 w-px bg-primary/50 -translate-x-1/2" />}
                            {Math.abs(position.y - 50) < 1 && <div className="absolute left-[-1000%] right-[-1000%] top-1/2 h-px bg-primary/50 -translate-y-1/2" />}
                          </motion.div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-3">Drag design to reposition. Guides appear when centered.</p>
                  </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={generating}
                    className="w-full h-14 text-lg font-bold mt-8 gap-2 bg-gradient-to-r from-primary to-accent border-none shadow-xl hover:shadow-primary/20 disabled:opacity-60"
                  >
                    <Wand2 size={24} />
                    {`Generate ${mockups.length * designs.length} Mockups Now`}
                  </Button>
                </div>
              </motion.div>
            )}

            {activeStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((res) => (
                    <div key={res.id} className="bg-card rounded-xl border border-border overflow-hidden group shadow-sm hover:shadow-md transition-all">
                      <div className="aspect-square relative bg-secondary/30 flex items-center justify-center">
                        {res.status === 'processing' ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-primary" size={24} />
                            <span className="text-[10px] font-medium text-muted-foreground">AI Processing...</span>
                          </div>
                        ) : res.status === 'completed' ? (
                          <img src={res.url} alt={res.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-destructive p-2 text-center">
                            <AlertCircle size={20} />
                            <span className="text-[10px] font-bold">Failed</span>
                            {res.error && (
                              <span className="text-[9px] font-normal text-destructive/80 line-clamp-4 break-words" title={res.error}>
                                {res.error}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {res.status === 'completed' && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Button size="icon" variant="ghost" className="text-white" asChild>
                              <a href={res.url} download={`${res.name}.png`}>
                                <Download size={20} />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t border-border">
                        <p className="text-[10px] font-medium truncate" title={res.name}>{res.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!generating && results.length > 0 && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => { setResults([]); setActiveStep(1); setMockups([]); setDesigns([]); }} className="gap-2">
                      <Trash2 size={16} /> Reset & Start Over
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Files Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                Mockups ({mockups.length})
              </h3>
              <Button size="icon" variant="ghost" onClick={() => mockupInputRef.current?.click()} className="h-8 w-8">
                <Upload size={14} />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {mockups.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg group">
                  <img src={m.preview} className="w-10 h-10 rounded object-cover border border-border" />
                  <span className="text-xs truncate flex-1">{m.name}</span>
                  <button onClick={() => removeMockup(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {mockups.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 italic">No mockups uploaded</p>}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                Designs ({designs.length})
              </h3>
              <Button size="icon" variant="ghost" onClick={() => designInputRef.current?.click()} className="h-8 w-8">
                <Upload size={14} />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {designs.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg group">
                  <img src={d.preview} className="w-10 h-10 rounded object-cover border border-border bg-white" />
                  <span className="text-xs truncate flex-1">{d.name}</span>
                  <button onClick={() => removeDesign(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {designs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 italic">No designs uploaded</p>}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-primary" />
              <h3 className="font-semibold">Today's Usage</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Images Generated Today</span>
                <span className="font-semibold">{todayCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Generated (All Time)</span>
                <span className="font-semibold">{totalCount}</span>
              </div>
              <div className="pt-3 mt-2 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                <span>Last Generation</span>
                <span className="font-medium text-foreground">
                  {lastGenAt ? new Date(lastGenAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>


          {/* Quick Tips */}
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">

            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              Pro Tips
            </h3>
            <ul className="text-xs space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                Use high-resolution PNG designs with transparent backgrounds for best results.
              </li>
              <li className="flex gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                The AI automatically detects fabric wrinkles and lighting.
              </li>
              <li className="flex gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                Bulk generation handles all combinations of mockups and designs.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};