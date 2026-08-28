"use client";
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageCircle, Phone, MapPin, Clock, Send, Twitter, Instagram, Github, Youtube, CheckCircle2, ChevronDownIcon } from 'lucide-react';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Live2DWidget from '@/components/live2d-widget';
import { useMediaQuery } from '@/hooks/use-media-query';
import Link from 'next/link';
import { CardDashedCTA } from '@/components/card-dashed';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from "@/lib/utils";

export default function NemunekoContact() {



  const socialmedia = [
    { value: 'Discord', label: 'Discord' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'X', label: 'X / Twitter' },
    // { value: 'partnership', label: 'Partnership' },
    // { value: 'career', label: 'Career Opportunities' }
  ];
  const subject = [
    { value: 'Need Help', label: 'Need Help' },

    // General & Support
    { value: 'General Inquiry', label: 'General Inquiry' },
    { value: 'Technical Support', label: 'Technical Support' },
    { value: 'Account Issues', label: 'Account Issues' },

    // Business & Partnerships
    { value: 'Business Partnership', label: 'Business Partnership' },
    { value: 'Media & Press', label: 'Media & Press' },
    { value: 'Careers / Job Inquiry', label: 'Careers / Job Inquiry' },

    // Sales & Billing
    { value: 'Sales Inquiry', label: 'Sales Inquiry' },
    { value: 'Billing & Invoice', label: 'Billing & Invoice' },

    // Feedback
    { value: 'Feedback & Suggestions', label: 'Feedback & Suggestions' },
    { value: 'Report a Bug', label: 'Report a Bug' }
  ];


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: subject[0]?.value ?? "",
    socialmedia: socialmedia[0]?.value ?? "",
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
          socialmedia: 'general',
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

  type FAQItem = {
    id: string;
    question: React.ReactNode;
    answer?: React.ReactNode;
  };

  const FAQ_ITEMS: FAQItem[] = [
    {
      id: "skeb-like",
      question: (
        <>
          Can I offer &quot;Skeb-like&quot; commissions on{" "}
          <span className="font-bold">Nemuneko Studio</span>?
        </>
      ),
    },
    {
      id: "commission-licenses",
      question: (
        <>
          How to set up <span className="font-bold">commission licenses</span>?{" "}
          <span className="font-300">
            (Step by step guide with pictures)
          </span>
        </>
      ),
      answer: (
        <p className="leading-relaxed">
          Regardless of whether you take personal commissions or only work with
          commercial clients, personal use is always included in base price
          because clients can always personally enjoy the work and create /
          distribute non-competing digital end products with other.
          <br />
          (ie. sending files to friend for review = OK vs sending files to
          friend so they can avoid buying their own version = competitive and
          NOT ok).
        </p>
      ),
    },
    {
      id: "guaranteed-delivery",
      question: (
        <>
          How do <span className="font-bold">Guaranteed Delivery</span> dates
          work?
        </>
      ),
    },
    {
      id: "commission-system",
      question: (
        <>
          How does the <span className="font-bold">Nemuneko Studio</span>{" "}
          commission system work?
        </>
      ),
    },
  ];


  const socialLinks = [
    { icon: Twitter, name: "Twitter", handle: "@nemunekostudio", link: "#" },
    { icon: Instagram, name: "Instagram", handle: "@nemuneko.studio", link: "#" },
    { icon: Youtube, name: "YouTube", handle: "Nemuneko Studio", link: "#" },
    { icon: Github, name: "GitHub", handle: "nemuneko-studio", link: "#" }
  ];

  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <div className="min-h-screen ">

      <section className="relative min-h-screen  items-center bg-gradient-to-t from-white to-transparent">
        <div className="container flex flex-col justify-center md:mt-0 mt-25  mx-auto  max-w-7xl  relative ">
          <div className='px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-5'>
            <div>
              {/* Text kiri */}
              <div className="flex flex-col px-7  w-full mt-10">
                <h1 className="text-4xl sm:text-5xl  w-full text-primary leading-5 " >NEED ANY</h1>
                <h1 className="text-6xl sm:text-8xl  w-full text-primary" > <span className='bg-title'>HELP?</span></h1>
              </div>
              <div className="border-0 bg-transparent text-lilita p-7">

                {!isSubmitted ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-primary font-medium">EMAIL</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}

                        className="w-full bg-muted/50 p-2 px-4 text-primary rounded-full  border-2 border-primary "
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-primary font-medium">YOUR NAME</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}

                        className="w-full bg-muted/50 p-2 px-4 text-primary rounded-full  border-2 border-primary "
                      />
                      <div className="grid sm:grid-cols-2 gap-4 mt-2">

                        <div className="space-y-2">
                          <Label className="text-sm text-primary font-medium">SOCIAL MEDIA</Label>
                          <Select
                            value={formData.socialmedia}
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, socialmedia: value }));

                            }}
                          >
                            <SelectTrigger className='bg-muted/50 py-5 px-4 border-primary border-2 text-primary rounded-full w-full' >
                              <SelectValue placeholder="Social Media" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>SOCIAL MEDIA</SelectLabel>
                                {socialmedia.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-primary font-medium">SUBJECT</Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, subject: value }));

                            }}
                          >
                            <SelectTrigger className='bg-muted/50 py-5 px-4 border-primary border-2 text-primary rounded-full w-full' >
                              <SelectValue placeholder="Social Media" />
                            </SelectTrigger>
                            <SelectContent >
                              <SelectGroup>
                                <SelectLabel>Subject</SelectLabel>
                                {subject.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                        </div>

                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-primary font-medium">MESSAGE</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={6}

                        className="w-full bg-muted/50 p-2 px-4 rounded-2xl border-2 border-primary  resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-fit float-end bg-primary text-white mt-3 text-lg p-5 px-15 rounded-full"
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

              </div>
            </div>

            {/* Live2D kanan */}
            {isDesktop && (
              <div

                className="relative w-full  h-[1000px]"
              >
                <div className="h-1/2 bottom-0 absolute left-0 bg-gradient-to-t from-white to-transparent w-full" />
                <Live2DWidget modelPath="/Rigging_Karater_Nemuneko_RIG/Nemuneko_RIG.model3.json" />
              </div>
            )}

          </div>


        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-transparent">
        <div className="container mx-auto max-w-7xl  px-6 mb-20">
          <div className="flex flex-col px-7  w-full mt-10">
            <h1 className="text-4xl sm:text-5xl  w-full text-primary leading-5 " >FIND ME</h1>
            <h1 className="text-6xl sm:text-8xl  w-full text-primary" > <span className='bg-title'>EVERYWHERE?</span></h1>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-6 mt-10">
            {socialmedia.map((cat) => (
              <Card key={cat.value} className='border-3 border-primary card-social p-2'>
                <h1 className='text-primary'>{cat.label}</h1>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 text-lilita">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(
                  "overflow-hidden rounded-2xl border-none bg-muted/30 transition-colors",
                  "data-[state=open]:bg-muted"
                )}
              >
                <AccordionTrigger
                  className={cn(
                    "px-6 py-5 text-left text-lg font-medium text-primary",
                    "hover:no-underline",
                    "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-primary" // style the built-in chevron
                  )}
                >
                  <span className="flex-1 pr-4">{item.question}</span>
                </AccordionTrigger>

                {item.answer && (
                  <AccordionContent className="px-6 pb-6 text-base text-primary">
                    {item.answer}
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section className="py-20  max-w-7xl mx-auto sm:px-6 ">
        <div className="container mx-auto">

          <CardDashedCTA className="bg-[#e6dcff] md:rounded-[100px] ">
            <div className="grid grid-cols-5">
              <div className="col-span-3">
                <div className="text-left text-lilita  sm:p-10 px-4 sm:px-15 ">
                  <p className='text-secondary text-xl'>Our Newsletter</p>
                  <h1 className="text-6xl sm:text-4xl md:text-5xl  text-primary ">
                    Subscribe to Our Newsletter to
                  </h1>
                  <div className='relative  w-fit'>
                    <h1 className="text-7xl sm:text-8xl w-full   text-primary mb-7" >Get <span className="bg-title"> Updates!</span></h1>
                    {/* <div className='w-[70%] float-end -mt-5 h-10 bg-muted rounded-xs text-accent'></div> */}
                  </div>
                  <div className="flex gap-3">

                    <input type="text" className='bg-white w-[50%] py-1 px-5 border-2 border-primary rounded-full ' placeholder="Enter Email Address" />
                    <div>
                      <Button size="sm" className="text-lilita text-white rounded-full text-md px-10 py-5 ">
                        Subscribe
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
              <div className="col-span-2">

              </div>
            </div>
          </CardDashedCTA>

        </div>
      </section>

    </div>

  );
}