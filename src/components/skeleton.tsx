import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./ui/card";


const Example = () => (
    <div className="flex w-full min-h-screen flex-col gap-3">
        <Card className="bg-white/50 p-12">
            
            {Array.from({ length: 4 }).map((_, i) => (
                <div className="grid grid-cols-1 items-center gap-4  " key={i}>
                    <div className="flex items-center gap-3 ">
                   
                        <Skeleton className="h-10 flex-1" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                
               
                </div>
            ))}
        </Card>
    </div>
);

export default Example;
