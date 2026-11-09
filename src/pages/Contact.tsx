import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Headphones, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { usePageContent } from '@/hooks/usePageContent';

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string().trim().min(11, { message: "Please enter a valid phone number" }).max(15, { message: "Phone must be less than 15 characters" }),
  message: z.string().trim().min(1, { message: "Message is required" }).max(1000, { message: "Message must be less than 1000 characters" })
});

const Contact = () => {
  const { toast } = useToast();
  const { contactContent, loading } = usePageContent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      details: contactContent.phones,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: contactContent.emails,
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: MapPin,
      title: 'Our Address',
      details: contactContent.address,
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: contactContent.workingHours,
      gradient: 'from-amber-500 to-orange-600'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent! ✓",
      description: "We will get back to you shortly.",
    });
    
    setFormData({ name: '', email: '', phone: '', message: '' });
    setIsSubmitting(false);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hello, I would like to know more about your store.");
    window.open(`https://wa.me/${contactContent.whatsappNumber}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Contact Helpful Perfumes — Phone, WhatsApp & Store"
        description="Get in touch with Helpful Perfumes — phone, WhatsApp, email, and our store location in Bangladesh. We'd love to hear from you."
        path="/contact"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Helpful Perfumes',
          url: 'https://www.staticvibes.site/contact',
          telephone: contactContent.phones,
          email: contactContent.emails,
          address: {
            '@type': 'PostalAddress',
            streetAddress: Array.isArray(contactContent.address) ? contactContent.address.join(', ') : contactContent.address,
            addressCountry: 'BD',
          },
          openingHours: contactContent.workingHours,
        }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 w-32 h-32 bg-accent rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
            >
              <Headphones className="w-4 h-4 text-accent" />
              <span className="text-primary-foreground/90 text-sm">{contactContent.heroSubtitle}</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-4"
            >
              {contactContent.heroTitle}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto"
            >
              {contactContent.heroDescription}
            </motion.p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group bg-background rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 text-center"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <info.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base text-foreground mb-2">{info.title}</h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-xs md:text-sm text-muted-foreground">{detail}</p>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & WhatsApp */}
        <section className="py-12 md:py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-background rounded-3xl p-6 md:p-10 shadow-lg border border-border/50"
              >
                <div className="text-center mb-8">
                  <span className="text-accent font-semibold text-sm uppercase tracking-wider">Send Message</span>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">
                    Write To Us
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-4" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Your Name</label>
                      <Input
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`h-12 rounded-xl ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`h-12 rounded-xl ${errors.email ? 'border-destructive' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="+880 1XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`h-12 rounded-xl ${errors.phone ? 'border-destructive' : ''}`}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Your Message</label>
                    <Textarea
                      placeholder="Write your message here..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={`rounded-xl resize-none ${errors.message ? 'border-destructive' : ''}`}
                    />
                    {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-base font-semibold" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Or contact us directly on WhatsApp
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 text-base font-semibold"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message on WhatsApp
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Find Us</span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">
                Our Location
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl overflow-hidden shadow-lg h-64 md:h-96 border border-border/50"
            >
              <iframe
                src={contactContent.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              />
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      
    </div>
  );
};

export default Contact;
