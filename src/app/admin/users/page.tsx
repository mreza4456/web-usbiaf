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

import { IUser } from "@/interface"
import {
    addUsers,
    deleteUsers,
    getAllUsers,
    updateUsers,
} from "@/action/user"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SiteHeader } from "@/components/site-header"

const usersSchema = z.object({
    role: z.string().min(1, "Role wajib diisi"),
})

type UsersForm = z.infer<typeof usersSchema>



export default function UsersPage() {
    const params = useParams()
    const categoryId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingUsers, setEditingUsers] = React.useState<IUser | null>(null)
    const [Users, setUsers] = React.useState<IUser[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true)

            const response = await getAllUsers()

            if (!response?.success) {
                throw new Error(response?.message || 'Gagal mengambil kategori')
            }

            setUsers(response.data)
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
            await fetchUsers()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchUsers])

    const form = useForm<UsersForm>({
        resolver: zodResolver(usersSchema),
        defaultValues: {
            role: "",
        },
    })

    const handleSubmit = async (values: UsersForm) => {
        if (!editingUsers) return

        try {
            const res = await updateUsers(editingUsers.id, values)

            if (!res.success) throw new Error(res.message)

            toast.success("Role updated successfully")
            setOpen(false)
            setEditingUsers(null)
            fetchUsers()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (categoryId: string | number) => {
        try {
            setLoading(true)
            const response = await deleteUsers(categoryId as string)
            if (!response.success) throw new Error(response.message)
            toast.success("Users deleted successfully")
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnDef<IUser>[] = [
       
        { accessorKey: "email", header: "Email" },
        { accessorKey: "full_name", header: "Name" },
        { accessorKey: "role", header: "Role" },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0"
                            onClick={() => {
                                setEditingUsers(user)
                                form.reset({ role: user.role })
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0"
                            onClick={() => handleDelete(user.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
<div className="w-full"><SiteHeader title="Users" />
        <div className="w-full max-w-6xl mx-auto">
            <div className="items-center my-7">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User Role</DialogTitle>
                        </DialogHeader>

                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                                                        <SelectItem value="USER">USER</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    Update Role
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

            </div>
            {loading ? (
                <p>loading...</p>
            ) : (
                <DataTable columns={columns} data={Users} filterColumn="email" />
            )}
        </div>
</div>
    )
}