"use server";

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { ITeams } from "@/interface";

export const getAllTeams = async () => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("teams")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return {
                success: false,
                message: error.message,
                data: [],
            };
        }

        console.log('Teams from database:', JSON.stringify(data, null, 2));

        return {
            success: true,
            data: data as ITeams[],
        };
    } catch (err: any) {
        console.error('Error fetching teams:', err);
        return {
            success: false,
            message: err.message,
            data: [],
        };
    }
};

export const getTeamById = async (id: string) => {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("teams")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return {
                success: false,
                message: error.message,
                data: null,
            };
        }

        return {
            success: true,
            data: data as ITeams,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

// Helper function to upload photo to Supabase Storage
const uploadPhoto = async (file: File, supabase: any) => {
    try {
        console.log("🚀 Starting photo upload:", file.name, file.type, file.size);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `team-photos/${fileName}`;

        console.log("🚀 File path:", filePath);

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        console.log("🚀 Buffer size:", buffer.length);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('teams') // Make sure this bucket exists in your Supabase Storage
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('🚀 Upload error:', error);
            throw error;
        }

        console.log("🚀 Upload success:", data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('teams')
            .getPublicUrl(filePath);

        console.log("🚀 Public URL:", publicUrl);

        return publicUrl;
    } catch (err: any) {
        console.error('🚀 Error uploading photo:', err);
        throw err;
    }
};

// Helper function to delete photo from Supabase Storage
const deletePhoto = async (photoUrl: string, supabase: any) => {
    try {
        // Extract file path from URL
        const urlParts = photoUrl.split('/teams/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('teams')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting photo:', error);
        }
    } catch (err) {
        console.error('Error in deletePhoto:', err);
    }
};

export const addTeam = async (formData: FormData) => {
    try {
        console.log("🚀 addTeam called");
        
        const user = await getAuthenticatedUser();
        console.log("🚀 User:", user?.id);
        
        const adminCheck = await isAdmin(user.id);
        console.log("🚀 Admin check:", adminCheck);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can add team members.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Extract form data
        const name = formData.get('name') as string;
        const position = formData.get('position') as string;
        const projects = formData.get('projects') as string;
        const description = formData.get('description') as string;
        const skillsJson = formData.get('skills') as string;
        const photoFile = formData.get('photo') as File | null;

        console.log("🚀 Form data:", { name, position, projects, description, skills: skillsJson, photoFile: photoFile?.name });

        if (!name || !position) {
            return {
                success: false,
                message: "Name and position are required",
                data: null
            };
        }

        // Parse skills from JSON string
        let skills: string[] = [];
        if (skillsJson) {
            try {
                skills = JSON.parse(skillsJson);
            } catch (e) {
                console.error("Error parsing skills:", e);
            }
        }

        let photoUrl = null;

        // Upload photo if provided
        if (photoFile && photoFile.size > 0) {
            console.log("🚀 Uploading photo...");
            photoUrl = await uploadPhoto(photoFile, supabase);
            console.log("🚀 Photo uploaded:", photoUrl);
        }

        // Insert team member
        const insertData = {
            name,
            position,
            skills,
            projects,
            descriptions: description,
            photo_url: photoUrl,
        };

        console.log("🚀 Inserting data:", insertData);

        const { data, error } = await supabase
            .from("teams")
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error("🚀 Insert error:", error);
            throw error;
        }

        console.log("🚀 Insert success:", data);

        return {
            success: true,
            message: "Team member added successfully",
            data: data as ITeams,
        };
    } catch (err: any) {
        console.error("🚀 addTeam error:", err);
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const updateTeam = async (id: string, formData: FormData) => {
    try {
        console.log("🚀 updateTeam called for ID:", id);
        console.log("🚀 ID type:", typeof id);
        
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can update team members.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Get existing team member
        const { data: existingMember, error: fetchError } = await supabase
            .from("teams")
            .select("photo_url")
            .eq("id", id)
            .single();

        if (fetchError) {
            console.error("🚀 Fetch error:", fetchError);
            throw fetchError;
        }

        // Extract form data
        const name = formData.get('name') as string;
        const position = formData.get('position') as string;
        const projects = formData.get('projects') as string;
        const description = formData.get('description') as string;
        const skillsJson = formData.get('skills') as string;
        const photoFile = formData.get('photo') as File | null;

        console.log("🚀 Raw form data:");
        console.log("  - name:", name);
        console.log("  - position:", position);
        console.log("  - projects:", projects);
        console.log("  - description:", description);
        console.log("  - skills JSON:", skillsJson);
        console.log("  - photo:", photoFile?.name, photoFile?.size);

        if (!name || !position) {
            return {
                success: false,
                message: "Name and position are required",
                data: null
            };
        }

        // Parse skills from JSON string
        let skills: string[] = [];
        if (skillsJson) {
            try {
                skills = JSON.parse(skillsJson);
            } catch (e) {
                console.error("Error parsing skills:", e);
            }
        }

        let photoUrl = existingMember.photo_url;

        // Upload new photo if provided
        if (photoFile && photoFile.size > 0) {
            console.log("🚀 Uploading new photo...");
            
            // Delete old photo if exists
            if (existingMember.photo_url) {
                console.log("🚀 Deleting old photo...");
                await deletePhoto(existingMember.photo_url, supabase);
            }
            
            photoUrl = await uploadPhoto(photoFile, supabase);
            console.log("🚀 New photo uploaded:", photoUrl);
        }

        // Update team member
        const updateData: any = {
            name,
            position,
            skills,
            projects,
            descriptions: description,
            photo_url: photoUrl,
        };

        console.log("🚀 Updating with data:", updateData);

        const { data, error } = await supabase
            .from("teams")
            .update(updateData)
            .eq("id", id)
            .select();

        if (error) {
            console.error("🚀 Update error:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error("Team member not found or update failed");
        }

        console.log("🚀 Update success:", data[0]);

        return {
            success: true,
            message: "Team member updated successfully",
            data: data[0] as ITeams,
        };
    } catch (err: any) {
        console.error("🚀 updateTeam error:", err);
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};

export const deleteTeam = async (id: string) => {
    try {
        const user = await getAuthenticatedUser();
        const adminCheck = await isAdmin(user.id);
        
        if (!adminCheck) {
            return { 
                success: false, 
                message: "Access denied. Only admins can delete team members.", 
                data: null 
            };
        }

        const supabase = await createClient();

        // Get team member to delete their photo
        const { data: member, error: fetchError } = await supabase
            .from("teams")
            .select("photo_url")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        // Delete photo from storage if exists
        if (member.photo_url) {
            await deletePhoto(member.photo_url, supabase);
        }

        // Delete team member from database
        const { error } = await supabase
            .from("teams")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return {
            success: true,
            message: "Team member deleted successfully",
            data: null,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message,
            data: null,
        };
    }
};