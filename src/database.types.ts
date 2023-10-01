export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Observations_Base: {
        Row: {
          "#": number | null
          chainid: number
          createdat: string | null
          id: number
          pool: string
          price: number | null
          timestamp: number | null
        }
        Insert: {
          "#"?: number | null
          chainid: number
          createdat?: string | null
          id?: number
          pool: string
          price?: number | null
          timestamp?: number | null
        }
        Update: {
          "#"?: number | null
          chainid?: number
          createdat?: string | null
          id?: number
          pool?: string
          price?: number | null
          timestamp?: number | null
        }
        Relationships: []
      }
      Observations_Base_V1: {
        Row: {
          chainid: number
          createdat: string | null
          id: number
          pool: string
          price: number | null
          timestamp: number | null
        }
        Insert: {
          chainid: number
          createdat?: string | null
          id?: number
          pool: string
          price?: number | null
          timestamp?: number | null
        }
        Update: {
          chainid?: number
          createdat?: string | null
          id?: number
          pool?: string
          price?: number | null
          timestamp?: number | null
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
