// src/lib/api/profiles.ts
import { supabase } from '../supabase/client';
import type { Profile } from '../supabase/database.types';
import robotBlue from '@/assets/avatars/robot-blue.png';
import robotPurple from '@/assets/avatars/robot-purple.png';
import astronaut from '@/assets/avatars/astronaut.png';
import alien from '@/assets/avatars/alien.png';
import wizard from '@/assets/avatars/wizard.png';
import catCoder from '@/assets/avatars/cat-coder.png';
import circuitFace from '@/assets/avatars/circuit.png';
import pixelBot from '@/assets/avatars/pixel-bot.png';
/**
 * Get a user's profile by their ID
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null;
    }
    throw error;
  }
  
  return data;
};

/**
 * Create a new profile for a user
 */
export const createProfile = async (profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Update a user's profile
 */
export const updateProfile = async (
  userId: string, 
  updates: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  }
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username: string, currentUserId?: string): Promise<boolean> => {
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username);
    
  if (currentUserId) {
    // Exclude the current user from the check when updating their own username
    query = query.neq('id', currentUserId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // If any results are returned, the username is taken
  return data.length === 0;
};

/**
 * Get avatars that a user can choose from
 * This is a stub function as avatars are typically stored in public assets
 */
export const getAvatarOptions = (): Array<{ id: string; url: string; alt: string; description: string }> => {
  return [
    { 
      id: "robot-blue", 
      url: robotBlue, 
      alt: "Blue Robot",
      description: "The Productivity Pro: Uses LLMs to automate tasks and boost efficiency."
    },
    { 
      id: "robot-purple", 
      url: robotPurple, 
      alt: "Purple Robot",
      description: "The Creative Explorer: Pushes AI to generate new ideas and artistic content."
    },
    { 
      id: "astronaut", 
      url: astronaut, 
      alt: "Astronaut",
      description: "The Knowledge Voyager: Travels through vast information spaces seeking discoveries."
    },
    { 
      id: "alien", 
      url: alien, 
      alt: "Friendly Alien",
      description: "The Curious Questioner: Always asking 'what if' and exploring new possibilities."
    },
    { 
      id: "wizard", 
      url: wizard, 
      alt: "AI Wizard",
      description: "The Prompt Engineer: Masters the art of crafting the perfect instructions."
    },
    { 
      id: "cat-coder", 
      url: catCoder, 
      alt: "Coding Cat",
      description: "The Code Craftsperson: Uses AI as a pair programmer to build amazing things."
    },
    { 
      id: "circuit-face", 
      url: circuitFace, 
      alt: "Circuit Face",
      description: "The Technical Tinkerer: Digs into the details and optimizes everything."
    },
    { 
      id: "pixel-bot", 
      url: pixelBot, 
      alt: "Pixel Bot",
      description: "The Retro Researcher: Combines old-school thinking with cutting-edge AI."
    }
  ];
};