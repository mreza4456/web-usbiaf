"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Eye } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { deleteOrder, getAllOrdersWithItems, updateOrderStatus } from "@/action/order"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"
import { BriefDetails, hasBrief } from "@/components/cart-brief-dialog"

const orderSchema = z.object({
    status: z.string().min(1, "Status is required"),
})

type OrderForm = z.infer<typeof orderSchema>

const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numAmount);
};

const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
        pending: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
        in_progress: { variant: "default", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
        completed: { variant: "secondary", className: "bg-green-500/10 text-green-600 border-green-500/30" },
        cancelled: { variant: "destructive", className: "bg-red-500/10 text-red-600 border-red-500/30" },
        revision: { variant: "default", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
        <Badge variant={config.variant} className={config.className}>
            {status.replace('_', ' ').toUpperCase()}
        </Badge>
    )
}

export default function OrderAdminPage() {
    const [open, setOpen] = React.useState(false)
    const [detailOpen, setDetailOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingOrder, setEditingOrder] = React.useState<IOrderWithItems | null>(null)
    const [selectedOrder, setSelectedOrder] = React.useState<IOrderWithItems | null>(null)
    const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null)
    const [orders, setOrders] = React.useState<IOrderWithItems[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)

    const fetchOrders = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllOrdersWithItems()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch orders')
            }

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

    const handleDeleteClick = (orderId: string) => {
        setOrderToDelete(orderId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!orderToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteOrder(orderToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Order deleted successfully")
            setDeleteConfirmOpen(false)
            setOrderToDelete(null)
            fetchOrders()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
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
                const items = row.original.order_items || []
                const itemCount = items.length
                const firstItem = items[0]

                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium">{itemCount} item(s)</div>
                        {firstItem && (
                            <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                {firstItem.category_name}
                                {itemCount > 1 ? ` +${itemCount - 1} more` : ''}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            id: "purpose",
            header: "Purpose",
            // Purpose sekarang per order item, bukan per order (satu order bisa
            // berisi beberapa item dengan brief berbeda). Tampilkan milik item
            // pertama sebagai ringkasan; detail lengkap ada di dialog "View".
            cell: ({ row }) => {
                const items = row.original.order_items || []
                const purpose = items.find((i) => i.purpose)?.purpose
                if (!purpose) return <span className="text-sm text-gray-400">-</span>
                return (
                    <span className="capitalize text-sm">
                        {purpose.replace(/_/g, ' ').replace(/-/g, ' ')}
                        {items.length > 1 ? ' …' : ''}
                    </span>
                )
            }
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
                            onClick={() => handleDeleteClick(order.id)}
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
            <div className="w-full pb-10 mx-auto px-7">

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
                                                        <SelectItem value="revision">In Revision</SelectItem>
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

                                {/* Order Items — brief (discord, purpose, dst.) sekarang melekat per item */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Order Items</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.order_items?.map((item) => {
                                            // Order lama (sebelum brief dipindah ke order_items) masih
                                            // menyimpan brief di level order — pakai itu sebagai fallback.
                                            const brief = hasBrief(item) ? item : hasBrief(selectedOrder) ? selectedOrder : null

                                            return (
                                                <div key={item.id} className="rounded-lg border bg-gray-50 p-3 space-y-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{item.category_name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {item.package_title}
                                                                {item.package_name?.name ? ` (${item.package_name.name})` : ''}
                                                            </p>
                                                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                                        </div>
                                                        <div className="text-right space-y-1 shrink-0">
                                                            <p className="text-sm text-gray-600">
                                                                {formatCurrency(item.price)} × {item.quantity}
                                                            </p>
                                                            <p className="font-semibold">{formatCurrency(item.total)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="border-t pt-3">
                                                        {brief ? (
                                                            <BriefDetails item={brief} />
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No request details saved for this item.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
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
                    <div className="flex justify-center items-center ">
                          <Example/>
                    </div>
                ) : (
                    <DataTable columns={columns} data={orders} filterColumn="code_order" title="All Orders"
                        badgeText={`${orders.length} Orders`}
                        addButtonText="Export"
                        onAddClick={() => console.log("exported")} />
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