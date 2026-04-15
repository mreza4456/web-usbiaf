"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CategoryForm } from "@/components/categoriy-form"
import { addCategories } from "@/action/categories"
import { addPackageCategory } from "@/action/package"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

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
                    toast.warning(`Services dan gambar dibuat, namun ada paket yang gagal: ${failedPackage.message}`)
                    router.push("/admin/categories")
                    return
                }

                toast.success(`Services, ${images?.length || 0} gambar, dan ${packages.length} paket berhasil dibuat`)
            } else {
                toast.success(`Services dan ${images?.length || 0} gambar berhasil dibuat`)
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
        <div>
            <SiteHeader title="Add Service" />
            <div className="w-full px-7 mx-auto p-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="cursor-pointer bg-white rounded-full shadow p-5 mr-5"
                    >
                        <ArrowLeft className="h-10 w-10" />
                     
                    </Button>
                    <div className="">
                        <h1 className="text-3xl font-bold mb-2">Add Services & Packages</h1>
                        <p className="text-gray-500">Manage your Services and Package</p>
                    </div>
                </div>
                <div className="mt-7 ">
                    <CategoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
                </div>
            </div>
        </div>
    )
}
