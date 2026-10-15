// Camera photo helpers: GPS, compression (< 500 KB) and an on-image
// timestamp + GPS stamp, so every photo carries its own proof of visit.

export const distanceKm = (a, b) => {
  const R = 6371;
  const toRad = (x) => (Number(x) * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS not available on this device'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (e) => reject(new Error(e.code === 1
        ? 'Location permission denied. Allow location for this site and try again.'
        : 'Could not get GPS location. Move to open sky and try again.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read the photo')); };
    img.src = url;
  });

const bytesOf = (dataUrl) => Math.ceil(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

// Returns a JPEG data-URL under maxBytes, with a text stamp burned in.
export async function compressImage(file, { maxBytes = 480 * 1024, stamp = '' } = {}) {
  const img = await loadImage(file);
  let maxDim = 1600;
  let quality = 0.82;
  let out = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    if (stamp) {
      const fs = Math.max(14, Math.round(w / 42));
      ctx.font = `bold ${fs}px sans-serif`;
      const pad = Math.round(fs * 0.5);
      const lines = stamp.split('\n');
      const boxH = lines.length * (fs + pad) + pad;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, h - boxH, w, boxH);
      ctx.fillStyle = '#fff';
      lines.forEach((ln, i) => ctx.fillText(ln, pad, h - boxH + pad + fs * (i + 1) + pad * i - 2));
    }
    out = canvas.toDataURL('image/jpeg', quality);
    if (bytesOf(out) <= maxBytes) return out;
    if (quality > 0.5) quality -= 0.12;
    else { maxDim = Math.round(maxDim * 0.8); quality = 0.75; }
  }
  return out;
}
