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
import { ICategory, IPackageCategories, IImageCategories, IIncludes } from "@/interface"
import { SiteHeader } from "@/components/site-header"
import { addInclude, deleteInclude, updateInclude } from "@/action/includes"

export default function EditCategoryPage() {
    const router = useRouter()
    const params = useParams()
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [category, setCategory] = React.useState<ICategory | null>(null)
    const [images, setImages] = React.useState<IImageCategories[]>([])
    const [packages, setPackages] = React.useState<IPackageCategories[]>([])
    const [loading, setLoading] = React.useState(true)
    const [includes, setIncludes] = React.useState<IIncludes[]>([])

    // di dalam fetchData():

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

                if (categoryResponse.data?.includes) {
                    setIncludes(categoryResponse.data.includes)
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

            // Pisahkan images, packages, dan includes dari data category
            const {
                images: updatedImages,
                packages: updatedPackages,
                includes: updatedIncludes,
                ...categoryData
            } = values

            console.log("=== CATEGORY DATA ===", categoryData)
            console.log("=== UPDATED IMAGES ===", updatedImages)
            console.log("=== UPDATED PACKAGES ===", updatedPackages)
            console.log("=== UPDATED INCLUDES ===", updatedIncludes)

            // ==========================
            // UPDATE CATEGORY + IMAGES
            // ==========================
            const categoryRes = await updateCategories(
                params.id as string,
                categoryData,
                updatedImages || []
            )

            if (!categoryRes.success) {
                throw new Error(categoryRes.message)
            }

            console.log("✅ Category and images updated successfully")

            // ==========================
            // HANDLE INCLUDES
            // ==========================
            const submittedIncludes = updatedIncludes || []

            const existingIncludeIds = includes.map((inc) => inc.id)
            const submittedIncludeIds = submittedIncludes
                .filter((inc: any) => inc.id)
                .map((inc: any) => inc.id)

            console.log("=== EXISTING INCLUDE IDs ===", existingIncludeIds)
            console.log("=== SUBMITTED INCLUDE IDs ===", submittedIncludeIds)

            // Delete includes yang dihapus
            const includesToDelete = existingIncludeIds.filter(
                (id) => !submittedIncludeIds.includes(id)
            )

            console.log("=== INCLUDES TO DELETE ===", includesToDelete)

            for (const incId of includesToDelete) {
                const deleteRes = await deleteInclude(incId)
                console.log(
                    `Deleted include ${incId}:`,
                    deleteRes.success ? "✅" : "❌",
                    deleteRes.message
                )
            }

            // Update/Create includes
            const includePromises = submittedIncludes
                .filter((inc: any) => inc.include_name?.trim())
                .map((inc: any, idx: number) => {
                    if (inc.id) {
                        console.log(
                            `[${idx}] Updating include ${inc.id}:`,
                            inc.include_name
                        )
                        return updateInclude(inc.id, inc.include_name)
                    }

                    console.log(
                        `[${idx}] Creating include:`,
                        inc.include_name
                    )
                    return addInclude(params.id as string, inc.include_name)
                })

            const includeResults = await Promise.all(includePromises)

            console.log("=== INCLUDE RESULTS ===", includeResults)

            const failedInclude = includeResults.find((res) => !res.success)

            // ==========================
            // HANDLE PACKAGES
            // ==========================
            const submittedPackages = updatedPackages || []

            const existingPackageIds = packages.map((p) => p.id)
            const submittedPackageIds = submittedPackages
                .filter((p: any) => p.id)
                .map((p: any) => p.id)

            console.log("=== EXISTING PACKAGE IDs ===", existingPackageIds)
            console.log("=== SUBMITTED PACKAGE IDs ===", submittedPackageIds)

            // Delete package yang dihapus
            const packagesToDelete = existingPackageIds.filter(
                (id) => !submittedPackageIds.includes(id)
            )

            console.log("=== PACKAGES TO DELETE ===", packagesToDelete)

            for (const pkgId of packagesToDelete) {
                const deleteRes = await deletePackageCategory(pkgId)
                console.log(
                    `Deleted package ${pkgId}:`,
                    deleteRes.success ? "✅" : "❌",
                    deleteRes.message
                )
            }

            // Update/Create packages
            const packagePromises = submittedPackages.map((pkg: any, idx: number) => {
                const packageData = {
                    categories_id: params.id as string,
                    name: pkg.name,
                    price: pkg.price,
                    package: pkg.package,
                    description: pkg.description || "",
                }

                if (pkg.id) {
                    console.log(
                        `[${idx}] Updating package ${pkg.id}:`,
                        packageData
                    )
                    return updatePackageCategory(pkg.id, packageData)
                }

                console.log(`[${idx}] Creating package:`, packageData)
                return addPackageCategory(packageData)
            })

            const packageResults = await Promise.all(packagePromises)

            console.log("=== PACKAGE RESULTS ===", packageResults)

            const failedPackage = packageResults.find((res) => !res.success)

            // ==========================
            // HANDLE WARNINGS
            // ==========================
            if (failedInclude || failedPackage) {
                let warningMessage = "Kategori berhasil diupdate, namun "

                if (failedInclude && failedPackage) {
                    warningMessage += "ada feature dan paket yang gagal diupdate."
                } else if (failedInclude) {
                    warningMessage += `ada feature yang gagal: ${failedInclude.message}`
                } else {
                    warningMessage += `ada paket yang gagal: ${failedPackage?.message}`
                }

                toast.warning(warningMessage)
                router.push("/admin/categories")
                return
            }

            // ==========================
            // SUCCESS
            // ==========================
            const imageCount = updatedImages?.length || 0
            const packageCount = submittedPackages.length
            const includeCount = submittedIncludes.length

            toast.success(
                `Kategori, ${imageCount} gambar, ${includeCount} feature, dan ${packageCount} paket berhasil diupdate`
            )

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
        <div>
            <SiteHeader title="Edit Service" />
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
                        <h1 className="text-3xl font-bold mb-2">Edit Services & Packages</h1>
                        <p className="text-gray-500">Manage your Services and Package</p>
                    </div>
                </div>

                <div className="mt-7">

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
        </div>
    )
}