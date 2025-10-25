export const mockData = {
  id: "RC-MOCK-" + Date.now(),
  customerName: "Alex Johnson",
  customerEmail: "alex.j@example.com",
  customerPhone: "(555) 234-5678",
  vehicleMake: "Tesla",
  vehicleModel: "Model 3",
  vehicleYear: "2022",
  licensePlate: "TESLA1",
  lastServiceDate: "2023-11-20",
  nextServiceDate: "2024-05-20",
  serviceHistory: [
    { date: "2023-11-20", service: "Software Update", cost: "$0.00" },
    { date: "2023-08-15", service: "Tire Rotation", cost: "$99.99" },
  ],
  status: "Active",
};
