"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Instagram, Twitch, X as XIcon } from "lucide-react"
import { supabase } from '@/config/supabase'

const TwitterXIcon = ({ className }: { className?: string }) => (
  <XIcon className={className} />
)

interface FormData {
  instagram: string
  twitch: string
  x: string
}

interface SocialMediaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SocialMediaModal({ open, onOpenChange }: SocialMediaModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    instagram: "",
    twitch: "",
    x: ""
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const hasAtLeastOneSocialMedia = () => {
    return formData.instagram.trim() || formData.twitch.trim() || formData.x.trim()
  }

  const handleSubmit = async () => {
    // Validasi minimal 1 input terisi
    if (!hasAtLeastOneSocialMedia()) {
      toast.error("Please fill in at least one social media account")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          instagram: formData.instagram.trim() || null,
          twitch: formData.twitch.trim() || null,
          x: formData.x.trim() || null,
          social_media_completed: true
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success("Profile updated successfully!")
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          social_media_completed: true
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success("Setup completed!")
      onOpenChange(false)
    } catch (error) {
      console.error('Error skipping:', error)
      toast.error("Failed to complete setup.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - tidak bisa diklik untuk menutup */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add your social media accounts to connect with your audience
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="text"
              placeholder="@username"
              value={formData.instagram}
              onChange={(e) => handleChange("instagram", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Twitch */}
          <div className="space-y-2">
            <Label htmlFor="twitch" className="flex items-center gap-2">
              <Twitch className="w-4 h-4" />
              Twitch
            </Label>
            <Input
              id="twitch"
              type="text"
              placeholder="username"
              value={formData.twitch}
              onChange={(e) => handleChange("twitch", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* X/Twitter */}
          <div className="space-y-2">
            <Label htmlFor="x" className="flex items-center gap-2">
              <TwitterXIcon className="w-4 h-4" />
              X / Twitter
            </Label>
            <Input
              id="x"
              type="text"
              placeholder="@username"
              value={formData.x}
              onChange={(e) => handleChange("x", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Validation message */}
          {!hasAtLeastOneSocialMedia() && (
            <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
        
              Please fill in at least one social media account to continue
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !hasAtLeastOneSocialMedia()}
            className="w-full"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
          {/* <Button 
            onClick={handleSkip} 
            disabled={isSubmitting}
            variant="ghost"
            className="w-full"
          >
            Skip for now
          </Button> */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            You can update your social media accounts later in settings
          </p>
        </div>
      </div>
    </div>
  )
}