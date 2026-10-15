// =====================================================================
//  Report comments are BUILT FROM DATA, never copied from a template.
//  Every name in a comment comes from this case's own fields, so a
//  "Mrs. Koda Prasanna" from an old case can never leak in, and
//  positive / negative statements can't contradict each other.
// =====================================================================
import { requiredSectionKeys } from './sections';

const has = (x) => x !== undefined && x !== null && String(x).trim() !== '';
const lc = (s) => String(s || '').toLowerCase();
const years = (n) => {
  const x = Number(n);
  if (!has(n) || isNaN(x)) return '';
  return `${x} ${x === 1 ? 'year' : 'years'}`;
};
const money = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}/-`;
const sentence = (s) => (s && !/[.!?]$/.test(s) ? `${s}.` : s);
const join = (parts) => parts.filter(Boolean).map(sentence).join(' ');

const closing = (overall, positiveText, subject) => {
  if (overall === 'Positive') return positiveText;
  if (overall === 'Negative') return `Overall assessment of the ${subject} is negative`;
  if (overall === 'Refer') return `The ${subject} is referred for further verification`;
  return '';
};

export function residenceComment(r, applicant) {
  if (!r || !has(r.personName)) return '';
  const p = [];
  p.push(`Visit done. Met ${r.personName}${has(r.personRelation) ? ` (${r.personRelation})` : ''}`);
  if (r.applicantStays === 'Yes') {
    const owner = has(r.ownership) ? `${lc(r.ownership)} house` : 'house';
    p.push(`Confirmed that the applicant ${applicant} has been staying at this ${owner}${has(r.stayYears) ? ` for the last ${years(r.stayYears)}` : ''}`);
  } else if (r.applicantStays === 'No') {
    p.push(`The person met stated that the applicant ${applicant} does not stay at this address`);
  }
  if (r.ownership === 'Rented' && has(r.monthlyRent)) p.push(`Monthly rent is ${money(r.monthlyRent)}`);

  const cond = r.entryAllowed === 'Yes' && has(r.internalAppearance)
    ? `House condition is ${lc(r.internalAppearance)}`
    : has(r.externalAppearance) ? `External appearance of the house is ${lc(r.externalAppearance)}` : '';
  const where = has(r.locality) ? `located in a ${lc(r.locality)} residential area` : '';
  const area = has(r.carpetArea) ? `approx. ${r.carpetArea} sq.ft.` : '';
  if (cond || where) p.push([cond, where].filter(Boolean).join(', ') + (area ? `, ${area}` : ''));

  if (has(r.familyMembers)) {
    p.push(`Family members: ${r.familyMembers}; earning members: ${has(r.earningMembers) ? r.earningMembers : '0'}${has(r.earningDetail) ? ` (${r.earningDetail})` : ''}`);
  }
  if (has(r.ebillOwner)) p.push(`Residence proof: electricity bill in the name of ${r.ebillOwner}`);
  if (has(r.neighbourName)) {
    if (r.neighbourFeedback === 'Negative') {
      p.push(`Neighbour ${r.neighbourName} gave negative feedback about the applicant`);
    } else {
      p.push(`Neighbour ${r.neighbourName} confirmed the stay${has(r.neighbourStayYears) ? ` of ${years(r.neighbourStayYears)}` : ''} and gave positive feedback`);
    }
  }
  if (r.addressConcern === 'Yes' && has(r.addressConcernRemark)) p.push(`Note: ${r.addressConcernRemark}`);

  const clean = r.addressConcern !== 'Yes' && r.neighbourFeedback !== 'Negative';
  p.push(closing(r.overall, clean ? 'No negative feedback received about the applicant or family members' : '', 'residence verification'));
  return join(p);
}

export function employmentComment(e, applicant) {
  if (!e || !has(e.officialName)) return '';
  const p = [];
  p.push(`Visited the office of ${e.companyName || 'the employer'}${has(e.officeAddress) ? ` at ${e.officeAddress}` : ''}`);
  p.push(`Met ${e.officialName}${has(e.officialDesignation) ? ` (${e.officialDesignation})` : ''}, who confirmed that the applicant ${applicant} is working as ${e.applicantDesignation || 'an employee'}${has(e.jobType) ? ` in a ${lc(e.jobType)} job` : ''}${has(e.yearsInJob) ? ` for the last ${years(e.yearsInJob)}` : ''}`);
  const seen = [e.idCardSeen === 'Yes' && 'employee ID card', e.visitingCardSeen === 'Yes' && 'visiting card'].filter(Boolean);
  if (seen.length) p.push(`${seen.join(' and ')} seen`.replace(/^./, (c) => c.toUpperCase()));
  if (has(e.salaryProof) && e.salaryProof !== 'None') p.push(`Salary verified through ${e.salaryProof.toLowerCase()}`);
  if (has(e.lastSalary)) p.push(`Last salary drawn: ${money(e.lastSalary)}`);
  if (e.infoMatches === 'No' && has(e.unmatchedDetails)) p.push(`Unmatched details: ${e.unmatchedDetails}`);
  p.push(closing(e.overall, e.infoMatches === 'Yes' ? 'No negative feedback received about the applicant' : '', 'employment verification'));
  return join(p);
}

export function businessComment(b, applicant) {
  if (!b || !has(b.personContacted)) return '';
  const owner = b.businessmanName || applicant;
  const p = [];
  p.push(`Visited the business premises of ${b.businessName || 'the applicant'}${has(b.natureOfBusiness) ? ` (${b.natureOfBusiness})` : ''}${has(b.presentAddress) ? ` at ${b.presentAddress}` : ''}`);
  const since = has(b.yearOfCommencement) ? ` since ${b.yearOfCommencement}` : '';
  p.push(`Met ${b.personContacted}${has(b.personDesignation) ? ` (${b.personDesignation})` : ''}, who confirmed that ${owner} has been running this business${since}`);
  const facts = [
    has(b.locationType) && `${lc(b.locationType)} location`,
    has(b.propertyOwnership) && `${lc(b.propertyOwnership)} premises`,
    has(b.appearance) && `${lc(b.appearance)} appearance`,
    has(b.employeesCount) && `${b.employeesCount} employee(s)`,
  ].filter(Boolean);
  if (facts.length) p.push(`Business unit: ${facts.join(', ')}`);
  if (has(b.neighbourName)) {
    p.push(b.neighbourFeedback === 'Negative'
      ? `Neighbour ${b.neighbourName} gave negative feedback about the business`
      : `Neighbour ${b.neighbourName} confirmed the business and gave positive feedback`);
  }
  if (b.evidenceCollected === 'Yes') p.push(`Supporting evidence collected${has(b.proofDocument) ? ` (${lc(b.proofDocument)})` : ''}`);
  if (b.infoMatches === 'No' && has(b.unmatchedDetails)) p.push(`Unmatched details: ${b.unmatchedDetails}`);
  const clean = b.infoMatches === 'Yes' && b.neighbourFeedback !== 'Negative';
  p.push(closing(b.overall, clean ? "No negative feedback received about the applicant's business" : '', 'business verification'));
  return join(p);
}

export function bankComment(k, applicant) {
  if (!k || !has(k.bankName)) return '';
  const p = [];
  p.push(`Bank statement of ${k.accountHolder || applicant} with ${k.bankName} verified for a period of ${k.statementMonths || 6} months`);
  p.push(k.discrepancies === 'Yes' ? 'Discrepancies were observed in the statement' : 'No discrepancies observed in the statement');
  if (k.signedByOfficial === 'Yes') p.push('Statement is duly signed by the bank official');
  if (k.infoMatches === 'No' && has(k.unmatchedDetails)) p.push(`Unmatched details: ${k.unmatchedDetails}`);
  p.push(closing(k.overall, '', 'bank verification'));
  return join(p);
}

export function itrComment(items, applicant) {
  const list = (Array.isArray(items) ? items : []).filter((y) => has(y.assessmentYear));
  if (!list.length) return '';
  const p = [`${list.length} year(s) of ITR / Form 16 of ${applicant} verified`];
  list.forEach((y) => {
    const bits = [`AY ${y.assessmentYear}: ${y.documentType || 'ITR'}`];
    if (has(y.ackNo)) bits.push(`ack. no. ${y.ackNo}`);
    if (has(y.incomeSubmitted)) bits.push(`income as submitted ${money(y.incomeSubmitted)}`);
    if (has(y.incomeVerified)) bits.push(`as verified ${money(y.incomeVerified)}`);
    if (has(y.status)) bits.push(lc(y.status));
    if (has(y.genuine)) bits.push(y.genuine === 'Yes' ? 'found genuine' : 'NOT found genuine');
    p.push(bits.join(', '));
  });
  return join(p);
}

export function otherDocsComment(items) {
  const list = (Array.isArray(items) ? items : []).filter((d) => has(d.documentName));
  if (!list.length) return '';
  return join(list.map((d) => `${d.documentName}${has(d.proprietorName) ? ` of ${d.proprietorName}` : ''} ${d.genuine === 'Yes' ? 'verified and found genuine' : 'could not be verified as genuine'}${has(d.remark) ? ` (${d.remark})` : ''}`));
}

const BUILDERS = {
  residence: residenceComment,
  employment: employmentComment,
  business: businessComment,
  bank: bankComment,
  itr: itrComment,
  otherDocs: (d) => otherDocsComment(d),
};

// Build generated comments for every required section of a case.
export function generateComments(caseRow, data) {
  const applicant = caseRow?.['Applicant Name'] || 'the applicant';
  const out = {};
  requiredSectionKeys(caseRow).forEach((k) => {
    out[k] = BUILDERS[k] ? BUILDERS[k](data?.[k], applicant) : '';
  });
  return out;
}

// The text that goes into the report: reviewer's final edit, else generated.
export const finalComment = (comments, key) => {
  const f = comments?.final?.[key];
  return f !== undefined && f !== null && f !== '' ? f : (comments?.generated?.[key] || '');
};
