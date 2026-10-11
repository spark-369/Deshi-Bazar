// Bangladesh administrative hierarchy served from the backend.
// Structure: 8 Divisions -> Districts -> Postal Codes.
// This is the single source of truth for the location dropdowns across the app.
// The street address itself is free-text and provided by the user.

export const COUNTRY = "Bangladesh";

export const BANGLADESH_LOCATIONS = {
  Dhaka: {
    "Dhaka": ["1205", "1207", "1208", "1209", "1212", "1213", "1216", "1217", "1219", "1229", "1230"],
    "Narayanganj": ["1400", "1401", "1410", "1421", "1460"],
    "Gazipur": ["1700", "1701", "1711", "1712", "1750"],
    "Narsingdi": ["1600", "1601", "1610"],
    "Tangail": ["1900", "1901", "1902", "1940"],
    "Kishoreganj": ["2300", "2301", "2340"],
    "Manikganj": ["1800", "1801", "1840"],
    "Munshiganj": ["1500", "1501", "1540"],
    "Faridpur": ["7800", "7801", "7840"],
    "Gopalganj": ["8100", "8101", "8140"],
    "Madaripur": ["7900", "7901"],
    "Rajbari": ["7700", "7701"],
    "Shariatpur": ["8000", "8001"],
  },
  Chittagong: {
    "Chittagong": ["4000", "4001", "4100", "4200", "4203", "4216", "4219", "4220", "4310", "4370"],
    "Cox's Bazar": ["4700", "4701", "4702", "4750", "4760"],
    "Comilla": ["3500", "3501", "3502", "3570"],
    "Feni": ["3900", "3901", "3940"],
    "Noakhali": ["3800", "3801", "3810"],
    "Brahmanbaria": ["3400", "3401", "3440"],
    "Chandpur": ["3600", "3601"],
    "Lakshmipur": ["3700", "3701"],
    "Rangamati": ["4500", "4501"],
    "Khagrachhari": ["4400", "4401"],
    "Bandarban": ["4600", "4601"],
  },
  Khulna: {
    "Khulna": ["9000", "9001", "9100", "9200", "9210"],
    "Jessore": ["7400", "7401", "7402", "7300"],
    "Kushtia": ["7000", "7001", "7040"],
    "Satkhira": ["9400", "9401"],
    "Bagerhat": ["9300", "9301"],
    "Chuadanga": ["7200", "7201"],
    "Meherpur": ["7100", "7101"],
    "Narail": ["7500", "7501"],
    "Magura": ["7600", "7601"],
  },
  Rajshahi: {
    "Rajshahi": ["6000", "6001", "6100", "6200", "6201"],
    "Bogra": ["5800", "5801", "5840", "5841"],
    "Pabna": ["6600", "6601"],
    "Natore": ["6400", "6401"],
    "Chapai Nawabganj": ["6300", "6301"],
    "Naogaon": ["6500", "6501"],
    "Joypurhat": ["5900", "5901"],
    "Sirajganj": ["6700", "6701"],
  },
  Sylhet: {
    "Sylhet": ["3100", "3101", "3102", "3140", "3180"],
    "Moulvibazar": ["3200", "3201"],
    "Habiganj": ["3300", "3301"],
    "Sunamganj": ["3000", "3001"],
  },
  Barisal: {
    "Barisal": ["8200", "8201", "8240"],
    "Patuakhali": ["8600", "8601"],
    "Pirojpur": ["8500", "8501"],
    "Bhola": ["8300", "8301"],
    "Barguna": ["8700", "8701"],
    "Jhalokati": ["8400", "8401"],
  },
  Rangpur: {
    "Rangpur": ["5400", "5401", "5440"],
    "Dinajpur": ["5200", "5201"],
    "Kurigram": ["5600", "5601"],
    "Lalmonirhat": ["5500", "5501"],
    "Nilphamari": ["5300", "5301"],
    "Panchagarh": ["5000", "5001"],
    "Thakurgaon": ["5100", "5101"],
    "Gaibandha": ["5700", "5701"],
  },
  Mymensingh: {
    "Mymensingh": ["2200", "2201", "2240"],
    "Jamalpur": ["2000", "2001"],
    "Netrokona": ["2400", "2401"],
    "Sherpur": ["2100", "2101"],
  },
};

// Helper: get all divisions
export function getDivisions() {
  return Object.keys(BANGLADESH_LOCATIONS);
}

// Helper: get districts for a division
export function getDistricts(division) {
  if (!division || !BANGLADESH_LOCATIONS[division]) return [];
  return Object.keys(BANGLADESH_LOCATIONS[division]);
}

// Helper: get postal codes for a given division/district
export function getPostalCodes(division, district) {
  if (!division || !district) return [];
  const districts = BANGLADESH_LOCATIONS[division];
  if (!districts || !districts[district]) return [];
  return districts[district];
}

export default BANGLADESH_LOCATIONS;
