// Build replacement dict for vendor
export function buildVendorReplacements(vendor: any): Record<string, any> {
  const _reviewDate = new Date(vendor.review_date);
  _reviewDate.setHours(0, 0, 0, 0);
  const reviewDate = _reviewDate.toLocaleDateString('en-US', { dateStyle: 'long' });
  return {
    'vendor.name': vendor.vendor_name,
    'vendor.id': vendor.id,
    'vendor.provides': vendor.vendor_provides,
    'vendor.website': vendor.website,
    'vendor.contact': vendor.vendor_contact_person,
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    }),
    'vendor.review_date': reviewDate,
    'vendor.reviewer': vendor.reviewer_name
  };
}
