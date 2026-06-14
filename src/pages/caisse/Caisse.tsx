import { useState, useEffect } from 'react';
import { getCaisseReport } from '../../api/reportAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Badge from '../../components/common/Badge';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import {
  FiDollarSign, FiShoppingCart, FiTrendingUp,
  FiTrendingDown, FiCreditCard, FiActivity
} from 'react-icons/fi';

interface CaisseData {
  totalVentes: number;
  totalEncaisse: number;
  totalComptant: number;
  totalCredit: number;
  totalDepenses: number;
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
      console.error('Erreur chargement caisse');
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Caisse</h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale de la caisse depuis le début</p>
      </div>

      {/* Solde caisse — carte principale */}
      <div className="bg-gradient-to-r from-[#1A2B5F] to-[#0f1a3a] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium">SOLDE EN CAISSE</p>
            <p className={`text-4xl font-black mt-2 ${data.soldeCaisse >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
              {formatAmount(data.soldeCaisse)} GNF
            </p>
            <p className="text-white/50 text-xs mt-2">
              Total encaissé — Total dépenses
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5">
            <FiDollarSign size={36} className="text-[#D4A017]" />
          </div>
        </div>

        {/* Mini stats dans la carte */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          {[
            { label: 'Total encaissé',  value: `${formatAmount(data.totalEncaisse)} GNF`,  color: 'text-green-400'  },
            { label: 'Total dépenses',  value: `${formatAmount(data.totalDepenses)} GNF`,  color: 'text-red-400'    },
            { label: 'Transactions',    value: String(data.nbTransactions),                color: 'text-blue-300'   },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-white/50 text-xs">{label}</p>
              <p className={`font-bold text-sm mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats par période */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Aujourd'hui */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-base font-bold text-blue-900">Aujourd'hui</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: FiTrendingUp,   label: 'Encaissé',      value: `${formatAmount(data.encaisseAujourdhui)} GNF`, color: 'text-green-600', bg: 'bg-green-50'  },
              { icon: FiTrendingDown, label: 'Dépenses',      value: `${formatAmount(data.depensesAujourdhui)} GNF`, color: 'text-red-600',   bg: 'bg-red-50'    },
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
              <span className={`text-sm font-bold ${data.soldeAujourdhui >= 0 ? 'text-[#D4A017]' : 'text-red-400'}`}>
                {formatAmount(data.soldeAujourdhui)} GNF
              </span>
            </div>
          </div>
        </div>

        {/* Ce mois */}
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

      {/* Répartition comptant / crédit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
      </div>

      {/* Tabs ventes / dépenses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('ventes')}
            className={`flex-1 py-3 text-sm font-semibold transition-all
              ${activeTab === 'ventes' ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
            Ventes ({data.sales.length})
          </button>
          <button
            onClick={() => setActiveTab('depenses')}
            className={`flex-1 py-3 text-sm font-semibold transition-all
              ${activeTab === 'depenses' ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
            Dépenses ({data.expenses.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'ventes' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['N° Vente', 'Client', 'Montant', 'Encaissé', 'Reste', 'Type', 'Statut', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.sales.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucune vente</td></tr>
                ) : data.sales.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-900">{s.saleNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{s.clientName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatAmount(s.totalAmount)} GNF</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{formatAmount(s.amountPaid)} GNF</td>
                    <td className="px-4 py-3">
                      <span className={s.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                        {formatAmount(s.remainingAmount)} GNF
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={s.paymentType} variant={s.paymentType === 'comptant' ? 'success' : 'warning'} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={s.status} variant={statusVariant[s.status] || 'default'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Libellé', 'Catégorie', 'Montant', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.expenses.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">Aucune dépense</td></tr>
                ) : data.expenses.map((e: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{e.title}</td>
                    <td className="px-4 py-3">
                      <Badge label={e.category} variant="info" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatAmount(e.amount)} GNF</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(e.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}