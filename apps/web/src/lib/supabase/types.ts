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
          local_date: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["solves"]["Row"], "id" | "solved_at">;
        Update: Partial<Database["public"]["Tables"]["solves"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_practice_puzzle: {
        Args: { p_difficulty: string; p_seq?: number | null };
        Returns: { id: string; difficulty: "easy" | "medium" | "hard"; grid_spec: Json }[];
      };
      record_solve: {
        Args: {
          p_puzzle_id: string;
          p_grid: Json;
          p_duration_ms: number;
          p_used_hint: boolean;
          p_local_date: string;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
