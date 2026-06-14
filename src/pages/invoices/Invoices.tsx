import { useState, useEffect, useMemo } from 'react';
import { getInvoices, deleteInvoice, downloadInvoicePDF } from '../../api/invoiceAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiTrash2, FiDownload, FiPrinter, FiSearch, FiX } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const statusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  brouillon: 'default', émise: 'info', payée: 'success'
};

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function Invoices() {
  const [invoices, setInvoices]       = useState<any[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<any>(null);
  const [saving, setSaving]           = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Filtres
  const [search, setSearch]           = useState<string>('');
  const [period, setPeriod]           = useState<PeriodFilter>('all');

  const fetchAll = async () => {
    try {
      const res = await getInvoices();
      setInvoices(res.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 60000);

  // ── FILTRAGE ──────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...invoices];

    // Filtre recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.clientName?.toLowerCase().includes(q)
      );
    }

    // Filtre période
    if (period !== 'all') {
      const now   = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(i => {
        const date = new Date(i.createdAt);
        if (period === 'today') {
          return date >= today;
        }
        if (period === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }
        if (period === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return date >= monthStart;
        }
        return true;
      });
    }

    return result;
  }, [invoices, search, period]);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteInvoice(selected._id);
      toast.success('Facture supprimée !');
      setDeleteModal(false);
      fetchAll();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleDownload = async (invoice: any) => {
    setDownloading(invoice._id);
    try {
      const res = await downloadInvoicePDF(invoice._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Facture-${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé !');
    } catch { toast.error('Erreur téléchargement'); }
    finally { setDownloading(null); }
  };

  const handlePrint = async (invoice: any) => {
    setDownloading(invoice._id);
    try {
      const res  = await downloadInvoicePDF(invoice._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `Facture-${invoice.invoiceNumber}.pdf`;
        a.click();
        toast.success('PDF téléchargé — les popups sont bloquées');
      }
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Erreur impression'); }
    finally { setDownloading(null); }
  };

  const columns = [
    { header: 'N° Facture', render: (i: any) => (
      <span className="font-mono font-semibold text-blue-900 text-sm">{i.invoiceNumber}</span>
    )},
    { header: 'Client', render: (i: any) => (
      <span className="text-sm text-gray-700">{i.clientName}</span>
    )},
    { header: 'Total HT',  render: (i: any) => (
      <span className="text-sm">{formatAmount(i.totalHT)} GNF</span>
    )},
    { header: 'Total TTC', render: (i: any) => (
      <span className="text-sm font-semibold text-blue-900">{formatAmount(i.totalTTC)} GNF</span>
    )},
    { header: 'Statut', render: (i: any) => (
      <Badge label={i.status} variant={statusVariant[i.status] || 'default'} />
    )},
    { header: 'Date', render: (i: any) => (
      <span className="text-xs text-gray-500">{formatDate(i.createdAt)}</span>
    )},
    { header: 'Actions', render: (i: any) => (
      <div className="flex items-center gap-2">
        {/* Télécharger PDF */}
        <button onClick={() => handleDownload(i)}
          disabled={downloading === i._id}
          title="Télécharger PDF"
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50">
          <FiDownload size={15} />
        </button>
        {/* Imprimer */}
        <button onClick={() => handlePrint(i)}
          disabled={downloading === i._id}
          title="Imprimer"
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50">
          <FiPrinter size={15} />
        </button>
        {/* Supprimer */}
        <button onClick={() => { setSelected(i); setDeleteModal(true); }}
          title="Supprimer"
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  const periodLabels: Record<PeriodFilter, string> = {
    all:   'Tout',
    today: "Aujourd'hui",
    week:  'Cette semaine',
    month: 'Ce mois',
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Factures</h1>
        <p className="text-gray-500 text-sm mt-1">
          {filtered.length} facture(s) {search || period !== 'all' ? 'trouvée(s)' : 'au total'}
        </p>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3">

        {/* Recherche */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de facture ou nom du client..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Filtres période */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(periodLabels) as PeriodFilter[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${period === p
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage={
            search || period !== 'all'
              ? 'Aucune facture trouvée pour ces critères'
              : 'Aucune facture'
          }
        />
      </div>

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">
          Supprimer la facture <strong>{selected?.invoiceNumber}</strong> ?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}