import { createSupabaseServerClient } from '@/config/supabase-server';
import { getAllCategories } from '@/action/categories';
import OrderForm from '@/components/order-form';

export default async function ContactPage() {
     const supabase = await createSupabaseServerClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return <div>Please login first</div>;
    }

    const categories = await getAllCategories();

    return (
        <OrderForm
            categories={categories.data || []}
            userId={session.user.id}
        />
    );
}
