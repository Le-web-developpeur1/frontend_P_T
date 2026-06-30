import { useState, useEffect } from 'react';
import { getCaisseReport } from '../../api/reportAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Badge from '../../components/common/Badge';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import {
  FiDollarSign, FiShoppingCart, FiTrendingUp,
  FiTrendingDown, FiCreditCard, FiActivity, FiTruck
} from 'react-icons/fi';

interface CaisseData {
  totalVentes: number;
  totalEncaisse: number;
  totalComptant: number;
  totalCredit: number;
  totalDepenses: number;
  paiementsFournisseursComptant: number;
  soldeCaisse: number;
  nbTransactions: number;
  encaisseAujourdhui: number;
  depensesAujourdhui: number;
  soldeAujourdhui: number;
  nbTransactionsAujourdhui: number;
  encaisseMois: number;
  depensesMois: number;
  soldeMois: number;
  nbTransactionsMois: number;
  sales: any[];
  expenses: any[];
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  'payé': 'success', 'partiel': 'warning', 'crédit': 'danger'
};

export default function Caisse() {
  const [data, setData]       = useState<CaisseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ventes' | 'depenses'>('ventes');

  const fetchCaisse = async () => {
    try {
      const res = await getCaisseReport();
      setData(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaisse(); }, []);
  useAutoRefresh(fetchCaisse, 15000);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-blue-900">Caisse</h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale de la caisse depuis le début</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-gradient-to-br from-[#1A2B5F] to-[#0f1a3a] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-xs font-medium">SOLDE EN CAISSE</p>
            <div className="bg-white/10 rounded-xl p-2">
              <FiDollarSign size={18} className="text-[#D4A017]" />
            </div>
          </div>
          <p className={`text-2xl font-black ${data.soldeCaisse >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
            {formatAmount(data.soldeCaisse)} GNF
          </p>
          <p className="text-white/40 text-xs mt-1">Encaissé — Dépenses</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-medium">TOTAL ENCAISSÉ</p>
            <div className="bg-green-50 rounded-xl p-2">
              <FiTrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600">
            {formatAmount(data.totalEncaisse)} GNF
          </p>
          <p className="text-gray-400 text-xs mt-1">Depuis le début</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-medium">TOTAL DÉPENSES</p>
            <div className="bg-red-50 rounded-xl p-2">
              <FiTrendingDown size={18} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">
            {formatAmount(data.totalDepenses)} GNF
          </p>
          <p className="text-gray-400 text-xs mt-1">Depuis le début</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-medium">TRANSACTIONS</p>
            <div className="bg-blue-50 rounded-xl p-2">
              <FiActivity size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">
            {data.nbTransactions}
          </p>
          <p className="text-gray-400 text-xs mt-1">Ventes enregistrées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-base font-bold text-blue-900">Aujourd'hui</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: FiTrendingUp,   label: 'Encaissé',      value: `${formatAmount(data.encaisseAujourdhui)} GNF`, color: 'text-green-600', bg: 'bg-green-50'  },
              { icon: FiTrendingDown, label: 'Dépenses',      value: `${formatAmount(data.totalDepenses)} GNF`, color: 'text-red-600',   bg: 'bg-red-50'    },
              { icon: FiActivity,     label: 'Transactions',  value: String(data.nbTransactionsAujourdhui),          color: 'text-blue-600',  bg: 'bg-blue-50'   },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`${bg} p-2 rounded-lg`}>
                    <Icon className={color} size={16} />
                  </div>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-900 mt-2">
              <span className="text-sm text-white/70">Solde du jour</span>
              <span className={`text-sm font-bold ${data.totalEncaisse - data.totalDepenses >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
                {formatAmount(data.totalEncaisse - data.totalDepenses)} GNF
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-blue-900">
              Ce mois — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: FiTrendingUp,   label: 'Encaissé',     value: `${formatAmount(data.encaisseMois)} GNF`, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: FiTrendingDown, label: 'Dépenses',     value: `${formatAmount(data.depensesMois)} GNF`, color: 'text-red-600',   bg: 'bg-red-50'   },
              { icon: FiActivity,     label: 'Transactions', value: String(data.nbTransactionsMois),          color: 'text-blue-600',  bg: 'bg-blue-50'  },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`${bg} p-2 rounded-lg`}>
                    <Icon className={color} size={16} />
                  </div>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-900 mt-2">
              <span className="text-sm text-white/70">Solde du mois</span>
              <span className={`text-sm font-bold ${data.soldeMois >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
                {formatAmount(data.soldeMois)} GNF
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-3">
      <div className="bg-green-50 p-2.5 rounded-xl">
        <FiShoppingCart className="text-green-600" size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">Ventes comptant</p>
        <p className="text-xl font-bold text-green-600">{formatAmount(data.totalComptant)} GNF</p>
      </div>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="bg-green-500 h-2 rounded-full transition-all"
        style={{ width: data.totalEncaisse > 0 ? `${Math.round((data.totalComptant / data.totalEncaisse) * 100)}%` : '0%' }} />
    </div>
    <p className="text-xs text-gray-400 mt-1">
      {data.totalEncaisse > 0 ? Math.round((data.totalComptant / data.totalEncaisse) * 100) : 0}% du total encaissé
    </p>
  </div>

  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-3">
      <div className="bg-yellow-50 p-2.5 rounded-xl">
        <FiCreditCard className="text-yellow-600" size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">Crédit en cours</p>
        <p className="text-xl font-bold text-yellow-600">{formatAmount(data.totalCredit)} GNF</p>
      </div>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="bg-yellow-500 h-2 rounded-full transition-all"
        style={{ width: data.totalVentes > 0 ? `${Math.round((data.totalCredit / data.totalVentes) * 100)}%` : '0%' }} />
    </div>
    <p className="text-xs text-gray-400 mt-1">
      {data.totalVentes > 0 ? Math.round((data.totalCredit / data.totalVentes) * 100) : 0}% des ventes non encaissé
    </p>
  </div>

  {/* Nouvelle carte — Paiements fournisseurs */}
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-3">
      <div className="bg-orange-50 p-2.5 rounded-xl">
        <FiTruck className="text-orange-600" size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">Paiements fournisseurs (Caisse)</p>
        <p className="text-xl font-bold text-orange-600">{formatAmount(data.paiementsFournisseursComptant)} GNF</p>
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-1">Réglés en espèces, déduits de la caisse</p>
  </div>
</div>
    </div>
  );
}