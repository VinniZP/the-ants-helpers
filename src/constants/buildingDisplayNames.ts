import type { Building } from "../data/types";

// Extract BuildingId type from Building interface
type BuildingId = Building["id"];

// Human-readable display names for building IDs
export const BUILDING_DISPLAY_NAMES: Record<BuildingId, string> = {
  // Royal Buildings
  queen: "Queen",

  // Ant Nests
  worker_ant_nest: "Worker Ant Nest",
  shooter_ant_nest: "Shooter Ant Nest",
  guardian_ant_nest: "Guardian Ant Nest",
  carrier_ant_nest: "Carrier Ant Nest",

  // Special Buildings
  special_nest: "Special Nest",
  special_ant_habitat: "Special Ant Habitat",

  // Resource Storage - Meat
  meat_depot: "Meat Depot",
  meat_depot_2: "Meat Depot II",
  meat_depot_3: "Meat Depot III",

  // Resource Storage - Fungus
  fungus_depot: "Fungus Depot",
  fungus_depot_2: "Fungus Depot II",
  fungus_depot_3: "Fungus Depot III",

  // Resource Storage - Plant
  plant_depot: "Plant Depot",
  plant_depot_2: "Plant Depot II",
  plant_depot_3: "Plant Depot III",

  // Resource Storage - Wet Soil
  wet_soil_depot: "Wet Soil Depot",
  wet_soil_depot_2: "Wet Soil Depot II",
  wet_soil_depot_3: "Wet Soil Depot III",

  // Resource Storage - Sand
  sand_depot: "Sand Depot",
  sand_depot_2: "Sand Depot II",
  sand_depot_3: "Sand Depot III",

  // Resource Storage - Water
  reservoir: "Reservoir",
  reservoir_2: "Reservoir II",
  reservoir_3: "Reservoir III",

  // Resource Production
  wet_soil_pile: "Wet Soil Pile",
  sand_pile: "Sand Pile",
  plant_flora: "Plant Flora",
  spring: "Spring",

  // Fungus Buildings
  native_fungi: "Native Fungi",
  supreme_native_fungi: "Supreme Native Fungi",
  evolution_fungi: "Evolution Fungi",
  toxic_fungi: "Toxic Fungi",

  // Mutation Buildings
  mutation_pool: "Mutation Pool",
  mutation_flora: "Mutation Flora",

  // Combat Buildings
  soldiers_reform_pool: "Soldiers Reform Pool",
  troop_tunnel: "Troop Tunnel",

  // Rally Centers
  rally_center_i: "Rally Center I",
  rally_center_ii: "Rally Center II",
  rally_center_iii: "Rally Center III",
  pro_rally_center: "Pro Rally Center",

  // Creature Buildings
  woodlouse_colony: "Woodlouse Colony",
  termite_farm: "Termite Farm",
  ladybug_habitat: "Ladybug Habitat",
  aphid: "Aphid",
  leafcutter: "Leafcutter",

  // Infrastructure
  construction_center: "Construction Center",
  entrance: "Entrance",
  sentinel_tree: "Sentinel Tree",
  resource_tunnel: "Resource Tunnel",
  resource_factory: "Resource Factory",

  // Other Buildings
  feeding_ground: "Feeding Ground",
  healing_pool: "Healing Pool",
  insect_nest: "Insect Nest",
  insect_habitat: "Insect Habitat",
  cocoon_medium: "Cocoon Medium",
  trophy_storeroom: "Trophy Storeroom",
  treasure_depot: "Treasure Depot",
  alliance_center: "Alliance Center",
};

// Building categories for organization
export const BUILDING_CATEGORIES = {
  ROYAL: ["queen"],
  ANT_NESTS: [
    "worker_ant_nest",
    "shooter_ant_nest",
    "guardian_ant_nest",
    "carrier_ant_nest",
    "special_nest",
    "special_ant_habitat",
  ],
  STORAGE: [
    "meat_depot",
    "meat_depot_2",
    "meat_depot_3",
    "fungus_depot",
    "fungus_depot_2",
    "fungus_depot_3",
    "plant_depot",
    "plant_depot_2",
    "plant_depot_3",
    "wet_soil_depot",
    "wet_soil_depot_2",
    "wet_soil_depot_3",
    "sand_depot",
    "sand_depot_2",
    "sand_depot_3",
    "reservoir",
    "reservoir_2",
    "reservoir_3",
  ],
  PRODUCTION: ["wet_soil_pile", "sand_pile", "plant_flora", "spring"],
  FUNGUS: [
    "native_fungi",
    "supreme_native_fungi",
    "evolution_fungi",
    "toxic_fungi",
  ],
  MUTATION: ["mutation_pool", "mutation_flora"],
  COMBAT: [
    "soldiers_reform_pool",
    "troop_tunnel",
    "rally_center_i",
    "rally_center_ii",
    "rally_center_iii",
    "pro_rally_center",
  ],
  CREATURES: [
    "woodlouse_colony",
    "termite_farm",
    "ladybug_habitat",
    "aphid",
    "leafcutter",
  ],
  INFRASTRUCTURE: [
    "construction_center",
    "entrance",
    "sentinel_tree",
    "resource_tunnel",
    "resource_factory",
  ],
  OTHER: [
    "feeding_ground",
    "healing_pool",
    "insect_nest",
    "insect_habitat",
    "cocoon_medium",
    "trophy_storeroom",
    "treasure_depot",
    "alliance_center",
  ],
} as const;

// Helper function to get building display name
export function getBuildingDisplayName(buildingId: BuildingId): string {
  return BUILDING_DISPLAY_NAMES[buildingId] || buildingId;
}

// Helper function to get building category
export function getBuildingCategory(buildingId: BuildingId): string {
  for (const [category, buildings] of Object.entries(BUILDING_CATEGORIES)) {
    if ((buildings as readonly string[]).includes(buildingId)) {
      return category;
    }
  }
  return "OTHER";
}

// Get buildings by category
export function getBuildingsByCategory(
  category: keyof typeof BUILDING_CATEGORIES
): readonly BuildingId[] {
  return BUILDING_CATEGORIES[category] as readonly BuildingId[];
}

// Get all buildings with their display names for dropdown/search
export function getAllBuildingsWithNames(): Array<{
  id: BuildingId;
  name: string;
  category: string;
}> {
  return Object.entries(BUILDING_DISPLAY_NAMES).map(([id, name]) => ({
    id: id as BuildingId,
    name,
    category: getBuildingCategory(id as BuildingId),
  }));
}
