"use server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ICategory, IImageCategories, IIncludes, IClassService } from "@/interface";
import { uploadToCloudflare, deleteFromCloudflare } from "@/lib/storage";

const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

const getAuthenticatedUser = async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User tidak terautentikasi. Silakan login terlebih dahulu.");
  }

  return user;
};

const isAdmin = async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking admin role:", error);
    return false;
  }

  return data?.role === "admin";
};

export const addCategories = async (
  category: Partial<ICategory>,
  images: Partial<IImageCategories>[],
  iconFile?: File | null,
  classIds?: (number | string)[] // <-- BARU: array class_id untuk multi class
) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menambah kategori.", data: null };
    }

    const supabase = await createClient();

    let iconUrl: string | undefined = category.icon;
    if (iconFile) {
      try {
        iconUrl = await uploadIconFile(iconFile);
      } catch (uploadErr: any) {
        return { success: false, message: uploadErr.message, data: null };
      }
    }

    const categoryToInsert = { ...category, icon: iconUrl };

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .insert([categoryToInsert])
      .select()
      .single();

    if (categoryError) {
      console.error("Category insert error:", categoryError);
      if (iconFile && iconUrl) await deleteIconFile(iconUrl);
      return { success: false, message: categoryError.message, data: null };
    }

    if (images && images.length > 0) {
      const imagesToInsert = images.map((img, index) => ({
        image_url: img.image_url,
        categories_id: categoryData.id,
        sort_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("image_categories")
        .insert(imagesToInsert);

      if (imagesError) {
        console.error("Images insert error:", imagesError);
        await supabase.from("categories").delete().eq("id", categoryData.id);
        if (iconFile && iconUrl) await deleteIconFile(iconUrl);
        return { success: false, message: `Gagal menyimpan gambar: ${imagesError.message}`, data: null };
      }
    }

    // BARU: Insert relasi multi class ke class_services
    if (classIds && classIds.length > 0) {
      const classServicesToInsert = classIds.map((classId) => ({
        categories_id: categoryData.id,
        class_id: classId,
      }));

      const { error: classServicesError } = await supabase
        .from("class_services")
        .insert(classServicesToInsert);

      if (classServicesError) {
        console.error("Class services insert error:", classServicesError);
        // Rollback: hapus images & category yang sudah dibuat, plus icon
        await supabase.from("image_categories").delete().eq("categories_id", categoryData.id);
        await supabase.from("categories").delete().eq("id", categoryData.id);
        if (iconFile && iconUrl) await deleteIconFile(iconUrl);
        return { success: false, message: `Gagal menyimpan class: ${classServicesError.message}`, data: null };
      }
    }

    return { success: true, message: "Category berhasil dibuat", data: categoryData as ICategory };
  } catch (error: any) {
    console.error("addCategories error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const updateCategories = async (
  id: string,
  category: Partial<ICategory>,
  images: Partial<IImageCategories>[],
  iconFile?: File | null,
  removeIcon?: boolean,
  classIds?: (number | string)[] // <-- BARU: array class_id untuk multi class. undefined = tidak diubah
) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa mengupdate kategori.", data: null };
    }

    const supabase = await createClient();

    const { data: existingCategory } = await supabase
      .from("categories")
      .select("icon")
      .eq("id", id)
      .single();

    const oldIconUrl = existingCategory?.icon as string | undefined;

    let iconUrl = category.icon;

    if (iconFile) {
      try {
        iconUrl = await uploadIconFile(iconFile);
      } catch (uploadErr: any) {
        return { success: false, message: uploadErr.message, data: null };
      }
    } else if (removeIcon) {
      iconUrl = undefined;
    }

    const categoryToUpdate = { ...category, icon: iconUrl };

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .update(categoryToUpdate)
      .eq("id", id)
      .select()
      .single();

    if (categoryError) {
      console.error("Category update error:", categoryError);
      if (iconFile && iconUrl) await deleteIconFile(iconUrl);
      return { success: false, message: categoryError.message, data: null };
    }

    if (oldIconUrl && oldIconUrl !== iconUrl && (iconFile || removeIcon)) {
      await deleteIconFile(oldIconUrl);
    }

    // 2. Ambil existing images
    const { data: existingImages } = await supabase
      .from("image_categories")
      .select("*")
      .eq("categories_id", id);

    const existingImageIds = existingImages?.map(img => img.id) || [];
    const newImageIds = images.filter(img => img.id).map(img => img.id!);

    const imagesToDelete = existingImageIds.filter(id => !newImageIds.includes(id));
    if (imagesToDelete.length > 0) {
      const imagesToDeleteData = existingImages?.filter(img => imagesToDelete.includes(img.id)) || [];

      await Promise.all(
        imagesToDeleteData.map(img =>
          img.image_url ? deleteFromCloudflare(img.image_url) : Promise.resolve()
        )
      );

      const { error: deleteError } = await supabase
        .from("image_categories")
        .delete()
        .in("id", imagesToDelete);

      if (deleteError) {
        console.error("Images delete error:", deleteError);
      }
    }

    const newImages = images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => !img.id);

    if (newImages.length > 0) {
      const imagesToInsert = newImages.map(({ img, index }) => ({
        image_url: img.image_url,
        categories_id: id,
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from("image_categories")
        .insert(imagesToInsert);

      if (insertError) {
        console.error("Images insert error:", insertError);
      }
    }

    const existingToUpdate = images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => img.id);

    if (existingToUpdate.length > 0) {
      const updateResults = await Promise.all(
        existingToUpdate.map(({ img, index }) =>
          supabase
            .from("image_categories")
            .update({ sort_order: index })
            .eq("id", img.id!)
        )
      );

      const updateError = updateResults.find(r => r.error);
      if (updateError?.error) {
        console.error("Images sort_order update error:", updateError.error);
      }
    }

    // BARU: 6. Sync relasi multi class di class_services
    // classIds === undefined artinya class tidak diubah sama sekali (skip sync)
    if (classIds !== undefined) {
      const { data: existingClassServices, error: fetchClassServicesError } = await supabase
        .from("class_services")
        .select("class_id")
        .eq("categories_id", id);

      if (fetchClassServicesError) {
        console.error("Fetch class services error:", fetchClassServicesError);
      }

      const existingClassIds = existingClassServices?.map((cs) => cs.class_id) || [];

      const classIdsToRemove = existingClassIds.filter((cid) => !classIds.includes(cid));
      const classIdsToAdd = classIds.filter((cid) => !existingClassIds.includes(cid));

      if (classIdsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("class_services")
          .delete()
          .eq("categories_id", id)
          .in("class_id", classIdsToRemove);

        if (removeError) {
          console.error("Class services delete error:", removeError);
        }
      }

      if (classIdsToAdd.length > 0) {
        const classServicesToInsert = classIdsToAdd.map((classId) => ({
          categories_id: id,
          class_id: classId,
        }));

        const { error: addError } = await supabase
          .from("class_services")
          .insert(classServicesToInsert);

        if (addError) {
          console.error("Class services insert error:", addError);
        }
      }
    }

    return { success: true, message: "Category berhasil diupdate", data: categoryData as ICategory };
  } catch (error: any) {
    console.error("updateCategories error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const deleteCategories = async (id: string) => {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return { success: false, message: "Akses ditolak. Hanya admin yang bisa menghapus kategori.", data: null };
    }

    const supabase = await createClient();

    // BARU: 0. Hapus dulu relasi multi class di class_services
    const { error: classServicesError } = await supabase
      .from("class_services")
      .delete()
      .eq("categories_id", id);

    if (classServicesError) {
      console.error("Class services delete error:", classServicesError);
      return {
        success: false,
        message: `Gagal menghapus relasi class: ${classServicesError.message}`,
        data: null
      };
    }

    const { data: imageCategoriesToDelete } = await supabase
      .from("image_categories")
      .select("image_url")
      .eq("categories_id", id);

    if (imageCategoriesToDelete && imageCategoriesToDelete.length > 0) {
      await Promise.all(
        imageCategoriesToDelete.map(img =>
          img.image_url ? deleteFromCloudflare(img.image_url) : Promise.resolve()
        )
      );
    }

    const { error: imagesError } = await supabase
      .from("image_categories")
      .delete()
      .eq("categories_id", id);

    if (imagesError) {
      console.error("Images delete error:", imagesError);
      return {
        success: false,
        message: `Gagal menghapus gambar: ${imagesError.message}`,
        data: null
      };
    }

    const { data: packageRelations, error: packageRelationsError } = await supabase
      .from("categories_package")
      .select("id")
      .eq("categories_id", id);

    if (packageRelationsError) {
      console.error("Fetch package relations error:", packageRelationsError);
      return {
        success: false,
        message: `Gagal mengambil relasi package: ${packageRelationsError.message}`,
        data: null
      };
    }

    const packageIds = packageRelations?.map(p => p.id) || [];

    if (packageIds.length > 0) {
      const { error: cartsError } = await supabase
        .from("carts")
        .delete()
        .in("package_id", packageIds);

      if (cartsError) {
        console.error("Carts delete error:", cartsError);
        return {
          success: false,
          message: `Gagal menghapus carts terkait: ${cartsError.message}`,
          data: null
        };
      }
    }

    const { error: packagesError } = await supabase
      .from("categories_package")
      .delete()
      .eq("categories_id", id);

    if (packagesError) {
      console.error("Packages delete error:", packagesError);
      return {
        success: false,
        message: `Gagal menghapus relasi package: ${packagesError.message}`,
        data: null
      };
    }
    const { error: IncludesError } = await supabase
      .from("categories_include")
      .delete()
      .eq("categories_id", id);

    if (IncludesError) {
      console.error("Packages delete error:", IncludesError);
      return {
        success: false,
        message: `Gagal menghapus relasi package: ${IncludesError.message}`,
        data: null
      };
    }
    const { data: categoryToDelete } = await supabase
      .from("categories")
      .select("icon")
      .eq("id", id)
      .single();

    if (categoryToDelete?.icon) {
      await deleteIconFile(categoryToDelete.icon);
    }

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Category delete error:", error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }

    return {
      success: true,
      message: "Category, images, dan relasi package berhasil dihapus",
      data: data as ICategory
    };
  } catch (error: any) {
    console.error("deleteCategories error:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan saat menghapus category",
      data: null
    };
  }
};

export const getCategoriesById = async (id: string) => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        packages:categories_package(*),
        includes:categories_include(*),
        classServices:class_services(id, class_id, class:class(*))
      `)
      .eq("id", id)
      .order("sort_order", { foreignTable: "image_categories", ascending: true })
      .single();

    if (error) {
      console.error("getCategoriesById error:", error);
      return { success: false, message: error.message, data: null };
    }

    return {
      success: true,
      data: data as ICategory & {
        images: IImageCategories[],
        includes: IIncludes[],
        classServices: IClassService[]
      }
    };
  } catch (error: any) {
    console.error("getCategoriesById catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: null };
  }
};

export const getAllCategories = async () => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        classServices:class_services(id, class_id, class:class(*))
      `)
      .order("created_at", { ascending: false })
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

    if (error) {
      console.error("getAllCategories error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return {
      success: true,
      data: data as (ICategory & { images: IImageCategories[], classServices: IClassService[] })[]
    };
  } catch (error: any) {
    console.error("getAllCategories catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

export const getActiveCategories = async (filters: any) => {
  try {
    const supabase = await createClient();

    let qry = supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        classServices:class_services(id, class_id, class:class(*))
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

    if (filters.search) {
      qry = qry.ilike("name", `%${filters.search}%`);
    }

    if (filters.genre) {
      qry = qry.ilike("genre", `%${filters.genre}%`);
    }

    // BARU: filter by class_id, karena sekarang multi class via junction table
    if (filters.classId) {
      const { data: catIds } = await qry;
      // fallback filter dilakukan di bawah jika query builder tidak mendukung filter nested langsung
    }

    const { data, error } = await qry;

    if (error) {
      console.error("getActiveCategories error:", error);
      return {
        success: false,
        message: error.message,
      };
    }

    let result = data as (ICategory & { images: IImageCategories[], classServices: IClassService[] })[];

    // Filter manual berdasarkan classId (karena filter nested relation via .eq tidak reliable di postgrest)
    if (filters.classId) {
      result = result.filter((cat) =>
        cat.classServices?.some((cs) => String(cs.class_id) === String(filters.classId))
      );
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("getActiveCategories catch error:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan",
      data: [],
    };
  }
};

const uploadIconFile = async (file: File): Promise<string> => {
  const result = await uploadToCloudflare(file);

  if (!result.success || !result.url) {
    throw new Error(`Gagal upload icon: ${result.message}`);
  }

  return result.url;
};

const deleteIconFile = async (iconUrl: string) => {
  try {
    const result = await deleteFromCloudflare(iconUrl);
    if (!result.success) {
      console.error("deleteIconFile error:", result.message);
    }
  } catch (error) {
    console.error("deleteIconFile catch error:", error);
  }
};

export const getCategoriesGroupedByBadge = async () => {
  try {
    const supabase = await createClient();

    const { data: badges, error: badgesError } = await supabase
      .from("badge_services")
      .select("*");

    if (badgesError) {
      console.error("getCategoriesGroupedByBadge badges error:", badgesError);
      return { success: false, message: badgesError.message, data: [] };
    }

    if (!badges || badges.length === 0) {
      return { success: true, data: [] };
    }

    const { data: allCategories, error: categoriesError } = await supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        classServices:class_services(id, class_id, class:class(*))
      `)
      .order("created_at", { ascending: false })
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

    if (categoriesError) {
      console.error("getCategoriesGroupedByBadge categories error:", categoriesError);
      return { success: false, message: categoriesError.message, data: [] };
    }

    const result = badges
      .map((badge) => {
        const categoriesForBadge = (allCategories || []).filter(
          (cat: any) => String(cat.badge_id) === String(badge.id)
        );

        if (categoriesForBadge.length < 3) {
          return null;
        }

        const limitedCategories = categoriesForBadge.slice(0, 3) as (ICategory & {
          images: IImageCategories[],
          classServices: IClassService[]
        })[];

        // BARU: kumpulkan semua class unik dari classServices di kategori-kategori badge ini
        const classMap = new Map<string, any>();
        categoriesForBadge.forEach((cat: any) => {
          (cat.classServices || []).forEach((cs: any) => {
            if (cs.class && !classMap.has(String(cs.class.id))) {
              classMap.set(String(cs.class.id), cs.class);
            }
          });
        });
        const uniqueClasses = Array.from(classMap.values());

        return {
          badge,
          categories: limitedCategories,
          classes: uniqueClasses, // BARU: daftar class unik dalam badge ini
        };
      })
      .filter((item) => item !== null);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("getCategoriesGroupedByBadge catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};

export const getHandpickCategories = async (limit?: number) => {
  try {
    const supabase = await createClient();

    let qry = supabase
      .from("categories")
      .select(`
        *,
        images:image_categories(*),
        classServices:class_services(id, class_id, class:class(*))
      `)
      .eq("is_handpick", true)
      .order("created_at", { ascending: false })
      .order("sort_order", { foreignTable: "image_categories", ascending: true });

    // Optional limit, kalau tidak diisi ambil semua
    if (limit && limit > 0) {
      qry = qry.limit(limit);
    }

    const { data, error } = await qry;

    if (error) {
      console.error("getHandpickCategories error:", error);
      return { success: false, message: error.message, data: [] };
    }

    return {
      success: true,
      data: data as (ICategory & { images: IImageCategories[], classServices: IClassService[] })[]
    };
  } catch (error: any) {
    console.error("getHandpickCategories catch error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan", data: [] };
  }
};