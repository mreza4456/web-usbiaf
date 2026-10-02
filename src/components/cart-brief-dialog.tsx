"use client";
// components/cart-brief-dialog.tsx
// Dipakai di halaman cart (dialog "Detail") dan di halaman order (ringkasan per item).

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ICartItemDetail } from '@/interface';

const USAGE_LABELS: Record<string, string> = {
  personal: 'Personal',
  commercial_content: 'Commercial: Content',
  commercial_merch: 'Commercial: Merchandising',
};

export type BriefLike = {
  discord?: string | null;
  purpose?: string | null;
  project_overview?: string | null;
  has_references?: string | null;
  references_link?: string | null;
  platform?: string[] | null;
  usage_type?: string | null;
  additional_notes?: string | null;
};
/** Item dianggap lengkap kalau 4 field wajib brief terisi. */
export const hasBrief = (item: BriefLike): boolean => 

  !!(item.discord && item.purpose && item.project_overview && item.usage_type);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[130px_1fr] sm:gap-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-primary">{children}</dd>
    </div>
  );
}

export function BriefDetails({ item }: { item: BriefLike }) {
  const platforms: string[] = Array.isArray(item.platform) ? item.platform : [];
  const link = item.references_link?.trim();

  return (
    <dl className="space-y-3">
      <Row label="Discord">{item.discord}</Row>
      <Row label="Purpose">{item.purpose}</Row>
      <Row label="Project overview">
        <span className="whitespace-pre-line">{item.project_overview}</span>
      </Row>
      <Row label="References">
        {item.has_references === 'yes' && link ? (
          /^https?:\/\//i.test(link) ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-secondary underline">
              {link}
            </a>
          ) : (
            <span className="whitespace-pre-line">{link}</span>
          )
        ) : (
          'None'
        )}
      </Row>
      <Row label="Platforms">
        {platforms.length ? <span className="capitalize">{platforms.join(', ')}</span> : '-'}
      </Row>
      <Row label="License">{USAGE_LABELS[item.usage_type ?? ''] ?? item.usage_type ?? '-'}</Row>
      {item.additional_notes && (
        <Row label="Notes">
          <span className="whitespace-pre-line">{item.additional_notes}</span>
        </Row>
      )}
    </dl>
  );
}

export default function CartBriefDialog({
  item,
  onClose,
}: {
  item: ICartItemDetail | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Request details</DialogTitle>
          <DialogDescription>
            {item?.category_name}
            {item?.package_title ? ` · ${item.package_title}` : ''}
          </DialogDescription>
        </DialogHeader>

        {item &&
          (hasBrief(item) ? (
            <BriefDetails item={item} />
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              This item was added before request details were required. Remove it and add it again
              from the service page to fill in your brief.
            </p>
          ))}
      </DialogContent>
    </Dialog>
  );
}