"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, MessageCircle, Phone, MapPin, Clock, Send, Twitter, Instagram, Github, Youtube, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/footer';

export default function NemunekoContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);



  const handleSubmit = () => {
    if (formData.name && formData.email && formData.subject && formData.message) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: ''
        });
      }, 3000);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "hello@nemuneko.studio",
      description: "Response within 24 hours",
      link: "mailto:hello@nemuneko.studio"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      content: "Discord Community",
      description: "Join 5000+ members",
      link: "#"
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+62 812 3456 7890",
      description: "Mon-Fri, 9AM-6PM WIB",
      link: "tel:+6281234567890"
    },
    {
      icon: MapPin,
      title: "Location",
      content: "Malang, Indonesia",
      description: "Remote-friendly team",
      link: "#"
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'custom', label: 'Custom Project' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'career', label: 'Career Opportunities' }
  ];

  const faqs = [
    {
      question: "Berapa lama waktu pengerjaan custom project?",
      answer: "Tergantung kompleksitas project, biasanya 1-3 minggu. Kami akan memberikan timeline yang jelas saat konsultasi awal."
    },
    {
      question: "Apakah bisa revisi setelah project selesai?",
      answer: "Ya! Setiap project mendapat 2x revisi gratis. Revisi tambahan dapat di-request dengan biaya tambahan."
    },
    {
      question: "Support untuk platform apa saja?",
      answer: "Kami support Twitch, YouTube, Kick, dan Facebook Gaming. Kompatibel dengan OBS, Streamlabs, dan StreamElements."
    },
    {
      question: "Bagaimana cara pembayaran?",
      answer: "Kami terima transfer bank lokal, e-wallet (GoPay, OVO, Dana), dan PayPal untuk klien internasional."
    }
  ];

  const socialLinks = [
    { icon: Twitter, name: "Twitter", handle: "@nemunekostudio", link: "#" },
    { icon: Instagram, name: "Instagram", handle: "@nemuneko.studio", link: "#" },
    { icon: Youtube, name: "YouTube", handle: "Nemuneko Studio", link: "#" },
    { icon: Github, name: "GitHub", handle: "nemuneko-studio", link: "#" }
  ];

  return (
    <div>
      {/* Animated Background */}


      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto text-center">
            <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
              <span className="text-sm font-semibold text-[#50398e]"> 💬 We'd Love to Hear From You</span>
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight ">
              Frequently Asked <span className="text-primary relative"> Questions<div className="absolute -bottom-2 left-0 w-full h-3  opacity-50 -rotate-2 -z-5"><img src="curve.png" alt="" /></div> </span>
            </h1>
            <p className="text-lg sm:text-xl text-black mb-8 max-w-3xl mx-auto">
              Quick answers to common questions
            </p>

          </div>
        </section>



        {/* FAQs Section */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {faqs.map((faq, i) => (
                <Card key={i} className="bg-muted/50 border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary flex items-start">
                      <span className="text-[#D78FEE] mr-2 flex-shrink-0">Q.</span>
                      <span>{faq.question}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm leading-relaxed pl-6">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-400 mb-4">Can't find what you're looking for?</p>
              <Button variant="outline" className="border-primary text-primary rounded-full hover:bg-[#9B5DE0]/10">
                View All FAQs
              </Button>
            </div>
          </div>
        </section>
      </div>


    </div>
  );
}