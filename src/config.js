// =====================================================================
//  App-wide constants. The case workflow is defined in src/lib/.
//  Clients and Branches are added from the Allocate Case form and edited
//  directly in the Google Sheet (no separate tabs in the app).
// =====================================================================
import appConfig from './app.config.json';

export const APP_NAME = appConfig.appName;
export const THEME = appConfig.theme || 'indigo';
export const LOGO = appConfig.logo || '';
export const AUTH_ENABLED = true;
export const LOGIN_SHEET = appConfig.loginSheet || 'Login';

// ----------------------------- Roles ---------------------------------
export const ROLES = ['ADMIN', 'REVIEWER', 'FIELD_EXEC'];
export const STAFF = ['ADMIN', 'REVIEWER'];
export const ROLE_LABELS = {
  ADMIN: 'Admin',
  REVIEWER: 'Reviewer / Office',
  FIELD_EXEC: 'Field Executive',
};
export const ROLE_HELP = {
  ADMIN: 'Everything: users, masters, settings, notifications, allocate, review, approve, reports, audit log.',
  REVIEWER: 'Allocate cases, review submitted cases, edit report fields, approve / send back, generate PDF.',
  FIELD_EXEC: 'Sees ONLY cases assigned to them. Fills the field form, captures GPS photos, submits.',
};
export const isStaff = (user) => STAFF.includes(user?.role);
export const homeFor = (role) => (role === 'FIELD_EXEC' ? '/my-cases' : '/dashboard');

// Sidebar (each item lists the roles that may see it; routes use the same list).
export const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: STAFF },
  { path: '/cases', label: 'All Cases', icon: 'FolderKanban', roles: STAFF },
  { path: '/allocate', label: 'Allocate Case', icon: 'FilePlus2', roles: STAFF },
  { path: '/my-cases', label: 'My Cases', icon: 'ClipboardList', roles: ['FIELD_EXEC'] },
  { path: '/users', label: 'Users & Access', icon: 'UserCog', roles: ['ADMIN'] },
  { path: '/settings', label: 'Settings & Alerts', icon: 'Settings', roles: ['ADMIN'] },
  { path: '/audit', label: 'Audit Log', icon: 'History', roles: ['ADMIN'] },
  { path: '/profile', label: 'My Profile', icon: 'CircleUser', roles: ROLES },
];

// Chart palette (indigo theme).
export const THEME_PRIMARY = '#6366f1';
export const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
