"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus, X, Loader2, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { IIncludes } from "@/interface"
import {
    addInclude,
    updateInclude,
    deleteInclude,
    getIncludesByCategory,
} from "@/action/includes"

interface ManageIncludesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    // kategori yang sedang dipilih (dibuka dari klik kategori di list)
    categoryId: string
    categoryName?: string
    // dipanggil setelah ada perubahan (tambah/edit/hapus) supaya parent bisa refresh
    onChange?: () => void
}

export function ManageIncludesModal({
    open,
    onOpenChange,
    categoryId,
    categoryName,
    onChange,
}: ManageIncludesModalProps) {
    const [items, setItems] = React.useState<IIncludes[]>([])
    const [loading, setLoading] = React.useState(false)
    const [saving, setSaving] = React.useState(false)

    // form tambah baru
    const [newName, setNewName] = React.useState("")

    // state edit inline
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editingName, setEditingName] = React.useState("")

    // state konfirmasi hapus
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const loadItems = React.useCallback(async () => {
        if (!categoryId) return
        setLoading(true)
        const res = await getIncludesByCategory(categoryId)
        if (res.success) {
            setItems(res.data)
        } else {
            toast.error(res.message || "Gagal memuat data include")
        }
        setLoading(false)
    }, [categoryId])

    React.useEffect(() => {
        if (open && categoryId) {
            loadItems()
            setNewName("")
            setEditingId(null)
            setDeletingId(null)
        }
    }, [open, categoryId, loadItems])

    const handleAdd = async () => {
        const trimmed = newName.trim()
        if (!trimmed) {
            toast.error("Nama include tidak boleh kosong")
            return
        }

        setSaving(true)
        const res = await addInclude(categoryId, trimmed)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal menambah include")
            return
        }

        toast.success("Include berhasil ditambahkan")
        setNewName("")
        await loadItems()
        onChange?.()
    }

    const startEdit = (item: IIncludes) => {
        setEditingId(item.id)
        setEditingName(item.include_name)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingName("")
    }

    const handleUpdate = async (id: string) => {
        const trimmed = editingName.trim()
        if (!trimmed) {
            toast.error("Nama include tidak boleh kosong")
            return
        }

        setSaving(true)
        const res = await updateInclude(id, trimmed)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal mengupdate include")
            return
        }

        toast.success("Include berhasil diupdate")
        cancelEdit()
        await loadItems()
        onChange?.()
    }

    const handleDelete = async (id: string) => {
        setSaving(true)
        const res = await deleteInclude(id)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal menghapus include")
            setDeletingId(null)
            return
        }

        toast.success("Include berhasil dihapus")
        setDeletingId(null)
        await loadItems()
        onChange?.()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Kelola Include
                    </DialogTitle>
                    <DialogDescription>
                        {categoryName
                            ? `Daftar include untuk kategori "${categoryName}".`
                            : "Daftar include untuk kategori ini."}
                    </DialogDescription>
                </DialogHeader>

                {/* Form tambah baru */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Nama include baru, contoh: Free WiFi"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleAdd()
                            }
                        }}
                        disabled={saving}
                    />
                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={saving || !newName.trim()}
                        className="bg-slate-800 hover:bg-slate-700 shrink-0"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                {/* List includes */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Memuat...
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Belum ada include. Tambahkan lewat form di atas.
                        </p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 border rounded-lg px-3 py-2"
                            >
                                {editingId === item.id ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleUpdate(item.id)
                                                }
                                                if (e.key === "Escape") cancelEdit()
                                            }}
                                            autoFocus
                                            disabled={saving}
                                            className="h-8"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => handleUpdate(item.id)}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : deletingId === item.id ? (
                                    <>
                                        <span className="flex-1 text-sm text-muted-foreground">
                                            Hapus &quot;{item.include_name}&quot;?
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, hapus"}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDeletingId(null)}
                                            disabled={saving}
                                        >
                                            Batal
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 text-sm font-medium">{item.include_name}</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => startEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setDeletingId(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}




