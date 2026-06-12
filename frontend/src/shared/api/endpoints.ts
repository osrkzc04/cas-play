export const endpoints = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    passwordResetRequest: "/auth/password-reset/request",
    passwordResetConfirm: "/auth/password-reset/confirm",
  },
  users: {
    list: "/users",
    create: "/users",
    detail: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    roles: "/users/roles",
  },
  courses: {
    catalog: "/courses",
    create: "/courses",
    manage: "/courses/manage",
    detail: (id: string) => `/courses/${id}`,
    update: (id: string) => `/courses/${id}`,
    publish: (id: string) => `/courses/${id}/publish`,
    hide: (id: string) => `/courses/${id}/hide`,
    finish: (id: string) => `/courses/${id}/finish`,
  },
} as const;
