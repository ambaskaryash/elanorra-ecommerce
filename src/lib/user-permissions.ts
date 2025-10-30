import { hasPermission, hasAnyPermission, getCurrentUserWithRole, isAdmin } from '@/lib/rbac';

/**
 * User Level Permissions Configuration
 * Defines what regular users can and cannot do
 */

// Permissions that User Level profiles have
export const USER_PERMISSIONS = {
  // Profile Management
  EDIT_OWN_PROFILE: 'EDIT_OWN_PROFILE',
  CHANGE_OWN_PASSWORD: 'CHANGE_OWN_PASSWORD',
  VIEW_OWN_PROFILE: 'VIEW_OWN_PROFILE',
  
  // Shopping & Orders
  PLACE_ORDERS: 'PLACE_ORDERS',
  VIEW_OWN_ORDERS: 'VIEW_OWN_ORDERS',
  CANCEL_OWN_ORDERS: 'CANCEL_OWN_ORDERS',
  
  // Product Browsing
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  SEARCH_PRODUCTS: 'SEARCH_PRODUCTS',
  
  // Newsletter & Communication
  SUBSCRIBE_NEWSLETTER: 'SUBSCRIBE_NEWSLETTER',
  CONTACT_SUPPORT: 'CONTACT_SUPPORT',
} as const;

// Permissions that User Level profiles do NOT have (Admin only)
export const ADMIN_ONLY_PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_ALL_USERS: 'VIEW_ALL_USERS',
  DELETE_USERS: 'DELETE_USERS',
  
  // Product Management
  CREATE_PRODUCTS: 'CREATE_PRODUCTS',
  EDIT_PRODUCTS: 'EDIT_PRODUCTS',
  DELETE_PRODUCTS: 'DELETE_PRODUCTS',
  
  // Order Management
  VIEW_ALL_ORDERS: 'VIEW_ALL_ORDERS',
  MANAGE_ORDERS: 'MANAGE_ORDERS',
  
  // Content Management
  MANAGE_BLOG: 'MANAGE_BLOG',
  MANAGE_NEWSLETTER: 'MANAGE_NEWSLETTER',
  
  // System Management
  MANAGE_ROLES: 'MANAGE_ROLES',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
} as const;

/**
 * Check if current user can perform a user-level action
 */
export async function canUserPerformAction(action: keyof typeof USER_PERMISSIONS): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user) {
      return false;
    }

    // Check if user has the specific permission
    const permissionCheck = await hasPermission(USER_PERMISSIONS[action]);
    return permissionCheck.hasPermission;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Check if current user can access admin functions
 */
export async function canAccessAdmin(): Promise<boolean> {
  try {
    return await isAdmin();
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

/**
 * Check if current user can manage their own profile
 */
export async function canManageOwnProfile(): Promise<boolean> {
  return await canUserPerformAction('EDIT_OWN_PROFILE');
}

/**
 * Check if current user can place orders
 */
export async function canPlaceOrders(): Promise<boolean> {
  return await canUserPerformAction('PLACE_ORDERS');
}

/**
 * Check if current user can view products (should be true for all users)
 */
export async function canViewProducts(): Promise<boolean> {
  return await canUserPerformAction('VIEW_PRODUCTS');
}

/**
 * Check if current user can view their own orders
 */
export async function canViewOwnOrders(): Promise<boolean> {
  return await canUserPerformAction('VIEW_OWN_ORDERS');
}

/**
 * Middleware helper for protecting user-level routes
 */
export function requireUserPermission(permission: keyof typeof USER_PERMISSIONS) {
  return async (req: any, res: any, next: any) => {
    const canPerform = await canUserPerformAction(permission);
    
    if (!canPerform) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires ${permission} permission`,
        userLevel: true
      });
    }
    
    next();
  };
}

/**
 * Middleware helper for blocking admin-only routes from regular users
 */
export function blockAdminOnlyAccess() {
  return async (req: any, res: any, next: any) => {
    const canAccess = await canAccessAdmin();
    
    if (!canAccess) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This resource is only available to administrators',
        redirectTo: '/'
      });
    }
    
    next();
  };
}

/**
 * Get user capabilities summary
 */
export async function getUserCapabilities() {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        canPlaceOrders: false,
        canManageProfile: false,
        canViewProducts: true, // Public access
        role: 'Guest'
      };
    }

    const [
      canPlace,
      canManage,
      canView,
      canViewOrders,
      isAdminUser
    ] = await Promise.all([
      canPlaceOrders(),
      canManageOwnProfile(),
      canViewProducts(),
      canViewOwnOrders(),
      canAccessAdmin()
    ]);

    return {
      isAuthenticated: true,
      isAdmin: isAdminUser,
      canPlaceOrders: canPlace,
      canManageProfile: canManage,
      canViewProducts: canView,
      canViewOwnOrders: canViewOrders,
      role: user.role?.displayName || 'User',
      userId: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Error getting user capabilities:', error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      canPlaceOrders: false,
      canManageProfile: false,
      canViewProducts: true,
      role: 'Error'
    };
  }
}

/**
 * Route protection configuration
 */
export const ROUTE_PERMISSIONS = {
  // Public routes (no authentication required)
  PUBLIC: [
    '/',
    '/products',
    '/shop',
    '/about',
    '/contact',
    '/blog',
    '/search',
    '/sign-in',
    '/sign-up'
  ],
  
  // User routes (authentication required, User level or higher)
  USER: [
    '/account',
    '/account/profile',
    '/account/orders',
    '/account/settings',
    '/checkout',
    '/order-confirmation'
  ],
  
  // Admin routes (Admin level or higher required)
  ADMIN: [
    '/admin',
    '/admin/users',
    '/admin/products',
    '/admin/orders',
    '/admin/blog',
    '/admin/newsletter',
    '/admin/analytics',
    '/admin/settings'
  ]
} as const;

/**
 * Check if a route requires admin access
 */
export function isAdminRoute(pathname: string): boolean {
  return ROUTE_PERMISSIONS.ADMIN.some(route => 
    pathname.startsWith(route)
  );
}

/**
 * Check if a route requires user authentication
 */
export function isUserRoute(pathname: string): boolean {
  return ROUTE_PERMISSIONS.USER.some(route => 
    pathname.startsWith(route)
  );
}

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_PERMISSIONS.PUBLIC.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );
}