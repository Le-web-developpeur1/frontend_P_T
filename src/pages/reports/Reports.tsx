import { useState } from 'react';
import { getDailyReport, getMonthlyReport, getStockReport, getDebtReport, getSupplierReport, exportReport } from '../../api/reportAPI';
import { formatAmount } from '../../utils/formatAmount';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiDownload, FiSearch } from 'react-icons/fi';

const tabs = [
  { id: 'daily',     label: 'Journalier'   },
  { id: 'monthly',   label: 'Mensuel'      },
  { id: 'stock',     label: 'Stocks'       },
  { id: 'debts',     label: 'Dettes'       },
  { id: 'suppliers', label: 'Fournisseurs' },
];

type TabId = 'daily' | 'monthly' | 'stock' | 'debts' | 'suppliers';

export default function Reports() {
  const [activeTab, setActiveTab]   = useState<TabId>('daily');
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState<boolean>(false);
  const [exporting, setExporting]   = useState<boolean>(false);
  const [date, setDate]             = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth]           = useState<number>(new Date().getMonth() + 1);
  const [year, setYear]             = useState<number>(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      let res: any;
      if (activeTab === 'daily')     res = await getDailyReport({ date });
      if (activeTab === 'monthly')   res = await getMonthlyReport({ month, year });
      if (activeTab === 'stock')     res = await getStockReport();
      if (activeTab === 'debts')     res = await getDebtReport();
      if (activeTab === 'suppliers') res = await getSupplierReport();
      setData(res.data);
    } catch { toast.error('Erreur chargement rapport'); }
    finally { setLoading(false); }
  };
  

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const params = activeTab === 'daily' ? { date } : activeTab === 'monthly' ? { month, year } : {};
      const res = await exportReport(activeTab, format, params);
      const ext = format === 'word' ? 'docx' : format;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${activeTab}-${Date.now()}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Export ${format.toUpperCase()} réussi !`);
    } catch { toast.error('Erreur export'); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Rapports</h1>
        <p className="text-gray-500 text-sm">Consultez et exportez vos rapports</p>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id as TabId); setData(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          {activeTab === 'daily' && (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
          )}
          {activeTab === 'monthly' && (
            <>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
            </>
          )}
          <Button onClick={fetchReport} variant="primary" loading={loading}>
            <FiSearch size={16} /> Générer
          </Button>
          {data && (
            <div className="flex gap-2 ml-auto">
              <Button onClick={() => handleExport('pdf')} variant="ghost" size="sm" loading={exporting}>
                <FiDownload size={14} /> PDF
              </Button>
              <Button onClick={() => handleExport('word')} variant="ghost" size="sm" loading={exporting}>
                <FiDownload size={14} /> Word
              </Button>
              <Button onClick={() => handleExport('csv')} variant="ghost" size="sm" loading={exporting}>
                <FiDownload size={14} /> CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">

          {activeTab === 'daily' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ventes totales', value: `${formatAmount(data.totalSales)} GNF`, color: 'text-blue-900' },
                  { label: 'Encaissé',       value: `${formatAmount(data.totalCash)} GNF`,  color: 'text-green-600' },
                  { label: 'Crédit',         value: `${formatAmount(data.totalCredit)} GNF`, color: 'text-yellow-600' },
                  { label: 'Dépenses',       value: `${formatAmount(data.totalExpenses)} GNF`, color: 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Bénéfice net</span>
                <span className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(data.netProfit)} GNF
                </span>
              </div>
              {data.sales?.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-3">Détail des ventes ({data.salesCount})</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-900 text-white">
                        <tr>
                          {['N° Vente', 'Client', 'Montant', 'Type', 'Statut'].map(h => (
                            <th key={h} className="px-4 py-2 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.sales.map((s: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 font-mono text-blue-900">{s.saleNumber}</td>
                            <td className="px-4 py-2">{s.clientName}</td>
                            <td className="px-4 py-2 font-semibold">{formatAmount(s.totalAmount)} GNF</td>
                            <td className="px-4 py-2">{s.paymentType}</td>
                            <td className="px-4 py-2"><Badge label={s.status} variant={s.status === 'payé' ? 'success' : 'warning'} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'monthly' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ventes totales',  value: `${formatAmount(data.totalSales)} GNF`,    color: 'text-blue-900' },
                { label: 'Dépenses',        value: `${formatAmount(data.totalExpenses)} GNF`, color: 'text-red-600' },
                { label: 'Bénéfice net',    value: `${formatAmount(data.netProfit)} GNF`,     color: data.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                { label: 'Transactions',    value: data.salesCount,                           color: 'text-gray-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

{activeTab === 'stock' && (
  <>
    {/* Valeurs du stock */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        // { label: 'Valeur stock (prix vente)',  value: `${formatAmount(data.valeurStockVente)} GNF`,  color: 'text-green-600' },
        { label: 'Valeur stock (prix achat)',  value: `${formatAmount(data.valeurStockAchat)} GNF`,  color: 'text-blue-900'  },
        { label: 'Produits en stock bas',      value: `${data.lowStock?.length || 0} produit(s)`,    color: 'text-red-600'   },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>

    {/* Tableau produits */}
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-blue-900 text-white">
          <tr>
            {['Produit', 'Catégorie', 'Stock Cartons', 'Prix/Carton', 'Valeur stock (achat)', 'Statut'].map(h => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.products?.map((p: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 font-semibold">{p.name}</td>
              <td className="px-4 py-2">{p.category || '—'}</td>
              <td className="px-4 py-2">{p.stockCartons}</td>
              <td className="px-4 py-2">{formatAmount(p.purchasePricePerCarton)} GNF</td>
              <td className="px-4 py-2 font-semibold text-blue-900">
                {formatAmount(p.stockCartons * p.purchasePricePerCarton || 0)} GNF
              </td>
              <td className="px-4 py-2">
                <Badge label={p.stockCartons <= p.alertThreshold ? 'Stock bas' : 'OK'}
                  variant={p.stockCartons <= p.alertThreshold ? 'warning' : 'success'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}

          {activeTab === 'debts' && (
            <>
              <div className="bg-red-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total dettes clients</span>
                <span className="text-xl font-bold text-red-600">{formatAmount(data.totalDebt)} GNF</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      {['Client', 'Téléphone', 'Plafond', 'Dette actuelle', 'Statut'].map(h => (
                        <th key={h} className="px-4 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients?.map((c: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 font-semibold">{c.name}</td>
                        <td className="px-4 py-2">{c.phone || '—'}</td>
                        <td className="px-4 py-2">{formatAmount(c.creditLimit)} GNF</td>
                        <td className="px-4 py-2 font-bold text-red-600">{formatAmount(c.currentDebt)} GNF</td>
                        <td className="px-4 py-2">
                          <Badge label={c.isBlocked ? 'Bloqué' : 'Actif'} variant={c.isBlocked ? 'danger' : 'success'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'suppliers' && (
            <>
              <div className="bg-yellow-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total dû aux fournisseurs</span>
                <span className="text-xl font-bold text-yellow-600">{formatAmount(data.totalOwed)} GNF</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      {['Fournisseur', 'Téléphone', 'Total achats', 'Total payé', 'Solde restant'].map(h => (
                        <th key={h} className="px-4 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.suppliers?.map((s: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 font-semibold">{s.name}</td>
                        <td className="px-4 py-2">{s.phone || '—'}</td>
                        <td className="px-4 py-2">{formatAmount(s.totalPurchases)} GNF</td>
                        <td className="px-4 py-2 text-green-600">{formatAmount(s.totalPaid)} GNF</td>
                        <td className="px-4 py-2 font-bold text-red-600">{formatAmount(s.balance)} GNF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}