const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getApiOrigin() {
  try {
    // If API_BASE_URL ends with /api, drop it to get origin
    const u = new URL(API_BASE_URL);
    if (u.pathname.endsWith('/api')) {
      u.pathname = u.pathname.slice(0, -'/api'.length) || '/';
    } else {
      u.pathname = '/';
    }
    u.search = '';
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:5000';
  }
}

export const API_ORIGIN = getApiOrigin();
export const FALLBACK_IMAGE = '/no-image.svg';

export function resolveAssetUrl(maybePath) {
  if (!maybePath) return FALLBACK_IMAGE;
  if (maybePath.startsWith('http://') || maybePath.startsWith('https://')) return maybePath;
  if (maybePath.startsWith('/')) return `${API_ORIGIN}${maybePath}`;
  return maybePath;
}

