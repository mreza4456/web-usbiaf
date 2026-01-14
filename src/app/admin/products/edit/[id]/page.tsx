// app/admin/movies/[id]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IProduct } from "@/interface";
import { getProductById } from "@/action/product";
import ProductFormPage from "@/components/product-form";
import { SiteHeader } from "@/components/site-header";
// pastikan ini ada

export default function EditMoviePage() {
  const { id } = useParams(); // ambil id dari URL
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await getProductById(id as string);
        if (res.success) {
          setProduct(res.data);
        } else {
          console.error(res.message);
        }
      } catch (err) {
        console.error("Failed to fetch Product", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return <p className="p-4">Loading movie data...</p>;
  }

  if (!product) {
    return <p className="p-4 text-red-500">Product not found</p>;
  }

  return (
    <div className="w-full"><SiteHeader title="Edit Project" />
    <div className="p-6">
     
      <ProductFormPage formType="edit" initialValues={product} />
    </div>
    </div>
  );
}
