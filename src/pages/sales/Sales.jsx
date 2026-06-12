import { useState, useEffect } from 'react';
import { getSales, createSale } from '../../api/saleAPI';
import { getProducts } from '../../api/productAPI';
import { getClients } from '../../api/clientAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye } from 'react-icons/fi';

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

  const [form, setForm] = useState({
    client: '', paymentType: 'comptant', amountPaid: '', discount: 0, items: []
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
      await createSale({
        ...form,
        client: form.client || undefined,
        amountPaid: form.paymentType === 'comptant' ? totalAmount : Number(form.amountPaid || 0),
      });
      toast.success('Vente enregistrée !');
      setModalOpen(false);
      setForm({ client: '', paymentType: 'comptant', amountPaid: '', discount: 0, items: [] });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'N° Vente', render: (s) => <span className="font-mono text-sm font-semibold text-blue-900">{s.saleNumber}</span> },
    { header: 'Client', render: (s) => <span>{s.clientName}</span> },
    { header: 'Montant', render: (s) => <span className="font-semibold">{formatAmount(s.totalAmount)} GNF</span> },
    { header: 'Payé', render: (s) => <span className="text-green-600">{formatAmount(s.amountPaid)} GNF</span> },
    { header: 'Reste', render: (s) => (
      <span className={s.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
        {formatAmount(s.remainingAmount)} GNF
      </span>
    )},
    { header: 'Type', render: (s) => (
      <Badge label={s.paymentType} variant={s.paymentType === 'comptant' ? 'success' : 'warning'} />
    )},
    { header: 'Statut', render: (s) => (
      <Badge label={s.status} variant={statusVariant[s.status] || 'default'} />
    )},
    { header: 'Date', render: (s) => <span className="text-sm text-gray-500">{formatDate(s.createdAt)}</span> },
    { header: 'Actions', render: (s) => (
      <button onClick={() => { setSelected(s); setDetailModal(true); }}
        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
        <FiEye size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Caisse — Ventes</h1>
          <p className="text-gray-500 text-sm">{sales.length} vente(s)</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="primary">
          <FiPlus size={18} /> Nouvelle vente
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={sales} loading={loading} emptyMessage="Aucune vente" />
      </div>

      {/* Modal Nouvelle Vente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle vente" size="xl">
        <div className="space-y-5">

          {/* Client + Type paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Client (optionnel)</label>
              <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="">Client comptant</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id} disabled={c.isBlocked}>
                    {c.name} {c.isBlocked ? '(Bloqué)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type de paiement</label>
              <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
                <option value="comptant">Comptant</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
          </div>

          {/* Ajouter article */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ajouter un article</p>
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
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-left">Qté</th>
                    <th className="px-4 py-2 text-left">Unité</th>
                    <th className="px-4 py-2 text-left">Prix unit.</th>
                    <th className="px-4 py-2 text-left">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.unit}</td>
                      <td className="px-4 py-2">{formatAmount(item.unitPrice)} GNF</td>
                      <td className="px-4 py-2 font-semibold">{formatAmount(item.total)} GNF</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                          <FiTrash2 size={14} />
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
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-left">Qté</th>
                    <th className="px-4 py-2 text-left">Unité</th>
                    <th className="px-4 py-2 text-left">Prix</th>
                    <th className="px-4 py-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.unit}</td>
                      <td className="px-4 py-2">{formatAmount(item.unitPrice)} GNF</td>
                      <td className="px-4 py-2 font-semibold">{formatAmount(item.total)} GNF</td>
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
    </div>
  );
}