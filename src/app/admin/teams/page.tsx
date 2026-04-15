"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, User, Loader2, X } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { ITeams } from "@/interface"
import {
    addTeam,
    deleteTeam,
    getAllTeams,
    updateTeam,
} from "@/action/teams"
import { SiteHeader } from "@/components/site-header"
import Example from "@/components/skeleton"

const teamSchema = z.object({
    name: z.string().min(2, "Minimum 2 characters required"),
    position: z.string().min(2, "Minimum 2 characters required"),
    projects: z.string().optional(),
    descriptions: z.string().optional(),
})

type TeamForm = z.infer<typeof teamSchema>

export default function TeamsManagementPage() {
    const [open, setOpen] = React.useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [editingTeam, setEditingTeam] = React.useState<ITeams | null>(null)
    const [memberToDelete, setMemberToDelete] = React.useState<string | null>(null)
    const [teams, setTeams] = React.useState<ITeams[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [deleteLoading, setDeleteLoading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
    const [photoFile, setPhotoFile] = React.useState<File | null>(null)
    const [skills, setSkills] = React.useState<string[]>([])
    const [skillInput, setSkillInput] = React.useState("")

    const fetchTeams = React.useCallback(async () => {
        try {
            setLoading(true)
            const response = await getAllTeams()

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch teams')
            }

            setTeams(response.data as any)
        } catch (error: any) {
            toast.error(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        let isMounted = true

        const load = async () => {
            if (!isMounted) return
            await fetchTeams()
        }

        load()

        return () => {
            isMounted = false
        }
    }, [fetchTeams])

    const form = useForm<TeamForm>({
        resolver: zodResolver(teamSchema),
        defaultValues: {
            name: "",
            position: "",
            projects: "",
            descriptions: "",
        },
    })

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file')
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB')
                return
            }

            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()])
            setSkillInput("")
        }
    }

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(skill => skill !== skillToRemove))
    }

    const handleSubmit = async (values: TeamForm) => {
        console.log("🚀 Form submit triggered")
        console.log("🚀 Submit values:", values)
        console.log("🚀 Photo file:", photoFile)
        console.log("🚀 Skills:", skills)
        console.log("🚀 Editing team:", editingTeam)
        
        if (submitting) {
            console.log("🚀 Already submitting, ignoring...")
            return
        }
        
        try {
            setSubmitting(true)
            
            // Validate required fields
            if (!values.name || !values.position) {
                toast.error("Please fill in all required fields")
                return
            }

            const formData = new FormData()
            formData.append('name', values.name)
            formData.append('position', values.position)
            formData.append('projects', values.projects || '')
            formData.append('description', values.descriptions || '')
            formData.append('skills', JSON.stringify(skills))
            
            console.log("🚀 FormData entries:")
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value)
            }
            
            if (photoFile) {
                formData.append('photo', photoFile)
                console.log("🚀 Adding photo to FormData:", photoFile.name, photoFile.size)
            }

            console.log("🚀 Submitting to server...")
            
            let res
            if (editingTeam) {
                console.log("🚀 Updating team member ID:", editingTeam.id, "Type:", typeof editingTeam.id)
                res = await updateTeam(editingTeam.id, formData as any)
            } else {
                console.log("🚀 Creating new team member")
                res = await addTeam(formData as any)
            }
            
            console.log("🚀 Server response:", res)
            
            if (!res.success) {
                throw new Error(res.message)
            }
            
            toast.success(editingTeam ? "Team member updated successfully" : "Team member added successfully")
            setOpen(false)
            setEditingTeam(null)
            setPhotoPreview(null)
            setPhotoFile(null)
            setSkills([])
            setSkillInput("")
            form.reset()
            await fetchTeams()
        } catch (err: any) {
            console.error("🚀 Error:", err)
            toast.error(err.message || "An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (memberId: string) => {
        setMemberToDelete(memberId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!memberToDelete) return

        try {
            setDeleteLoading(true)
            const response = await deleteTeam(memberToDelete)
            if (!response.success) throw new Error(response.message)
            toast.success("Team member deleted successfully")
            setDeleteConfirmOpen(false)
            setMemberToDelete(null)
            fetchTeams()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const columns: ColumnDef<ITeams>[] = [
        {
            accessorKey: "photo_url",
            header: "Photo",
            cell: ({ row }) => {
                return row.original.photo_url ? (
                    <img 
                        src={row.original.photo_url} 
                        alt={row.original.name}
                        className="w-16 h-16 object-cover rounded-full"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                )
            }
        },
        { 
            accessorKey: "name", 
            header: "Name",
            cell: ({ row }) => {
                return <span className="font-medium">{row.original.name}</span>
            }
        },
        { 
            accessorKey: "position", 
            header: "Position",
            cell: ({ row }) => {
                return <span className="text-sm text-gray-600">{row.original.position}</span>
            }
        },
        { 
            accessorKey: "skills", 
            header: "Skills",
            cell: ({ row }) => {
                const skills = row.original.skills || []
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                        {skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{skills.length - 3}
                            </Badge>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "projects",
            header: "Projects",
            cell: ({ row }) => {
                return <span className="text-sm">{row.original.projects || '0'}</span>
            }
        },
        {
            accessorKey: "created_at",
            header: "Joined",
            cell: ({ row }) => {
                return <span className="text-sm text-gray-500">{formatDate(row.original.created_at)}</span>
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const member = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingTeam(member)
                                form.reset({
                                    name: member.name,
                                    position: member.position,
                                    projects: String(member.projects) || "",
                                    descriptions: member.descriptions || "",
                                })
                                setPhotoPreview(member.photo_url || null)
                                setPhotoFile(null)
                                setSkills(member.skills || [])
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDeleteClick(member.id)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="w-full">
            <SiteHeader title="Teams" />
            <div className="w-full px-7 pb-10 mx-auto">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Teams Management</h1>
                    <p className="text-gray-500">Manage your team members and their information</p>
                </div>
                
                <div className="items-center">
                    <Dialog open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            setPhotoPreview(null)
                            setPhotoFile(null)
                            setEditingTeam(null)
                            setSkills([])
                            setSkillInput("")
                            form.reset()
                        }
                    }}>
                        <DialogTrigger asChild className="float-end ml-5">
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTeam ? "Edit Team Member" : "Add Team Member"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={(e) => {
                                        console.log("🚀 Form onSubmit event triggered")
                                        e.preventDefault()
                                        form.handleSubmit(handleSubmit)(e)
                                    }}
                                    className="space-y-4"
                                >
                                    {/* Photo Upload */}
                                    <FormItem>
                                        <FormLabel>Photo</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4">
                                                <Input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className="cursor-pointer"
                                                />
                                                {photoPreview && (
                                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mx-auto">
                                                        <img 
                                                            src={photoPreview} 
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                                                            onClick={() => {
                                                                setPhotoPreview(null)
                                                                setPhotoFile(null)
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="Enter member name"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Position *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="Enter position (e.g., Frontend Developer)"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Skills Input */}
                                    <FormItem>
                                        <FormLabel>Skills</FormLabel>
                                        <FormControl>
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <Input 
                                                        type="text" 
                                                        placeholder="Add a skill (e.g., React, Node.js)"
                                                        value={skillInput}
                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                handleAddSkill()
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={handleAddSkill}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {skills.map((skill, index) => (
                                                            <Badge 
                                                                key={index} 
                                                                variant="secondary"
                                                                className="cursor-pointer hover:bg-red-100"
                                                                onClick={() => handleRemoveSkill(skill)}
                                                            >
                                                                {skill}
                                                                <X className="ml-1 h-3 w-3" />
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                    <FormField
                                        control={form.control}
                                        name="projects"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Projects</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="text" 
                                                        placeholder="Number of projects completed"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="descriptions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descriptions</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        {...field} 
                                                        rows={4}
                                                        placeholder="Brief description or bio"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button 
                                        type="submit" 
                                        className="w-full" 
                                        disabled={submitting}
                                        onClick={() => console.log("🚀 Button clicked")}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingTeam ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingTeam ? "Update Team Member" : "Add Team Member"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center ">
                      <Example/>
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={teams} 
                        filterColumn="name" 
                        title="All Team Members"
                        badgeText={`${teams.length} Members`}
                        addButtonText="Add Team Member"
                        onAddClick={() => {
                            console.log("🚀 Add button clicked")
                            setEditingTeam(null)
                            setPhotoPreview(null)
                            setPhotoFile(null)
                            setSkills([])
                            setSkillInput("")
                            form.reset({
                                name: "",
                                position: "",
                                projects: "",
                                descriptions: "",
                            })
                            setOpen(true)
                        }} 
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={setDeleteConfirmOpen}
                    loading={deleteLoading}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    )
}