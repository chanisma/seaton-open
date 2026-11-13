export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null;
          created_at: string;
          description: string;
          difficulty: string | null;
          icon: string | null;
          id: string;
          subcategory: string | null;
          target_count: number;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description: string;
          difficulty?: string | null;
          icon?: string | null;
          id?: string;
          subcategory?: string | null;
          target_count: number;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string;
          difficulty?: string | null;
          icon?: string | null;
          id?: string;
          subcategory?: string | null;
          target_count?: number;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      active_sessions: {
        Row: {
          created_at: string;
          last_seen: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_seen?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          last_seen?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      admission_adiga_results: {
        Row: {
          competition_2026: number | null;
          crawled_at: string;
          domain: string | null;
          field: string | null;
          fill_rate_2026: number | null;
          grade_quality: string | null;
          grade50: number | null;
          grade70: number | null;
          history: Json;
          id: string;
          major: string | null;
          program: string | null;
          real_competition_2026: number | null;
          recruit_2026: number | null;
          region: string;
          search_text: string | null;
          source_url: string;
          track: string | null;
          track_type: string | null;
          university: string;
          university_canon: string | null;
          waitlist_2026: number | null;
        };
        Insert: {
          competition_2026?: number | null;
          crawled_at?: string;
          domain?: string | null;
          field?: string | null;
          fill_rate_2026?: number | null;
          grade_quality?: string | null;
          grade50?: number | null;
          grade70?: number | null;
          history?: Json;
          id: string;
          major?: string | null;
          program?: string | null;
          real_competition_2026?: number | null;
          recruit_2026?: number | null;
          region: string;
          search_text?: string | null;
          source_url?: string;
          track?: string | null;
          track_type?: string | null;
          university: string;
          university_canon?: string | null;
          waitlist_2026?: number | null;
        };
        Update: {
          competition_2026?: number | null;
          crawled_at?: string;
          domain?: string | null;
          field?: string | null;
          fill_rate_2026?: number | null;
          grade_quality?: string | null;
          grade50?: number | null;
          grade70?: number | null;
          history?: Json;
          id?: string;
          major?: string | null;
          program?: string | null;
          real_competition_2026?: number | null;
          recruit_2026?: number | null;
          region?: string;
          search_text?: string | null;
          source_url?: string;
          track?: string | null;
          track_type?: string | null;
          university?: string;
          university_canon?: string | null;
          waitlist_2026?: number | null;
        };
        Relationships: [];
      };
      admission_gyogwa_criteria: {
        Row: {
          admission: string | null;
          broad_uni_key: string | null;
          careers: Json;
          crawled_at: string;
          csat: string | null;
          csat_status: string | null;
          has_csat: boolean;
          id: string;
          method: string | null;
          method_tags: string[];
          quota: number | null;
          quota_text: string | null;
          region: string;
          search_blob: string | null;
          source_url: string;
          subjects_all: Json;
          subjects_exact: Json;
          uni_key: string | null;
          unit: string | null;
          unit_tags: string[];
          university: string;
        };
        Insert: {
          admission?: string | null;
          broad_uni_key?: string | null;
          careers?: Json;
          crawled_at?: string;
          csat?: string | null;
          csat_status?: string | null;
          has_csat?: boolean;
          id: string;
          method?: string | null;
          method_tags?: string[];
          quota?: number | null;
          quota_text?: string | null;
          region: string;
          search_blob?: string | null;
          source_url?: string;
          subjects_all?: Json;
          subjects_exact?: Json;
          uni_key?: string | null;
          unit?: string | null;
          unit_tags?: string[];
          university: string;
        };
        Update: {
          admission?: string | null;
          broad_uni_key?: string | null;
          careers?: Json;
          crawled_at?: string;
          csat?: string | null;
          csat_status?: string | null;
          has_csat?: boolean;
          id?: string;
          method?: string | null;
          method_tags?: string[];
          quota?: number | null;
          quota_text?: string | null;
          region?: string;
          search_blob?: string | null;
          source_url?: string;
          subjects_all?: Json;
          subjects_exact?: Json;
          uni_key?: string | null;
          unit?: string | null;
          unit_tags?: string[];
          university?: string;
        };
        Relationships: [];
      };
      admission_jonghap_criteria: {
        Row: {
          code: string;
          crawled_at: string;
          doc_content_tables: Json;
          doc_parsed_ratios: Json;
          doc_ratio_tables: Json;
          doc_search_text: string | null;
          doc_section_text: string | null;
          doc_top_factors: Json;
          has_doc_eval: boolean;
          has_interview: boolean;
          interview_blocks: Json;
          interview_methods: string[];
          interview_primary_process: string | null;
          interview_primary_source: string | null;
          interview_primary_time: string | null;
          interview_search_text: string | null;
          interview_status: string | null;
          interview_top_factors: Json;
          name: string;
          recruitment: number | null;
          region: string;
          source_url_doc: string;
          source_url_interview: string;
        };
        Insert: {
          code: string;
          crawled_at?: string;
          doc_content_tables?: Json;
          doc_parsed_ratios?: Json;
          doc_ratio_tables?: Json;
          doc_search_text?: string | null;
          doc_section_text?: string | null;
          doc_top_factors?: Json;
          has_doc_eval?: boolean;
          has_interview?: boolean;
          interview_blocks?: Json;
          interview_methods?: string[];
          interview_primary_process?: string | null;
          interview_primary_source?: string | null;
          interview_primary_time?: string | null;
          interview_search_text?: string | null;
          interview_status?: string | null;
          interview_top_factors?: Json;
          name: string;
          recruitment?: number | null;
          region: string;
          source_url_doc?: string;
          source_url_interview?: string;
        };
        Update: {
          code?: string;
          crawled_at?: string;
          doc_content_tables?: Json;
          doc_parsed_ratios?: Json;
          doc_ratio_tables?: Json;
          doc_search_text?: string | null;
          doc_section_text?: string | null;
          doc_top_factors?: Json;
          has_doc_eval?: boolean;
          has_interview?: boolean;
          interview_blocks?: Json;
          interview_methods?: string[];
          interview_primary_process?: string | null;
          interview_primary_source?: string | null;
          interview_primary_time?: string | null;
          interview_search_text?: string | null;
          interview_status?: string | null;
          interview_top_factors?: Json;
          name?: string;
          recruitment?: number | null;
          region?: string;
          source_url_doc?: string;
          source_url_interview?: string;
        };
        Relationships: [];
      };
      admission_wishlist: {
        Row: {
          adiga_id: string | null;
          admission_name: string | null;
          created_at: string;
          created_by: string | null;
          department: string | null;
          gyogwa_id: string | null;
          id: string;
          jonghap_code: string | null;
          memo: string | null;
          sort_order: number;
          student_code: string;
          track: string;
          university: string;
          updated_at: string;
        };
        Insert: {
          adiga_id?: string | null;
          admission_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          department?: string | null;
          gyogwa_id?: string | null;
          id?: string;
          jonghap_code?: string | null;
          memo?: string | null;
          sort_order?: number;
          student_code: string;
          track: string;
          university: string;
          updated_at?: string;
        };
        Update: {
          adiga_id?: string | null;
          admission_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          department?: string | null;
          gyogwa_id?: string | null;
          id?: string;
          jonghap_code?: string | null;
          memo?: string | null;
          sort_order?: number;
          student_code?: string;
          track?: string;
          university?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admission_wishlist_adiga_id_fkey';
            columns: ['adiga_id'];
            isOneToOne: false;
            referencedRelation: 'admission_adiga_results';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admission_wishlist_gyogwa_id_fkey';
            columns: ['gyogwa_id'];
            isOneToOne: false;
            referencedRelation: 'admission_gyogwa_criteria';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admission_wishlist_jonghap_code_fkey';
            columns: ['jonghap_code'];
            isOneToOne: false;
            referencedRelation: 'admission_jonghap_criteria';
            referencedColumns: ['code'];
          },
        ];
      };
      afterschool_enrollments: {
        Row: {
          cate_id: number;
          collected_at: string | null;
          course_name: string;
          id: string;
          is_paid: boolean | null;
          my_id: string | null;
          student_id: string | null;
          student_name: string | null;
          student_number: string;
          updated_at: string | null;
        };
        Insert: {
          cate_id: number;
          collected_at?: string | null;
          course_name: string;
          id?: string;
          is_paid?: boolean | null;
          my_id?: string | null;
          student_id?: string | null;
          student_name?: string | null;
          student_number: string;
          updated_at?: string | null;
        };
        Update: {
          cate_id?: number;
          collected_at?: string | null;
          course_name?: string;
          id?: string;
          is_paid?: boolean | null;
          my_id?: string | null;
          student_id?: string | null;
          student_name?: string | null;
          student_number?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      class_student_memos: {
        Row: {
          class_num: number | null;
          content: string;
          created_at: string;
          created_by: string | null;
          day_of_week: number;
          grade: number | null;
          id: string;
          memo_date: string;
          period: number;
          student_code: string;
          student_name: string | null;
          subject: string;
          teacher_name: string | null;
          updated_at: string;
          year: number;
        };
        Insert: {
          class_num?: number | null;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          day_of_week: number;
          grade?: number | null;
          id?: string;
          memo_date: string;
          period: number;
          student_code: string;
          student_name?: string | null;
          subject: string;
          teacher_name?: string | null;
          updated_at?: string;
          year: number;
        };
        Update: {
          class_num?: number | null;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          day_of_week?: number;
          grade?: number | null;
          id?: string;
          memo_date?: string;
          period?: number;
          student_code?: string;
          student_name?: string | null;
          subject?: string;
          teacher_name?: string | null;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      class_swap: {
        Row: {
          approver_original_period: number;
          approver_original_weekday: number;
          approver_resource_id: string;
          approver_section_id: string;
          approver_swap_date: string;
          created_at: string;
          id: string;
          meta: Json;
          requested_at: string;
          requester_original_period: number;
          requester_original_weekday: number;
          requester_resource_id: string;
          requester_section_id: string;
          requester_swap_date: string;
          responded_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          approver_original_period: number;
          approver_original_weekday: number;
          approver_resource_id: string;
          approver_section_id: string;
          approver_swap_date: string;
          created_at?: string;
          id?: string;
          meta?: Json;
          requested_at?: string;
          requester_original_period: number;
          requester_original_weekday: number;
          requester_resource_id: string;
          requester_section_id: string;
          requester_swap_date: string;
          responded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          approver_original_period?: number;
          approver_original_weekday?: number;
          approver_resource_id?: string;
          approver_section_id?: string;
          approver_swap_date?: string;
          created_at?: string;
          id?: string;
          meta?: Json;
          requested_at?: string;
          requester_original_period?: number;
          requester_original_weekday?: number;
          requester_resource_id?: string;
          requester_section_id?: string;
          requester_swap_date?: string;
          responded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'class_swap_approver_resource_id_fkey';
            columns: ['approver_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_swap_approver_resource_id_fkey';
            columns: ['approver_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_approver_resource_id_fkey';
            columns: ['approver_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_approver_resource_id_fkey';
            columns: ['approver_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_approver_section_id_fkey';
            columns: ['approver_section_id'];
            isOneToOne: false;
            referencedRelation: 'section';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_swap_requester_resource_id_fkey';
            columns: ['requester_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_swap_requester_resource_id_fkey';
            columns: ['requester_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_requester_resource_id_fkey';
            columns: ['requester_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_requester_resource_id_fkey';
            columns: ['requester_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'class_swap_requester_section_id_fkey';
            columns: ['requester_section_id'];
            isOneToOne: false;
            referencedRelation: 'section';
            referencedColumns: ['id'];
          },
        ];
      };
      club_info: {
        Row: {
          academic_year: number;
          category: string | null;
          created_at: string;
          grade: number | null;
          id: string;
          meta: Json;
          name: string;
          student_count: number;
          students: Json;
          teacher_name: string | null;
          teacher_resource_id: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year?: number;
          category?: string | null;
          created_at?: string;
          grade?: number | null;
          id?: string;
          meta?: Json;
          name: string;
          student_count?: number;
          students?: Json;
          teacher_name?: string | null;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          category?: string | null;
          created_at?: string;
          grade?: number | null;
          id?: string;
          meta?: Json;
          name?: string;
          student_count?: number;
          students?: Json;
          teacher_name?: string | null;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'club_info_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_info_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'club_info_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'club_info_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      collab_board_members: {
        Row: {
          board_id: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
          user_profile_id: string | null;
        };
        Insert: {
          board_id: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id: string;
          user_profile_id?: string | null;
        };
        Update: {
          board_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
          user_profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'collab_board_members_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'collab_boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_board_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_board_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_board_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_board_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      collab_boards: {
        Row: {
          archived_at: string | null;
          color: string;
          created_at: string;
          created_by: string;
          created_by_profile_id: string | null;
          description: string | null;
          id: string;
          is_archived: boolean;
          meta: Json;
          title: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          archived_at?: string | null;
          color?: string;
          created_at?: string;
          created_by: string;
          created_by_profile_id?: string | null;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          meta?: Json;
          title: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          archived_at?: string | null;
          color?: string;
          created_at?: string;
          created_by?: string;
          created_by_profile_id?: string | null;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          meta?: Json;
          title?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collab_boards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_boards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_boards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_boards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      collab_note_comments: {
        Row: {
          author_id: string;
          author_profile_id: string | null;
          content: string;
          created_at: string;
          id: string;
          note_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          author_profile_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          note_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          author_profile_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          note_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collab_note_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_note_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_note_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_note_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_note_comments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'collab_notes';
            referencedColumns: ['id'];
          },
        ];
      };
      collab_notes: {
        Row: {
          archived_at: string | null;
          author_id: string;
          author_profile_id: string | null;
          board_id: string;
          color: string;
          content: string;
          created_at: string;
          id: string;
          is_acknowledged: boolean;
          is_archived: boolean;
          is_pinned: boolean;
          meta: Json;
          plugin_instance_id: string | null;
          position_x: number | null;
          position_y: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          author_id: string;
          author_profile_id?: string | null;
          board_id: string;
          color?: string;
          content: string;
          created_at?: string;
          id?: string;
          is_acknowledged?: boolean;
          is_archived?: boolean;
          is_pinned?: boolean;
          meta?: Json;
          plugin_instance_id?: string | null;
          position_x?: number | null;
          position_y?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          author_id?: string;
          author_profile_id?: string | null;
          board_id?: string;
          color?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_acknowledged?: boolean;
          is_archived?: boolean;
          is_pinned?: boolean;
          meta?: Json;
          plugin_instance_id?: string | null;
          position_x?: number | null;
          position_y?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collab_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'collab_notes_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'collab_boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collab_notes_plugin_instance_id_fkey';
            columns: ['plugin_instance_id'];
            isOneToOne: false;
            referencedRelation: 'plugin_instances';
            referencedColumns: ['id'];
          },
        ];
      };
      continents: {
        Row: {
          color_theme: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          position_q: number;
          position_r: number;
          sub_goals: string[] | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color_theme?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          position_q: number;
          position_r: number;
          sub_goals?: string[] | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color_theme?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          position_q?: number;
          position_r?: number;
          sub_goals?: string[] | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      course_offering: {
        Row: {
          academic_year: number;
          admission_year: number | null;
          class_label: string | null;
          classroom: string | null;
          created_at: string;
          credits: number | null;
          curriculum_id: string | null;
          grade: number | null;
          id: string;
          meta: Json;
          room_no: string | null;
          semester: number;
          subject_name: string;
          teacher_name: string;
          teacher_resource_id: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          admission_year?: number | null;
          class_label?: string | null;
          classroom?: string | null;
          created_at?: string;
          credits?: number | null;
          curriculum_id?: string | null;
          grade?: number | null;
          id?: string;
          meta?: Json;
          room_no?: string | null;
          semester: number;
          subject_name: string;
          teacher_name: string;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          admission_year?: number | null;
          class_label?: string | null;
          classroom?: string | null;
          created_at?: string;
          credits?: number | null;
          curriculum_id?: string | null;
          grade?: number | null;
          id?: string;
          meta?: Json;
          room_no?: string | null;
          semester?: number;
          subject_name?: string;
          teacher_name?: string;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_offering_curriculum_id_fkey';
            columns: ['curriculum_id'];
            isOneToOne: false;
            referencedRelation: 'school_curriculum';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_offering_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_offering_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'course_offering_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'course_offering_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      course_selectable_subject: {
        Row: {
          category_code: string;
          created_at: string;
          default_class_count: number | null;
          default_max_capacity: number | null;
          display_order: number;
          id: string;
          is_active: boolean;
          meta: Json;
          name: string;
          school_curriculum_id: string | null;
          updated_at: string;
        };
        Insert: {
          category_code: string;
          created_at?: string;
          default_class_count?: number | null;
          default_max_capacity?: number | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          meta?: Json;
          name: string;
          school_curriculum_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category_code?: string;
          created_at?: string;
          default_class_count?: number | null;
          default_max_capacity?: number | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          meta?: Json;
          name?: string;
          school_curriculum_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selectable_subject_school_curriculum_id_fkey';
            columns: ['school_curriculum_id'];
            isOneToOne: false;
            referencedRelation: 'school_curriculum';
            referencedColumns: ['id'];
          },
        ];
      };
      course_selection_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string;
          actor_role: string;
          diff: Json;
          id: string;
          occurred_at: string;
          reason: string | null;
          round_id: string | null;
          target_id: string | null;
          target_label: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name: string;
          actor_role: string;
          diff?: Json;
          id?: string;
          occurred_at?: string;
          reason?: string | null;
          round_id?: string | null;
          target_id?: string | null;
          target_label?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string;
          actor_role?: string;
          diff?: Json;
          id?: string;
          occurred_at?: string;
          reason?: string | null;
          round_id?: string | null;
          target_id?: string | null;
          target_label?: string | null;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_audit_log_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_audit_log_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round_for_grade';
            referencedColumns: ['id'];
          },
        ];
      };
      course_selection_group: {
        Row: {
          academic_year: number | null;
          category_codes: string[];
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          meta: Json;
          name: string;
          round_id: string;
          target_grade: number | null;
          updated_at: string;
        };
        Insert: {
          academic_year?: number | null;
          category_codes?: string[];
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          meta?: Json;
          name: string;
          round_id: string;
          target_grade?: number | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number | null;
          category_codes?: string[];
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          meta?: Json;
          name?: string;
          round_id?: string;
          target_grade?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_group_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_group_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round_for_grade';
            referencedColumns: ['id'];
          },
        ];
      };
      course_selection_item: {
        Row: {
          category_code: string | null;
          created_at: string;
          id: string;
          is_assigned: boolean | null;
          meta: Json;
          priority: number | null;
          selectable_subject_id: string | null;
          semester: number;
          slot_id: string | null;
          subject_name: string;
          submission_id: string;
        };
        Insert: {
          category_code?: string | null;
          created_at?: string;
          id?: string;
          is_assigned?: boolean | null;
          meta?: Json;
          priority?: number | null;
          selectable_subject_id?: string | null;
          semester: number;
          slot_id?: string | null;
          subject_name: string;
          submission_id: string;
        };
        Update: {
          category_code?: string | null;
          created_at?: string;
          id?: string;
          is_assigned?: boolean | null;
          meta?: Json;
          priority?: number | null;
          selectable_subject_id?: string | null;
          semester?: number;
          slot_id?: string | null;
          subject_name?: string;
          submission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_item_selectable_subject_id_fkey';
            columns: ['selectable_subject_id'];
            isOneToOne: false;
            referencedRelation: 'course_selectable_subject';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_item_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_slot';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_item_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_slot_capacity';
            referencedColumns: ['slot_id'];
          },
          {
            foreignKeyName: 'course_selection_item_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_submission';
            referencedColumns: ['id'];
          },
        ];
      };
      course_selection_round: {
        Row: {
          academic_year: number | null;
          admission_year: number | null;
          capacity_overrides: Json;
          closes_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          meta: Json;
          opens_at: string | null;
          round_number: number;
          status: string;
          target_grade: number | null;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year?: number | null;
          admission_year?: number | null;
          capacity_overrides?: Json;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          meta?: Json;
          opens_at?: string | null;
          round_number: number;
          status?: string;
          target_grade?: number | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number | null;
          admission_year?: number | null;
          capacity_overrides?: Json;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          meta?: Json;
          opens_at?: string | null;
          round_number?: number;
          status?: string;
          target_grade?: number | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_selection_slot: {
        Row: {
          capacity: number | null;
          created_at: string;
          display_order: number;
          group_id: string;
          id: string;
          meta: Json;
          pick_count: number;
          semester: number | null;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          display_order?: number;
          group_id: string;
          id?: string;
          meta?: Json;
          pick_count?: number;
          semester?: number | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          display_order?: number;
          group_id?: string;
          id?: string;
          meta?: Json;
          pick_count?: number;
          semester?: number | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_slot_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_group';
            referencedColumns: ['id'];
          },
        ];
      };
      course_selection_slot_subject: {
        Row: {
          bundle_key: string | null;
          bundle_label: string | null;
          created_at: string;
          display_order: number;
          id: string;
          meta: Json;
          override_capacity: number | null;
          selectable_subject_id: string;
          semester: number | null;
          slot_id: string;
        };
        Insert: {
          bundle_key?: string | null;
          bundle_label?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          meta?: Json;
          override_capacity?: number | null;
          selectable_subject_id: string;
          semester?: number | null;
          slot_id: string;
        };
        Update: {
          bundle_key?: string | null;
          bundle_label?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          meta?: Json;
          override_capacity?: number | null;
          selectable_subject_id?: string;
          semester?: number | null;
          slot_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_slot_subject_selectable_subject_id_fkey';
            columns: ['selectable_subject_id'];
            isOneToOne: false;
            referencedRelation: 'course_selectable_subject';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_slot_subject_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_slot';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_slot_subject_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_slot_capacity';
            referencedColumns: ['slot_id'];
          },
        ];
      };
      course_selection_submission: {
        Row: {
          created_at: string;
          id: string;
          last_modified_at: string;
          meta: Json;
          round_id: string;
          status: string;
          student_class: number | null;
          student_code: string | null;
          student_grade: number | null;
          student_name: string;
          student_no: number | null;
          student_resource_id: string | null;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_modified_at?: string;
          meta?: Json;
          round_id: string;
          status?: string;
          student_class?: number | null;
          student_code?: string | null;
          student_grade?: number | null;
          student_name: string;
          student_no?: number | null;
          student_resource_id?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_modified_at?: string;
          meta?: Json;
          round_id?: string;
          status?: string;
          student_class?: number | null;
          student_code?: string | null;
          student_grade?: number | null;
          student_name?: string;
          student_no?: number | null;
          student_resource_id?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_submission_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_submission_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round_for_grade';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_submission_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_submission_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'course_selection_submission_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'course_selection_submission_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      daily_reviews: {
        Row: {
          comment: string | null;
          completed_tasks_count: number | null;
          created_at: string;
          distraction_time: number | null;
          id: string;
          review_date: string;
          satisfaction_score: number | null;
          sleep_hours: number | null;
          total_tasks_count: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          completed_tasks_count?: number | null;
          created_at?: string;
          distraction_time?: number | null;
          id?: string;
          review_date: string;
          satisfaction_score?: number | null;
          sleep_hours?: number | null;
          total_tasks_count?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          completed_tasks_count?: number | null;
          created_at?: string;
          distraction_time?: number | null;
          id?: string;
          review_date?: string;
          satisfaction_score?: number | null;
          sleep_hours?: number | null;
          total_tasks_count?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'daily_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'daily_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      dashboard_info_boxes: {
        Row: {
          content: string | null;
          content_type: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          parent_card_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          content?: string | null;
          content_type: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          parent_card_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string | null;
          content_type?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          parent_card_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_info_boxes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_info_boxes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'dashboard_info_boxes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'dashboard_info_boxes_parent_card_id_fkey';
            columns: ['parent_card_id'];
            isOneToOne: false;
            referencedRelation: 'dashboard_info_boxes';
            referencedColumns: ['id'];
          },
        ];
      };
      department: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      department_member: {
        Row: {
          created_at: string;
          department_id: string;
          id: string;
          resource_id: string;
        };
        Insert: {
          created_at?: string;
          department_id: string;
          id?: string;
          resource_id: string;
        };
        Update: {
          created_at?: string;
          department_id?: string;
          id?: string;
          resource_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'department_member_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'department';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'department_member_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'department_member_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'department_member_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'department_member_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      department_notice: {
        Row: {
          attachments: Json;
          author_name: string | null;
          content: string;
          created_at: string;
          created_by: string;
          department: string;
          end_date: string;
          id: string;
          start_date: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          attachments?: Json;
          author_name?: string | null;
          content: string;
          created_at?: string;
          created_by?: string;
          department: string;
          end_date: string;
          id?: string;
          start_date?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          attachments?: Json;
          author_name?: string | null;
          content?: string;
          created_at?: string;
          created_by?: string;
          department?: string;
          end_date?: string;
          id?: string;
          start_date?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_issue: {
        Row: {
          class_number: number | null;
          created_at: string;
          created_by: string;
          department: string | null;
          doc_type: string;
          form_data: Json | null;
          grade: number | null;
          id: string;
          issue_no: string;
          issue_year: number;
          issued_on: string;
          meta: Json;
          remarks: string | null;
          status: string;
          students: Json;
          title: string;
          updated_at: string;
        };
        Insert: {
          class_number?: number | null;
          created_at?: string;
          created_by: string;
          department?: string | null;
          doc_type: string;
          form_data?: Json | null;
          grade?: number | null;
          id?: string;
          issue_no: string;
          issue_year: number;
          issued_on: string;
          meta?: Json;
          remarks?: string | null;
          status?: string;
          students?: Json;
          title: string;
          updated_at?: string;
        };
        Update: {
          class_number?: number | null;
          created_at?: string;
          created_by?: string;
          department?: string | null;
          doc_type?: string;
          form_data?: Json | null;
          grade?: number | null;
          id?: string;
          issue_no?: string;
          issue_year?: number;
          issued_on?: string;
          meta?: Json;
          remarks?: string | null;
          status?: string;
          students?: Json;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_issue_sequences: {
        Row: {
          last_value: number;
          number_space: string;
          year: number;
        };
        Insert: {
          last_value?: number;
          number_space: string;
          year: number;
        };
        Update: {
          last_value?: number;
          number_space?: string;
          year?: number;
        };
        Relationships: [];
      };
      document_shares: {
        Row: {
          created_at: string;
          created_by: string;
          document_id: string;
          expires_at: string | null;
          id: string;
          permission_level: string;
          shared_with_section_id: string | null;
          shared_with_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          document_id: string;
          expires_at?: string | null;
          id?: string;
          permission_level?: string;
          shared_with_section_id?: string | null;
          shared_with_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          document_id?: string;
          expires_at?: string | null;
          id?: string;
          permission_level?: string;
          shared_with_section_id?: string | null;
          shared_with_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_shares_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          is_hidden: boolean | null;
          meta: Json | null;
          storage_path: string;
          title: string;
          updated_at: string;
          upload_status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          is_hidden?: boolean | null;
          meta?: Json | null;
          storage_path: string;
          title: string;
          updated_at?: string;
          upload_status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          is_hidden?: boolean | null;
          meta?: Json | null;
          storage_path?: string;
          title?: string;
          updated_at?: string;
          upload_status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      educational_news: {
        Row: {
          analyzed_at: string | null;
          article_date: string | null;
          category: string | null;
          cautions: string[] | null;
          collected_at: string | null;
          content: string | null;
          core_points: string[] | null;
          created_at: string;
          data_points: string[] | null;
          headline_summary: string | null;
          id: string;
          meta: Json | null;
          source: string;
          strategy_implications: string[] | null;
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          analyzed_at?: string | null;
          article_date?: string | null;
          category?: string | null;
          cautions?: string[] | null;
          collected_at?: string | null;
          content?: string | null;
          core_points?: string[] | null;
          created_at?: string;
          data_points?: string[] | null;
          headline_summary?: string | null;
          id?: string;
          meta?: Json | null;
          source: string;
          strategy_implications?: string[] | null;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          analyzed_at?: string | null;
          article_date?: string | null;
          category?: string | null;
          cautions?: string[] | null;
          collected_at?: string | null;
          content?: string | null;
          core_points?: string[] | null;
          created_at?: string;
          data_points?: string[] | null;
          headline_summary?: string | null;
          id?: string;
          meta?: Json | null;
          source?: string;
          strategy_implications?: string[] | null;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      educational_news_compound_analysis: {
        Row: {
          cautions: string[] | null;
          created_at: string;
          created_by: string | null;
          id: string;
          key_findings: string[] | null;
          model: string | null;
          perspective: string | null;
          raw_response: Json | null;
          source_news_ids: string[] | null;
          source_video_ids: string[];
          strategy: string[] | null;
          summary: string | null;
          title: string;
          trends: string[] | null;
          updated_at: string;
        };
        Insert: {
          cautions?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key_findings?: string[] | null;
          model?: string | null;
          perspective?: string | null;
          raw_response?: Json | null;
          source_news_ids?: string[] | null;
          source_video_ids?: string[];
          strategy?: string[] | null;
          summary?: string | null;
          title: string;
          trends?: string[] | null;
          updated_at?: string;
        };
        Update: {
          cautions?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key_findings?: string[] | null;
          model?: string | null;
          perspective?: string | null;
          raw_response?: Json | null;
          source_news_ids?: string[] | null;
          source_video_ids?: string[];
          strategy?: string[] | null;
          summary?: string | null;
          title?: string;
          trends?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'educational_news_compound_analysis_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'educational_news_compound_analysis_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'educational_news_compound_analysis_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      educational_videos: {
        Row: {
          analyzed_at: string | null;
          article_date: string | null;
          caption_lang: string | null;
          caption_type: string | null;
          category: string;
          channel_id: string | null;
          channel_label: string | null;
          collected_at: string | null;
          created_at: string;
          created_by: string;
          duration_seconds: number | null;
          headline_summary: string | null;
          id: string;
          likes: number;
          meta: Json | null;
          thumbnail: string | null;
          title: string;
          transcript: string | null;
          updated_at: string;
          url: string;
          video_id: string | null;
        };
        Insert: {
          analyzed_at?: string | null;
          article_date?: string | null;
          caption_lang?: string | null;
          caption_type?: string | null;
          category: string;
          channel_id?: string | null;
          channel_label?: string | null;
          collected_at?: string | null;
          created_at?: string;
          created_by: string;
          duration_seconds?: number | null;
          headline_summary?: string | null;
          id?: string;
          likes?: number;
          meta?: Json | null;
          thumbnail?: string | null;
          title: string;
          transcript?: string | null;
          updated_at?: string;
          url: string;
          video_id?: string | null;
        };
        Update: {
          analyzed_at?: string | null;
          article_date?: string | null;
          caption_lang?: string | null;
          caption_type?: string | null;
          category?: string;
          channel_id?: string | null;
          channel_label?: string | null;
          collected_at?: string | null;
          created_at?: string;
          created_by?: string;
          duration_seconds?: number | null;
          headline_summary?: string | null;
          id?: string;
          likes?: number;
          meta?: Json | null;
          thumbnail?: string | null;
          title?: string;
          transcript?: string | null;
          updated_at?: string;
          url?: string;
          video_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'educational_videos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'educational_videos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'educational_videos_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      evalearn_grade_analysis: {
        Row: {
          created_at: string;
          exam_month: number;
          exam_year: number;
          file_size: number | null;
          grade: number;
          id: string;
          storage_path: string;
          title: string | null;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          exam_month: number;
          exam_year: number;
          file_size?: number | null;
          grade: number;
          id?: string;
          storage_path: string;
          title?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          exam_month?: number;
          exam_year?: number;
          file_size?: number | null;
          grade?: number;
          id?: string;
          storage_path?: string;
          title?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'evalearn_grade_analysis_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evalearn_grade_analysis_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'evalearn_grade_analysis_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      evalog_tag_permissions: {
        Row: {
          created_at: string;
          grade: number;
          id: string;
          permission_key: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          grade: number;
          id?: string;
          permission_key: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          grade?: number;
          id?: string;
          permission_key?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evalog_tag_permissions_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'resource_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      event: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          keywords: string[] | null;
          manager_id: string;
          meta: Json | null;
          name: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[] | null;
          manager_id: string;
          meta?: Json | null;
          name: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[] | null;
          manager_id?: string;
          meta?: Json | null;
          name?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_event_manager';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_event_manager';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_event_manager';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_event_manager';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      exam_schedule: {
        Row: {
          candidates: Json;
          created_at: string;
          created_by: string | null;
          diagnostics: Json | null;
          exam_type: string;
          finalized_assignments: Json | null;
          grade: number;
          id: string;
          input_payload: Json;
          selected_candidate_id: string | null;
          status: string;
          supervisor_assignments: Json | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          candidates?: Json;
          created_at?: string;
          created_by?: string | null;
          diagnostics?: Json | null;
          exam_type?: string;
          finalized_assignments?: Json | null;
          grade: number;
          id?: string;
          input_payload: Json;
          selected_candidate_id?: string | null;
          status?: string;
          supervisor_assignments?: Json | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          candidates?: Json;
          created_at?: string;
          created_by?: string | null;
          diagnostics?: Json | null;
          exam_type?: string;
          finalized_assignments?: Json | null;
          grade?: number;
          id?: string;
          input_payload?: Json;
          selected_candidate_id?: string | null;
          status?: string;
          supervisor_assignments?: Json | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exam_schedule_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exam_schedule_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'exam_schedule_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'exam_schedule_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      exam_supervision_adjustment: {
        Row: {
          created_at: string;
          created_by: string | null;
          delta: number;
          id: string;
          reason: string | null;
          teacher_resource_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          delta: number;
          id?: string;
          reason?: string | null;
          teacher_resource_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          delta?: number;
          id?: string;
          reason?: string | null;
          teacher_resource_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exam_supervision_adjustment_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exam_supervision_adjustment_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'exam_supervision_adjustment_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'exam_supervision_adjustment_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      focus_forest_completed: {
        Row: {
          completed_at: string;
          created_at: string;
          focus_time_seconds: number;
          forest_index: number;
          id: string;
          total_trees: number;
          tree_positions: Json;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          created_at?: string;
          focus_time_seconds?: number;
          forest_index: number;
          id?: string;
          total_trees?: number;
          tree_positions?: Json;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          created_at?: string;
          focus_time_seconds?: number;
          forest_index?: number;
          id?: string;
          total_trees?: number;
          tree_positions?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'focus_forest_completed_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'focus_forest_completed_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'focus_forest_completed_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      focus_forest_data: {
        Row: {
          animal_collection: Json;
          created_at: string;
          current_forest_index: number;
          daily_records: Json;
          id: string;
          longest_session_seconds: number;
          saved_trees: Json;
          session_goal_minutes: number | null;
          total_focus_seconds: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          animal_collection?: Json;
          created_at?: string;
          current_forest_index?: number;
          daily_records?: Json;
          id?: string;
          longest_session_seconds?: number;
          saved_trees?: Json;
          session_goal_minutes?: number | null;
          total_focus_seconds?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          animal_collection?: Json;
          created_at?: string;
          current_forest_index?: number;
          daily_records?: Json;
          id?: string;
          longest_session_seconds?: number;
          saved_trees?: Json;
          session_goal_minutes?: number | null;
          total_focus_seconds?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'focus_forest_data_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'focus_forest_data_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'focus_forest_data_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      focus_forest_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number;
          ended_at: string;
          id: string;
          memo: string | null;
          started_at: string;
          trees_planted: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds: number;
          ended_at: string;
          id?: string;
          memo?: string | null;
          started_at: string;
          trees_planted?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          ended_at?: string;
          id?: string;
          memo?: string | null;
          started_at?: string;
          trees_planted?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'focus_forest_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'focus_forest_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'focus_forest_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      inquiry_design_llm_cache: {
        Row: {
          cache_key: string;
          completion_tokens: number;
          created_at: string;
          expires_at: string;
          model: string;
          prompt_tokens: number;
          result: Json;
          student_id: string;
        };
        Insert: {
          cache_key: string;
          completion_tokens?: number;
          created_at?: string;
          expires_at: string;
          model: string;
          prompt_tokens?: number;
          result: Json;
          student_id: string;
        };
        Update: {
          cache_key?: string;
          completion_tokens?: number;
          created_at?: string;
          expires_at?: string;
          model?: string;
          prompt_tokens?: number;
          result?: Json;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'inquiry_design_llm_cache_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      live_presentation_activities: {
        Row: {
          closed_at: string | null;
          config: Json;
          current_round: number;
          id: string;
          kind: string;
          opened_at: string | null;
          prompt: string;
          revealed_at: string | null;
          session_id: string;
          slide_index: number | null;
          slide_key: string;
          status: string;
        };
        Insert: {
          closed_at?: string | null;
          config?: Json;
          current_round?: number;
          id?: string;
          kind: string;
          opened_at?: string | null;
          prompt: string;
          revealed_at?: string | null;
          session_id: string;
          slide_index?: number | null;
          slide_key: string;
          status?: string;
        };
        Update: {
          closed_at?: string | null;
          config?: Json;
          current_round?: number;
          id?: string;
          kind?: string;
          opened_at?: string | null;
          prompt?: string;
          revealed_at?: string | null;
          session_id?: string;
          slide_index?: number | null;
          slide_key?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'live_presentation_activities_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'live_presentation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      live_presentation_config: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      live_presentation_participants: {
        Row: {
          client_id: string;
          id: string;
          joined_at: string;
          nickname: string;
          session_id: string;
          student_no: string | null;
        };
        Insert: {
          client_id: string;
          id?: string;
          joined_at?: string;
          nickname?: string;
          session_id: string;
          student_no?: string | null;
        };
        Update: {
          client_id?: string;
          id?: string;
          joined_at?: string;
          nickname?: string;
          session_id?: string;
          student_no?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'live_presentation_participants_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'live_presentation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      live_presentation_responses: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          is_correct: boolean | null;
          participant_id: string;
          payload: Json;
          round: number;
          score: number;
          session_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          participant_id: string;
          payload: Json;
          round?: number;
          score?: number;
          session_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          participant_id?: string;
          payload?: Json;
          round?: number;
          score?: number;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'live_presentation_responses_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'live_presentation_activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'live_presentation_responses_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'live_presentation_participants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'live_presentation_responses_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'live_presentation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      live_presentation_sessions: {
        Row: {
          code: string;
          created_at: string;
          current_slide: number;
          deck_path: string | null;
          ended_at: string | null;
          gamify: boolean;
          host_token: string;
          id: string;
          name_mode: string;
          status: string;
          title: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          current_slide?: number;
          deck_path?: string | null;
          ended_at?: string | null;
          gamify?: boolean;
          host_token?: string;
          id?: string;
          name_mode?: string;
          status?: string;
          title?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          current_slide?: number;
          deck_path?: string | null;
          ended_at?: string | null;
          gamify?: boolean;
          host_token?: string;
          id?: string;
          name_mode?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      meeting: {
        Row: {
          created_at: string;
          created_by: string | null;
          creator: string | null;
          ends_at: string;
          id: string;
          kind: string;
          meta: Json | null;
          section_id: string | null;
          starts_at: string;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          creator?: string | null;
          ends_at: string;
          id?: string;
          kind: string;
          meta?: Json | null;
          section_id?: string | null;
          starts_at: string;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          creator?: string | null;
          ends_at?: string;
          id?: string;
          kind?: string;
          meta?: Json | null;
          section_id?: string | null;
          starts_at?: string;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'meeting_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'meeting_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'meeting_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'section';
            referencedColumns: ['id'];
          },
        ];
      };
      message_participants: {
        Row: {
          id: string;
          joined_at: string;
          left_at: string | null;
          role: string | null;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          role?: string | null;
          thread_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          role?: string | null;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      message_threads: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          is_group_chat: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          is_group_chat?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          is_group_chat?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          attachment_url: string | null;
          content: string;
          created_at: string;
          id: string;
          is_edited: boolean;
          message_type: string;
          sender_id: string;
          thread_id: string;
          updated_at: string;
        };
        Insert: {
          attachment_url?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          is_edited?: boolean;
          message_type?: string;
          sender_id: string;
          thread_id: string;
          updated_at?: string;
        };
        Update: {
          attachment_url?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          is_edited?: boolean;
          message_type?: string;
          sender_id?: string;
          thread_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_problems: {
        Row: {
          answer: string | null;
          answer_type: string | null;
          choice_rates: Json | null;
          collected_at: string | null;
          correct_rate: string | null;
          curriculum_code: string | null;
          difficulty_level: string | null;
          id: string;
          info: Json | null;
          intention: string | null;
          major_category: string | null;
          month: number;
          point: number | null;
          problem_number: number;
          student_grade: number;
          sub_category: string | null;
          subject: string;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          answer?: string | null;
          answer_type?: string | null;
          choice_rates?: Json | null;
          collected_at?: string | null;
          correct_rate?: string | null;
          curriculum_code?: string | null;
          difficulty_level?: string | null;
          id?: string;
          info?: Json | null;
          intention?: string | null;
          major_category?: string | null;
          month: number;
          point?: number | null;
          problem_number: number;
          student_grade: number;
          sub_category?: string | null;
          subject: string;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          answer?: string | null;
          answer_type?: string | null;
          choice_rates?: Json | null;
          collected_at?: string | null;
          correct_rate?: string | null;
          curriculum_code?: string | null;
          difficulty_level?: string | null;
          id?: string;
          info?: Json | null;
          intention?: string | null;
          major_category?: string | null;
          month?: number;
          point?: number | null;
          problem_number?: number;
          student_grade?: number;
          sub_category?: string | null;
          subject?: string;
          updated_at?: string | null;
          year?: number;
        };
        Relationships: [];
      };
      mock_problems_category_split_backup_20260702: {
        Row: {
          id: string | null;
          old_major_category: string | null;
          old_sub_category: string | null;
        };
        Insert: {
          id?: string | null;
          old_major_category?: string | null;
          old_sub_category?: string | null;
        };
        Update: {
          id?: string | null;
          old_major_category?: string | null;
          old_sub_category?: string | null;
        };
        Relationships: [];
      };
      mock_problems_tonghap_gwahak_backup_20260702: {
        Row: {
          id: string | null;
          old_major_category: string | null;
          old_sub_category: string | null;
        };
        Insert: {
          id?: string | null;
          old_major_category?: string | null;
          old_sub_category?: string | null;
        };
        Update: {
          id?: string | null;
          old_major_category?: string | null;
          old_sub_category?: string | null;
        };
        Relationships: [];
      };
      notification_events: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          meta: Json | null;
          priority: string | null;
          related_meeting_id: string | null;
          resource_id: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          meta?: Json | null;
          priority?: string | null;
          related_meeting_id?: string | null;
          resource_id: string;
          title: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          meta?: Json | null;
          priority?: string | null;
          related_meeting_id?: string | null;
          resource_id?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_events_related_meeting_id_fkey';
            columns: ['related_meeting_id'];
            isOneToOne: false;
            referencedRelation: 'meeting';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_events_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_events_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'notification_events_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'notification_events_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          related_problem_id: string | null;
          related_solution_id: string | null;
          related_user_id: string | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          related_problem_id?: string | null;
          related_solution_id?: string | null;
          related_user_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          related_problem_id?: string | null;
          related_solution_id?: string | null;
          related_user_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      plugin_instances: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          data: Json | null;
          entity_id: string;
          entity_type: string;
          id: string;
          plugin_id: string;
          settings: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          data?: Json | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          plugin_id: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          data?: Json | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          plugin_id?: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plugin_instances_plugin_id_fkey';
            columns: ['plugin_id'];
            isOneToOne: false;
            referencedRelation: 'plugins';
            referencedColumns: ['id'];
          },
        ];
      };
      plugins: {
        Row: {
          config: Json | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          permissions: Json | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          permissions?: Json | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          permissions?: Json | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string;
          id: string;
          reference_id: string | null;
          student_id: string;
          type: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string;
          id?: string;
          reference_id?: string | null;
          student_id: string;
          type: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string;
          id?: string;
          reference_id?: string | null;
          student_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'point_transactions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'point_transactions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'point_transactions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      poll_votes: {
        Row: {
          created_at: string | null;
          id: string;
          instance_id: string;
          option_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          instance_id: string;
          option_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instance_id?: string;
          option_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poll_votes_instance_id_fkey';
            columns: ['instance_id'];
            isOneToOne: false;
            referencedRelation: 'plugin_instances';
            referencedColumns: ['id'];
          },
        ];
      };
      privacy_policy_versions: {
        Row: {
          created_at: string;
          effective_date: string;
          is_active: boolean;
          title: string;
          version: string;
        };
        Insert: {
          created_at?: string;
          effective_date: string;
          is_active?: boolean;
          title: string;
          version: string;
        };
        Update: {
          created_at?: string;
          effective_date?: string;
          is_active?: boolean;
          title?: string;
          version?: string;
        };
        Relationships: [];
      };
      problem_solutions: {
        Row: {
          author_email: string | null;
          author_nickname: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string;
          likes_count: number;
          problem_id: string;
          user_id: string;
          youtube_url: string | null;
        };
        Insert: {
          author_email?: string | null;
          author_nickname?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url: string;
          likes_count?: number;
          problem_id: string;
          user_id: string;
          youtube_url?: string | null;
        };
        Update: {
          author_email?: string | null;
          author_nickname?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string;
          likes_count?: number;
          problem_id?: string;
          user_id?: string;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_solutions_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      problems: {
        Row: {
          answer: string | null;
          author_email: string | null;
          author_nickname: string | null;
          chapter: string;
          competencies: Json | null;
          created_at: string;
          difficulty: string;
          help_count: number;
          id: string;
          image_url: string;
          is_important: boolean | null;
          likes_count: number;
          percentage: number | null;
          saves_count: number;
          solution_process: Json | null;
          source: string;
          source_detail: string | null;
          subject: string;
          title: string;
          updated_at: string;
          user_id: string;
          views_count: number;
        };
        Insert: {
          answer?: string | null;
          author_email?: string | null;
          author_nickname?: string | null;
          chapter: string;
          competencies?: Json | null;
          created_at?: string;
          difficulty: string;
          help_count?: number;
          id?: string;
          image_url: string;
          is_important?: boolean | null;
          likes_count?: number;
          percentage?: number | null;
          saves_count?: number;
          solution_process?: Json | null;
          source: string;
          source_detail?: string | null;
          subject: string;
          title: string;
          updated_at?: string;
          user_id: string;
          views_count?: number;
        };
        Update: {
          answer?: string | null;
          author_email?: string | null;
          author_nickname?: string | null;
          chapter?: string;
          competencies?: Json | null;
          created_at?: string;
          difficulty?: string;
          help_count?: number;
          id?: string;
          image_url?: string;
          is_important?: boolean | null;
          likes_count?: number;
          percentage?: number | null;
          saves_count?: number;
          solution_process?: Json | null;
          source?: string;
          source_detail?: string | null;
          subject?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          views_count?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_first_login: boolean;
          last_login: string | null;
          name: string | null;
          nickname: string | null;
          problems_registered: number;
          ranking_points: number;
          role: string | null;
          selected_badge_id: number | null;
          signature: string | null;
          solutions_registered: number;
          stamp: string | null;
          total_likes_received: number;
          updated_at: string;
          visit_count: number | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          is_first_login?: boolean;
          last_login?: string | null;
          name?: string | null;
          nickname?: string | null;
          problems_registered?: number;
          ranking_points?: number;
          role?: string | null;
          selected_badge_id?: number | null;
          signature?: string | null;
          solutions_registered?: number;
          stamp?: string | null;
          total_likes_received?: number;
          updated_at?: string;
          visit_count?: number | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_first_login?: boolean;
          last_login?: string | null;
          name?: string | null;
          nickname?: string | null;
          problems_registered?: number;
          ranking_points?: number;
          role?: string | null;
          selected_badge_id?: number | null;
          signature?: string | null;
          solutions_registered?: number;
          stamp?: string | null;
          total_likes_received?: number;
          updated_at?: string;
          visit_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_selected_badge_id_fkey';
            columns: ['selected_badge_id'];
            isOneToOne: false;
            referencedRelation: 'seaton_badge';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_request_collaborators: {
        Row: {
          created_at: string;
          id: string;
          page_id: string;
          resource_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          page_id: string;
          resource_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          page_id?: string;
          resource_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_request_collaborators_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_request_pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_collaborators_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_collaborators_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_collaborators_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_collaborators_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      purchase_request_history: {
        Row: {
          id: string;
          items: Json;
          page_id: string;
          request_id: string;
          requester_id: string;
          snapshot_at: string;
          status: string;
          status_reason: string | null;
        };
        Insert: {
          id?: string;
          items: Json;
          page_id: string;
          request_id: string;
          requester_id: string;
          snapshot_at?: string;
          status: string;
          status_reason?: string | null;
        };
        Update: {
          id?: string;
          items?: Json;
          page_id?: string;
          request_id?: string;
          requester_id?: string;
          snapshot_at?: string;
          status?: string;
          status_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_request_history_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_request_pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_history_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_history_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_history_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_history_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_history_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      purchase_request_pages: {
        Row: {
          archived_at: string | null;
          columns: Json;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          period_end: string;
          period_start: string;
          target_roles: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          columns?: Json;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          period_end: string;
          period_start: string;
          target_roles?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          columns?: Json;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          period_end?: string;
          period_start?: string;
          target_roles?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_request_pages_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_request_pages_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_pages_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_request_pages_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      purchase_requests: {
        Row: {
          created_at: string;
          id: string;
          items: Json;
          meta: Json;
          page_id: string;
          requester_id: string;
          status: string;
          status_reason: string | null;
          status_updated_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          items?: Json;
          meta?: Json;
          page_id: string;
          requester_id: string;
          status?: string;
          status_reason?: string | null;
          status_updated_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          items?: Json;
          meta?: Json;
          page_id?: string;
          requester_id?: string;
          status?: string;
          status_reason?: string | null;
          status_updated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_requests_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_request_pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'purchase_requests_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      purchased_items: {
        Row: {
          id: string;
          item_id: number;
          item_name: string;
          purchased_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          item_id: number;
          item_name: string;
          purchased_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          item_id?: number;
          item_name?: string;
          purchased_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      puzzle_events: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string;
          grid_size: string;
          id: string;
          image_url: string;
          is_active: boolean;
          piece_cost: number;
          start_date: string;
          title: string;
          total_pieces: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date: string;
          grid_size: string;
          id?: string;
          image_url: string;
          is_active?: boolean;
          piece_cost?: number;
          start_date: string;
          title: string;
          total_pieces?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string;
          grid_size?: string;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          piece_cost?: number;
          start_date?: string;
          title?: string;
          total_pieces?: number;
        };
        Relationships: [];
      };
      puzzle_pieces: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          image_url: string;
          piece_index: number;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          image_url: string;
          piece_index: number;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          image_url?: string;
          piece_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'puzzle_pieces_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'puzzle_events';
            referencedColumns: ['id'];
          },
        ];
      };
      rescue_audit_log: {
        Row: {
          action: Database['public']['Enums']['rescue_audit_action'];
          actor_id: string;
          actor_role: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
          student_code: string | null;
        };
        Insert: {
          action: Database['public']['Enums']['rescue_audit_action'];
          actor_id: string;
          actor_role?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: number;
          student_code?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['rescue_audit_action'];
          actor_id?: string;
          actor_role?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: number;
          student_code?: string | null;
        };
        Relationships: [];
      };
      rescue_note_sequences: {
        Row: {
          last_value: number;
          year: number;
        };
        Insert: {
          last_value?: number;
          year: number;
        };
        Update: {
          last_value?: number;
          year?: number;
        };
        Relationships: [];
      };
      rescue_notes: {
        Row: {
          co_student_codes: string[];
          content: string;
          created_at: string;
          created_by: string;
          end_at: string | null;
          id: string;
          linked_note_id: string | null;
          meta: Json;
          note_no: string | null;
          occurred_at: string;
          remarks: string | null;
          student_code: string;
          title: string;
          updated_at: string;
          visibility: Database['public']['Enums']['rescue_visibility'];
        };
        Insert: {
          co_student_codes?: string[];
          content: string;
          created_at?: string;
          created_by: string;
          end_at?: string | null;
          id?: string;
          linked_note_id?: string | null;
          meta?: Json;
          note_no?: string | null;
          occurred_at: string;
          remarks?: string | null;
          student_code: string;
          title?: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['rescue_visibility'];
        };
        Update: {
          co_student_codes?: string[];
          content?: string;
          created_at?: string;
          created_by?: string;
          end_at?: string | null;
          id?: string;
          linked_note_id?: string | null;
          meta?: Json;
          note_no?: string | null;
          occurred_at?: string;
          remarks?: string | null;
          student_code?: string;
          title?: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['rescue_visibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'rescue_notes_linked_note_id_fkey';
            columns: ['linked_note_id'];
            isOneToOne: false;
            referencedRelation: 'rescue_notes';
            referencedColumns: ['id'];
          },
        ];
      };
      rescue_scholarship_sequences: {
        Row: {
          last_value: number;
          year: number;
        };
        Insert: {
          last_value?: number;
          year: number;
        };
        Update: {
          last_value?: number;
          year?: number;
        };
        Relationships: [];
      };
      rescue_scholarships: {
        Row: {
          awarded_on: string;
          created_at: string;
          created_by: string;
          id: string;
          meta: Json;
          name: string;
          remarks: string | null;
          scholarship_no: string | null;
          student_code: string;
          updated_at: string;
        };
        Insert: {
          awarded_on: string;
          created_at?: string;
          created_by: string;
          id?: string;
          meta?: Json;
          name: string;
          remarks?: string | null;
          scholarship_no?: string | null;
          student_code: string;
          updated_at?: string;
        };
        Update: {
          awarded_on?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          meta?: Json;
          name?: string;
          remarks?: string | null;
          scholarship_no?: string | null;
          student_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rescue_status_history: {
        Row: {
          changed_at: string;
          changed_by: string;
          from_status: Database['public']['Enums']['rescue_status'] | null;
          id: string;
          reason: string | null;
          student_code: string;
          to_status: Database['public']['Enums']['rescue_status'];
        };
        Insert: {
          changed_at?: string;
          changed_by: string;
          from_status?: Database['public']['Enums']['rescue_status'] | null;
          id?: string;
          reason?: string | null;
          student_code: string;
          to_status: Database['public']['Enums']['rescue_status'];
        };
        Update: {
          changed_at?: string;
          changed_by?: string;
          from_status?: Database['public']['Enums']['rescue_status'] | null;
          id?: string;
          reason?: string | null;
          student_code?: string;
          to_status?: Database['public']['Enums']['rescue_status'];
        };
        Relationships: [];
      };
      rescue_student_status: {
        Row: {
          reason: string | null;
          status: Database['public']['Enums']['rescue_status'];
          student_code: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          reason?: string | null;
          status?: Database['public']['Enums']['rescue_status'];
          student_code: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          reason?: string | null;
          status?: Database['public']['Enums']['rescue_status'];
          student_code?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      rescue_tag_definitions: {
        Row: {
          active: boolean;
          color: string;
          created_at: string;
          description: string | null;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          color: string;
          created_at?: string;
          description?: string | null;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          color?: string;
          created_at?: string;
          description?: string | null;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      rescue_tags: {
        Row: {
          assigned_at: string;
          assigned_by: string;
          id: string;
          note: string | null;
          student_code: string;
          tag_key: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by: string;
          id?: string;
          note?: string | null;
          student_code: string;
          tag_key: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string;
          id?: string;
          note?: string | null;
          student_code?: string;
          tag_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rescue_tags_tag_key_fkey';
            columns: ['tag_key'];
            isOneToOne: false;
            referencedRelation: 'rescue_tag_definitions';
            referencedColumns: ['key'];
          },
        ];
      };
      reservation_settings: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          max_days_ahead: number;
          reservation_open_day: number;
          reservation_open_time: string;
          terms_and_conditions: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          max_days_ahead?: number;
          reservation_open_day?: number;
          reservation_open_time?: string;
          terms_and_conditions?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          max_days_ahead?: number;
          reservation_open_day?: number;
          reservation_open_time?: string;
          terms_and_conditions?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      resource: {
        Row: {
          created_at: string;
          id: string;
          meta: Json | null;
          name: string;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          name: string;
          status?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          name?: string;
          status?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resource_tag_assignments: {
        Row: {
          created_at: string | null;
          id: string;
          resource_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          resource_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          resource_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_tag_assignments_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resource_tag_assignments_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'resource_tag_assignments_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'resource_tag_assignments_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'resource_tag_assignments_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'resource_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_bulk_option: boolean | null;
          name: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_bulk_option?: boolean | null;
          name: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_bulk_option?: boolean | null;
          name?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      school_curriculum: {
        Row: {
          academic_year: number;
          admission_year: number | null;
          area: string | null;
          category: string;
          created_at: string;
          credits: number;
          curriculum_revision: string | null;
          grade: number;
          grading_type: string | null;
          hours: number | null;
          id: string;
          meta: Json;
          selection_group: string | null;
          semester: number;
          subject: string;
          subject_type: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          admission_year?: number | null;
          area?: string | null;
          category: string;
          created_at?: string;
          credits: number;
          curriculum_revision?: string | null;
          grade: number;
          grading_type?: string | null;
          hours?: number | null;
          id?: string;
          meta?: Json;
          selection_group?: string | null;
          semester: number;
          subject: string;
          subject_type?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          admission_year?: number | null;
          area?: string | null;
          category?: string;
          created_at?: string;
          credits?: number;
          curriculum_revision?: string | null;
          grade?: number;
          grading_type?: string | null;
          hours?: number | null;
          id?: string;
          meta?: Json;
          selection_group?: string | null;
          semester?: number;
          subject?: string;
          subject_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_curriculum_archive: {
        Row: {
          admission_year: number;
          category: string;
          created_at: string;
          credits: number;
          credits_by_semester: Json;
          id: string;
          is_minority: boolean;
          is_shared: boolean;
          is_special: boolean;
          meta: Json | null;
          min_credits: number;
          selection_group: string;
          subject: string;
          subject_type: string;
          total_credits: number;
          updated_at: string;
        };
        Insert: {
          admission_year: number;
          category: string;
          created_at?: string;
          credits?: number;
          credits_by_semester?: Json;
          id?: string;
          is_minority?: boolean;
          is_shared?: boolean;
          is_special?: boolean;
          meta?: Json | null;
          min_credits?: number;
          selection_group?: string;
          subject: string;
          subject_type: string;
          total_credits?: number;
          updated_at?: string;
        };
        Update: {
          admission_year?: number;
          category?: string;
          created_at?: string;
          credits?: number;
          credits_by_semester?: Json;
          id?: string;
          is_minority?: boolean;
          is_shared?: boolean;
          is_special?: boolean;
          meta?: Json | null;
          min_credits?: number;
          selection_group?: string;
          subject?: string;
          subject_type?: string;
          total_credits?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_student_device: {
        Row: {
          created_at: string | null;
          device_number: string;
          device_number_suffix: string;
          device_status: string | null;
          edit_request: string | null;
          edit_request_at: string | null;
          edit_request_by_class: number | null;
          edit_request_by_grade: number | null;
          edit_request_by_name: string | null;
          edit_request_by_number: number | null;
          edit_request_status: string | null;
          enrollment_year: number | null;
          id: string;
          mac_address: string | null;
          note: string | null;
          ocr_at: string | null;
          ocr_match: boolean | null;
          ocr_result: string | null;
          photo_url: string | null;
          transfer_date: string | null;
          updated_at: string | null;
          user_class: number | null;
          user_grade: number | null;
          user_name: string | null;
          user_number: number | null;
        };
        Insert: {
          created_at?: string | null;
          device_number: string;
          device_number_suffix: string;
          device_status?: string | null;
          edit_request?: string | null;
          edit_request_at?: string | null;
          edit_request_by_class?: number | null;
          edit_request_by_grade?: number | null;
          edit_request_by_name?: string | null;
          edit_request_by_number?: number | null;
          edit_request_status?: string | null;
          enrollment_year?: number | null;
          id?: string;
          mac_address?: string | null;
          note?: string | null;
          ocr_at?: string | null;
          ocr_match?: boolean | null;
          ocr_result?: string | null;
          photo_url?: string | null;
          transfer_date?: string | null;
          updated_at?: string | null;
          user_class?: number | null;
          user_grade?: number | null;
          user_name?: string | null;
          user_number?: number | null;
        };
        Update: {
          created_at?: string | null;
          device_number?: string;
          device_number_suffix?: string;
          device_status?: string | null;
          edit_request?: string | null;
          edit_request_at?: string | null;
          edit_request_by_class?: number | null;
          edit_request_by_grade?: number | null;
          edit_request_by_name?: string | null;
          edit_request_by_number?: number | null;
          edit_request_status?: string | null;
          enrollment_year?: number | null;
          id?: string;
          mac_address?: string | null;
          note?: string | null;
          ocr_at?: string | null;
          ocr_match?: boolean | null;
          ocr_result?: string | null;
          photo_url?: string | null;
          transfer_date?: string | null;
          updated_at?: string | null;
          user_class?: number | null;
          user_grade?: number | null;
          user_name?: string | null;
          user_number?: number | null;
        };
        Relationships: [];
      };
      seat_reservations: {
        Row: {
          attendance_status: string | null;
          attended_at: string | null;
          checked_by: string | null;
          created_at: string | null;
          feedback_at: string | null;
          feedback_note: string | null;
          feedback_rating: number | null;
          id: string;
          is_attended: boolean | null;
          period_id: number | null;
          reservation_date: string;
          room_id: string;
          seat_number: string;
          student_id: string;
        };
        Insert: {
          attendance_status?: string | null;
          attended_at?: string | null;
          checked_by?: string | null;
          created_at?: string | null;
          feedback_at?: string | null;
          feedback_note?: string | null;
          feedback_rating?: number | null;
          id?: string;
          is_attended?: boolean | null;
          period_id?: number | null;
          reservation_date: string;
          room_id: string;
          seat_number: string;
          student_id: string;
        };
        Update: {
          attendance_status?: string | null;
          attended_at?: string | null;
          checked_by?: string | null;
          created_at?: string | null;
          feedback_at?: string | null;
          feedback_note?: string | null;
          feedback_rating?: number | null;
          id?: string;
          is_attended?: boolean | null;
          period_id?: number | null;
          reservation_date?: string;
          room_id?: string;
          seat_number?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seat_reservations_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seat_reservations_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'seat_reservations_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'seat_reservations_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'study_rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seat_reservations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seat_reservations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'seat_reservations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      seaton_badge: {
        Row: {
          created_at: string | null;
          description: string;
          id: number;
          image_path: string;
          name: string;
          temperature: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: number;
          image_path: string;
          name: string;
          temperature: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: number;
          image_path?: string;
          name?: string;
          temperature?: number;
        };
        Relationships: [];
      };
      seaton_badge_acquire: {
        Row: {
          acquired_at: string | null;
          badge_id: number;
          id: string;
          student_id: string;
        };
        Insert: {
          acquired_at?: string | null;
          badge_id: number;
          id?: string;
          student_id: string;
        };
        Update: {
          acquired_at?: string | null;
          badge_id?: number;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seaton_badge_acquire_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'seaton_badge';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seaton_badge_acquire_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seaton_badge_acquire_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'seaton_badge_acquire_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      section: {
        Row: {
          created_at: string;
          id: string;
          is_combined: boolean | null;
          meta: Json | null;
          name: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_combined?: boolean | null;
          meta?: Json | null;
          name: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_combined?: boolean | null;
          meta?: Json | null;
          name?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shop_items: {
        Row: {
          bg_class: string | null;
          character_item_id: number | null;
          created_at: string | null;
          description: string | null;
          effect: string | null;
          icon_bg: string | null;
          icon_color: string | null;
          icon_name: string | null;
          id: number;
          image_url: string | null;
          is_active: boolean | null;
          is_universal: boolean | null;
          item_scale: number | null;
          name: string;
          position_left: number | null;
          position_top: number | null;
          price: number | null;
          rarity: string;
          type: string;
          updated_at: string | null;
          z_index: number | null;
        };
        Insert: {
          bg_class?: string | null;
          character_item_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          effect?: string | null;
          icon_bg?: string | null;
          icon_color?: string | null;
          icon_name?: string | null;
          id?: number;
          image_url?: string | null;
          is_active?: boolean | null;
          is_universal?: boolean | null;
          item_scale?: number | null;
          name: string;
          position_left?: number | null;
          position_top?: number | null;
          price?: number | null;
          rarity?: string;
          type: string;
          updated_at?: string | null;
          z_index?: number | null;
        };
        Update: {
          bg_class?: string | null;
          character_item_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          effect?: string | null;
          icon_bg?: string | null;
          icon_color?: string | null;
          icon_name?: string | null;
          id?: number;
          image_url?: string | null;
          is_active?: boolean | null;
          is_universal?: boolean | null;
          item_scale?: number | null;
          name?: string;
          position_left?: number | null;
          position_top?: number | null;
          price?: number | null;
          rarity?: string;
          type?: string;
          updated_at?: string | null;
          z_index?: number | null;
        };
        Relationships: [];
      };
      sim_credits: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          kind: string;
          note: string | null;
          profile_id: string;
          ref_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          kind: string;
          note?: string | null;
          profile_id: string;
          ref_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          kind?: string;
          note?: string | null;
          profile_id?: string;
          ref_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_credits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_credits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_credits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      sim_purchases: {
        Row: {
          category: string;
          created_at: string;
          day: number;
          id: string;
          item_key: string;
          payload: Json;
          price: number;
          profile_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          day: number;
          id?: string;
          item_key: string;
          payload: Json;
          price: number;
          profile_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          day?: number;
          id?: string;
          item_key?: string;
          payload?: Json;
          price?: number;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_purchases_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_purchases_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_purchases_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      sim_question_answers: {
        Row: {
          answer: string;
          created_at: string;
          day: number;
          id: string;
          profile_id: string;
          question_id: string;
        };
        Insert: {
          answer: string;
          created_at?: string;
          day: number;
          id?: string;
          profile_id: string;
          question_id: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          day?: number;
          id?: string;
          profile_id?: string;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_question_answers_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_question_answers_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_question_answers_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'sim_question_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: true;
            referencedRelation: 'sim_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      sim_questions: {
        Row: {
          created_at: string;
          day: number;
          id: string;
          profile_id: string;
          prompt: string;
        };
        Insert: {
          created_at?: string;
          day: number;
          id?: string;
          profile_id: string;
          prompt: string;
        };
        Update: {
          created_at?: string;
          day?: number;
          id?: string;
          profile_id?: string;
          prompt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_questions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_questions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_questions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      sim_student_agent: {
        Row: {
          agent_id: string;
          created_at: string;
          profile_id: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          profile_id: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_student_agent_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_student_agent_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_student_agent_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      sim_town_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          day: number;
          event_text: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          day: number;
          event_text: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          day?: number;
          event_text?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sim_town_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sim_town_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sim_town_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      smart_device_permissions: {
        Row: {
          can_control: boolean | null;
          created_at: string | null;
          granted_by: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          can_control?: boolean | null;
          created_at?: string | null;
          granted_by?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          can_control?: boolean | null;
          created_at?: string | null;
          granted_by?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      smart_devices: {
        Row: {
          created_at: string | null;
          device_id: string;
          device_type: string | null;
          id: string;
          is_active: boolean | null;
          label: string;
          meta: Json | null;
          resource_id: string | null;
          room_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_id: string;
          device_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
          meta?: Json | null;
          resource_id?: string | null;
          room_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_id?: string;
          device_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          meta?: Json | null;
          resource_id?: string | null;
          room_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'smart_devices_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'smart_devices_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'smart_devices_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'smart_devices_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      solution_comments: {
        Row: {
          author_email: string | null;
          author_nickname: string | null;
          content: string;
          created_at: string;
          id: string;
          solution_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author_email?: string | null;
          author_nickname?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          solution_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author_email?: string | null;
          author_nickname?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          solution_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'solution_comments_solution_id_fkey';
            columns: ['solution_id'];
            isOneToOne: false;
            referencedRelation: 'problem_solutions';
            referencedColumns: ['id'];
          },
        ];
      };
      srs_card_reviews: {
        Row: {
          card_id: string;
          ease_after: number;
          ease_before: number;
          id: string;
          interval_after: number;
          interval_before: number;
          quality: number;
          recall_time_ms: number | null;
          reviewed_at: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          ease_after: number;
          ease_before: number;
          id?: string;
          interval_after: number;
          interval_before: number;
          quality: number;
          recall_time_ms?: number | null;
          reviewed_at?: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          ease_after?: number;
          ease_before?: number;
          id?: string;
          interval_after?: number;
          interval_before?: number;
          quality?: number;
          recall_time_ms?: number | null;
          reviewed_at?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'srs_card_reviews_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'srs_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'srs_card_reviews_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'srs_review_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      srs_cards: {
        Row: {
          back: string;
          concept: string | null;
          created_at: string;
          ease_factor: number;
          front: string;
          id: string;
          interval_days: number;
          next_review_at: string | null;
          repetitions: number;
          source: string;
          status: string;
          subject_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          back: string;
          concept?: string | null;
          created_at?: string;
          ease_factor?: number;
          front: string;
          id?: string;
          interval_days?: number;
          next_review_at?: string | null;
          repetitions?: number;
          source?: string;
          status?: string;
          subject_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          back?: string;
          concept?: string | null;
          created_at?: string;
          ease_factor?: number;
          front?: string;
          id?: string;
          interval_days?: number;
          next_review_at?: string | null;
          repetitions?: number;
          source?: string;
          status?: string;
          subject_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'srs_cards_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'srs_subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      srs_daily_activity: {
        Row: {
          activity_date: string;
          cards_reviewed: number;
          id: string;
          retention_rate: number | null;
          time_seconds: number;
          user_id: string;
        };
        Insert: {
          activity_date: string;
          cards_reviewed?: number;
          id?: string;
          retention_rate?: number | null;
          time_seconds?: number;
          user_id: string;
        };
        Update: {
          activity_date?: string;
          cards_reviewed?: number;
          id?: string;
          retention_rate?: number | null;
          time_seconds?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      srs_review_sessions: {
        Row: {
          avg_recall_time_ms: number | null;
          cards_correct: number;
          cards_reviewed: number;
          ended_at: string | null;
          id: string;
          meta: Json | null;
          retention_gain: number | null;
          started_at: string;
          user_id: string;
        };
        Insert: {
          avg_recall_time_ms?: number | null;
          cards_correct?: number;
          cards_reviewed?: number;
          ended_at?: string | null;
          id?: string;
          meta?: Json | null;
          retention_gain?: number | null;
          started_at?: string;
          user_id: string;
        };
        Update: {
          avg_recall_time_ms?: number | null;
          cards_correct?: number;
          cards_reviewed?: number;
          ended_at?: string | null;
          id?: string;
          meta?: Json | null;
          retention_gain?: number | null;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      srs_subjects: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          review_interval_days: number;
          status: string;
          topic: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          review_interval_days?: number;
          status?: string;
          topic?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          review_interval_days?: number;
          status?: string;
          topic?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      srs_user_stats: {
        Row: {
          best_streak: number;
          created_at: string;
          current_streak: number;
          daily_goal: number;
          id: string;
          last_active_at: string | null;
          level: number;
          retention_rate: number | null;
          total_reviews: number;
          total_time_seconds: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          best_streak?: number;
          created_at?: string;
          current_streak?: number;
          daily_goal?: number;
          id?: string;
          last_active_at?: string | null;
          level?: number;
          retention_rate?: number | null;
          total_reviews?: number;
          total_time_seconds?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          best_streak?: number;
          created_at?: string;
          current_streak?: number;
          daily_goal?: number;
          id?: string;
          last_active_at?: string | null;
          level?: number;
          retention_rate?: number | null;
          total_reviews?: number;
          total_time_seconds?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      student_basic_info: {
        Row: {
          academic_development: Json | null;
          attendance: Json | null;
          class_num: number | null;
          created_at: string | null;
          grade: number | null;
          grade_info: Json | null;
          id: string;
          mock_marking: Json | null;
          mock_result: Json | null;
          name: string | null;
          number: number | null;
          reading: Json | null;
          section1_personal_info: Json | null;
          source: string | null;
          student_id: string | null;
          student_no: string | null;
          updated_at: string | null;
          volunteer: Json | null;
        };
        Insert: {
          academic_development?: Json | null;
          attendance?: Json | null;
          class_num?: number | null;
          created_at?: string | null;
          grade?: number | null;
          grade_info?: Json | null;
          id: string;
          mock_marking?: Json | null;
          mock_result?: Json | null;
          name?: string | null;
          number?: number | null;
          reading?: Json | null;
          section1_personal_info?: Json | null;
          source?: string | null;
          student_id?: string | null;
          student_no?: string | null;
          updated_at?: string | null;
          volunteer?: Json | null;
        };
        Update: {
          academic_development?: Json | null;
          attendance?: Json | null;
          class_num?: number | null;
          created_at?: string | null;
          grade?: number | null;
          grade_info?: Json | null;
          id?: string;
          mock_marking?: Json | null;
          mock_result?: Json | null;
          name?: string | null;
          number?: number | null;
          reading?: Json | null;
          section1_personal_info?: Json | null;
          source?: string | null;
          student_id?: string | null;
          student_no?: string | null;
          updated_at?: string | null;
          volunteer?: Json | null;
        };
        Relationships: [];
      };
      student_career_submissions: {
        Row: {
          assignment_name: string;
          board_name: string | null;
          collected_at: string | null;
          deadline: string | null;
          id: string;
          material_link_url: string | null;
          my_id: string;
          student_name: string | null;
          submission_datetime: string | null;
          teacher_in_charge: string | null;
          updated_at: string | null;
        };
        Insert: {
          assignment_name: string;
          board_name?: string | null;
          collected_at?: string | null;
          deadline?: string | null;
          id?: string;
          material_link_url?: string | null;
          my_id: string;
          student_name?: string | null;
          submission_datetime?: string | null;
          teacher_in_charge?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assignment_name?: string;
          board_name?: string | null;
          collected_at?: string | null;
          deadline?: string | null;
          id?: string;
          material_link_url?: string | null;
          my_id?: string;
          student_name?: string | null;
          submission_datetime?: string | null;
          teacher_in_charge?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      student_detailed_activities: {
        Row: {
          analysis: Json | null;
          category: string | null;
          content: string | null;
          created_at: string | null;
          data: Json | null;
          grade: number | null;
          id: string;
          semester: number | null;
          source: string | null;
          student_id: string | null;
          subject_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          analysis?: Json | null;
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          data?: Json | null;
          grade?: number | null;
          id?: string;
          semester?: number | null;
          source?: string | null;
          student_id?: string | null;
          subject_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          analysis?: Json | null;
          category?: string | null;
          content?: string | null;
          created_at?: string | null;
          data?: Json | null;
          grade?: number | null;
          id?: string;
          semester?: number | null;
          source?: string | null;
          student_id?: string | null;
          subject_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_detailed_activities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_enrollment: {
        Row: {
          academic_grade: number | null;
          academic_year: number;
          admission_year: number | null;
          classroom: string | null;
          course_offering_id: string | null;
          created_at: string;
          credits: number | null;
          curriculum_id: string | null;
          id: string;
          meta: Json;
          semester: number;
          student_class: string | null;
          student_grade: number | null;
          student_name: string;
          student_no: number | null;
          student_resource_id: string | null;
          subject_name: string;
          updated_at: string;
        };
        Insert: {
          academic_grade?: number | null;
          academic_year: number;
          admission_year?: number | null;
          classroom?: string | null;
          course_offering_id?: string | null;
          created_at?: string;
          credits?: number | null;
          curriculum_id?: string | null;
          id?: string;
          meta?: Json;
          semester: number;
          student_class?: string | null;
          student_grade?: number | null;
          student_name: string;
          student_no?: number | null;
          student_resource_id?: string | null;
          subject_name: string;
          updated_at?: string;
        };
        Update: {
          academic_grade?: number | null;
          academic_year?: number;
          admission_year?: number | null;
          classroom?: string | null;
          course_offering_id?: string | null;
          created_at?: string;
          credits?: number | null;
          curriculum_id?: string | null;
          id?: string;
          meta?: Json;
          semester?: number;
          student_class?: string | null;
          student_grade?: number | null;
          student_name?: string;
          student_no?: number | null;
          student_resource_id?: string | null;
          subject_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_enrollment_course_offering_id_fkey';
            columns: ['course_offering_id'];
            isOneToOne: false;
            referencedRelation: 'course_offering';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_enrollment_curriculum_id_fkey';
            columns: ['curriculum_id'];
            isOneToOne: false;
            referencedRelation: 'school_curriculum';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_enrollment_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_enrollment_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_enrollment_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_enrollment_student_resource_id_fkey';
            columns: ['student_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      student_inquiry_design_entities: {
        Row: {
          created_at: string;
          design_id: string;
          embedding: string | null;
          entity_id: string;
          id: string;
          label: string;
          properties: Json;
          student_id: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          design_id: string;
          embedding?: string | null;
          entity_id: string;
          id?: string;
          label: string;
          properties?: Json;
          student_id: string;
          type: string;
        };
        Update: {
          created_at?: string;
          design_id?: string;
          embedding?: string | null;
          entity_id?: string;
          id?: string;
          label?: string;
          properties?: Json;
          student_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_inquiry_design_entities_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'student_inquiry_designs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_inquiry_design_relations: {
        Row: {
          confidence: number | null;
          created_at: string;
          design_id: string;
          evidence: string | null;
          id: string;
          properties: Json;
          relation_type: string;
          source_entity_id: string;
          source_scope: string;
          student_id: string;
          target_entity_id: string;
          target_scope: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          design_id: string;
          evidence?: string | null;
          id?: string;
          properties?: Json;
          relation_type: string;
          source_entity_id: string;
          source_scope: string;
          student_id: string;
          target_entity_id: string;
          target_scope: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          design_id?: string;
          evidence?: string | null;
          id?: string;
          properties?: Json;
          relation_type?: string;
          source_entity_id?: string;
          source_scope?: string;
          student_id?: string;
          target_entity_id?: string;
          target_scope?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_inquiry_design_relations_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'student_inquiry_designs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_inquiry_design_sources: {
        Row: {
          activity_id: string | null;
          created_at: string;
          design_id: string;
          id: string;
          kg_version_id: string | null;
          snapshot: Json;
          source_entity_id: string | null;
          source_kind: string;
          source_relation_id: string | null;
          student_id: string;
        };
        Insert: {
          activity_id?: string | null;
          created_at?: string;
          design_id: string;
          id?: string;
          kg_version_id?: string | null;
          snapshot?: Json;
          source_entity_id?: string | null;
          source_kind: string;
          source_relation_id?: string | null;
          student_id: string;
        };
        Update: {
          activity_id?: string | null;
          created_at?: string;
          design_id?: string;
          id?: string;
          kg_version_id?: string | null;
          snapshot?: Json;
          source_entity_id?: string | null;
          source_kind?: string;
          source_relation_id?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_inquiry_design_sources_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'student_detailed_activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_design_id_fkey';
            columns: ['design_id'];
            isOneToOne: false;
            referencedRelation: 'student_inquiry_designs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_kg_version_id_fkey';
            columns: ['kg_version_id'];
            isOneToOne: false;
            referencedRelation: 'student_kg_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_source_relation_id_fkey';
            columns: ['source_relation_id'];
            isOneToOne: false;
            referencedRelation: 'student_kg_relations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_design_sources_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_inquiry_designs: {
        Row: {
          academic_year: number;
          created_at: string;
          created_by: string | null;
          grade: number;
          id: string;
          llm_result: Json | null;
          llm_token_usage: Json;
          observed_activity_id: string | null;
          observed_at: string | null;
          reflection: string | null;
          selected_source_snapshot: Json;
          semester: number | null;
          status: string;
          student_id: string;
          student_rationale: string;
          target_kind: string;
          target_name: string;
          target_ref: Json;
          title: string;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          created_at?: string;
          created_by?: string | null;
          grade: number;
          id?: string;
          llm_result?: Json | null;
          llm_token_usage?: Json;
          observed_activity_id?: string | null;
          observed_at?: string | null;
          reflection?: string | null;
          selected_source_snapshot?: Json;
          semester?: number | null;
          status?: string;
          student_id: string;
          student_rationale: string;
          target_kind: string;
          target_name: string;
          target_ref?: Json;
          title: string;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          created_at?: string;
          created_by?: string | null;
          grade?: number;
          id?: string;
          llm_result?: Json | null;
          llm_token_usage?: Json;
          observed_activity_id?: string | null;
          observed_at?: string | null;
          reflection?: string | null;
          selected_source_snapshot?: Json;
          semester?: number | null;
          status?: string;
          student_id?: string;
          student_rationale?: string;
          target_kind?: string;
          target_name?: string;
          target_ref?: Json;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_inquiry_designs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_observed_activity_id_fkey';
            columns: ['observed_activity_id'];
            isOneToOne: false;
            referencedRelation: 'student_detailed_activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_designs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_inquiry_recommendations: {
        Row: {
          ai_model: string | null;
          ai_provider: string | null;
          created_at: string;
          current_grade: number;
          enrolled_subjects: Json;
          formula_version: string;
          generated_at: string | null;
          hygiene_findings: Json;
          id: string;
          kg_version_id: string;
          metrics: Json;
          prepared_at: string;
          prepared_by: string | null;
          recommendations: Json | null;
          selected_anchor_subjects: Json | null;
          selected_weakness_ids: Json | null;
          student_id: string;
          token_usage: Json;
          updated_at: string;
          user_notes: string | null;
          weaknesses: Json;
        };
        Insert: {
          ai_model?: string | null;
          ai_provider?: string | null;
          created_at?: string;
          current_grade: number;
          enrolled_subjects?: Json;
          formula_version?: string;
          generated_at?: string | null;
          hygiene_findings?: Json;
          id?: string;
          kg_version_id: string;
          metrics: Json;
          prepared_at?: string;
          prepared_by?: string | null;
          recommendations?: Json | null;
          selected_anchor_subjects?: Json | null;
          selected_weakness_ids?: Json | null;
          student_id: string;
          token_usage?: Json;
          updated_at?: string;
          user_notes?: string | null;
          weaknesses: Json;
        };
        Update: {
          ai_model?: string | null;
          ai_provider?: string | null;
          created_at?: string;
          current_grade?: number;
          enrolled_subjects?: Json;
          formula_version?: string;
          generated_at?: string | null;
          hygiene_findings?: Json;
          id?: string;
          kg_version_id?: string;
          metrics?: Json;
          prepared_at?: string;
          prepared_by?: string | null;
          recommendations?: Json | null;
          selected_anchor_subjects?: Json | null;
          selected_weakness_ids?: Json | null;
          student_id?: string;
          token_usage?: Json;
          updated_at?: string;
          user_notes?: string | null;
          weaknesses?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'student_inquiry_recommendations_kg_version_id_fkey';
            columns: ['kg_version_id'];
            isOneToOne: false;
            referencedRelation: 'student_kg_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_prepared_by_fkey';
            columns: ['prepared_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_prepared_by_fkey';
            columns: ['prepared_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_prepared_by_fkey';
            columns: ['prepared_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_inquiry_recommendations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_kg_entities: {
        Row: {
          created_at: string;
          embedding: string | null;
          entity_id: string;
          id: string;
          kg_version_id: string;
          label: string;
          properties: Json | null;
          student_id: string;
          type: string | null;
        };
        Insert: {
          created_at?: string;
          embedding?: string | null;
          entity_id: string;
          id?: string;
          kg_version_id: string;
          label: string;
          properties?: Json | null;
          student_id: string;
          type?: string | null;
        };
        Update: {
          created_at?: string;
          embedding?: string | null;
          entity_id?: string;
          id?: string;
          kg_version_id?: string;
          label?: string;
          properties?: Json | null;
          student_id?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_kg_entities_kg_version_id_fkey';
            columns: ['kg_version_id'];
            isOneToOne: false;
            referencedRelation: 'student_kg_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_entities_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_kg_relations: {
        Row: {
          created_at: string;
          id: string;
          kg_version_id: string;
          properties: Json | null;
          relation_type: string;
          source_entity_id: string;
          student_id: string;
          target_entity_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kg_version_id: string;
          properties?: Json | null;
          relation_type: string;
          source_entity_id: string;
          student_id: string;
          target_entity_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kg_version_id?: string;
          properties?: Json | null;
          relation_type?: string;
          source_entity_id?: string;
          student_id?: string;
          target_entity_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_kg_relations_kg_version_id_fkey';
            columns: ['kg_version_id'];
            isOneToOne: false;
            referencedRelation: 'student_kg_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_relations_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_kg_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          kg_json: Json;
          source_categories: string[] | null;
          student_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kg_json: Json;
          source_categories?: string[] | null;
          student_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kg_json?: Json;
          source_categories?: string[] | null;
          student_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'student_kg_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'student_kg_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_academic_flat';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_basic_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_cross_domain_stats';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['student_code'];
          },
          {
            foreignKeyName: 'student_kg_versions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_mock_flat';
            referencedColumns: ['student_code'];
          },
        ];
      };
      student_puzzle_collection: {
        Row: {
          completed_at: string;
          event_id: string;
          id: string;
          student_id: string;
        };
        Insert: {
          completed_at?: string;
          event_id: string;
          id?: string;
          student_id: string;
        };
        Update: {
          completed_at?: string;
          event_id?: string;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_puzzle_collection_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'puzzle_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_puzzle_collection_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_puzzle_collection_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'student_puzzle_collection_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      student_puzzle_progress: {
        Row: {
          event_id: string;
          id: string;
          piece_index: number;
          student_id: string;
          unlocked_at: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          piece_index: number;
          student_id: string;
          unlocked_at?: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          piece_index?: number;
          student_id?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_puzzle_progress_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'puzzle_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_puzzle_progress_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_puzzle_progress_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'student_puzzle_progress_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      student_smart_device_log: {
        Row: {
          action: string | null;
          action_date: string | null;
          created_at: string | null;
          device_number: string;
          device_status: string | null;
          id: string;
          previous_enrollment_year: number | null;
          previous_user_name: string | null;
          processor: string | null;
          school: string | null;
          transfer_region: string | null;
          transfer_school: string | null;
        };
        Insert: {
          action?: string | null;
          action_date?: string | null;
          created_at?: string | null;
          device_number: string;
          device_status?: string | null;
          id?: string;
          previous_enrollment_year?: number | null;
          previous_user_name?: string | null;
          processor?: string | null;
          school?: string | null;
          transfer_region?: string | null;
          transfer_school?: string | null;
        };
        Update: {
          action?: string | null;
          action_date?: string | null;
          created_at?: string | null;
          device_number?: string;
          device_status?: string | null;
          id?: string;
          previous_enrollment_year?: number | null;
          previous_user_name?: string | null;
          processor?: string | null;
          school?: string | null;
          transfer_region?: string | null;
          transfer_school?: string | null;
        };
        Relationships: [];
      };
      student_timetable: {
        Row: {
          academic_year: number;
          course_offering_id: string | null;
          created_at: string;
          curriculum_id: string | null;
          day_of_week: number;
          id: string;
          meta: Json;
          period: number;
          resource_id: string;
          semester: number;
          student_class: number;
          student_grade: number;
          student_name: string;
          student_no: number;
          subject: string;
          teacher_name: string | null;
          teacher_resource_id: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          course_offering_id?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          day_of_week: number;
          id?: string;
          meta?: Json;
          period: number;
          resource_id: string;
          semester: number;
          student_class: number;
          student_grade: number;
          student_name: string;
          student_no: number;
          subject: string;
          teacher_name?: string | null;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          course_offering_id?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          day_of_week?: number;
          id?: string;
          meta?: Json;
          period?: number;
          resource_id?: string;
          semester?: number;
          student_class?: number;
          student_grade?: number;
          student_name?: string;
          student_no?: number;
          subject?: string;
          teacher_name?: string | null;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_timetable_course_offering_id_fkey';
            columns: ['course_offering_id'];
            isOneToOne: false;
            referencedRelation: 'course_offering';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_timetable_curriculum_id_fkey';
            columns: ['curriculum_id'];
            isOneToOne: false;
            referencedRelation: 'school_curriculum';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      study_rooms: {
        Row: {
          allow_duplicate_reservation: boolean | null;
          booking_end_date: string | null;
          booking_start_date: string | null;
          booking_windows: Json | null;
          created_at: string;
          day_period_mode: string | null;
          fixed_end_date: string | null;
          fixed_start_date: string | null;
          grade: number;
          grades: number[] | null;
          id: string;
          is_active: boolean;
          is_saturday_open: boolean | null;
          is_sunday_open: boolean | null;
          is_sungong: boolean;
          name: string;
          operating_days: number[] | null;
          operating_periods: Json | null;
          period_booking_mode: string | null;
          reservation_mode: string | null;
          rules: string | null;
          seat_layout: Json;
          total_seats: number;
          updated_at: string;
          use_periods: boolean | null;
        };
        Insert: {
          allow_duplicate_reservation?: boolean | null;
          booking_end_date?: string | null;
          booking_start_date?: string | null;
          booking_windows?: Json | null;
          created_at?: string;
          day_period_mode?: string | null;
          fixed_end_date?: string | null;
          fixed_start_date?: string | null;
          grade: number;
          grades?: number[] | null;
          id?: string;
          is_active?: boolean;
          is_saturday_open?: boolean | null;
          is_sunday_open?: boolean | null;
          is_sungong?: boolean;
          name: string;
          operating_days?: number[] | null;
          operating_periods?: Json | null;
          period_booking_mode?: string | null;
          reservation_mode?: string | null;
          rules?: string | null;
          seat_layout?: Json;
          total_seats: number;
          updated_at?: string;
          use_periods?: boolean | null;
        };
        Update: {
          allow_duplicate_reservation?: boolean | null;
          booking_end_date?: string | null;
          booking_start_date?: string | null;
          booking_windows?: Json | null;
          created_at?: string;
          day_period_mode?: string | null;
          fixed_end_date?: string | null;
          fixed_start_date?: string | null;
          grade?: number;
          grades?: number[] | null;
          id?: string;
          is_active?: boolean;
          is_saturday_open?: boolean | null;
          is_sunday_open?: boolean | null;
          is_sungong?: boolean;
          name?: string;
          operating_days?: number[] | null;
          operating_periods?: Json | null;
          period_booking_mode?: string | null;
          reservation_mode?: string | null;
          rules?: string | null;
          seat_layout?: Json;
          total_seats?: number;
          updated_at?: string;
          use_periods?: boolean | null;
        };
        Relationships: [];
      };
      subject_achievement_standards: {
        Row: {
          created_at: string;
          curriculum_year: number | null;
          description: string;
          domain: string;
          id: string;
          level: string | null;
          meta: Json | null;
          standard_code: string;
          subdomain: string | null;
          subject: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          curriculum_year?: number | null;
          description: string;
          domain: string;
          id?: string;
          level?: string | null;
          meta?: Json | null;
          standard_code: string;
          subdomain?: string | null;
          subject: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          curriculum_year?: number | null;
          description?: string;
          domain?: string;
          id?: string;
          level?: string | null;
          meta?: Json | null;
          standard_code?: string;
          subdomain?: string | null;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sungong_students: {
        Row: {
          created_at: string;
          grade: number;
          id: string;
          remedial_subject: string | null;
          room_id: string | null;
          student_id: string;
          updated_at: string;
          zone: string;
        };
        Insert: {
          created_at?: string;
          grade: number;
          id?: string;
          remedial_subject?: string | null;
          room_id?: string | null;
          student_id: string;
          updated_at?: string;
          zone?: string;
        };
        Update: {
          created_at?: string;
          grade?: number;
          id?: string;
          remedial_subject?: string | null;
          room_id?: string | null;
          student_id?: string;
          updated_at?: string;
          zone?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sungong_students_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'study_rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sungong_students_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sungong_students_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'sungong_students_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
        ];
      };
      system_settings: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      task: {
        Row: {
          assigned_to: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          event_id: string;
          id: string;
          keywords: string[] | null;
          meta: Json | null;
          order_index: number | null;
          status: string;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          event_id: string;
          id?: string;
          keywords?: string[] | null;
          meta?: Json | null;
          order_index?: number | null;
          status?: string;
          title: string;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          event_id?: string;
          id?: string;
          keywords?: string[] | null;
          meta?: Json | null;
          order_index?: number | null;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_event';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_task_assigned_to';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_task_assigned_to';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_task_assigned_to';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_task_assigned_to';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'task_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'task_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'task_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      task_document_analysis: {
        Row: {
          analysis_result: Json;
          applied_at: string | null;
          applied_event_id: string | null;
          created_at: string;
          created_by: string;
          document_key: string;
          file_name: string;
          file_sha256: string;
          file_size: number;
          format: string;
          id: string;
          mime_type: string;
          model: string;
          parser_version: string;
          prompt_version: string;
          revision_of: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          analysis_result: Json;
          applied_at?: string | null;
          applied_event_id?: string | null;
          created_at?: string;
          created_by: string;
          document_key: string;
          file_name: string;
          file_sha256: string;
          file_size: number;
          format: string;
          id?: string;
          mime_type?: string;
          model: string;
          parser_version: string;
          prompt_version: string;
          revision_of?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          analysis_result?: Json;
          applied_at?: string | null;
          applied_event_id?: string | null;
          created_at?: string;
          created_by?: string;
          document_key?: string;
          file_name?: string;
          file_sha256?: string;
          file_size?: number;
          format?: string;
          id?: string;
          mime_type?: string;
          model?: string;
          parser_version?: string;
          prompt_version?: string;
          revision_of?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_document_analysis_applied_event_id_fkey';
            columns: ['applied_event_id'];
            isOneToOne: false;
            referencedRelation: 'event';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_document_analysis_revision_of_fkey';
            columns: ['revision_of'];
            isOneToOne: false;
            referencedRelation: 'task_document_analysis';
            referencedColumns: ['id'];
          },
        ];
      };
      task_document_analysis_decision: {
        Row: {
          analysis_id: string;
          candidate_local_id: string;
          created_at: string;
          created_task_id: string | null;
          decided_by: string;
          decision: string;
          id: string;
          linked_event_id: string | null;
          linked_task_id: string | null;
          updated_at: string;
        };
        Insert: {
          analysis_id: string;
          candidate_local_id: string;
          created_at?: string;
          created_task_id?: string | null;
          decided_by: string;
          decision: string;
          id?: string;
          linked_event_id?: string | null;
          linked_task_id?: string | null;
          updated_at?: string;
        };
        Update: {
          analysis_id?: string;
          candidate_local_id?: string;
          created_at?: string;
          created_task_id?: string | null;
          decided_by?: string;
          decision?: string;
          id?: string;
          linked_event_id?: string | null;
          linked_task_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_document_analysis_decision_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'task_document_analysis';
            referencedColumns: ['id'];
          },
        ];
      };
      task_feedback: {
        Row: {
          comment: string | null;
          created_at: string | null;
          difficulty: string | null;
          distractions: string[] | null;
          focus_minutes: number | null;
          id: string;
          satisfaction: number | null;
          task_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          difficulty?: string | null;
          distractions?: string[] | null;
          focus_minutes?: number | null;
          id?: string;
          satisfaction?: number | null;
          task_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          difficulty?: string | null;
          distractions?: string[] | null;
          focus_minutes?: number | null;
          id?: string;
          satisfaction?: number | null;
          task_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_feedback_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      task_status_history: {
        Row: {
          changed_at: string | null;
          changed_by: string;
          comment: string | null;
          id: string;
          new_status: string;
          old_status: string | null;
          task_id: string;
        };
        Insert: {
          changed_at?: string | null;
          changed_by: string;
          comment?: string | null;
          id?: string;
          new_status: string;
          old_status?: string | null;
          task_id: string;
        };
        Update: {
          changed_at?: string | null;
          changed_by?: string;
          comment?: string | null;
          id?: string;
          new_status?: string;
          old_status?: string | null;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_task_status_task';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'task';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_task_status_user';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_task_status_user';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_task_status_user';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_task_status_user';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      task_work: {
        Row: {
          archived_at: string | null;
          config: Json;
          created_at: string;
          created_by: string;
          description: string | null;
          execution_mode: string;
          handler_version: number;
          id: string;
          is_required: boolean;
          task_id: string;
          title: string;
          updated_at: string;
          verification_mode: string;
          work_type: string;
        };
        Insert: {
          archived_at?: string | null;
          config?: Json;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          execution_mode?: string;
          handler_version?: number;
          id?: string;
          is_required?: boolean;
          task_id: string;
          title: string;
          updated_at?: string;
          verification_mode?: string;
          work_type: string;
        };
        Update: {
          archived_at?: string | null;
          config?: Json;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          execution_mode?: string;
          handler_version?: number;
          id?: string;
          is_required?: boolean;
          task_id?: string;
          title?: string;
          updated_at?: string;
          verification_mode?: string;
          work_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'task';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_artifact: {
        Row: {
          artifact_key: string;
          artifact_type: string;
          content_sha256: string | null;
          created_at: string;
          created_by: string;
          id: string;
          label: string;
          locator: Json;
          metadata: Json;
          mime_type: string | null;
          run_id: string;
          size_bytes: number | null;
        };
        Insert: {
          artifact_key: string;
          artifact_type: string;
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          label: string;
          locator?: Json;
          metadata?: Json;
          mime_type?: string | null;
          run_id: string;
          size_bytes?: number | null;
        };
        Update: {
          artifact_key?: string;
          artifact_type?: string;
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          label?: string;
          locator?: Json;
          metadata?: Json;
          mime_type?: string | null;
          run_id?: string;
          size_bytes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_artifact_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_run';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_check: {
        Row: {
          check_key: string;
          created_at: string;
          created_by: string;
          evidence: Json;
          id: string;
          label: string;
          message: string | null;
          run_id: string;
          status: string;
        };
        Insert: {
          check_key: string;
          created_at?: string;
          created_by?: string;
          evidence?: Json;
          id?: string;
          label: string;
          message?: string | null;
          run_id: string;
          status: string;
        };
        Update: {
          check_key?: string;
          created_at?: string;
          created_by?: string;
          evidence?: Json;
          id?: string;
          label?: string;
          message?: string | null;
          run_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_check_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_run';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_document: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string;
          family_id: string;
          field_values: Json;
          id: string;
          knowledge: Json;
          plan: Json;
          previous_version_id: string | null;
          row_values: Json;
          status: string;
          template_version_id: string;
          title: string;
          updated_at: string;
          user_context: string | null;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string;
          family_id: string;
          field_values?: Json;
          id?: string;
          knowledge?: Json;
          plan?: Json;
          previous_version_id?: string | null;
          row_values?: Json;
          status?: string;
          template_version_id: string;
          title: string;
          updated_at?: string;
          user_context?: string | null;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string;
          family_id?: string;
          field_values?: Json;
          id?: string;
          knowledge?: Json;
          plan?: Json;
          previous_version_id?: string | null;
          row_values?: Json;
          status?: string;
          template_version_id?: string;
          title?: string;
          updated_at?: string;
          user_context?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_document_family_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_document';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_work_document_previous_version_fkey';
            columns: ['previous_version_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_document';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_work_document_template_version_id_fkey';
            columns: ['template_version_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_document_template';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_document_template: {
        Row: {
          archived_at: string | null;
          content_sha256: string;
          created_at: string;
          created_by: string;
          description: string | null;
          family_id: string;
          fields: Json;
          format: string;
          id: string;
          mime_type: string;
          name: string;
          previous_version_id: string | null;
          size_bytes: number;
          source_file_name: string;
          spec: Json | null;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          content_sha256: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          family_id: string;
          fields?: Json;
          format?: string;
          id?: string;
          mime_type?: string;
          name: string;
          previous_version_id?: string | null;
          size_bytes: number;
          source_file_name: string;
          spec?: Json | null;
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          content_sha256?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          family_id?: string;
          fields?: Json;
          format?: string;
          id?: string;
          mime_type?: string;
          name?: string;
          previous_version_id?: string | null;
          size_bytes?: number;
          source_file_name?: string;
          spec?: Json | null;
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_document_template_family_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_document_template';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_work_document_template_previous_version_fkey';
            columns: ['previous_version_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_document_template';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_review: {
        Row: {
          comment: string | null;
          created_at: string;
          decision: string;
          id: string;
          reviewer_id: string;
          run_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          decision: string;
          id?: string;
          reviewer_id?: string;
          run_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          decision?: string;
          id?: string;
          reviewer_id?: string;
          run_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_review_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: true;
            referencedRelation: 'task_work_run';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_run: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string;
          error_summary: string | null;
          id: string;
          idempotency_key: string;
          input_snapshot: Json;
          output_summary: Json;
          started_at: string;
          status: string;
          updated_at: string;
          work_id: string;
          workflow_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          error_summary?: string | null;
          id?: string;
          idempotency_key: string;
          input_snapshot?: Json;
          output_summary?: Json;
          started_at?: string;
          status?: string;
          updated_at?: string;
          work_id: string;
          workflow_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          error_summary?: string | null;
          id?: string;
          idempotency_key?: string;
          input_snapshot?: Json;
          output_summary?: Json;
          started_at?: string;
          status?: string;
          updated_at?: string;
          work_id?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_run_work_id_fkey';
            columns: ['work_id'];
            isOneToOne: false;
            referencedRelation: 'task_work';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_work_run_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'task_workflow';
            referencedColumns: ['id'];
          },
        ];
      };
      task_work_run_event: {
        Row: {
          created_at: string;
          created_by: string;
          event_type: string;
          from_status: string | null;
          id: string;
          payload: Json;
          run_id: string;
          sequence_no: number;
          to_status: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          event_type: string;
          from_status?: string | null;
          id?: string;
          payload?: Json;
          run_id: string;
          sequence_no: number;
          to_status: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          event_type?: string;
          from_status?: string | null;
          id?: string;
          payload?: Json;
          run_id?: string;
          sequence_no?: number;
          to_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_work_run_event_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: false;
            referencedRelation: 'task_work_run';
            referencedColumns: ['id'];
          },
        ];
      };
      task_workflow: {
        Row: {
          created_at: string;
          department_id: string | null;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
          viewport: Json;
        };
        Insert: {
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          owner_id?: string;
          updated_at?: string;
          viewport?: Json;
        };
        Update: {
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
          viewport?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'task_workflow_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'department';
            referencedColumns: ['id'];
          },
        ];
      };
      task_workflow_edge: {
        Row: {
          created_at: string;
          id: string;
          label: string | null;
          metadata: Json;
          relation_type: string;
          source_node_id: string;
          target_node_id: string;
          updated_at: string;
          workflow_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label?: string | null;
          metadata?: Json;
          relation_type?: string;
          source_node_id: string;
          target_node_id: string;
          updated_at?: string;
          workflow_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string | null;
          metadata?: Json;
          relation_type?: string;
          source_node_id?: string;
          target_node_id?: string;
          updated_at?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_workflow_edge_source_fkey';
            columns: ['workflow_id', 'source_node_id'];
            isOneToOne: false;
            referencedRelation: 'task_workflow_node';
            referencedColumns: ['workflow_id', 'id'];
          },
          {
            foreignKeyName: 'task_workflow_edge_target_fkey';
            columns: ['workflow_id', 'target_node_id'];
            isOneToOne: false;
            referencedRelation: 'task_workflow_node';
            referencedColumns: ['workflow_id', 'id'];
          },
          {
            foreignKeyName: 'task_workflow_edge_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'task_workflow';
            referencedColumns: ['id'];
          },
        ];
      };
      task_workflow_node: {
        Row: {
          created_at: string;
          event_id: string | null;
          id: string;
          label: string;
          metadata: Json;
          node_kind: string;
          position_x: number;
          position_y: number;
          task_id: string | null;
          updated_at: string;
          workflow_id: string;
        };
        Insert: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          label: string;
          metadata?: Json;
          node_kind: string;
          position_x?: number;
          position_y?: number;
          task_id?: string | null;
          updated_at?: string;
          workflow_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          label?: string;
          metadata?: Json;
          node_kind?: string;
          position_x?: number;
          position_y?: number;
          task_id?: string | null;
          updated_at?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_workflow_node_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_workflow_node_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'task';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_workflow_node_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'task_workflow';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          completed: boolean;
          created_at: string;
          end_time: string | null;
          id: string;
          memo: string | null;
          order: number | null;
          priority: string | null;
          related_goal_id: string | null;
          related_sub_goal: string | null;
          start_time: string | null;
          task_date: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          end_time?: string | null;
          id?: string;
          memo?: string | null;
          order?: number | null;
          priority?: string | null;
          related_goal_id?: string | null;
          related_sub_goal?: string | null;
          start_time?: string | null;
          task_date: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          end_time?: string | null;
          id?: string;
          memo?: string | null;
          order?: number | null;
          priority?: string | null;
          related_goal_id?: string | null;
          related_sub_goal?: string | null;
          start_time?: string | null;
          task_date?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_related_goal_id_fkey';
            columns: ['related_goal_id'];
            isOneToOne: false;
            referencedRelation: 'user_goals';
            referencedColumns: ['id'];
          },
        ];
      };
      teacher_memo: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          memo_date: string;
          period: number;
          resource_id: string;
          updated_at: string;
        };
        Insert: {
          content?: string;
          created_at?: string;
          id?: string;
          memo_date: string;
          period: number;
          resource_id: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          memo_date?: string;
          period?: number;
          resource_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teacher_memo_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teacher_memo_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'teacher_memo_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'teacher_memo_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      teacher_observations: {
        Row: {
          content: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          observer_name: string | null;
          student_id: string;
          student_name: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          observer_name?: string | null;
          student_id: string;
          student_name?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          observer_name?: string | null;
          student_id?: string;
          student_name?: string | null;
        };
        Relationships: [];
      };
      teacher_timetable: {
        Row: {
          academic_year: number;
          activity_type: string | null;
          class_label: string | null;
          course_offering_id: string | null;
          created_at: string;
          credits: number | null;
          day_of_week: number;
          grade: number;
          id: string;
          meta: Json;
          period: number;
          school_curriculum_id: string | null;
          semester: number;
          subject_name: string;
          teacher_name: string;
          teacher_resource_id: string | null;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          activity_type?: string | null;
          class_label?: string | null;
          course_offering_id?: string | null;
          created_at?: string;
          credits?: number | null;
          day_of_week: number;
          grade: number;
          id?: string;
          meta?: Json;
          period: number;
          school_curriculum_id?: string | null;
          semester: number;
          subject_name: string;
          teacher_name: string;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          activity_type?: string | null;
          class_label?: string | null;
          course_offering_id?: string | null;
          created_at?: string;
          credits?: number | null;
          day_of_week?: number;
          grade?: number;
          id?: string;
          meta?: Json;
          period?: number;
          school_curriculum_id?: string | null;
          semester?: number;
          subject_name?: string;
          teacher_name?: string;
          teacher_resource_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teacher_timetable_course_offering_id_fkey';
            columns: ['course_offering_id'];
            isOneToOne: false;
            referencedRelation: 'course_offering';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teacher_timetable_school_curriculum_id_fkey';
            columns: ['school_curriculum_id'];
            isOneToOne: false;
            referencedRelation: 'school_curriculum';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teacher_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teacher_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'teacher_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'teacher_timetable_teacher_resource_id_fkey';
            columns: ['teacher_resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      timetable_plan: {
        Row: {
          academic_year: number;
          candidates: Json;
          created_at: string;
          created_by: string | null;
          diagnostics: Json | null;
          finalized_placements: Json | null;
          id: string;
          input_payload: Json;
          selected_candidate_id: string | null;
          semester: number;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          candidates?: Json;
          created_at?: string;
          created_by?: string | null;
          diagnostics?: Json | null;
          finalized_placements?: Json | null;
          id?: string;
          input_payload?: Json;
          selected_candidate_id?: string | null;
          semester: number;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          candidates?: Json;
          created_at?: string;
          created_by?: string | null;
          diagnostics?: Json | null;
          finalized_placements?: Json | null;
          id?: string;
          input_payload?: Json;
          selected_candidate_id?: string | null;
          semester?: number;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_certificates: {
        Row: {
          certificate_number: string | null;
          completed_at: string;
          created_at: string;
          file_mime: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          hours: number;
          id: string;
          memo: string | null;
          organization: string;
          resource_id: string;
          submitted_at: string;
          title: string;
          training_type_id: string;
          updated_at: string;
        };
        Insert: {
          certificate_number?: string | null;
          completed_at: string;
          created_at?: string;
          file_mime?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          hours: number;
          id?: string;
          memo?: string | null;
          organization: string;
          resource_id: string;
          submitted_at?: string;
          title: string;
          training_type_id: string;
          updated_at?: string;
        };
        Update: {
          certificate_number?: string | null;
          completed_at?: string;
          created_at?: string;
          file_mime?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          hours?: number;
          id?: string;
          memo?: string | null;
          organization?: string;
          resource_id?: string;
          submitted_at?: string;
          title?: string;
          training_type_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'training_certificates_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_certificates_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'training_certificates_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'training_certificates_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'training_certificates_training_type_id_fkey';
            columns: ['training_type_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['training_type_id'];
          },
          {
            foreignKeyName: 'training_certificates_training_type_id_fkey';
            columns: ['training_type_id'];
            isOneToOne: false;
            referencedRelation: 'training_types';
            referencedColumns: ['id'];
          },
        ];
      };
      training_types: {
        Row: {
          category: string;
          category_label: string;
          code: string;
          created_at: string;
          cycle: string | null;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          required_hours: number;
          unit: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          category: string;
          category_label: string;
          code: string;
          created_at?: string;
          cycle?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          required_hours?: number;
          unit?: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          category?: string;
          category_label?: string;
          code?: string;
          created_at?: string;
          cycle?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          required_hours?: number;
          unit?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      univ_admissions: {
        Row: {
          additional_accepted: number | null;
          admission_category: string | null;
          admission_period: string;
          admission_type: string | null;
          applicants: number | null;
          competition_rate: number | null;
          converted_score: number | null;
          created_at: string | null;
          csat_percentile: number | null;
          department: string;
          gpa_cutoff: number | null;
          id: string;
          korean_score: number | null;
          math_score: number | null;
          max_score: number | null;
          quota: number | null;
          region: string;
          science_score: number | null;
          seq: number;
          university_name: string;
          year: number;
        };
        Insert: {
          additional_accepted?: number | null;
          admission_category?: string | null;
          admission_period: string;
          admission_type?: string | null;
          applicants?: number | null;
          competition_rate?: number | null;
          converted_score?: number | null;
          created_at?: string | null;
          csat_percentile?: number | null;
          department: string;
          gpa_cutoff?: number | null;
          id?: string;
          korean_score?: number | null;
          math_score?: number | null;
          max_score?: number | null;
          quota?: number | null;
          region: string;
          science_score?: number | null;
          seq?: number;
          university_name: string;
          year: number;
        };
        Update: {
          additional_accepted?: number | null;
          admission_category?: string | null;
          admission_period?: string;
          admission_type?: string | null;
          applicants?: number | null;
          competition_rate?: number | null;
          converted_score?: number | null;
          created_at?: string | null;
          csat_percentile?: number | null;
          department?: string;
          gpa_cutoff?: number | null;
          id?: string;
          korean_score?: number | null;
          math_score?: number | null;
          max_score?: number | null;
          quota?: number | null;
          region?: string;
          science_score?: number | null;
          seq?: number;
          university_name?: string;
          year?: number;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          completed_at: string | null;
          created_at: string;
          current_progress: number;
          id: string;
          is_completed: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number;
          id?: string;
          is_completed?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number;
          id?: string;
          is_completed?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
        ];
      };
      user_goals: {
        Row: {
          completed_at: string | null;
          completion_status: string | null;
          continent_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          is_completed: boolean;
          position_q: number | null;
          position_r: number | null;
          position_x: number;
          position_y: number;
          priority: string | null;
          sub_goals: string[] | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completion_status?: string | null;
          continent_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          is_completed?: boolean;
          position_q?: number | null;
          position_r?: number | null;
          position_x?: number;
          position_y?: number;
          priority?: string | null;
          sub_goals?: string[] | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completion_status?: string | null;
          continent_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          is_completed?: boolean;
          position_q?: number | null;
          position_r?: number | null;
          position_x?: number;
          position_y?: number;
          priority?: string | null;
          sub_goals?: string[] | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_goals_continent_id_fkey';
            columns: ['continent_id'];
            isOneToOne: false;
            referencedRelation: 'continents';
            referencedColumns: ['id'];
          },
        ];
      };
      user_items: {
        Row: {
          id: string;
          is_equipped: boolean;
          item_id: number;
          item_type: string;
          purchased_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          is_equipped?: boolean;
          item_id: number;
          item_type: string;
          purchased_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          is_equipped?: boolean;
          item_id?: number;
          item_type?: string;
          purchased_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_privacy_consents: {
        Row: {
          accepted_at: string;
          age_requirement_confirmed: boolean;
          id: string;
          policy_version: string;
          required_policy_accepted: boolean;
          student_record_notice_confirmed: boolean;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          age_requirement_confirmed: boolean;
          id?: string;
          policy_version: string;
          required_policy_accepted: boolean;
          student_record_notice_confirmed: boolean;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          age_requirement_confirmed?: boolean;
          id?: string;
          policy_version?: string;
          required_policy_accepted?: boolean;
          student_record_notice_confirmed?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_privacy_consents_policy_version_fkey';
            columns: ['policy_version'];
            isOneToOne: false;
            referencedRelation: 'privacy_policy_versions';
            referencedColumns: ['version'];
          },
        ];
      };
      user_problem_attempts: {
        Row: {
          attempted: boolean;
          created_at: string;
          id: string;
          problem_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempted?: boolean;
          created_at?: string;
          id?: string;
          problem_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempted?: boolean;
          created_at?: string;
          id?: string;
          problem_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_problem_helps: {
        Row: {
          created_at: string;
          id: string;
          problem_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          problem_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          problem_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_problem_helps_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      user_problem_likes: {
        Row: {
          created_at: string;
          id: string;
          problem_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          problem_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          problem_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_problem_likes_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      user_problem_saves: {
        Row: {
          created_at: string;
          id: string;
          problem_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          problem_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          problem_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_problem_saves_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      user_resource: {
        Row: {
          created_at: string;
          resource_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          resource_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          resource_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_resource_resource_id';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_resource_resource_id';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_user_resource_resource_id';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_user_resource_resource_id';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'fk_user_resource_user_id';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_resource_user_id';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'fk_user_resource_user_id';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'temperature_rankings_mv';
            referencedColumns: ['student_id'];
          },
          {
            foreignKeyName: 'user_resource_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_resource_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'user_resource_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'user_resource_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          current_background: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_background?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_background?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_solution_likes: {
        Row: {
          created_at: string;
          id: string;
          solution_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          solution_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          solution_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_solution_likes_solution_id_fkey';
            columns: ['solution_id'];
            isOneToOne: false;
            referencedRelation: 'problem_solutions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_stats: {
        Row: {
          coins: number;
          created_at: string;
          exp: number;
          hp: number;
          id: string;
          level: number;
          mp: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          coins?: number;
          created_at?: string;
          exp?: number;
          hp?: number;
          id?: string;
          level?: number;
          mp?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          coins?: number;
          created_at?: string;
          exp?: number;
          hp?: number;
          id?: string;
          level?: number;
          mp?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      video_likes: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_likes_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'educational_videos';
            referencedColumns: ['id'];
          },
        ];
      };
      waiting_queue: {
        Row: {
          created_at: string;
          id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      youtube_jobs: {
        Row: {
          attempt_count: number | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          max_attempts: number | null;
          next_retry_at: string | null;
          started_at: string | null;
          status: string;
          summary_id: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          attempt_count?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          started_at?: string | null;
          status?: string;
          summary_id: string;
          user_id: string;
          video_id: string;
        };
        Update: {
          attempt_count?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          started_at?: string | null;
          status?: string;
          summary_id?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'youtube_jobs_summary_id_fkey';
            columns: ['summary_id'];
            isOneToOne: false;
            referencedRelation: 'youtube_summaries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'youtube_jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'youtube_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      youtube_playlists: {
        Row: {
          cached_at: string;
          channel_title: string | null;
          created_at: string;
          description: string | null;
          id: string;
          playlist_id: string;
          thumbnail_url: string | null;
          title: string | null;
          user_id: string;
          video_count: number | null;
        };
        Insert: {
          cached_at?: string;
          channel_title?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          playlist_id: string;
          thumbnail_url?: string | null;
          title?: string | null;
          user_id: string;
          video_count?: number | null;
        };
        Update: {
          cached_at?: string;
          channel_title?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          playlist_id?: string;
          thumbnail_url?: string | null;
          title?: string | null;
          user_id?: string;
          video_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'youtube_playlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'youtube_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      youtube_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          quota_reset_at: string | null;
          token_expires_at: string | null;
          token_refresh_failures: number | null;
          updated_at: string;
          youtube_quota_used: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          quota_reset_at?: string | null;
          token_expires_at?: string | null;
          token_refresh_failures?: number | null;
          updated_at?: string;
          youtube_quota_used?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          quota_reset_at?: string | null;
          token_expires_at?: string | null;
          token_refresh_failures?: number | null;
          updated_at?: string;
          youtube_quota_used?: number | null;
        };
        Relationships: [];
      };
      youtube_settings: {
        Row: {
          auto_generate_questions: boolean | null;
          created_at: string;
          notifications_enabled: boolean | null;
          summary_depth: string | null;
          summary_language: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_generate_questions?: boolean | null;
          created_at?: string;
          notifications_enabled?: boolean | null;
          summary_depth?: string | null;
          summary_language?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_generate_questions?: boolean | null;
          created_at?: string;
          notifications_enabled?: boolean | null;
          summary_depth?: string | null;
          summary_language?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'youtube_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'youtube_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      youtube_summaries: {
        Row: {
          channel_name: string | null;
          created_at: string;
          duration: number | null;
          error_message: string | null;
          id: string;
          input_tokens: number | null;
          model_used: string | null;
          output_tokens: number | null;
          playlist_id: string | null;
          retry_count: number | null;
          status: string;
          summary: Json | null;
          transcript_text: string | null;
          updated_at: string;
          user_id: string;
          video_id: string;
          video_thumbnail: string | null;
          video_title: string | null;
        };
        Insert: {
          channel_name?: string | null;
          created_at?: string;
          duration?: number | null;
          error_message?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_used?: string | null;
          output_tokens?: number | null;
          playlist_id?: string | null;
          retry_count?: number | null;
          status?: string;
          summary?: Json | null;
          transcript_text?: string | null;
          updated_at?: string;
          user_id: string;
          video_id: string;
          video_thumbnail?: string | null;
          video_title?: string | null;
        };
        Update: {
          channel_name?: string | null;
          created_at?: string;
          duration?: number | null;
          error_message?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_used?: string | null;
          output_tokens?: number | null;
          playlist_id?: string | null;
          retry_count?: number | null;
          status?: string;
          summary?: Json | null;
          transcript_text?: string | null;
          updated_at?: string;
          user_id?: string;
          video_id?: string;
          video_thumbnail?: string | null;
          video_title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'youtube_summaries_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'youtube_playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'youtube_summaries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'youtube_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      youtube_transcripts: {
        Row: {
          expires_at: string;
          fetched_at: string;
          language: string | null;
          source: string;
          transcript_text: string;
          video_id: string;
        };
        Insert: {
          expires_at?: string;
          fetched_at?: string;
          language?: string | null;
          source?: string;
          transcript_text: string;
          video_id: string;
        };
        Update: {
          expires_at?: string;
          fetched_at?: string;
          language?: string | null;
          source?: string;
          transcript_text?: string;
          video_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      course_selection_round_for_grade: {
        Row: {
          academic_year: number | null;
          capacity_overrides: Json | null;
          closes_at: string | null;
          created_at: string | null;
          description: string | null;
          effective_grade: number | null;
          id: string | null;
          meta: Json | null;
          opens_at: string | null;
          round_number: number | null;
          status: string | null;
          target_grade: number | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      course_selection_slot_capacity: {
        Row: {
          capacity: number | null;
          enrolled: number | null;
          group_id: string | null;
          round_id: string | null;
          selectable_subject_id: string | null;
          semester: number | null;
          slot_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_selection_group_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_group_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_round_for_grade';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_slot_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'course_selection_group';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_selection_slot_subject_selectable_subject_id_fkey';
            columns: ['selectable_subject_id'];
            isOneToOne: false;
            referencedRelation: 'course_selectable_subject';
            referencedColumns: ['id'];
          },
        ];
      };
      ipsi_hub_feed: {
        Row: {
          academic_year: string | null;
          analysis_status: string | null;
          analyzed_at: string | null;
          category: string | null;
          cautions: string[] | null;
          channel_label: string | null;
          core_points: string[] | null;
          created_at: string | null;
          created_by: string | null;
          data_points: string[] | null;
          duration_seconds: number | null;
          headline_summary: string | null;
          id: string | null;
          kind: string | null;
          likes: number | null;
          meta: Json | null;
          sort_date: string | null;
          source: string | null;
          strategy_implications: string[] | null;
          thumbnail: string | null;
          title: string | null;
          url: string | null;
        };
        Relationships: [];
      };
      mock_school_stats: {
        Row: {
          answer_distribution: Json | null;
          correct_count: number | null;
          month: number | null;
          national_correct_rate: number | null;
          problem_number: number | null;
          school_correct_rate: number | null;
          student_grade: number | null;
          subject: string | null;
          total_students: number | null;
          year: number | null;
        };
        Relationships: [];
      };
      student_academic_flat: {
        Row: {
          achievement: string | null;
          average: number | null;
          category: string | null;
          content: string | null;
          grade: number | null;
          name: string | null;
          rank: number | null;
          score: number | null;
          semester: number | null;
          std_dev: number | null;
          student_code: string | null;
          students_in_class: number | null;
          subject: string | null;
          subject_group: string | null;
          units: number | null;
        };
        Relationships: [];
      };
      student_cross_domain_stats: {
        Row: {
          academic_avg: number | null;
          activity_regular: number | null;
          activity_total: number | null;
          afterschool_total: number | null;
          att_grade: number | null;
          attendance_rate: number | null;
          career_on_time: number | null;
          career_submissions_total: number | null;
          creative_hours: number | null;
          current_class: number | null;
          current_grade: number | null;
          current_number: number | null;
          mock_academic_year: number | null;
          mock_avg_grade: number | null;
          mock_exam_month: number | null;
          mock_subject_count: number | null;
          name: string | null;
          reading_count: number | null;
          school_days: number | null;
          student_code: string | null;
          study_room_attended: number | null;
          study_room_rate: number | null;
          study_room_total: number | null;
          total_absence: number | null;
          total_tardiness: number | null;
          volunteer_count: number | null;
          volunteer_cumulative: number | null;
          volunteer_hours: number | null;
        };
        Relationships: [];
      };
      student_dashboard_view: {
        Row: {
          academic_development: Json | null;
          attendance: Json | null;
          birthday: string | null;
          career: string | null;
          class_num: number | null;
          created_at: string | null;
          grade: number | null;
          grade_info: Json | null;
          major: string | null;
          name: string | null;
          number: number | null;
          phone: string | null;
          picture: string | null;
          reading: Json | null;
          resource_id: string | null;
          section1_personal_info: Json | null;
          student_code: string | null;
          student_no: string | null;
          updated_at: string | null;
          volunteer: Json | null;
        };
        Relationships: [];
      };
      student_identity_map: {
        Row: {
          current_class: number | null;
          current_grade: number | null;
          current_number: number | null;
          name: string | null;
          profile_id: string | null;
          resource_id: string | null;
          snum1: string | null;
          snum2: string | null;
          snum3: string | null;
          student_code: string | null;
        };
        Relationships: [];
      };
      student_mock_flat: {
        Row: {
          academic_year: number | null;
          current_class: number | null;
          current_grade: number | null;
          exam_grade: number | null;
          exam_month: number | null;
          grade: number | null;
          name: string | null;
          percentile: number | null;
          raw_score: number | null;
          standard_score: number | null;
          student_code: string | null;
          subject: string | null;
        };
        Relationships: [];
      };
      student_timetable_flat: {
        Row: {
          academic_year: number | null;
          class_num: number | null;
          day_of_week: number | null;
          grade: number | null;
          number: number | null;
          period: number | null;
          picture: string | null;
          resource_id: string | null;
          semester: number | null;
          student_code: string | null;
          student_name: string | null;
          subject: string | null;
          teacher_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resource';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_dashboard_view';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'student_identity_map';
            referencedColumns: ['resource_id'];
          },
          {
            foreignKeyName: 'student_timetable_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'training_progress_view';
            referencedColumns: ['resource_id'];
          },
        ];
      };
      temperature_rankings_mv: {
        Row: {
          class: number | null;
          grade: number | null;
          monthly_change: number | null;
          name: string | null;
          rank: number | null;
          student_id: string | null;
          temperature: number | null;
        };
        Relationships: [];
      };
      training_progress_view: {
        Row: {
          category: string | null;
          completed_hours: number | null;
          entries: number | null;
          required_hours: number | null;
          resource_id: string | null;
          teacher_name: string | null;
          training_code: string | null;
          training_name: string | null;
          training_type_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      acquire_badge: {
        Args: { p_badge_id: number };
        Returns: {
          acquired_at: string | null;
          badge_id: number;
          id: string;
          student_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'seaton_badge_acquire';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      add_assignees_meta: {
        Args: { p_assignee_ids: string[]; p_task_id: string };
        Returns: undefined;
      };
      add_custom_subject_to_slot: {
        Args: {
          p_academic_year: number;
          p_area?: string;
          p_category: string;
          p_credits: number;
          p_grade: number;
          p_grading_type?: string;
          p_hours?: number;
          p_override_capacity?: number;
          p_semester: number;
          p_slot_id: string;
          p_subject: string;
          p_subject_type?: string;
        };
        Returns: Json;
      };
      add_performance_indexes: { Args: never; Returns: string };
      analyze_duplicate_tasks: {
        Args: never;
        Returns: {
          consolidation_potential: string;
          duplicate_count: number;
          keyword: string;
          similar_tasks: Json;
        }[];
      };
      analyze_tasks_by_keyword: {
        Args: never;
        Returns: {
          avg_completion_rate: number;
          completed_tasks: number;
          event_count: number;
          keyword: string;
          task_count: number;
          total_tasks: number;
        }[];
      };
      attach_curriculum_subjects_to_slot: {
        Args: { p_curriculum_ids: string[]; p_slot_id: string };
        Returns: Json;
      };
      award_focus_points: { Args: { p_session_id: string }; Returns: number };
      backfill_course_submission_resource_id: { Args: never; Returns: number };
      bulk_import_course_submissions: { Args: { payload: Json }; Returns: Json };
      calculate_problem_solving_progress: {
        Args: { _achievement_id: string; _user_id: string };
        Returns: number;
      };
      calculate_student_temperature: {
        Args: { student_uuid: string };
        Returns: number;
      };
      calculate_student_temperatures_batch: {
        Args: { student_uuids: string[] };
        Returns: {
          student_id: string;
          temperature: number;
        }[];
      };
      can_access_rescue: { Args: never; Returns: boolean };
      can_care_student: { Args: { p_student_code: string }; Returns: boolean };
      can_read_wishlist: { Args: { p_student_code: string }; Returns: boolean };
      can_write_wishlist: { Args: { p_student_code: string }; Returns: boolean };
      check_resource_duplicate_connection: {
        Args: { p_current_user_id: string; p_resource_id: string };
        Returns: {
          connected_user_id: string;
          is_connected: boolean;
        }[];
      };
      cleanup_old_schema: { Args: never; Returns: string };
      cleanup_stale_sessions: { Args: never; Returns: undefined };
      convert_grade_scale: {
        Args: { p_from?: string; p_grade: number; p_to?: string };
        Returns: number;
      };
      copy_task_workflow: {
        Args: {
          p_excluded_node_ids?: string[];
          p_name?: string;
          p_source_workflow_id: string;
        };
        Returns: Json;
      };
      count_inquiry_analysis_calls: {
        Args: { p_since?: string; p_student_id: string };
        Returns: number;
      };
      count_inquiry_comprehensive_calls: {
        Args: { p_since?: string; p_student_id: string };
        Returns: number;
      };
      course_analyze_subject_category: {
        Args: { p_group: string };
        Returns: string;
      };
      create_document_issue: {
        Args: {
          p_class_number?: number;
          p_department?: string;
          p_doc_type: string;
          p_form_data?: Json;
          p_grade?: number;
          p_issued_on: string;
          p_meta?: Json;
          p_remarks?: string;
          p_students?: Json;
          p_title: string;
        };
        Returns: string;
      };
      create_manual_notification: {
        Args: {
          p_message: string;
          p_related_meeting_id?: string;
          p_target_resource_ids: string[];
          p_title: string;
        };
        Returns: undefined;
      };
      create_notification: {
        Args: {
          p_message: string;
          p_related_problem_id?: string;
          p_related_solution_id?: string;
          p_related_user_id?: string;
          p_title: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      create_problem_solving_achievements: { Args: never; Returns: undefined };
      create_rescue_note_with_companions: {
        Args: {
          p_co_student_codes: string[];
          p_content: string;
          p_end_at?: string;
          p_meta?: Json;
          p_occurred_at: string;
          p_remarks?: string;
          p_student_code: string;
          p_title?: string;
          p_visibility?: Database['public']['Enums']['rescue_visibility'];
        };
        Returns: string;
      };
      create_rescue_scholarship: {
        Args: {
          p_awarded_on: string;
          p_meta?: Json;
          p_name: string;
          p_remarks?: string;
          p_student_code: string;
        };
        Returns: string;
      };
      create_task_work_document_template_version: {
        Args: {
          p_content_sha256: string;
          p_description: string;
          p_fields: Json;
          p_id: string;
          p_mime_type: string;
          p_name: string;
          p_previous_template_id: string;
          p_size_bytes: number;
          p_source_file_name: string;
          p_storage_path: string;
        };
        Returns: {
          archived_at: string | null;
          content_sha256: string;
          created_at: string;
          created_by: string;
          description: string | null;
          family_id: string;
          fields: Json;
          format: string;
          id: string;
          mime_type: string;
          name: string;
          previous_version_id: string | null;
          size_bytes: number;
          source_file_name: string;
          spec: Json | null;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'task_work_document_template';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_task_work_document_version: {
        Args: {
          p_field_values: Json;
          p_id: string;
          p_knowledge: Json;
          p_plan: Json;
          p_previous_document_id: string;
          p_row_values: Json;
          p_status: string;
          p_template_version_id?: string;
          p_title: string;
          p_user_context: string;
        };
        Returns: {
          archived_at: string | null;
          created_at: string;
          created_by: string;
          family_id: string;
          field_values: Json;
          id: string;
          knowledge: Json;
          plan: Json;
          previous_version_id: string | null;
          row_values: Json;
          status: string;
          template_version_id: string;
          title: string;
          updated_at: string;
          user_context: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'task_work_document';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_rescue_role: { Args: never; Returns: string };
      delete_inquiry_design: { Args: { p_design_id: string }; Returns: boolean };
      delete_task_work_run: { Args: { p_run_id: string }; Returns: string[] };
      delete_user_tokens: { Args: { p_user_id: string }; Returns: undefined };
      enter_queue: { Args: never; Returns: Json };
      exam_grade1_2026_3_dump: { Args: never; Returns: Json };
      finalize_task_work_run: {
        Args: {
          p_artifacts?: Json;
          p_checks?: Json;
          p_error_summary?: string;
          p_output_summary?: Json;
          p_run_id: string;
          p_status: string;
        };
        Returns: undefined;
      };
      find_similar_kg_entities: {
        Args: {
          p_match_count?: number;
          p_match_threshold?: number;
          p_query_embedding: string;
          p_student_id: string;
        };
        Returns: {
          entity_id: string;
          label: string;
          similarity: number;
          type: string;
        }[];
      };
      get_admission_wishlist: {
        Args: { p_student_code: string };
        Returns: {
          adiga: Json;
          admission_name: string;
          created_at: string;
          department: string;
          gyogwa: Json;
          id: string;
          jonghap: Json;
          memo: string;
          sort_order: number;
          student_code: string;
          track: string;
          university: string;
          updated_at: string;
        }[];
      };
      get_class_correlation: {
        Args: {
          p_class_num: number;
          p_domain_x: string;
          p_domain_y: string;
          p_grade: number;
        };
        Returns: {
          name: string;
          student_code: string;
          x_value: number;
          y_value: number;
        }[];
      };
      get_class_transition_map: {
        Args: { p_entry_year?: number; p_from_grade: number };
        Returns: {
          avg_past_rank: number;
          current_class: number;
          past_class: number;
          student_count: number;
        }[];
      };
      get_class_wishlist_summary: {
        Args: { p_class: number; p_grade: number };
        Returns: {
          admission_name: string;
          competition_2026: number;
          department: string;
          field: string;
          grade70: number;
          name: string;
          number_in_class: number;
          sort_order: number;
          student_code: string;
          track: string;
          university: string;
          wishlist_id: string;
        }[];
      };
      get_cohort_analysis: {
        Args: { p_current_grade: number; p_entry_year: number };
        Returns: Json;
      };
      get_course_analyze_snapshot: {
        Args: { p_academic_year?: number };
        Returns: Json;
      };
      get_course_selection_round_tree: {
        Args: { p_round_id: string };
        Returns: Json;
      };
      get_current_user_info: { Args: never; Returns: Json };
      get_curriculum_by_term: {
        Args: { p_academic_year: number; p_grade?: number; p_semester?: number };
        Returns: {
          academic_year: number;
          area: string;
          category: string;
          credits: number;
          curriculum_revision: string;
          grade: number;
          grading_type: string;
          hours: number;
          semester: number;
          subject: string;
          subject_type: string;
        }[];
      };
      get_curriculum_comparison: {
        Args: { p_year_a: number; p_year_b: number };
        Returns: {
          category: string;
          change_type: string;
          details: string;
          semesters_a: Json;
          semesters_b: Json;
          subject: string;
          subject_type_a: string;
          subject_type_b: string;
          total_credits_a: number;
          total_credits_b: number;
        }[];
      };
      get_curriculum_overview: {
        Args: { p_admission_year?: number };
        Returns: {
          admission_year: number;
          category: string;
          subject_count: number;
          subject_type: string;
          subjects: Json;
          total_credits_sum: number;
        }[];
      };
      get_curriculum_subjects_for_group: {
        Args: { p_group_id: string; p_semester?: number };
        Returns: Json;
      };
      get_curriculum_subjects_for_round: {
        Args: { p_round_id: string; p_semester?: number };
        Returns: Json;
      };
      get_daily_statistics: {
        Args: { end_date: string; start_date: string; target_grade?: number };
        Returns: {
          attendance_rate: number;
          attended: number;
          by_grade: Json;
          date: string;
          total_reservations: number;
        }[];
      };
      get_dashboard_statistics: {
        Args: { p_today: string; p_week_end: string; p_week_start: string };
        Returns: Json;
      };
      get_exam_subject_candidates: {
        Args: { p_grade: number };
        Returns: {
          is_universal: boolean;
          student_codes: string[];
          student_count: number;
          subject: string;
        }[];
      };
      get_grade_statistics: {
        Args: { end_date: string; start_date: string; target_grade?: number };
        Returns: {
          attendance_rate: number;
          attended: number;
          grade: number;
          total_reservations: number;
        }[];
      };
      get_inquiry_analysis_cache: {
        Args: { p_cache_key: string; p_student_id: string };
        Returns: {
          completion_tokens: number;
          created_at: string;
          expires_at: string;
          model: string;
          prompt_tokens: number;
          result: Json;
        }[];
      };
      get_ipsi_hub_feed: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_offset?: number;
          p_type?: string;
        };
        Returns: Json;
      };
      get_latest_kg_version: {
        Args: { p_student_id: string };
        Returns: {
          created_at: string;
          created_by: string;
          id: string;
          kg_json: Json;
          source_categories: string[];
          student_id: string;
          version: number;
        }[];
      };
      get_latest_timetable_term: {
        Args: never;
        Returns: {
          academic_year: number;
          semester: number;
        }[];
      };
      get_mock_category_stats: {
        Args: {
          p_grade: number;
          p_month: number;
          p_subject?: string;
          p_year: number;
        };
        Returns: {
          avg_national_rate: number;
          avg_rate_gap: number;
          avg_school_rate: number;
          easiest_problem: number;
          hardest_problem: number;
          major_category: string;
          problem_count: number;
          subject: string;
        }[];
      };
      get_mock_item_analysis: {
        Args: {
          p_grade: number;
          p_month: number;
          p_subject?: string;
          p_year: number;
        };
        Returns: {
          answer_distribution: Json;
          difficulty_level: string;
          major_category: string;
          national_correct_rate: number;
          point: number;
          problem_number: number;
          rate_gap: number;
          school_correct_count: number;
          school_correct_rate: number;
          school_total_students: number;
          sub_category: string;
          subject: string;
        }[];
      };
      get_monthly_statistics: {
        Args: { end_date: string; start_date: string; target_grade?: number };
        Returns: {
          attendance_rate: number;
          attended: number;
          by_grade: Json;
          month: string;
          total_reservations: number;
        }[];
      };
      get_monthly_temperature_ranking: {
        Args: { p_month: string };
        Returns: {
          attended_days: number;
          class: number;
          grade: number;
          monthly_change: number;
          name: string;
          rank: number;
          student_id: string;
        }[];
      };
      get_my_course_selection: {
        Args: { p_round_id: string; p_student_code: string };
        Returns: Json;
      };
      get_my_tasks_jsonb: {
        Args: {
          p_include_managed?: boolean;
          p_status?: string;
          p_user_id: string;
        };
        Returns: {
          assigned_tasks: Json;
          managed_tasks: Json;
          summary: Json;
          urgent_tasks: Json;
        }[];
      };
      get_next_kg_version: { Args: { p_student_id: string }; Returns: number };
      get_overall_statistics: {
        Args: { end_date: string; start_date: string; target_grade?: number };
        Returns: {
          active_rooms: number;
          overall_attendance_rate: number;
          total_absent: number;
          total_attended: number;
          total_reservations: number;
          unique_students: number;
        }[];
      };
      get_past_class_academic_summary: {
        Args: { p_entry_year?: number; p_past_grade: number };
        Returns: {
          avg_rank: number;
          best_rank: number;
          past_class: number;
          std_rank: number;
          student_count: number;
          subject_group: string;
          worst_rank: number;
        }[];
      };
      get_rescue_crisis_dashboard: {
        Args: never;
        Returns: {
          class_num: number;
          grade: number;
          homeroom_name: string;
          last_note_at: string;
          name: string;
          note_count: number;
          number_in_class: number;
          status: Database['public']['Enums']['rescue_status'];
          student_code: string;
          tag_keys: string[];
        }[];
      };
      get_rescue_roster: {
        Args: { p_class: number; p_grade: number };
        Returns: {
          class_num: number;
          grade: number;
          last_note_at: string;
          name: string;
          note_count: number;
          number_in_class: number;
          status: Database['public']['Enums']['rescue_status'];
          student_code: string;
          tag_keys: string[];
        }[];
      };
      get_room_statistics: {
        Args: { end_date: string; start_date: string; target_grade?: number };
        Returns: {
          attendance_rate: number;
          attended: number;
          grade: number;
          room_id: string;
          room_name: string;
          total_reservations: number;
        }[];
      };
      get_section_students: {
        Args: {
          p_academic_year: number;
          p_day_of_week: number;
          p_period: number;
          p_semester: number;
          p_teacher_name: string;
        };
        Returns: {
          class_num: number;
          grade: number;
          number: number;
          picture: string;
          resource_id: string;
          student_code: string;
          student_name: string;
          subject: string;
        }[];
      };
      get_semester_credit_distribution: {
        Args: { p_admission_year: number };
        Returns: {
          category: string;
          credit_sum: number;
          semester: string;
          subject_list: string[];
          subject_type: string;
        }[];
      };
      get_student_activities_by_category: {
        Args: { p_category?: string; p_grade?: number; p_student_code?: string };
        Returns: {
          area: string;
          category: string;
          content: string;
          grade: number;
          hours: number;
          name: string;
          semester: number;
          student_code: string;
          subject_name: string;
        }[];
      };
      get_student_activity_summary: {
        Args: { p_student_code?: string };
        Returns: {
          autonomy_count: number;
          autonomy_hours: number;
          behavior_count: number;
          career_activity_count: number;
          career_activity_hours: number;
          career_count: number;
          club_count: number;
          club_hours: number;
          name: string;
          pe_arts_count: number;
          regular_count: number;
          student_code: string;
          total_count: number;
          total_creative_hours: number;
        }[];
      };
      get_student_afterschool_detail: {
        Args: { p_student_code?: string };
        Returns: {
          collected_at: string;
          course_name: string;
          is_paid: boolean;
          student_code: string;
          student_name: string;
        }[];
      };
      get_student_attendance_flat: {
        Args: { p_student_code?: string };
        Returns: {
          absence_disease: number;
          absence_other: number;
          absence_unapproved: number;
          attendance_rate: number;
          class_skip_disease: number;
          class_skip_other: number;
          class_skip_unapproved: number;
          early_leave_disease: number;
          early_leave_other: number;
          early_leave_unapproved: number;
          grade: number;
          name: string;
          notes: string;
          school_days: number;
          student_code: string;
          tardiness_disease: number;
          tardiness_other: number;
          tardiness_unapproved: number;
          total_absence: number;
          total_class_skip: number;
          total_early_leave: number;
          total_tardiness: number;
        }[];
      };
      get_student_career_submissions_detail: {
        Args: { p_student_code?: string };
        Returns: {
          assignment_name: string;
          board_name: string;
          deadline: string;
          has_material: boolean;
          student_code: string;
          student_name: string;
          submission_datetime: string;
          teacher_in_charge: string;
        }[];
      };
      get_student_cross_domain_stats: {
        Args: { p_student_code: string };
        Returns: Json;
      };
      get_student_dashboard_data: {
        Args: {
          p_class_num?: number;
          p_grade?: number;
          p_search_term?: string;
          p_student_code?: string;
        };
        Returns: {
          academic_development: Json;
          attendance: Json;
          attendance_rate: number;
          attended_count: number;
          birthday: string;
          career: string;
          class_num: number;
          grade: number;
          major: string;
          name: string;
          number: number;
          phone: string;
          picture: string;
          reading: Json;
          resource_id: string;
          student_code: string;
          student_no: string;
          total_reservations: number;
          volunteer: Json;
        }[];
      };
      get_student_engagement_summary: {
        Args: { p_student_code?: string };
        Returns: {
          afterschool_free: number;
          afterschool_paid: number;
          afterschool_total: number;
          career_board_types: number;
          career_submissions_on_time: number;
          career_submissions_total: number;
          career_with_material: number;
          name: string;
          student_code: string;
        }[];
      };
      get_student_grade_summary: {
        Args: { p_student_ids: string[] };
        Returns: {
          overall_grade: number;
          student_code: string;
          subject_count: number;
          subject_group_grades: Json;
          total_units: number;
        }[];
      };
      get_student_grade_trajectory: {
        Args: { p_student_code: string };
        Returns: {
          academic_year: number;
          rank_change: number;
          semester: number;
          subject_group: string;
          weighted_avg: number;
        }[];
      };
      get_student_mock_summary: {
        Args: { p_student_code?: string };
        Returns: {
          academic_year: number;
          exam_grade: number;
          exam_month: number;
          grade: number;
          name: string;
          percentile: number;
          raw_score: number;
          standard_score: number;
          student_code: string;
          subject: string;
        }[];
      };
      get_student_points: {
        Args: { p_student_id: string };
        Returns: {
          balance: number;
          total_earned: number;
          total_spent: number;
        }[];
      };
      get_student_reading_flat: {
        Args: { p_student_code?: string };
        Returns: {
          author: string;
          content: string;
          grade: number;
          name: string;
          related_subject: string;
          semester: number;
          student_code: string;
          title: string;
        }[];
      };
      get_student_reservation_stats: {
        Args: { p_student_code: string };
        Returns: {
          attendance_rate: number;
          attended_count: number;
          total_reservations: number;
        }[];
      };
      get_student_reservations_by_year: {
        Args: { p_student_code: string };
        Returns: {
          attendance_rate: number;
          attended_count: number;
          total_reservations: number;
          year: number;
        }[];
      };
      get_student_stats_bundle: {
        Args: {
          p_absence_decrement: number;
          p_attendance_increment: number;
          p_end: string;
          p_grade?: number;
          p_past_closing: boolean;
          p_room_id?: string;
          p_start: string;
          p_today: string;
        };
        Returns: Json;
      };
      get_student_study_room_summary: {
        Args: { p_student_code?: string };
        Returns: {
          academic_year: number;
          attendance_rate: number;
          attended_count: number;
          name: string;
          student_code: string;
          total_reservations: number;
        }[];
      };
      get_student_volunteer_flat: {
        Args: { p_student_code?: string };
        Returns: {
          activity: string;
          cumulative_hours: number;
          date_or_period: string;
          grade: number;
          hours: number;
          institution: string;
          name: string;
          student_code: string;
        }[];
      };
      get_student_year_context: {
        Args: { p_academic_year: number; p_student_code: string };
        Returns: {
          class_num: number;
          grade: number;
          homeroom_teacher: string;
          number: number;
        }[];
      };
      get_students_by_past_class: {
        Args: {
          p_entry_year?: number;
          p_past_class: number;
          p_past_grade: number;
        };
        Returns: {
          current_class: number;
          current_grade: number;
          current_number: number;
          name: string;
          past_class: number;
          past_grade: number;
          past_number: number;
          past_teacher: string;
          student_code: string;
        }[];
      };
      get_task_event_detail: {
        Args: { p_event_id: string };
        Returns: {
          created_at: string;
          description: string;
          id: string;
          keywords: string[];
          manager_id: string;
          manager_name: string;
          manager_type: string;
          meta: Json;
          name: string;
          status: string;
          tasks: Json;
          updated_at: string;
        }[];
      };
      get_task_events: {
        Args: {
          p_keyword?: string;
          p_limit?: number;
          p_manager_id?: string;
          p_offset?: number;
          p_status?: string;
        };
        Returns: {
          completed_tasks: number;
          created_at: string;
          description: string;
          id: string;
          keywords: string[];
          manager_id: string;
          manager_name: string;
          name: string;
          pending_tasks: number;
          progress_percentage: number;
          status: string;
          total_tasks: number;
          updated_at: string;
        }[];
      };
      get_teacher_timetables_for_swap: {
        Args: {
          p_academic_year: number;
          p_semester: number;
          target_class: number;
          target_grade: number;
        };
        Returns: {
          class_number: number;
          grade: number;
          id: string;
          period: number;
          resource_id: string;
          section_id: string;
          section_name: string;
          subject: string;
          teacher_name: string;
          weekday: number;
          weekday_time: string;
        }[];
      };
      get_temperature_ranking: {
        Args: never;
        Returns: {
          class: number;
          grade: number;
          monthly_change: number;
          name: string;
          rank: number;
          student_id: string;
          temperature: number;
        }[];
      };
      get_temperatures_for_students: {
        Args: { student_ids: string[] };
        Returns: {
          student_id: string;
          temperature: number;
        }[];
      };
      get_user_ranking_position: {
        Args: { _user_id: string };
        Returns: {
          author_email: string;
          author_nickname: string;
          last_activity: string;
          ranking_position: number;
          total_likes: number;
          total_problems: number;
          total_saves: number;
          total_score: number;
          total_solutions: number;
          user_id: string;
        }[];
      };
      get_user_rankings: {
        Args: never;
        Returns: {
          author_email: string;
          author_nickname: string;
          last_activity: string;
          total_likes: number;
          total_problems: number;
          total_saves: number;
          total_score: number;
          total_solutions: number;
          user_id: string;
        }[];
      };
      get_user_rankings_1month: {
        Args: never;
        Returns: {
          author_email: string;
          author_nickname: string;
          last_activity: string;
          total_likes: number;
          total_problems: number;
          total_saves: number;
          total_score: number;
          total_solutions: number;
          user_id: string;
        }[];
      };
      get_user_rankings_daily: {
        Args: { month_offset?: number };
        Returns: {
          author_email: string;
          author_nickname: string;
          cumulative_likes: number;
          cumulative_problems: number;
          cumulative_saves: number;
          cumulative_score: number;
          cumulative_solutions: number;
          daily_likes: number;
          daily_problems: number;
          daily_saves: number;
          daily_score: number;
          daily_solutions: number;
          day_date: string;
          day_number: number;
          user_id: string;
        }[];
      };
      get_user_rankings_monthly: {
        Args: { month_offset?: number };
        Returns: {
          author_email: string;
          author_nickname: string;
          last_activity: string;
          total_likes: number;
          total_problems: number;
          total_saves: number;
          total_score: number;
          total_solutions: number;
          user_id: string;
        }[];
      };
      get_user_resource_ids: {
        Args: { user_uuid: string };
        Returns: {
          resource_id: string;
        }[];
      };
      get_user_section_ids: {
        Args: { user_uuid: string };
        Returns: {
          section_id: string;
        }[];
      };
      get_user_tokens: {
        Args: { p_user_id: string };
        Returns: {
          access_token: string;
          refresh_token: string;
        }[];
      };
      get_weekday_crosstab: {
        Args: { p_end: string; p_grade?: number; p_start: string };
        Returns: {
          by_day: Json;
          room_id: string;
          room_name: string;
          total: number;
          unique_students: number;
        }[];
      };
      get_wishlist_mock: {
        Args: { p_student_code: string };
        Returns: {
          academic_year: number;
          exam_month: number;
          grade: number;
          subject: string;
        }[];
      };
      get_wishlist_mock_rounds: {
        Args: { p_student_code: string };
        Returns: {
          academic_year: number;
          exam_month: number;
          grade: number;
          subject: string;
        }[];
      };
      get_wishlist_naesin: {
        Args: { p_student_code: string };
        Returns: {
          avg_grade: number;
          subject_count: number;
        }[];
      };
      get_wishlist_subjects: {
        Args: { p_student_code: string };
        Returns: {
          academic_year: number;
          achievement: string;
          category: string;
          grade: number;
          rank: number;
          score: number;
          semester: number;
          subject: string;
          subject_group: string;
          units: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      heartbeat: { Args: never; Returns: Json };
      import_univ_admissions: { Args: { data: Json }; Returns: number };
      inquiry_design_can_access_student: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
      inquiry_design_is_teacher_or_admin: { Args: never; Returns: boolean };
      insert_document_chunks: { Args: { _rows: Json }; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      is_board_member_or_owner: {
        Args: { board_id: string; user_resource_id: string };
        Returns: boolean;
      };
      is_board_owner: { Args: { board_uuid: string }; Returns: boolean };
      is_homeroom_teacher: {
        Args: { p_class: number; p_grade: number };
        Returns: boolean;
      };
      is_purchase_page_manager: {
        Args: { p_page_id: string };
        Returns: boolean;
      };
      is_teacher_or_admin: { Args: { uid: string }; Returns: boolean };
      is_training_manager: { Args: never; Returns: boolean };
      is_wishlist_owner: { Args: { p_student_code: string }; Returns: boolean };
      leave_queue: { Args: never; Returns: undefined };
      live_presentation__activity_public: {
        Args: {
          a: Database['public']['Tables']['live_presentation_activities']['Row'];
        };
        Returns: Json;
      };
      live_presentation__aggregate: {
        Args: { p_activity_id: string; p_round?: number };
        Returns: Json;
      };
      live_presentation__auth_host: {
        Args: { p_host_token: string; p_session_id: string };
        Returns: {
          code: string;
          created_at: string;
          current_slide: number;
          deck_path: string | null;
          ended_at: string | null;
          gamify: boolean;
          host_token: string;
          id: string;
          name_mode: string;
          status: string;
          title: string;
        };
        SetofOptions: {
          from: '*';
          to: 'live_presentation_sessions';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      live_presentation__gen_code: { Args: never; Returns: string };
      live_presentation__leaderboard: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      live_presentation__reveal_payload: {
        Args: {
          a: Database['public']['Tables']['live_presentation_activities']['Row'];
        };
        Returns: Json;
      };
      log_course_selection_change: {
        Args: {
          p_action: string;
          p_actor_name: string;
          p_actor_role: string;
          p_diff?: Json;
          p_reason?: string;
          p_round_id: string;
          p_target_id: string;
          p_target_label: string;
          p_target_type: string;
        };
        Returns: string;
      };
      lp_advance_round: {
        Args: {
          p_activity_id: string;
          p_host_token: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      lp_close_activity: {
        Args: {
          p_activity_id: string;
          p_host_token: string;
          p_session_id: string;
        };
        Returns: undefined;
      };
      lp_code_submissions: {
        Args: {
          p_activity_id: string;
          p_host_token: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      lp_create_session: {
        Args: {
          p_deck_path?: string;
          p_gamify?: boolean;
          p_name_mode?: string;
          p_passphrase: string;
          p_title: string;
        };
        Returns: Json;
      };
      lp_end_session: {
        Args: { p_host_token: string; p_session_id: string };
        Returns: undefined;
      };
      lp_export_session: {
        Args: { p_host_token: string; p_session_id: string };
        Returns: Json;
      };
      lp_host_state: {
        Args: { p_host_token: string; p_session_id: string };
        Returns: Json;
      };
      lp_join: {
        Args: {
          p_client_id: string;
          p_code: string;
          p_nickname?: string;
          p_student_no?: string;
        };
        Returns: Json;
      };
      lp_open_activity: {
        Args: {
          p_config?: Json;
          p_host_token: string;
          p_kind: string;
          p_prompt: string;
          p_session_id: string;
          p_slide_index: number;
          p_slide_key: string;
        };
        Returns: Json;
      };
      lp_resume_session: {
        Args: { p_code: string; p_host_token: string };
        Returns: Json;
      };
      lp_reveal_activity: {
        Args: {
          p_activity_id: string;
          p_host_token: string;
          p_session_id: string;
        };
        Returns: Json;
      };
      lp_set_slide: {
        Args: {
          p_host_token: string;
          p_session_id: string;
          p_slide_index: number;
        };
        Returns: undefined;
      };
      lp_student_state: {
        Args: { p_client_id: string; p_code: string };
        Returns: Json;
      };
      lp_submit: {
        Args: {
          p_activity_id: string;
          p_client_id: string;
          p_participant_id: string;
          p_payload: Json;
          p_round?: number;
        };
        Returns: Json;
      };
      migrate_classroom_resources: { Args: never; Returns: number };
      migrate_meeting_participants: { Args: never; Returns: number };
      migrate_section_grade_to_meta: { Args: never; Returns: number };
      migrate_student_resources: { Args: never; Returns: number };
      migrate_teacher_resources: { Args: never; Returns: number };
      next_document_issue_no: { Args: { p_space: string }; Returns: string };
      next_rescue_note_no: { Args: never; Returns: string };
      next_rescue_scholarship_no: { Args: never; Returns: string };
      process_graduated_student_cohort: {
        Args: { p_admission_year: number; p_expected_mapping: Json };
        Returns: Json;
      };
      refresh_mock_school_stats: { Args: never; Returns: undefined };
      refresh_student_academic_flat: { Args: never; Returns: undefined };
      refresh_student_cross_domain_stats: { Args: never; Returns: undefined };
      refresh_student_identity_map: { Args: never; Returns: undefined };
      refresh_student_mock_flat: { Args: never; Returns: undefined };
      refresh_student_timetable_flat: { Args: never; Returns: undefined };
      refresh_temperature_rankings: { Args: never; Returns: undefined };
      remove_assignees_meta: {
        Args: { p_assignee_ids: string[]; p_task_id: string };
        Returns: undefined;
      };
      resolve_student_key: {
        Args: { p_key: string; p_key_type?: string; p_year?: number };
        Returns: {
          name: string;
          profile_id: string;
          resource_id: string;
          student_code: string;
        }[];
      };
      review_task_work_run: {
        Args: { p_comment?: string; p_decision: string; p_run_id: string };
        Returns: undefined;
      };
      save_course_selection_group: {
        Args: {
          p_actor_role?: string;
          p_group_id: string;
          p_picks: Json;
          p_round_id: string;
          p_student_class: number;
          p_student_code: string;
          p_student_grade: number;
          p_student_name: string;
          p_student_no: number;
          p_student_resource_id: string;
        };
        Returns: Json;
      };
      save_inquiry_design_with_ontology: {
        Args: {
          p_design: Json;
          p_entities?: Json;
          p_relations?: Json;
          p_sources?: Json;
        };
        Returns: string;
      };
      save_kg_version: {
        Args: {
          p_kg_json: Json;
          p_source_categories?: string[];
          p_student_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          student_id: string;
          version: number;
        }[];
      };
      save_kg_version_secure: {
        Args: {
          p_kg_json: Json;
          p_source_categories?: string[];
          p_student_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          student_id: string;
          version: number;
        }[];
      };
      save_task_workflow_graph: {
        Args: {
          p_description: string;
          p_edges: Json;
          p_name: string;
          p_nodes: Json;
          p_viewport: Json;
          p_workflow_id: string;
        };
        Returns: undefined;
      };
      search_admission_majors: {
        Args: {
          p_cut_max?: number;
          p_cut_min?: number;
          p_limit?: number;
          p_offset?: number;
          p_query: string;
          p_recruit_min?: number;
          p_regions?: string[];
          p_sort?: string;
          p_track: string;
        };
        Returns: {
          adiga_id: string;
          competition_2026: number;
          csat: string;
          csat_status: string;
          domain: string;
          field: string;
          grade50: number;
          grade70: number;
          has_csat: boolean;
          major: string;
          program: string;
          recruit_2026: number;
          region: string;
          score: number;
          university: string;
        }[];
      };
      search_admission_programs: {
        Args: { p_limit?: number; p_query: string; p_track: string };
        Returns: {
          admission_name: string;
          department: string;
          extra: Json;
          ref_id: string;
          region: string;
          score: number;
          track: string;
          university: string;
        }[];
      };
      search_document_chunks: {
        Args: {
          match_count?: number;
          query_embedding: string;
          similarity_threshold?: number;
        };
        Returns: {
          chunk_text: string;
          document_title: string;
          file_name: string;
          id: string;
          similarity_score: number;
        }[];
      };
      search_tasks:
        | {
            Args: { p_limit?: number; p_query: string };
            Returns: {
              context: Json;
              description: string;
              id: string;
              keywords: string[];
              relevance: number;
              status: string;
              title: string;
              type: string;
            }[];
          }
        | {
            Args: { p_limit?: number; p_query: string; p_user_id?: string };
            Returns: {
              context: Json;
              description: string;
              id: string;
              keywords: string[];
              relevance: number;
              status: string;
              title: string;
              type: string;
            }[];
          };
      set_inquiry_recommendation_generated: {
        Args: {
          p_ai_model: string;
          p_ai_provider: string;
          p_id: string;
          p_recommendations: Json;
          p_selected_anchor_subjects: Json;
          p_selected_weakness_ids: Json;
          p_token_usage: Json;
          p_user_notes: string;
        };
        Returns: undefined;
      };
      set_kg_entity_embedding: {
        Args: {
          p_embedding: string;
          p_entity_id: string;
          p_kg_version_id: string;
        };
        Returns: undefined;
      };
      set_rescue_status: {
        Args: {
          p_reason?: string;
          p_status: Database['public']['Enums']['rescue_status'];
          p_student_code: string;
        };
        Returns: undefined;
      };
      set_slot_subject_bundle: {
        Args: {
          p_bundle_key: string;
          p_bundle_label: string;
          p_slot_subject_ids: string[];
        };
        Returns: Json;
      };
      set_slot_subject_bundle_capacity: {
        Args: { p_capacity: number; p_slot_subject_ids: string[] };
        Returns: Json;
      };
      set_task_assignee_status: {
        Args: {
          p_assignee_resource_id: string;
          p_status: string;
          p_task_id: string;
        };
        Returns: Json;
      };
      set_task_deadline_status: {
        Args: {
          p_assignee_resource_id: string;
          p_deadline: string;
          p_status: string;
          p_task_id: string;
        };
        Returns: Json;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      start_task_work_run: {
        Args: {
          p_idempotency_key: string;
          p_input_snapshot?: Json;
          p_work_id: string;
          p_workflow_id?: string;
        };
        Returns: string;
      };
      store_user_token: {
        Args: {
          p_access_token: string;
          p_refresh_token: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      toggle_rescue_tag: {
        Args: { p_action: string; p_student_code: string; p_tag_key: string };
        Returns: undefined;
      };
      unlock_puzzle_piece: {
        Args: { p_event_id: string; p_piece_index: number };
        Returns: {
          is_puzzle_completed: boolean;
          piece_index: number;
          remaining_points: number;
        }[];
      };
      update_all_user_achievements: {
        Args: { _user_id: string };
        Returns: undefined;
      };
      update_assignee_status_meta: {
        Args: { p_status: string; p_task_id: string; p_user_id: string };
        Returns: Json;
      };
      update_club_activities: {
        Args: { p_activities: Json; p_club_id: string; p_issue_id: string };
        Returns: {
          class_number: number | null;
          created_at: string;
          created_by: string;
          department: string | null;
          doc_type: string;
          form_data: Json | null;
          grade: number | null;
          id: string;
          issue_no: string;
          issue_year: number;
          issued_on: string;
          meta: Json;
          remarks: string | null;
          status: string;
          students: Json;
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'document_issue';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      update_club_attendance: {
        Args: {
          p_attendance: Json;
          p_club_id: string;
          p_excluded: Json;
          p_issue_id: string;
        };
        Returns: {
          class_number: number | null;
          created_at: string;
          created_by: string;
          department: string | null;
          doc_type: string;
          form_data: Json | null;
          grade: number | null;
          id: string;
          issue_no: string;
          issue_year: number;
          issued_on: string;
          meta: Json;
          remarks: string | null;
          status: string;
          students: Json;
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'document_issue';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      update_task_status: {
        Args: {
          p_changed_by: string;
          p_comment?: string;
          p_new_status: string;
          p_task_id: string;
        };
        Returns: boolean;
      };
      update_user_achievement_progress: {
        Args: { _achievement_id: string; _user_id: string };
        Returns: undefined;
      };
      update_volunteer_class_roster: {
        Args: {
          p_class: number;
          p_grade: number;
          p_issue_id: string;
          p_students: Json;
        };
        Returns: {
          class_number: number | null;
          created_at: string;
          created_by: string;
          department: string | null;
          doc_type: string;
          form_data: Json | null;
          grade: number | null;
          id: string;
          issue_no: string;
          issue_year: number;
          issued_on: string;
          meta: Json;
          remarks: string | null;
          status: string;
          students: Json;
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'document_issue';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      upsert_inquiry_analysis_cache: {
        Args: {
          p_cache_key: string;
          p_completion_tokens?: number;
          p_expires_at?: string;
          p_model: string;
          p_prompt_tokens?: number;
          p_result: Json;
          p_student_id: string;
        };
        Returns: undefined;
      };
      upsert_inquiry_recommendation_prepare: {
        Args: {
          p_current_grade: number;
          p_enrolled_subjects: Json;
          p_formula_version?: string;
          p_hygiene_findings?: Json;
          p_kg_version_id: string;
          p_metrics: Json;
          p_student_id: string;
          p_weaknesses: Json;
        };
        Returns: string;
      };
      user_can_access_meeting: {
        Args: { meeting_uuid: string; user_uuid: string };
        Returns: boolean;
      };
      user_can_access_section: {
        Args: { section_uuid: string; user_uuid: string };
        Returns: boolean;
      };
      validate_assignees_jsonb: { Args: { assignees: Json }; Returns: boolean };
      validate_migration_integrity: {
        Args: never;
        Returns: {
          actual_count: number;
          details: string;
          expected_count: number;
          status: string;
          validation_name: string;
        }[];
      };
      verify_kg_version_integrity: {
        Args: { p_student_id: string };
        Returns: {
          max_created_at: string;
          max_version: number;
          min_created_at: string;
          min_version: number;
          total_versions: number;
          versions_contiguous: boolean;
        }[];
      };
    };
    Enums: {
      app_role: 'admin' | 'moderator' | 'user' | 'teacher';
      rescue_audit_action: 'create' | 'update' | 'delete';
      rescue_role_kind: 'counselor' | 'staff_admin';
      rescue_status: 'open' | 'monitoring' | 'closed';
      rescue_visibility: 'team' | 'counselor_author' | 'author_only';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'moderator', 'user', 'teacher'],
      rescue_audit_action: ['create', 'update', 'delete'],
      rescue_role_kind: ['counselor', 'staff_admin'],
      rescue_status: ['open', 'monitoring', 'closed'],
      rescue_visibility: ['team', 'counselor_author', 'author_only'],
    },
  },
} as const;
