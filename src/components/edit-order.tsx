"use client";
// components/order-brief-edit-dialog.tsx
// Edit brief satu order item (menggantikan halaman /user/user-order/edit/[id],
// karena brief sekarang melekat di order_items, bukan di orders).

import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateOrderItemBrief } from '@/action/order';
import type { IOrderItem } from '@/interface';

// Samakan dengan opsi di service-detail-dialog.tsx
const USAGE_OPTIONS = [
  { value: 'personal', label: 'Personal' },
  { value: 'commercial_content', label: 'Commercial: Content' },
  { value: 'commercial_merch', label: 'Commercial: Merchandising' },
];
const PLATFORM_OPTIONS = ['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'];

const fieldCls =
  'w-full rounded-xl border-2 border-primary/30 bg-white px-3 py-2 text-sm text-gray-800 ' +
  'placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

interface FormState {
  discord: string;
  purpose: string;
  project_overview: string;
  has_references: 'yes' | 'no';
  references_link: string;
  platform: string[];
  usage_type: string;
  additional_notes: string;
}

const fromItem = (item: IOrderItem): FormState => ({
  discord: item.discord ?? '',
  purpose: item.purpose ?? '',
  project_overview: item.project_overview ?? '',
  has_references: item.has_references ?? (item.references_link ? 'yes' : 'no'),
  references_link: item.references_link ?? '',
  platform: Array.isArray(item.platform) ? item.platform : [],
  usage_type: item.usage_type ?? 'personal',
  additional_notes: item.additional_notes ?? '',
});

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-primary">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function OrderBriefEditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: IOrderItem | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item ? fromItem(item) : null);
    setErrors({});
  }, [item]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    if (!form) return {};
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.discord.trim()) e.discord = 'Discord username is required.';
    if (!form.purpose.trim()) e.purpose = 'Tell us what this is for.';
    if (!form.project_overview.trim()) e.project_overview = 'Describe your project.';
    if (form.platform.length === 0) e.platform = 'Pick at least one platform.';
    if (form.has_references === 'yes' && !form.references_link.trim())
      e.references_link = 'Paste a link to your references.';
    return e;
  };

  const handleSave = async () => {
    if (!item || !form) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const res = await updateOrderItemBrief(item.id, {
        discord: form.discord.trim(),
        purpose: form.purpose.trim(),
        project_overview: form.project_overview.trim(),
        has_references: form.has_references,
        references_link: form.has_references === 'yes' ? form.references_link.trim() : null,
        platform: form.platform,
        usage_type: form.usage_type,
        additional_notes: form.additional_notes.trim() || null,
      });
      if (!res.success) throw new Error(res.message || 'Failed to update');
      toast.success('Request details updated');
      await onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Edit request details</DialogTitle>
          <DialogDescription>
            {item?.category_name}
            {item?.package_title ? ` · ${item.package_title}` : ''}
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-4">
            <Field label="Discord username" error={errors.discord}>
              <input className={fieldCls} value={form.discord} onChange={(e) => set('discord', e.target.value)} />
            </Field>

            <Field label="What is this commission for?" error={errors.purpose}>
              <input className={fieldCls} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
            </Field>

            <Field label="Project overview" error={errors.project_overview}>
              <textarea rows={4} className={fieldCls} value={form.project_overview} onChange={(e) => set('project_overview', e.target.value)} />
            </Field>

            <Field label="Do you have references?">
              <div className="flex gap-2">
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.has_references === v}
                    onClick={() => set('has_references', v)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition ${
                      form.has_references === v ? 'border-primary bg-muted/70 text-primary' : 'border-primary/30 text-gray-500 hover:border-primary/60'
                    }`}
                  >
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </Field>

            {form.has_references === 'yes' && (
              <Field label="Reference link" error={errors.references_link}>
                <input className={fieldCls} value={form.references_link} onChange={(e) => set('references_link', e.target.value)} placeholder="https://" />
              </Field>
            )}

            <Field label="Where will you use it?" error={errors.platform}>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => {
                  // Order lama menyimpan huruf kecil ("twitch"), jadi bandingkan tanpa peduli kapital.
                  const on = form.platform.some((x) => x.toLowerCase() === p.toLowerCase());
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set(
                          'platform',
                          on
                            ? form.platform.filter((x) => x.toLowerCase() !== p.toLowerCase())
                            : [...form.platform, p]
                        )
                      }
                      className={`flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm transition ${
                        on ? 'border-primary bg-muted/70 text-primary' : 'border-primary/30 text-gray-500 hover:border-primary/60'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="License">
              <select className={fieldCls} value={form.usage_type} onChange={(e) => set('usage_type', e.target.value)}>
                {USAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                {/* nilai lama dari checkout sebelumnya (mis. "commercial", "brand") tetap terpilih */}
                {!USAGE_OPTIONS.some((o) => o.value === form.usage_type) && (
                  <option value={form.usage_type}>{form.usage_type}</option>
                )}
              </select>
            </Field>

            <Field label="Additional notes (optional)">
              <textarea rows={3} className={fieldCls} value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border-2 border-primary/40 px-5 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}