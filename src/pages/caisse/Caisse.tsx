import { useState, useEffect } from 'react';
import { getCaisseReport } from '../../api/reportAPI';
import { addCashIn } from '../../api/cashInAPI';
import { formatAmount } from '../../utils/formatAmount';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiActivity, FiShoppingCart, FiCreditCard, FiTruck, FiRefreshCw,
  FiCheckCircle, FiPlusCircle
} from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface CaisseData {
  totalVentes: number;
  totalEncaisse: number;
  totalComptant: number;
  totalCredit: number;
  totalDepenses: number;
  depensesComptant: number;
  paiementsFournisseursComptant: number;
  clientPaymentsComptant: number;
  clientPaymentsVirement: number;
  soldeCaisse: number;
  nbTransactions: number;
  encaisseAujourdhui: number;
  comptantToday: number;
  depensesAujourdhui: number;
  paiementsFournisseursToday: number;
  clientPayTodayComptant: number;
  soldeAujourdhui: number;
  nbTransactionsAujourdhui: number;
  encaisseMois: number;
  depensesMois: number;
  paiementsFournisseursMois: number;
  soldeMois: number;
  nbTransactionsMois: number;
  sales: any[];
  expenses: any[];
  totalCreditToday: number;
}

export default function Caisse() {
  const [data, setData]             = useState<CaisseData | null>(null);
  const [loading, setLoading]       = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal alimentation caisse
  const [cashInModal, setCashInModal] = useState<boolean>(false);
  const [cashInAmount, setCashInAmount] = useState<string>('');
  const [cashInReason, setCashInReason] = useState<string>('');
  const [cashInNote, setCashInNote]     = useState<string>('');
  const [saving, setSaving]             = useState<boolean>(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await getCaisseReport();
      setData(res.data);
    } catch { toast.error('Erreur chargement caisse'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useAutoRefresh(() => fetchData(), 15000);

  const handleCashIn = async () => {
    if (!cashInAmount || Number(cashInAmount) <= 0) { toast.error('Montant invalide'); return; }
    if (!cashInReason) { toast.error('Raison obligatoire'); return; }
    setSaving(true);
    try {
      await addCashIn({ amount: Number(cashInAmount), reason: cashInReason, note: cashInNote });
      toast.success('Caisse alimentée !');
      setCashInModal(false);
      setCashInAmount('');
      setCashInReason('');
      setCashInNote('');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Caisse</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCashInModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
            <FiPlusCircle size={15} />
            Alimenter la caisse
          </button>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors disabled:opacity-50">
            <FiRefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aujourd'hui</h2>

      {/* ── Cartes du haut — données du JOUR uniquement ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-[#1A2B5F] rounded-2xl p-5 shadow-lg col-span-2 lg:col-span-1">
          <p className="text-white/70 text-xs font-medium mb-1">SOLDE EN CAISSE</p>
          <p className="text-3xl font-extrabold text-[#D4A017]">
            {formatAmount(data.soldeAujourdhui)} <span className="text-lg">GNF</span>
          </p>
          <p className="text-white/40 text-xs mt-1">Encaissé — Dépenses</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-50 p-2.5 rounded-xl">
              <FiTrendingUp className="text-green-600" size={18} />
            </div>
            <p className="text-xs text-gray-500">TOTAL ENCAISSÉ</p>
          </div>
          <p className="text-xl font-bold text-green-600">{formatAmount(data.encaisseAujourdhui)} GNF</p>
          <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-50 p-2.5 rounded-xl">
              <FiTrendingDown className="text-red-500" size={18} />
            </div>
            <p className="text-xs text-gray-500">TOTAL DÉPENSES</p>
          </div>
          <p className="text-xl font-bold text-red-600">{formatAmount(data.depensesAujourdhui)} GNF</p>
          <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <FiActivity className="text-blue-600" size={18} />
            </div>
            <p className="text-xs text-gray-500">TRANSACTIONS</p>
          </div>
          <p className="text-xl font-bold text-blue-900">{data.nbTransactionsAujourdhui}</p>
          <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
        </div>
      </div>

      {/* ── Sections Aujourd'hui et Ce mois ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Aujourd'hui */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-sm font-bold text-blue-900">Aujourd'hui</h3>
          </div>
          <div className="space-y-2">

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <FiShoppingCart className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ventes comptant</p>
                  <p className="font-bold text-green-600">{formatAmount(data.comptantToday)} GNF</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <FiCreditCard className="text-yellow-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Crédits en cours</p>
                  <p className="font-bold text-yellow-600">{formatAmount(data.totalCreditToday)} GNF</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {data.totalVentes > 0 ? Math.round((data.totalCredit / data.totalVentes) * 100) : 0}% des ventes
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <FiCheckCircle className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-green-500">Crédits remboursés</p>
                  <p className="font-bold text-green-600">{formatAmount(data.clientPayTodayComptant)} GNF</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <FiTruck className="text-orange-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paiements fournisseurs</p>
                  <p className="font-bold text-orange-600">{formatAmount(data.paiementsFournisseursToday)} GNF</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Déduits caisse</p>
            </div>
          </div>
        </div>

        {/* Ce mois */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold text-blue-900">
              Ce mois — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Encaissé',                value: data.encaisseMois,              color: 'text-green-600',  sign: '+' },
              { label: 'Dépenses opérationnelles', value: data.depensesMois,              color: 'text-red-600',    sign: '−' },
              { label: 'Paiements fournisseurs',   value: data.paiementsFournisseursMois, color: 'text-orange-600', sign: '−' },
            ].map(({ label, value, color, sign }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>
                  {sign} {formatAmount(value)} GNF
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-blue-900">Solde du mois</span>
              <span className={`text-sm font-bold ${data.soldeMois >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(data.soldeMois)} GNF
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Transactions ce mois</span>
              <span className="text-xs font-semibold text-blue-900">{data.nbTransactionsMois}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Alimenter la caisse ── */}
      <Modal isOpen={cashInModal} onClose={() => setCashInModal(false)}
        title="Alimenter la caisse" size="sm">
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm text-gray-600">
              Solde actuel : <strong className="text-green-600">{formatAmount(data.soldeAujourdhui)} GNF</strong>
            </p>
          </div>
          <Input label="Montant (GNF)" type="number" value={cashInAmount}
            onChange={(e) => setCashInAmount(e.target.value)} placeholder="0" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Raison <span className="text-red-500">*</span></label>
            <select value={cashInReason} onChange={(e) => setCashInReason(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="">Sélectionner...</option>
              <option value="Apport personnel">Apport personnel</option>
              <option value="Recette diverse">Recette diverse</option>
              <option value="Remboursement reçu">Remboursement reçu</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <Input label="Note (optionnel)" value={cashInNote}
            onChange={(e) => setCashInNote(e.target.value)} placeholder="Détails..." />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setCashInModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleCashIn} loading={saving}>Confirmer</Button>
        </div>
      </Modal>
    </div>
  );
}