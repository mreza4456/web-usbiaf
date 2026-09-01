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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { ITicket } from "@/interface"
import { deleteTicket, updateTicket, getAllTickets } from "@/action/tickets"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"

const ticketSchema = z.object({
    status: z.string().min(1, "Status is required"),
    priority: z.string().min(1, "Priority is required"),
    admin_reply: z.string().optional(),
})

type TicketForm = z.infer<typeof ticketSchema>

export default function TicketAdminPage() {
    const [open, setOpen] = React.useState(false)
    const [detailOpen, setDetailOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingTicket, setEditingTicket] = React.useState<ITicket | null>(null)
    const [selectedTicket, setSelectedTicket] = React.useState<ITicket | null>(null)
    const [ticketToDelete, setTicketToDelete] = React.useState<number | null>(null)
    const [tickets, setTickets] = React.useState<ITicket[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)

    const fetchTickets = React.useCallback(async () => {
        try {
            setLoading(true)
            console.log('🔍 Fetching tickets...')

            const response = await getAllTickets()

            console.log('📦 Response:', response)

            if (!response?.success) {
                console.error('❌ Error:', response?.message)
                throw new Error(response?.message || 'Failed to fetch tickets')
            }

            console.log('✅ Tickets data:', response.data)
            setTickets(response.data as ITicket[])
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
            await fetchTickets()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchTickets])

    const form = useForm<TicketForm>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            status: "",
            priority: "",
            admin_reply: "",
        },
    })

    const handleSubmit = async (values: TicketForm) => {
        if (!editingTicket) return

        try {
            const res = await updateTicket(editingTicket.id, {
                status: values.status,
                priority: values.priority,
                admin_reply: values.admin_reply || undefined,
            })

            if (!res.success) throw new Error(res.message)

            toast.success("Ticket updated successfully")
            setOpen(false)
            setEditingTicket(null)
            form.reset()
            fetchTickets()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDeleteClick = (ticketId: number) => {
        setTicketToDelete(ticketId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!ticketToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteTicket(ticketToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Ticket deleted successfully")
            setDeleteConfirmOpen(false)
            setTicketToDelete(null)
            fetchTickets()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
            open: { variant: "outline", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
            in_progress: { variant: "default", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
            resolved: { variant: "secondary", className: "bg-green-500/10 text-green-600 border-green-500/30" },
            closed: { variant: "destructive", className: "bg-gray-500/10 text-gray-600 border-gray-500/30" },
        }

        const config = statusConfig[status] || statusConfig.open

        return (
            <Badge variant={config.variant} className={config.className}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    const getPriorityBadge = (priority: string) => {
        const priorityConfig: Record<string, string> = {
            low: "bg-gray-500/10 text-gray-600 border-gray-500/30",
            normal: "bg-blue-500/10 text-blue-600 border-blue-500/30",
            high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
            urgent: "bg-red-500/10 text-red-600 border-red-500/30",
        }

        return (
            <Badge variant="outline" className={priorityConfig[priority] || priorityConfig.normal}>
                {priority.toUpperCase()}
            </Badge>
        )
    }

    const columns: ColumnDef<ITicket>[] = [
        {
            accessorKey: "ticket_number",
            header: "Ticket Number",
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.ticket_number}</span>
            )
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => row.original.name || "-"
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => row.original.email || "-"
        },
        {
            accessorKey: "subject",
            header: "Subject",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.subject}</span>
            )
        },
        {
            accessorKey: "message",
            header: "Message",
            cell: ({ row }) => (
                 <div className="text-sm max-w-[150px] text-wrap">{row.original.message || "-"}</div>
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
                const ticket = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0"
                            onClick={() => {
                                setSelectedTicket(ticket)
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
                                setEditingTicket(ticket)
                                form.reset({
                                    status: ticket.status,
                                    priority: ticket.priority,
                                    admin_reply: ticket.admin_reply || "",
                                })
                                setOpen(true)
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0"
                            onClick={() => handleDeleteClick(ticket.id)}
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
            <SiteHeader title="Ticket Management" />
            <div className="w-full pb-10 mx-auto px-7">

                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Ticket Management</h1>
                    <p className="text-gray-500">Manage support tickets, update status, and reply to users</p>
                </div>

                {/* Edit Status & Reply Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Ticket</DialogTitle>
                        </DialogHeader>

                        {editingTicket && (
                            <div className="mb-4 space-y-2 text-sm border-b pb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ticket Number:</span>
                                    <span className="font-mono font-medium">{editingTicket.ticket_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">From:</span>
                                    <span className="font-medium">{editingTicket.name} ({editingTicket.email})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subject:</span>
                                    <span className="font-medium">{editingTicket.subject}</span>
                                </div>
                            </div>
                        )}

                        <Form {...form}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="open">Open</SelectItem>
                                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="normal">Normal</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                            <SelectItem value="urgent">Urgent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="admin_reply"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reply to User</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    rows={5}
                                                    placeholder="Write a reply the user will see when checking their ticket status..."
                                                />
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
                                    Update Ticket
                                </Button>
                            </div>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Ticket Details Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Ticket Details</DialogTitle>
                        </DialogHeader>

                        {selectedTicket && (
                            <div className="space-y-6">
                                {/* Ticket Info */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg">Ticket Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Ticket Number:</span>
                                            <p className="font-mono font-medium">{selectedTicket.ticket_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <p className="font-medium">{selectedTicket.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Email:</span>
                                            <p className="font-medium">{selectedTicket.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Social Media:</span>
                                            <p className="font-medium">{selectedTicket.social_media || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Priority:</span>
                                            <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Submitted:</span>
                                            <p className="font-medium">
                                                {new Date(selectedTicket.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="font-semibold text-lg">Subject</h3>
                                    <p className="text-sm font-medium">{selectedTicket.subject}</p>

                                    <h3 className="font-semibold text-lg pt-2">Message</h3>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                                        {selectedTicket.message}
                                    </p>
                                </div>

                                {/* Admin Reply */}
                                {selectedTicket.admin_reply && (
                                    <div className="space-y-3 border-t pt-4">
                                        <h3 className="font-semibold text-lg">Admin Reply</h3>
                                        <p className="text-sm text-primary bg-purple-50 rounded-lg p-3 whitespace-pre-wrap">
                                            {selectedTicket.admin_reply}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setDetailOpen(false)
                                            setEditingTicket(selectedTicket)
                                            form.reset({
                                                status: selectedTicket.status,
                                                priority: selectedTicket.priority,
                                                admin_reply: selectedTicket.admin_reply || "",
                                            })
                                            setOpen(true)
                                        }}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Reply / Update Status
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="flex justify-center items-center ">
                        <Example />
                    </div>
                ) : (
                    <DataTable columns={columns} data={tickets} filterColumn="ticket_number" title="All Tickets"
                        badgeText={`${tickets.length} Tickets`}
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