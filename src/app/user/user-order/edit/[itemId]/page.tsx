"use client";
// app/user/user-order/edit/[itemId]/page.tsx
// Menggantikan OrderBriefEditDialog dengan halaman tersendiri.
// Route diasumsikan: /user/user-order/edit/[itemId] — sesuaikan kalau beda.

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { getUserOrders, updateOrderItemBrief } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import type { IOrderItem, IOrderWithItems } from '@/interface';

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

export default function EditOrderBriefPage() {
    const { itemId } = useParams<{ itemId: string }>();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [order, setOrder] = useState<IOrderWithItems | null>(null);
    const [item, setItem] = useState<IOrderItem | null>(null);
    const [form, setForm] = useState<FormState | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                // Sama seperti halaman detail: belum ada action "get order item by id",
                // jadi sementara ambil semua order lalu cari item-nya.
                const res = await getUserOrders(user.id);
                if (!res?.success) throw new Error(res?.message || 'Failed to fetch order');

                const data = res.data as IOrderWithItems[];
                let foundOrder: IOrderWithItems | null = null;
                let foundItem: IOrderItem | null = null;

                for (const o of data) {
                    const match = o.order_items?.find((it) => it.id === itemId);
                    if (match) {
                        foundOrder = o;
                        foundItem = match;
                        break;
                    }
                }

                if (!foundItem) {
                    toast.error('Order item not found');
                    router.push('/user/user-order');
                    return;
                }

                setOrder(foundOrder);
                setItem(foundItem);
                setForm(fromItem(foundItem));
            } catch (error: any) {
                toast.error(error.message || 'Failed to load order item');
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, itemId]);

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

        try {
            setSaving(true);
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
            router.push(order ? `/user/user-order/${order.id}` : '/user/user-order');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen px-6 py-8 mx-auto max-w-lg">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-primary/10 rounded-xl w-1/2" />
                    <div className="h-96 bg-primary/10 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!form || !item) return null;

    return (
        <div className="relative z-10 w-full max-w-lg mx-auto px-6 sm:px-0 py-8 text-primary">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm font-medium text-primary/70 hover:text-primary mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-lilita mb-1">Edit request details</h1>
            <p className="text-sm text-muted-foreground mb-6">
                {item.category_name}
                {item.package_title ? ` · ${item.package_title}` : ''}
            </p>

            <div className="space-y-4">
                <Field label="Discord username" error={errors.discord}>
                    <input className={fieldCls} value={form.discord} onChange={(e) => set('discord', e.target.value)} />
                </Field>

                <Field label="What is this commission for?" error={errors.purpose}>
                    <input className={fieldCls} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
                </Field>

                <Field label="Project overview" error={errors.project_overview}>
                    <textarea
                        rows={4}
                        className={fieldCls}
                        value={form.project_overview}
                        onChange={(e) => set('project_overview', e.target.value)}
                    />
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
                                    form.has_references === v
                                        ? 'border-primary bg-muted/70 text-primary'
                                        : 'border-primary/30 text-gray-500 hover:border-primary/60'
                                }`}
                            >
                                {v === 'yes' ? 'Yes' : 'No'}
                            </button>
                        ))}
                    </div>
                </Field>

                {form.has_references === 'yes' && (
                    <Field label="Reference link" error={errors.references_link}>
                        <input
                            className={fieldCls}
                            value={form.references_link}
                            onChange={(e) => set('references_link', e.target.value)}
                            placeholder="https://"
                        />
                    </Field>
                )}

                <Field label="Where will you use it?" error={errors.platform}>
                    <div className="flex flex-wrap gap-2">
                        {PLATFORM_OPTIONS.map((p) => {
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
                                        on
                                            ? 'border-primary bg-muted/70 text-primary'
                                            : 'border-primary/30 text-gray-500 hover:border-primary/60'
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
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                        {!USAGE_OPTIONS.some((o) => o.value === form.usage_type) && (
                            <option value={form.usage_type}>{form.usage_type}</option>
                        )}
                    </select>
                </Field>

                <Field label="Additional notes (optional)">
                    <textarea
                        rows={3}
                        className={fieldCls}
                        value={form.additional_notes}
                        onChange={(e) => set('additional_notes', e.target.value)}
                    />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
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
        </div>
    );
}