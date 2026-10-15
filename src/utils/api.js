// =====================================================================
//  Backend = Google Apps Script web app (google-apps-script/Code.gs).
//  Every call is a POST {action, token, session, ...payload}.
//   - token   : shared app secret (VITE_API_TOKEN == API_TOKEN in Code.gs)
//   - session : per-user session issued at login. The SERVER checks the
//               user's role and case ownership on every call, so a field
//               executive can never read another executive's case even
//               by calling the API directly.
// =====================================================================
import { useAuthStore } from '../store/authStore';

const SCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

if (!SCRIPT_URL) {
  console.warn('VITE_APPSCRIPT_URL is not set. Copy .env.example to .env, fill it in, then restart the dev server.');
}

export async function call(action, payload = {}) {
  if (!SCRIPT_URL) throw new Error('Backend URL missing — set VITE_APPSCRIPT_URL in .env');
  const session = useAuthStore.getState().session;
  let res;
  try {
    // text/plain body (no custom headers) -> no CORS preflight against Apps Script.
    res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, token: API_TOKEN, session, ...payload }),
    });
  } catch (e) {
    throw new Error('Network error — check your internet connection');
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Backend did not return JSON. Check the Apps Script deployment ("Who has access: Anyone").');
  }
  if (!data.success) {
    if (data.error === 'SESSION_EXPIRED') {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expired=1');
      throw new Error('Session expired — please log in again');
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // auth / profile
  login: (userId, password) => call('login', { userId, password }),
  logout: () => call('logout'),
  me: () => call('me'),
  changePassword: (oldPassword, newPassword) => call('changePassword', { oldPassword, newPassword }),
  updateMyContact: (record) => call('updateMyContact', { record }),
  telegramLinkStart: () => call('telegramLinkStart'),
  telegramLinkVerify: (code) => call('telegramLinkVerify', { code }),

  // users (admin)
  listUsers: () => call('listUsers'),
  saveUser: (record, isNew) => call('saveUser', { record, isNew }),
  deleteUser: (userId) => call('deleteUser', { userId }),
  listExecutives: () => call('listExecutives'),

  // masters
  listMaster: (sheet) => call('listMaster', { sheet }),
  saveMaster: (sheet, record, matchValue) => call('saveMaster', { sheet, record, matchValue }),
  deleteMaster: (sheet, matchValue) => call('deleteMaster', { sheet, matchValue }),

  // cases
  listCases: () => call('listCases'),
  getCase: (caseNo) => call('getCase', { caseNo }),
  createCases: (records) => call('createCases', { records }),
  updateCaseMeta: (caseNo, record) => call('updateCaseMeta', { caseNo, record }),
  deleteCase: (caseNo) => call('deleteCase', { caseNo }),
  saveSections: (caseNo, data) => call('saveSections', { caseNo, data }),
  submitCase: (caseNo, data) => call('submitCase', { caseNo, data }),
  saveComments: (caseNo, comments) => call('saveComments', { caseNo, comments }),
  approveCase: (caseNo, comments) => call('approveCase', { caseNo, comments }),
  sendBack: (caseNo, note) => call('sendBack', { caseNo, note }),
  markSent: (caseNo) => call('markSent', { caseNo }),
  recordReport: (caseNo, fileName) => call('recordReport', { caseNo, fileName }),

  // photos / files
  uploadPhoto: (payload) => call('uploadPhoto', payload),
  deletePhoto: (caseNo, photoId) => call('deletePhoto', { caseNo, photoId }),
  getFile: (fileId, caseNo) => call('getFile', { fileId, caseNo }),

  // settings + notifications (admin)
  getSettings: () => call('getSettings'),
  saveSettings: (settings, telegramBotToken, clearBotToken) => call('saveSettings', { settings, telegramBotToken, clearBotToken }),
  uploadAsset: (kind, dataUrl) => call('uploadAsset', { kind, dataUrl }),
  testNotification: (channel) => call('testNotification', { channel }),
  telegramDetectChats: () => call('telegramDetectChats'),
  installTriggers: () => call('installTriggers'),
  runOverdueNow: () => call('runOverdueNow'),
  listAudit: (caseNo) => call('listAudit', { caseNo }),
};

// Cache of file data-URLs (photos, stamp, signature) for this browser session.
const fileCache = new Map();
export async function getFileDataUrl(fileId, caseNo) {
  if (!fileId) return '';
  if (fileCache.has(fileId)) return fileCache.get(fileId);
  const p = api.getFile(fileId, caseNo).then((r) => r.dataUrl).catch((e) => { fileCache.delete(fileId); throw e; });
  fileCache.set(fileId, p);
  return p;
}
export const primeFileCache = (fileId, dataUrl) => fileCache.set(fileId, Promise.resolve(dataUrl));
