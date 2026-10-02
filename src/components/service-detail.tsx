"use client";
// components/service-detail-dialog.tsx
//
// Pengganti halaman /service/detail/[id]. Dibuka dari list lewat ?item=<id>.
// Alur: Detail -> (centang ToS, "start request") -> form brief -> Add to cart.
// Kalau belum ada shadcn dialog:  npx shadcn@latest add dialog

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Check, ChevronLeft, ChevronRight, ImageIcon, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { getCategoriesById } from '@/action/categories';
import { getPackageCategoriesByCategoryId } from '@/action/package';
import { getCommentsByCategory } from '@/action/comment';
import { getIncludesByCategory } from '@/action/includes';
import { addToCart } from '@/action/cart';
import { getCloudflareImageUrl } from '@/lib/storage-utils';
import { useAuthStore } from '@/store/auth';
import type {
  ICategory, IPackageCategories, IImageCategories, IComment, IIncludes, ICheckoutFormData,
} from '@/interface';
import { ServiceDetailSkeleton } from './skeleton-card';
import { Card } from './ui/card';
import { IconCircleCheckFilled } from '@tabler/icons-react';

// ─── Sesuaikan dengan opsi di form checkout lama kamu ───────────────────────
const USAGE_OPTIONS = [
  { value: 'personal', label: 'Personal', note: 'Included' },
  { value: 'commercial_content', label: 'Commercial: Content', note: 'Included' },
  { value: 'commercial_merch', label: 'Commercial: Merchandising', note: 'Extra license' },
];
const PLATFORM_OPTIONS = ['Twitch', 'YouTube', 'Kick', 'TikTok', 'Discord', 'Other'];
const TOS_ITEMS: string[] = [
  // Ganti dengan Terms of Service asli
  'Work starts after I accept your request and payment is confirmed.',
  'Revisions follow the limit stated in the package description.',
  'Final files are delivered through Discord or email.',
];
// ────────────────────────────────────────────────────────────────────────────

interface ICategoryWithImages extends ICategory {
  images?: IImageCategories[];
}
interface DetailData {
  category: ICategoryWithImages;
  packages: IPackageCategories[];
  comments: IComment[];
  feature: IIncludes[];
}

// Cache per kategori selama sesi SPA: buka ulang item yang sama = instan.
const detailCache = new Map<string, DetailData>();

function useCategoryDetail(id: string | null) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const cached = detailCache.get(id);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const cat = await getCategoriesById(id);
        if (!cat.success || !cat.data) {
          if (!cancelled) setError(cat.message || 'Failed to load category');
          return;
        }
        const [pk, cm, ft] = await Promise.all([
          getPackageCategoriesByCategoryId(id),
          getCommentsByCategory(id),
          getIncludesByCategory(id),
        ]);
        if (cancelled) return;
        const next: DetailData = {
          category: cat.data,
          packages: pk.success && Array.isArray(pk.data) ? pk.data : [],
          comments: cm.success && Array.isArray(cm.data) ? cm.data : [],
          feature: ft.success && Array.isArray(ft.data) ? ft.data : [],
        };
        detailCache.set(id, next);
        setData(next);
      } catch {
        if (!cancelled) setError('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}

const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n || 0);
};

const emptyForm: ICheckoutFormData = {
  discord: '',
  purpose: '',
  project_overview: '',
  hasReferences: 'no',
  references_link: '',
  platforms: [],
  usage_type: 'personal',
  additional_notes: '',
};

type FormErrors = Partial<Record<keyof ICheckoutFormData, string>>;
type Tab = 'description' | 'tos' | 'reviews';

const fieldCls =
  'w-full rounded-xl border-2 border-primary/30 bg-white px-3 py-2 text-sm text-gray-800 ' +
  'placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-primary">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Stars({ value, size = 'w-4 h-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(value) ? 'fill-[#FFE66D] text-[#FFE66D]' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function ServiceDetailDialog({
  categoryId,
  onClose,
}: {
  categoryId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, loading, error } = useCategoryDetail(categoryId);

  const [step, setStep] = useState<'detail' | 'brief'>('detail');
  const [tab, setTab] = useState<Tab>('description');
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [form, setForm] = useState<ICheckoutFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state tiap ganti item / dialog dibuka ulang
  useEffect(() => {
    setStep('detail');
    setTab('description');
    setImageIndex(0);
    setSelectedPackageId(null);
    setTosAccepted(false);
    setForm(emptyForm);
    setErrors({});
    setSubmitError(null);
  }, [categoryId]);

  const category = data?.category;
  const packages = data?.packages ?? [];
  const comments = data?.comments ?? [];
  const feature = data?.feature ?? [];
  const images = category?.images ?? [];

  const activePackageId = selectedPackageId ?? (packages[0] ? String(packages[0].id) : null);
  const activePackage = packages.find((p) => String(p.id) === activePackageId);

  const averageRating = comments.length
    ? comments.reduce((sum, c) => sum + parseInt(c.rating), 0) / comments.length
    : 0;

  const setField = <K extends keyof ICheckoutFormData>(key: K, value: ICheckoutFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const togglePlatform = (p: string) =>
    setField('platforms', form.platforms.includes(p)
      ? form.platforms.filter((x) => x !== p)
      : [...form.platforms, p]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.discord.trim()) e.discord = 'Enter your Discord username so we can reach you.';
    if (!form.purpose.trim()) e.purpose = 'Tell us what this commission is for.';
    if (!form.project_overview.trim()) e.project_overview = 'Describe what you want us to make.';
    if (form.platforms.length === 0) e.platforms = 'Pick at least one platform.';
    if (form.hasReferences === 'yes' && !form.references_link.trim())
      e.references_link = 'Paste a link to your references.';
    return e;
  };

  const handleAcceptTerms = () => {
    if (!user) {
      onClose();
      router.push('/auth/login');
      return;
    }
    setStep('brief');
  };

  const handleSubmit = async () => {
    if (!user || !categoryId || !activePackageId) return;

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await addToCart({
        user_id: user.id,
        categories_id: categoryId,
        package_id: activePackageId,
        quantity: 1,
        discord: form.discord,
        purpose: form.purpose,
        project_overview: form.project_overview,
        has_references: form.hasReferences === 'yes' ? 'yes' : 'no',
        references_link: form.hasReferences === 'yes' ? form.references_link : null,
        platform: form.platforms,
        usage_type: form.usage_type,
        additional_notes: form.additional_notes || null,
      });

      if (res.success) {
        // Hapus cache kategori ini agar form ter-reset saat buka ulang
        if (categoryId) detailCache.delete(categoryId);
        onClose();
        router.push('/cart');
      } else {
        setSubmitError(res.message || 'Failed to add to cart');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add to cart');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Kolom kiri: galeri ────────────────────────────────────────────────────
  const gallery = (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        {images.length > 0 ? (
          <>
            <img
              src={getCloudflareImageUrl(images[imageIndex]?.image_url, 'large')}
              alt={`${category?.name} ${imageIndex + 1}`}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5 text-primary" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5 text-primary" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setImageIndex(i)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition ${i === imageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
            >
              <img
                src={getCloudflareImageUrl(img.image_url, 'thumbnail')}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Kolom kanan, step 1: bagian atas yang TIDAK ikut scroll ───────────────
  // (judul, harga, rating, pemilihan paket, dan nav tab)
  const detailHeader = category && (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl leading-tight text-primary text-lilita sm:text-4xl">{category.name}</h2>
        {category.start_price && (
          <p className="mt-1 text-sm text-gray-500">
            From <span className="text-xl font-bold text-secondary">{formatCurrency(category.start_price)}</span>
          </p>
        )}
        {comments.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Stars value={averageRating} />
            <span className="text-xs text-gray-500">
              {averageRating.toFixed(1)} · {comments.length} {comments.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>

      {/* Pilih paket */}
      {packages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Choose a package</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {packages.map((pkg) => {
              const active = String(pkg.id) === activePackageId;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(String(pkg.id))}
                  aria-pressed={active}
                  className={`flex items-start justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition ${active ? 'border-primary bg-muted/60' : 'border-primary/20 hover:border-primary/50'
                    }`}
                >
                  <span className="min-w-0">
                    {pkg.package?.name && <span className="block text-xs text-gray-500">{pkg.package.name}</span>}
                    <span className="block truncate text-sm font-semibold text-primary">{pkg.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-primary">{formatCurrency(pkg.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav tab — tetap kelihatan, isi tab yang scroll di bawahnya */}
      <div className="flex gap-6 border-b border-primary/20" role="tablist">
        {([
          ['description', 'Description'],
          ['tos', 'T.O.S'],
          ['reviews', `Reviews${comments.length ? ` (${comments.length})` : ''}`],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-primary'
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Kolom kanan, step 1: isi tab — INI yang jadi area scroll-nya ──────────
  const detailTabContent = category && (
    <>
      {tab === 'description' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className='flex gap-2 border-primary border-1 py-3 px-5 rounded-xl justify-between items-center'>
              <img src="/icon/SVG/handicon.svg" className='w-7' alt="" />
              <div>
              <h1>Custom Proposal</h1>
              <p className='text-[8px]'>Request - proposal - commit (pay)</p>

              </div>
              <IconCircleCheckFilled className='w-4'/>
            </div>
            <div className='flex gap-2 border-primary border-1 p-3 rounded-xl justify-between'>
              <img src="/icon/SVG/handicon.svg" className='w-7' alt="" />
              <div>
              <h1>Custom Proposal</h1>
              <p className='text-[8px]'>Request - proposal - commit (pay)</p>

              </div>
              <IconCircleCheckFilled className='w-4'/>
            </div>
            <div className='flex gap-2 border-primary border-1 p-3 rounded-xl justify-between'>
              <img src="/icon/SVG/handicon.svg" className='w-7' alt="" />
              <div>
              <h1>Custom Proposal</h1>
              <p className='text-[8px]'>Request - proposal - commit (pay)</p>

              </div>
              <IconCircleCheckFilled className='w-4'/>
            </div>
            <div className='flex gap-2 border-primary border-1 p-3 rounded-xl justify-between'>
              <img src="/icon/SVG/handicon.svg" className='w-7' alt="" />
              <div>
              <h1>Custom Proposal</h1>
              <p className='text-[8px]'>Request - proposal - commit (pay)</p>

              </div>
              <IconCircleCheckFilled className='w-4'/>
            </div>
            <div className='flex gap-2 border-primary border-1 p-3 rounded-xl justify-between'>
              <img src="/icon/SVG/handicon.svg" className='w-7' alt="" />
              <div>
              <h1>Custom Proposal</h1>
              <p className='text-[8px]'>Request - proposal - commit (pay)</p>

              </div>
              <IconCircleCheckFilled className='w-4'/>
            </div>
          </div>
          <div className="space-y-5 rounded-2xl border-2 border-primary/40 p-4">
            {category.description && (
              <div
                className="whitespace-pre-line text-sm leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            )}
            {activePackage?.description && (
              <div>
                <p className="mb-1 text-sm font-semibold text-primary">{activePackage.name}</p>
                <div
                  className="prose prose-sm prose-neutral max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: activePackage.description }}
                />
              </div>
            )}
            {feature.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-primary">What's included</p>
                <ul className="space-y-1.5">
                  {feature.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f.include_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'tos' && (
        <ul className="space-y-2 rounded-2xl border-2 border-primary/40 p-4">
          {TOS_ITEMS.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t}
            </li>
          ))}
        </ul>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {comments.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border-2 border-primary/20 p-3">
              <div className="flex items-center gap-3">
                <img
                  src={c.users?.avatar_url || '/default-avatar.png'}
                  alt={c.users?.full_name}
                  className="h-9 w-9 rounded-full border-2 border-primary/20 object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">{c.users?.full_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2">
                    <Stars value={parseInt(c.rating)} size="w-3.5 h-3.5" />
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ─── Kolom kanan, step 2: form brief ───────────────────────────────────────
  const briefBody = category && (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => setStep('detail')}
          className="mb-3 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to details
        </button>
        <h2 className="text-2xl text-primary text-lilita sm:text-3xl">Tell us about your request</h2>
        <p className="mt-1 text-sm text-gray-500">
          {category.name}
          {activePackage && <> · {activePackage.name} · {formatCurrency(activePackage.price)}</>}
        </p>
      </div>

      <Field label="Discord username" error={errors.discord}>
        <input className={fieldCls} value={form.discord} onChange={(e) => setField('discord', e.target.value)} placeholder="username" />
      </Field>

      <Field label="What is this commission for?" error={errors.purpose}>
        <input className={fieldCls} value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} placeholder="e.g. Stream emotes for my channel" />
      </Field>

      <Field label="Project overview" error={errors.project_overview} hint="Character details, style, poses, colors, anything we should know.">
        <textarea rows={4} className={fieldCls} value={form.project_overview} onChange={(e) => setField('project_overview', e.target.value)} />
      </Field>

      <Field label="Do you have references?">
        <div className="flex gap-2">
          {(['yes', 'no'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={form.hasReferences === v}
              onClick={() => setField('hasReferences', v)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition ${form.hasReferences === v ? 'border-primary bg-muted/70 text-primary' : 'border-primary/30 text-gray-500 hover:border-primary/60'
                }`}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </Field>

      {form.hasReferences === 'yes' && (
        <Field label="Reference link" error={errors.references_link} hint="Google Drive, Pinterest, Imgur, etc.">
          <input className={fieldCls} value={form.references_link} onChange={(e) => setField('references_link', e.target.value)} placeholder="https://" />
        </Field>
      )}

      <Field label="Where will you use it?" error={errors.platforms}>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => {
            const on = form.platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm transition ${on ? 'border-primary bg-muted/70 text-primary' : 'border-primary/30 text-gray-500 hover:border-primary/60'
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
        <div className="space-y-2">
          {USAGE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2 text-sm transition ${form.usage_type === o.value ? 'border-primary bg-muted/60' : 'border-primary/20 hover:border-primary/50'
                }`}
            >
              <span className="flex items-center gap-2 text-primary">
                <input
                  type="radio"
                  name="usage_type"
                  className="accent-primary"
                  checked={form.usage_type === o.value}
                  onChange={() => setField('usage_type', o.value)}
                />
                {o.label}
              </span>
              <span className="text-xs text-gray-500">{o.note}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Additional notes (optional)">
        <textarea rows={3} className={fieldCls} value={form.additional_notes} onChange={(e) => setField('additional_notes', e.target.value)} />
      </Field>

      {submitError && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
        </p>
      )}
    </div>
  );

  // ─── Footer ────────────────────────────────────────────────────────────────
  const footer = step === 'detail' ? (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-primary/20 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={tosAccepted}
          onChange={(e) => setTosAccepted(e.target.checked)}
        />
        <span className="text-sm font-semibold text-primary">I accept the Terms of Service</span>
      </label>
      <button
        type="button"
        disabled={!tosAccepted || !activePackageId}
        onClick={handleAcceptTerms}
        className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Accept terms to <span className="font-bold">start request</span>
      </button>
    </div>
  ) : (
    <button
      type="button"
      disabled={submitting}
      onClick={handleSubmit}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? 'Adding to cart…' : 'Add to cart'}
    </button>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={!!categoryId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-[2rem] border-0 bg-white p-0 sm:max-w-5xl md:h-[85vh] md:overflow-hidden">
        <DialogTitle className="sr-only">{category?.name ?? 'Service detail'}</DialogTitle>
        <DialogDescription className="sr-only">Service details and request form</DialogDescription>

        {loading || (!data && !error) ? (
          <ServiceDetailSkeleton />
        ) : error || !category ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-gray-600">{error || 'Category not found'}</p>
            <button type="button" onClick={onClose} className="rounded-full bg-primary px-5 py-2 text-sm text-white">
              Close
            </button>
          </div>
        ) : (
          <div className="grid md:h-full md:min-h-0 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="p-5 pb-2 sm:p-6 md:overflow-y-auto">{gallery}</div>

            <div className="flex flex-col md:min-h-0">
              {step === 'detail' ? (
                <>
                  {/* Header + nav tab: fixed, tidak ikut scroll */}
                  <div className="shrink-0 p-5 pb-0 sm:p-6 sm:pb-0 md:pl-2">
                    {detailHeader}
                  </div>

                  {/* Isi tab: ini yang scroll-nya sendiri */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-5 pt-4 sm:p-6 sm:pt-4 md:pl-2">
                    {detailTabContent}
                  </div>
                </>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto p-5 pt-2 sm:p-6 md:pl-2">
                  {briefBody}
                </div>
              )}

              <div className="sticky bottom-0 shrink-0 bg-white p-4 sm:px-6">
                {footer}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}