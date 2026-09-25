/** Share of the bar used for sending bytes; the rest is server-side processing. */
export const UPLOAD_PHASE_END = 70;
const PROCESSING_CAP = 95;

/**
 * POSTs/PATCHes a FormData body via XMLHttpRequest (fetch has no upload progress event).
 * The bar has two honest phases: 0–70% = bytes actually sent, then 70–95% creeps forward
 * while the server saves the record (real duration is unknown, so it eases toward the cap
 * instead of freezing). It only reaches 100% when the response arrives — i.e. once the route
 * has finished writing to the database.
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST'
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let creep: ReturnType<typeof setInterval> | undefined;
    const stop = () => creep && clearInterval(creep);

    xhr.open(method, url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * UPLOAD_PHASE_END));
    };
    xhr.upload.onload = () => {
      let pct = UPLOAD_PHASE_END;
      onProgress(pct);
      creep = setInterval(() => {
        pct += (PROCESSING_CAP - pct) * 0.06;
        onProgress(Math.round(pct));
      }, 250);
    };
    xhr.onload = () => {
      stop();
      onProgress(100);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => JSON.parse(xhr.responseText || '{}'),
      });
    };
    xhr.onerror = () => {
      stop();
      reject(new Error('Network error'));
    };
    xhr.send(formData);
  });
}
