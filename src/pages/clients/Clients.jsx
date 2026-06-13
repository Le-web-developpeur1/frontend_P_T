import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, recordClientPayment } from '../../api/clientAPI';
import { formatAmount } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const emptyForm = { name: '', phone: '', address: '', creditLimit: 0 };

export default function Clients() {
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [payModal, setPayModal]     = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [payAmount, setPayAmount]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');

  const fetchClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch { toast.error('Erreur chargement clients'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchClients(); }, []);
  useAutoRefresh(fetchClients, 30000);



  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit   = (c)  => { setSelected(c); setForm({ ...c }); setModalOpen(true); };
  const openPay    = (c)  => { setSelected(c); setPayAmount(''); setPayModal(true); };
  const openDelete = (c)  => { setSelected(c); setDeleteModal(true); };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      selected ? await updateClient(selected._id, form) : await createClient(form);
      toast.success(selected ? 'Client mis à jour !' : 'Client créé !');
      setModalOpen(false);
      fetchClients();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!payAmount || payAmount <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try {
      await recordClientPayment(selected._id, { amount: Number(payAmount) });
      toast.success('Paiement enregistré !');
      setPayModal(false);
      fetchClients();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteClient(selected._id);
      toast.success('Client désactivé !');
      setDeleteModal(false);
      fetchClients();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const columns = [
    { header: 'Client', render: (c) => (
      <div>
        <p className="font-semibold text-gray-800">{c.name}</p>
        <p className="text-xs text-gray-400">{c.phone}</p>
      </div>
    )},
    { header: 'Adresse', key: 'address' },
    { header: 'Plafond', render: (c) => <span>{formatAmount(c.creditLimit)} GNF</span> },
    { header: 'Dette', render: (c) => (
      <span className={`font-semibold ${c.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatAmount(c.currentDebt)} GNF
      </span>
    )},
    { header: 'Statut', render: (c) => (
      <Badge
        label={c.isBlocked ? 'Bloqué' : 'Actif'}
        variant={c.isBlocked ? 'danger' : 'success'}
      />
    )},
    { header: 'Actions', render: (c) => (
      <div className="flex items-center gap-2">
        {c.currentDebt > 0 && (
          <button onClick={() => openPay(c)}
            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="Enregistrer paiement">
            <FiDollarSign size={15} />
          </button>
        )}
        <button onClick={() => openEdit(c)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => openDelete(c)}
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
          <h1 className="text-2xl font-bold text-blue-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} client(s)</p>
        </div>
        <Button onClick={openCreate} variant="primary"><FiPlus size={18} /> Nouveau client</Button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input type="text" placeholder="Rechercher un client..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucun client trouvé" />
      </div>

      {/* Modal Créer/Modifier */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier le client' : 'Nouveau client'}>
        <div className="space-y-4">
          <Input label="Nom" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Téléphone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Adresse" name="address" value={form.address} onChange={handleChange} />
          <Input label="Plafond de crédit (GNF)" name="creditLimit" type="number" value={form.creditLimit} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Modal Paiement */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title={`Paiement — ${selected?.name}`} size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Dette actuelle : <strong className="text-red-600">{formatAmount(selected?.currentDebt || 0)} GNF</strong>
        </p>
        <Input label="Montant à payer (GNF)" type="number" value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)} placeholder="0" />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setPayModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handlePayment} loading={saving}>Confirmer</Button>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Désactiver le client <strong>{selected?.name}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}