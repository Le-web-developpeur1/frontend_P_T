import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../../api/productAPI';
import { formatAmount } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface ProductForm {
  name: string;
  category: string;
  stockCartons: number;
  stockKg: number;
  kgPerCarton: number;
  pricePerCarton: number;
  pricePerKg: number;
  alertThreshold: number;
}

interface Product extends ProductForm {
  _id: string;
}

interface StockForm {
  type: string;
  quantityCartons: number;
  quantityKg: number;
  reason: string;
}

const emptyForm: ProductForm = {
  name: '', category: '', stockCartons: 0, stockKg: 0,
  kgPerCarton: 0, pricePerCarton: 0, pricePerKg: 0, alertThreshold: 5
};

const emptyStockForm: StockForm = { type: 'entrée', quantityCartons: 0, quantityKg: 0, reason: 'achat' };

export default function Products() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState<boolean>(true);
  const [modalOpen, setModalOpen]       = useState<boolean>(false);
  const [stockModal, setStockModal]     = useState<boolean>(false);
  const [deleteModal, setDeleteModal]   = useState<boolean>(false);
  const [selected, setSelected]         = useState<Product | null>(null);
  const [form, setForm]                 = useState<ProductForm>(emptyForm);
  const [stockForm, setStockForm]       = useState<StockForm>(emptyStockForm);
  const [saving, setSaving]             = useState<boolean>(false);
  const [search, setSearch]             = useState<string>('');

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useAutoRefresh(fetchProducts, 30000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>  {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };

    if (name === "stockCartons" || name === "kgPerCarton") {
      const cartons = Number(name === "stockCartons" ? value : form.stockCartons);
      const kgPerCarton = Number(name === "kgPerCarton" ? value : form.kgPerCarton);
      newForm.stockKg = cartons * kgPerCarton;
    }
    
    setForm(newForm);
  };
    
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setStockForm({ ...stockForm, [e.target.name]: e.target.value });

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelected(product);
    setForm({ ...product });
    setModalOpen(true);
  };

  const openStock = (product: Product) => {
    setSelected(product);
    setStockForm(emptyStockForm);
    setStockModal(true);
  };

  const openDelete = (product: Product) => {
    setSelected(product);
    setDeleteModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.kgPerCarton || !form.pricePerCarton || !form.pricePerKg) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await updateProduct(selected._id, form);
        toast.success('Produit mis à jour !');
      } else {
        await createProduct(form);
        toast.success('Produit créé !');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleStockSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adjustStock(selected._id, stockForm);
      toast.success('Stock ajusté !');
      setStockModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteProduct(selected._id);
      toast.success('Produit désactivé !');
      setDeleteModal(false);
      fetchProducts();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Produit', render: (p: Product) => (
      <div>
        <p className="font-semibold text-gray-800">{p.name}</p>
        <p className="text-xs text-gray-400">{p.category}</p>
      </div>
    )},
    { header: 'Stock Cartons', render: (p: Product) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{p.stockCartons}</span>
        {p.stockCartons <= p.alertThreshold && (
          <FiAlertTriangle className="text-yellow-500" size={14} />
        )}
      </div>
    )},
    { header: 'Stock Kg', render: (p: Product) => <span>{p.stockKg} kg</span> },
    { header: 'Prix/Carton', render: (p: Product) => <span>{formatAmount(p.pricePerCarton)} GNF</span> },
    { header: 'Prix/Kg', render: (p: Product) => <span>{formatAmount(p.pricePerKg)} GNF</span> },
    { header: 'Statut', render: (p: Product) => (
      <Badge
        label={p.stockCartons <= p.alertThreshold ? 'Stock bas' : 'OK'}
        variant={p.stockCartons <= p.alertThreshold ? 'warning' : 'success'}
      />
    )},
    { header: 'Actions', render: (p: Product) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openStock(p)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Ajuster stock">
          <FiPackage size={15} />
        </button>
        <button onClick={() => openEdit(p)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Modifier">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => openDelete(p)}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Supprimer">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Produits</h1>
          <p className="text-gray-500 text-sm">{products.length} produit(s) au total</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <FiPlus size={18} /> Nouveau produit
        </Button>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucun produit trouvé" />
      </div>

      {/* Modal Créer/Modifier */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier le produit' : 'Nouveau produit'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nom du produit" name="name" value={form.name} onChange={handleChange} required className="col-span-2" />
          <Input label="Catégorie" name="category" value={form.category} onChange={handleChange} />
          <Input label="Kg par carton" name="kgPerCarton" type="number" value={form.kgPerCarton} onChange={handleChange} required />
          <Input label="Stock initial (cartons)" name="stockCartons" type="number" value={form.stockCartons} onChange={handleChange} />
          <Input label="Stock initial (kg) - calculé automatiquement" name="stockKg" type="number" value={form.stockKg} disabled className='bg-gray-100' />
          <Input label="Prix par carton (GNF)" name="pricePerCarton" type="number" value={form.pricePerCarton} onChange={handleChange} required />
          <Input label="Prix par kg (GNF)" name="pricePerKg" type="number" value={form.pricePerKg} onChange={handleChange} required />
          <Input label="Seuil d'alerte (cartons)" name="alertThreshold" type="number" value={form.alertThreshold} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Modal Ajuster Stock */}
      <Modal isOpen={stockModal} onClose={() => setStockModal(false)} title={`Ajuster le stock — ${selected?.name}`}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Type d'opération</label>
            <select
              name="type"
              value={stockForm.type}
              onChange={handleStockChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
            >
              <option value="entrée">Entrée</option>
              <option value="sortie">Sortie</option>
              <option value="ajustement">Ajustement</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Raison</label>
            <select
              name="reason"
              value={stockForm.reason}
              onChange={handleStockChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
            >
              <option value="achat">Achat</option>
              <option value="retour">Retour</option>
              <option value="perte">Perte</option>
              <option value="ajustement">Ajustement</option>
            </select>
          </div>
          <Input label="Quantité (cartons)" name="quantityCartons" type="number" value={stockForm.quantityCartons} onChange={handleStockChange} />
          <Input label="Quantité (kg)" name="quantityKg" type="number" value={stockForm.quantityKg} onChange={handleStockChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setStockModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleStockSubmit} loading={saving}>Confirmer</Button>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer la suppression" size="sm">
        <p className="text-gray-600">
          Voulez-vous vraiment désactiver le produit <strong>{selected?.name}</strong> ?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}