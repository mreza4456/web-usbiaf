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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { ICampaign } from "@/interface"
import {
    addCampaign,
    deleteCampaign,
    getAllCampaigns,
    updateCampaign,
} from "@/action/campaign"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"
import { RichTextEditor } from "@/components/text-editor"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const campaignSchema = z.object({
    title: z.string().min(2, "Minimum 2 characters required"),
    description: z.string().min(10, "Minimum 10 characters required"),
    categories: z.string().optional(),
    date: z.string().optional(),
    expired: z.string().optional(),
    views: z.string().optional(),
    click: z.string().optional(),
})


type CampaignForm = z.infer<typeof campaignSchema>

export default function CampaignManagementPage() {
    const [open, setOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingCampaign, setEditingCampaign] = React.useState<ICampaign | null>(null)
    const [campaignToDelete, setCampaignToDelete] = React.useState<number | null>(null)
    const [campaigns, setCampaigns] = React.useState<ICampaign[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)

    const fetchCampaigns = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllCampaigns()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch campaigns')
            }

            setCampaigns(response.data as any)
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
            await fetchCampaigns()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchCampaigns])

    const form = useForm<CampaignForm>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            title: "",
            description: "",
            categories: "",
            date: "",
            expired: "",
            views: "0",
            click: "0",
        },
    })
    const handleSubmit = async (values: CampaignForm) => {
        if (submitting) return

        try {
            setSubmitting(true)

            if (!values.title || !values.description) {
                toast.error("Please fill in all required fields")
                return
            }

            const formData = new FormData()
            formData.append('title', values.title)
            formData.append('description', values.description)
            if (values.categories) formData.append('categories', values.categories)
            if (values.date) formData.append('date', values.date)
            if (values.expired) formData.append('expired', values.expired)
            formData.append('views', values.views || "0")
            formData.append('click', values.click || "0")

            let res
            if (editingCampaign) {
                res = await updateCampaign(editingCampaign.id, formData as any)
            } else {
                res = await addCampaign(formData as any)
            }

            if (!res.success) {
                throw new Error(res.message)
            }

            toast.success(editingCampaign ? "Campaign updated successfully" : "Campaign created successfully")
            setOpen(false)
            setEditingCampaign(null)
            form.reset()
            await fetchCampaigns()
        } catch (err: any) {
            toast.error(err.message || "An error occurred")
        } finally {
            setSubmitting(false)
        }
    }
    const handleDeleteClick = (campaignId: number) => {
        setCampaignToDelete(campaignId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!campaignToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteCampaign(campaignToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Campaign deleted successfully")
            setDeleteConfirmOpen(false)
            setCampaignToDelete(null)
            fetchCampaigns()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const columns: ColumnDef<ICampaign>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => {
                return <span className="font-medium">{row.original.title}</span>
            }
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                return (
                    <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                        {row.original.description}
                    </span>
                )
            }
        },
        {
            accessorKey: "categories",
            header: "Category",
            cell: ({ row }) => {
                return row.original.categories ? (
                    <Badge variant="secondary">{row.original.categories}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            }
        },
        {
            accessorKey: "views",
            header: "Views",
            cell: ({ row }) => row.original.views ?? 0
        },
        {
            accessorKey: "click",
            header: "Clicks",
            cell: ({ row }) => row.original.click ?? 0
        },
        {
            accessorKey: "date",
            header: "Start Date",
            cell: ({ row }) => formatDate(row.original.date)
        },
        {
            accessorKey: "expired",
            header: "Expired",
            cell: ({ row }) => formatDate(row.original.expired)
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const campaign = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingCampaign(campaign)
                                form.reset({
                                    title: campaign.title || "",
                                    description: campaign.description || "",
                                    categories: campaign.categories || "",
                                    date: campaign.date || "",
                                    expired: campaign.expired || "",
                                    views: campaign.views?.toString() || "0",
                                    click: campaign.click?.toString() || "0",
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
                            onClick={() => handleDeleteClick(campaign.id)}
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
            <SiteHeader title="Campaign" />
            <div className="w-full px-7 pb-10 mx-auto">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Campaign Management</h1>
                    <p className="text-gray-500">Manage your campaigns</p>
                </div>

                <div className="items-center">
                    <Dialog open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            setEditingCampaign(null)
                            form.reset()
                        }
                    }}>
                        <DialogTrigger asChild className="float-end ml-5">
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCampaign ? "Edit Campaign" : "Add Campaign"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        form.handleSubmit(handleSubmit)(e)
                                    }}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter campaign title"
                                                        {...field}
                                                    />
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
                                                <FormLabel>Description *</FormLabel>
                                                <FormControl>
                                                    <RichTextEditor
                                                        {...field}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Enter campaign description"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                  
                                    <FormField
                                        control={form.control}
                                        name="categories"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categories</FormLabel>
                                                <Select
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(val) => field.onChange(val)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue  placeholder="e.g. Promo, Event, Discount" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Categories</SelectLabel>
                                                                    <SelectItem value="raffle">Raffle</SelectItem>
                                                                    <SelectItem value="giveaway">Giveaway</SelectItem>
                                                                    <SelectItem value="skeb">Skeb</SelectItem>
                                                        
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="expired"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expired Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}

                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="views"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Views</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder="0"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="click"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Clicks</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder="0"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingCampaign ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingCampaign ? "Update Campaign" : "Create Campaign"
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
                        data={campaigns}
                        filterColumn="title"
                        title="All Campaigns"
                        badgeText={`${campaigns.length} Campaigns`}
                        addButtonText="Add Campaign"
                        onAddClick={() => {
                            setEditingCampaign(null)
                            form.reset({
                                title: "",
                                description: "",
                                categories: "",
                                date: "",
                                expired: "",
                                views: "0",
                                click: "0",
                            })
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