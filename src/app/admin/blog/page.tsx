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

const blogPostSchema = z.object({
    title: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    image: z.string().url("must be a valid URL").optional().or(z.literal("")),
})

type BlogPostForm = z.infer<typeof blogPostSchema>

export default function BlogAdminPage() {
    const [open, setOpen] = React.useState(false)
    const [editingBlogPost, setEditingBlogPost] = React.useState<IBlogPost | null>(null)
    const [blogPosts, setBlogPosts] = React.useState<IBlogPost[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchBlogPosts = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllBlogPosts()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch blog posts')
            }

            setBlogPosts(response.data)
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
        resolver: zodResolver(blogPostSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            image: "",
        },
    })

    const handleSubmit = async (values: BlogPostForm) => {
        console.log("🚀 Submit values:", values)
        try {
            let res
            if (editingBlogPost) {
                res = await updateBlogPost(editingBlogPost.id, values as any)
            } else {
                res = await addBlogPost(values as any)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingBlogPost ? "Updated successfully" : "Created successfully")
            setOpen(false)
            setEditingBlogPost(null)
            form.reset()
            fetchBlogPosts()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (blogId: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) return
        
        try {
            setLoading(true)
            const response = await deleteBlogPost(blogId)
            if (!response.success) throw new Error(response.message)
            toast.success("Blog post deleted successfully")
            fetchBlogPosts()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const columns: ColumnDef<IBlogPost>[] = [
        {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) => {
                const image = row.original.image
                return image ? (
                    <img
                        src={image}
                        alt={row.original.title}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-2xl">
                        📝
                    </div>
                )
            }
        },
        { 
            accessorKey: "title", 
            header: "Title",
            cell: ({ row }) => (
                <div className="max-w-md">
                    <p className="font-medium line-clamp-2">{row.original.title}</p>
                </div>
            )
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-md">
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {row.original.description || "-"}
                    </p>
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => {
                return new Date(row.original.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const blogPost = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingBlogPost(blogPost)
                                form.reset({
                                    title: blogPost.title,
                                    description: blogPost.description || "",
                                    image: blogPost.image || "",
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
                            onClick={() => handleDelete(blogPost.id)}
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
            <SiteHeader title="Blog Posts" />
            <div className="w-full max-w-6xl mx-auto">
                <div className="items-center my-7">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild className="float-end ml-5">
                            <Button
                                onClick={() => {
                                    setEditingBlogPost(null)
                                    form.reset()
                                }}
                            >
                                Add <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingBlogPost ? "Edit Blog Post" : "Add Blog Post"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(handleSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="Enter blog title" {...field} />
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
                                                    <Textarea 
                                                        placeholder="Enter blog description" 
                                                        rows={5}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Image URL</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="url" 
                                                        placeholder="https://example.com/image.jpg" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full">
                                        {editingBlogPost ? "Update" : "Create"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                {loading ? (
                    <p>loading...</p>
                ) : (
                    <DataTable columns={columns} data={blogPosts} filterColumn="title" />
                )}
            </div>
        </div>
    )
}