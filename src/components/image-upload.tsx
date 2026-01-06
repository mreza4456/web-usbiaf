"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  onFilesChange: (files: File[]) => void
  files: File[]
  existingImages?: Array<{ id: string; image_url: string }>
  onRemoveExisting?: (imageId: string) => void
}

export function ImageUpload({ 
  onFilesChange, 
  files,
  existingImages = [],
  onRemoveExisting
}: ImageUploadProps) {
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    // Cleanup old preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    
    // Create new preview URLs
    const newUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(newUrls)

    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"))
    
    if (imageFiles.length !== selectedFiles.length) {
      toast.error("Some files were not images and were skipped")
    }

    if (imageFiles.length === 0) {
      toast.error("Please select at least one image file")
      return
    }

    // Add to existing files
    onFilesChange([...files, ...imageFiles])
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const totalImages = existingImages.length + files.length

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="images">Product Images</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="images"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {totalImages > 0 
            ? `${totalImages} image(s) selected. First image will be the main image.`
            : 'No images selected. You can add multiple images.'}
        </p>
      </div>

      {/* Preview Section */}
      {(existingImages.length > 0 || previewUrls.length > 0) && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Image Preview</h3>
          <div className="grid grid-cols-4 gap-3">
            {/* Existing Images (for edit mode) */}
            {existingImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="relative w-full h-32 rounded border overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={`Existing ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && files.length === 0 && (
                    <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                      Main
                    </div>
                  )}
                </div>
                {onRemoveExisting && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveExisting(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* New File Previews */}
            {previewUrls.map((url, index) => (
              <div key={`preview-${index}`} className="relative group">
                <div className="relative w-full h-32 rounded border overflow-hidden">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && existingImages.length === 0 && (
                    <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                      Main
                    </div>
                  )}
                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                    New
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}