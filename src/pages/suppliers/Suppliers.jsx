import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, recordSupplierPayment, recordPurchase } from '../../api/supplierAPI';
import { formatAmount } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

const emptyForm = { name: '', phone: '', address: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [payModal, setPayModal]       = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [amount, setAmount]           = useState('');
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch { toast.error('Erreur chargement fournisseurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate   = ()  => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit     = (s) => { setSelected(s); setForm({ ...s }); setModalOpen(true); };
  const openPay      = (s) => { setSelected(s); setAmount(''); setNote(''); setPayModal(true); };
  const openPurchase = (s) => { setSelected(s); setAmount(''); setPurchaseModal(true); };
  const openDelete   = (s) => { setSelected(s); setDeleteModal(true); };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      selected ? await updateSupplier(selected._id, form) : await createSupplier(form);
      toast.success(selected ? 'Fournisseur mis à jour !' : 'Fournisseur créé !');
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try {
      await recordSupplierPayment(selected._id, { amount: Number(amount), note });
      toast.success('Versement enregistré !');
      setPayModal(false);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePurchase = async () => {
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try {
      await recordPurchase(selected._id, { amount: Number(amount) });
      toast.success('Achat enregistré !');
      setPurchaseModal(false);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteSupplier(selected._id);
      toast.success('Fournisseur désactivé !');
      setDeleteModal(false);
      fetchSuppliers();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  const columns = [
    { header: 'Fournisseur', render: (s) => (
      <div>
        <p className="font-semibold text-gray-800">{s.name}</p>
        <p className="text-xs text-gray-400">{s.phone}</p>
      </div>
    )},
    { header: 'Adresse', key: 'address' },
    { header: 'Total achats', render: (s) => <span>{formatAmount(s.totalPurchases)} GNF</span> },
    { header: 'Total payé',   render: (s) => <span className="text-green-600">{formatAmount(s.totalPaid)} GNF</span> },
    { header: 'Solde restant', render: (s) => (
      <span className={`font-semibold ${s.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatAmount(s.balance)} GNF
      </span>
    )},
    { header: 'Actions', render: (s) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openPurchase(s)}
          className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
          title="Enregistrer achat">
          <FiShoppingBag size={15} />
        </button>
        <button onClick={() => openPay(s)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Enregistrer versement">
          <FiDollarSign size={15} />
        </button>
        <button onClick={() => openEdit(s)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => openDelete(s)}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Fournisseurs</h1>
          <p className="text-gray-500 text-sm">{suppliers.length} fournisseur(s)</p>
        </div>
        <Button onClick={openCreate} variant="primary"><FiPlus size={18} /> Nouveau fournisseur</Button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input type="text" placeholder="Rechercher un fournisseur..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucun fournisseur trouvé" />
      </div>

      {/* Modal Créer/Modifier */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}>
        <div className="space-y-4">
          <Input label="Nom" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Téléphone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Adresse" name="address" value={form.address} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Modal Achat */}
      <Modal isOpen={purchaseModal} onClose={() => setPurchaseModal(false)}
        title={`Enregistrer un achat — ${selected?.name}`} size="sm">
        <Input label="Montant de l'achat (GNF)" type="number" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setPurchaseModal(false)}>Annuler</Button>
          <Button variant="secondary" onClick={handlePurchase} loading={saving}>Confirmer</Button>
        </div>
      </Modal>

      {/* Modal Versement */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)}
        title={`Versement — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Solde restant : <strong className="text-red-600">{formatAmount(selected?.balance || 0)} GNF</strong>
          </p>
          <Input label="Montant versé (GNF)" type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          <Input label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setPayModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handlePayment} loading={saving}>Confirmer</Button>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Désactiver <strong>{selected?.name}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}