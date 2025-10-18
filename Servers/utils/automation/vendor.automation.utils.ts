// Build replacement dict for vendor
export function buildVendorReplacements(vendor: any): Record<string, any> {
  return {
    'vendor.name': vendor.vendor_name,
    'vendor.id': vendor.id,
    'vendor.provides': vendor.vendor_provides,
    'vendor.website': vendor.website,
    'vendor.contact': vendor.vendor_contact_person,
    'date_and_time': new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  };
}
