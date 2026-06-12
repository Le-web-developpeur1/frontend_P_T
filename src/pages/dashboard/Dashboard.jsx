import { useState, useEffect } from 'react';
import { getDailyReport, getMonthlyReport } from '../../api/reportAPI';
import { getLowStockProducts } from '../../api/productAPI';
import { getDebtReport } from '../../api/reportAPI';
import { formatAmount } from '../../utils/formatAmount';
import { FiShoppingCart, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiUsers, FiTruck } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-900 text-white',
    yellow: 'bg-yellow-500 text-blue-900',
    green:  'bg-green-600 text-white',
    red:    'bg-red-600 text-white',
  };
  return (
    <div className={`rounded-2xl p-5 ${colors[color]} flex items-center gap-4 shadow`}>
      <div className="bg-white/20 rounded-xl p-3">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [daily, setDaily]     = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [debts, setDebts]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [d, m, s, db] = await Promise.all([
          getDailyReport(),
          getMonthlyReport(),
          getLowStockProducts(),
          getDebtReport(),
        ]);
        setDaily(d.data);
        setMonthly(m.data);
        setLowStock(s.data);
        setDebts(db.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Données graphique mensuel
  const chartData = monthly ? [
    { name: 'Ventes',   montant: monthly.totalSales },
    { name: 'Dépenses', montant: monthly.totalExpenses },
    { name: 'Bénéfice', montant: monthly.netProfit },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats du jour */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Aujourd'hui</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiShoppingCart}
            label="Ventes du jour"
            value={`${formatAmount(daily?.totalSales || 0)} GNF`}
            sub={`${daily?.salesCount || 0} transaction(s)`}
            color="blue"
          />
          <StatCard
            icon={FiDollarSign}
            label="Encaissé"
            value={`${formatAmount(daily?.totalCash || 0)} GNF`}
            sub="Paiements comptants"
            color="green"
          />
          <StatCard
            icon={FiTrendingUp}
            label="Crédit accordé"
            value={`${formatAmount(daily?.totalCredit || 0)} GNF`}
            sub="Ventes à crédit"
            color="yellow"
          />
          <StatCard
            icon={FiAlertTriangle}
            label="Dépenses"
            value={`${formatAmount(daily?.totalExpenses || 0)} GNF`}
            sub={`Bénéfice : ${formatAmount(daily?.netProfit || 0)} GNF`}
            color="red"
          />
        </div>
      </div>

      {/* Stats du mois + Graphique */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-blue-900 mb-4">
            Résumé du mois — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${formatAmount(v)}`} />
              <Tooltip formatter={(value) => [`${formatAmount(value)} GNF`]} />
              <Bar dataKey="montant" fill="#1A2B5F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats mois */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-base font-bold text-blue-900">Ce mois</h2>
          <div className="space-y-3">
            {[
              { label: 'Total ventes',   value: `${formatAmount(monthly?.totalSales || 0)} GNF`,    color: 'text-blue-900' },
              { label: 'Total dépenses', value: `${formatAmount(monthly?.totalExpenses || 0)} GNF`, color: 'text-red-600'  },
              { label: 'Bénéfice net',   value: `${formatAmount(monthly?.netProfit || 0)} GNF`,     color: 'text-green-600'},
              { label: 'Nb transactions',value: `${monthly?.salesCount || 0}`,                      color: 'text-gray-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes stock + Dettes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Alertes stock */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <FiAlertTriangle className="text-yellow-500" />
              Alertes stock ({lowStock.length})
            </h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">✅ Tous les stocks sont OK</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-600">{p.stockCartons} cartons</p>
                    <p className="text-xs text-gray-400">Seuil : {p.alertThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dettes clients */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <FiUsers className="text-red-500" />
              Dettes clients
            </h2>
            <span className="text-sm font-bold text-red-600">
              {formatAmount(debts?.totalDebt || 0)} GNF
            </span>
          </div>
          {!debts?.clients?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">✅ Aucune dette en cours</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {debts.clients.slice(0, 5).map((c) => (
                <div key={c._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{formatAmount(c.currentDebt)} GNF</p>
                    {c.isBlocked && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Bloqué</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}