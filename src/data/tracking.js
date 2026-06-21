// Analytics / verification configuration.
// Leave values EMPTY until the owner provides real IDs. Scripts/tags are only
// injected when a real value is present, so no fake IDs ever ship.
//
// You can also override these at build time with environment variables:
//   VITE_GA4_MEASUREMENT_ID, VITE_GOOGLE_SITE_VERIFICATION, VITE_CLARITY_PROJECT_ID

export const TRACKING = {
  // e.g. "G-XXXXXXXXXX"
  ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
  // Google Search Console HTML tag verification content value
  googleSiteVerification: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || '',
  // Microsoft Clarity project id
  clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID || ''
}

export const hasGA4 = Boolean(TRACKING.ga4MeasurementId)
export const hasClarity = Boolean(TRACKING.clarityProjectId)
export const hasSiteVerification = Boolean(TRACKING.googleSiteVerification)
