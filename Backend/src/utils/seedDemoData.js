const { transaction, connectDatabase, closeDatabase } = require("../database/postgres");

const bases = [
  { name: "Alpha", code: "ALPHA", region: "Northern District" },
  { name: "Bravo", code: "BRAVO", region: "Central District" },
  { name: "Charlie", code: "CHARLIE", region: "Western District" },
];
const inventory = [
  { name: "Armored Truck", category: "Vehicle", unit: "vehicles", balances: [6, 5, 4] },
  { name: "Recon Jeep", category: "Vehicle", unit: "vehicles", balances: [8, 7, 5] },
  { name: "M4 Carbine", category: "Weapon", unit: "weapons", balances: [150, 110, 90] },
  { name: "5.56mm Ammo", category: "Ammunition", unit: "rounds", balances: [5000, 4200, 3200] },
];

async function seedDemoData() {
  await connectDatabase();
  await transaction(async (client) => {
    for (let index = 0; index < bases.length; index += 1) {
      const baseData = bases[index];
      const baseResult = await client.query(
        `INSERT INTO bases (name, code, region, active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
         RETURNING id`,
        [baseData.name, baseData.code, baseData.region],
      );
      const baseId = baseResult.rows[0].id;

      for (const item of inventory) {
        const categoryCode =
          item.category === "Vehicle" ? "VEH" : item.category === "Weapon" ? "WPN" : "AMM";
        const assetTag = `${baseData.code.slice(0, 3)}-${categoryCode}-${item.name
          .replace(/[^A-Z0-9]/gi, "")
          .toUpperCase()
          .slice(0, 5)}`;
        await client.query(
          `INSERT INTO equipment (name, asset_tag, category, unit, opening_balance, base_id, active)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE)
           ON CONFLICT (asset_tag) DO NOTHING`,
          [item.name, assetTag, item.category, item.unit, item.balances[index], baseId],
        );
      }
    }
  });
  console.log("Demo bases and equipment are ready (existing records were preserved).");
}

seedDemoData()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
