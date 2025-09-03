export const sample = {
  clients: [
    { id: 101, fullName: 'Ravi Kumar', phone: '9876543210', email: 'ravi.k@example.com', address: 'Bangalore, KA', vehicleMake: 'Hyundai', vehicleModel: 'i20', vehicleYear: 2019, regNumber: 'KA05AB1234', vin: 'HYD12345' },
    { id: 102, fullName: 'Sneha Reddy', phone: '9123456780', email: 'sneha.r@example.com', address: 'Hyderabad, TS', vehicleMake: 'Honda', vehicleModel: 'City', vehicleYear: 2021, regNumber: 'TS09XY4567', vin: 'HON56789' },
    { id: 103, fullName: 'Arjun Mehta', phone: '9988776655', email: 'arjun.m@example.com', address: 'Mumbai, MH', vehicleMake: 'Maruti Suzuki', vehicleModel: 'Swift', vehicleYear: 2018, regNumber: 'MH12CD7890', vin: 'MSZ34567' },
  ],
  services: [
    { id: 1001, customerId: 101, date: '2025-08-01', type: 'Oil Change', partsCost: 1500, laborCost: 800, status: 'Paid' },
    { id: 1002, customerId: 102, date: '2025-08-18', type: 'Brake Replacement', partsCost: 4000, laborCost: 1800, status: 'Unpaid' },
    { id: 1003, customerId: 103, date: '2025-08-24', type: 'Engine Tune-Up', partsCost: 2500, laborCost: 1800, status: 'Paid' }
  ],
  billing: [
    { id: 'INV101', date: '2025-08-01', customerId: 101, description: 'Oil Change', partsCost: 1500, laborCost: 800, taxes: 200, discounts: 0, total: 2500, mode: 'UPI' },
    { id: 'INV102', date: '2025-08-15', customerId: 102, description: 'Brake Replacement', partsCost: 4000, laborCost: 1800, taxes: 200, discounts: 0, total: 6000, mode: 'Card' },
    { id: 'INV103', date: '2025-08-20', customerId: 103, description: 'Engine Tune-Up', partsCost: 2500, laborCost: 1800, taxes: 200, discounts: 100, total: 4500, mode: 'Cash' }
  ],
  reminders: [
    { id: 1, customerId: 101, nextService: '2026-02-01', insuranceRenewal: '2026-05-01', warrantyExpiry: '2027-01-01', notify: 'SMS' },
    { id: 2, customerId: 102, nextService: '2026-02-15', insuranceRenewal: '2026-06-10', warrantyExpiry: '2027-03-01', notify: 'Email' },
    { id: 3, customerId: 103, nextService: '2026-02-20', insuranceRenewal: '2026-04-25', warrantyExpiry: '2026-12-31', notify: 'WhatsApp' }
  ],
  meta: { clientSeq: 104, serviceSeq: 1004, reminderSeq: 4 }
}