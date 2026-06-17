import { useState, useEffect, useMemo } from 'react';
import { getSales, createSale, updateSale, deleteSale } from '../../api/saleAPI';
import { downloadInvoicePDF } from '../../api/invoiceAPI';
import { getProducts } from '../../api/productAPI';
import { getClients } from '../../api/clientAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiAlertTriangle, FiEdit2, FiDownload, FiPrinter } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiX } from 'react-icons/fi';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  'payé': 'success', 'partiel': 'warning', 'crédit': 'danger'
};

interface SaleFormItem {
  product: string;
  productName: string;
  quantity: number | string;
  unit: string;
  unitPrice: number;
  total: number;
}

interface SaleForm {
  client: string;
  paymentType: string;
  amountPaid: number;
  discount: number;
  items: SaleFormItem[];
  useManualName: boolean;
  clientManualName: string;
}

interface EditForm {
  amountPaid: number;
  discount: number;
  status: string;
}

interface CurrentItem {
  product: string;
  quantity: number | string;
  unit: string;
}

interface LastInvoice {
  id: string;
  number: string;
}

export default function Sales() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [sales, setSales]             = useState<any[]>([]);
  const [products, setProducts]       = useState<any[]>([]);
  const [clients, setClients]         = useState<any[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [modalOpen, setModalOpen]     = useState<boolean>(false);
  const [detailModal, setDetailModal] = useState<boolean>(false);
  const [editModal, setEditModal]     = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<any>(null);
  const [saving, setSaving]           = useState<boolean>(false);
  const [successModal, setSuccessModal] = useState<boolean>(false);
  const [lastInvoice, setLastInvoice]   = useState<LastInvoice | null>(null);
  const [printLoading, setPrintLoading] = useState<boolean>(false);

  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const [form, setForm] = useState<SaleForm>({
    client: '', paymentType: 'comptant', amountPaid: 0,
    discount: 0, items: [], useManualName: false, clientManualName: '',
  });

  const [editForm, setEditForm] = useState<EditForm>({
    amountPaid: 0, discount: 0, status: 'payé'
  });

  const [currentItem, setCurrentItem] = useState<CurrentItem>({
    product: '', quantity: 1, unit: 'carton'
  });

  const fetchAll = async () => {
    try {
      const [s, p, c] = await Promise.all([getSales(), getProducts(), getClients()]);
      setSales(s.data);
      setProducts(p.data);
      setClients(c.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 15000);

  const getProductById = (id: string) => products.find(p => p._id === id);

  const addItem = () => {
    if (!currentItem.product || !currentItem.quantity) {
      toast.error('Sélectionnez un produit et une quantité'); return;
    }
    const product = getProductById(currentItem.product);
    if (!product) return;
    const unitPrice = currentItem.unit === 'carton' ? product.pricePerCarton : product.pricePerKg;
    const total = unitPrice * Number(currentItem.quantity);
    setForm(f => ({
      ...f,
      items: [...f.items, {
        ...currentItem,
        quantity: Number(currentItem.quantity),
        productName: product.name,
        unitPrice, total
      }]
    }));
    setCurrentItem({ product: '', quantity: 1, unit: 'carton' });
  };

  const removeItem = (i: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subTotal    = form.items.reduce((sum, i) => sum + i.total, 0);
  const totalAmount = subTotal - Number(form.discount || 0);

  const handleSubmit = async () => {
    if (!form.items.length) { toast.error('Ajoutez au moins un article'); return; }
    console.log('Items envoyés:', form.items); // ← ajoute ça
    setSaving(true);
    try {
      const res = await createSale({
        ...form,
        client:     form.useManualName ? undefined : (form.client || undefined),
        clientName: form.useManualName ? (form.clientManualName || 'Client comptant') : undefined,
        amountPaid: form.paymentType === 'comptant' ? totalAmount : Number(form.amountPaid || 0),
      });
      toast.success('Vente enregistrée !');
      setModalOpen(false);
      setForm({ client: '', paymentType: 'comptant', amountPaid: 0, discount: 0, items: [], useManualName: false, clientManualName: '' });
      if (res.data.invoiceId) {
        setLastInvoice({ id: res.data.invoiceId, number: res.data.invoiceNumber });
        setSuccessModal(true);
      }
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const openEdit = (sale: any) => {
    setSelected(sale);
    setEditForm({
      amountPaid: sale.amountPaid,
      discount:   sale.discount,
      status:     sale.status,
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateSale(selected._id, editForm);
      toast.success('Vente mise à jour !');
      setEditModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteSale(selected._id);
      toast.success('Vente supprimée et stock restauré !');
      setDeleteModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDownloadInvoice = async () => {
    if (!lastInvoice) return;
    setPrintLoading(true);
    try {
      const res = await downloadInvoicePDF(lastInvoice.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Facture-${lastInvoice.number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée !');
    } catch { toast.error('Erreur téléchargement facture'); }
    finally { setPrintLoading(false); }
  };

  const handlePrintInvoice = async () => {
    if (!lastInvoice) return;
    setPrintLoading(true);
    try {
      const res  = await downloadInvoicePDF(lastInvoice.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      } else {
        const a = document.createElement('a');
        a.href  = url; a.download = `Facture-${lastInvoice.number}.pdf`; a.click();
        toast.success('PDF téléchargé — les popups sont bloquées');
      }
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Erreur impression facture'); }
    finally { setPrintLoading(false); }
  };

  const handleDownloadSaleInvoice = async (sale: any) => {
    try {
      const invoiceId = sale.invoiceId || null;
      if (!invoiceId) {
        toast.error('Aucune facture associée à cette vente');
        return;
      }
      const res = await downloadInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Facture-${sale.saleNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée !');
    } catch { toast.error('Erreur téléchargement'); }
  };

  const selectedClient = clients.find(c => c._id === form.client);

  const filteredSales = useMemo(() => {
    let result = [...sales];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.clientName?.toLowerCase().includes(q) ||
        s.saleNumber?.toLowerCase().includes(q)
      );
    } 

    if (filterType !== "all") {
      result = result.filter(s => s.paymentType === filterType);
    }

    if (filterPeriod !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(s => {
        const date = new Date(s.createdAt);
        if (filterPeriod === "today") return date >= today;
        if (filterPeriod === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }
        if (filterPeriod === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return date >= monthStart;
        }
        return true;
      });
    }

    return result;
  }, [sales, search, filterPeriod, filterStatus, filterType]);

  const columns = [
    { header: 'N° Vente',  render: (s: any) => <span className="font-mono text-xs font-semibold text-blue-900">{s.saleNumber}</span> },
    { header: 'Client',    render: (s: any) => <span className="text-sm text-gray-700">{s.clientName}</span> },
    { header: 'Montant',   render: (s: any) => <span className="text-sm font-semibold">{formatAmount(s.totalAmount)} GNF</span> },
    { header: 'Payé',      render: (s: any) => <span className="text-sm text-green-600">{formatAmount(s.amountPaid)} GNF</span> },
    { header: 'Reste',     render: (s: any) => (
      <span className={`text-sm font-semibold ${s.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
        {formatAmount(s.remainingAmount)} GNF
      </span>
    )},
    { header: 'Type',      render: (s: any) => (
      <Badge label={s.paymentType} variant={s.paymentType === 'comptant' ? 'success' : 'warning'} />
    )},
    { header: 'Statut',    render: (s: any) => (
      <Badge label={s.status} variant={statusVariant[s.status] || 'default'} />
    )},
    { header: 'Date',      render: (s: any) => <span className="text-xs text-gray-500">{formatDate(s.createdAt)}</span> },
    { header: 'Actions',   render: (s: any) => (
      <div className="flex items-center gap-1.5">
        {/* Voir détail */}
        <button onClick={() => { setSelected(s); setDetailModal(true); }}
          title="Voir détail"
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          <FiEye size={14} />
        </button>
        {/* Modifier */}
        <button onClick={() => openEdit(s)}
          title="Modifier"
          className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
          <FiEdit2 size={14} />
        </button>
        {/* Supprimer (admin only) */}
        {isAdmin && (
          <button onClick={() => { setSelected(s); setDeleteModal(true); }}
            title="Supprimer"
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Point de Vente</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredSales.length} vente(s) {search || filterStatus !== 'all' || filterType !== 'all' || filterPeriod !== 'all' ? 'trouvée(s)' : 'enregistrée(s)'}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="primary">
          <FiPlus size={18} /> Nouvelle vente
        </Button>
      </div>

      {/* Recherche + Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3">

        {/* Recherche */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de vente ou nom du client..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-900 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3">

          {/* Statut */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-900">
            <option value="all">Tous les statuts</option>
            <option value="payé">Payé</option>
            <option value="partiel">Partiel</option>
            <option value="crédit">Crédit</option>
          </select>

          {/* Type paiement */}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-900">
            <option value="all">Tous les types</option>
            <option value="comptant">Comptant</option>
            <option value="credit">Crédit</option>
          </select>

          {/* Période */}
          <div className="flex gap-2">
            {[
              { value: 'all',   label: 'Tout'          },
              { value: 'today', label: "Aujourd'hui"   },
              { value: 'week',  label: 'Cette semaine' },
              { value: 'month', label: 'Ce mois'       },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setFilterPeriod(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${filterPeriod === value ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={filteredSales} loading={loading} emptyMessage="Aucune vente enregistrée" />
      </div>

      {/* Modal Nouvelle Vente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle vente" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Client</label>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setForm({ ...form, client: '', clientManualName: '', useManualName: false })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${!form.useManualName ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Client enregistré
                </button>
                <button type="button"
                  onClick={() => setForm({ ...form, client: '', useManualName: true, paymentType: 'comptant' })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${form.useManualName ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Saisie manuelle
                </button>
              </div>
              {!form.useManualName ? (
                <select value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                  <option value="">Client comptant</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id} disabled={c.isBlocked && form.paymentType === 'credit'}>
                      {c.name} {c.isBlocked && form.paymentType === 'credit' ? '🔴 Bloqué' : c.currentDebt > 0 ? `(Dette: ${formatAmount(c.currentDebt)} GNF)` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" value={form.clientManualName}
                  onChange={(e) => setForm({ ...form, clientManualName: e.target.value })}
                  placeholder="Nom du client..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              )}
              {!form.useManualName && form.client && selectedClient?.isBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                  <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                  <p className="text-xs text-red-700">
                    Client bloqué — plafond de {formatAmount(selectedClient?.creditLimit || 0)} GNF atteint.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type de paiement</label>
              <select value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                disabled={form.useManualName}>
                <option value="comptant">Comptant</option>
                {!form.useManualName && <option value="credit">Crédit</option>}
              </select>
              {form.useManualName && (
                <p className="text-xs text-gray-400">Le crédit est réservé aux clients enregistrés</p>
              )}
            </div>
          </div>

          {/* Ajouter article */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-900 mb-3">➕ Ajouter un article</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-500">Produit</label>
                <select value={currentItem.product}
                  onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                  <option value="">Sélectionner...</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Unité</label>
                <select value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                  <option value="carton">Carton</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Quantité</label>
                <input type="number" value={currentItem.quantity} min="1"
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
              </div>
            </div>
            <Button onClick={addItem} variant="secondary" size="sm" className="mt-3">
              <FiPlus size={14} /> Ajouter
            </Button>
          </div>

          {/* Liste articles */}
          {form.items.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white text-xs">
                  <tr>
                    {['Produit', 'Qté', 'Unité', 'Prix unit.', 'Total', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5 text-gray-900">{item.productName}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.unit}</td>
                      <td className="px-3 py-2.5 text-gray-900">{formatAmount(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{formatAmount(item.total)}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-1">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
          {form.items.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">{formatAmount(subTotal)} GNF</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Remise (GNF)</span>
                <input type="number" value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm text-right focus:outline-none" />
              </div>
              <div className="flex justify-between text-base font-bold text-blue-900 border-t border-blue-200 pt-2">
                <span>TOTAL</span>
                <span>{formatAmount(totalAmount)} GNF</span>
              </div>
              {form.paymentType === 'credit' && (
                <div className="flex flex-col gap-1 pt-2">
                  <label className="text-sm text-gray-600">Acompte versé (GNF)</label>
                  <input type="number"
                    value={form.amountPaid === 0 ? '' : form.amountPaid}
                    onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })}
                    placeholder="0"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}
            disabled={!form.useManualName && form.paymentType === 'credit' && !!selectedClient?.isBlocked}>
            Enregistrer la vente
          </Button>
        </div>
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)}
        title={`Modifier — ${selected?.saleNumber}`} size="sm">
        <div className="space-y-4">

          {/* Info vente */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Client</span>
              <span className="font-semibold">{selected?.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Montant total</span>
              <span className="font-semibold">{formatAmount(selected?.totalAmount || 0)} GNF</span>
            </div>
          </div>

          {/* Montant payé */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Montant payé (GNF)</label>
            <input type="number" value={editForm.amountPaid}
              onChange={(e) => setEditForm({ ...editForm, amountPaid: Number(e.target.value) })}
              max={selected?.totalAmount}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
          </div>

          {/* Remise */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Remise (GNF)</label>
            <input type="number" value={editForm.discount}
              onChange={(e) => setEditForm({ ...editForm, discount: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Statut</label>
            <select value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="payé">Payé</option>
              <option value="partiel">Partiel</option>
              <option value="crédit">Crédit</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setEditModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleUpdate} loading={saving}>
            Mettre à jour
          </Button>
        </div>
      </Modal>

      {/* Modal Détail */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)}
        title={`Détail — ${selected?.saleNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Client :</span> <strong>{selected.clientName}</strong></div>
              <div><span className="text-gray-500">Date :</span> <strong>{formatDate(selected.createdAt)}</strong></div>
              <div><span className="text-gray-500">Type :</span> <strong>{selected.paymentType}</strong></div>
              <div><span className="text-gray-500">Statut :</span>
                <Badge label={selected.status} variant={statusVariant[selected.status] || 'default'} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white text-xs">
                  <tr>
                    {['Produit', 'Qté', 'Unité', 'Prix', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5 text-gray-900">{item.productName}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.unit}</td>
                      <td className="px-3 py-2.5 text-gray-900">{formatAmount(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 font-semibold">{formatAmount(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span>{formatAmount(selected.subTotal)} GNF</span></div>
              <div className="flex justify-between"><span>Remise</span><span>{formatAmount(selected.discount)} GNF</span></div>
              <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2">
                <span>TOTAL</span><span>{formatAmount(selected.totalAmount)} GNF</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Payé</span><span>{formatAmount(selected.amountPaid)} GNF</span>
              </div>
              {selected.remainingAmount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Reste</span><span>{formatAmount(selected.remainingAmount)} GNF</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Supprimer (admin only) */}
      {isAdmin && (
        <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer la suppression" size="sm">
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-red-700">
                <p className="font-semibold">Cette action est irréversible !</p>
                <p className="mt-1">La vente <strong>{selected?.saleNumber}</strong> sera supprimée et le stock sera restauré automatiquement.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} loading={saving}>
              Supprimer définitivement
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal Succès */}
      <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Vente enregistrée !" size="sm">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-gray-800 font-semibold">Vente enregistrée avec succès</p>
            <p className="text-sm text-gray-500 mt-1">
              Facture <span className="font-mono font-bold text-blue-900">{lastInvoice?.number}</span> générée automatiquement
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={handleDownloadInvoice} loading={printLoading} className="w-full">
              <FiDownload size={16} /> Télécharger la facture PDF
            </Button>
            <Button variant="ghost" onClick={handlePrintInvoice} loading={printLoading} className="w-full">
              <FiPrinter size={16} /> Imprimer la facture
            </Button>
            <Button variant="ghost" onClick={() => setSuccessModal(false)} className="w-full">
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}