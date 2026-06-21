import { useEffect } from 'react'

const GA_MEASUREMENT_ID = 'G-VDY4MDK378'

// Initialize gtag if not already loaded
if (typeof window !== 'undefined' && !window.gtag) {
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
}

/**
 * Custom hook for Google Analytics 4 event tracking
 * Provides a clean interface to track events without affecting performance
 */
export function useAnalytics() {
  /**
   * Track a custom event
   * @param {string} eventName - The event name (e.g., 'book_now_click')
   * @param {Object} eventParams - Event parameters (e.g., { package: 'power' })
   */
  const trackEvent = (eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams)
    }
  }

  /**
   * Track page view (automatically called by App.jsx)
   * @param {string} pagePath - The page path (e.g., '/booking')
   * @param {string} pageTitle - The page title
   */
  const trackPageView = (pagePath, pageTitle) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        send_to: GA_MEASUREMENT_ID
      })
    }
  }

  return { trackEvent, trackPageView }
}

/**
 * Track a "Book Now" button click
 * @param {Object} params - Optional parameters like { location: 'homepage' }
 */
export function trackBookNowClick(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'book_now_click', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track booking form submission
 * @param {Object} params - Booking details like { package: 'power', total_price: 45 }
 */
export function trackBookingSubmission(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_submission', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track reward card registration
 * @param {Object} params - Optional parameters like { card_id: 'RCC-1001' }
 */
export function trackRewardRegistration(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'reward_card_registration', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track reward card share
 * @param {Object} params - Optional parameters like { method: 'whatsapp' }
 */
export function trackRewardShare(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'reward_card_share', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track call button click
 * @param {Object} params - Optional parameters like { location: 'header' }
 */
export function trackCallClick(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'call_click', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track email click
 * @param {Object} params - Optional parameters like { location: 'contact' }
 */
export function trackEmailClick(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'email_click', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track contact form submission
 * @param {Object} params - Optional parameters like { inquiry_type: 'general' }
 */
export function trackContactSubmission(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'contact_submission', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track package selection
 * @param {Object} params - Package details like { package_id: 'power', package_name: 'Power Play' }
 */
export function trackPackageSelection(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'package_selection', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}

/**
 * Track menu interaction
 * @param {Object} params - Menu details like { category: 'Hot Drinks', item: 'Latte' }
 */
export function trackMenuInteraction(params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'menu_interaction', {
      send_to: GA_MEASUREMENT_ID,
      ...params
    })
  }
}
