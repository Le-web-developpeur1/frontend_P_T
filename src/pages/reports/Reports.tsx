import { useState } from 'react';
import {
  getDailyReport, getMonthlyReport, getStockReport, getDebtReport,
  getSupplierReport, exportReport, getCaisseMovements, getBankMovements,
  exportCaisseReport, exportBankReport
} from '../../api/reportAPI';
import { formatAmount } from '../../utils/formatAmount';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiDownload, FiSearch, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const tabs = [
  { id: 'daily',     label: 'Journalier'   },
  { id: 'monthly',   label: 'Mensuel'      },
  { id: 'stock',     label: 'Stocks'       },
  { id: 'debts',     label: 'Dettes'       },
  { id: 'suppliers', label: 'Fournisseurs' },
  { id: 'caisse',    label: 'Caisse'    },
  { id: 'banque',    label: 'Banque'    },
];

type TabId = 'daily' | 'monthly' | 'stock' | 'debts' | 'suppliers' | 'caisse' | 'banque';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabId>('daily');
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [date, setDate]           = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth]         = useState<number>(new Date().getMonth() + 1);
  const [year, setYear]           = useState<number>(new Date().getFullYear());

  // Filtre de date pour caisse et banque
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate]     = useState<string>('');

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
      if (activeTab === 'caisse')    res = await getCaisseMovements(startDate && endDate ? { startDate, endDate } : {});
      if (activeTab === 'banque')    res = await getBankMovements(startDate && endDate ? { startDate, endDate } : {});
      setData(res.data);
    } catch { toast.error('Erreur chargement rapport'); }
    finally { setLoading(false); }
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      let res: any;
      const dateParams = startDate && endDate ? { startDate, endDate } : {};

      if (activeTab === 'caisse') {
        res = await exportCaisseReport(format, dateParams);
      } else if (activeTab === 'banque') {
        res = await exportBankReport(format, dateParams);
      } else {
        const params = activeTab === 'daily' ? { date } : activeTab === 'monthly' ? { month, year } : {};
        res = await exportReport(activeTab, format, params);
      }

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

      {/* Onglets */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id as TabId); setData(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
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
          {(activeTab === 'caisse' || activeTab === 'banque') && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Du</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Au</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              </div>
              <p className="text-xs text-gray-400">Laisser vide pour tout afficher</p>
            </>
          )}
          <Button onClick={fetchReport} variant="primary" loading={loading}>
            <FiSearch size={16} /> Générer
          </Button>
          {data && (
            <div className="flex gap-2 ml-auto">
              {(activeTab === 'caisse' || activeTab === 'banque') ? (
                <>
                  <Button onClick={() => handleExport('pdf')} variant="ghost" size="sm" loading={exporting}>
                    <FiDownload size={14} /> PDF
                  </Button>
                  <Button onClick={() => handleExport('csv')} variant="ghost" size="sm" loading={exporting}>
                    <FiDownload size={14} /> CSV
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleExport('pdf')}  variant="ghost" size="sm" loading={exporting}>
                    <FiDownload size={14} /> PDF
                  </Button>
                  <Button onClick={() => handleExport('word')} variant="ghost" size="sm" loading={exporting}>
                    <FiDownload size={14} /> Word
                  </Button>
                  <Button onClick={() => handleExport('csv')}  variant="ghost" size="sm" loading={exporting}>
                    <FiDownload size={14} /> CSV
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">

          {/* ── Journalier ── */}
          {activeTab === 'daily' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ventes totales', value: `${formatAmount(data.totalSales)} GNF`,    color: 'text-blue-900'   },
                  { label: 'Encaissé',       value: `${formatAmount(data.totalCash)} GNF`,     color: 'text-green-600'  },
                  { label: 'Crédit',         value: `${formatAmount(data.totalCredit)} GNF`,   color: 'text-yellow-600' },
                  { label: 'Dépenses',       value: `${formatAmount(data.totalExpenses)} GNF`, color: 'text-red-600'    },
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
                        <tr>{['N° Vente', 'Client', 'Montant', 'Type', 'Statut'].map(h => (
                          <th key={h} className="px-4 py-2 text-left">{h}</th>
                        ))}</tr>
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

          {/* ── Mensuel ── */}
          {activeTab === 'monthly' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ventes totales', value: `${formatAmount(data.totalSales)} GNF`,    color: 'text-blue-900'  },
                { label: 'Dépenses',       value: `${formatAmount(data.totalExpenses)} GNF`, color: 'text-red-600'   },
                { label: 'Bénéfice net',   value: `${formatAmount(data.netProfit)} GNF`,     color: data.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                { label: 'Transactions',   value: data.salesCount,                           color: 'text-gray-700'  },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Stocks ── */}
          {activeTab === 'stock' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Valeur stock (prix achat)', value: `${formatAmount(data.valeurStockAchat)} GNF`, color: 'text-blue-900' },
                  { label: 'Produits en stock bas',     value: `${data.lowStock?.length || 0} produit(s)`,  color: 'text-red-600'  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>{['Produit', 'Catégorie', 'Stock Cartons', 'Prix/Carton', 'Valeur stock (achat)', 'Statut'].map(h => (
                      <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {data.products?.map((p: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 font-semibold">{p.name}</td>
                        <td className="px-4 py-2">{p.category || '—'}</td>
                        <td className="px-4 py-2">{p.stockCartons}</td>
                        <td className="px-4 py-2">{formatAmount(p.purchasePricePerCarton)} GNF</td>
                        <td className="px-4 py-2 font-semibold text-blue-900">{formatAmount(p.stockCartons * p.purchasePricePerCarton || 0)} GNF</td>
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

          {/* ── Dettes ── */}
          {activeTab === 'debts' && (
            <>
              <div className="bg-red-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total dettes clients</span>
                <span className="text-xl font-bold text-red-600">{formatAmount(data.totalDebt)} GNF</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>{['Client', 'Téléphone', 'Plafond', 'Dette actuelle', 'Statut'].map(h => (
                      <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}</tr>
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

          {/* ── Fournisseurs ── */}
          {activeTab === 'suppliers' && (
            <>
              <div className="bg-yellow-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total dû aux fournisseurs</span>
                <span className="text-xl font-bold text-yellow-600">{formatAmount(data.totalOwed)} GNF</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>{['Fournisseur', 'Téléphone', 'Total achats', 'Total payé', 'Solde restant'].map(h => (
                      <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}</tr>
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

          {/* ── Caisse ── */}
          {activeTab === 'caisse' && (
            <>
              {/* Résumé */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Total entrées</p>
                  <p className="text-lg font-bold text-green-600">+ {formatAmount(data.totalEntrees)} GNF</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Total sorties</p>
                  <p className="text-lg font-bold text-red-600">− {formatAmount(data.totalSorties)} GNF</p>
                </div>
                <div className={`rounded-xl p-4 ${data.solde >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">Solde caisse</p>
                  <p className={`text-lg font-bold ${data.solde >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                    {formatAmount(data.solde)} GNF
                  </p>
                </div>
              </div>

              {/* Liste mouvements */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>{['Date', 'Type', 'Catégorie', 'Libellé', 'Montant'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {data.mouvements?.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun mouvement</td></tr>
                    ) : data.mouvements?.map((m: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`flex items-center gap-1 text-xs font-semibold ${
                            m.type === 'entrée' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {m.type === 'entrée'
                              ? <FiTrendingUp size={13} />
                              : <FiTrendingDown size={13} />
                            }
                            {m.type === 'entrée' ? 'Entrée' : 'Sortie'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {m.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{m.libelle}</td>
                        <td className={`px-4 py-2.5 font-bold whitespace-nowrap ${
                          m.type === 'entrée' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.type === 'entrée' ? '+' : '−'} {formatAmount(m.montant)} GNF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Banque ── */}
          {activeTab === 'banque' && (
            <>
              {/* Résumé */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Total entrées</p>
                  <p className="text-lg font-bold text-green-600">+ {formatAmount(data.totalEntrees)} GNF</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Total sorties</p>
                  <p className="text-lg font-bold text-red-600">− {formatAmount(data.totalSorties)} GNF</p>
                </div>
                <div className={`rounded-xl p-4 ${data.solde >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">Solde banque</p>
                  <p className={`text-lg font-bold ${data.solde >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                    {formatAmount(data.solde)} GNF
                  </p>
                </div>
              </div>

              {/* Liste mouvements */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>{['Date', 'Type', 'Catégorie', 'Libellé', 'Montant'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {data.mouvements?.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun mouvement</td></tr>
                    ) : data.mouvements?.map((m: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`flex items-center gap-1 text-xs font-semibold ${
                            m.type === 'entrée' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {m.type === 'entrée'
                              ? <FiTrendingUp size={13} />
                              : <FiTrendingDown size={13} />
                            }
                            {m.type === 'entrée' ? 'Entrée' : 'Sortie'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {m.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{m.libelle}</td>
                        <td className={`px-4 py-2.5 font-bold whitespace-nowrap ${
                          m.type === 'entrée' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.type === 'entrée' ? '+' : '−'} {formatAmount(m.montant)} GNF
                        </td>
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