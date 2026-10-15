// =====================================================================
//  Validation rules (spec §7). Errors block submit / approval;
//  warnings are shown but don't block.
// =====================================================================
import { SECTIONS, PHOTO_SECTIONS, requiredSectionKeys, isVisible, isEmpty } from './sections';
import { distanceKm } from '../utils/image';

export function validateCase(caseRow, data, photos, { reviewer = false } = {}) {
  const errors = [];
  const warnings = [];
  const err = (section, msg) => errors.push({ section, msg });
  const warn = (section, msg) => warnings.push({ section, msg });
  const req = requiredSectionKeys(caseRow);

  const checkFields = (section, d, key, prefix) => {
    section.fields.forEach((f) => {
      if (!isVisible(f, d) || f.reviewerOnly) return;
      const x = d?.[f.key];
      if (isEmpty(x)) {
        if (f.required) err(key, `${prefix}${f.label} is required`);
        return;
      }
      if (f.type === 'number' && isNaN(Number(x))) err(key, `${prefix}${f.label} must be a number`);
      if (f.type === 'number' && Number(x) < 0) err(key, `${prefix}${f.label} cannot be negative`);
      if (f.pattern && !f.pattern.test(String(x).toUpperCase())) err(key, `${prefix}${f.label}: ${f.patternMsg}`);
    });
  };

  ['visit', ...req].forEach((key) => {
    const section = SECTIONS[key];
    const val = data?.[key];
    if (section.repeat) {
      const items = Array.isArray(val) ? val : [];
      if (!items.length) err(key, `Add at least one ${section.repeat.label.toLowerCase()}`);
      items.forEach((it, i) => checkFields(section, it, key, items.length > 1 ? `${section.repeat.label} ${i + 1}: ` : ''));
    } else {
      checkFields(section, val || {}, key, '');
    }
  });

  // Rule 1 + 2 + 3 — residence.
  const r = data?.residence;
  if (req.includes('residence') && r) {
    if (r.ownership !== 'Rented' && !isEmpty(r.monthlyRent)) err('residence', 'Monthly rent must be empty unless ownership is Rented');
    if (!isEmpty(r.earningMembers) && !isEmpty(r.familyMembers) && Number(r.earningMembers) > Number(r.familyMembers)) {
      err('residence', 'Earning members cannot be more than family members');
    }
    if (r.addressConcern === 'Yes' && r.overall === 'Positive') {
      if (String(r.addressConcernRemark || '').trim().length < 20) {
        err('residence', 'Address concern is marked but overall is Positive — explain why in the concern remark (min 20 chars)');
      } else {
        warn('residence', 'Overall is Positive despite an address concern — double-check the remark');
      }
    }
    if (r.neighbourFeedback === 'Negative' && r.overall === 'Positive') warn('residence', 'Neighbour feedback is Negative but overall is Positive');
  }

  // Rule 4 — info mismatch can never be Positive.
  ['employment', 'business', 'bank'].forEach((k) => {
    const d = data?.[k];
    if (req.includes(k) && d?.infoMatches === 'No' && d?.overall === 'Positive') {
      err(k, 'Information does not match, so overall assessment cannot be Positive');
    }
  });
  const emp = data?.employment;
  if (req.includes('employment') && emp?.dateOfJoining && new Date(emp.dateOfJoining) > new Date()) {
    err('employment', 'Date of joining cannot be in the future');
  }

  // Rule 4 + 5 — ITR.
  if (req.includes('itr')) {
    (Array.isArray(data?.itr) ? data.itr : []).forEach((y, i) => {
      const p = `Year ${i + 1}: `;
      if (y.infoMatches === 'No' && y.overall === 'Positive') err('itr', `${p}information does not match, so overall cannot be Positive`);
      if (y.computationVerified === 'No' && y.genuine === 'Yes') {
        if (String(y.genuineOverride || '').trim()) warn('itr', `${p}marked genuine without computation verification (reviewer override given)`);
        else if (reviewer) err('itr', `${p}genuine without computation verification — enter a reviewer override reason`);
        else err('itr', `${p}cannot be marked genuine when computation is not verified (a reviewer can override)`);
      }
    });
  }

  // Rule 6 — every visited section needs a GPS + timestamped photo.
  const list = Array.isArray(photos) ? photos : [];
  PHOTO_SECTIONS.filter((k) => req.includes(k)).forEach((k) => {
    const ok = list.some((p) => p.section === k && p.lat !== '' && p.lat != null && p.lng != null && p.capturedAt);
    if (!ok) err('photos', `${SECTIONS[k].title}: at least one photo with GPS is required`);
  });

  // Rule 7 — GPS jump warning (> 1 km between consecutive photos).
  const sorted = [...list].filter((p) => p.lat != null && p.lat !== '').sort((a, b) => String(a.capturedAt).localeCompare(String(b.capturedAt)));
  for (let i = 1; i < sorted.length; i++) {
    const km = distanceKm(sorted[i - 1], sorted[i]);
    if (km > 1) warn('photos', `Photo "${sorted[i].caption || sorted[i].section}" is ${km.toFixed(1)} km from the previous photo`);
  }

  return { errors, warnings };
}
