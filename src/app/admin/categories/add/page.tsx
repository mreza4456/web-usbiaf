"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CategoryForm } from "@/components/categoriy-form"
import { addCategories } from "@/action/categories"
import { addPackageCategory } from "@/action/package"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AddCategoryPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (values: any) => {
        console.log("🚀 ADD CATEGORY - HANDLE SUBMIT CALLED!")
        console.log("=== FORM VALUES ===", values)
        
        try {
            setIsSubmitting(true)
            
            // 1. Pisahkan images dan packages dari category data
            const { images, packages, ...categoryData } = values
            
            console.log("=== CATEGORY DATA ===", categoryData)
            console.log("=== IMAGES ===", images)
            console.log("=== PACKAGES ===", packages)
            
            // 2. Create Category dengan images
            const categoryRes = await addCategories(categoryData, images || [])
            
            if (!categoryRes.success) {
                throw new Error(categoryRes.message)
            }
            
            if (!categoryRes.data) {
                throw new Error("Kategori dibuat tetapi data kosong")
            }
            
            const createdCategory = categoryRes.data
            console.log("✅ Category created:", createdCategory.id)
            
            // 3. Create Packages jika ada
            if (packages && packages.length > 0) {
                console.log(`Creating ${packages.length} packages...`)
                
                const packagePromises = packages.map((pkg: any, idx: number) => {
                    const packageData = {
                        categories_id: createdCategory.id,
                        name: pkg.name,
                        price: pkg.price,
                        package: pkg.package,
                        description: pkg.description || "",
                    }
                    console.log(`[${idx}] Creating package:`, packageData)
                    return addPackageCategory(packageData)
                })
                
                const packageResults = await Promise.all(packagePromises)
                console.log("=== PACKAGE RESULTS ===", packageResults)
                
                // Check if any package creation failed
                const failedPackage = packageResults.find(res => !res.success)
                if (failedPackage) {
                    toast.warning(`Kategori dan gambar dibuat, namun ada paket yang gagal: ${failedPackage.message}`)
                    router.push("/admin/categories")
                    return
                }
                
                toast.success(`Kategori, ${images?.length || 0} gambar, dan ${packages.length} paket berhasil dibuat`)
            } else {
                toast.success(`Kategori dan ${images?.length || 0} gambar berhasil dibuat`)
            }

            router.push("/admin/categories")
        } catch (err: any) {
            console.error("=== ERROR ===", err)
            toast.error(err.message || "Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
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
                <h1 className="text-2xl font-bold mb-6">Add Category & Packages</h1>
                <CategoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    )
}
