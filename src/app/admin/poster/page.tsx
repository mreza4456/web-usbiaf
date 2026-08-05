"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Image as ImageIcon, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { IPoster } from "@/interface"
import {
    addPoster,
    deletePoster,
    getAllPosters,
    updatePoster,
    togglePosterStatus,
} from "@/action/poster"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"

// ─── Schema ──────────────────────────────────────────────────────────────────

const posterSchema = z.object({
    is_active: z.boolean().default(true),
})

type PosterForm = z.infer<typeof posterSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function PosterManagementPage() {
    const [open, setOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingPoster, setEditingPoster] = React.useState<IPoster | null>(null)
    const [posterToDelete, setPosterToDelete] = React.useState<string | null>(null)
    const [posters, setPosters] = React.useState<IPoster[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [togglingId, setTogglingId] = React.useState<string | null>(null)

    // ─── Fetch ──────────────────────────────────────────────────────────────

    const fetchPosters = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllPosters()

            if (!response?.success) {
                throw new Error(response?.message || "Failed to fetch posters")
            }

            setPosters(response.data as IPoster[])
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        let isMounted = true
        const load = async () => {
            if (!isMounted) return
            await fetchPosters()
        }
        load()
        return () => { isMounted = false }
    }, [fetchPosters])

    // ─── Form ───────────────────────────────────────────────────────────────

    const form = useForm<PosterForm>({
        resolver: zodResolver(posterSchema) as any,
        defaultValues: {
            is_active: true,
        },
    })

    // ─── Image ──────────────────────────────────────────────────────────────

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB")
            return
        }

        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    // ─── Submit ─────────────────────────────────────────────────────────────

    const handleSubmit = async (values: PosterForm) => {
        if (submitting) return

        // Require image on create; optional on edit
        if (!editingPoster && !imageFile) {
            toast.error("Please upload an image")
            return
        }

        try {
            setSubmitting(true)

            const formData = new FormData()
            formData.append("is_active", String(values.is_active))

            if (imageFile) {
                formData.append("image", imageFile)
            }

            let res
            if (editingPoster) {
                res = await updatePoster(String(editingPoster.id), formData as any)
            } else {
                res = await addPoster(formData as any)
            }

            if (!res.success) throw new Error(res.message)

            toast.success(editingPoster ? "Poster updated successfully" : "Poster created successfully")
            handleDialogClose()
            await fetchPosters()
        } catch (err: any) {
            toast.error(err.message || "An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    // ─── Delete ─────────────────────────────────────────────────────────────

    const handleDeleteClick = (posterId: string) => {
        setPosterToDelete(posterId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!posterToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deletePoster(posterToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Poster deleted successfully")
            setDeleteConfirmOpen(false)
            setPosterToDelete(null)
            fetchPosters()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    // ─── Toggle Status ───────────────────────────────────────────────────────

    const handleToggleStatus = async (poster: IPoster) => {
        setTogglingId(String(poster.id))
        try {
            const res = await togglePosterStatus(String(poster.id), !poster.is_active)
            if (!res.success) throw new Error(res.message)
            toast.success(res.message)
            await fetchPosters()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setTogglingId(null)
        }
    }

    // ─── Dialog Reset ────────────────────────────────────────────────────────

    const handleDialogClose = () => {
        setOpen(false)
        setEditingPoster(null)
        setImagePreview(null)
        setImageFile(null)
        form.reset({ is_active: true })
    }

    // ─── Date Format ────────────────────────────────────────────────────────

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })

    // ─── Columns ─────────────────────────────────────────────────────────────

    const columns: ColumnDef<IPoster>[] = [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm font-mono">
                    #{row.original.id}
                </span>
            ),
        },
        {
            accessorKey: "image_url",
            header: "Poster",
            cell: ({ row }) =>
                row.original.image_url ? (
                    <img
                        src={row.original.image_url}
                        alt={`Poster #${row.original.id}`}
                        className="w-20 h-20 object-cover rounded-md border"
                    />
                ) : (
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const poster = row.original
                const isToggling = togglingId === String(poster.id)
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={poster.is_active ?? false}
                            disabled={isToggling}
                            onCheckedChange={() => handleToggleStatus(poster)}
                        />
                        <Badge variant={poster.is_active ? "default" : "secondary"}>
                            {poster.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                )
            },
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const poster = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingPoster(poster)
                                form.reset({ is_active: poster.is_active ?? true })
                                setImagePreview(poster.image_url || null)
                                setImageFile(null)
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDeleteClick(String(poster.id))}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="w-full">
            <SiteHeader title="Poster" />
            <div className="w-full px-7 pb-10 mx-auto">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Poster Management</h1>
                    <p className="text-gray-500">Manage your poster images and visibility</p>
                </div>

                <div className="items-center">
                    <Dialog
                        open={open}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) handleDialogClose()
                            else setOpen(true)
                        }}
                    >
                        <DialogTrigger asChild className="float-end ml-5" />

                        <DialogContent
                            aria-describedby={undefined}
                            className="max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <DialogHeader>
                                <DialogTitle>
                                    {editingPoster ? "Edit Poster" : "Add Poster"}
                                </DialogTitle>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        form.handleSubmit(handleSubmit)(e)
                                    }}
                                    className="space-y-5"
                                >
                                    {/* Image Upload */}
                                    <FormItem>
                                        <FormLabel>
                                            Image {!editingPoster && <span className="text-red-500">*</span>}
                                        </FormLabel>
                                        <FormControl>
                                            <div className="space-y-3">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="cursor-pointer"
                                                />
                                                {imagePreview && (
                                                    <div className="relative w-full rounded-lg overflow-hidden border-2 border-muted">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-full object-contain max-h-64"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => {
                                                                setImagePreview(null)
                                                                setImageFile(null)
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                    {/* Is Active Toggle */}
                                    <FormField
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <FormLabel className="text-base">Active</FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        Show this poster publicly
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingPoster ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingPoster ? "Update Poster" : "Create Poster"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center">
                        <Example />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={posters}
                        filterColumn="id"
                        title="All Posters"
                        badgeText={`${posters.length} Posters`}
                        addButtonText="Add Poster"
                        onAddClick={() => {
                            setEditingPoster(null)
                            setImagePreview(null)
                            setImageFile(null)
                            form.reset({ is_active: true })
                            setOpen(true)
                        }}
                    />
                )}

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={setDeleteConfirmOpen}
                    loading={deleteLoading}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    )
}