// @ts-nocheck
import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, getClientHistory, downloadClientReleve } from '../../api/clientAPI';
import { formatAmount } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiEye, FiDollarSign } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from "../../context/AuthContext";

const emptyForm = { name: '', phone: '', address: '', creditLimit: 0 };

export default function Clients() {
  const [clients, setClients]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [modalOpen, setModalOpen]           = useState(false);
  const [deleteModal, setDeleteModal]       = useState(false);
  const [selected, setSelected]             = useState(null);
  const [form, setForm]                     = useState(emptyForm);
  const [saving, setSaving]                 = useState(false);
  const [search, setSearch]                 = useState('');
  const [historyModal, setHistoryModal]     = useState<boolean>(false);
  const [history, setHistory]               = useState<any[]>([]);
  const [historyClient, setHistoryClient]   = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [downloading, setDownloading]       = useState<boolean>(false);

  const { user } = useAuth();
  const canDelete = user?.role === "admin" || user?.role === "gestionnaire";

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

  const openCreate   = ()  => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit     = (c) => { setSelected(c); setForm({ ...c }); setModalOpen(true); };
  const openDelete   = (c) => { setSelected(c); setDeleteModal(true); };

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

  // Fonction pour ouvrir l'historique
  const openHistory = async (client: any) => {
    setHistoryClient(client);
    setHistory([]);
    setHistoryModal(true);
    setHistoryLoading(true);

    try {
      const res = await getClientHistory(client._id);
      setHistory(res.data.history);
    } catch (error) {
      toast.error('Erreur chargement historique');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Télécharger le relevé PDF
  const handleDownloadReleve = async () => {
    if (!historyClient) return;
    setDownloading(true);
    try {
      const res = await downloadClientReleve(historyClient._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Releve-${historyClient.name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Relevé téléchargé avec succès !")
    } catch (error) {
      toast.error('Erreur téléchargment relevé');
    } finally {
      setDownloading(false);
    }
  }

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
        <button onClick={() => openHistory(c)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Historique">
          <FiEye size={15} />
        </button>
        <button onClick={() => openEdit(c)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Modifier">
          <FiEdit2 size={15} />
        </button>
        {canDelete && (
          <button onClick={() => openDelete(c)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Supprimer">
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

      {/* Modal Supprimer */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Désactiver le client <strong>{selected?.name}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>

      {/* Modal Historique */}
      <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)}
        title={`Historique — ${historyClient?.name}`} size="xl">

        {/* Infos client + boutons export */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-gray-500">Dette actuelle : </span>
              <span className="font-bold text-red-600">{formatAmount(historyClient?.currentDebt || 0)} GNF</span>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-gray-500">Plafond : </span>
              <span className="font-bold text-blue-900">{formatAmount(historyClient?.creditLimit || 0)} GNF</span>
            </div>
          </div>
          <div className="flex gap-2">
            {historyClient?.currentDebt > 0 && (
              <a href="/credits"
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                <FiDollarSign size={14} /> Payer sur la page Crédits
              </a>
            )}
            <button onClick={handleDownloadReleve} disabled={downloading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50">
              <FiDownload size={14} /> Télécharger PDF
            </button>
          </div>
        </div>

        {/* Table historique */}
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun historique pour ce client</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white text-xs">
                <tr>
                  {['Date', 'Type', 'Référence', 'Montant', 'Payé', 'Reste', 'Statut', 'Par'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.type === 'vente'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'vente' ? 'Vente' : 'Paiement'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono">{item.reference}</td>
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {formatAmount(item.montant)} GNF
                    </td>
                    {/* Payé */}
                    <td className="px-3 py-2.5 text-green-600 whitespace-nowrap">
                      {item.type === 'vente'
                        ? `${formatAmount(item.paye || 0)} GNF`  // acompte initial
                        : `${formatAmount(item.montant)} GNF`     // montant du paiement
                      }
                    </td>

                    {/* Reste */}
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {item.type === 'vente' ? (
                        <span className={item.reste > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatAmount(item.reste)} GNF
                        </span>
                      ) : (
                        <span className="text-red-600">
                        {formatAmount(item.reste || 0)} GNF
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.type === 'vente' ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'payé'    ? 'bg-green-100 text-green-700' :
                          item.status === 'partiel' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          reçu
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {item.recordedBy || item.paidBy || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}