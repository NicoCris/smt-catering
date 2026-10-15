/**
 * Configuración de AdminJS para administración centralizada (Superadmin).
 *
 * Cuando se instale AdminJS (@adminjs/express y el adaptador correspondiente),
 * este archivo proveerá la instancia y el router para montarlo en /admin.
 */

export interface AdminJsSetupConfig {
  rootPath: string
  logoutPath: string
  loginPath: string
}

export const adminJsConfig: AdminJsSetupConfig = {
  rootPath: '/admin',
  loginPath: '/admin/login',
  logoutPath: '/admin/logout',
}

/**
 * Función inicializadora lista para conectar AdminJS con Express.
 */
export function buildAdminRouter() {
  // TODO: Conectar AdminJS con express:
  // const admin = new AdminJS({ resources: [UserResource, EventResource] })
  // return AdminJSExpress.buildAuthenticatedRouter(admin, authConfig)
  return null
}

