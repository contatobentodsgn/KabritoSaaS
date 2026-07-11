// GERADO por `npm run db:gen-types` (supabase gen types typescript --linked).
// NÃO editar à mão, EXCETO `mfa_recovery_codes`: a migration 0017 ainda não
// rodou no banco remoto (REF-5, jul/2026) — a tabela existe no código/migrations
// mas não no schema ao vivo, então o gerador não a inclui. Assim que
// `npm run db:migrate` rodar contra produção, regere este arquivo (o bloco
// manual vira redundante, mas não quebra nada se ficar — mesma estrutura).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      _migrations: {
        Row: {
          applied_at: string;
          name: string;
        };
        Insert: {
          applied_at?: string;
          name: string;
        };
        Update: {
          applied_at?: string;
          name?: string;
        };
        Relationships: [];
      };
      access_logs: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          organization_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          organization_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      content_editions: {
        Row: {
          briefing: Json | null;
          content_expires_at: string | null;
          created_at: string;
          edition_date: string;
          generated_by_run_id: string | null;
          generation_prompt_version: string | null;
          id: string;
          is_archived: boolean;
          platform_id: string;
          published_at: string | null;
          review_status: Database["public"]["Enums"]["review_status"];
          reviewed_at: string | null;
          reviewed_by: string | null;
          slug: string;
          status: Database["public"]["Enums"]["edition_status"];
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          briefing?: Json | null;
          content_expires_at?: string | null;
          created_at?: string;
          edition_date: string;
          generated_by_run_id?: string | null;
          generation_prompt_version?: string | null;
          id?: string;
          is_archived?: boolean;
          platform_id: string;
          published_at?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["edition_status"];
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          briefing?: Json | null;
          content_expires_at?: string | null;
          created_at?: string;
          edition_date?: string;
          generated_by_run_id?: string | null;
          generation_prompt_version?: string | null;
          id?: string;
          is_archived?: boolean;
          platform_id?: string;
          published_at?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["edition_status"];
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_editions_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      content_suggestions: {
        Row: {
          caption_base: string;
          central_idea: string;
          created_at: string;
          cta: string;
          difficulty_level: string;
          edition_id: string;
          id: string;
          opportunity_score: number;
          personalization_prompt: string;
          post_structure: string;
          recommended_format: string;
          recommended_niches: Json;
          suggested_headline: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          caption_base: string;
          central_idea: string;
          created_at?: string;
          cta: string;
          difficulty_level: string;
          edition_id: string;
          id?: string;
          opportunity_score: number;
          personalization_prompt: string;
          post_structure: string;
          recommended_format: string;
          recommended_niches: Json;
          suggested_headline: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          caption_base?: string;
          central_idea?: string;
          created_at?: string;
          cta?: string;
          difficulty_level?: string;
          edition_id?: string;
          id?: string;
          opportunity_score?: number;
          personalization_prompt?: string;
          post_structure?: string;
          recommended_format?: string;
          recommended_niches?: Json;
          suggested_headline?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_suggestions_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      content_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      copy_patterns: {
        Row: {
          adaptation_examples: Json;
          category: string;
          created_at: string;
          edition_id: string;
          explanation: string;
          hook_type: string;
          id: string;
          observed_headline: string;
          structure: string;
          tags: Json;
          title: string;
          trigger_type: string;
          updated_at: string;
        };
        Insert: {
          adaptation_examples: Json;
          category: string;
          created_at?: string;
          edition_id: string;
          explanation: string;
          hook_type: string;
          id?: string;
          observed_headline: string;
          structure: string;
          tags: Json;
          title: string;
          trigger_type: string;
          updated_at?: string;
        };
        Update: {
          adaptation_examples?: Json;
          category?: string;
          created_at?: string;
          edition_id?: string;
          explanation?: string;
          hook_type?: string;
          id?: string;
          observed_headline?: string;
          structure?: string;
          tags?: Json;
          title?: string;
          trigger_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "copy_patterns_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_cards: {
        Row: {
          enabled: boolean;
          key: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          enabled?: boolean;
          key: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
          key?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      edition_comments: {
        Row: {
          author_name: string | null;
          body: string;
          created_at: string;
          edition_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          author_name?: string | null;
          body: string;
          created_at?: string;
          edition_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          author_name?: string | null;
          body?: string;
          created_at?: string;
          edition_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "edition_comments_edition_id_fkey";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      explore_reports: {
        Row: {
          created_at: string;
          edition_id: string;
          id: string;
          observed_patterns: Json;
          platform_id: string;
          recommendation: string;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          edition_id: string;
          id?: string;
          observed_patterns: Json;
          platform_id: string;
          recommendation: string;
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          edition_id?: string;
          id?: string;
          observed_patterns?: Json;
          platform_id?: string;
          recommendation?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "explore_reports_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "explore_reports_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_runs: {
        Row: {
          cost_estimate: number | null;
          created_at: string;
          edition_date: string;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          input_tokens: number | null;
          model_used: string | null;
          output_tokens: number | null;
          platform_id: string;
          prompt_version: string | null;
          started_at: string;
          status: Database["public"]["Enums"]["run_status"];
        };
        Insert: {
          cost_estimate?: number | null;
          created_at?: string;
          edition_date: string;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_used?: string | null;
          output_tokens?: number | null;
          platform_id: string;
          prompt_version?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["run_status"];
        };
        Update: {
          cost_estimate?: number | null;
          created_at?: string;
          edition_date?: string;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_used?: string | null;
          output_tokens?: number | null;
          platform_id?: string;
          prompt_version?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["run_status"];
        };
        Relationships: [
          {
            foreignKeyName: "generation_runs_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      headlines: {
        Row: {
          adaptations: Json;
          category: string;
          created_at: string;
          edition_id: string;
          headline: string;
          id: string;
          recommended_niches: Json;
          saturation_level: Database["public"]["Enums"]["saturation_level"];
          trigger_type: string;
          updated_at: string;
          why_it_works: string;
        };
        Insert: {
          adaptations: Json;
          category: string;
          created_at?: string;
          edition_id: string;
          headline: string;
          id?: string;
          recommended_niches: Json;
          saturation_level: Database["public"]["Enums"]["saturation_level"];
          trigger_type: string;
          updated_at?: string;
          why_it_works: string;
        };
        Update: {
          adaptations?: Json;
          category?: string;
          created_at?: string;
          edition_id?: string;
          headline?: string;
          id?: string;
          recommended_niches?: Json;
          saturation_level?: Database["public"]["Enums"]["saturation_level"];
          trigger_type?: string;
          updated_at?: string;
          why_it_works?: string;
        };
        Relationships: [
          {
            foreignKeyName: "headlines_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_sources: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          is_active: boolean;
          last_run_at: string | null;
          name: string;
          type: Database["public"]["Enums"]["source_type"];
          updated_at: string;
        };
        Insert: {
          config: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_run_at?: string | null;
          name: string;
          type: Database["public"]["Enums"]["source_type"];
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_run_at?: string | null;
          name?: string;
          type?: Database["public"]["Enums"]["source_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      mfa_recovery_codes: {
        Row: {
          code_hash: string;
          created_at: string;
          id: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code_hash: string;
          created_at?: string;
          id?: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code_hash?: string;
          created_at?: string;
          id?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      niches: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["member_role"];
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
          organization_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
          organization_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["member_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_organizations_id_fk";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"];
          created_at: string;
          features: Json | null;
          id: string;
          is_active: boolean;
          name: string;
          price_annual: number | null;
          price_monthly: number | null;
          retention_days: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"];
          created_at?: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price_annual?: number | null;
          price_monthly?: number | null;
          retention_days?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"];
          created_at?: string;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_annual?: number | null;
          price_monthly?: number | null;
          retention_days?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platforms: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          id: string;
          name: string | null;
          staff_role: Database["public"]["Enums"]["staff_role"] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          id?: string;
          name?: string | null;
          staff_role?: Database["public"]["Enums"]["staff_role"] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          staff_role?: Database["public"]["Enums"]["staff_role"] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      prompt_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_templates: {
        Row: {
          category_id: string;
          created_at: string;
          example_output: string;
          id: string;
          objective: string;
          platform_id: string | null;
          prompt_body: string;
          required_input: Json;
          tags: Json;
          title: string;
          updated_at: string;
          when_to_use: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          example_output: string;
          id?: string;
          objective: string;
          platform_id?: string | null;
          prompt_body: string;
          required_input: Json;
          tags: Json;
          title: string;
          updated_at?: string;
          when_to_use: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          example_output?: string;
          id?: string;
          objective?: string;
          platform_id?: string | null;
          prompt_body?: string;
          required_input?: Json;
          tags?: Json;
          title?: string;
          updated_at?: string;
          when_to_use?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_templates_category_id_prompt_categories_id_fk";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "prompt_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_templates_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      raw_signals: {
        Row: {
          collected_at: string;
          created_at: string;
          generation_run_id: string | null;
          id: string;
          platform_id: string | null;
          processed: boolean;
          raw_payload: Json;
          source_id: string;
        };
        Insert: {
          collected_at?: string;
          created_at?: string;
          generation_run_id?: string | null;
          id?: string;
          platform_id?: string | null;
          processed?: boolean;
          raw_payload: Json;
          source_id: string;
        };
        Update: {
          collected_at?: string;
          created_at?: string;
          generation_run_id?: string | null;
          id?: string;
          platform_id?: string | null;
          processed?: boolean;
          raw_payload?: Json;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "raw_signals_generation_run_id_generation_runs_id_fk";
            columns: ["generation_run_id"];
            isOneToOne: false;
            referencedRelation: "generation_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_signals_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_signals_source_id_ingestion_sources_id_fk";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ingestion_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_events: {
        Row: {
          created_at: string;
          event_id: string;
          type: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          type?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          customer_id: string | null;
          id: string;
          organization_id: string;
          plan_id: string;
          subscription_status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          customer_id?: string | null;
          id?: string;
          organization_id: string;
          plan_id: string;
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          customer_id?: string | null;
          id?: string;
          organization_id?: string;
          plan_id?: string;
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_organizations_id_fk";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_plans_id_fk";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      trend_items: {
        Row: {
          adaptation_examples: Json;
          adaptation_tips: string;
          content_format: Json;
          context: string;
          created_at: string;
          edition_id: string;
          id: string;
          opportunity_score: number;
          platform_id: string;
          recommended_niches: Json;
          risk_level: Database["public"]["Enums"]["risk_level"];
          saturation_level: Database["public"]["Enums"]["saturation_level"];
          title: string;
          updated_at: string;
          why_it_matters: string;
        };
        Insert: {
          adaptation_examples: Json;
          adaptation_tips: string;
          content_format: Json;
          context: string;
          created_at?: string;
          edition_id: string;
          id?: string;
          opportunity_score: number;
          platform_id: string;
          recommended_niches: Json;
          risk_level: Database["public"]["Enums"]["risk_level"];
          saturation_level: Database["public"]["Enums"]["saturation_level"];
          title: string;
          updated_at?: string;
          why_it_matters: string;
        };
        Update: {
          adaptation_examples?: Json;
          adaptation_tips?: string;
          content_format?: Json;
          context?: string;
          created_at?: string;
          edition_id?: string;
          id?: string;
          opportunity_score?: number;
          platform_id?: string;
          recommended_niches?: Json;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          saturation_level?: Database["public"]["Enums"]["saturation_level"];
          title?: string;
          updated_at?: string;
          why_it_matters?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trend_items_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trend_items_platform_id_platforms_id_fk";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
        ];
      };
      user_favorites: {
        Row: {
          collection_name: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          organization_id: string | null;
          user_id: string;
        };
        Insert: {
          collection_name?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          organization_id?: string | null;
          user_id: string;
        };
        Update: {
          collection_name?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          organization_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_favorites_organization_id_organizations_id_fk";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sessions: {
        Row: {
          created_at: string;
          device_id: string;
          id: string;
          ip_address: string | null;
          is_active: boolean;
          last_seen_at: string;
          revoked_at: string | null;
          session_token_hash: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          id?: string;
          ip_address?: string | null;
          is_active?: boolean;
          last_seen_at?: string;
          revoked_at?: string | null;
          session_token_hash: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          id?: string;
          ip_address?: string | null;
          is_active?: boolean;
          last_seen_at?: string;
          revoked_at?: string | null;
          session_token_hash?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      visual_patterns: {
        Row: {
          colors: Json;
          composition_notes: string;
          created_at: string;
          edition_id: string;
          how_to_adapt: string;
          id: string;
          tags: Json;
          title: string;
          typography_notes: string;
          updated_at: string;
          visual_style: string;
          why_it_works: string;
        };
        Insert: {
          colors: Json;
          composition_notes: string;
          created_at?: string;
          edition_id: string;
          how_to_adapt: string;
          id?: string;
          tags: Json;
          title: string;
          typography_notes: string;
          updated_at?: string;
          visual_style: string;
          why_it_works: string;
        };
        Update: {
          colors?: Json;
          composition_notes?: string;
          created_at?: string;
          edition_id?: string;
          how_to_adapt?: string;
          id?: string;
          tags?: Json;
          title?: string;
          typography_notes?: string;
          updated_at?: string;
          visual_style?: string;
          why_it_works?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visual_patterns_edition_id_content_editions_id_fk";
            columns: ["edition_id"];
            isOneToOne: false;
            referencedRelation: "content_editions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null;
          name: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          name?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          name?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      approve_edition: {
        Args: { p_edition_id: string; p_expires: string; p_reviewer: string };
        Returns: number;
      };
      has_active_subscription: { Args: { uid: string }; Returns: boolean };
      is_edition_published: { Args: { eid: string }; Returns: boolean };
      is_org_member: { Args: { org: string; uid: string }; Returns: boolean };
      is_staff: { Args: { uid: string }; Returns: boolean };
      org_role: { Args: { org: string; uid: string }; Returns: string };
    };
    Enums: {
      billing_cycle: "monthly" | "annual";
      edition_status: "draft" | "scheduled" | "published" | "archived";
      member_role: "owner" | "admin" | "member";
      review_status: "pending" | "in_review" | "approved" | "rejected";
      risk_level: "baixo" | "medio" | "alto";
      run_status:
        "started" | "ingesting" | "generating" | "completed" | "failed";
      saturation_level: "emergente" | "baixo" | "medio" | "alto" | "saturado";
      source_type: "api" | "rss" | "trends" | "manual_seed";
      staff_role: "editor" | "superadmin";
      subscription_status: "trialing" | "active" | "past_due" | "canceled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["monthly", "annual"],
      edition_status: ["draft", "scheduled", "published", "archived"],
      member_role: ["owner", "admin", "member"],
      review_status: ["pending", "in_review", "approved", "rejected"],
      risk_level: ["baixo", "medio", "alto"],
      run_status: ["started", "ingesting", "generating", "completed", "failed"],
      saturation_level: ["emergente", "baixo", "medio", "alto", "saturado"],
      source_type: ["api", "rss", "trends", "manual_seed"],
      staff_role: ["editor", "superadmin"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
    },
  },
} as const;
