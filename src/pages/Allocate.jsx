import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useDataStore } from '../store/dataStore';
import CaseMetaForm, { blankCase } from '../components/CaseMetaForm';
import { PageHeader, Card, Button } from '../components/ui';
import { parseCsv, toCsv, downloadText } from '../utils/csv';

const CSV_HEADERS = Object.keys(blankCase);

const Allocate = () => {
  const navigate = useNavigate();
  const loadCases = useDataStore((s) => s.loadCases);
  const [formKey, setFormKey] = useState(0);
  const [bulk, setBulk] = useState([]);
  const [creating, setCreating] = useState(false);

  const createOne = async (form) => {
    const res = await api.createCases([form]);
    toast.success(`Case ${res.created[0]} allocated`);
    loadCases().catch(() => {});
    setFormKey((k) => k + 1);
  };

  const onCsv = async (file) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) return toast.error('CSV is empty');
    const missing = CSV_HEADERS.filter((h) => !(h in rows[0]));
    if (missing.length) return toast.error(`Missing columns: ${missing.join(', ')}`);
    setBulk(rows);
  };

  const createBulk = async () => {
    setCreating(true);
    try {
      const res = await api.createCases(bulk);
      toast.success(`${res.created.length} cases allocated`);
      setBulk([]);
      loadCases().catch(() => {});
      navigate('/cases');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const template = () => downloadText('case-allocation-template.csv', toCsv([{
    ...blankCase, Client: 'HDFC Bank', Branch: 'Raipur Main', 'Applicant Name': 'Applicant Full Name',
    'Applicant Mobile': '9876543210', 'Applicant Address': 'Full address', 'Verifications Required': 'Residence, Employment, Bank',
    'Assigned To': 'exec_user_id',
  }], CSV_HEADERS));

  return (
    <div className="space-y-3">
      <PageHeader icon="FilePlus2" title="Allocate Case" subtitle="Allocation date & time are recorded automatically. Case No. is auto-generated (JL-YYYY-000001)." />

      <Card className="p-4 sm:p-6">
        <CaseMetaForm key={formKey} onSubmit={createOne} />
      </Card>

      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Bulk allocation (CSV)</h2>
            <p className="text-xs text-slate-500">Columns: {CSV_HEADERS.join(', ')}. “Assigned To” = executive's User ID.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon="Download" onClick={template}>Template</Button>
            <label className="px-4 py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-2">
              Upload CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { onCsv(e.target.files[0]); e.target.value = ''; }} />
            </label>
          </div>
        </div>

        {bulk.length > 0 && (
          <>
            <div className="overflow-auto max-h-80 border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-indigo-50 sticky top-0">
                  <tr>{CSV_HEADERS.map((h) => <th key={h} className="text-left px-3 py-2 font-bold text-indigo-700 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {bulk.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {CSV_HEADERS.map((h) => <td key={h} className="px-3 py-1.5 whitespace-nowrap text-gray-700">{r[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBulk([])}>Cancel</Button>
              <Button icon="Check" loading={creating} onClick={createBulk}>Create {bulk.length} cases</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Allocate;
