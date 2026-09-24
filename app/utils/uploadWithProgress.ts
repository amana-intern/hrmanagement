/**
 * POSTs/PATCHes a FormData body via XMLHttpRequest (not fetch, which has no upload
 * progress event) so callers can show a real byte-transfer percentage instead of a
 * fake timer. Progress is capped at 99% until the server actually responds — the
 * response only comes back once the route has finished writing the record, so
 * reaching 100% means the file is genuinely persisted, not just sent over the wire.
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST'
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      onProgress(100);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => JSON.parse(xhr.responseText || '{}'),
      });
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}
