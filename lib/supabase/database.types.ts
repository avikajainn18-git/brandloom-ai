export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["campaign_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_references: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          reference_type: Database["public"]["Enums"]["brand_reference_type"];
          content: string;
          approval_status: Database["public"]["Enums"]["brand_reference_approval_status"];
          authority: string | null;
          precedence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          reference_type?: Database["public"]["Enums"]["brand_reference_type"];
          content: string;
          approval_status?: Database["public"]["Enums"]["brand_reference_approval_status"];
          authority?: string | null;
          precedence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          reference_type?: Database["public"]["Enums"]["brand_reference_type"];
          content?: string;
          approval_status?: Database["public"]["Enums"]["brand_reference_approval_status"];
          authority?: string | null;
          precedence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_references_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      assets: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          asset_type: Database["public"]["Enums"]["asset_type"];
          text_content: string;
          current_revision: number;
          current_revision_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          asset_type?: Database["public"]["Enums"]["asset_type"];
          text_content: string;
          current_revision?: number;
          current_revision_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          asset_type?: Database["public"]["Enums"]["asset_type"];
          text_content?: string;
          current_revision?: number;
          current_revision_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      review_runs: {
        Row: {
          id: string;
          campaign_id: string;
          status: Database["public"]["Enums"]["review_run_status"];
          finding_count: number;
          conflict_count: number;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          status?: Database["public"]["Enums"]["review_run_status"];
          finding_count?: number;
          conflict_count?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          status?: Database["public"]["Enums"]["review_run_status"];
          finding_count?: number;
          conflict_count?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_runs_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      findings: {
        Row: {
          id: string;
          review_run_id: string;
          affected_asset_id: string;
          category: string;
          explanation: string;
          status: Database["public"]["Enums"]["finding_status"];
          severity: Database["public"]["Enums"]["finding_severity"] | null;
          suggested_correction: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_run_id: string;
          affected_asset_id: string;
          category: string;
          explanation: string;
          status?: Database["public"]["Enums"]["finding_status"];
          severity?: Database["public"]["Enums"]["finding_severity"] | null;
          suggested_correction?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          review_run_id?: string;
          affected_asset_id?: string;
          category?: string;
          explanation?: string;
          status?: Database["public"]["Enums"]["finding_status"];
          severity?: Database["public"]["Enums"]["finding_severity"] | null;
          suggested_correction?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "findings_review_run_id_fkey";
            columns: ["review_run_id"];
            isOneToOne: false;
            referencedRelation: "review_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "findings_affected_asset_id_fkey";
            columns: ["affected_asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      review_tickets: {
        Row: {
          id: string;
          campaign_id: string;
          description: string;
          decision_required: string;
          status: Database["public"]["Enums"]["review_ticket_status"];
          reviewer_decision: string | null;
          resolution_details: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          description: string;
          decision_required: string;
          status?: Database["public"]["Enums"]["review_ticket_status"];
          reviewer_decision?: string | null;
          resolution_details?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          description?: string;
          decision_required?: string;
          status?: Database["public"]["Enums"]["review_ticket_status"];
          reviewer_decision?: string | null;
          resolution_details?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_tickets_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      finding_references: {
        Row: {
          finding_id: string;
          reference_id: string;
          evidence_note: string | null;
        };
        Insert: {
          finding_id: string;
          reference_id: string;
          evidence_note?: string | null;
        };
        Update: {
          finding_id?: string;
          reference_id?: string;
          evidence_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finding_references_finding_id_fkey";
            columns: ["finding_id"];
            isOneToOne: false;
            referencedRelation: "findings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finding_references_reference_id_fkey";
            columns: ["reference_id"];
            isOneToOne: false;
            referencedRelation: "brand_references";
            referencedColumns: ["id"];
          },
        ];
      };
      review_ticket_assets: {
        Row: {
          review_ticket_id: string;
          asset_id: string;
        };
        Insert: {
          review_ticket_id: string;
          asset_id: string;
        };
        Update: {
          review_ticket_id?: string;
          asset_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_ticket_assets_review_ticket_id_fkey";
            columns: ["review_ticket_id"];
            isOneToOne: false;
            referencedRelation: "review_tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_ticket_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      review_ticket_references: {
        Row: {
          review_ticket_id: string;
          reference_id: string;
        };
        Insert: {
          review_ticket_id: string;
          reference_id: string;
        };
        Update: {
          review_ticket_id?: string;
          reference_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_ticket_references_review_ticket_id_fkey";
            columns: ["review_ticket_id"];
            isOneToOne: false;
            referencedRelation: "review_tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_ticket_references_reference_id_fkey";
            columns: ["reference_id"];
            isOneToOne: false;
            referencedRelation: "brand_references";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      asset_type: "email" | "advertisement" | "social_post" | "landing_page" | "other";
      brand_reference_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "superseded";
      brand_reference_type:
        | "campaign_brief"
        | "brand_guidelines"
        | "terminology"
        | "claim"
        | "fact"
        | "offer"
        | "other";
      campaign_status:
        | "draft"
        | "in_review"
        | "ready_for_approval"
        | "approved"
        | "archived";
      finding_severity: "low" | "medium" | "high" | "critical";
      finding_status:
        | "verified_mismatch"
        | "uncertain"
        | "conflict_requires_review"
        | "resolved"
        | "dismissed";
      review_run_status: "queued" | "running" | "completed" | "failed" | "cancelled";
      review_ticket_status: "open" | "in_review" | "resolved" | "dismissed";
    };
    CompositeTypes: Record<string, never>;
  };
};
