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
import { SiteHeader } from "@/components/site-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import Example from "@/components/skeleton"

export default function ProductPage() {
  const router = useRouter()
  const [products, setProducts] = React.useState<IProduct[]>([])
  const [images, setImages] = React.useState<IImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openDelete, setOpenDelete] = React.useState(false)
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null)

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
  const handleDelete = async () => {
    if (!selectedProductId) return

    try {
      setLoading(true)
      const response = await deleteProducts(selectedProductId)

      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to delete")
      }

      toast.success("Product deleted successfully")
      fetchProducts()
      setOpenDelete(false)
      setSelectedProductId(null)
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
              onClick={() => {
                setSelectedProductId(product.id)
                setOpenDelete(true)
              }}
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

      <SiteHeader title="Projects" />
      <div className="w-full pb-10 mx-auto px-7">
        <div className="my-7">
          <h1 className="text-3xl font-bold mb-2">Projects Management</h1>
          <p className="text-gray-500">Manage Recents Projects</p>
        </div>
        <ConfirmDialog
          open={openDelete}
          onOpenChange={setOpenDelete}

          loading={loading}
          onConfirm={handleDelete}
        />

        <div className="">


          {loading ? (
            <div className="flex justify-center items-center">
              <Example/>
            </div>
          ) : (
            <DataTable columns={columns} data={products} filterColumn="name" title="All Projects"
              badgeText={`${products.length} Projects`}
              addButtonText="Add Projects"
              onAddClick={() => router.push("/admin/products/add")} />
          )}
        </div>
      </div>
    </div>
  )
}