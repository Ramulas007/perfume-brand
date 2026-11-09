import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';
import { Users, Award, Truck, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';

const About = () => {
  const { aboutContent, loading } = usePageContent();

  const features = [
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Best quality fabric with perfect stitching',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Delivery in 3-5 days across 64 districts',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: ShieldCheck,
      title: 'Easy Returns',
      description: 'Hassle-free 7-day return policy',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: ShieldCheck,
      title: '100% Authentic',
      description: 'Every product is completely original',
      gradient: 'from-blue-500 to-indigo-600'
    }
  ];

  const stats = [
    { value: aboutContent.stats.customers, label: 'Happy Customers', icon: Users },
    { value: aboutContent.stats.products, label: 'Premium Products', icon: Sparkles },
    { value: aboutContent.stats.districts, label: 'Districts Covered', icon: Target },
    { value: aboutContent.stats.years, label: 'Years Experience', icon: Zap }
  ];

  const values = [
    {
      title: 'Our Mission',
      description: aboutContent.mission,
      color: 'bg-gradient-to-br from-primary/20 to-primary/5'
    },
    {
      title: 'Our Vision',
      description: aboutContent.vision,
      color: 'bg-gradient-to-br from-accent/20 to-accent/5'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="About Helpful Perfumes — Our Story & Mission" description="Learn about Helpful Perfumes — a Bangladesh fragrance store built on authentic products, quality service, and fast nationwide delivery." path="/about" />
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent rounded-full blur-3xl" />
          </div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-primary-foreground/90 text-sm">{aboutContent.heroSubtitle}</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
            >
              {aboutContent.heroTitle}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto"
            >
              {aboutContent.heroDescription}
            </motion.p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-accent font-semibold text-sm uppercase tracking-wider">Our Story</span>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                  {aboutContent.storyTitle}
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className={`${value.color} rounded-2xl p-6 md:p-8 border border-border/50`}
                  >
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-8 bg-secondary/50 rounded-2xl p-6 md:p-8 border border-border/50"
              >
                <p className="text-muted-foreground leading-relaxed text-center md:text-lg">
                  {aboutContent.storyDescription}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary to-primary/95">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4 md:p-6"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-accent" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-primary-foreground/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 md:mb-14"
            >
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Why We're The Best</span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">
                Reasons To Choose Us
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative bg-background rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className={`relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="relative font-semibold text-sm md:text-base text-foreground mb-2 text-center">{feature.title}</h3>
                  <p className="relative text-xs md:text-sm text-muted-foreground text-center">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-3xl p-8 md:p-12 text-center border border-accent/20"
            >
              <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
                {aboutContent.ctaTitle}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                {aboutContent.ctaDescription}
              </p>
              <motion.a
                href="/shop"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Shop Now
                <Sparkles className="w-4 h-4" />
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      
    </div>
  );
};

export default About;
