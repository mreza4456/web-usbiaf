"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Image as ImageIcon, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { IBlogPost } from "@/interface"
import {
    addBlogPost,
    deleteBlogPost,
    getAllBlogPosts,
    updateBlogPost,
} from "@/action/blog"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"

const blogPostSchema = z.object({
    title: z.string().min(2, "Minimum 2 characters required"),
    description: z.string().min(10, "Minimum 10 characters required"),
})

type BlogPostForm = z.infer<typeof blogPostSchema>

export default function BlogManagementPage() {
    const [open, setOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingBlogPost, setEditingBlogPost] = React.useState<IBlogPost | null>(null)
    const [postToDelete, setPostToDelete] = React.useState<string | null>(null)
    const [blogPosts, setBlogPosts] = React.useState<IBlogPost[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const [imageFile, setImageFile] = React.useState<File | null>(null)

    const fetchBlogPosts = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllBlogPosts()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch blog posts')
            }

            setBlogPosts(response.data as any)
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
            await fetchBlogPosts()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchBlogPosts])

    const form = useForm<BlogPostForm>({
        resolver: zodResolver(blogPostSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file')
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB')
                return
            }

            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (values: BlogPostForm) => {
        console.log("🚀 Form submit triggered")
        console.log("🚀 Submit values:", values)
        console.log("🚀 Image file:", imageFile)
        
        if (submitting) {
            console.log("🚀 Already submitting, ignoring...")
            return
        }
        
        try {
            setSubmitting(true)
            
            // Validate required fields
            if (!values.title || !values.description) {
                toast.error("Please fill in all required fields")
                return
            }

            const formData = new FormData()
            formData.append('title', values.title)
            formData.append('description', values.description)
            
            if (imageFile) {
                formData.append('image', imageFile)
                console.log("🚀 Adding image to FormData:", imageFile.name, imageFile.size)
            }

            console.log("🚀 Submitting to server...")
            
            let res
            if (editingBlogPost) {
                console.log("🚀 Updating post ID:", editingBlogPost.id)
                res = await updateBlogPost(editingBlogPost.id, formData as any)
            } else {
                console.log("🚀 Creating new post")
                res = await addBlogPost(formData as any)
            }
            
            console.log("🚀 Server response:", res)
            
            if (!res.success) {
                throw new Error(res.message)
            }
            
            toast.success(editingBlogPost ? "Blog post updated successfully" : "Blog post created successfully")
            setOpen(false)
            setEditingBlogPost(null)
            setImagePreview(null)
            setImageFile(null)
            form.reset()
            await fetchBlogPosts()
        } catch (err: any) {
            console.error("🚀 Error:", err)
            toast.error(err.message || "An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (postId: string) => {
        setPostToDelete(postId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!postToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteBlogPost(postToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Blog post deleted successfully")
            setDeleteConfirmOpen(false)
            setPostToDelete(null)
            fetchBlogPosts()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const columns: ColumnDef<IBlogPost>[] = [
        {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) => {
                return row.original.image ? (
                    <img 
                        src={row.original.image} 
                        alt={row.original.title}
                        className="w-16 h-16 object-cover rounded"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                )
            }
        },
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
                const post = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingBlogPost(post)
                                form.reset({
                                    title: post.title,
                                    description: post.description || "",
                                })
                                setImagePreview(post.image || null)
                                setImageFile(null)
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDeleteClick(post.id)}
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
            <SiteHeader title="Blog" />
            <div className="w-full px-7 pb-10 mx-auto">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
                    <p className="text-gray-500">Manage your blog posts and articles</p>
                </div>
                
                <div className="items-center">
                    <Dialog open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            setImagePreview(null)
                            setImageFile(null)
                            setEditingBlogPost(null)
                            form.reset()
                        }
                    }}>
                        <DialogTrigger asChild className="float-end ml-5">
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingBlogPost ? "Edit Blog Post" : "Add Blog Post"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={(e) => {
                                        console.log("🚀 Form onSubmit event triggered")
                                        e.preventDefault()
                                        form.handleSubmit(handleSubmit)(e)
                                    }}
                                    className="space-y-4"
                                >
                                    {/* Image Upload */}
                                    <FormItem>
                                        <FormLabel>Image</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4">
                                                <Input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="cursor-pointer"
                                                />
                                                {imagePreview && (
                                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                                                        <img 
                                                            src={imagePreview} 
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => {
                                                                setImagePreview(null)
                                                                setImageFile(null)
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="Enter blog title"
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
                                                    <Textarea 
                                                        {...field} 
                                                        rows={6}
                                                        placeholder="Enter blog description or content"
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
                                        onClick={() => console.log("🚀 Button clicked")}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingBlogPost ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingBlogPost ? "Update Blog Post" : "Create Blog Post"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center ">
                      <Example/>
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={blogPosts} 
                        filterColumn="title" 
                        title="All Blog Posts"
                        badgeText={`${blogPosts.length} Posts`}
                        addButtonText="Add Blog Post"
                        onAddClick={() => {
                            console.log("🚀 Add button clicked")
                            setEditingBlogPost(null)
                            setImagePreview(null)
                            setImageFile(null)
                            form.reset({
                                title: "",
                                description: "",
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