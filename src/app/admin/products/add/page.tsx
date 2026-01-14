import ProductFormPage from "@/components/product-form";
import { SiteHeader } from "@/components/site-header";

export default function AddProducts(){
    return(
        <div className="w-full">
         <SiteHeader title="Add Project" />
            
           <ProductFormPage formType="add"/>
        </div>
     )
}