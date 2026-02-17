export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return

  const user = useCookie("user").value;
  const token = useCookie("token").value;

  if (!token) {
    return navigateTo("/login");
  }

  if (!user || user.role !== "ADMIN") {
    return navigateTo("/");
  }

  const blockedCreateRoutes = {
    '/admin/vehicles/create': '/admin/vehicles',
    '/admin/bookings/create': '/admin/bookings',
    '/admin/driver-verifications/create': '/admin/driver-verifications',
  }

  if (blockedCreateRoutes[to.path]) {
    return navigateTo(blockedCreateRoutes[to.path]);
  }
});
