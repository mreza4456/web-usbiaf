"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Eye } from "lucide-react"
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

import { IOrderWithItems } from "@/interface"
import { deleteOrder, updateOrder, getAllOrdersWithItems, updateOrderStatus } from "@/action/order"
import { SiteHeader } from "@/components/site-header"

const orderSchema = z.object({
    status: z.string().min(1, "Status is required"),
})

type OrderForm = z.infer<typeof orderSchema>

export default function OrderAdminPage() {
    const [open, setOpen] = React.useState(false)
    const [detailOpen, setDetailOpen] = React.useState(false)
    const [editingOrder, setEditingOrder] = React.useState<IOrderWithItems | null>(null)
    const [selectedOrder, setSelectedOrder] = React.useState<IOrderWithItems | null>(null)
    const [orders, setOrders] = React.useState<IOrderWithItems[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchOrders = React.useCallback(async () => {
        try {
            setLoading(true)
            console.log('🔍 Fetching orders...')

            // Import getAllOrdersWithItems from action/order
            const response = await getAllOrdersWithItems()
            
            console.log('📦 Response:', response)

            if (!response?.success) {
                console.error('❌ Error:', response?.message)
                throw new Error(response?.message || 'Failed to fetch orders')
            }

            console.log('✅ Orders data:', response.data)
            setOrders(response.data as IOrderWithItems[])
        } catch (error: any) {
            console.error('💥 Fetch error:', error)
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
            const res = await updateOrderStatus(editingOrder.id, values)

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
        if (!confirm("Are you sure you want to delete this order?")) return

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
        }

        const config = statusConfig[status] || statusConfig.pending

        return (
            <Badge variant={config.variant} className={config.className}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const columns: ColumnDef<IOrderWithItems>[] = [
        { 
            accessorKey: "code_order", 
            header: "Order Code",
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.code_order}</span>
            )
        },
        { 
            accessorKey: "users.email", 
            header: "Client Email",
            cell: ({ row }) => row.original.users?.email || "-"
        },
        { 
            accessorKey: "users.full_name", 
            header: "Client Name",
            cell: ({ row }) => row.original.users?.full_name || "-"
        },
        { 
            accessorKey: "order_items", 
            header: "Items",
            cell: ({ row }) => {
                const itemCount = row.original.order_items?.length || 0
                const categories = [...new Set(row.original.order_items?.map(item => item.category_name))]
                
                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium">{itemCount} item(s)</div>
                        <div className="text-xs text-gray-500">
                            {categories.join(", ")}
                        </div>
                    </div>
                )
            }
        },
        { 
            accessorKey: "purpose", 
            header: "Purpose",
            cell: ({ row }) => (
                <span className="capitalize text-sm">
                    {row.original.purpose.replace(/_/g, ' ').replace(/-/g, ' ')}
                </span>
            )
        },
        { 
            accessorKey: "total", 
            header: "Total",
            cell: ({ row }) => (
                <span className="font-semibold">{formatCurrency(row.original.total)}</span>
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
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
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
                                setSelectedOrder(order)
                                setDetailOpen(true)
                            }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

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
        <div className="w-full"> 
            <SiteHeader title="Order Management" />
            <div className="w-full max-w-7xl mx-auto px-4">
                
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Order Management</h1>
                    <p className="text-gray-500">Manage client orders and update their status</p>
                </div>

                {/* Edit Status Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Order Status</DialogTitle>
                        </DialogHeader>

                        {editingOrder && (
                            <div className="mb-4 space-y-2 text-sm border-b pb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order Code:</span>
                                    <span className="font-mono font-medium">{editingOrder.code_order}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Client:</span>
                                    <span className="font-medium">{editingOrder.users?.full_name || editingOrder.users?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total:</span>
                                    <span className="font-medium">{formatCurrency(editingOrder.total)}</span>
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
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
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

                {/* Order Details Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6">
                                {/* Order Info */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg">Order Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Order Code:</span>
                                            <p className="font-mono font-medium">{selectedOrder.code_order}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Client Name:</span>
                                            <p className="font-medium">{selectedOrder.users?.full_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Client Email:</span>
                                            <p className="font-medium">{selectedOrder.users?.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Discord:</span>
                                            <p className="font-medium">{selectedOrder.discord}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Order Date:</span>
                                            <p className="font-medium">
                                                {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Details */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Project Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Purpose:</span>
                                            <p className="font-medium capitalize">
                                                {selectedOrder.purpose.replace(/_/g, ' ').replace(/-/g, ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Project Overview:</span>
                                            <p className="mt-1 text-gray-700">{selectedOrder.project_overview}</p>
                                        </div>
                                        {selectedOrder.references_link && (
                                            <div>
                                                <span className="text-gray-500">References:</span>
                                                <a 
                                                    href={selectedOrder.references_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline block mt-1"
                                                >
                                                    {selectedOrder.references_link}
                                                </a>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500">Platform:</span>
                                            <p className="mt-1">{selectedOrder.platform.join(", ")}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Usage Type:</span>
                                            <p className="mt-1 capitalize">{selectedOrder.usage_type.replace(/_/g, ' ')}</p>
                                        </div>
                                        {selectedOrder.additional_notes && (
                                            <div>
                                                <span className="text-gray-500">Additional Notes:</span>
                                                <p className="mt-1 text-gray-700">{selectedOrder.additional_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Order Items</h3>
                                    <div className="space-y-2">
                                        {selectedOrder.order_items?.map((item, idx) => (
                                            <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                                <div className="space-y-1">
                                                    <p className="font-medium">{item.category_name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {item.package_name} ({item.package_type})
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        {formatCurrency(item.price)} × {item.quantity}
                                                    </p>
                                                    <p className="font-semibold">
                                                        {formatCurrency(item.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t font-semibold text-lg">
                                        <span>Total:</span>
                                        <span>{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={orders} />
                )}
            </div>
        </div>
    )
}