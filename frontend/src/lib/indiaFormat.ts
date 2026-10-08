/**
 * India Tech Market Currency & Location Formatting Utilities
 */

export function formatINR(val: number): string {
  if (!val || isNaN(val)) return "₹0 LPA";
  // Value is in annual base salary INR
  const lpa = val / 100000;
  return `₹${lpa.toFixed(1)} LPA`;
}

export function formatINRShort(val: number): string {
  if (!val || isNaN(val)) return "₹0L";
  const lpa = val / 100000;
  return `₹${lpa.toFixed(1)}L`;
}

export function formatINRFull(val: number): string {
  if (!val || isNaN(val)) return "₹0";
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export const INDIAN_TECH_HUBS = [
  { city: "Bengaluru", state: "Karnataka", tag: "Silicon Valley of India" },
  { city: "Hyderabad", state: "Telangana", tag: "Cyberabad / HITEC City" },
  { city: "Pune", state: "Maharashtra", tag: "Oxford of the East & Auto-IT" },
  { city: "Gurugram", state: "Haryana", tag: "NCR Fintech & Unicorns" },
  { city: "Noida", state: "Uttar Pradesh", tag: "NCR Cloud & Enterprise Hub" },
  { city: "Mumbai", state: "Maharashtra", tag: "Financial Tech Capital" },
  { city: "Chennai", state: "Tamil Nadu", tag: "SaaS & DeepTech Capital" },
  { city: "Remote (India)", state: "Pan-India", tag: "Distributed Tech Hub" },
];
