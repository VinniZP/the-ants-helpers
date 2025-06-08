export interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: string; // Format: "HH:MM"
  date?: string; // Format: "YYYY-MM-DD" or null for daily
  isDaily: boolean;
  isActive: boolean;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  category?: string;
}

export interface PredefinedEvent {
  id: string;
  title: string;
  time: string; // Format: "HH:MM"
  description?: string;
  category: "work" | "personal" | "health" | "other";
  isTemplate: boolean;
}

export interface NotificationSchedule {
  id: string;
  reminderId: string;
  reminderType: "game" | "custom"; // New field to distinguish types
  scheduledTime: Date;
  title: string;
  body: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: "light" | "dark" | "system";
  timeZone: string; // User's timezone for UTC conversion
  lastSync: Date;
}

export interface ViewFilter {
  date?: string;
  category?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  reminderType?: "game" | "custom" | "all";
}

export type NavigationTab = "today" | "schedule" | "custom" | "settings";

export interface SwipeAction {
  type: "delete" | "complete" | "edit" | "toggle";
  reminderId: string;
  reminderType: "game" | "custom";
}

// Game event types
export interface GameEvent {
  utc_time: string; // Format: "HH:MM"
  days: {
    [dayName: string]: {
      // Russian day names as keys
      text: string;
      color: string;
      meaning: string;
      raspberry?: boolean; // Optional raspberry flag
    };
  };
}

export interface GameEventReminder {
  id: string;
  utc_time: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  title: string; // from text field
  description: string; // from meaning field
  color: string;
  raspberry?: boolean; // Optional raspberry flag
  isEnabled: boolean;
  isWeeklyRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomReminder {
  id: string;
  title: string;
  description?: string;
  time: string; // Format: "HH:MM"
  date?: string; // Format: "YYYY-MM-DD" or null for recurring
  recurrence: "once" | "daily" | "weekly" | "hourly";
  isActive: boolean;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  category?: string;
}

// Legacy type for backward compatibility during migration
export interface Reminder extends CustomReminder {}

type BuildingId =
  | "queen"
  | "worker_ant_nest"
  | "woodlouse_colony"
  | "wet_soil_pile"
  | "wet_soil_depot"
  | "wet_soil_depot_2"
  | "wet_soil_depot_3"
  | "trophy_storeroom"
  | "troop_tunnel"
  | "treasure_depot"
  | "toxic_fungi"
  | "termite_farm"
  | "supreme_native_fungi"
  | "spring"
  | "special_nest"
  | "special_ant_habitat"
  | "soldiers_reform_pool"
  | "shooter_ant_nest"
  | "sentinel_tree"
  | "sand_pile"
  | "sand_depot"
  | "sand_depot_2"
  | "sand_depot_3"
  | "resource_tunnel"
  | "resource_factory"
  | "reservoir"
  | "reservoir_2"
  | "reservoir_3"
  | "rally_center_i"
  | "rally_center_ii"
  | "rally_center_iii"
  | "pro_rally_center"
  | "plant_flora"
  | "plant_depot"
  | "plant_depot_2"
  | "plant_depot_3"
  | "native_fungi"
  | "mutation_pool"
  | "mutation_flora"
  | "meat_depot"
  | "meat_depot_2"
  | "meat_depot_3"
  | "leafcutter"
  | "ladybug_habitat"
  | "insect_nest"
  | "insect_habitat"
  | "healing_pool"
  | "guardian_ant_nest"
  | "fungus_depot"
  | "fungus_depot_2"
  | "fungus_depot_3"
  | "feeding_ground"
  | "evolution_fungi"
  | "entrance"
  | "construction_center"
  | "cocoon_medium"
  | "carrier_ant_nest"
  | "aphid"
  | "alliance_center";

export interface Building {
  id: BuildingId;
  depotType?: "meat" | "fungus" | "plant" | "wet_soil" | "sand" | "water";
  levels: {
    depotCapacity?: number;
    level: number;
    meat: number;
    fungus: number;
    plant: number;
    wet_soil: number;
    sand: number;
    diamonds: number;
    power: number;
    power_delta: number;
    population: number;
    honeydew: number;
    time: number;
    notes: string;
    requirements: Record<BuildingId, number>;
  }[];
  warns: string[];
}
