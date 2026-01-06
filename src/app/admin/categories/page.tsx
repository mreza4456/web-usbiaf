"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus } from "lucide-react"
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
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { ICategory } from "@/interface"
import {
    addCategories,
    deleteCategories,
    getAllCategories,
    updateCategories,
} from "@/action/categories"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const categoriesSchema = z.object({

    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),

})

type CategoriesForm = z.infer<typeof categoriesSchema>

export default function CategoriesPage() {
    const params = useParams()
    const categoryId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingCategories, setEditingCategories] = React.useState<ICategory | null>(null)
    const [categories, setCategories] = React.useState<ICategory[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchCategories = React.useCallback(async () => {
        try {
            setLoading(true)

            const response = await getAllCategories()

            if (!response?.success) {
                throw new Error(response?.message || 'Gagal mengambil kategori')
            }

            setCategories(response.data)
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        let isMounted = true

        const load = async () => {
            if (!isMounted) return
            await fetchCategories()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchCategories])

    const form = useForm<CategoriesForm>({
        resolver: zodResolver(categoriesSchema) as any,
        defaultValues: {

            name: "",
            description: "",
        },
    })

    const handleSubmit = async (values: CategoriesForm) => {
        console.log("🚀 Submit values:", values)
        try {
            let res
            if (editingCategories) {
                res = await updateCategories(editingCategories.id, values as any)
            } else {
                res = await addCategories(values as any)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingCategories ? "Updated successfully" : "Created successfully")
            setOpen(false)
            setEditingCategories(null)
            fetchCategories()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (categoryId: string | number) => {
        try {
            setLoading(true)
            const response = await deleteCategories(categoryId as string)
            if (!response.success) throw new Error(response.message)
            toast.success("Categories deleted successfully")
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<ICategory>[] = [
    
        { accessorKey: "name", header: "Name" },
        { accessorKey: "description", header: "Description" },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ws = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingCategories(ws)
                                form.reset(ws)
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDelete(ws.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (

        <div className="w-full max-w-6xl mx-auto">
            <div className="items-center my-7">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild className="float-end ml-5">
                        <Button
                            onClick={() => {
                                setEditingCategories(null)
                                form.reset()
                            }}
                        >
                            Add <Plus className="ml-2" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategories ? "Edit Categories" : "Add Categories"}
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
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field ?? ""} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    {editingCategories ? "Update" : "Create"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? (
                <p>loading...</p>
            ) : (
                <DataTable columns={columns} data={categories} filterColumn="name" />
            )}
        </div>

    )
}