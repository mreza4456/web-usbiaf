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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { IVoucherEvents } from "@/interface"
import {
    addVoucherEvents,
    deleteVoucherEvents,
    getAllVoucherEvents,
    updateVoucherEvents,
} from "@/action/voucher-events"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SiteHeader } from "@/components/site-header"

const voucherEventsSchema = z.object({
    name: z.string().min(2, "min 2 characters"),
    code: z.string().min(2, "min 2 characters"),
    value: z.string().min(1, "value is required"),
    expired_at: z.string().min(1, "expired date is required"),
    type: z.string().min(1, "type is required"),
    is_active: z.boolean().default(true),
})

type VoucherEventsForm = z.infer<typeof voucherEventsSchema>

export default function VoucherEventsPage() {
    const [open, setOpen] = React.useState(false)
    const [editingVoucherEvents, setEditingVoucherEvents] = React.useState<IVoucherEvents | null>(null)
    const [voucherEvents, setVoucherEvents] = React.useState<IVoucherEvents[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchVoucherEvents = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllVoucherEvents()

            if (!response?.success) {
                throw new Error(response?.message || 'Gagal mengambil voucher events')
            }

            setVoucherEvents(response.data)
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
            await fetchVoucherEvents()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchVoucherEvents])

    const form = useForm<VoucherEventsForm>({
        resolver: zodResolver(voucherEventsSchema) as any,
        defaultValues: {
            name: "",
            code: "",
            value: "",
            expired_at: "",
            type: "",
            is_active: true,
        },
    })

    const handleSubmit = async (values: VoucherEventsForm) => {
        console.log("🚀 Submit values:", values)
        try {
            let res
            if (editingVoucherEvents) {
                res = await updateVoucherEvents(editingVoucherEvents.id, values as any)
            } else {
                res = await addVoucherEvents(values as any)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingVoucherEvents ? "Updated successfully" : "Created successfully")
            setOpen(false)
            setEditingVoucherEvents(null)
            form.reset()
            fetchVoucherEvents()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (voucherId: string) => {
        try {
            setLoading(true)
            const response = await deleteVoucherEvents(voucherId)
            if (!response.success) throw new Error(response.message)
            toast.success("Voucher deleted successfully")
            fetchVoucherEvents()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnDef<IVoucherEvents>[] = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "code", header: "Code" },
        { accessorKey: "value", header: "Value" },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                return <span className="capitalize">{row.original.type}</span>
            }
        },
        {
            accessorKey: "expired_at",
            header: "Expired At",
            cell: ({ row }) => {
                return new Date(row.original.expired_at).toLocaleDateString()
            }
        },
        {
            accessorKey: "is_active",
            header: "Active",
            cell: ({ row }) => {
                return row.original.is_active ? (
                    <span className="text-green-600">Active</span>
                ) : (
                    <span className="text-red-600">Inactive</span>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const voucher = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingVoucherEvents(voucher)
                                form.reset({
                                    name: voucher.name,
                                    code: voucher.code,
                                    value: voucher.value,
                                    expired_at: voucher.expired_at,
                                    type: voucher.type,
                                    is_active: voucher.is_active,
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
                            onClick={() => handleDelete(voucher.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="w-full"><SiteHeader title="Voucher Events" />
        <div className="w-full max-w-6xl mx-auto">
            <div className="items-center my-7">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild className="float-end ml-5">
                        <Button
                            onClick={() => {
                                setEditingVoucherEvents(null)
                                form.reset()
                            }}
                        >
                            Add <Plus className="ml-2" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingVoucherEvents ? "Edit Voucher Event" : "Add Voucher Event"}
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
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Value</FormLabel>
                                            <FormControl>
                                                <Input type="text" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expired_at"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expired At</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <FormLabel>Active Status</FormLabel>

                                            <FormControl>
                                                <Switch
                                                    checked={!!field.value}
                                                    onCheckedChange={(val) => field.onChange(val)}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    {editingVoucherEvents ? "Update" : "Create"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? (
                <p>loading...</p>
            ) : (
                <DataTable columns={columns} data={voucherEvents} filterColumn="name" />
            )}
        </div>
        </div>
    )
}