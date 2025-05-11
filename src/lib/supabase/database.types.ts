export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          label: string | null
          notes: string | null
          platform: string | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          label?: string | null
          notes?: string | null
          platform?: string | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          label?: string | null
          notes?: string | null
          platform?: string | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string
          category: string | null
          tags: string[] | null
          is_favorite: boolean
          usage: number
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: string
          category?: string | null
          tags?: string[] | null
          is_favorite?: boolean
          usage?: number
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string
          category?: string | null
          tags?: string[] | null
          is_favorite?: boolean
          usage?: number
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_links: {
        Row: {
          id: string
          prompt_id: string
          bookmark_id: string | null
          folder_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          prompt_id: string
          bookmark_id?: string | null
          folder_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          prompt_id?: string
          bookmark_id?: string | null
          folder_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_links_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_links_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_provider: string | null
          provider_subscription_id: string | null
          status: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          provider_subscription_id?: string | null
          status: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_stats: {
        Row: {
          bookmark_count: number | null
          folder_count: number | null
          prompt_count: number | null
          last_calculated_at: string | null
          user_id: string
        }
        Insert: {
          bookmark_count?: number | null
          folder_count?: number | null
          prompt_count: number | null
          last_calculated_at?: string | null
          user_id: string
        }
        Update: {
          bookmark_count?: number | null
          folder_count?: number | null
          prompt_count: number | null
          last_calculated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_detect_platform: boolean | null
          default_labels: Json | null
          platforms: Json | null
          theme: string | null
          user_id: string
        }
        Insert: {
          auto_detect_platform?: boolean | null
          default_labels?: Json | null
          platforms?: Json | null
          theme?: string | null
          user_id: string
        }
        Update: {
          auto_detect_platform?: boolean | null
          default_labels?: Json | null
          platforms?: Json | null
          theme?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never


export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Folder = Database['public']['Tables']['folders']['Row'];
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type UsageStats = Database['public']['Tables']['usage_stats']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type PromptLink = Database['public']['Tables']['prompt_links']['Row'];

// Prompt-related types
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export interface PromptWithLinks extends Prompt {
  linked_bookmarks?: string[];
  linked_folders?: string[];
}

export type CreatePromptInput = Omit<PromptInsert, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage' | 'is_favorite'> & {
  is_favorite?: boolean;
};

export type UpdatePromptInput = Partial<Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
// Add additional types for UI needs
export function safeParsePlatforms(platforms: Json | null): PlatformWithColor[] {
  if (!platforms) return [];
  
  if (!Array.isArray(platforms)) return [];
  
  return platforms.map(item => {
    if (typeof item === 'string') {
      // Legacy format - string only
      return { 
        name: item, 
        color: "#808080" 
      } as PlatformWithColor;
    } else if (item && typeof item === 'object') {
      // Object with name and color
      const name = 'name' in item ? String(item.name) : 'Unknown';
      const color = 'color' in item ? String(item.color) : '#808080';
      return { name, color } as PlatformWithColor;
    } else {
      // Invalid format
      return { 
        name: 'Unknown', 
        color: "#808080" 
      } as PlatformWithColor;
    }
  });
}

export interface PlatformWithColor {
  name: string;
  color: string;
  [key: string]: Json | undefined;
}

export type PlatformJson = Json[] | { name: string; color: string }[];

export interface FolderWithCount extends Folder {
  bookmarkCount?: number;
  children?: FolderWithCount[];
}

export interface BookmarkWithFolder extends Bookmark {
  folder_name?: string;
}