import { useState, useEffect } from 'react';
import { getDamages, getDamageStats, createDamage, deleteDamage } from '../../api/damageApi';
import { getProducts } from '../../api/productAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiAlertTriangle, FiPackage, FiDollarSign } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface Product {
  _id: string;
  name: string;
  category?: string;
  stockCartons: number;
  stockKg: number;
  pricePerCarton: number;
  pricePerKg: number;
}

interface DamageForm {
  product: string;
  reason: string;
  quantityCartons: number | string;
  quantityKg: number | string;
  note: string;
}

interface DamageProduct {
  _id: string;
  name: string;
  category?: string;
}

interface Damage {
  _id: string;
  productName: string;
  product: string | DamageProduct;
  reason: string;
  quantityCartons: number;
  quantityKg: number;
  estimatedLoss: number;
  note: string;
  createdAt: string;
}

interface DamageStats {
  totalDamages: number;
  totalCartons: number;
  totalKg: number;
  totalLoss: number;
}

const emptyForm: DamageForm = {
  product: '', reason: 'périmé', quantityCartons: 0, quantityKg: 0, note: ''
};

const reasonVariant: Record<string, 'warning' | 'danger' | 'info' | 'default'> = {
  'périmé':        'warning',
  'pourri':        'danger',
  'endommagé':     'info',
  'contamination': 'danger',
  'autre':         'default',
};

export default function Damages() {
  const [damages, setDamages]         = useState<Damage[]>([]);
  const [stats, setStats]             = useState<DamageStats | null>(null);
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [modalOpen, setModalOpen]     = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<Damage | null>(null);
  const [form, setForm]               = useState<DamageForm>(emptyForm);
  const [saving, setSaving]           = useState<boolean>(false);
  const [search, setSearch]           = useState<string>('');

  const fetchAll = async () => {
    try {
      const [d, s, p] = await Promise.all([getDamages(), getDamageStats(), getProducts()]);
      setDamages(d.data);
      setStats(s.data);
      setProducts(p.data);
    } catch { toast.error('Erreur chargement avaries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 30000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.product) { toast.error('Sélectionnez un produit'); return; }
    if (!Number(form.quantityCartons) && !Number(form.quantityKg)) {
      toast.error('Indiquez au moins une quantité'); return;
    }
    setSaving(true);
    try {
      await createDamage({
        ...form,
        quantityCartons: Number(form.quantityCartons),
        quantityKg:      Number(form.quantityKg),
      });
      toast.success('Avarie déclarée !');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteDamage(selected._id);
      toast.success('Avarie supprimée !');
      setDeleteModal(false);
      fetchAll();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const getCategory = (product: string | DamageProduct): string => {
    if (typeof product === 'object' && product !== null) return product.category || '—';
    return '—';
  };

  const filtered = damages.filter((d: Damage) =>
    d.productName?.toLowerCase().includes(search.toLowerCase()) ||
    d.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find((p: Product) => p._id === form.product);

  const columns = [
    { header: 'Produit', render: (d: Damage) => (
      <div>
        <p className="font-semibold text-gray-800 text-sm">{d.productName}</p>
        <p className="text-xs text-gray-400">{getCategory(d.product)}</p>
      </div>
    )},
    { header: 'Raison', render: (d: Damage) => (
      <Badge label={d.reason} variant={reasonVariant[d.reason] || 'default'} />
    )},
    { header: 'Qté Cartons', render: (d: Damage) => (
      <span className="text-sm">{d.quantityCartons > 0 ? `${d.quantityCartons} cartons` : '—'}</span>
    )},
    { header: 'Qté Kg', render: (d: Damage) => (
      <span className="text-sm">{d.quantityKg > 0 ? `${d.quantityKg} kg` : '—'}</span>
    )},
    { header: 'Perte estimée', render: (d: Damage) => (
      <span className="font-semibold text-red-600">{formatAmount(d.estimatedLoss)} GNF</span>
    )},
    { header: 'Note', render: (d: Damage) => (
      <span className="text-xs text-gray-500 truncate max-w-[120px] block">{d.note || '—'}</span>
    )},
    { header: 'Date', render: (d: Damage) => (
      <span className="text-xs text-gray-500">{formatDate(d.createdAt)}</span>
    )},
    { header: 'Actions', render: (d: Damage) => (
      <button onClick={() => { setSelected(d); setDeleteModal(true); }}
        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
        <FiTrash2 size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Avaries</h1>
          <p className="text-gray-500 text-sm">Déclaration des produits périmés ou endommagés</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="danger">
          <FiPlus size={18} /> Déclarer une avarie
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: FiAlertTriangle, label: 'Total déclarations', value: String(stats.totalDamages),                    color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { icon: FiPackage,       label: 'Cartons perdus',     value: String(stats.totalCartons),                    color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: FiPackage,       label: 'Kg perdus',          value: `${stats.totalKg} kg`,                         color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: FiDollarSign,    label: 'Pertes totales',     value: `${formatAmount(stats.totalLoss)} GNF`,        color: 'text-red-600',    bg: 'bg-red-50'    },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`${bg} rounded-lg p-2.5`}>
                  <Icon className={color} size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <input type="text" placeholder="Rechercher une avarie..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucune avarie déclarée" />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Déclarer une avarie" size="md">
        <div className="space-y-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Produit <span className="text-red-500">*</span>
            </label>
            <select name="product" value={form.product} onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="">Sélectionner un produit...</option>
              {products.map((p: Product) => (
                <option key={p._id} value={p._id}>
                  {p.name} — Stock : {p.stockCartons} cartons / {p.stockKg} kg
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-sm">
              <p className="font-semibold text-yellow-800">Stock actuel de {selectedProduct.name}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-yellow-700">📦 {selectedProduct.stockCartons} cartons</span>
                <span className="text-yellow-700">⚖️ {selectedProduct.stockKg} kg</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Raison <span className="text-red-500">*</span>
            </label>
            <select name="reason" value={form.reason} onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="périmé">Périmé</option>
              <option value="pourri">Pourri</option>
              <option value="endommagé">Endommagé</option>
              <option value="contamination">Contamination</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Quantité (cartons)</label>
              <input type="number" name="quantityCartons"
                value={form.quantityCartons} onChange={handleChange} min="0"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Quantité (kg)</label>
              <input type="number" name="quantityKg"
                value={form.quantityKg} onChange={handleChange} min="0"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
            </div>
          </div>

          {selectedProduct && (Number(form.quantityCartons) > 0 || Number(form.quantityKg) > 0) && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-sm">
              <p className="text-red-700 font-semibold">
                Perte estimée : {formatAmount(
                  (Number(form.quantityCartons) * selectedProduct.pricePerCarton) +
                  (Number(form.quantityKg) * selectedProduct.pricePerKg)
                )} GNF
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Note (optionnel)</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={3}
              placeholder="Détails supplémentaires..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>
            Déclarer l'avarie
          </Button>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">
          Supprimer l'avarie de <strong>{selected?.productName}</strong> ?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}