"use client";
import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Send, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import Live2DWidget from '@/components/live2d-widget';
import { useMediaQuery } from '@/hooks/use-media-query';
import { createTicket } from '@/action/tickets';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CardDashedCTA } from '@/components/card-dashed';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CreateTicketPage() {

  type FAQItem = { id: string; question: React.ReactNode; answer?: React.ReactNode; };
  const FAQ_ITEMS: FAQItem[] = [
    { id: "skeb-like", question: (<>          Can I offer &quot;Skeb-like&quot; commissions on{" "}          <span className="font-bold">Nemuneko Studio</span>?        </>), }, { id: "commission-licenses", question: (<>          How to set up <span className="font-bold">commission licenses</span>?{" "}          <span className="font-300">            (Step by step guide with pictures)          </span>        </>), answer: (<p className="leading-relaxed">          Regardless of whether you take personal commissions or only work with          commercial clients, personal use is always included in base price          because clients can always personally enjoy the work and create /          distribute non-competing digital end products with other.          <br />          (ie. sending files to friend for review = OK vs sending files to          friend so they can avoid buying their own version = competitive and          NOT ok).        </p>), }, { id: "guaranteed-delivery", question: (<>          How do <span className="font-bold">Guaranteed Delivery</span> dates          work?        </>), }, { id: "commission-system", question: (<>          How does the <span className="font-bold">Nemuneko Studio</span>{" "}          commission system work?        </>), },];

  const socialmedia = [
    { value: 'Discord', label: 'Discord' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'X', label: 'X / Twitter' },
  ];

  const subject = [
    { value: 'Need Help', label: 'Need Help' },
    { value: 'General Inquiry', label: 'General Inquiry' },
    { value: 'Technical Support', label: 'Technical Support' },
    { value: 'Account Issues', label: 'Account Issues' },
    { value: 'Business Partnership', label: 'Business Partnership' },
    { value: 'Media & Press', label: 'Media & Press' },
    { value: 'Careers / Job Inquiry', label: 'Careers / Job Inquiry' },
    { value: 'Sales Inquiry', label: 'Sales Inquiry' },
    { value: 'Billing & Invoice', label: 'Billing & Invoice' },
    { value: 'Feedback & Suggestions', label: 'Feedback & Suggestions' },
    { value: 'Report a Bug', label: 'Report a Bug' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: subject[0]?.value ?? "",
    socialmedia: socialmedia[0]?.value ?? "",
    username: '',
    message: ''
  });
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string; ticketNumber?: string } | null>(null);
  // controls modal visibility separately so closing the dialog (e.g. via backdrop/esc)
  // doesn't wipe out the ticket number before the user has a chance to see it again
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const handleSubmit = () => {
  setResult(null);

  if (!formData.name || !formData.email || !formData.subject || !formData.message || !formData.username) {
    setResult({ success: false, message: "Please fill in all required fields." });
    return;
  }

  const cleanUsername = formData.username.trim().replace(/^@/, '');
  const combinedSocial = `${formData.socialmedia} - @${cleanUsername}`;

  const fd = new FormData();
  fd.append('name', formData.name);
  fd.append('email', formData.email);
  fd.append('subject', formData.subject);
  fd.append('socialmedia', combinedSocial); // <-- ini yang masuk ke kolom socialmedia
  fd.append('message', formData.message);

  startTransition(async () => {
    const res = await createTicket(fd);

    if (res.success && res.data) {
      setResult({
        success: true,
        message: "Ticket created! Save your ticket number to track the status.",
        ticketNumber: res.data.ticket_number,
      });
      setShowSuccessModal(true);
      setFormData({
        name: '',
        email: '',
        subject: subject[0]?.value ?? "",
        socialmedia: socialmedia[0]?.value ?? "",
        username: '',
        message: ''
      });
    } else {
      setResult({ success: false, message: res.message || "Something went wrong, please try again." });
    }
  });
};

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setResult(null);
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen items-center bg-gradient-to-t from-white to-transparent">
        <div className="container flex flex-col justify-center md:mt-0 mt-25 mx-auto max-w-7xl relative">
          <div className='px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-5'>
            <div>
              <div className="flex flex-col px-7 w-full mt-10">
                <h1 className="text-4xl sm:text-5xl w-full text-primary leading-5">NEED ANY</h1>
                <h1 className="text-6xl sm:text-8xl w-full text-primary"><span className='bg-title'>HELP?</span></h1>
              </div>

              <div className="border-0 bg-transparent text-lilita p-7">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-primary font-medium">EMAIL</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isPending}
                      className="w-full bg-muted/50 text-fredoka p-2 px-4 text-primary rounded-full border-2 border-primary disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-primary font-medium">YOUR NAME</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isPending}
                      className="w-full bg-muted/50 text-fredoka p-2 px-4 text-primary rounded-full border-2 border-primary disabled:opacity-60"
                    />

                    <div className="grid sm:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-primary font-medium">SOCIAL MEDIA</Label>
                        <Select
                          value={formData.socialmedia}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, socialmedia: value }))}
                          disabled={isPending}
                        >
                          <SelectTrigger className='bg-muted/50 text-fredoka py-5 px-4 border-primary border-2 text-primary rounded-full w-full'>
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
                        <label className="text-sm text-primary font-medium">USERNAME</label>
                        <input
                          type="text"
                          name="username"
                        
                          value={formData.username}
                          onChange={handleInputChange}
                          disabled={isPending}
                          className="w-full bg-muted/50 text-fredoka p-2 px-4 text-primary rounded-full border-2 border-primary disabled:opacity-60"
                        />
                      </div>


                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-primary font-medium">SUBJECT</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      disabled={isPending}
                    >
                      <SelectTrigger className='bg-muted/50 text-fredoka py-5 px-4 border-primary border-2 text-primary rounded-full w-full'>
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Subject</SelectLabel>
                          {subject.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-primary font-medium">MESSAGE</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      disabled={isPending}
                      className="w-full bg-muted/50 text-fredoka p-2 px-4 rounded-2xl border-2 border-primary resize-none disabled:opacity-60"
                    />
                  </div>

                  {result && !result.success && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-full px-4 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{result.message}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="w-fit float-end bg-primary text-white mt-3 cursor-pointer p-5 px-15 rounded-full disabled:opacity-70"
                  >
                    {isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </div>

            {isDesktop && (
              <div className="relative w-full h-[1000px]">
                <div className="h-1/2 bottom-0 absolute left-0 bg-gradient-to-t from-white to-transparent w-full" />
                <Live2DWidget modelPath="/Rigging_Karater_Nemuneko_RIG/Nemuneko_RIG.model3.json" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-lilita">
          <div className="py-6 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2">Ticket Created!</h3>
            <p className="text-gray-600 mb-4">{result?.message}</p>

            {result?.ticketNumber && (
              <div
                className="inline-flex items-center gap-2 bg-muted/50 border-2 border-primary rounded-full px-6 py-2 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(result.ticketNumber!)}
                title="Click to copy"
              >
                <span className="font-mono text-primary font-semibold">{result.ticketNumber}</span>
                <Copy className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className='flex mt-6 justify-center gap-5 items-center'>
              <Button
                variant="outline"
                onClick={handleCreateAnother}
              >
                Create Another Ticket
              </Button>
              <Link href="/user/ticket">
                <Button>
                  Check My Tickets
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-primary"
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
              <div className="col-span-2"></div>
            </div>
          </CardDashedCTA>
        </div>
      </section>
    </div>
  );
}