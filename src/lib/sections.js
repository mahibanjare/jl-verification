// =====================================================================
//  ONE unified data model for the field form, the review screen and the
//  PDF report. Every section of the paper checklist AND the Word report
//  lives here. Option fields store exactly one selected value, so the
//  report can never print "Owned / Rented".
// =====================================================================

const OVERALL = ['Positive', 'Negative', 'Refer'];
const APPEARANCE = ['Poor', 'Fair', 'Good', 'Excellent'];
const POS_NEG = ['Positive', 'Negative'];
const eq = (field, value) => (d) => d?.[field] === value;

export const VERIFICATIONS = [
  { key: 'residence', label: 'Residence' },
  { key: 'employment', label: 'Employment' },
  { key: 'business', label: 'Business' },
  { key: 'bank', label: 'Bank' },
  { key: 'itr', label: 'ITR' },
  { key: 'otherDocs', label: 'Other Docs' },
];

// Sections that involve a physical visit -> need at least one GPS photo.
export const PHOTO_SECTIONS = ['residence', 'employment', 'business'];

export const requiredSectionKeys = (c) => {
  const raw = String(c?.['Verifications Required'] || '').toLowerCase();
  return VERIFICATIONS.filter((v) => raw.split(',').map((s) => s.trim()).includes(v.label.toLowerCase())).map((v) => v.key);
};

export const SECTIONS = {
  visit: {
    key: 'visit',
    title: 'Visit Info',
    fields: [
      { key: 'mobileActive', label: 'Applicant Mobile Number Active', type: 'yesno', required: true },
      { key: 'totalKm', label: 'Total KM Travelled', type: 'number', required: true, suffix: 'km' },
      { key: 'totalTimeMin', label: 'Total Time Taken (minutes)', type: 'number', suffix: 'min' },
      { key: 'kycMatches', label: 'KYC as per Address', type: 'yesno', required: true },
      { key: 'kycRemark', label: 'KYC Mismatch Remark', type: 'textarea', required: true, showIf: eq('kycMatches', 'No') },
    ],
  },

  residence: {
    key: 'residence',
    title: 'Residence',
    reportTitle: 'RESIDENCE VERIFICATION',
    fields: [
      { key: 'addressVerified', label: 'Residential Address (as verified)', type: 'textarea', required: true, full: true },
      { key: 'landmark', label: 'Prominent Landmark', type: 'text' },
      { key: 'locality', label: 'Locality of Residence', type: 'select', options: ['Lower Class', 'Middle Class', 'Upper Class'], required: true },
      { key: 'accessibility', label: 'Residence Accessibility', type: 'select', options: ['Easy to Locate and Access', 'Difficult to Locate and Access'], required: true },
      { key: 'externalAppearance', label: 'External Appearance of House / Building', type: 'select', options: APPEARANCE, required: true },
      { key: 'construction', label: 'Construction of House', type: 'select', options: ['Constructed', 'Under Construction'], required: true },
      { key: 'entryAllowed', label: 'Entry Allowed in Residence', type: 'yesno', required: true },
      { key: 'carpetArea', label: 'Carpet Area', type: 'number', suffix: 'Sq. Ft' },
      { key: 'internalAppearance', label: 'Internal Appearance of House', type: 'select', options: APPEARANCE, required: true, showIf: eq('entryAllowed', 'Yes') },
      { key: 'assetsSeen', label: 'Assets Seen at Residence', type: 'multiselect', options: ['TV', 'Fridge', 'AC', 'Washing Machine', 'Two-wheeler', 'Car', 'Sofa', 'Other'] },
      { key: 'personName', label: 'Name of Person Contacted', type: 'text', required: true },
      { key: 'personRelation', label: 'Relation with Applicant', type: 'select', options: ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Other'], required: true },
      { key: 'applicantStays', label: 'Does the Applicant Stay in the Residence', type: 'yesno', required: true },
      { key: 'stayYears', label: 'Duration of Stay (years)', type: 'number', required: true, showIf: eq('applicantStays', 'Yes'), suffix: 'Years' },
      { key: 'ownership', label: 'Residence Ownership Status', type: 'select', options: ['Owned', 'Rented', 'Parental', 'Company Provided'], required: true },
      { key: 'monthlyRent', label: 'Monthly Rent', type: 'number', required: true, showIf: eq('ownership', 'Rented'), money: true },
      { key: 'availableTime', label: 'Approx. Time Applicant Is Available at Home', type: 'text' },
      { key: 'familyMembers', label: 'Number of Family Members', type: 'number', required: true },
      { key: 'earningMembers', label: 'Number of Earning Members', type: 'number', required: true },
      { key: 'earningDetail', label: 'Earning Members (e.g. Self + Wife)', type: 'text' },
      { key: 'ebillOwner', label: 'Electricity Bill in the Name of', type: 'text' },
      { key: 'propertyOwnerPhone', label: 'Property Owner Number', type: 'tel' },
      { key: 'neighbourName', label: 'Neighbour Name', type: 'text', required: true },
      { key: 'neighbourFeedback', label: 'Neighbour Feedback', type: 'select', options: POS_NEG, required: true },
      { key: 'neighbourStayYears', label: 'Neighbour Confirms Stay (years)', type: 'number', suffix: 'Years' },
      { key: 'addressConcern', label: 'Any Concern About the Address?', type: 'yesno', required: true, inReport: false },
      { key: 'addressConcernRemark', label: 'Address Concern Remark', type: 'textarea', required: true, showIf: eq('addressConcern', 'Yes'), inReport: false, full: true },
      { key: 'overall', label: 'Overall Assessment', type: 'select', options: OVERALL, required: true },
    ],
  },

  employment: {
    key: 'employment',
    title: 'Employment',
    reportTitle: 'EMPLOYMENT / SALARY VERIFICATION',
    fields: [
      { key: 'companyName', label: 'Name of the Company', type: 'text', required: true },
      { key: 'officeAddress', label: 'Office Address', type: 'textarea', required: true, full: true },
      { key: 'applicantDesignation', label: 'Designation of the Applicant', type: 'text', required: true },
      { key: 'idCardSeen', label: 'Employee ID Card Seen', type: 'yesno', required: true },
      { key: 'visitingCardSeen', label: 'Visiting Card Seen', type: 'yesno' },
      { key: 'officialName', label: 'Name of the Official Met', type: 'text', required: true },
      { key: 'officialDesignation', label: 'Designation of the Official Met', type: 'text', required: true },
      { key: 'officialPhone', label: 'Official Phone Number', type: 'tel' },
      { key: 'jobType', label: 'Type of Job', type: 'select', options: ['Government', 'Private', 'Samvida'], required: true },
      { key: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
      { key: 'yearsInJob', label: 'Years in Current Job', type: 'number', required: true, suffix: 'Years' },
      { key: 'salaryProof', label: 'Salary Particulars', type: 'select', options: ['Salary Slip', 'Form 16', 'Salary Slip & Form 16', 'None'], required: true },
      { key: 'lastSalary', label: 'Last Salary Drawn', type: 'number', money: true },
      { key: 'infoMatches', label: 'All Information Collected Matches the Details Furnished', type: 'yesno', required: true },
      { key: 'unmatchedDetails', label: 'Details of Unmatched Items', type: 'textarea', required: true, showIf: eq('infoMatches', 'No'), full: true },
      { key: 'overall', label: 'Overall Assessment', type: 'select', options: OVERALL, required: true },
    ],
    derive: (d, changed) => {
      if (changed === 'dateOfJoining' && d.dateOfJoining) {
        const yrs = (Date.now() - new Date(d.dateOfJoining).getTime()) / (365.25 * 864e5);
        if (yrs >= 0) return { yearsInJob: Math.round(yrs * 10) / 10 };
      }
      return null;
    },
  },

  business: {
    key: 'business',
    title: 'Business',
    reportTitle: 'BUSINESS VERIFICATION',
    fields: [
      { key: 'boardName', label: 'Name on Board / Visiting Card', type: 'text' },
      { key: 'businessmanName', label: 'Name of the Businessman', type: 'text', required: true },
      { key: 'businessName', label: 'Name of the Business', type: 'text', required: true },
      { key: 'addressAsPerDoc', label: 'Business Address as per Document', type: 'textarea', full: true },
      { key: 'presentAddress', label: 'Present Business Address', type: 'textarea', required: true, full: true },
      { key: 'landmark', label: 'Landmark for Identification', type: 'text' },
      { key: 'personContacted', label: 'Person Contacted', type: 'text', required: true },
      { key: 'personDesignation', label: 'Designation of Person Contacted', type: 'text' },
      { key: 'natureOfBusiness', label: 'Nature of Business', type: 'text', required: true },
      { key: 'yearOfCommencement', label: 'Year of Commencement', type: 'number', required: true },
      { key: 'locationType', label: 'Location of Business', type: 'select', options: ['Residential', 'Commercial'], required: true },
      { key: 'appearance', label: 'General Appearance of the Business Unit', type: 'select', options: APPEARANCE, required: true },
      { key: 'propertyOwnership', label: 'Ownership of Business Property', type: 'select', options: ['Owned', 'Rented'], required: true },
      { key: 'proofDocument', label: 'Proof Document Seen', type: 'select', options: ['Rent Agreement', 'Electricity Bill', 'Other'] },
      { key: 'employeesCount', label: 'No. of Employees in Business Unit', type: 'number' },
      { key: 'assetsVisible', label: 'Assets Visible', type: 'text' },
      { key: 'neighbourName', label: 'Neighbour Name', type: 'text' },
      { key: 'neighbourFeedback', label: 'Neighbour Feedback', type: 'select', options: POS_NEG, showIf: (d) => !!d?.neighbourName },
      { key: 'evidenceCollected', label: 'Any Evidence Collected Supporting Business', type: 'yesno', required: true },
      { key: 'infoMatches', label: 'All Information Collected Matches the Details Furnished', type: 'yesno', required: true },
      { key: 'unmatchedDetails', label: 'Details of Unmatched Items', type: 'textarea', required: true, showIf: eq('infoMatches', 'No'), full: true },
      { key: 'overall', label: 'Overall Assessment', type: 'select', options: OVERALL, required: true },
    ],
  },

  bank: {
    key: 'bank',
    title: 'Bank',
    reportTitle: 'BANK VERIFICATION',
    fields: [
      { key: 'accountHolder', label: 'Name of Account Holder', type: 'text', required: true },
      { key: 'bankName', label: 'Name of the Bank', type: 'text', required: true },
      { key: 'bankAddress', label: 'Address of the Bank', type: 'textarea', full: true },
      { key: 'accountNumber', label: 'Account Number', type: 'text', required: true, sensitive: true },
      { key: 'accountOpenedOn', label: 'Date of Account Opened', type: 'date' },
      { key: 'statementMonths', label: 'Period of Statement Verified', type: 'number', required: true, suffix: 'Months', default: 6 },
      { key: 'discrepancies', label: 'Discrepancies Observed in the Statement', type: 'yesno', required: true },
      { key: 'signedByOfficial', label: 'Bank Statement Duly Signed by Bank Official', type: 'yesno', required: true },
      { key: 'evidenceObtained', label: 'Evidence Supporting Proof of Verified Document Obtained', type: 'yesno', required: true },
      { key: 'infoMatches', label: 'All Information Collected Matches the Details Furnished', type: 'yesno', required: true },
      { key: 'unmatchedDetails', label: 'Details of Unmatched Items', type: 'textarea', required: true, showIf: eq('infoMatches', 'No'), full: true },
      { key: 'overall', label: 'Overall Assessment', type: 'select', options: OVERALL, required: true },
    ],
  },

  itr: {
    key: 'itr',
    title: 'ITR / Form 16',
    reportTitle: 'ITR / FORM 16 VERIFICATION',
    repeat: { max: 3, label: 'Year' },
    fields: [
      { key: 'documentType', label: 'Type of Document', type: 'select', options: ['ITR', 'Form 16'], required: true },
      { key: 'assessmentYear', label: 'Assessment Year', type: 'text', required: true, placeholder: '2025-26', pattern: /^\d{4}-\d{2}$/, patternMsg: 'use format 2025-26' },
      { key: 'businessClass', label: 'Business Class', type: 'select', options: ['Service', 'Self Employed', 'Manufacturing', 'Professional'], required: true },
      { key: 'pan', label: 'PAN Number', type: 'text', required: true, upper: true, maxLength: 10, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, patternMsg: 'invalid PAN (format AAAAA9999A)', sensitive: true },
      { key: 'itWard', label: 'IT Ward Office No. / Address', type: 'text' },
      { key: 'filingDate', label: 'Date of Filing of Return', type: 'date', required: true },
      { key: 'ackNo', label: 'Acknowledgement No.', type: 'text', required: true },
      { key: 'computationVerified', label: 'Computation of Income Verified', type: 'yesno', required: true },
      { key: 'incomeSubmitted', label: 'Income as per Documents Submitted', type: 'number', money: true, required: true },
      { key: 'incomeVerified', label: 'Income as per Verified Documents', type: 'number', money: true },
      { key: 'status', label: 'Return Status', type: 'select', options: ['Processed with No Demand / Refund', 'Processed with Refund', 'Processed with Demand', 'Not Processed'], required: true },
      { key: 'genuine', label: 'Document Submitted Is Genuine', type: 'yesno', required: true },
      { key: 'genuineOverride', label: 'Reviewer Override Reason (genuine without computation)', type: 'textarea', reviewerOnly: true, inReport: false, showIf: (d) => d?.computationVerified === 'No' && d?.genuine === 'Yes', full: true },
      { key: 'infoMatches', label: 'All Information Collected Matches the Details Furnished', type: 'yesno', required: true },
      { key: 'unmatchedDetails', label: 'Details of Unmatched Items', type: 'textarea', required: true, showIf: eq('infoMatches', 'No'), full: true },
      { key: 'overall', label: 'Overall Assessment', type: 'select', options: OVERALL, required: true },
    ],
  },

  otherDocs: {
    key: 'otherDocs',
    title: 'Other Docs',
    reportTitle: 'OTHER DOCUMENTS VERIFICATION',
    repeat: { max: 10, label: 'Document' },
    fields: [
      { key: 'documentName', label: 'Name of Document', type: 'text', required: true },
      { key: 'businessName', label: 'Name of Business', type: 'text' },
      { key: 'proprietorName', label: 'Name of the Proprietor', type: 'text' },
      { key: 'propertyLocation', label: 'Location of Property', type: 'textarea', full: true },
      { key: 'landmark', label: 'Landmark for Identification', type: 'text' },
      { key: 'dateOfIssue', label: 'Date of Issue', type: 'date' },
      { key: 'genuine', label: 'Document Found Genuine', type: 'yesno', required: true },
      { key: 'remark', label: 'Remark', type: 'textarea', full: true },
    ],
  },
};

export const isVisible = (field, data) => !field.showIf || field.showIf(data || {});

export const isEmpty = (x) =>
  x === undefined || x === null || (typeof x === 'string' && x.trim() === '') || (Array.isArray(x) && x.length === 0);

// Drop values of fields that are hidden (e.g. rent when not rented) so the
// data can never contradict itself.
const cleanOne = (section, d) => {
  const out = {};
  section.fields.forEach((f) => {
    if (isVisible(f, d) && !isEmpty(d?.[f.key])) out[f.key] = d[f.key];
  });
  return out;
};
export const cleanSection = (key, value) => {
  const section = SECTIONS[key];
  if (!section) return value;
  if (section.repeat) return (Array.isArray(value) ? value : []).map((v) => cleanOne(section, v));
  return cleanOne(section, value || {});
};

export const defaultsFor = (key) => {
  const section = SECTIONS[key];
  const one = {};
  section.fields.forEach((f) => { if (f.default !== undefined) one[f.key] = f.default; });
  return section.repeat ? [one] : one;
};

// Format a stored value for display / the PDF (only the selected value).
export const displayValue = (field, v) => {
  if (isEmpty(v)) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (field.type === 'date') {
    const [y, m, d] = String(v).split('-');
    return d ? `${d}/${m}/${y}` : String(v);
  }
  if (field.money) return `Rs. ${Number(v).toLocaleString('en-IN')}/-`;
  if (field.suffix) return `${v} ${field.suffix}`;
  return String(v);
};

export const SECTION_COLUMN = {
  visit: 'Visit', residence: 'Residence', employment: 'Employment', business: 'Business',
  bank: 'Bank', itr: 'ITR', otherDocs: 'Other Docs',
};
