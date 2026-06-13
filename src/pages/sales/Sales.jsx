import { useState, useEffect } from 'react';
import { getSales, createSale } from '../../api/saleAPI';
import { downloadInvoicePDF } from '../../api/invoiceAPI';
import { getProducts } from '../../api/productAPI';
import { getClients } from '../../api/clientAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const statusVariant = { 'payé': 'success', 'partiel': 'warning', 'crédit': 'danger' };

export default function Sales() {
  const [sales, setSales]         = useState([]);
  const [products, setProducts]   = useState([]);
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastInvoice, setLastInvoice]   = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  const [form, setForm] = useState({
    client: '', paymentType: 'comptant', amountPaid: '', discount: 0, items: [],
    useManualName: false, clientManualName: "",
  });

  const [currentItem, setCurrentItem] = useState({ product: '', quantity: 1, unit: 'carton' });

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
  useAutoRefresh(fetchAll, 5000);

  const getProductById = (id) => products.find(p => p._id === id);

  const addItem = () => {
    if (!currentItem.product || !currentItem.quantity) {
      toast.error('Sélectionnez un produit et une quantité');
      return;
    }
    const product = getProductById(currentItem.product);
    if (!product) return;
    const unitPrice = currentItem.unit === 'carton' ? product.pricePerCarton : product.pricePerKg;
    const total = unitPrice * Number(currentItem.quantity);
    setForm(f => ({
      ...f,
      items: [...f.items, { ...currentItem, productName: product.name, unitPrice, total }]
    }));
    setCurrentItem({ product: '', quantity: 1, unit: 'carton' });
  };

  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subTotal = form.items.reduce((sum, i) => sum + i.total, 0);
  const totalAmount = subTotal - Number(form.discount || 0);

  const handleSubmit = async () => {
  if (!form.items.length) { toast.error('Ajoutez au moins un article'); return; }
  setSaving(true);
  try {
    const res = await createSale({
      ...form,
      client: form.useManualName ? undefined : (form.client || undefined),
      clientName: form.useManualName ? (form.clientManualName || 'Client comptant') : undefined,
      amountPaid: form.paymentType === 'comptant' ? totalAmount : Number(form.amountPaid || 0),
    });

    console.log('Réponse complète:', res.data);
    console.log('invoiceId:', res.data.invoiceId);
    console.log('invoiceNumber:', res.data.invoiceNumber);

    toast.success('Vente enregistrée !');
    setModalOpen(false);
    setForm({ client: '', paymentType: 'comptant', amountPaid: '', discount: 0, items: [] });
    
    if (res.data.invoiceId) {
      setLastInvoice({ id: res.data.invoiceId, number: res.data.invoiceNumber });
      setSuccessModal(true);
    } else {
      toast.error('Facture non générée');
    }
    fetchAll();
  } catch (err) {
    console.error('Erreur vente:', err.response?.data);
    toast.error(err.response?.data?.message || 'Erreur');
  } finally {
    setSaving(false);
  }
};

const handlePrintInvoice = async () => {
  if (!lastInvoice) return;
  setPrintLoading(true);
  try {
    const res = await downloadInvoicePDF(lastInvoice.id);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url  = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      // Si popup bloqué → télécharger directement
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Facture-${lastInvoice.number}.pdf`;
      a.click();
      toast.success('PDF téléchargé — les popups sont bloquées sur ce navigateur');
    }
    window.URL.revokeObjectURL(url);
    toast.success('Facture prête !');
  } catch (err) {
    console.error('Erreur PDF:', err);
    toast.error('Erreur impression facture');
  } finally {
    setPrintLoading(false);
  }
};

  const columns = [
    { header: 'N° Vente', render: (s) => <span className="font-mono text-xs font-semibold text-gray-900">{s.saleNumber}</span> },
    { header: 'Client', render: (s) => <span className="text-sm text-gray-700">{s.clientName}</span> },
    { header: 'Montant', render: (s) => <span className="text-sm font-semibold text-gray-900">{formatAmount(s.totalAmount)} GNF</span> },
    { header: 'Payé', render: (s) => <span className="text-sm text-green-600">{formatAmount(s.amountPaid)} GNF</span> },
    { header: 'Reste', render: (s) => (
      <span className={`text-sm font-semibold ${s.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
        {formatAmount(s.remainingAmount)} GNF
      </span>
    )},
    { header: 'Type', render: (s) => (
      <Badge label={s.paymentType} variant={s.paymentType === 'comptant' ? 'success' : 'warning'} />
    )},
    { header: 'Statut', render: (s) => (
      <Badge label={s.status} variant={statusVariant[s.status] || 'default'} />
    )},
    { header: 'Date', render: (s) => <span className="text-xs text-gray-500">{formatDate(s.createdAt)}</span> },
    { header: 'Actions', render: (s) => (
      <button onClick={() => { setSelected(s); setDetailModal(true); }}
        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
        <FiEye size={16} />
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Caisse — Point de Vente</h1>
        <p className="text-gray-500 text-sm mt-1">{sales.length} vente(s) enregistrée(s)</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)} variant="primary">
          <FiPlus size={18} /> Nouvelle vente
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={sales} loading={loading} emptyMessage="Aucune vente enregistrée" />
      </div>

      {/* Modal Nouvelle Vente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle vente" size="xl">
        <div className="space-y-5">

          {/* Client + Type paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Client</label>
              
              {/* Toggle entre sélection et saisie manuelle */}
              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, client: '', clientManualName: '' })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${!form.useManualName ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Client enregistré
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, client: '', useManualName: true })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${form.useManualName ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Saisie manuelle
                </button>
              </div>

              {/* Sélection client enregistré */}
              {!form.useManualName ? (
                <select
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                >
                  <option value="">Client comptant</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id} disabled={c.isBlocked && form.paymentType === 'credit'}>
                      {c.name} {c.isBlocked && form.paymentType === 'credit' ? '🔴 Bloqué' : c.currentDebt > 0 ? `(Dette: ${formatAmount(c.currentDebt)} GNF)` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                /* Saisie manuelle */
                <input
                  type="text"
                  value={form.clientManualName || ''}
                  onChange={(e) => setForm({ ...form, clientManualName: e.target.value })}
                  placeholder="Nom du client..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                />
              )}

              {/* Alerte client bloqué */}
              {!form.useManualName && form.client && clients.find(c => c._id === form.client)?.isBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                  <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                  <p className="text-xs text-red-700">
                    Client bloqué — plafond de {formatAmount(clients.find(c => c._id === form.client)?.creditLimit || 0)} GNF atteint.
                    Enregistrez un paiement avant toute nouvelle vente à crédit.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type de paiement</label>
              <select
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                disabled={form.useManualName}
              >
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
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
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
                    <th className="px-3 py-2.5 text-left font-medium">Produit</th>
                    <th className="px-3 py-2.5 text-left font-medium">Qté</th>
                    <th className="px-3 py-2.5 text-left font-medium">Unité</th>
                    <th className="px-3 py-2.5 text-left font-medium">Prix unit.</th>
                    <th className="px-3 py-2.5 text-left font-medium">Total</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
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
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm text-right focus:outline-none" />
              </div>
              <div className="flex justify-between text-base font-bold text-blue-900 border-t border-blue-200 pt-2">
                <span>TOTAL</span>
                <span>{formatAmount(totalAmount)} GNF</span>
              </div>
              {form.paymentType === 'credit' && (
                <div className="flex flex-col gap-1 pt-2">
                  <label className="text-sm text-gray-600">Acompte versé (GNF)</label>
                  <input type="number" value={form.amountPaid}
                    onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                    placeholder="0"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Enregistrer la vente
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
              <div><span className="text-gray-500">Statut :</span> <Badge label={selected.status} variant={statusVariant[selected.status]} /></div>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white text-xs">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium">Produit</th>
                    <th className="px-3 py-2.5 text-left font-medium">Qté</th>
                    <th className="px-3 py-2.5 text-left font-medium">Unité</th>
                    <th className="px-3 py-2.5 text-left font-medium">Prix</th>
                    <th className="px-3 py-2.5 text-left font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {selected.items?.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5 text-gray-900">{item.productName}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.unit}</td>
                      <td className="px-3 py-2.5 text-gray-900">{formatAmount(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{formatAmount(item.total)}</td>
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
              <div className="flex justify-between text-green-600"><span>Payé</span><span>{formatAmount(selected.amountPaid)} GNF</span></div>
              {selected.remainingAmount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Reste</span><span>{formatAmount(selected.remainingAmount)} GNF</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      {/* Modal Succès + Impression */}
      <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Vente enregistrée !" size="sm">
        <div className="text-center space-y-5">

          {/* Icône succès */}
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

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={handlePrintInvoice}
              loading={printLoading}
              className="w-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger la facture PDF
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                setPrintLoading(true);
                try {
                  const res = await downloadInvoicePDF(lastInvoice.id);
                  const blob = new Blob([res.data], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const printWindow = window.open(url, '_blank');
                  printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                  };
                } catch {
                  toast.error('Erreur impression');
                } finally {
                  setPrintLoading(false);
                }
              }}
              className="w-full"
            >
              🖨️ Imprimer la facture
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