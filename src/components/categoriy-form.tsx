"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ICategory, IPackageCategories, IImageCategories } from "@/interface"
import { Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { uploadImage, deleteImage } from "@/action/upload"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"

const packageSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Minimal 2 karakter"),
    price: z.number().min(1, "Harga harus diisi"),
    package: z.string().min(1, "Paket harus diisi"),
    description: z.string().optional(),
})

const imageSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    image_url: z.string().min(1, "URL gambar harus diisi"),
    categories_id: z.union([z.string(), z.number()]).optional(),
    created_at: z.string().optional(),
})

const categorySchema = z.object({
    name: z.string().min(2, "Minimal 2 karakter"),
    description: z.string().optional(),
    start_price: z.string().optional(),
    images: z.array(imageSchema).min(1, "Minimal 1 gambar harus diupload"),
    packages: z.array(packageSchema).optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
    initialData?: ICategory & { 
        packages?: IPackageCategories[]
        images?: IImageCategories[]
    }
    onSubmit: (values: CategoryFormValues) => Promise<void>
    isSubmitting?: boolean
}

export function CategoryForm({ initialData, onSubmit, isSubmitting }: CategoryFormProps) {
    const [uploading, setUploading] = React.useState(false)
    const [uploadMethod, setUploadMethod] = React.useState<"upload" | "url">("upload")
    const [urlInput, setUrlInput] = React.useState("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            start_price: initialData?.start_price || "",
            images: initialData?.images?.map(img => ({
                id: img.id,
                image_url: img.image_url,
                categories_id: img.categories_id,
                created_at: img.created_at,
            })) || [],
            packages: initialData?.packages?.map(pkg => ({
                id: pkg.id,
                name: pkg.name,
                price: pkg.price,
                package: pkg.package,
                description: pkg.description || "",
            })) || [],
        },
    })

    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
        control: form.control,
        name: "images",
    })

    const { fields: packageFields, append: appendPackage, remove: removePackage } = useFieldArray({
        control: form.control,
        name: "packages",
    })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        try {
            setUploading(true)

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            const maxSize = 10 * 1024 * 1024

            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                if (!validTypes.includes(file.type)) {
                    toast.error(`File ${file.name}: Tipe tidak valid`)
                    continue
                }

                if (file.size > maxSize) {
                    toast.error(`File ${file.name}: Ukuran terlalu besar (max 10MB)`)
                    continue
                }

                const formData = new FormData()
                formData.append('file', file)

                const result = await uploadImage(formData)

                if (!result.success) {
                    toast.error(`File ${file.name}: ${result.message}`)
                    continue
                }

                appendImage({
                    image_url: result.url!,
                  
                })
            }

            toast.success('Gambar berhasil diupload')
            
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        } catch (error: any) {
            toast.error(error.message || 'Upload gagal')
        } finally {
            setUploading(false)
        }
    }

    const handleAddImageUrl = () => {
        if (!urlInput.trim()) {
            toast.error("URL gambar tidak boleh kosong")
            return
        }

        appendImage({
            image_url: urlInput.trim(),
        })

        setUrlInput("")
        toast.success("Gambar URL berhasil ditambahkan")
    }

    const handleRemoveImage = async (index: number) => {
        const image = imageFields[index]
        
        if (image.image_url && image.image_url.includes('supabase')) {
            await deleteImage(image.image_url)
        }

        removeImage(index)
        toast.success("Gambar berhasil dihapus")
    }

    const addPackage = () => {
        appendPackage({
            name: "",
            price: 0,
            package: "",
            description: "",
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("=== VALIDATION ERRORS ===", errors)
                toast.error("Validasi form gagal. Periksa kembali input Anda.")
            })} className="space-y-8">
                {/* Category Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama kategori" {...field} />
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
                                            placeholder="Masukkan deskripsi kategori"
                                            {...field}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="start_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category Images *</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "upload" | "url")}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                                <TabsTrigger value="url">Image URL</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="space-y-4">
                                <div className="flex flex-col gap-4">
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        multiple
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Format: JPEG, PNG, WEBP, GIF. Maks 10MB per file. Bisa upload multiple files.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/image.jpg"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddImageUrl()
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddImageUrl}
                                        disabled={!urlInput.trim()}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Image Gallery */}
                        {imageFields.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {imageFields.map((field, index) => (
                                    <div key={field.id} className="relative group">
                                        <div className="relative w-full h-48 border-2 rounded-lg overflow-hidden">
                                            <img
                                                src={field.image_url}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EError%3C/text%3E%3C/svg%3E"
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-gray-50">
                                <ImageIcon className="h-12 w-12 mb-2" />
                                <p className="text-sm">Belum ada gambar. Upload atau tambahkan URL gambar.</p>
                            </div>
                        )}

                        <FormMessage>{form.formState.errors.images?.message}</FormMessage>
                    </CardContent>
                </Card>

                {/* Packages Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Package Categories</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPackage}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Package
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {packageFields.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Belum ada paket. Klik "Add Package" untuk menambahkan paket.
                            </p>
                        ) : (
                            packageFields.map((field, index) => (
                                <div key={field.id}>
                                    {index > 0 && <Separator className="my-6" />}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Package {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePackage(index)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remove
                                            </Button>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`packages.${index}.id`}
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Input type="hidden" {...field} value={field.value || ""} />
                                                </FormControl>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`packages.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Package Name *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Contoh: Basic Wedding Package" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`packages.${index}.package`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Package Type *</FormLabel>
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a Package" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel>Package Type</SelectLabel>
                                                                    <SelectItem value="basic">Basic</SelectItem>
                                                                    <SelectItem value="standard">Standard</SelectItem>
                                                                    <SelectItem value="premium">Premium</SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`packages.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value)
                                                                field.onChange(value)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`packages.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Masukkan deskripsi paket"
                                                            {...field}
                                                            rows={3}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    {/* <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            console.log("=== FORM VALUES ===", form.getValues())
                            console.log("=== FORM ERRORS ===", form.formState.errors)
                        }}
                    >
                        Debug Form
                    </Button> */}

                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting || uploading}
                    >
                        {isSubmitting ? "Menyimpan..." : initialData ? "Update Category & Packages" : "Create Category & Packages"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}