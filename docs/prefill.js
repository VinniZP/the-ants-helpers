const buildingToFill = [
  {
    id: "wet_soil_depot",
    depotType: "wet_soil",
    reqBuild: "wet_soil_pile",
    capacity: [
      30000, 50000, 100000, 200000, 300000, 400000, 500000, 700000, 1000000,
      2000000,
    ],
  },

  {
    id: "wet_soil_depot_2",
    depotType: "wet_soil",
    req: {
      queen: 13,
      wet_soil_depot: 10,
    },
    capacity: [
      2000000, 4000000, 6000000, 8000000, 10000000, 15000000, 25000000,
      35000000, 45000000, 55000000,
    ],
  },

  {
    id: "wet_soil_depot_3",
    depotType: "wet_soil",
    req: {
      queen: 20,
      wet_soil_depot_2: 10,
    },
    capacity: [
      20000000, 40000000, 60000000, 80000000, 100000000, 120000000, 140000000,
      160000000, 180000000, 200000000,
    ],
  },

  {
    id: "sand_depot",
    depotType: "sand",
    reqBuild: "sand_pile",
    capacity: [
      25000, 50000, 100000, 150000, 200000, 300000, 400000, 600000, 800000,
      1000000,
    ],
  },
  {
    id: "sand_depot_2",
    depotType: "sand",
    req: {
      queen: 13,
      sand_depot: 10,
    },
    capacity: [
      2000000, 4000000, 6000000, 8000000, 10000000, 12000000, 14000000,
      16000000, 18000000, 20000000,
    ],
  },
  {
    id: "sand_depot_3",
    depotType: "sand",
    req: {
      queen: 20,
      sand_depot_2: 10,
    },
    capacity: [
      10000000, 20000000, 30000000, 40000000, 55000000, 70000000, 85000000,
      100000000, 115000000, 130000000,
    ],
  },

  {
    id: "reservoir",
    reqBuild: "spring",
    depotType: "water",
    capacity: [
      30000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 800000,
      1000000,
    ],
  },
  {
    id: "reservoir_2",
    depotType: "water",
    req: {
      queen: 13,
      reservoir: 10,
    },
    capacity: [
      1000000, 2000000, 3000000, 4000000, 6000000, 9000000, 13000000, 17000000,
      21000000, 25000000,
    ],
  },
  {
    id: "reservoir_3",
    depotType: "water",
    req: {
      queen: 20,
      reservoir_2: 10,
    },
    capacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  {
    id: "plant_depot",
    depotType: "plant",
    reqBuild: "plant_flora",
    capacity: [
      30000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 800000,
      1000000,
    ],
  },
  {
    id: "plant_depot_2",
    depotType: "plant",
    req: {
      queen: 13,
      plant_depot: 10,
    },
    capacity: [
      1000000, 3000000, 5000000, 7000000, 9000000, 11000000, 13000000, 18000000,
      30000000, 45000000,
    ],
  },
  {
    id: "plant_depot_3",
    depotType: "plant",
    req: {
      queen: 20,
      plant_depot_2: 10,
    },
    capacity: [
      20000000, 40000000, 60000000, 80000000, 100000000, 120000000, 140000000,
      160000000, 180000000, 200000000,
    ],
  },

  {
    id: "meat_depot",
    depotType: "meat",
    reqBuild: "woodlouse_colony",
    capacity: [
      30000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 800000,
      1000000,
    ],
  },
  {
    id: "meat_depot_2",
    depotType: "meat",
    req: {
      queen: 13,
      meat_depot: 10,
    },
    capacity: [
      1000000, 2000000, 3000000, 4000000, 6000000, 9000000, 13000000, 17000000,
      21000000, 25000000,
    ],
  },
  {
    id: "meat_depot_3",
    depotType: "meat",
    req: {
      queen: 20,
      meat_depot_2: 10,
    },
    capacity: [
      10000000, 20000000, 30000000, 40000000, 60000000, 80000000, 100000000,
      120000000, 140000000, 160000000,
    ],
  },

  {
    id: "fungus_depot",
    depotType: "fungus",
    reqBuild: "leafcutter",
    capacity: [
      20000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 700000,
      1000000,
    ],
  },
  {
    id: "fungus_depot_2",
    depotType: "fungus",
    req: {
      queen: 13,
      fungus_depot: 10,
    },
    capacity: [
      2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 9000000,
      10000000, 11000000,
    ],
  },
  {
    id: "fungus_depot_3",
    depotType: "fungus",
    req: {
      queen: 20,
      fungus_depot_2: 10,
    },
    capacity: [
      5000000, 10000000, 15000000, 20000000, 25000000, 30000000, 35000000,
      40000000, 45000000, 50000000,
    ],
  },
];

import fs from "node:fs/promises";
import path from "node:path";

const currentDir = path.dirname(new URL(import.meta.url).pathname);

const fill = async () => {
  for (const building of buildingToFill) {
    const buildingPath = path.join(
      currentDir,
      "buildings",
      `${building.id}.json`
    );
    console.log("fill", buildingPath);
    const buildingData = await fs.readFile(buildingPath, "utf-8");
    const buildingJson = JSON.parse(buildingData);
    buildingJson.levels = buildingJson.levels
      .filter((level) => !isNaN(parseInt(level.level)) && level.level > 0)
      .map((level, index) => {
        return {
          ...level,
          depotCapacity: building.capacity[level.level - 1],
          requirements: building.req || { [building.reqBuild]: level.level },
        };
      });
    await fs.writeFile(buildingPath, JSON.stringify(buildingJson, null, 2));
  }
};

const cleanUpAllLevels = async () => {
  const buildingsPath = path.join(currentDir, "buildings");
  const buildings = await fs.readdir(buildingsPath);
  for (const building of buildings) {
    const buildingPath = path.join(buildingsPath, building);
    const buildingData = await fs.readFile(buildingPath, "utf-8");
    console.log("cleanUpAllLevels", buildingPath);
    const buildingJson = JSON.parse(buildingData);
    buildingJson.levels = buildingJson.levels.filter(
      (level) => !isNaN(parseInt(level.level)) && level.level > 0
    );
    await fs.writeFile(buildingPath, JSON.stringify(buildingJson, null, 2));
  }
};

const calculateDepotForQuantity = (resource, quantity) => {
  if (quantity === 0) return {};
  const depots = buildingToFill.filter(
    (building) => building.depotType === resource
  );
  const maxCapacityPerTier = depots.map(
    (depot) => depot.capacity[depot.capacity.length - 1]
  );
  console.log("maxCapacityPerTier", maxCapacityPerTier);
  const minCapacityPerTier = depots.map((depot) => depot.capacity[0]);
  console.log("minCapacityPerTier", minCapacityPerTier);

  minCapacityPerTier[1] += maxCapacityPerTier[0];
  minCapacityPerTier[2] += maxCapacityPerTier[1];

  let foundTier = 0;
  for (let i = 0; i < maxCapacityPerTier.length; i++) {
    if (quantity <= maxCapacityPerTier[i]) {
      foundTier = i;
      break;
    }
  }

  const additionalCapacity = depots.slice(0, foundTier).reduce((acc, depot) => {
    return acc + depot.capacity[depot.capacity.length - 1];
  }, 0);
  console.log("additionalCapacity", additionalCapacity);

  let foundDepotLevel = 0;
  for (let i = 0; i < depots.length; i++) {
    if (foundTier === i) {
      foundDepotLevel = depots[i].capacity.findIndex(
        (capacity) => additionalCapacity + capacity >= quantity
      );
      break;
    }
  }

  if (foundDepotLevel === 0 && foundTier === 0) {
    return {};
  }

  return { [depots[foundTier].id]: foundDepotLevel + 1 };
};

const addDepotDependency = async () => {
  const buildingsPath = path.join(currentDir, "buildings");
  const buildings = await fs.readdir(buildingsPath);
  for (const building of buildings) {
    const buildingPath = path.join(buildingsPath, building);
    console.log("addDepotDependency", buildingPath);
    const buildingData = await fs.readFile(buildingPath, "utf-8");
    const buildingJson = JSON.parse(buildingData);
    buildingJson.levels = buildingJson.levels.map((level) => {
      if (buildingJson.id === "queen") {
        delete level.requirements.queen;
      }

      const tier1depots = [
        "sand_depot",
        "wet_soil_depot",
        "plant_depot",
        "meat_depot",
        "fungus_depot",

        "sand_depot_2",
        "wet_soil_depot_2",
        "plant_depot_2",
        "meat_depot_2",
        "fungus_depot_2",

        "sand_depot_3",
        "wet_soil_depot_3",
        "plant_depot_3",
        "meat_depot_3",
        "fungus_depot_3",
      ];

      tier1depots.forEach((depot) => {
        delete level.requirements[depot];
      });

      return {
        ...level,
        requirements: {
          ...level.requirements,

          ...(level.meat ? calculateDepotForQuantity("meat", level.meat) : {}),
          ...(level.fungus
            ? calculateDepotForQuantity("fungus", level.fungus)
            : {}),
          ...(level.plant
            ? calculateDepotForQuantity("plant", level.plant)
            : {}),
          ...(level.wet_soil
            ? calculateDepotForQuantity("wet_soil", level.wet_soil)
            : {}),
          ...(level.sand ? calculateDepotForQuantity("sand", level.sand) : {}),
          ...(level.water
            ? calculateDepotForQuantity("water", level.water)
            : {}),
        },
      };
    });
    await fs.writeFile(buildingPath, JSON.stringify(buildingJson, null, 2));
  }
};

const main = async () => {
  await cleanUpAllLevels();
  await addDepotDependency();
  await fill();
};

main();

// console.log(calculateDepotForQuantity("sand", 38000));
