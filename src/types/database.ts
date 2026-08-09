export type EventType = "duracion" | "instantaneo";
export type EventOrigin = "voz" | "boton";

export interface Baby {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  created_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  baby_id: string;
  nombre_display: string;
  created_at: string;
}

export interface EventCategory {
  id: string;
  baby_id: string;
  nombre: string;
  tipo: EventType;
  color: string;
  icono: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface BabyEvent {
  id: string;
  baby_id: string;
  category_id: string;
  caregiver_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notas: string | null;
  origen: EventOrigin;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      babies: {
        Row: Baby;
        Insert: Partial<Baby> & { nombre: string; fecha_nacimiento: string };
        Update: Partial<Baby>;
      };
      caregivers: {
        Row: Caregiver;
        Insert: Partial<Caregiver> & {
          user_id: string;
          baby_id: string;
          nombre_display: string;
        };
        Update: Partial<Caregiver>;
      };
      event_categories: {
        Row: EventCategory;
        Insert: Partial<EventCategory> & {
          baby_id: string;
          nombre: string;
          tipo: EventType;
        };
        Update: Partial<EventCategory>;
      };
      events: {
        Row: BabyEvent;
        Insert: Partial<BabyEvent> & {
          baby_id: string;
          category_id: string;
          caregiver_id: string;
        };
        Update: Partial<BabyEvent>;
      };
    };
  };
}
