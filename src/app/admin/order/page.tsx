"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IOrder } from "@/interface"
import {
    deleteOrder,
    getAllOrder,
    updateOrder,
} from "@/action/order"

const orderSchema = z.object({
    status: z.string().min(1, "Status is required"),
})

type OrderForm = z.infer<typeof orderSchema>

export default function OrderAdminPage() {
    const [open, setOpen] = React.useState(false)
    const [editingOrder, setEditingOrder] = React.useState<IOrder | null>(null)
    const [orders, setOrders] = React.useState<IOrder[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchOrders = React.useCallback(async () => {
        try {
            setLoading(true)

            const response = await getAllOrder()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch orders')
            }

            setOrders(response.data)
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
            await fetchOrders()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchOrders])

    const form = useForm<OrderForm>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            status: "",
        },
    })

    const handleSubmit = async (values: OrderForm) => {
        if (!editingOrder) return

        try {
            const res = await updateOrder(editingOrder.id, values)

            if (!res.success) throw new Error(res.message)

            toast.success("Order status updated successfully")
            setOpen(false)
            setEditingOrder(null)
            form.reset()
            fetchOrders()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (orderId: string) => {
        try {
            setLoading(true)
            const response = await deleteOrder(orderId)
            if (!response.success) throw new Error(response.message)
            toast.success("Order deleted successfully")
            fetchOrders()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
            pending: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
            in_progress: { variant: "default", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
            completed: { variant: "secondary", className: "bg-green-500/10 text-green-600 border-green-500/30" },
            cancelled: { variant: "destructive", className: "bg-red-500/10 text-red-600 border-red-500/30" },
            rejected: { variant: "destructive", className: "bg-gray-500/10 text-gray-600 border-gray-500/30" },
        }

        const config = statusConfig[status] || statusConfig.pending

        return (
            <Badge variant={config.variant} className={config.className}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    const columns: ColumnDef<IOrder>[] = [
        { 
            accessorKey: "users.email", 
            header: "Client Email",
            cell: ({ row }) => row.original.users?.email || "-"
        },
        { 
            accessorKey: "users.full_name", 
            header: "Client Name",
            cell: ({ row }) => row.original.users?.full_name || ""
        },
        { 
            accessorKey: "categories.name", 
            header: "Service",
            cell: ({ row }) => row.original.categories?.name || "-"
        },
        { 
            accessorKey: "purpose", 
            header: "Purpose",
            cell: ({ row }) => (
                <span className="capitalize">{row.original.purpose.replace('_', ' ').replace('-', ' ')}</span>
            )
        },
        { 
            accessorKey: "status", 
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original.status)
        },
        { 
            accessorKey: "created_at", 
            header: "Date",
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0"
                            onClick={() => {
                                setEditingOrder(order)
                                form.reset({ status: order.status })
                                setOpen(true)
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0"
                            onClick={() => handleDelete(order.id)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="my-7">
                <h1 className="text-3xl font-bold mb-2">Order Management</h1>
                <p className="text-gray-500">Manage client orders and update their status</p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Order Status</DialogTitle>
                    </DialogHeader>

                    {editingOrder && (
                        <div className="mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Client:</span>
                                <span className="font-medium">{editingOrder.users?.full_name || editingOrder.users?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Service:</span>
                                <span className="font-medium">{editingOrder.categories?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Purpose:</span>
                                <span className="font-medium capitalize">{editingOrder.purpose.replace('_', ' ').replace('-', ' ')}</span>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Order Status</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button 
                                type="button"
                                onClick={form.handleSubmit(handleSubmit)}
                                className="w-full"
                            >
                                Update Status
                            </Button>
                        </div>
                    </Form>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            ) : (
                <DataTable columns={columns} data={orders}  />
            )}
        </div>
    )
}