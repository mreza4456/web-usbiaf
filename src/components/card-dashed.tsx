"use client"

import Image from "next/image"

function CardDashed({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative  ${className}`}>
            <img src="images/SVG/border-image.svg " className='absolute scale-[1.02] rotate-[180deg] z-1' alt="" />

            {children}
        </div>

    )
}

export default CardDashed

export function CardDashedThird({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative   ${className}`}>

            <div className="absolute inset-[-3px] border-primary clip-border border-[5px]  rounded-[27px]  z-10"></div>
            <div className="pill-accent h-[5px] sm:w-[3.5%] top-[-3px] right-[6.5%]"></div>
            <div className="pill-accent h-[5px] w-[3.5%] top-[-3px] right-[10.5%]"></div>
            <div className="pill-accent h-[5px] w-[15%] top-[-3px] right-[15%]"></div>
            <div className="pill-accent h-[5px] w-[22%] top-[-3px] right-[31%]"></div>
            <div className="pill-accent h-[5px]  w-[10%] sm:w-[15%] top-[-3px] left-[10%] sm:left-[5%]"></div>
            <div className="pill-accent h-[5px] w-[21%] top-[-3px] left-[21%]"></div>
            <div className="pill-accent h-[5px] w-[3%] top-[-3px] left-[43%]"></div>
            <div className="pill-accent h-[5px] sm:w-[3%] bottom-[-3px] left-[7%]"></div>
            <div className="pill-accent h-[5px] w-[11%] bottom-[-3px] left-[11%]"></div>
            <div className="pill-accent h-[5px] w-[25%] bottom-[-3px] left-[23%]"></div>
            <div className="pill-accent h-[5px] w-[5%] bottom-[-3px] left-[49%]"></div>
            <div className="pill-accent h-[5px] w-[13%] bottom-[-3px] right-[32%]"></div>
            <div className="pill-accent h-[5px]  w-[26%] bottom-[-3px] right-[10%] sm:right-[5%]"></div>
            <div className="pill-accent-y w-[5px] h-[45%] top-1/2 -translate-y-1/2 right-[-3px] "></div>
            <div className="pill-accent-y w-[5px] sm:h-[35%] h-[45%] top-[45%] -translate-y-1/2 left-[-3px] "></div>


            <div className="relative  z-1">
                <div className="absolute border-primary h-full border-3 -bottom-3 w-full rounded-[27px] bg-muted -z-10"></div>
                <div className="bg-white rounded-[27px] ">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardDashedCTA({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative   ${className}`}>

            <div className="absolute inset-[-3px] border-primary clip-border border-[5px]  rounded-[40px]  z-10"></div>
            <div className="pill-accent h-[5px] sm:w-[3.5%] top-[-3px] right-[6.5%]"></div>
            <div className="pill-accent h-[5px] w-[3.5%] top-[-3px] right-[10.5%]"></div>
            <div className="pill-accent h-[5px] w-[15%] top-[-3px] right-[15%]"></div>
            <div className="pill-accent h-[5px] w-[22%] top-[-3px] right-[31%]"></div>
            <div className="pill-accent h-[5px]  w-[10%] sm:w-[15%] top-[-3px] left-[10%] sm:left-[5%]"></div>
            <div className="pill-accent h-[5px] w-[21%] top-[-3px] left-[21%]"></div>
            <div className="pill-accent h-[5px] w-[3%] top-[-3px] left-[43%]"></div>
            <div className="pill-accent h-[5px] sm:w-[3%] bottom-[-3px] left-[7%]"></div>
            <div className="pill-accent h-[5px] w-[11%] bottom-[-3px] left-[11%]"></div>
            <div className="pill-accent h-[5px] w-[25%] bottom-[-3px] left-[23%]"></div>
            <div className="pill-accent h-[5px] w-[5%] bottom-[-3px] left-[49%]"></div>
            <div className="pill-accent h-[5px] w-[13%] bottom-[-3px] right-[32%]"></div>
            <div className="pill-accent h-[5px]  w-[26%] bottom-[-3px] right-[10%] sm:right-[5%]"></div>
            <div className="pill-accent-y w-[5px] h-[45%] top-1/2 -translate-y-1/2 right-[-3px] "></div>
            <div className="pill-accent-y w-[5px] sm:h-[35%] h-[45%] top-[45%] -translate-y-1/2 left-[-3px] "></div>


            <div className="relative  z-1">
                <div className="absolute border-primary h-full border-[5px] -bottom-4 w-full rounded-[40px] bg-muted -z-10"></div>
                <div className="bg-white rounded-[40px] ">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardDashedBlogMain({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative   ${className}`}>

            <div className="absolute inset-[-3.5px] border-primary clip-border border-[5px]  rounded-[20px]  z-10"></div>
            <div className="pill-accent h-[5px] sm:w-[5%] top-[-3px] right-[6.5%]"></div>
            <div className="pill-accent h-[5px] w-[3.5%] top-[-3px] right-[10.5%]"></div>
            <div className="pill-accent h-[5px] w-[10%] top-[-3px] right-[15%]"></div>
            <div className="pill-accent h-[5px] w-[36%] top-[-3px] right-[27%]"></div>
            <div className="pill-accent h-[5px]  w-[25%] sm:w-[30%] top-[-3px] left-[10%] sm:left-[5%]"></div>


            <div className="pill-accent h-[5px] sm:w-[3%] bottom-[-3px] left-[7%]"></div>
            <div className="pill-accent h-[5px] w-[11%] bottom-[-3px] left-[11%]"></div>
            <div className="pill-accent h-[5px] w-[25%] bottom-[-3px] left-[23%]"></div>
            <div className="pill-accent h-[5px] w-[5%] bottom-[-3px] left-[49%]"></div>
            <div className="pill-accent h-[5px] w-[13%] bottom-[-3px] right-[32%]"></div>
            <div className="pill-accent h-[5px]  w-[26%] bottom-[-3px] right-[10%] sm:right-[5%]"></div>
            <div className="pill-accent-y w-[5px] h-[45%] top-1/2 -translate-y-1/2 right-[-3.5px] "></div>
            <div className="pill-accent-y w-[5px] sm:h-[27%] h-[26%] top-[29%] left-[-3.5px] "></div>
            <div className="pill-accent-y w-[5px] sm:h-[10%] h-[10%] bottom-[32%] left-[-3.5px] "></div>


            <div className="relative  z-1">

                <div className="bg-white overflow-hidden rounded-[20px] ">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardDashedBlogCard({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative   ${className}`}>

            <div className="absolute inset-[-3px] border-primary clip-card-blog border-[5px]   rounded-[20px]  z-10"></div>

            <div className="pill-accent h-[10%] top-[15%] w-[5px] right-[-3px]"></div>
            <div className="pill-accent h-[23%] top-[29%] w-[5px] right-[-3px]"></div>

            <div className="  z-1">

                <div className="bg-white overflow-hidden rounded-[15px] ">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardCart({
    children,
    className = "",
    onClick,
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`relative  ${className}`}
        >
            <div className="absolute inset-[-2px] border-primary clip-border border-[3px] rounded-[15px] md:rounded-[20px] z-10 pointer-events-none"></div>

            <div className="pill-accent w-[70%] top-[-2px] h-[3px] right-[8.5%] pointer-events-none"></div>
            <div className="pill-accent w-[10%] top-[-2px] h-[3px] left-[8.5%] pointer-events-none"></div>
            <div className="pill-accent w-[79%] bottom-[-2px] h-[3px] left-[8.5%] pointer-events-none"></div>
            <div className="pill-accent h-[42%] top-[20%] w-[3px] right-[-2px] pointer-events-none"></div>
            <div className="pill-accent h-[42%] bottom-[20%] w-[3px] left-[-2px] pointer-events-none"></div>

            <div className="relative bg-white h-full z-2 rounded-[15px] md:rounded-[20px] ">
                <div className="absolute border-primary border-[3px] -right-2.5 -bottom-2.5 top-0 left-0 rounded-[20px] md:rounded-[25px] bg-muted -z-10 pointer-events-none"></div>

                <div className="bg-white rounded-[15px] overflow-hidden md:rounded-[20px]">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardSecondary({
    children,
    className = "",
    onClick,
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer ${className}`}
        >
            <div className="absolute inset-[-2px] border-primary clip-border border-[3px] rounded-[15px] md:rounded-[20px] z-10"></div>

            <div className="pill-accent w-[70%] top-[-2px] h-[3px] right-[8.5%]"></div>
            <div className="pill-accent w-[10%] top-[-2px] h-[3px] left-[8.5%]"></div>
            <div className="pill-accent w-[79%] bottom-[-2px] h-[3px] left-[8.5%]"></div>
            <div className="pill-accent h-[42%] top-[20%] w-[3px] right-[-2px]"></div>
            <div className="pill-accent h-[42%] bottom-[20%] w-[3px] left-[-2px]"></div>

            <div className="relative bg-white h-full z-2 rounded-[15px] md:rounded-[20px]">
                <div className="absolute border-primary border-[3px] -right-2 -bottom-2 top-0 left-0 rounded-[20px] md:rounded-[25px] bg-muted -z-10"></div>

                <div className="bg-white rounded-[15px] overflow-hidden md:rounded-[20px]">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardOutline({
    children,
    className = "",
    onClick,
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer ${className}`}
        >
            <div className="absolute inset-[-2.5px] border-primary clip-border border-[3px] rounded-[10px] md:rounded-[15px] z-10  pointer-events-none"></div>

            <div className="pill-accent w-[70%] top-[-2.5px] h-[3px] right-[8.5%] pointer-events-none"></div>
            <div className="pill-accent w-[10%] top-[-2.5px] h-[3px] left-[8.5%] pointer-events-none"></div>
            <div className="pill-accent w-[79%] bottom-[-2.5px] h-[3px] left-[8.5%] pointer-events-none"></div>
            <div className="pill-accent h-[42%] top-[20%] w-[3px] right-[-2.5px] pointer-events-none"></div>
            <div className="pill-accent h-[42%] bottom-[20%] w-[3px] left-[-2.5px] pointer-events-none"></div>

            <div className="relative bg-white h-full z-2 rounded-[10px] md:rounded-[15px]">
                {/* <div className="absolute border-primary border-[3px] -right-2 -bottom-2 top-0 left-0 rounded-[20px] md:rounded-[25px] bg-muted -z-10"></div> */}

                <div className="bg-white rounded-[10px] overflow-hidden md:rounded-[15px]">
                    {children}
                </div>
            </div>
        </div>
    )
}
export function CardAuth({
    children,
    className = "",
    onClick,
    variant = "signin",
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    variant?: "signin" | "signup"
}) {
    const badgeImage =
        variant === "signup"
            ? "/images/signupbadge@3x.webp"
            : "/images/signinbadge@3x.webp"

    return (
        <>
            <svg
                width="0"
                height="0"
                style={{ position: "absolute" }}
            >
                <defs>
                    <clipPath id="clip" clipPathUnits="objectBoundingBox">
                        <polygon points="
                            0,0
                            0.1,0
                            0.1,0.1
                            0.9,0.1
                            0.9,0
                            1,0
                            1,0.3
                            0.9,0.3
                            0.9,0.7
                            1,0.7
                            1,1
                            0.9,1
                            0.9,0.9
                            0.1,0.9
                            0.1,1
                            0,1
                            0,0.7
                            0.1,0.7
                            0.1,0.3
                            0,0.3
                        " />
                    </clipPath>
                </defs>
            </svg>

            <div
                onClick={onClick}
                className={`relative ${className}`}
            >
                <div className="absolute inset-[-2.5px] border-primary [clip-path:url('#clip')] border-[5px] rounded-[25px] md:rounded-[30px] z-10 pointer-events-none" />

                <div className="pill-accent w-[69%] top-[-2.5px] h-[5px] right-[11%] pointer-events-none" />
                <div className="pill-accent w-[10%] top-[-2.5px] h-[5px] left-[8.5%] pointer-events-none" />
                <div className="pill-accent w-[80%] bottom-[-2.5px] h-[5px] left-[8.5%] pointer-events-none" />

                <div className="pill-accent h-[42%] top-[32%] w-[5px] right-[-2px] pointer-events-none" />
                <div className="pill-accent h-[35%] top-[20%] w-[5px] left-[-2px] pointer-events-none" />
                <div className="pill-accent h-[10%] bottom-[32%] w-[5px] left-[-2px] pointer-events-none" />

                <Image
                    src={badgeImage}
                    className="absolute hidden md:block bottom-15 -left-15 z-20"
                    alt=""
                    width={200}
                    height={100}
                />

                <div className="relative bg-white h-full z-2 rounded-[15px] md:rounded-[20px]">
                    <div className="absolute border-primary border-[5px] -right-3.5 -bottom-3.5 top-0 left-0 rounded-[35px] md:rounded-[40px] bg-muted -z-10 pointer-events-none" />

                    <div className="bg-white rounded-[25px] overflow-hidden md:rounded-[30px] z-20">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}
export function CardTicket({
    children,
    className = "",
    onClick,
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`relative  ${className}`}
        >
            <div className="absolute inset-[-2.3px] border-primary clip-border border-[3.5px] rounded-[15px] md:rounded-[20px] z-10"></div>

            <div className="pill-accent w-[70%] top-[-2px] h-[3px] right-[8.5%]"></div>
            <div className="pill-accent w-[10%] top-[-2px] h-[3px] left-[8.5%]"></div>
            <div className="pill-accent w-[79%] bottom-[-2px] h-[3px] left-[8.5%]"></div>
            <div className="pill-accent h-[42%] top-[20%] w-[3px] right-[-2px]"></div>
            <div className="pill-accent h-[42%] bottom-[20%] w-[3px] left-[-2px]"></div>

            <div className="relative bg-white h-full z-2 rounded-[15px] md:rounded-[20px]">
                <div className="absolute border-primary border-[3px] -right-2 -bottom-2 top-0 left-0 rounded-[20px] md:rounded-[25px] bg-muted -z-10"></div>

                <div className="bg-white rounded-[15px] overflow-hidden md:rounded-[20px]">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function CardReview({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative   ${className}`}>

            <div className="absolute inset-[-2px] border-primary clip-border border-[5px] rounded-[20px]  md:rounded-[25px]  z-10"></div>

            <div className="pill-accent w-[70%] top-[-2px] h-[5px] right-[8.5%]"></div>
            <div className="pill-accent w-[10%] top-[-2px] h-[5px] left-[8.5%]"></div>
            <div className="pill-accent w-[79%] bottom-[-2px] h-[5px] left-[8.5%]"></div>
            <div className="pill-accent h-[42%] top-[20%] w-[5px] right-[-2px]"></div>
            <div className="pill-accent h-[42%] bottom-[20%] w-[5px] left-[-2px]"></div>



            <div className="bg-white h-full  z-2 rounded-[20px]  md:rounded-[25px]">
                <div className="absolute border-primary border-[4px] -right-2.5  -bottom-2.5 top-0 left-0 rounded-[25px]  md:rounded-[30px] bg-muted -z-10"></div>
                <div className=" bg-white rounded-[20px]  md:rounded-[25px] ">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function BadgeCard({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`relative  ${className}`}>
            <div className="relative  text-lilita text-primary    z-1">
                <div className="absolute inset-[-2px] badge-clip-border bg-primary"></div>
                <div className="badge-clip bg-muted  w-fit px-4">

                    {children}
                </div>
            </div>
        </div>
    )
}

