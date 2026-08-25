export type EventType = "duracion" | "instantaneo";
export type EventOrigin = "voz" | "boton";

export type Baby = {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  created_at: string;
};

export type Caregiver = {
  id: string;
  user_id: string;
  baby_id: string;
  nombre_display: string;
  created_at: string;
};

export type EventCategory = {
  id: string;
  baby_id: string;
  nombre: string;
  tipo: EventType;
  color: string;
  icono: string;
  activo: boolean;
  orden: number;
  created_at: string;
};

export type BabyEvent = {
  id: string;
  baby_id: string;
  category_id: string;
  caregiver_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  paused_seconds: number;
  paused_at: string | null;
  session_id: string | null;
  notas: string | null;
  origen: EventOrigin;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      babies: {
        Row: Baby;
        Insert: Partial<Baby> & { nombre: string; fecha_nacimiento: string };
        Update: Partial<Baby>;
        Relationships: [];
      };
      caregivers: {
        Row: Caregiver;
        Insert: Partial<Caregiver> & {
          user_id: string;
          baby_id: string;
          nombre_display: string;
        };
        Update: Partial<Caregiver>;
        Relationships: [
          {
            foreignKeyName: "caregivers_baby_id_fkey";
            columns: ["baby_id"];
            isOneToOne: false;
            referencedRelation: "babies";
            referencedColumns: ["id"];
          }
        ];
      };
      event_categories: {
        Row: EventCategory;
        Insert: Partial<EventCategory> & {
          baby_id: string;
          nombre: string;
          tipo: EventType;
        };
        Update: Partial<EventCategory>;
        Relationships: [
          {
            foreignKeyName: "event_categories_baby_id_fkey";
            columns: ["baby_id"];
            isOneToOne: false;
            referencedRelation: "babies";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: BabyEvent;
        Insert: Partial<BabyEvent> & {
          baby_id: string;
          category_id: string;
          caregiver_id: string;
        };
        Update: Partial<BabyEvent>;
        Relationships: [
          {
            foreignKeyName: "events_baby_id_fkey";
            columns: ["baby_id"];
            isOneToOne: false;
            referencedRelation: "babies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "event_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_caregiver_id_fkey";
            columns: ["caregiver_id"];
            isOneToOne: false;
            referencedRelation: "caregivers";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_caregiver_of_baby: {
        Args: { target_baby_id: string };
        Returns: boolean;
      };
    };
  };
};
