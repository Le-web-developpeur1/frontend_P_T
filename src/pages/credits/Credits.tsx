import { useState, useEffect } from 'react';
import { getClients, recordClientPayment, getClientCredits, downloadCreditPDF } from '../../api/clientAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiEye, FiDollarSign, FiDownload, FiPrinter, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

export default function Credits() {
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [detailModal, setDetailModal] = useState(false);
  const [payModal, setPayModal]       = useState(false);
  const [selected, setSelected]       = useState(null);
  const [creditData, setCreditData]   = useState(null);
  const [payAmount, setPayAmount]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch]           = useState('');

  const fetchClients = async () => {
    try {
      const res = await getClients();
      // On filtre uniquement les clients qui ont une dette
      setClients(res.data.filter(c => c.currentDebt > 0 || c.creditLimit > 0));
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);
  useAutoRefresh(fetchClients, 15000);

  const openDetail = async (client) => {
    setSelected(client);
    setCreditData(null);
    setDetailModal(true);
    try {
      const res = await getClientCredits(client._id);
      setCreditData(res.data);
    } catch { toast.error('Erreur chargement détails'); }
  };

  const openPay = (client) => {
    setSelected(client);
    setPayAmount('');
    setPayModal(true);
  };

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Montant invalide'); return; }
    if (Number(payAmount) > selected.currentDebt) {
      toast.error('Le montant dépasse la dette actuelle'); return;
    }
    setSaving(true);
    try {
      await recordClientPayment(selected._id, { amount: Number(payAmount) });
      toast.success('Paiement enregistré !');
      setPayModal(false);
      fetchClients();
      // Refresh le détail si ouvert
      if (detailModal && selected) {
        const res = await getClientCredits(selected._id);
        setCreditData(res.data);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDownloadPDF = async (client) => {
    setDownloading(true);
    try {
      const res = await downloadCreditPDF(client._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Credit-${client.name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé !');
    } catch { toast.error('Erreur téléchargement'); }
    finally { setDownloading(false); }
  };

  const handlePrintPDF = async (client) => {
    setDownloading(true);
    try {
      const res = await downloadCreditPDF(client._id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const printWindow = window.open(url, '_blank');
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch { toast.error('Erreur impression'); }
    finally { setDownloading(false); }
  };

  // Stats globales
  const totalDebt    = clients.reduce((sum, c) => sum + c.currentDebt, 0);
  const blockedCount = clients.filter(c => c.isBlocked).length;

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const statusVariant = { 'payé': 'success', 'partiel': 'warning', 'crédit': 'danger' };

  const columns = [
    { header: 'Client', render: (c) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A2B5F] flex items-center justify-center text-[#D4A017] font-bold text-sm flex-shrink-0">
          {c.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
          <p className="text-xs text-gray-400">{c.phone || '—'}</p>
        </div>
      </div>
    )},
    { header: 'Plafond', render: (c) => (
      <span className="text-sm">{formatAmount(c.creditLimit)} GNF</span>
    )},
    { header: 'Dette actuelle', render: (c) => (
      <span className={`font-bold text-sm ${c.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatAmount(c.currentDebt)} GNF
      </span>
    )},
    { header: 'Utilisation', render: (c) => {
      const pct = c.creditLimit > 0 ? Math.round((c.currentDebt / c.creditLimit) * 100) : 0;
      return (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      );
    }},
    { header: 'Statut', render: (c) => (
      <Badge label={c.isBlocked ? 'Bloqué' : 'Actif'} variant={c.isBlocked ? 'danger' : 'success'} />
    )},
    { header: 'Actions', render: (c) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openDetail(c)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Voir détails">
          <FiEye size={15} />
        </button>
        {c.currentDebt > 0 && (
          <button onClick={() => openPay(c)}
            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="Enregistrer paiement">
            <FiDollarSign size={15} />
          </button>
        )}
        <button onClick={() => handleDownloadPDF(c)}
          className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
          title="Télécharger PDF" disabled={downloading}>
          <FiDownload size={15} />
        </button>
        <button onClick={() => handlePrintPDF(c)}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
          title="Imprimer" disabled={downloading}>
          <FiPrinter size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Gestion des Crédits</h1>
          <p className="text-gray-500 text-sm">Suivi des clients créditeurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FiUsers,        label: 'Clients créditeurs', value: clients.length,                      color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { icon: FiAlertTriangle,label: 'Comptes bloqués',    value: blockedCount,                        color: 'text-red-600',    bg: 'bg-red-50'    },
          { icon: FiDollarSign,   label: 'Total dettes',       value: `${formatAmount(totalDebt)} GNF`,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`${bg} rounded-lg p-2.5`}>
                <Icon className={color} size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <input type="text" placeholder="Rechercher un client..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucun client créditeur" />
      </div>

      {/* Modal Détail */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)}
        title={`Relevé de compte — ${selected?.name}`} size="xl">
        {!creditData ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Infos client */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Informations client</p>
                <p className="text-sm"><span className="text-gray-500">Nom :</span> <strong>{creditData.client.name}</strong></p>
                <p className="text-sm"><span className="text-gray-500">Téléphone :</span> <strong>{creditData.client.phone || '—'}</strong></p>
                <p className="text-sm"><span className="text-gray-500">Adresse :</span> <strong>{creditData.client.address || '—'}</strong></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Résumé du compte</p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-500">Total crédit :</span>
                  <strong>{formatAmount(creditData.totalCredit)} GNF</strong>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-500">Total remboursé :</span>
                  <strong className="text-green-600">{formatAmount(creditData.totalPaid)} GNF</strong>
                </p>
                <p className="text-sm flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Solde restant :</span>
                  <strong className="text-red-600 text-base">{formatAmount(creditData.totalRemaining)} GNF</strong>
                </p>
              </div>
            </div>

            {/* Blocage */}
            {creditData.client.isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <FiAlertTriangle className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-semibold">
                  Compte bloqué — Plafond de {formatAmount(creditData.client.creditLimit)} GNF dépassé
                </p>
              </div>
            )}

            {/* Tableau ventes */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Historique des achats à crédit ({creditData.sales.length})
              </p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      {['N° Vente', 'Date', 'Produits', 'Montant', 'Payé', 'Reste', 'Statut'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creditData.sales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                          Aucune vente à crédit
                        </td>
                      </tr>
                    ) : creditData.sales.map((sale, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5 font-mono text-xs text-blue-900 font-semibold">{sale.saleNumber}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(sale.createdAt)}</td>
                        <td className="px-3 py-2.5">
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {sale.items?.map((item, j) => (
                              <p key={j}>{item.productName} × {item.quantity} {item.unit}</p>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-sm">{formatAmount(sale.totalAmount)} GNF</td>
                        <td className="px-3 py-2.5 text-green-600 text-sm">{formatAmount(sale.amountPaid)} GNF</td>
                        <td className="px-3 py-2.5 font-semibold text-sm">
                          <span className={sale.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}>
                            {formatAmount(sale.remainingAmount)} GNF
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge label={sale.status} variant={statusVariant[sale.status] || 'default'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              {creditData.client.currentDebt > 0 && (
                <Button variant="success" onClick={() => { setDetailModal(false); openPay(selected); }}>
                  <FiDollarSign size={16} /> Enregistrer un paiement
                </Button>
              )}
              <Button variant="ghost" onClick={() => handleDownloadPDF(selected)} loading={downloading}>
                <FiDownload size={16} /> Télécharger PDF
              </Button>
              <Button variant="ghost" onClick={() => handlePrintPDF(selected)} loading={downloading}>
                <FiPrinter size={16} /> Imprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Paiement */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)}
        title={`Enregistrer un paiement — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-gray-600">Dette actuelle</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatAmount(selected?.currentDebt || 0)} GNF
            </p>
          </div>
          <Input
            label="Montant à payer (GNF)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setPayModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handlePayment} loading={saving}>
            Confirmer le paiement
          </Button>
        </div>
      </Modal>
    </div>
  );
}