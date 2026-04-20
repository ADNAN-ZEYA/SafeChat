import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, TrashIcon, ExclamationTriangleIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
  getPendingReports: async () => { const res = await fetch(`${API_BASE_URL}/message_reports/pending`); const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data; },
  resolveReport: async (reportId, reviewerUsername) => { const res = await fetch(`${API_BASE_URL}/message_reports/${reportId}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewed_by_username: reviewerUsername }) }); const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data; },
  dismissReport: async (reportId, reviewerUsername) => { const res = await fetch(`${API_BASE_URL}/message_reports/${reportId}/dismiss`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewed_by_username: reviewerUsername }) }); const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data; },
};

function ReportStatusBadge({ status, reason }) {
  const statusColors = { pending: 'bg-sc-tertiary/30 text-sc-on-tertiary border-sc-tertiary/30', resolved: 'bg-sc-secondary/40 text-sc-on-secondary border-sc-secondary/30', dismissed: 'bg-sc-container-top text-sc-text-muted border-sc-outline/25' };
  const reasonLabels = { spam: '🚫 Spam', harassment: '😠 Harassment', hate: '🤐 Hate Speech', scam: '⚠️ Scam', other: '❓ Other' };
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusColors[status] || statusColors.pending}`}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>
      <span className="rounded-full bg-sc-container-high px-3 py-1 text-xs font-medium text-sc-text-muted border border-sc-outline/20">{reasonLabels[reason] || reason}</span>
    </div>
  );
}

function ReportCard({ report, onResolve, onDismiss, isProcessing }) {
  const formatDate = (d) => { try { return new Date(d).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
  return (
    <div className="rounded-card bg-sc-container-low p-7 elevation-2 hover-lift transition-all animate-fade-in-up">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-sc-primary" />
            <h3 className="font-display text-sm font-semibold text-sc-text">Report #{report.report_id}</h3>
            <span className="text-xs text-sc-text-muted">{formatDate(report.created_at)}</span>
          </div>
          <ReportStatusBadge status={report.status} reason={report.reason} />
        </div>
      </div>
      <div className="mb-5 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sc-text-muted">Reporter → Reported</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-sc-text">
            <span className="inline-block h-6 w-6 rounded-full bg-sc-secondary text-center text-xs leading-6 text-sc-on-secondary border border-sc-on-secondary/15">{report.reporter_username?.[0]?.toUpperCase()}</span>
            <span className="font-semibold">{report.reporter_username}</span>
            <span className="text-sc-text-muted">→</span>
            <span className="inline-block h-6 w-6 rounded-full bg-sc-primary-light/30 text-center text-xs leading-6 text-sc-primary border border-sc-primary/15">{report.reported_username?.[0]?.toUpperCase()}</span>
            <span className="font-semibold">{report.reported_username}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sc-text-muted">Message</p>
          <div className="mt-2 rounded-2xl bg-sc-container p-4 text-sm text-sc-text border border-sc-outline/20"><p className="break-words leading-relaxed">"{report.message_text || '[Deleted]'}"</p></div>
        </div>
        {report.description && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-sc-text-muted">Description</p>
            <div className="mt-2 rounded-2xl bg-sc-container p-4 text-sm text-sc-text border border-sc-outline/20"><p className="break-words leading-relaxed">{report.description}</p></div>
          </div>
        )}
      </div>
      {report.status === 'pending' && (
        <div className="flex gap-3 pt-5 border-t border-sc-outline/15">
          <button onClick={() => onResolve(report.report_id)} disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all disabled:opacity-50">
            <CheckCircleIcon className="h-4 w-4" />{isProcessing ? 'Processing...' : 'Resolve'}
          </button>
          <button onClick={() => onDismiss(report.report_id)} disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sc-container-top px-4 py-2.5 text-sm font-semibold text-sc-text-muted border border-sc-outline/30 hover:bg-sc-surface-dim hover-scale transition-all disabled:opacity-50">
            <TrashIcon className="h-4 w-4" />{isProcessing ? 'Processing...' : 'Dismiss'}
          </button>
        </div>
      )}
      {report.status !== 'pending' && (
        <div className="pt-5 border-t border-sc-outline/15">
          <p className="text-xs text-sc-text-muted"><span className="font-semibold capitalize text-sc-text">{report.status}</span> by <span className="text-sc-text">{report.reviewed_by || 'Unknown'}</span>
            {report.reviewed_at && (<> on <span className="text-sc-text">{formatDate(report.reviewed_at)}</span></>)}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({ user, onClose, onNavigateToHome, onLogout, showNotification }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingReportId, setProcessingReportId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try { const data = await api.getPendingReports(); setReports(Array.isArray(data) ? data : []); }
    catch (error) { showNotification(`Error: ${error.message}`); setReports([]); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { fetchReports(); const iv = setInterval(fetchReports, 10000); return () => clearInterval(iv); }, [fetchReports]);

  const handleResolve = async (id) => { setProcessingReportId(id); try { await api.resolveReport(id, user); showNotification('Report resolved.'); fetchReports(); } catch (e) { showNotification(`Error: ${e.message}`); } finally { setProcessingReportId(null); } };
  const handleDismiss = async (id) => { setProcessingReportId(id); try { await api.dismissReport(id, user); showNotification('Report dismissed.'); fetchReports(); } catch (e) { showNotification(`Error: ${e.message}`); } finally { setProcessingReportId(null); } };

  const pending = reports.filter((r) => r.status === 'pending');
  const resolved = reports.filter((r) => r.status === 'resolved');
  const dismissed = reports.filter((r) => r.status === 'dismissed');
  const displayed = filterStatus === 'pending' ? pending : filterStatus === 'resolved' ? resolved : dismissed;

  return (
    <div className="relative min-h-screen bg-sc-surface text-sc-text">
      <header className="sticky top-0 z-50 frosted-glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <div className="animate-fade-in-up">
            <h1 className="font-display text-2xl font-bold text-sc-text">Message Reports</h1>
            <p className="mt-1 text-sm text-sc-text-muted">Review and manage user-reported messages</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchReports} className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all disabled:opacity-50" disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
            <button onClick={onNavigateToHome} className="rounded-full bg-sc-container-high px-5 py-2.5 text-sm font-semibold text-sc-text border border-sc-outline/30 transition hover:bg-sc-container-top hover-scale flex items-center gap-2"><ArrowLeftIcon className="h-4 w-4" />Back</button>
            <button onClick={onLogout} className="rounded-full bg-sc-primary-light/15 px-5 py-2.5 text-sm font-semibold text-sc-primary border border-sc-primary/20 transition hover:bg-sc-primary-light/30 hover-scale flex items-center gap-2"><ArrowRightOnRectangleIcon className="h-4 w-4" />Logout</button>
          </div>
        </div>
        <div className="bg-sc-container-low/50 px-8 py-3 border-t border-sc-outline/15">
          <div className="mx-auto max-w-6xl flex gap-2">
            {[{ key: 'pending', label: `Pending (${pending.length})` }, { key: 'resolved', label: `Resolved (${resolved.length})` }, { key: 'dismissed', label: `Dismissed (${dismissed.length})` }].map(({ key, label }) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-full border transition-all ${filterStatus === key ? 'bg-gradient-primary text-sc-on-primary border-sc-primary/20 shadow-glow-coral' : 'text-sc-text-muted border-sc-outline/25 hover:bg-sc-container-high hover:text-sc-text'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-10">
        {loading && displayed.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center"><div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-sc-container-high border-t-sc-primary mx-auto" /><p className="text-sc-text-muted">Loading...</p></div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-card bg-sc-container-low elevation-1 animate-fade-in-up">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-sc-outline mb-3" />
              <p className="text-sc-text-muted">{filterStatus === 'pending' ? 'No pending reports. Inbox clear! 🎉' : `No ${filterStatus} reports.`}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">{displayed.map((r, idx) => <ReportCard key={r.report_id} report={r} onResolve={handleResolve} onDismiss={handleDismiss} isProcessing={processingReportId === r.report_id} />)}</div>
        )}
      </main>
      {reports.length > 0 && (
        <footer className="bg-sc-container-low px-8 py-5 border-t border-sc-outline/20">
          <div className="mx-auto max-w-6xl flex items-center justify-between text-sm">
            <p className="text-sc-text-muted">Total: <span className="font-semibold text-sc-text">{reports.length}</span></p>
            <p className="text-sc-text-muted">Pending: <span className="font-semibold text-sc-on-tertiary">{pending.length}</span> | Resolved: <span className="font-semibold text-sc-on-secondary">{resolved.length}</span> | Dismissed: <span className="font-semibold">{dismissed.length}</span></p>
          </div>
        </footer>
      )}
    </div>
  );
}
