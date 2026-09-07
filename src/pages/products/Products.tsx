import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../../api/productAPI';
import { getSystemConfig } from '../../api/systemAPI';
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
  pricePerCarton: number;
  alertThreshold: number;
}

interface Product extends ProductForm {
  _id: string;
}

interface StockForm {
  type: string;
  quantityCartons: number;
  reason: string;
}

const emptyForm: ProductForm = {
  name: '', 
  category: '', 
  stockCartons: 0,
  pricePerCarton: 0,
  alertThreshold: 5,
};

const emptyStockForm: StockForm = { type: 'entrée', quantityCartons: 0, reason: 'achat' };

export default function Products() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [modalOpen, setModalOpen]     = useState<boolean>(false);
  const [stockModal, setStockModal]   = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<Product | null>(null);
  const [form, setForm]               = useState<ProductForm>(emptyForm);
  const [stockForm, setStockForm]     = useState<StockForm>(emptyStockForm);
  const [saving, setSaving]           = useState<boolean>(false);
  const [search, setSearch]           = useState<string>('');
  const [tauxSysteme, setTauxSysteme] = useState<number>(10);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

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

  useEffect(() => {
    fetchProducts();
    getSystemConfig().then(res => {
      if (res.data.tauxFCFA) setTauxSysteme(res.data.tauxFCFA);
    }).catch(() => {});
  }, []);

  useAutoRefresh(fetchProducts, 30000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setForm(product);
    setModalOpen(true);
  };

  const openStock   = (product: Product) => { setSelected(product); setStockForm(emptyStockForm); setStockModal(true); };
  const openDelete  = (product: Product) => { setSelected(product); setDeleteModal(true); };

  const handleSubmit = async () => {
    if (!form.name || !form.pricePerCarton) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const { stockCartons, ...dataToSend } = form;
      if (selected) {
        await updateProduct(selected._id, dataToSend);
        toast.success('Produit mis à jour !');
      } else {
        await createProduct({...dataToSend, stockCartons});
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
      //Préparer les données
      const payload: any = {
        type: stockForm.type,
        quantityCartons: stockForm.quantityCartons,
        reason: stockForm.reason
      };

      await adjustStock(selected._id, payload);
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
      const response = await deleteProduct(selected._id);
      
      // ── CAS 1 : Erreur - Stock restant ──────────────────
      if (response.data.currentStock) {
        toast.error(
          `❌ ${response.data.message}\n\nVeuillez d'abord ajuster le stock à 0.`,
          { duration: 5000 }
        );
        setDeleteModal(false);
        setSaving(false);
        return;
      }
      
      // ── CAS 2 : Succès - Produit archivé ──────────────────
      if (response.data.archived) {
        const stats = response.data.stats;
        toast.success(
          `✅ Produit archivé\n\n` +
          `Le produit a un historique :\n` +
          `• ${stats.totalSales} vente(s)\n` +
          `• ${stats.totalDamages} avarie(s)\n` +
          `• ${stats.totalMovements} mouvement(s)\n\n` +
          `Il reste consultable dans les archives.`,
          { duration: 6000 }
        );
        setDeleteModal(false);
        fetchProducts();
        setSaving(false);
        return;
      }
      
      // ── CAS 3 : Succès - Produit supprimé définitivement ──────────────────
      if (response.data.deleted) {
        toast.success('✅ Produit supprimé définitivement (aucun historique)');
        setDeleteModal(false);
        fetchProducts();
        setSaving(false);
        return;
      }
      
    } catch (err: any) {
      // Gérer les erreurs HTTP (400, 500...)
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(`❌ ${errorMessage}`, { duration: 5000 });
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
    { header: 'Prix vente/Carton', render: (p: Product) => <span>{formatAmount(p.pricePerCarton)} GNF</span> },
    { header: 'Statut', render: (p: Product) => (
      <Badge
        label={p.stockCartons <= p.alertThreshold ? 'Stock bas' : 'OK'}
        variant={p.stockCartons <= p.alertThreshold ? 'warning' : 'success'}
      />
    )},
    { header: 'Actions', render: (p: Product) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openStock(p)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Ajuster stock">
          <FiPackage size={15} />
        </button>
        <button onClick={() => openEdit(p)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Modifier">
          <FiEdit2 size={15} />
        </button>
        {user.role === 'admin' && (
          <button onClick={() => openDelete(p)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Supprimer">
            <FiTrash2 size={15} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Produits</h1>
          <p className="text-gray-500 text-sm">{products.length} produit(s) au total</p>
        </div>
        {user.role === 'admin' && (
          <Button onClick={openCreate} variant="primary">
            <FiPlus size={18} /> Nouveau produit
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input type="text" placeholder="Rechercher un produit..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucun produit trouvé" />
      </div>

      {/* Modal Créer/Modifier */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier le produit' : 'Nouveau produit'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nom du produit *" name="name" value={form.name} onChange={handleChange} required className="col-span-2" />
          <Input label="Catégorie" name="category" value={form.category} onChange={handleChange} />
          {!selected && ( <Input label="Nombre Total (cartons)" name="stockCartons" type="number" value={form.stockCartons} onChange={handleChange} /> )}

          <Input label="Prix de vente par carton (FG) *" name="pricePerCarton" type="number" value={form.pricePerCarton} onChange={handleChange} required className="col-span-2" />
          <Input label="Seuil d'alerte (cartons)" name="alertThreshold" type="number" value={form.alertThreshold} onChange={handleChange} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Modal Ajustement Stock */}
      <Modal 
        isOpen={stockModal} 
        onClose={() => setStockModal(false)} 
        title={`Ajuster le stock — ${selected?.name}`}
      >
        <div className="space-y-4">
          {/* Stock actuel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Stock actuel :</strong> {selected?.stockCartons || 0} carton(s)
            </p>
          </div>
          
          {/* Boutons rapides */}
          <div className="flex gap-2">
            <button
              onClick={() => setStockForm({ 
                type: 'ajustement', 
                quantityCartons: 0, 
                reason: 'Mise à zéro' 
              })}
              className="flex-1 px-3 py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
            >
              🔄 Mettre à 0
            </button>
            <button
              onClick={() => setStockForm({ 
                type: 'sortie', 
                quantityCartons: selected?.stockCartons || 0, 
                reason: 'Vidage complet' 
              })}
              className="flex-1 px-3 py-2 bg-red-50 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
            >
              ⬇️ Tout retirer
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Type d'opération</label>
            <select 
              name="type" 
              value={stockForm.type} 
              onChange={handleStockChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900"
            >
              <option value="entrée">Entrée (Ajouter au stock)</option>
              <option value="sortie">Sortie (Retirer du stock)</option>
              <option value="ajustement">Ajustement (Définir une valeur exacte)</option>
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
              <option value="preparation_suppression">Préparation suppression</option>
            </select>
          </div>
          
          <Input 
            label={
              stockForm.type === 'ajustement' 
                ? 'Nouvelle valeur (cartons)' 
                : 'Quantité (cartons)'
            }
            name="quantityCartons" 
            type="number" 
            value={stockForm.quantityCartons} 
            onChange={handleStockChange}
            placeholder={stockForm.type === 'ajustement' ? 'Exemple: 0, 10, 50...' : ''}
          />
          
          {/* Aperçu du résultat */}
          {selected && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Résultat :</strong>{' '}
                {stockForm.type === 'ajustement' 
                  ? `${stockForm.quantityCartons} carton(s)` 
                  : stockForm.type === 'entrée'
                  ? `${selected.stockCartons + Number(stockForm.quantityCartons)} carton(s)`
                  : `${Math.max(0, selected.stockCartons - Number(stockForm.quantityCartons))} carton(s)`
                }
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setStockModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleStockSubmit} loading={saving}>
            ✅ Confirmer
          </Button>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal 
        isOpen={deleteModal} 
        onClose={() => setDeleteModal(false)} 
        title="Confirmer la suppression" 
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Voulez-vous vraiment supprimer le produit{' '}
            <strong className="text-gray-900">{selected?.name}</strong> ?
          </p>
          
          {/* ℹ️ Info générale sur la logique de suppression */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>💡 Comment ça marche :</strong>
              <br />
              • Si le produit n'a <strong>jamais été utilisé</strong> → Suppression définitive (même avec stock)
              <br />
              • Si le produit a un <strong>historique</strong> (ventes, avaries, mouvements) → Archivage (stock doit être à 0)
            </p>
          </div>
          
          {/* ⚠️ Alerte si stock restant (affiché dynamiquement après tentative) */}
          {/* On ne peut pas savoir à l'avance si le produit a un historique, 
              donc on laisse le backend gérer l'erreur */}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            loading={saving}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}