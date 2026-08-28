"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { IBadge } from "@/interface"
import {
    addClass,
    deleteClass,
    getAllClasses,
    updateClass,
} from "@/action/badge"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"

const classSchema = z.object({
    name: z.string().min(2, "Minimum 2 characters required"),
})

type ClassForm = z.infer<typeof classSchema>

export default function ClassManagementPage() {
    const [open, setOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingClass, setEditingClass] = React.useState<IBadge | null>(null)
    const [classToDelete, setClassToDelete] = React.useState<number | string | null>(null)
    const [classes, setClasses] = React.useState<IBadge[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)

    const fetchClasses = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllClasses()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch classes')
            }

            setClasses(response.data as any)
        } catch (error: any) {
            toast.error(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        let isMounted = true

        const load = async () => {
            if (!isMounted) return
            await fetchClasses()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchClasses])

    const form = useForm<ClassForm>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            name: "",
        },
    })

    const handleSubmit = async (values: ClassForm) => {
        if (submitting) return

        try {
            setSubmitting(true)

            let res
            if (editingClass) {
                res = await updateClass(editingClass.id, values)
            } else {
                res = await addClass(values)
            }

            if (!res.success) {
                throw new Error(res.message)
            }

            toast.success(editingClass ? "Class berhasil diupdate" : "Class berhasil dibuat")
            setOpen(false)
            setEditingClass(null)
            form.reset()
            await fetchClasses()
        } catch (err: any) {
            toast.error(err.message || "An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (classId: number | string) => {
        setClassToDelete(classId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!classToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteClass(classToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Class berhasil dihapus")
            setDeleteConfirmOpen(false)
            setClassToDelete(null)
            fetchClasses()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const columns: ColumnDef<IBadge>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                return <span className="font-medium">{row.original.name}</span>
            }
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => {
                return formatDate(row.original.created_at)
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const cls = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingClass(cls)
                                form.reset({
                                    name: cls.name,
                                })
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDeleteClick(cls.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="w-full">
            <SiteHeader title="Badge" />
            <div className="w-full px-7 pb-10 mx-auto">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Badge Management</h1>
                    <p className="text-gray-500">Manage your category badge</p>
                </div>

                <div className="items-center">
                    <Dialog open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            setEditingClass(null)
                            form.reset()
                        }
                    }}>
                        <DialogTrigger asChild className="float-end ml-5">
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingClass ? "Edit Badge" : "Add Badge"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(handleSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Badge Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter badge name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
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
                                                {editingClass ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingClass ? "Update Badge" : "Create Badge"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center ">
                        <Example />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={classes}
                        filterColumn="name"
                        title="All Badge"
                        badgeText={`${classes.length} Badges`}
                        addButtonText="Add Badge"
                        onAddClick={() => {
                            setEditingClass(null)
                            form.reset({
                                name: "",
                            })
                            setOpen(true)
                        }}
                    />
                )}

                {/* Delete Confirmation Dialog */}
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