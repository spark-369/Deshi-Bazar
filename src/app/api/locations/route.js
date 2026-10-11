import { NextResponse } from "next/server";
import {
  COUNTRY,
  getDivisions,
  getDistricts,
  getPostalCodes,
} from "@/lib/bangladeshLocations";

// GET /api/locations
// Returns the Bangladesh administrative hierarchy used for address dropdowns.
// Query params:
//   division  -> returns districts for that division
//   district  -> returns postal codes for that division+district (requires division)
// All core location logic is handled here on the backend.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get("division");
    const district = searchParams.get("district");

    if (division && district) {
      return NextResponse.json({
        country: COUNTRY,
        division,
        district,
        postalCodes: getPostalCodes(division, district),
      });
    }

    if (division) {
      return NextResponse.json({
        country: COUNTRY,
        division,
        districts: getDistricts(division),
      });
    }

    return NextResponse.json({
      country: COUNTRY,
      divisions: getDivisions(),
    });
  } catch (error) {
    console.error("Get locations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}
