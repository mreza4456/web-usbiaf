import { IUser } from "@/interface";

export const getDisplayName = (user: Pick<IUser, 'full_name' | 'email'>): string => {
  // Prioritas: full_name → email tanpa @domain → 'Unknown User'
  if (user.full_name && user.full_name.trim() !== '') {
    return user.full_name;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
};

export const getInitials = (name: string): string => {
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};