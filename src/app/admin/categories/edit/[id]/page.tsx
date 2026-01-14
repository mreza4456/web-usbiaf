"use client"

import React from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { CategoryForm } from "@/components/categoriy-form"
import { updateCategories, getCategoriesById } from "@/action/categories"
import { 
    addPackageCategory, 
    updatePackageCategory, 
    deletePackageCategory,
    getPackageCategoriesByCategoryId 
} from "@/action/package"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ICategory, IPackageCategories, IImageCategories } from "@/interface"

export default function EditCategoryPage() {
    const router = useRouter()
    const params = useParams()
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [category, setCategory] = React.useState<ICategory | null>(null)
    const [images, setImages] = React.useState<IImageCategories[]>([])
    const [packages, setPackages] = React.useState<IPackageCategories[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch category with images
                const categoryResponse = await getCategoriesById(params.id as string)
                
                if (!categoryResponse.success) {
                    throw new Error(categoryResponse.message)
                }
                
                setCategory(categoryResponse.data)
                
                // Images sudah include di response getCategoriesById
                if (categoryResponse.data?.images) {
                    setImages(categoryResponse.data.images)
                }

                // Fetch packages
                const packagesResponse = await getPackageCategoriesByCategoryId(params.id as string)
                
                if (packagesResponse.success) {
                    setPackages(packagesResponse.data)
                }
                
                console.log("=== LOADED DATA ===")
                console.log("Category:", categoryResponse.data)
                console.log("Images:", categoryResponse.data?.images)
                console.log("Packages:", packagesResponse.data)
            } catch (error: any) {
                toast.error(error.message || "Gagal memuat data")
                router.push("/admin/categories")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [params.id, router])

    const handleSubmit = async (values: any) => {
        console.log("🚀 EDIT CATEGORY - HANDLE SUBMIT CALLED!")
        console.log("=== FORM VALUES ===", values)
        
        try {
            setIsSubmitting(true)
            
            // 1. Pisahkan images dan packages dari category data
            const { images: updatedImages, packages: updatedPackages, ...categoryData } = values
            
            console.log("=== CATEGORY DATA ===", categoryData)
            console.log("=== UPDATED IMAGES ===", updatedImages)
            console.log("=== UPDATED PACKAGES ===", updatedPackages)
            
            // 2. Update Category dengan images
            const categoryRes = await updateCategories(
                params.id as string, 
                categoryData, 
                updatedImages || []
            )
            
            if (!categoryRes.success) {
                throw new Error(categoryRes.message)
            }
            
            console.log("✅ Category and images updated successfully")
            
            // 3. Handle Packages
            const submittedPackages = updatedPackages || []
            const existingPackageIds = packages.map(p => p.id)
            const submittedPackageIds = submittedPackages
                .filter((p: any) => p.id)
                .map((p: any) => p.id)
            
            console.log("=== EXISTING PACKAGE IDs ===", existingPackageIds)
            console.log("=== SUBMITTED PACKAGE IDs ===", submittedPackageIds)
            
            // Delete packages that were removed
            const packagesToDelete = existingPackageIds.filter(
                id => !submittedPackageIds.includes(id)
            )
            
            console.log("=== PACKAGES TO DELETE ===", packagesToDelete)
            
            for (const pkgId of packagesToDelete) {
                const deleteRes = await deletePackageCategory(pkgId)
                console.log(`Deleted package ${pkgId}:`, deleteRes.success ? "✅" : "❌", deleteRes.message)
            }
            
            // Update or Create packages
            const packagePromises = submittedPackages.map((pkg: any, idx: number) => {
                const packageData = {
                    categories_id: params.id as string,
                    name: pkg.name,
                    price: pkg.price,
                    package: pkg.package,
                    description: pkg.description || "",
                }
                
                if (pkg.id) {
                    console.log(`[${idx}] UPDATING package ${pkg.id}:`, packageData)
                    return updatePackageCategory(pkg.id, packageData)
                } else {
                    console.log(`[${idx}] CREATING new package:`, packageData)
                    return addPackageCategory(packageData)
                }
            })
            
            const packageResults = await Promise.all(packagePromises)
            
            console.log("=== PACKAGE RESULTS ===", packageResults)
            
            // Check if any package operation failed
            const failedPackage = packageResults.find(res => !res.success)
            if (failedPackage) {
                toast.warning(`Kategori dan gambar diupdate, namun ada paket yang gagal: ${failedPackage.message}`)
                router.push("/admin/categories")
                return
            }
            
            const imageCount = updatedImages?.length || 0
            const packageCount = submittedPackages.length
            toast.success(`Kategori, ${imageCount} gambar, dan ${packageCount} paket berhasil diupdate`)
            router.push("/admin/categories")
        } catch (err: any) {
            console.error("=== ERROR ===", err)
            toast.error(err.message || "Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!category) {
        return null
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6">
            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
            </Button>

            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Category & Packages</h1>
                <CategoryForm 
                    initialData={{ 
                        ...category, 
                        images: images,
                        packages: packages 
                    }}
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting} 
                />
            </div>
        </div>
    )
}