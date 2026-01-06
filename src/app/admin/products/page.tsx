"use client"
import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { IImage, IProduct } from "@/interface"
import { deleteProducts, getAllProducts } from "@/action/product"
import { Card } from "@/components/ui/card"
import { getAllImages } from "@/action/image"
import { useRouter } from "next/navigation"

export default function ProductPage() {
  const router = useRouter()
  const [products, setProducts] = React.useState<IProduct[]>([])
  const [images, setImages] = React.useState<IImage[]>([])
  const [loading, setLoading] = React.useState(true)
 
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await getAllProducts()
           console.log(response?.message)
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to fetch products")
        console.log(response?.message)
      }
           console.log(response?.message)
      setProducts(response.data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }



  React.useEffect(() => {
    fetchProducts()

  }, [])

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    try {
      setLoading(true)
      const response = await deleteProducts(productId)
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to delete")
      }
      toast.success("Product deleted successfully")
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<IProduct>[] = [
   
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.price
        return price ? `$${parseFloat(price.toString()).toFixed(2)}` : "-"
      }
    },
    {
      accessorKey: "description",
      header: "Description"
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/admin/products/edit/${product.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(product.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button onClick={() => router.push("/admin/products/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DataTable columns={columns} data={products} filterColumn="name" />
        )}
      </Card>
    </div>
  )
}