import {
  Activity, Bell, BookOpen, CalendarDays, Contact, FileText, Gift, Image, LayoutDashboard,
  MenuSquare, QrCode, Search, Settings, Tags, Users, Utensils
} from 'lucide-react'

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Admin / Manager',
  staff: 'Staff'
}

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'manager', 'staff'] },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays, roles: ['super_admin', 'admin', 'manager', 'staff'] },
  { to: '/admin/customers', label: 'Customers', icon: Contact, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/rewards/scanner', label: 'Scanner', icon: QrCode, roles: ['super_admin', 'admin', 'manager', 'staff'] },
  { to: '/admin/offers', label: 'Offers', icon: Tags, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/menu', label: 'Menu', icon: Utensils, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/media', label: 'Media', icon: Image, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/content', label: 'Content', icon: FileText, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/seo', label: 'SEO', icon: Search, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/leads', label: 'Leads', icon: BookOpen, roles: ['super_admin', 'admin', 'manager'] },
  { to: '/admin/bookings/settings', label: 'Booking Settings', icon: CalendarDays, roles: ['super_admin'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['super_admin'] },
  { to: '/admin/diagnostics', label: 'Diagnostics', icon: Activity, roles: ['super_admin', 'admin'] }
]

export const MODULE_CONFIG = {
  customers: {
    title: 'Customers', description: 'Customer directory and reward membership details.', table: 'customers',
    icon: Contact, roles: ['super_admin', 'admin', 'manager'], search: ['full_name', 'mobile', 'email'],
    columns: [['full_name', 'Customer'], ['mobile', 'Mobile'], ['email', 'Email'], ['customer_type', 'Type'], ['created_at', 'Joined']],
    fields: [['full_name', 'Full Name', 'text'], ['mobile', 'Mobile', 'tel'], ['email', 'Email', 'email'], ['date_of_birth', 'DOB', 'date'], ['customer_type', 'Customer Type', 'text']]
  },
  rewards: {
    title: 'Reward Cards', description: 'Reward members, stamp progress and current cycles.', table: 'reward_cards',
    icon: Gift, roles: ['super_admin', 'admin', 'manager'], search: ['rcc_card_id', 'full_name', 'mobile'],
    columns: [['rcc_card_id', 'Card ID'], ['full_name', 'Customer'], ['current_stamps', 'Stamps'], ['cycle_number', 'Cycle'], ['reward_status', 'Status']],
    fields: []
  },
  offers: {
    title: 'Offers', description: 'Create time-bound offers shown on customer reward cards.', table: 'reward_offers',
    icon: Tags, roles: ['super_admin', 'admin', 'manager'], search: ['title', 'description', 'offer_type'],
    columns: [['title', 'Offer'], ['offer_type', 'Type'], ['start_date', 'Starts'], ['end_date', 'Ends'], ['active', 'Active']],
    fields: [['title', 'Title', 'text'], ['description', 'Message', 'textarea'], ['offer_type', 'Type', 'select', ['welcome', 'birthday', 'festival', 'buy_one_get_one', 'free_coffee', 'weekend', 'general']], ['target_audience', 'Target Audience', 'select', ['all', 'customer']], ['target_customer_email', 'Specific Customer Email', 'email'], ['start_date', 'Start Date', 'date'], ['end_date', 'End Date', 'date'], ['priority', 'Priority', 'number'], ['cta_label', 'CTA Label', 'text'], ['cta_url', 'CTA URL', 'url'], ['image_url', 'Image URL', 'url'], ['status', 'Status', 'select', ['draft', 'active', 'expired']], ['active', 'Active', 'checkbox']]
  },
  notifications: {
    title: 'Reward Notifications', description: 'Publish festival, birthday, customer-specific or all-customer messages.', table: 'reward_notifications',
    icon: Bell, roles: ['super_admin', 'admin', 'manager'], search: ['title', 'message', 'notification_type', 'audience'],
    columns: [['title', 'Title'], ['notification_type', 'Type'], ['audience', 'Audience'], ['starts_at', 'Starts'], ['active', 'Active']],
    fields: [['title', 'Title', 'text'], ['message', 'Message', 'textarea'], ['notification_type', 'Type', 'select', ['general', 'festival', 'birthday', 'offer', 'customer']], ['audience', 'Audience', 'select', ['all', 'customer']], ['target_customer_email', 'Specific Customer Email', 'email'], ['starts_at', 'Starts At', 'datetime-local'], ['ends_at', 'Ends At', 'datetime-local'], ['priority', 'Priority', 'number'], ['cta_label', 'CTA Label', 'text'], ['cta_url', 'CTA URL', 'url'], ['status', 'Status', 'select', ['draft', 'active', 'expired']], ['active', 'Active', 'checkbox']]
  },
  menu: {
    title: 'Menu', description: 'Food and drink catalogue, categories, prices and availability.', table: 'menu_items',
    icon: Utensils, roles: ['super_admin', 'admin', 'manager'], search: ['name', 'category'],
    columns: [['name', 'Item'], ['category', 'Category'], ['price', 'Price'], ['active', 'Available'], ['sort_order', 'Order']],
    fields: [['name', 'Item Name', 'text'], ['category', 'Category', 'text'], ['description', 'Description', 'textarea'], ['price', 'Price', 'number'], ['image_url', 'Image URL', 'url'], ['active', 'Available', 'checkbox'], ['featured', 'Featured', 'checkbox'], ['sort_order', 'Sort Order', 'number']]
  },
  media: {
    title: 'Media Library', description: 'Track assets stored in Supabase Storage folders.', table: 'media_library',
    icon: Image, roles: ['super_admin', 'admin', 'manager'], search: ['title', 'alt_text', 'category', 'file_type'],
    columns: [['title', 'Asset'], ['category', 'Category'], ['file_type', 'Type'], ['active', 'Active'], ['created_at', 'Uploaded']],
    fields: [['title', 'Title', 'text'], ['category', 'Category', 'select', ['hero', 'gallery', 'menu', 'packages', 'rewards', 'offers']], ['file_url', 'File URL', 'url'], ['file_type', 'File Type', 'text'], ['alt_text', 'Alt Text', 'text'], ['active', 'Active', 'checkbox']]
  },
  content: {
    title: 'Content CMS', description: 'Structured website sections without touching page code.', table: 'website_sections',
    icon: FileText, roles: ['super_admin', 'admin', 'manager'], order: 'updated_at', search: ['page_key', 'section_key'],
    columns: [['page_key', 'Page'], ['section_key', 'Section'], ['title', 'Title'], ['active', 'Active'], ['updated_at', 'Updated']],
    fields: [['page_key', 'Page Key', 'text'], ['section_key', 'Section Key', 'text'], ['title', 'Title', 'text'], ['subtitle', 'Subtitle', 'text'], ['content', 'Content JSON', 'json'], ['image_url', 'Image URL', 'url'], ['video_url', 'Video URL', 'url'], ['active', 'Active', 'checkbox'], ['sort_order', 'Sort Order', 'number']]
  },
  seo: {
    title: 'SEO Pages', description: 'Manage search metadata and social sharing previews.', table: 'seo_pages',
    icon: Search, roles: ['super_admin', 'admin', 'manager'], order: 'updated_at', search: ['page_key', 'title', 'description'],
    columns: [['page_key', 'Page'], ['title', 'Meta Title'], ['canonical', 'Canonical'], ['updated_at', 'Updated']],
    fields: [['page_key', 'Page Key', 'text'], ['title', 'Meta Title', 'text'], ['description', 'Meta Description', 'textarea'], ['canonical', 'Canonical URL', 'url'], ['og_title', 'OG Title', 'text'], ['og_description', 'OG Description', 'textarea'], ['og_image', 'OG Image URL', 'url'], ['keywords', 'Keywords', 'text'], ['schema_json', 'Schema JSON', 'json']]
  },
  leads: {
    title: 'Leads', description: 'Website, event, venue hire and reward lead pipeline.', table: 'website_leads',
    icon: BookOpen, roles: ['super_admin', 'admin', 'manager'], search: ['full_name', 'email', 'phone', 'message'],
    columns: [['full_name', 'Lead'], ['enquiry_type', 'Type'], ['phone', 'Phone'], ['status', 'Status'], ['created_at', 'Created']],
    fields: [['enquiry_type', 'Enquiry Type', 'select', ['website', 'venue_hire', 'reward', 'event']], ['full_name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['message', 'Message', 'textarea'], ['source_page', 'Source Page', 'text'], ['status', 'Status', 'select', ['new', 'contacted', 'follow_up', 'converted', 'lost']], ['follow_up_date', 'Follow-up Date', 'date'], ['notes', 'Internal Notes', 'textarea'], ['converted', 'Converted', 'checkbox']]
  },
  settings: {
    title: 'Settings', description: 'Business and operational configuration.', table: 'settings',
    primaryKey: 'key', order: 'updated_at',
    icon: Settings, roles: ['super_admin'], search: ['key'],
    columns: [['key', 'Setting'], ['value', 'Value'], ['updated_at', 'Updated']],
    fields: [['key', 'Key', 'text'], ['value', 'Value JSON', 'json']]
  },
  users: {
    title: 'Admin Users', description: 'Assign operational roles to authenticated team members.', table: 'profiles',
    icon: Users, roles: ['super_admin'], search: ['role'],
    columns: [['full_name', 'User'], ['email', 'Email'], ['role', 'Role'], ['active', 'Active']],
    fields: [['id', 'Auth User UUID', 'text'], ['full_name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['role', 'Role', 'select', ['super_admin', 'admin', 'manager', 'staff']], ['active', 'Active', 'checkbox']]
  }
}

export const MOBILE_ADMIN_NAV = ADMIN_NAV.filter((item) =>
  ['/admin/dashboard', '/admin/bookings', '/admin/rewards/scanner', '/admin/leads'].includes(item.to)
)

export const ADMIN_SEARCH_ICON = MenuSquare
