import axios from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true });

export function getError(err: any, fallback = 'Something went wrong'): { message: string; fields: Record<string, string> } {
  return { message: err?.response?.data?.message || fallback, fields: err?.response?.data?.errors || {} };
}

export async function downloadFile(url: string, params: Record<string, any>, fallbackName: string) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href; a.download = fallbackName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(href);
}
