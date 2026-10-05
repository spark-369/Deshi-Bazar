// Reusable address display that shows structured address fields separately.
// Falls back to the legacy composed `shippingAddress` string when the
// structured fields are not present.
// Renders a Fragment (no wrapper element) so it can be safely nested inside
// a <p> or any other element without causing hydration errors.

export default function AddressDisplay({ order, type = "shipping", className = "" }) {
  const prefix = type === "billing" ? "billing" : "ship";
  const country = order?.[`${prefix}Country`];
  const division = order?.[`${prefix}Division`];
  const district = order?.[`${prefix}District`];
  const postalCode = order?.[`${prefix}PostalCode`];
  const street =
    order?.[`${prefix}Address`] ||
    (type === "billing" ? order?.billingAddress : order?.shippingAddress);

  const hasStructured = country || division || district || postalCode || street;

  if (!hasStructured) {
    return <>{order?.shippingAddress || "Not provided"}</>;
  }

  return (
    <>
      {street && <>{street}<br /></>}
      {[district, division].filter(Boolean).join(", ")}
      {postalCode ? ` - ${postalCode}` : ""}
      {country && (
        <>
          <br />
          {country}
        </>
      )}
    </>
  );
}
