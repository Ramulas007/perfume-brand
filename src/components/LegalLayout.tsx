import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { useLegalPage } from '@/hooks/useLegalPage';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

interface LegalLayoutProps {
  slug: string;
  fallbackTitle: string;
  eyebrow: string;
  icon: LucideIcon;
  accent: string; // tailwind gradient classes e.g. "from-amber-500 to-rose-500"
  children?: ReactNode;
}

export const LegalLayout = ({ slug, fallbackTitle, eyebrow, icon: Icon, accent }: LegalLayoutProps) => {
  const { page, loading } = useLegalPage(slug);
  const navigate = useNavigate();

  const updated = page?.last_updated
    ? new Date(page.last_updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Editorial Hero */}
        <section className="relative overflow-hidden border-b border-border bg-[#0d0d0d] text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a1a] to-[#2a2a2a]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/[0.01] blur-3xl" />

          <div className="container relative mx-auto px-4 py-20 md:py-28">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[10px] tracking-[0.25em] uppercase font-medium`}>
                  <Sparkles className="w-3 h-3" />
                  {eyebrow}
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Updated {updated}
                </span>
              </div>

              <div className="flex items-start gap-6">
                <div className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-2xl shadow-black/40`}>
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                    {page?.title || fallbackTitle}
                  </h1>
                  <div className={`h-px w-24 mt-6 bg-gradient-to-r ${accent}`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-8 -ml-3 text-muted-foreground hover:text-foreground group"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>

            <article className="relative">
              {/* Decorative side rail */}
              <div className={`hidden md:block absolute -left-8 top-2 bottom-2 w-px bg-gradient-to-b ${accent} opacity-30`} />

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                  <p className="text-xs tracking-widest uppercase text-muted-foreground">Loading document</p>
                </div>
              ) : page ? (
                <div
                  className="prose prose-neutral max-w-none
                    prose-headings:font-heading prose-headings:tracking-tight
                    prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-3
                    prose-p:text-foreground/80 prose-p:leading-[1.85] prose-p:text-[15px]
                    prose-li:text-foreground/80 prose-li:leading-[1.85] prose-li:my-1
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-a:text-foreground prose-a:underline prose-a:decoration-foreground/30 prose-a:underline-offset-4 hover:prose-a:decoration-foreground
                    prose-ul:my-4 prose-ol:my-4
                    prose-blockquote:border-l-2 prose-blockquote:border-foreground prose-blockquote:bg-muted/40 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:rounded-r-md
                    prose-hr:border-border"
                >
                  <ReactMarkdown>{page.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-border rounded-2xl">
                  <h2 className="font-heading text-2xl font-bold mb-2">Document Missing</h2>
                  <p className="text-muted-foreground text-sm">This legal document hasn't been created yet.</p>
                </div>
              )}
            </article>

            {/* Footer note */}
            {page && !loading && (
              <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs tracking-wider uppercase text-muted-foreground">
                  Helpful Perfumes · Legal · {eyebrow}
                </p>
                <Link to="/contact" className="text-xs tracking-wider uppercase text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground">
                  Questions? Contact us →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <CartSidebar />
      <Footer />
    </div>
  );
};
