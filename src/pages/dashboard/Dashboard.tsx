import { useState, useEffect } from 'react';
import { getDailyReport, getMonthlyReport } from '../../api/reportAPI';
import { getLowStockProducts } from '../../api/productAPI';
import { getDebtReport } from '../../api/reportAPI';
import { formatAmount } from '../../utils/formatAmount';
import { FiShoppingCart, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiUsers } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { IconType } from 'react-icons';

interface StatCardProps {
  icon: IconType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}

interface DailyReport {
  totalSales: number;
  totalCash: number;
  totalCredit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
}

interface MonthlyReport {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
}

interface LowStockProduct {
  _id: string;
  name: string;
  category: string;
  stockCartons: number;
  alertThreshold: number;
}

interface DebtClient {
  _id: string;
  name: string;
  phone: string;
  currentDebt: number;
  isBlocked?: boolean;
}

interface DebtReport {
  totalDebt: number;
  clients: DebtClient[];
}

interface ChartData {
  name: string;
  montant: number;
}

const StatCard = ({ icon: Icon, label, value, sub, iconColor = 'text-blue-600' }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <Icon className={iconColor} size={22} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [debts, setDebts] = useState<DebtReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 15000);

  const chartData: ChartData[] = monthly ? [
    { name: 'Ventes', montant: monthly.totalSales },
    { name: 'Dépenses', montant: monthly.totalExpenses },
    { name: 'Bénéfice', montant: monthly.netProfit },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div>
        <h1 className="text-2xl font-bold text-blue-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aujourd'hui</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiShoppingCart}
            label="Ventes du jour"
            value={formatAmount(daily?.totalSales || 0)}
            sub={`${daily?.salesCount || 0} transaction(s)`}
            iconColor="text-blue-600"
          />
          <StatCard
            icon={FiDollarSign}
            label="Encaissé"
            value={formatAmount(daily?.totalCash || 0)}
            sub="Paiements comptants"
            iconColor="text-green-600"
          />
          <StatCard
            icon={FiTrendingUp}
            label="Crédit accordé"
            value={formatAmount(daily?.totalCredit || 0)}
            sub="Ventes à crédit"
            iconColor="text-yellow-600"
          />
          <StatCard
            icon={FiAlertTriangle}
            label="Dépenses"
            value={formatAmount(daily?.totalExpenses || 0)}
            sub={`Bénéfice : ${formatAmount(daily?.netProfit || 0)}`}
            iconColor="text-red-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-blue-900 mb-4">
            Résumé du mois — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatAmount(v)} />
              <Tooltip formatter={(value: any) => [`${formatAmount(Number(value))} GNF`]} />
              <Bar dataKey="montant" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-blue-900 mb-4">Ce mois</h2>
          <div className="space-y-3">
            {[
              { label: 'Total ventes', value: `${formatAmount(monthly?.totalSales || 0)} GNF`, color: 'text-blue-900' },
              { label: 'Total dépenses', value: `${formatAmount(monthly?.totalExpenses || 0)} GNF`, color: 'text-red-600' },
              { label: 'Bénéfice net', value: `${formatAmount(monthly?.netProfit || 0)} GNF`, color: 'text-green-600' },
              { label: 'Nb transactions', value: `${monthly?.salesCount || 0}`, color: 'text-gray-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
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
              {lowStock.map((p: LowStockProduct) => (
                <div key={p._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
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

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
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
              {debts.clients.slice(0, 5).map((c: DebtClient) => (
                <div key={c._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
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
