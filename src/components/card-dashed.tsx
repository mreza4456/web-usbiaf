"use client"

function CardDashed({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative card-primary-white ${className}`}>
            {/* <div className="pill-accent w-5 top-[-4px] left-[36%]"></div>
            <div className="pill-accent w-5 top-[-4px] right-[20%]"></div>
            <div className="pill-accent w-2 bottom-[-4px] right-[6%]"></div>
            <div className="pill-accent w-2 bottom-[-4px] right-[11%]"></div>
            <div className="pill-accent w-5 rotate-90 bottom-[45px] left-[-12px]"></div>
            <div className="pill-accent w-5 rotate-90 bottom-[80px] left-[-12px]"></div> */}
            <div className="overflow-hidden">
                {children}
            </div>
        </div>
    )
}

export default CardDashed