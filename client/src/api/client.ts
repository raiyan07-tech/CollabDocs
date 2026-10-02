const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const apiFetch = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const url = `${API_BASE}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = localStorage.getItem('collabdocs_access_token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401: Token expired, attempt refresh
  if (response.status === 401 && !skipAuth) {
    const refreshToken = localStorage.getItem('collabdocs_refresh_token');

    if (!refreshToken) {
      localStorage.removeItem('collabdocs_access_token');
      localStorage.removeItem('collabdocs_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Unauthorized');
    }

    if (isRefreshing) {
      // Wait for ongoing refresh
      await new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });

      const token = localStorage.getItem('collabdocs_access_token');
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
      response = await fetch(url, { ...rest, headers: requestHeaders });
    } else {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await refreshRes.json();
        localStorage.setItem('collabdocs_access_token', data.accessToken);
        localStorage.setItem('collabdocs_refresh_token', data.refreshToken);

        processQueue(null);

        // Retry original request
        requestHeaders['Authorization'] = `Bearer ${data.accessToken}`;
        response = await fetch(url, { ...rest, headers: requestHeaders });
      } catch (err) {
        processQueue(err as Error);
        localStorage.removeItem('collabdocs_access_token');
        localStorage.removeItem('collabdocs_refresh_token');
        localStorage.removeItem('collabdocs_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw new Error('Session expired. Please log in again.');
      } finally {
        isRefreshing = false;
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || (data.details && data.details.join(', ')) || 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
};
