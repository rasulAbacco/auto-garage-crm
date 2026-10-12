// server/puncher/services/catalog.service.js
/* =========================================================
   🛞 PUNCHER SHOP SERVICE CATALOG
   Default prices are suggestions only — the shop can edit the
   price on every service entry.
========================================================= */

export const VEHICLE_TYPES = ["CAR", "BIKE"];
export const VEHICLE_SUPPORT = ["CAR", "BIKE", "BOTH"];

export const SERVICE_CATALOG = [
  { key: "PUNCTURE_TUBELESS", name: "Tubeless Puncture Repair", prices: { CAR: 150, BIKE: 80 } },
  { key: "PUNCTURE_TUBE", name: "Tube Puncture Repair", prices: { CAR: 200, BIKE: 60 } },
  { key: "PATCH_REPAIR", name: "Patch / Mushroom Repair", prices: { CAR: 250, BIKE: 120 } },
  { key: "TUBE_REPLACEMENT", name: "Tube Replacement", prices: { CAR: 600, BIKE: 250 } },
  { key: "TYRE_REPLACEMENT", name: "Tyre Fitting / Replacement", prices: { CAR: 300, BIKE: 150 } },
  { key: "VALVE_REPLACEMENT", name: "Valve Replacement", prices: { CAR: 100, BIKE: 50 } },
  { key: "AIR_FILL", name: "Air Filling", prices: { CAR: 20, BIKE: 10 } },
  { key: "NITROGEN_FILL", name: "Nitrogen Filling", prices: { CAR: 100, BIKE: 50 } },
  { key: "WHEEL_BALANCING", name: "Wheel Balancing", prices: { CAR: 300, BIKE: 150 } },
  { key: "WHEEL_ALIGNMENT", name: "Wheel Alignment", prices: { CAR: 500 } },
  { key: "TYRE_ROTATION", name: "Tyre Rotation", prices: { CAR: 200 } },
  { key: "STEPNEY_CHECK", name: "Spare (Stepney) Check", prices: { CAR: 50 } },
  { key: "CUSTOM", name: "Other Service", prices: { CAR: 0, BIKE: 0 } },
];

export const TYRE_POSITIONS = {
  CAR: ["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT", "SPARE", "ALL"],
  BIKE: ["FRONT", "REAR", "BOTH"],
};

/** Vehicle types this shop is allowed to work on */
export const allowedVehicleTypes = (vehicleSupport = "BOTH") =>
  vehicleSupport === "BOTH" ? ["CAR", "BIKE"] : [vehicleSupport];

/** Catalog filtered to what the shop supports */
export function getCatalogFor(vehicleSupport = "BOTH") {
  const types = allowedVehicleTypes(vehicleSupport);
  return {
    vehicleTypes: types,
    tyrePositions: Object.fromEntries(types.map((t) => [t, TYRE_POSITIONS[t]])),
    services: SERVICE_CATALOG.filter((s) =>
      types.some((t) => s.prices[t] !== undefined),
    ).map((s) => ({
      key: s.key,
      name: s.name,
      prices: Object.fromEntries(
        Object.entries(s.prices).filter(([t]) => types.includes(t)),
      ),
    })),
  };
}

export function findCatalogService(key) {
  return SERVICE_CATALOG.find((s) => s.key === key) || null;
}
