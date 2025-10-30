'use server'

import { getCurrentUserWithRole, hasPermission, hasRoleLevel } from '../rbac'

export async function checkUserPermission(permission: string): Promise<boolean> {
  try {
    const permissionCheck = await hasPermission(permission)
    return permissionCheck.hasPermission
  } catch (error) {
    console.error('Error checking user permission:', error)
    return false
  }
}

export async function getUserRole(): Promise<{ role: string; level: number } | null> {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !user.role) return null
    
    return {
      role: user.role.name,
      level: user.role.level
    }
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export async function checkAdminAccess(): Promise<{
  hasAccess: boolean
  userRole?: string
  userLevel?: number
}> {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !user.role) {
      return { hasAccess: false }
    }
    
    // Check if user has admin-level permissions (level 1 or 2)
    const hasAdminAccess = await hasRoleLevel(2)
    
    return {
      hasAccess: hasAdminAccess,
      userRole: user.role.name,
      userLevel: user.role.level
    }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { hasAccess: false }
  }
}

export async function getUserCapabilities() {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !user.role) {
      return {
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canManageBlog: false,
        canManageNewsletter: false,
        canViewAnalytics: false,
        canManageRoles: false,
        canAccessSystemSettings: false,
        userRole: 'User',
        userLevel: 3,
        permissions: []
      }
    }

    const permissions = user.role.permissions.map(rp => rp.permission.name)
    
    return {
      canManageUsers: permissions.includes('MANAGE_USERS'),
      canManageProducts: permissions.includes('CREATE_PRODUCTS') || permissions.includes('EDIT_PRODUCTS'),
      canManageOrders: permissions.includes('VIEW_ALL_ORDERS') || permissions.includes('MANAGE_ORDERS'),
      canManageBlog: permissions.includes('MANAGE_BLOG'),
      canManageNewsletter: permissions.includes('MANAGE_NEWSLETTER'),
      canViewAnalytics: permissions.includes('VIEW_ANALYTICS'),
      canManageRoles: permissions.includes('MANAGE_ROLES'),
      canAccessSystemSettings: permissions.includes('SYSTEM_SETTINGS'),
      userRole: user.role.name,
      userLevel: user.role.level,
      permissions: permissions
    }
  } catch (error) {
    console.error('Error getting user capabilities:', error)
    return {
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false,
      canManageBlog: false,
      canManageNewsletter: false,
      canViewAnalytics: false,
      canManageRoles: false,
      canAccessSystemSettings: false,
      userRole: 'User',
      userLevel: 3,
      permissions: []
    }
  }
}