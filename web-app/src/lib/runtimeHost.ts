export type HostSurface = 'admin' | 'portal' | 'generic';

export const ADMIN_HOSTNAME = 'admin.docduty.com.pk';
export const PORTAL_HOSTNAME = 'portal.docduty.com.pk';

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isPrivateIpv4Host(hostname: string): boolean {
  return /^10\.\d+\.\d+\.\d+$/.test(hostname)
    || /^192\.168\.\d+\.\d+$/.test(hostname)
    || /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname);
}

export function isLocalRuntimeHost(hostname = window.location.hostname): boolean {
  return isLoopbackHost(hostname) || isPrivateIpv4Host(hostname);
}

export function shouldUseDedicatedHosts(hostname = window.location.hostname): boolean {
  return !isLocalRuntimeHost(hostname);
}

export function getHostSurface(hostname = window.location.hostname): HostSurface {
  if (hostname === ADMIN_HOSTNAME) return 'admin';
  if (hostname === PORTAL_HOSTNAME) return 'portal';
  return 'generic';
}

export function getSurfaceOrigin(
  surface: Exclude<HostSurface, 'generic'>,
  protocol = window.location.protocol,
  hostname = window.location.hostname,
  origin = window.location.origin,
): string {
  if (!shouldUseDedicatedHosts(hostname)) {
    return origin;
  }

  const host = surface === 'admin' ? ADMIN_HOSTNAME : PORTAL_HOSTNAME;
  return `${protocol}//${host}`;
}

export function getRoleSurface(role: 'doctor' | 'facility_admin' | 'platform_admin'): Exclude<HostSurface, 'generic'> {
  return role === 'platform_admin' ? 'admin' : 'portal';
}

export function getRolePath(role: 'doctor' | 'facility_admin' | 'platform_admin'): string {
  if (role === 'doctor') return '/doctor';
  if (role === 'platform_admin') return '/admin';
  return '/facility';
}
