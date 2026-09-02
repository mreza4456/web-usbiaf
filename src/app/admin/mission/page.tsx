"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash, Pencil, BarChart3, Users, CheckCircle2, Gift, Ticket } from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import Example from "@/components/skeleton"
import {
    IMission,
    IMissionFormInput,
    IMissionStats,
    IReward,
    IRewardFormInput,
    MissionCategory,
    MissionType,
    RewardType,
    MISSION_TYPE_CONFIG_FIELDS,
    MISSION_TYPE_EVENT_MAP,
    MISSION_TYPE_LABEL,
    REWARD_TYPE_LABEL,
} from "@/interface"
import { ICategory, IClass } from "@/interface"
import {
    createMission,
    createReward,
    deleteMission,
    deleteReward,
    getAllMissionsAdmin,
    getAllRewards,
    getMissionDashboardSummary,
    getMissionStats,
    toggleMissionActive,
    updateMission,
    updateReward,
} from "@/action/mission"
import { getAllCategories } from "@/action/categories" // categories = tabel produk
import { getAllClasses } from "@/action/class"          // class = tabel kategori/grup jasa

const MISSION_TYPES = Object.keys(MISSION_TYPE_LABEL) as MissionType[]
const CATEGORY_OPTIONS: MissionCategory[] = ["DAILY", "WEEKLY", "LIMITED_TIME", "ACHIEVEMENT", "GENERAL"]
const REWARD_TYPES = Object.keys(REWARD_TYPE_LABEL) as RewardType[]

const emptyMissionForm: IMissionFormInput = {
    title: "",
    description: "",
    mission_type: "LOGIN_COUNT",
    event_type: MISSION_TYPE_EVENT_MAP["LOGIN_COUNT"],
    target: 1,
    config: {},
    reward_id: null,
    category: "GENERAL",
    start_date: null,
    end_date: null,
    is_active: true,
}

const emptyRewardForm: IRewardFormInput = {
    type: "POINTS",
    name: "",
    description: "",
    value: {},
    voucher_value: null,
    applicable_categories_id: null,
    valid_days: 30,
}

// input datetime-local butuh format "YYYY-MM-DDTHH:mm"
const toDateTimeLocal = (iso?: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminMissionsPage() {
    const [missions, setMissions] = React.useState<IMission[]>([])
    const [rewards, setRewards] = React.useState<IReward[]>([])
    const [products, setProducts] = React.useState<ICategory[]>([]) // dari tabel categories (produk)
    const [classes, setClasses] = React.useState<IClass[]>([])      // dari tabel class (kategori)
    const [summary, setSummary] = React.useState({
        total_missions: 0,
        active_missions: 0,
        total_completions: 0,
        total_rewards_claimed: 0,
    })
    const [loading, setLoading] = React.useState(true)

    // --- Mission form dialog ---
    const [openForm, setOpenForm] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [form, setForm] = React.useState<IMissionFormInput>(emptyMissionForm)
    const [saving, setSaving] = React.useState(false)

    // --- Reward management dialog ---
    const [openRewardManager, setOpenRewardManager] = React.useState(false)
    const [openRewardForm, setOpenRewardForm] = React.useState(false)
    const [editingRewardId, setEditingRewardId] = React.useState<string | null>(null)
    const [rewardForm, setRewardForm] = React.useState<IRewardFormInput>(emptyRewardForm)
    const [savingReward, setSavingReward] = React.useState(false)

    const [openDelete, setOpenDelete] = React.useState(false)
    const [missionToDelete, setMissionToDelete] = React.useState<string | null>(null)

    const [openStats, setOpenStats] = React.useState(false)
    const [statsData, setStatsData] = React.useState<IMissionStats | null>(null)
    const [statsMissionTitle, setStatsMissionTitle] = React.useState("")

    const fetchAll = React.useCallback(async () => {
        try {
            setLoading(true)
            const [missionRes, rewardRes, summaryRes, productRes, classRes] = await Promise.all([
                getAllMissionsAdmin(),
                getAllRewards(),
                getMissionDashboardSummary(),
                getAllCategories(),
                getAllClasses(),
            ])

            if (!missionRes.success) throw new Error(missionRes.message || "Gagal mengambil mission")
            setMissions(missionRes.data)

            if (rewardRes.success) setRewards(rewardRes.data)
            if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data)
            if (productRes.success) setProducts(productRes.data as ICategory[])
            if (classRes.success) setClasses(classRes.data as IClass[])
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchAll()
    }, [fetchAll])

    // ------------------------------------------------------------------
    // Mission form handlers
    // ------------------------------------------------------------------
    const openCreateDialog = () => {
        setEditingId(null)
        setForm(emptyMissionForm)
        setOpenForm(true)
    }

    const openEditDialog = (mission: IMission) => {
        setEditingId(mission.id)
        setForm({
            title: mission.title,
            description: mission.description ?? "",
            mission_type: mission.mission_type,
            event_type: mission.event_type,
            target: mission.target,
            config: mission.config ?? {},
            reward_id: mission.reward_id ?? null,
            category: mission.category,
            start_date: mission.start_date ?? null,
            end_date: mission.end_date ?? null,
            is_active: mission.is_active,
        })
        setOpenForm(true)
    }

    const handleMissionTypeChange = (value: MissionType) => {
        setForm((prev) => ({
            ...prev,
            mission_type: value,
            event_type: MISSION_TYPE_EVENT_MAP[value],
            // reset config field yang tidak relevan lagi dengan tipe baru
            config: {},
        }))
    }

    const handleConfigFieldChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, config: { ...prev.config, [field]: value } }))
    }

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            toast.error("Judul mission wajib diisi")
            return
        }
        if (!form.target || form.target < 1) {
            toast.error("Target harus lebih dari 0")
            return
        }

        const fieldsNeeded = MISSION_TYPE_CONFIG_FIELDS[form.mission_type] ?? []
        for (const f of fieldsNeeded) {
            if (!(form.config as any)?.[f]) {
                toast.error(`Field "${String(f)}" wajib diisi untuk mission type ini`)
                return
            }
        }

        try {
            setSaving(true)
            const payload: IMissionFormInput = {
                ...form,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
            }

            const response = editingId
                ? await updateMission(editingId, payload)
                : await createMission(payload)

            if (!response.success) throw new Error(response.message)

            toast.success(editingId ? "Mission berhasil diupdate" : "Mission berhasil dibuat")
            setOpenForm(false)
            fetchAll()
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (mission: IMission) => {
        try {
            const response = await toggleMissionActive(mission.id, !mission.is_active)
            if (!response.success) throw new Error(response.message)
            toast.success(mission.is_active ? "Mission dinonaktifkan" : "Mission diaktifkan")
            fetchAll()
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        }
    }

    const handleDeleteClick = (missionId: string) => {
        setMissionToDelete(missionId)
        setOpenDelete(true)
    }

    const handleDelete = async () => {
        if (!missionToDelete) return
        try {
            setLoading(true)
            const response = await deleteMission(missionToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Mission berhasil dihapus")
            setOpenDelete(false)
            setMissionToDelete(null)
            fetchAll()
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    const handleViewStats = async (mission: IMission) => {
        try {
            const response = await getMissionStats(mission.id)
            if (!response.success || !response.data) throw new Error(response.message)
            setStatsData(response.data)
            setStatsMissionTitle(mission.title)
            setOpenStats(true)
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        }
    }

    // ------------------------------------------------------------------
    // Reward management handlers
    // ------------------------------------------------------------------
    const openCreateReward = () => {
        setEditingRewardId(null)
        setRewardForm(emptyRewardForm)
        setOpenRewardForm(true)
    }

    const openEditReward = (reward: IReward) => {
        setEditingRewardId(reward.id)
        setRewardForm({
            type: reward.type,
            name: reward.name,
            description: reward.description ?? "",
            value: reward.value ?? {},
            voucher_value: reward.voucher_value ?? null,
            applicable_categories_id: reward.applicable_categories_id ?? null,
            valid_days: reward.valid_days ?? 30,
        })
        setOpenRewardForm(true)
    }

    const handleSubmitReward = async () => {
        if (!rewardForm.name.trim()) {
            toast.error("Nama reward wajib diisi")
            return
        }
        if (rewardForm.type === "ITEM" && !rewardForm.applicable_categories_id) {
            toast.error("Pilih produk yang akan digratiskan untuk reward tipe ITEM")
            return
        }
        if (rewardForm.type === "VOUCHER" && !rewardForm.voucher_value) {
            toast.error('Isi nilai voucher, mis. "10%" atau "50000"')
            return
        }

        try {
            setSavingReward(true)
            const response = editingRewardId
                ? await updateReward(editingRewardId, rewardForm)
                : await createReward(rewardForm)

            if (!response.success) throw new Error(response.message)

            toast.success(editingRewardId ? "Reward berhasil diupdate" : "Reward berhasil dibuat")
            setOpenRewardForm(false)
            fetchAll()
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setSavingReward(false)
        }
    }

    const handleDeleteReward = async (id: string) => {
        try {
            const response = await deleteReward(id)
            if (!response.success) throw new Error(response.message)
            toast.success("Reward berhasil dihapus")
            fetchAll()
        } catch (error: any) {
            toast.error(error.message || "Reward mungkin masih dipakai oleh sebuah mission")
        }
    }

    const formatPeriod = (start?: string | null, end?: string | null) => {
        if (!start && !end) return "Tidak terbatas"
        const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        if (start && end) return `${fmt(start)} - ${fmt(end)}`
        if (start) return `Mulai ${fmt(start)}`
        return `Sampai ${fmt(end!)}`
    }

    const rewardDisplay = (reward?: IReward | null) => {
        if (!reward) return "-"
        if (reward.type === "ITEM") return `Free: ${reward.product?.name ?? "Produk"} (100%)`
        if (reward.type === "VOUCHER") return `Voucher ${reward.voucher_value ?? ""}`
        if (reward.value?.amount) return `${REWARD_TYPE_LABEL[reward.type]} +${reward.value.amount}`
        return REWARD_TYPE_LABEL[reward.type]
    }

    const columns: ColumnDef<IMission>[] = [
        {
            accessorKey: "title",
            header: "Mission",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.title}</div>
                    <div className="text-xs text-gray-500 max-w-xs truncate">{row.original.description || "-"}</div>
                </div>
            ),
        },
        {
            accessorKey: "mission_type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline">{MISSION_TYPE_LABEL[row.original.mission_type]}</Badge>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
        },
        {
            accessorKey: "target",
            header: "Target",
        },
        {
            accessorKey: "reward",
            header: "Reward",
            cell: ({ row }) => <p className="text-sm max-w-sm text-wrap">{rewardDisplay(row.original.reward)}</p>,
        },
        {
            id: "period",
            header: "Period",
            cell: ({ row }) => (
                <span className="text-sm text-gray-600">
                    {formatPeriod(row.original.start_date, row.original.end_date)}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Active",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.is_active}
                    onCheckedChange={() => handleToggleActive(row.original)}
                />
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="border-0" title="Stats" onClick={() => handleViewStats(row.original)}>
                        <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-0" title="Edit" onClick={() => openEditDialog(row.original)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 border-0"
                        title="Delete"
                        onClick={() => handleDeleteClick(row.original.id)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ]

    const activeConfigFields = MISSION_TYPE_CONFIG_FIELDS[form.mission_type] ?? []

    return (
        <div className="w-full">
            <SiteHeader title="Missions" />
            <div className="w-full px-7 mx-auto pb-10">
                <div className="my-7 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Mission Management</h1>
                        <p className="text-gray-500">Kelola mission, event, dan reward untuk semua user</p>
                    </div>
                    <Button variant="outline" onClick={() => setOpenRewardManager(true)}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Kelola Reward
                    </Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SummaryCard icon={<BarChart3 className="h-5 w-5" />} label="Total Mission" value={summary.total_missions} />
                    <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Mission Aktif" value={summary.active_missions} />
                    <SummaryCard icon={<Users className="h-5 w-5" />} label="Total Completion" value={summary.total_completions} />
                    <SummaryCard icon={<Gift className="h-5 w-5" />} label="Reward Diklaim" value={summary.total_rewards_claimed} />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <Example />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={missions}
                        filterColumn="title"
                        title="All Missions"
                        badgeText={`${missions.length} Missions`}
                        addButtonText="Add Mission"
                        onAddClick={openCreateDialog}
                    />
                )}
            </div>

            {/* Create / Edit mission dialog */}
            <Dialog open={openForm} onOpenChange={setOpenForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Mission" : "Buat Mission Baru"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div>
                            <Label className="mb-1 block">Title</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="mis. Coffee Hunter"
                            />
                        </div>

                        <div>
                            <Label className="mb-1 block">Description</Label>
                            <Textarea
                                value={form.description ?? ""}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="mis. Order Premium Coffee 3 kali"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 block">Mission Type</Label>
                                <Select value={form.mission_type} onValueChange={(v) => handleMissionTypeChange(v as MissionType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MISSION_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {MISSION_TYPE_LABEL[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Event pemicu: <span className="font-mono">{form.event_type}</span>
                                </p>
                            </div>

                            <div>
                                <Label className="mb-1 block">Target</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.target}
                                    onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Dynamic config fields sesuai mission_type — inilah bagian yang membuat
                            sistem generik: admin tinggal isi field, tidak perlu logic baru per mission.
                            product_id diambil dari tabel categories (produk), category_id dari tabel class. */}
                        {activeConfigFields.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 border rounded-lg p-3 bg-gray-50">
                                {activeConfigFields.includes("product_id") && (
                                    <div>
                                        <Label className="mb-1 block">Produk</Label>
                                        <Select
                                            value={(form.config as any)?.product_id ?? ""}
                                            onValueChange={(v) => handleConfigFieldChange("product_id", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih produk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {activeConfigFields.includes("category_id") && (
                                    <div>
                                        <Label className="mb-1 block">Kategori</Label>
                                        <Select
                                            value={(form.config as any)?.category_id ?? ""}
                                            onValueChange={(v) => handleConfigFieldChange("category_id", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((c: any) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.class_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {activeConfigFields.includes("page") && (
                                    <div>
                                        <Label className="mb-1 block">Path Halaman</Label>
                                        <Input
                                            value={(form.config as any)?.page ?? ""}
                                            onChange={(e) => handleConfigFieldChange("page", e.target.value)}
                                            placeholder="mis. /promo"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 block">Category</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as MissionCategory })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1 block">Reward</Label>
                                <Select
                                    value={form.reward_id ?? "none"}
                                    onValueChange={(v) => setForm({ ...form, reward_id: v === "none" ? null : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tanpa reward</SelectItem>
                                        {rewards.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name} — {rewardDisplay(r)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Belum ada reward yang cocok? Klik "Kelola Reward" di halaman utama.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 block">Start Date (opsional)</Label>
                                <Input
                                    type="datetime-local"
                                    value={toDateTimeLocal(form.start_date)}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
                                />
                            </div>
                            <div>
                                <Label className="mb-1 block">End Date (opsional)</Label>
                                <Input
                                    type="datetime-local"
                                    value={toDateTimeLocal(form.end_date)}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                            <Label>Mission Aktif</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenForm(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Mission"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reward manager: daftar reward + tombol tambah/edit/hapus */}
            <Dialog open={openRewardManager} onOpenChange={setOpenRewardManager}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Kelola Reward</span>
                            <Button size="sm" onClick={openCreateReward}>Tambah Reward</Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-2 py-2">
                        {rewards.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-6">Belum ada reward. Klik "Tambah Reward".</p>
                        )}
                        {rewards.map((r) => (
                            <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                                <div>
                                    <div className="font-medium">{r.name}</div>
                                    <div className="text-xs text-gray-500">{rewardDisplay(r)}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => openEditReward(r)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="text-red-500" onClick={() => handleDeleteReward(r.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reward create/edit form */}
            <Dialog open={openRewardForm} onOpenChange={setOpenRewardForm}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingRewardId ? "Edit Reward" : "Tambah Reward"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div>
                            <Label className="mb-1 block">Tipe Reward</Label>
                            <Select value={rewardForm.type} onValueChange={(v) => setRewardForm({ ...rewardForm, type: v as RewardType })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REWARD_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{REWARD_TYPE_LABEL[t]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-1 block">Nama Reward</Label>
                            <Input
                                value={rewardForm.name}
                                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                                placeholder="mis. Voucher Diskon 10%"
                            />
                        </div>

                        <div>
                            <Label className="mb-1 block">Deskripsi (opsional)</Label>
                            <Textarea
                                value={rewardForm.description ?? ""}
                                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                            />
                        </div>

                        {/* POINTS / XP */}
                        {(rewardForm.type === "POINTS" || rewardForm.type === "XP") && (
                            <div>
                                <Label className="mb-1 block">Jumlah {REWARD_TYPE_LABEL[rewardForm.type]}</Label>
                                <Input
                                    type="number"
                                    value={rewardForm.value?.amount ?? ""}
                                    onChange={(e) => setRewardForm({ ...rewardForm, value: { amount: Number(e.target.value) } })}
                                />
                            </div>
                        )}

                        {/* VOUCHER: nilai voucher umum + masa berlaku, masuk ke tabel vouchers saat diklaim */}
                        {rewardForm.type === "VOUCHER" && (
                            <>
                                <div>
                                    <Label className="mb-1 block">Nilai Voucher</Label>
                                    <Input
                                        value={rewardForm.voucher_value ?? ""}
                                        onChange={(e) => setRewardForm({ ...rewardForm, voucher_value: e.target.value })}
                                        placeholder='mis. "10%" atau "50000"'
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block">Masa Berlaku (hari)</Label>
                                    <Input
                                        type="number"
                                        value={rewardForm.valid_days ?? 30}
                                        onChange={(e) => setRewardForm({ ...rewardForm, valid_days: Number(e.target.value) })}
                                    />
                                </div>
                            </>
                        )}

                        {/* ITEM: pilih produk yang jadi gratis (voucher 100% dikunci ke produk tsb) */}
                        {rewardForm.type === "ITEM" && (
                            <>
                                <div>
                                    <Label className="mb-1 block">Produk yang Digratiskan</Label>
                                    <Select
                                        value={rewardForm.applicable_categories_id ?? ""}
                                        onValueChange={(v) => setRewardForm({ ...rewardForm, applicable_categories_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        User akan mendapat voucher 100% yang hanya berlaku untuk produk ini.
                                    </p>
                                </div>
                                <div>
                                    <Label className="mb-1 block">Masa Berlaku (hari)</Label>
                                    <Input
                                        type="number"
                                        value={rewardForm.valid_days ?? 30}
                                        onChange={(e) => setRewardForm({ ...rewardForm, valid_days: Number(e.target.value) })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenRewardForm(false)} disabled={savingReward}>
                            Batal
                        </Button>
                        <Button onClick={handleSubmitReward} disabled={savingReward}>
                            {savingReward ? "Menyimpan..." : editingRewardId ? "Simpan Perubahan" : "Buat Reward"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stats dialog */}
            <Dialog open={openStats} onOpenChange={setOpenStats}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Stats — {statsMissionTitle}</DialogTitle>
                    </DialogHeader>
                    {statsData && (
                        <div className="grid grid-cols-3 gap-3 py-2">
                            <StatBox label="Peserta" value={statsData.total_participants} />
                            <StatBox label="Selesai" value={statsData.total_completed} />
                            <StatBox label="Reward Diklaim" value={statsData.total_claimed} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={openDelete} onOpenChange={setOpenDelete} loading={loading} onConfirm={handleDelete} />
        </div>
    )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="border rounded-xl p-4 flex items-center gap-3 bg-white">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
            </div>
        </div>
    )
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="border rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    )
}