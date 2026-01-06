"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ICategory, IImage, IProduct } from "@/interface"
import {
  addProducts,
  updateProducts,
  getProductById,
} from "@/action/product"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCategories } from "@/action/categories"
import { Card } from "@/components/ui/card"
import { ImageUpload } from "@/components/image-upload"
import { addImage, deleteImage } from "@/action/image"

const productSchema = z.object({
  name: z.string().min(2, "min 2 characters"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
})

type ProductForm = z.infer<typeof productSchema>

interface ProductFormProps {
  formType: "add" | "edit";
  initialValues?: Partial<IProduct>;
}

export default function ProductFormPage({
  formType,
  initialValues,
}: ProductFormProps) {
  const params = useParams()
  const router = useRouter()
  
  // Only get productId if in edit mode
  const productId = formType === "edit" ? (params?.id as string) : undefined

  const [categories, setCategories] = React.useState<ICategory[]>([])
  const [loading, setLoading] = React.useState(false)
  const [imageFiles, setImageFiles] = React.useState<File[]>([])
  const [existingImages, setExistingImages] = React.useState<IImage[]>([])
  const [imagesToDelete, setImagesToDelete] = React.useState<string[]>([])

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category_id: "",
      description: "",
      price: "",
    },
  })

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories()
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to fetch categories")
      }
      setCategories(response.data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load categories")
      setCategories([])
    }
  }

  const fetchProduct = async () => {
    if (!productId) {
      console.warn("No product ID provided for edit mode")
      return
    }
    
    try {
      setLoading(true)
      const response = await getProductById(productId)
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to fetch product")
      }
      
      const product = response.data
      if (!product) {
        throw new Error("Product not found")
      }

      // Reset form with product data
      form.reset({
        name: product.name,
        category_id: String(product.category_id),
        description: product.description || "",
        price: String(product.price || ""),
      })

      // Set existing images
      if (product.images) {
        setExistingImages(product.images)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load product")
      router.push("/admin/products")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCategories()
  }, [])

  React.useEffect(() => {
    // Only fetch product data if in edit mode and productId exists
    if (formType === "edit" && productId) {
      fetchProduct()
    }
  }, [formType, productId])

  const handleSubmit = async (values: ProductForm) => {
    console.log("=== SUBMIT STARTED ===")
    console.log("Form Type:", formType)
    console.log("Form values:", values)
    console.log("Image files:", imageFiles.length)
    console.log("Product ID:", productId)

    try {
      setLoading(true)
      
      // Parse and validate values
      const categoryId = parseInt(values.category_id)
      const price = parseFloat(values.price)
      
      if (isNaN(categoryId)) {
        throw new Error("Invalid category")
      }
      
      if (isNaN(price) || price <= 0) {
        throw new Error("Invalid price")
      }

      const payload = {
        name: values.name,
        category_id: categoryId,
        price: price,
        description: values.description || "",
      }

      console.log("Payload:", payload)

      let res
      let savedProductId = productId

      // Step 1: Save or Update Product
      if (formType === "edit") {
        // Edit mode - productId must exist
        if (!productId) {
          throw new Error("Product ID is required for edit mode")
        }
        console.log("Updating product...")
        res = await updateProducts(productId, payload as any)
        console.log("Update response:", res)
      } else {
        // Add mode - create new product
        console.log("Creating new product...")
        res = await addProducts(payload as any)
        console.log("Add response:", res)
        
        // Get the new product ID from response
        if (res.success && res.data?.id) {
          savedProductId = res.data.id
          console.log("New product ID:", savedProductId)
        }
      }

      if (!res || !res.success) {
        throw new Error(res?.message || "Failed to save product")
      }

      // Step 2: Delete marked images (only in edit mode)
      if (formType === "edit" && imagesToDelete.length > 0) {
        console.log("Deleting images:", imagesToDelete)
        for (const imageId of imagesToDelete) {
          try {
            await deleteImage(imageId)
          } catch (err) {
            console.error("Failed to delete image:", imageId, err)
          }
        }
      }

      // Step 3: Upload new images (both add and edit mode)
      if (imageFiles.length > 0 && savedProductId) {
        console.log(`Uploading ${imageFiles.length} images to product ${savedProductId}...`)
        
        let successCount = 0
        let failCount = 0
        
        for (const file of imageFiles) {
          try {
            console.log("Uploading:", file.name)
            const uploadRes = await addImage({ product_id: savedProductId }, file)
            
            if (uploadRes.success) {
              successCount++
              console.log("Upload success:", file.name)
            } else {
              failCount++
              console.error("Upload failed:", file.name, uploadRes.message)
            }
          } catch (err: any) {
            failCount++
            console.error("Upload error:", file.name, err)
          }
        }
        
        console.log(`Upload complete: ${successCount} success, ${failCount} failed`)
        
        if (failCount > 0) {
          toast.warning(`Product saved, but ${failCount} image(s) failed to upload`)
        }
      }

      const successMessage = formType === "edit" 
        ? "Product updated successfully!" 
        : "Product created successfully!"
      toast.success(successMessage)
      console.log("=== SUBMIT SUCCESS ===")
      
      // Redirect to products list
      router.push("/admin/products")
      
    } catch (err: any) {
      console.error("=== SUBMIT ERROR ===", err)
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
      console.log("=== SUBMIT ENDED ===")
    }
  }

  const handleRemoveExistingImage = (imageId: string) => {
    if (!confirm("Remove this image?")) return
    
    // Mark image for deletion
    setImagesToDelete(prev => [...prev, imageId])
    // Remove from UI
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {formType === "edit" ? "Edit Product" : "Create Product"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Component */}
            <ImageUpload
              files={imageFiles}
              onFilesChange={setImageFiles}
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading 
                  ? "Saving..." 
                  : formType === "edit" 
                    ? "Update Product" 
                    : "Create Product"
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/products")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}