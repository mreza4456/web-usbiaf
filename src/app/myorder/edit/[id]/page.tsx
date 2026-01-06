// src/app/myorder/edit/[id]/page.tsx
import OrderEditForm from '@/components/order-edit-form'; // atau path yang sesuai
import { getAllCategories } from '@/action/categories';

export default async function Page() {
    const response = await getAllCategories();
    
    // Pastikan mengirim array categories, bukan response object
    const categories = response?.success ? response.data : [];
    
    console.log('📋 Categories from page:', categories);
    
    return <OrderEditForm categories={categories} />;
}