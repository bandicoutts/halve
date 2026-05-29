export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      puzzles: {
        Row: {
          id: string;
          date: string | null;
          difficulty: "easy" | "medium" | "hard";
          grid_spec: Json;
          seed: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["puzzles"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["puzzles"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      solves: {
        Row: {
          id: string;
          user_id: string;
          puzzle_id: string;
          solved_at: string;
          duration_ms: number;
          used_hint: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["solves"]["Row"], "id" | "solved_at">;
        Update: Partial<Database["public"]["Tables"]["solves"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
