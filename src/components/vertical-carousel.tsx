"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CarouselImage {
    src: string;
    alt: string;
}

interface VerticalThumbnailCarouselProps {
    images: CarouselImage[];
    className?: string;
}

export function VerticalThumbnailCarousel({ images, className }: VerticalThumbnailCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const goToPrevious = () => {
        setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (images.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    return (
        <div className={cn("flex gap-4 w-full", className)}>
            {/* Vertical Thumbnails */}
            <div className="flex flex-col gap-2 w-35">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                            "grow object-cover rounded-lg transition-all duration-300 overflow-hidden",
                            "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            currentSlide === index
                                ? "opacity-100 ring-2 ring-primary"
                                : "opacity-30"
                        )}
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Carousel */}
            <div className="relative flex-1 overflow-hidden rounded-lg bg-gray-100">
                <div className="relative h-full">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-500",
                                currentSlide === index ? "opacity-100" : "opacity-0"
                            )}
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                className="w-full h-full object-cover "
                            />
                        </div>
                    ))}
                </div>

                {/* Previous Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                    aria-label="Previous"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Next Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                    aria-label="Next"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Slide Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                currentSlide === index
                                    ? "bg-white w-8"
                                    : "bg-white/50 hover:bg-white/75"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}