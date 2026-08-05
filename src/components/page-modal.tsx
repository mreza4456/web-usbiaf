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
import { Pencil, Trash2, Plus, X, Loader2, Tags } from "lucide-react"
import { toast } from "sonner"
import { IPackageName } from "@/interface"
import {
    addPackageName,
    updatePackageName,
    deletePackageName,
    getAllPackageNames,
} from "@/action/package"

interface ManagePackageNamesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    // dipanggil setelah ada perubahan (tambah/edit/hapus) supaya parent bisa refresh
    // dropdown "Package Type" di form kategori
    onChange?: () => void
}

export function ManagePackageNamesModal({ open, onOpenChange, onChange }: ManagePackageNamesModalProps) {
    const [items, setItems] = React.useState<IPackageName[]>([])
    const [loading, setLoading] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
const [packageNameModalOpen, setPackageNameModalOpen] = React.useState(false)
    // form tambah baru
    const [newName, setNewName] = React.useState("")

    // state edit inline
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editingName, setEditingName] = React.useState("")

    // state konfirmasi hapus
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const loadItems = React.useCallback(async () => {
        setLoading(true)
        const res = await getAllPackageNames()
        if (res.success) {
            setItems(res.data)
        } else {
            toast.error(res.message || "Gagal memuat data package")
        }
        setLoading(false)
    }, [])

    React.useEffect(() => {
        if (open) {
            loadItems()
            setNewName("")
            setEditingId(null)
            setDeletingId(null)
        }
    }, [open, loadItems])

    const handleAdd = async () => {
        const trimmed = newName.trim()
        if (!trimmed) {
            toast.error("Nama package tidak boleh kosong")
            return
        }

        setSaving(true)
        const res = await addPackageName(trimmed)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal menambah package")
            return
        }

        toast.success("Package berhasil ditambahkan")
        setNewName("")
        await loadItems()
        onChange?.()
    }

    const startEdit = (item: IPackageName) => {
        setEditingId(item.id)
        setEditingName(item.name)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingName("")
    }

    const handleUpdate = async (id: string) => {
        const trimmed = editingName.trim()
        if (!trimmed) {
            toast.error("Nama package tidak boleh kosong")
            return
        }

        setSaving(true)
        const res = await updatePackageName(id, trimmed)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal mengupdate package")
            return
        }

        toast.success("Package berhasil diupdate")
        cancelEdit()
        await loadItems()
        onChange?.()
    }

    const handleDelete = async (id: string) => {
        setSaving(true)
        const res = await deletePackageName(id)
        setSaving(false)

        if (!res.success) {
            toast.error(res.message || "Gagal menghapus package")
            setDeletingId(null)
            return
        }

        toast.success("Package berhasil dihapus")
        setDeletingId(null)
        await loadItems()
        onChange?.()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        Kelola Package Type
                    </DialogTitle>
                    <DialogDescription>
                        Daftar master nama package yang bisa dipilih saat menambahkan paket ke kategori.
                    </DialogDescription>
                </DialogHeader>

                {/* Form tambah baru */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Nama package baru, contoh: Deluxe"
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

                {/* List package_name */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Memuat...
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Belum ada package type. Tambahkan lewat form di atas.
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
                                            Hapus &quot;{item.name}&quot;?
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
                                        <span className="flex-1 text-sm font-medium">{item.name}</span>
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