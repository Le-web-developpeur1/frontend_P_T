import { useState, useEffect } from 'react';
import { getDailyReport, getMonthlyReport, getCaisseReport } from '../../api/reportAPI';
import { getBankReport } from '../../api/bankAPI';
import { getLowStockProducts } from '../../api/productAPI';
import { getClients } from '../../api/clientAPI';
import { formatAmount } from '../../utils/formatAmount';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiShoppingCart, FiDollarSign, FiAlertTriangle, FiUsers, FiCheckCircle } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface DailyReport {
  totalSales: number;
  totalCash: number;
  totalVirement: number;
  totalEncaisse: number;
  totalCredit: number;
  totalExpenses: number;
  totalCreditRembourses: number;
  creditRembourseToday: number;
  totalDettesExistantes: number;
  netProfit: number;
  salesCount: number;
}

interface CaisseReport {
  totalVentes: number;
  totalEncaisse: number;
  totalDepenses: number;
  paiementsFournisseursComptant: number;
  soldeCaisse: number;
  totalComptant: number;
  totalCredit: number;
}

interface MonthlyReport {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
}

export default function Dashboard() {
  const [daily, setDaily]       = useState<DailyReport | null>(null);
  const [caisse, setCaisse]     = useState<CaisseReport | null>(null);
  const [banque, setBanque]     = useState<any>(null);
  const [monthly, setMonthly]   = useState<MonthlyReport | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [clients, setClients]   = useState<any[]>([]);
  const [loading, setLoading]   = useState<boolean>(true);

  const fetchAll = async () => {
    try {
      const [d, m, ls, c, ca, b] = await Promise.all([
        getDailyReport(),
        getMonthlyReport(),
        getLowStockProducts(),
        getClients(),
        getCaisseReport(),
        getBankReport(),
      ]);
      setDaily(d.data);
      setMonthly(m.data);
      setLowStock(ls.data);
      setClients(c.data);
      setCaisse(ca.data);
      setBanque(b.data);
    } catch (err) {
      console.error('Erreur chargement dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 30000);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const clientsWithDebt = clients.filter(c => c.currentDebt > 0);
  const totalDebt       = clientsWithDebt.reduce((sum, c) => sum + c.currentDebt, 0);

  const chartData = [
    { name: 'Ventes',   value: monthly?.totalSales   || 0 },
    { name: 'Dépenses', value: monthly?.totalExpenses || 0 },
    { name: 'Bénéfice', value: monthly?.netProfit     || 0 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm capitalize">{today}</p>
      </div>

      {/* ── 4 cartes du haut ── */}
      {/* ── 4 cartes du haut — même ligne ── */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

{/* Carte 1 — Total Ventes (2 colonnes sur 5) */}
<div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-blue-50 p-2 rounded-xl">
      <FiShoppingCart className="text-blue-600" size={16} />
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Ventes</p>
    <p className="text-2xl font-extrabold ml-5 text-blue-900 mb-2">
      {formatAmount(caisse?.totalVentes || 0)} <span className="text-sm font-bold">GNF</span>
    </p>
  </div>
  <div className="grid grid-cols-2 gap-1.5">
    <div className="bg-blue-50 rounded-lg px-2 py-1.5">
      <p className="text-xs text-gray-400">Comptant</p>
      <p className="text-xs font-bold text-blue-700">{formatAmount(caisse?.totalComptant || 0)}</p>
    </div>
    <div className="bg-cyan-50 rounded-lg px-2 py-1.5">
      <p className="text-xs text-gray-400">Virement</p>
      <p className="text-xs font-bold text-cyan-700">{formatAmount(banque?.totalVentesVirement || 0)}</p>
    </div>
    <div className="bg-red-50 rounded-lg px-2 py-1.5">
      <p className="text-xs text-gray-400">Dettes</p>
      <p className="text-xs font-bold text-red-600">{formatAmount(caisse?.totalCredit || 0)}</p>
    </div>
    <div className="bg-green-50 rounded-lg px-2 py-1.5">
      <p className="text-xs text-gray-400">Remboursé</p>
      <p className="text-xs font-bold text-green-600">{formatAmount(daily?.totalCreditRembourses || 0)}</p>
    </div>
  </div>
</div>

{/* Carte 2 — Solde disponible */}
<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-green-50 p-2 rounded-xl">
      <FiDollarSign className="text-green-600" size={16} />
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solde Disponible</p>
  </div>
  <p className="text-2xl font-extrabold text-green-600 mb-2">
    {formatAmount((caisse?.soldeCaisse || 0) + (banque?.soldeBanque || 0))} <span className="text-sm font-bold">GNF</span>
  </p>
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-400">Caisse</span>
      <span className="text-xs font-bold text-gray-600">{formatAmount(caisse?.soldeCaisse || 0)}</span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-400">Banque</span>
      <span className="text-xs font-bold text-gray-600">{formatAmount(banque?.soldeBanque || 0)}</span>
    </div>
  </div>
</div>

{/* Carte 3 — Crédits remboursés */}
<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-yellow-50 p-2 rounded-xl">
      <FiCheckCircle className="text-yellow-600" size={16} />
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Crédits Remboursés</p>
  </div>
  <p className="text-2xl font-extrabold text-yellow-600 mb-2">
    {formatAmount(daily?.totalCreditRembourses || 0)} <span className="text-sm font-bold">GNF</span>
  </p>
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-400">Aujourd'hui</span>
      <span className="text-xs font-bold text-green-600">{formatAmount(daily?.creditRembourseToday || 0)}</span>
    </div>
  </div>
</div>

{/* Carte 4 — Dépenses */}
<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-red-50 p-2 rounded-xl">
      <FiAlertTriangle className="text-red-500" size={16} />
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Dépenses</p>
  </div>
  <p className="text-2xl font-extrabold text-red-600 mb-2">
    {formatAmount(caisse?.totalDepenses || 0)} <span className="text-sm font-bold">GNF</span>
  </p>
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-400">Opérationnel</span>
      <span className="text-xs font-bold text-red-600">{formatAmount(caisse?.totalDepenses || 0)}</span>
    </div>
  </div>
</div>

</div>

      {/* ── Graphique mensuel + résumé ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-blue-900 mb-4">
            Résumé du mois — {monthLabel}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => [`${formatAmount(Number(value || 0))} GNF`]} />
              <Bar dataKey="value" fill="#1A2B5F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-blue-900 mb-4">Ce mois</h3>
          <div className="space-y-3">
            {[
              { label: 'Total ventes',   value: `${formatAmount(monthly?.totalSales || 0)} GNF`,    color: 'text-blue-900' },
              { label: 'Total dépenses', value: `${formatAmount(monthly?.totalExpenses || 0)} GNF`, color: 'text-red-600'  },
              { label: 'Nb transactions',value: String(monthly?.salesCount || 0),                   color: 'text-blue-900' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alertes stock + Dettes clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <FiAlertTriangle className="text-yellow-500" size={16} />
              Alertes stock ({lowStock.length})
            </h3>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <span>✅</span> Tous les stocks sont OK
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-xl">
                  <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                    {p.stockCartons} cartons
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <FiUsers className="text-red-500" size={16} />
              Dettes clients
            </h3>
            <span className={`text-sm font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(totalDebt)} GNF
            </span>
          </div>
          {clientsWithDebt.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <span>✅</span> Aucune dette en cours
            </div>
          ) : (
            <div className="space-y-2">
              {clientsWithDebt.slice(0, 5).map((c: any) => (
                <div key={c._id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone || '—'}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {formatAmount(c.currentDebt)} GNF
                  </span>
                </div>
              ))}
              {clientsWithDebt.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  + {clientsWithDebt.length - 5} autres clients
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}