"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Eye, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ICategory, IImageCategories } from "@/interface"
import { deleteCategories, getAllCategories } from "@/action/categories"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Spinner } from "@/components/ui/spinner"
import Example from "@/components/skeleton"

// Extended interface untuk category dengan images
interface ICategoryWithImages extends ICategory {
    images?: IImageCategories[]
}

export default function CategoriesPage() {
    const router = useRouter()
    const [categories, setCategories] = React.useState<ICategoryWithImages[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [selectedCategory, setSelectedCategory] = React.useState<ICategoryWithImages | null>(null)
    const [showGallery, setShowGallery] = React.useState(false)
    const [openDelete, setOpenDelete] = React.useState(false)
    const [categoryToDelete, setCategoryToDelete] = React.useState<string | null>(null)

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
        fetchCategories()
    }, [fetchCategories])

    const handleDeleteClick = (categoryId: string) => {
        setCategoryToDelete(categoryId)
        setOpenDelete(true)
    }

    const handleDelete = async () => {
        if (!categoryToDelete) return

        try {
            setLoading(true)
            const response = await deleteCategories(categoryToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Kategori dan semua gambar berhasil dihapus")
            setOpenDelete(false)
            setCategoryToDelete(null)
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleViewGallery = (category: ICategoryWithImages) => {
        setSelectedCategory(category)
        setShowGallery(true)
    }
    const formatCurrency = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    };

    const truncateText = (text: string, max: number) => {
        if (!text) return "-"
        return text.length > max ? text.substring(0, max) + "..." : text
    }

    const columns: ColumnDef<ICategoryWithImages>[] = [
        {
            accessorKey: "images",
            header: "Images",
            cell: ({ row }) => {
                const images = row.original.images || []
                const primaryImage = images[0]?.image_url
                const imageCount = images.length

                return (
                    <div className="relative">
                        {primaryImage ? (
                            <div className="relative group">
                                <img
                                    src={primaryImage}
                                    alt={row.original.name}
                                    className="w-full h-20 rounded-lg object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ddd' width='80' height='80'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EError%3C/text%3E%3C/svg%3E"
                                    }}
                                />

                                {/* Image Counter Badge */}
                                {imageCount > 1 && (
                                    <Badge
                                        variant="secondary"
                                        className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2"
                                    >
                                        {imageCount}
                                    </Badge>
                                )}

                                {/* View Gallery Button on Hover */}
                                {imageCount > 1 && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewGallery(row.original)
                                            }}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Lihat
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <img className="w-full h-20" src="/placeholder-image.svg" alt="" />
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.name}</div>
            )
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const desc = row.original.description || "-"
                const short = truncateText(desc, 60)

                return (
                    <span title={desc} className="cursor-help text-sm text-gray-600">
                        {short}
                    </span>
                )
            }
        },
        {
            accessorKey: "start_price",
            header: "Start Price",
            cell: ({ row }) => {
                const price = row.original.start_price
                return price ? (
                    <span className="font-semibold ">
                        {formatCurrency(Number(price))}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const category = row.original
                const hasImages = category.images && category.images.length > 0

                return (
                    <div className="flex gap-2">
                        {/* View Gallery Button */}
                        {hasImages && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-0 cursor-pointer text-blue-600"
                                onClick={() => handleViewGallery(category)}
                                title="View Gallery"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Edit Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => router.push(`/admin/categories/edit/${category.id}`)}
                            title="Edit Category"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDeleteClick(category.id)}
                            title="Delete Category"
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
            <SiteHeader title="Services" />
            <div className="w-full px-7 mx-auto pb-10">
                <div className="flex justify-between items-center">

                    <div className="my-7">
                        <h1 className="text-3xl font-bold mb-2">Services Management</h1>
                        <p className="text-gray-500">Manage your Services and Package</p>
                    </div>

                </div>

                {loading ? (
                    <div className="flex items-center justify-center ">
                         <Example/>
                    </div>
                ) : (
                    <DataTable columns={columns} data={categories} filterColumn="name" title="All Services"
                        badgeText={`${categories.length} Services`}
                        addButtonText="Add Services"
                        onAddClick={() => router.push('/admin/categories/add')} />
                )}
            </div>

            {/* Image Gallery Modal */}
            <Dialog open={showGallery} onOpenChange={setShowGallery}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{selectedCategory?.name} - Gallery</span>
                            <Badge variant="secondary">
                                {selectedCategory?.images?.length || 0} Images
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {selectedCategory?.images?.map((image, index) => (
                            <div
                                key={image.id}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors group"
                            >
                                <img
                                    src={image.image_url}
                                    alt={`${selectedCategory.name} - ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EError Loading%3C/text%3E%3C/svg%3E"
                                    }}
                                />

                                {/* Image Number Badge */}
                                <Badge
                                    className="absolute top-2 left-2 bg-black/70 text-white"
                                >
                                    #{index + 1}
                                </Badge>

                                {/* Open in New Tab Button */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => window.open(image.image_url, '_blank')}
                                    >
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!selectedCategory?.images || selectedCategory.images.length === 0) && (
                        <div className="text-center py-12 text-gray-500">
                            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No images available</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={openDelete}
                onOpenChange={setOpenDelete}
                loading={loading}
                onConfirm={handleDelete}
            />
        </div>
    )
}