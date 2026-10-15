import React, { useEffect, useState } from 'react';
import { Camera, MapPin, Trash2, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getFileDataUrl, primeFileCache } from '../utils/api';
import { compressImage, getPosition, distanceKm } from '../utils/image';
import { fmtDateTime } from '../utils/format';
import { inputCls, Spinner } from './ui';

export const PhotoThumb = ({ photo, caseNo, className = '' }) => {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    getFileDataUrl(photo.id, caseNo).then((d) => alive && setSrc(d)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [photo.id, caseNo]);
  if (failed) return <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}><ImageOff size={24} /></div>;
  if (!src) return <div className={`flex items-center justify-center bg-gray-100 ${className}`}><Spinner /></div>;
  return <img src={src} alt={photo.caption || photo.section} className={`object-cover ${className}`} />;
};

export const mapsLink = (p) => `https://www.google.com/maps?q=${p.lat},${p.lng}`;

export const PhotoCard = ({ photo, caseNo, onDelete }) => (
  <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
    <PhotoThumb photo={photo} caseNo={caseNo} className="w-full h-40" />
    <div className="p-2 text-xs space-y-0.5">
      <p className="font-semibold text-gray-900 truncate">{photo.caption || '—'}</p>
      <p className="text-slate-500 capitalize">{photo.section}</p>
      <p className="text-slate-500">{fmtDateTime(photo.capturedAt)}</p>
      <div className="flex items-center justify-between gap-2">
        <a href={mapsLink(photo)} target="_blank" rel="noreferrer" className="text-indigo-600 inline-flex items-center gap-1 underline">
          <MapPin size={12} /> {Number(photo.lat).toFixed(5)}, {Number(photo.lng).toFixed(5)}
        </a>
        {onDelete && (
          <button onClick={() => onDelete(photo)} className="p-1 rounded text-red-500 hover:bg-red-50" title="Delete photo"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  </div>
);

// Live-camera capture with GPS + timestamp burned into the image.
export const PhotoCapture = ({ caseNo, sections, photos, onChange, canEdit = true }) => {
  const [section, setSection] = useState(sections[0]?.key || 'other');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    // Heuristic for "live camera only": a fresh camera shot is seconds old.
    if (Date.now() - file.lastModified > 5 * 60 * 1000) {
      toast.error('Please take a NEW photo with the camera (gallery photos are not allowed).');
      return;
    }
    try {
      setBusy('Getting GPS location…');
      const pos = await getPosition();
      const capturedAt = new Date().toISOString();
      setBusy('Compressing photo…');
      const label = sections.find((s) => s.key === section)?.label || section;
      const stamp = `${fmtDateTime(capturedAt)}  |  ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} (±${pos.accuracy}m)\n${caseNo} · ${label}${caption ? ` · ${caption}` : ''}`;
      const dataUrl = await compressImage(file, { stamp });
      setBusy('Uploading…');
      const res = await api.uploadPhoto({ caseNo, section, dataUrl, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, capturedAt, caption: caption || label });
      primeFileCache(res.photo.id, dataUrl);
      const prev = [...photos].sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
      if (prev && prev.lat != null) {
        const km = distanceKm(prev, res.photo);
        if (km > 1) toast(`⚠️ This photo is ${km.toFixed(1)} km away from the previous photo`, { duration: 6000 });
      }
      onChange([...photos, res.photo]);
      setCaption('');
      toast.success('Photo saved with GPS');
    } catch (err) {
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setBusy('');
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await api.deletePhoto(caseNo, photo.id);
      onChange(photos.filter((p) => p.id !== photo.id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => {
              const n = photos.filter((p) => p.section === s.key).length;
              return (
                <button key={s.key} type="button" onClick={() => setSection(s.key)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border ${section === s.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {s.label} <span className="opacity-70">({n})</span>
                </button>
              );
            })}
          </div>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} placeholder="Caption (e.g. House front, Name board)" />
          <label className={`w-full py-4 rounded-xl text-white font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer ${busy ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {busy ? <><Spinner light /> {busy}</> : <><Camera size={22} /> Take Photo</>}
            <input type="file" accept="image/*" capture="environment" className="hidden" disabled={!!busy}
              onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <p className="text-[11px] text-slate-500">Camera opens directly. GPS location and time are recorded and printed on the photo.</p>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => <PhotoCard key={p.id} photo={p} caseNo={caseNo} onDelete={canEdit ? handleDelete : null} />)}
        </div>
      )}
    </div>
  );
};
