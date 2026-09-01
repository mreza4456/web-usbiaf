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
import { Trash, Pencil, Plus, BarChart3, Users, CheckCircle2, Gift } from "lucide-react"
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
    MissionCategory,
    MissionType,
    MISSION_TYPE_CONFIG_FIELDS,
    MISSION_TYPE_EVENT_MAP,
    MISSION_TYPE_LABEL,
    REWARD_TYPE_LABEL,
} from "@/interface"
import {
    createMission,
    deleteMission,
    getAllMissionsAdmin,
    getAllRewards,
    getMissionDashboardSummary,
    getMissionStats,
    toggleMissionActive,
    updateMission,
} from "@/action/mission"

const MISSION_TYPES = Object.keys(MISSION_TYPE_LABEL) as MissionType[]
const CATEGORY_OPTIONS: MissionCategory[] = ["DAILY", "WEEKLY", "LIMITED_TIME", "ACHIEVEMENT", "GENERAL"]

const emptyForm: IMissionFormInput = {
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
    const [summary, setSummary] = React.useState({
        total_missions: 0,
        active_missions: 0,
        total_completions: 0,
        total_rewards_claimed: 0,
    })
    const [loading, setLoading] = React.useState(true)

    const [openForm, setOpenForm] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [form, setForm] = React.useState<IMissionFormInput>(emptyForm)
    const [saving, setSaving] = React.useState(false)

    const [openDelete, setOpenDelete] = React.useState(false)
    const [missionToDelete, setMissionToDelete] = React.useState<string | null>(null)

    const [openStats, setOpenStats] = React.useState(false)
    const [statsData, setStatsData] = React.useState<IMissionStats | null>(null)
    const [statsMissionTitle, setStatsMissionTitle] = React.useState("")

    const fetchAll = React.useCallback(async () => {
        try {
            setLoading(true)
            const [missionRes, rewardRes, summaryRes] = await Promise.all([
                getAllMissionsAdmin(),
                getAllRewards(),
                getMissionDashboardSummary(),
            ])

            if (!missionRes.success) throw new Error(missionRes.message || "Gagal mengambil mission")
            setMissions(missionRes.data)

            if (rewardRes.success) setRewards(rewardRes.data)
            if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data)
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const openCreateDialog = () => {
        setEditingId(null)
        setForm(emptyForm)
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

    const formatPeriod = (start?: string | null, end?: string | null) => {
        if (!start && !end) return "Tidak terbatas"
        const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        if (start && end) return `${fmt(start)} - ${fmt(end)}`
        if (start) return `Mulai ${fmt(start)}`
        return `Sampai ${fmt(end!)}`
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
            cell: ({ row }) => {
                const reward = row.original.reward
                if (!reward) return <span className="text-gray-400">-</span>
                return (
                    <span className="text-sm">
                        {REWARD_TYPE_LABEL[reward.type]}
                        {reward.value?.amount ? ` (${reward.value.amount})` : ""}
                    </span>
                )
            },
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
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Mission Management</h1>
                    <p className="text-gray-500">Kelola mission, event, dan reward untuk semua user</p>
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

            {/* Create / Edit dialog */}
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
                            sistem generik: admin tinggal isi field, tidak perlu logic baru per mission. */}
                        {activeConfigFields.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 border rounded-lg p-3 bg-gray-50">
                                {activeConfigFields.map((field) => (
                                    <div key={field}>
                                        <Label className="mb-1 block capitalize">{String(field).replace("_", " ")}</Label>
                                        <Input
                                            value={(form.config as any)?.[field] ?? ""}
                                            onChange={(e) => handleConfigFieldChange(String(field), e.target.value)}
                                            placeholder={`Masukkan ${String(field)}`}
                                        />
                                    </div>
                                ))}
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
                                                {r.name} ({REWARD_TYPE_LABEL[r.type]})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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