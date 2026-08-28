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
import { ICategory, IPackageCategories, IImageCategories, IIncludes, IClassService } from "@/interface"
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
    const [classServices, setClassServices] = React.useState<IClassService[]>([]) // BARU

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const categoryResponse = await getCategoriesById(params.id as string)

                if (!categoryResponse.success) {
                    throw new Error(categoryResponse.message)
                }

                setCategory(categoryResponse.data)

                if (categoryResponse.data?.images) {
                    setImages(categoryResponse.data.images)
                }

                if (categoryResponse.data?.includes) {
                    setIncludes(categoryResponse.data.includes)
                }

                // BARU: simpan classServices supaya bisa jadi default value di form
                if ((categoryResponse.data as any)?.classServices) {
                    setClassServices((categoryResponse.data as any).classServices)
                }

                const packagesResponse = await getPackageCategoriesByCategoryId(params.id as string)

                if (packagesResponse.success) {
                    setPackages(packagesResponse.data)
                }
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
        try {
            setIsSubmitting(true)

            // BARU: destructure classIds terpisah, JANGAN ikut masuk ke categoryData
            const {
                images: updatedImages,
                packages: updatedPackages,
                includes: updatedIncludes,
                classIds, // <-- dikeluarkan dari categoryData
                ...categoryData
            } = values

            // ==========================
            // UPDATE CATEGORY + IMAGES + CLASS
            // ==========================
            const categoryRes = await updateCategories(
                params.id as string,
                categoryData,
                updatedImages || [],
                undefined,   // iconFile - tidak dipakai di sini karena icon di-handle di form via field "icon"
                undefined,   // removeIcon
                classIds     // BARU: dikirim sebagai parameter terpisah
            )

            if (!categoryRes.success) {
                throw new Error(categoryRes.message)
            }

            // ==========================
            // HANDLE INCLUDES
            // ==========================
            const submittedIncludes = updatedIncludes || []

            const existingIncludeIds = includes.map((inc) => inc.id)
            const submittedIncludeIds = submittedIncludes
                .filter((inc: any) => inc.id)
                .map((inc: any) => inc.id)

            const includesToDelete = existingIncludeIds.filter(
                (id) => !submittedIncludeIds.includes(id)
            )

            for (const incId of includesToDelete) {
                await deleteInclude(incId)
            }

            const includePromises = submittedIncludes
                .filter((inc: any) => inc.include_name?.trim())
                .map((inc: any) => {
                    if (inc.id) {
                        return updateInclude(inc.id, inc.include_name)
                    }
                    return addInclude(params.id as string, inc.include_name)
                })

            const includeResults = await Promise.all(includePromises)
            const failedInclude = includeResults.find((res) => !res.success)

            // ==========================
            // HANDLE PACKAGES
            // ==========================
            const submittedPackages = updatedPackages || []

            const existingPackageIds = packages.map((p) => p.id)
            const submittedPackageIds = submittedPackages
                .filter((p: any) => p.id)
                .map((p: any) => p.id)

            const packagesToDelete = existingPackageIds.filter(
                (id) => !submittedPackageIds.includes(id)
            )

            for (const pkgId of packagesToDelete) {
                await deletePackageCategory(pkgId)
            }

            const packagePromises = submittedPackages.map((pkg: any) => {
                const packageData = {
                    categories_id: params.id as string,
                    name: pkg.name,
                    price: pkg.price,
                    package: pkg.package,
                    description: pkg.description || "",
                }

                if (pkg.id) {
                    return updatePackageCategory(pkg.id, packageData)
                }
                return addPackageCategory(packageData)
            })

            const packageResults = await Promise.all(packagePromises)
            const failedPackage = packageResults.find((res) => !res.success)

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
                            packages: packages,
                            classServices: classServices // BARU
                        }}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    )
}