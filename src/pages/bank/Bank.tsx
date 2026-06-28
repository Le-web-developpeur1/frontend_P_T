import { useState, useEffect } from 'react';
import { getBankReport, transferToBanque } from '../../api/bankAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import {
  FiArrowUpCircle, FiArrowDownCircle, FiRefreshCw,
  FiTrendingUp, FiTrendingDown, FiRepeat
} from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

export default function Bank() {
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [transferModal, setTransferModal] = useState<boolean>(false);
  const [transferForm, setTransferForm]   = useState({ amount: 0, direction: 'caisse_vers_banque', note: '' });
  const [saving, setSaving]               = useState<boolean>(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await getBankReport();
      setData(res.data);
    } catch { toast.error('Erreur chargement banque'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useAutoRefresh(() => fetchData(), 30000);

  const handleTransfer = async () => {
    if (!transferForm.amount || transferForm.amount <= 0) {
      toast.error('Montant invalide'); return;
    }
    setSaving(true);
    try {
      await transferToBanque(transferForm);
      toast.success(
        transferForm.direction === 'caisse_vers_banque'
          ? `${formatAmount(transferForm.amount)} GNF transférés vers la banque !`
          : `${formatAmount(transferForm.amount)} GNF transférés vers la caisse !`
      );
      setTransferModal(false);
      setTransferForm({ amount: 0, direction: 'caisse_vers_banque', note: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur transfert');
    } finally { setSaving(false); }
  };

  const iconMouvement = (categorie: string) => {
    switch (categorie) {
      case 'vente_virement':    return <FiTrendingUp   className="text-green-500" size={18} />;
      case 'transfert_entree':  return <FiArrowUpCircle className="text-blue-500"  size={18} />;
      case 'transfert_sortie':  return <FiArrowDownCircle className="text-orange-500" size={18} />;
      case 'paiement_fournisseur': return <FiTrendingDown className="text-red-500" size={18} />;
      default: return <FiRepeat size={18} />;
    }
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
          <h1 className="text-2xl font-bold text-blue-900">Module Banque</h1>
          <p className="text-gray-500 text-sm">Suivi des mouvements bancaires</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors disabled:opacity-50">
            <FiRefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <Button variant="primary" onClick={() => setTransferModal(true)}>
            <FiRepeat size={16} /> Transfert
          </Button>
        </div>
      </div>

      {/* Solde principal */}
      <div className="bg-gradient-to-r from-[#1A2B5F] to-[#0f1a3a] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">SOLDE DISPONIBLE EN BANQUE</p>
            <p className={`text-4xl font-extrabold ${data.soldeBanque >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
              {formatAmount(data.soldeBanque)} GNF
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-white/70 text-xs">
              <span className="text-green-400">+</span> Ventes virement : {formatAmount(data.totalVentesVirement)} GNF
            </div>
            <div className="text-white/70 text-xs">
              <span className="text-green-400">+</span> Transferts reçus : {formatAmount(data.totalTransfertsEntree)} GNF
            </div>
            <div className="text-white/70 text-xs">
              <span className="text-red-400">−</span> Paiements fournisseurs : {formatAmount(data.totalDepensesVirement)} GNF
            </div>
            <div className="text-white/70 text-xs">
              <span className="text-red-400">−</span> Transferts envoyés : {formatAmount(data.totalTransfertsSortie)} GNF
            </div>
          </div>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventes virement',        value: data.totalVentesVirement,    color: 'text-green-700',  bg: 'bg-green-50',  icon: FiTrendingUp,    type: 'entrée' },
          { label: 'Transferts reçus',        value: data.totalTransfertsEntree,  color: 'text-blue-700',   bg: 'bg-blue-50',   icon: FiArrowUpCircle, type: 'entrée' },
          { label: 'Paiements fournisseurs',  value: data.totalDepensesVirement,  color: 'text-red-700',    bg: 'bg-red-50',    icon: FiTrendingDown,  type: 'sortie' },
          { label: 'Transferts envoyés',      value: data.totalTransfertsSortie,  color: 'text-orange-700', bg: 'bg-orange-50', icon: FiArrowDownCircle, type: 'sortie' },
        ].map(({ label, value, color, bg, icon: Icon, type }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className={`${bg} rounded-lg p-2.5`}>
                <Icon className={color} size={20} />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                type === 'entrée' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {type === 'entrée' ? '↑ Entrée' : '↓ Sortie'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{formatAmount(value)} GNF</p>
          </div>
        ))}
      </div>

      {/* 10 derniers mouvements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-blue-900">10 derniers mouvements</h3>
        </div>
        {data.mouvements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun mouvement enregistré</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.mouvements.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    m.type === 'entrée' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {iconMouvement(m.categorie)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.libelle}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${m.type === 'entrée' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'entrée' ? '+' : '−'} {formatAmount(m.montant)} GNF
                  </p>
                  <p className={`text-xs font-semibold ${m.type === 'entrée' ? 'text-green-500' : 'text-red-500'}`}>
                    {m.type === 'entrée' ? '↑ Entrée' : '↓ Sortie'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Transfert */}
      <Modal isOpen={transferModal} onClose={() => setTransferModal(false)}
        title="Effectuer un transfert" size="sm">
        <div className="space-y-4">

          {/* Direction du transfert */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Direction du transfert</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTransferForm({ ...transferForm, direction: 'caisse_vers_banque' })}
                className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-colors text-center ${
                  transferForm.direction === 'caisse_vers_banque'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                💵 Caisse → 🏦 Banque
              </button>
              <button
                onClick={() => setTransferForm({ ...transferForm, direction: 'banque_vers_caisse' })}
                className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-colors text-center ${
                  transferForm.direction === 'banque_vers_caisse'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                🏦 Banque → 💵 Caisse
              </button>
            </div>
          </div>

          {/* Soldes actuels */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
            <p>Solde banque actuel : <strong className="text-blue-900">{formatAmount(data.soldeBanque)} GNF</strong></p>
          </div>

          <Input label="Montant (GNF)" type="number" value={transferForm.amount}
            onChange={(e) => setTransferForm({ ...transferForm, amount: Number(e.target.value) })} />

          <Input label="Note (optionnel)" value={transferForm.note}
            onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
            placeholder="Ex: Approvisionnement caisse..." />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            {transferForm.direction === 'caisse_vers_banque'
              ? '💡 Ce montant sera déduit de la caisse et ajouté à la banque.'
              : '💡 Ce montant sera déduit de la banque et ajouté à la caisse.'}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setTransferModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleTransfer} loading={saving}>
            Confirmer le transfert
          </Button>
        </div>
      </Modal>
    </div>
  );
}