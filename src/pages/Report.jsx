import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getFileDataUrl } from '../utils/api';
import { useDataStore } from '../store/dataStore';
import { SECTIONS, requiredSectionKeys, isVisible, isEmpty, displayValue, cleanSection } from '../lib/sections';
import { generateComments, finalComment } from '../lib/comments';
import { fmtDate, fmtTime, fmtDateTime, safeFileName } from '../utils/format';

// ---------------------------------------------------------------------
//  A4 report on the Jain & Lunkad letterhead. Each <section.r-page> is
//  one printed page with the letterhead header, a double-line border and
//  a "Case No · Page X of Y" footer. Browser "Save as PDF" produces the PDF.
// ---------------------------------------------------------------------

const Letterhead = ({ s }) => (
  <div className="r-head">
    <div className="r-firm">{s.firmName}</div>
    <div className="r-sub">{s.firmSubtitle}</div>
    <div className="r-contact">
      <div>{s.firmAddress1}<br />{s.firmAddress2}</div>
      <div className="r-right">
        Phone&nbsp;: {s.firmPhone}<br />
        Email: <u>{s.firmEmail1}</u>{s.firmEmail2 && <><br /><span className="r-indent"><u>{s.firmEmail2}</u></span></>}
      </div>
    </div>
    <div className="r-rule" />
  </div>
);

const Comment = ({ label = 'Comment', text }) => (text ? (
  <div className="r-comment"><b>{label} :-</b> {text}</div>
) : null);

// Particulars table for a single (non-repeating) section: only filled,
// visible fields — never an unselected option.
const rowsFor = (key, d) => SECTIONS[key].fields
  .filter((f) => f.inReport !== false && !f.reviewerOnly && isVisible(f, d) && !isEmpty(d?.[f.key]))
  .map((f) => [f.label, displayValue(f, d[f.key])]);

const PTable = ({ rows, numbered = true, head = ['PARTICULARS', 'DETAILS'] }) => (
  <table className="r-table">
    <thead><tr>{numbered && <th style={{ width: '9%' }}>S. No.</th>}<th style={{ width: numbered ? '51%' : '55%' }}>{head[0]}</th><th>{head[1]}</th></tr></thead>
    <tbody>
      {rows.map(([k, v], i) => (
        <tr key={i}>{numbered && <td className="r-c">{i + 1}.</td>}<td className="r-b">{k}</td><td>{v}</td></tr>
      ))}
    </tbody>
  </table>
);

const Report = () => {
  const { caseNo } = useParams();
  const navigate = useNavigate();
  const { loadSettings, loadMaster } = useDataStore();
  const [c, setC] = useState(null);
  const [s, setS] = useState(null);
  const [city, setCity] = useState('');
  const [imgs, setImgs] = useState({});
  const [assets, setAssets] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [res, settings] = await Promise.all([api.getCase(caseNo), loadSettings(true)]);
        const cs = res.case;
        setC(cs); setS(settings);
        loadMaster('Branches').then((bs) => {
          const b = bs.find((x) => x['Branch Name'] === cs.Branch && (!x.Client || x.Client === cs.Client));
          if (b) setCity(b.City);
        }).catch(() => {});
        (cs.photos || []).forEach((p) => getFileDataUrl(p.id, caseNo).then((d) => setImgs((m) => ({ ...m, [p.id]: d }))).catch(() => {}));
        ['stampFileId', 'signatureFileId'].forEach((k) => settings[k] && getFileDataUrl(settings[k]).then((d) => setAssets((m) => ({ ...m, [k]: d }))).catch(() => {}));
      } catch (err) { setError(err.message); }
    })();
  }, [caseNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = useMemo(() => {
    if (!c || !s) return [];
    const req = requiredSectionKeys(c);
    const data = Object.fromEntries(['visit', ...req].map((k) => [k, cleanSection(k, c.data?.[k])]));
    const comments = { generated: generateComments(c, data), final: c.comments?.final || {} };
    const exec = c['Executive Name'];
    const photos = c.photos || [];
    const visitAt = (key) => {
      const ps = photos.filter((p) => p.section === key).sort((a, b) => String(a.capturedAt).localeCompare(String(b.capturedAt)));
      return ps[0]?.capturedAt || c['Started At'] || c['Submitted At'];
    };
    const execRows = (key, agency = false) => [
      ['Name of the Field Executive', exec],
      ...(agency ? [['Name of Agency', s.agencyName]] : []),
      ['Date of Visit', fmtDate(visitAt(key))],
      ['Time of Visit', fmtTime(visitAt(key))],
    ];
    const out = [];

    // 1. Case summary
    const summaryComment = req.includes('residence') ? finalComment(comments, 'residence') : finalComment(comments, req[0]);
    out.push(
      <>
        <table className="r-table r-summary">
          <thead><tr><th style={{ width: '7%' }}>S. No</th><th style={{ width: '20%' }}>PARTICULARS</th><th style={{ width: '27%' }}>DETAILS</th><th style={{ width: '20%' }}>PARTICULARS</th><th>DETAILS</th></tr></thead>
          <tbody>
            <tr><td className="r-c">1.</td><td>Name of Applicant</td><td>{c['Applicant Name']}</td><td>Client</td><td>{c.Client}</td></tr>
            <tr><td className="r-c" rowSpan={2}>2.</td><td rowSpan={2}>Address</td><td rowSpan={2}>{c['Applicant Address']}</td><td>Activity</td><td>{c.Activity}</td></tr>
            <tr><td>Product</td><td>{c.Product}</td></tr>
            <tr><td className="r-c">3.</td><td>Mobile No</td><td>{c['Applicant Mobile']}</td><td>Client Branch</td><td>{c.Branch}</td></tr>
            <tr><td className="r-c">4.</td><td>Business Name</td><td>{c['Business Name'] || '—'}</td><td>Time of Allocation</td><td>{fmtTime(c['Allocated At'])}</td></tr>
            <tr><td className="r-c">5.</td><td>Date of Allocation</td><td>{fmtDate(c['Allocated At'])}</td><td>Time of Report</td><td>{fmtTime(c['Reported At'])}</td></tr>
            <tr><td className="r-c">6.</td><td>Date of Report</td><td>{fmtDate(c['Reported At'])}</td><td>Location</td><td>{city}</td></tr>
            <tr><td className="r-c">7.</td><td>Name of Executive</td><td>{exec}</td><td>Occupation</td><td>{c.Occupation}</td></tr>
            <tr><td colSpan={5} className="r-commentcell"><Comment label="Comments" text={summaryComment} /></td></tr>
          </tbody>
        </table>
      </>
    );

    // 2. Residence
    if (req.includes('residence')) {
      out.push(<>
        <h2 className="r-title">{SECTIONS.residence.reportTitle}</h2>
        <PTable numbered={false} rows={rowsFor('residence', data.residence)} />
        <Comment text={finalComment(comments, 'residence')} />
      </>);
    }
    // 3. Bank
    if (req.includes('bank')) {
      out.push(<>
        <h2 className="r-title">{SECTIONS.bank.reportTitle}</h2>
        <PTable head={['PARTICULARS', 'DETAILS / REMARK']} rows={[...rowsFor('bank', data.bank), ...execRows('bank')]} />
        <Comment text={finalComment(comments, 'bank')} />
      </>);
    }
    // 4. Employment
    if (req.includes('employment')) {
      out.push(<>
        <h2 className="r-title">{SECTIONS.employment.reportTitle}</h2>
        <PTable rows={[['Name', c['Applicant Name']], ['Mobile Number', c['Applicant Mobile']], ...rowsFor('employment', data.employment), ...execRows('employment', true)]} />
        <Comment text={finalComment(comments, 'employment')} />
      </>);
    }
    // 5. Business
    if (req.includes('business')) {
      out.push(<>
        <h2 className="r-title">{SECTIONS.business.reportTitle}</h2>
        <PTable rows={[['Mobile', c['Applicant Mobile']], ...rowsFor('business', data.business), ...execRows('business')]} />
        <Comment text={finalComment(comments, 'business')} />
      </>);
    }
    // 6. ITR — three columns
    if (req.includes('itr')) {
      const years = (data.itr || []).slice(0, 3);
      const fields = SECTIONS.itr.fields.filter((f) => f.inReport !== false && !f.reviewerOnly && years.some((y) => isVisible(f, y) && !isEmpty(y[f.key])));
      out.push(<>
        <h2 className="r-title">{SECTIONS.itr.reportTitle}</h2>
        <table className="r-table r-itr">
          <thead><tr><th style={{ width: '7%' }}>S. No.</th><th style={{ width: '27%' }}>PARTICULARS</th>{[0, 1, 2].map((i) => <th key={i}>YEAR - {i + 1}</th>)}</tr></thead>
          <tbody>
            <tr><td className="r-c">1.</td><td className="r-b">Name</td><td colSpan={3}>{c['Applicant Name']}</td></tr>
            {fields.map((f, i) => (
              <tr key={f.key}><td className="r-c">{i + 2}.</td><td className="r-b">{f.label}</td>
                {[0, 1, 2].map((y) => <td key={y}>{years[y] && isVisible(f, years[y]) ? displayValue(f, years[y][f.key]) : ''}</td>)}
              </tr>
            ))}
            <tr><td className="r-c">{fields.length + 2}.</td><td className="r-b">No. of Years Returns Verified</td><td colSpan={3}>{years.length}</td></tr>
            <tr><td className="r-c">{fields.length + 3}.</td><td className="r-b">Name of the Field Executive</td><td colSpan={3}>{exec}</td></tr>
          </tbody>
        </table>
        <Comment text={finalComment(comments, 'itr')} />
      </>);
    }
    // 7. Other documents (3 per page)
    if (req.includes('otherDocs')) {
      const docs = data.otherDocs || [];
      for (let i = 0; i < Math.max(1, docs.length); i += 3) {
        out.push(<>
          <h2 className="r-title">{SECTIONS.otherDocs.reportTitle}</h2>
          {docs.slice(i, i + 3).map((d, j) => (
            <div key={j} className="r-block">
              <p className="r-b" style={{ margin: '6px 0 3px' }}>Document {i + j + 1}</p>
              <PTable rows={SECTIONS.otherDocs.fields.filter((f) => !isEmpty(d[f.key])).map((f) => [f.label, displayValue(f, d[f.key])])} />
            </div>
          ))}
          {i + 3 >= docs.length && <Comment text={finalComment(comments, 'otherDocs')} />}
        </>);
      }
    }
    // 8. Photos — 2x2 per page
    for (let i = 0; i < photos.length; i += 4) {
      out.push(<>
        <h2 className="r-title"><u>PHOTO</u></h2>
        <div className="r-photos">
          {photos.slice(i, i + 4).map((p) => (
            <figure key={p.id}>
              {imgs[p.id] ? <img src={imgs[p.id]} alt={p.caption} /> : <div className="r-ph">Loading photo…</div>}
              <figcaption>
                <b>{p.caption || p.section}</b> ({p.section})<br />
                GPS: {Number(p.lat).toFixed(6)}, {Number(p.lng).toFixed(6)}<br />
                {fmtDateTime(p.capturedAt)}
              </figcaption>
            </figure>
          ))}
        </div>
      </>);
    }
    // 9. Stamp & signature + disclaimer
    out.push(<>
      <div className="r-stamp">
        {assets.stampFileId && <img src={assets.stampFileId} alt="Stamp" />}
        {assets.signatureFileId && <img src={assets.signatureFileId} alt="Signature" />}
      </div>
      <p className="r-b" style={{ fontSize: '12pt', margin: '10px 0' }}>Stamp &amp; Signature</p>
      <p className="r-b" style={{ fontSize: '11pt', margin: '8px 0' }}>Disclaimer Note: -</p>
      <p className="r-disclaimer">{s.disclaimer}</p>
    </>);
    return out;
  }, [c, s, city, imgs, assets]);

  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!c || !s) return <div className="p-10 text-center text-slate-500">Preparing report…</div>;

  const approved = ['APPROVED', 'REPORT_SENT'].includes(c.Status);
  const fileName = `${c['Case No']}_${safeFileName(c['Applicant Name'])}_${safeFileName(c.Product)}`;
  const photosLoading = (c.photos || []).some((p) => !imgs[p.id]);

  const generate = async () => {
    if (photosLoading && !window.confirm('Some photos are still loading. Print anyway?')) return;
    setBusy(true);
    try {
      const r = await api.recordReport(caseNo, `${fileName}.pdf`);
      toast.success(`Report version ${r.version} recorded`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    const old = document.title;
    document.title = fileName; // browser uses this as the PDF file name
    setTimeout(() => { window.print(); document.title = old; }, 100);
  };

  return (
    <div className="r-root">
      <div className="r-toolbar no-print">
        <button onClick={() => navigate(-1)} className="r-btn"><ArrowLeft size={16} /> Back</button>
        <div className="r-tb-info">
          <b>{c['Case No']}</b> · {c['Applicant Name']} · {pages.length} pages
          {!approved && <span className="r-draft-tag">DRAFT — not approved</span>}
        </div>
        <button onClick={generate} disabled={!approved || busy} className="r-btn r-btn-primary" title={approved ? 'Records a new version, then opens Print → Save as PDF' : 'Approve the case first'}>
          <Printer size={16} /> {busy ? 'Recording…' : 'Generate PDF'}
        </button>
      </div>
      <p className="r-hint no-print">In the print dialog choose <b>Save as PDF</b>, paper <b>A4</b>, margins <b>None</b>, and enable <b>Background graphics</b>. File name: <code>{fileName}.pdf</code></p>

      {pages.map((content, i) => (
        <section className="r-page" key={i}>
          <div className="r-frame">
            {!approved && <div className="r-watermark">DRAFT</div>}
            <Letterhead s={s} />
            <div className="r-body">{content}</div>
            <div className="r-foot"><span>Case No: {c['Case No']}</span><span>Page {i + 1} of {pages.length}</span></div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Report;
