"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageCircle, Phone, MapPin, Clock, Send, Twitter, Instagram, Github, Youtube, CheckCircle2 } from 'lucide-react';

export default function NemunekoContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const socialLinks = [
    { icon: Twitter, name: "Twitter", handle: "@nemunekostudio", link: "#" },
    { icon: Instagram, name: "Instagram", handle: "@nemuneko.studio", link: "#" },
    { icon: Youtube, name: "YouTube", handle: "Nemuneko Studio", link: "#" },
    { icon: Github, name: "GitHub", handle: "nemuneko-studio", link: "#" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto text-center">
            <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
              <span className="text-sm font-semibold text-[#50398e]">💬 We'd Love to Hear From You</span>
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight">
              Get in <span className="text-primary relative">Touch<div className="absolute -bottom-2 left-0 w-full h-3  opacity-50 -rotate-2 -z-5"><img src="curve.png" alt="" /></div></span>
            </h1>
            <p className="text-lg sm:text-xl text-black mb-8 max-w-3xl mx-auto">
              Ada pertanyaan atau ingin mulai project baru? Kami siap membantu Anda mewujudkan stream impian!
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, i) => (
                <Card key={i} className="bg-muted/50 border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 group cursor-pointer">
                  <CardHeader className="text-center pb-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <info.icon className="w-8 h-8 text-[#9B5DE0]" />
                    </div>
                    <CardTitle className="text-lg text-primary">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <a href={info.link} className="text-[#9B5DE0] hover:text-[#D78FEE] transition-colors font-medium block mb-1">
                      {info.content}
                    </a>
                    <CardDescription className="text-gray-600 text-sm">
                      {info.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="bg-muted/50 border-[#9B5DE0]/30">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl text-primary">Send us a Message</CardTitle>
                  <CardDescription className="text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isSubmitted ? (
                    <div className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-gray-700 font-medium">Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your name"
                            className="w-full px-4 py-3 bg-white border border-[#9B5DE0]/30 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-gray-700 font-medium">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 bg-white border border-[#9B5DE0]/30 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700 font-medium">Category *</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-[#9B5DE0]/30 rounded-lg text-gray-900 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value} className="bg-white">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700 font-medium">Subject *</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="What's this about?"
                          className="w-full px-4 py-3 bg-white border border-[#9B5DE0]/30 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D78FEE]/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-700 font-medium">Message *</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={6}
                          placeholder="Tell us more about your inquiry..."
                          className="w-full px-4 py-3 bg-white border border-[#9B5DE0]/30 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D78FEE]/50 transition-all resize-none"
                        />
                      </div>

                      <Button 
                        onClick={handleSubmit}
                        size="lg" 
                        className="w-full bg-primary text-white rounded-full"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#9B5DE0] to-[#D78FEE] rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-primary mb-2">Message Sent!</h3>
                      <p className="text-gray-600">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="space-y-6">
                {/* Business Hours */}
                <Card className="bg-muted/50 border-[#9B5DE0]/30">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-6 h-6 text-[#9B5DE0]" />
                      <CardTitle className="text-xl text-primary">Business Hours</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[#9B5DE0]/20">
                      <span className="text-gray-700">Monday - Friday</span>
                      <span className="text-[#9B5DE0] font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#9B5DE0]/20">
                      <span className="text-gray-700">Saturday</span>
                      <span className="text-[#9B5DE0] font-medium">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Sunday</span>
                      <span className="text-gray-500">Closed</span>
                    </div>
                    <Badge className="w-full justify-center mt-4 bg-muted border-2 border-[#dbc8fb]">
                      <span className="text-[#50398e] font-semibold">WIB (GMT+7)</span>
                    </Badge>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <Card className="bg-muted/50 border-[#9B5DE0]/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">Follow Us</CardTitle>
                    <CardDescription className="text-gray-600">
                      Connect with us on social media for updates and inspiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {socialLinks.map((social, i) => (
                      <a
                        key={i}
                        href={social.link}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#9B5DE0]/20 hover:border-[#D78FEE]/50 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <social.icon className="w-5 h-5 text-[#9B5DE0]" />
                          <div>
                            <div className="text-primary font-medium">{social.name}</div>
                            <div className="text-gray-600 text-sm">{social.handle}</div>
                          </div>
                        </div>
                        <div className="text-[#9B5DE0] group-hover:translate-x-1 transition-transform">→</div>
                      </a>
                    ))}
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="bg-gradient-to-br from-[#9B5DE0]/10 to-[#D78FEE]/10 border-[#9B5DE0]/30">
                  <CardContent className="py-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] bg-clip-text text-transparent mb-2">
                        &lt; 24 Hours
                      </div>
                      <div className="text-gray-700 text-sm">Average Response Time</div>
                      <div className="flex items-center justify-center space-x-2 mt-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className="w-5 h-5 text-[#9B5DE0]">★</div>
                        ))}
                      </div>
                      <div className="text-gray-600 text-xs mt-2">4.9/5.0 Customer Rating</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}