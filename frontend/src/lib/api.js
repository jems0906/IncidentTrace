export const API_URL = import.meta.env.VITE_API_URL || '';

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export async function downloadReport(incidentId, format) {
  const response = await fetch(`${API_URL}/api/incidents/${incidentId}/report.${format}`);
  if (!response.ok) throw new Error('Report could not be generated.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `incidenttrace-investigation-${incidentId}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
