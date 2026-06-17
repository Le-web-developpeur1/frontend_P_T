import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, toggleUserStatus, deleteUser   } from '../../api/authAPI'; 
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiPower, FiTrash2, FiAlertTriangle  } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestionnaire' | 'caissier';
  isActive: boolean;
  createdAt: string;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'caissier' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);



  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch { toast.error('Erreur chargement utilisateurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useAutoRefresh(fetchUsers, 30000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (u: User) => { 
    setSelected(u); 
    setForm({ name: u.name, email: u.email, role: u.role, password: '' }); 
    setModalOpen(true); 
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) { toast.error('Nom et email obligatoires'); return; }
    if (!selected && !form.password) { toast.error('Mot de passe obligatoire'); return; }
    setSaving(true);
    try {
      selected
        ? await updateUser(selected._id, form)
        : await createUser(form);
      toast.success(selected ? 'Utilisateur mis à jour !' : 'Utilisateur créé !');
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Erreur'); 
    }
    finally { setSaving(false); }
  };

  const handleToggle = async (user: User) => {
    try {
      await toggleUserStatus(user._id);
      toast.success(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'} !`);
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const openDelete = (u: any) => {
    setUserToDelete(u);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteUser(userToDelete._id);
      toast.success('Utilisateur supprimé !');
      setDeleteModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };
  const roleLabel: Record<User['role'], string> = { 
    admin: 'Administrateur', 
    gestionnaire: 'Gestionnaire', 
    caissier: 'Caissier' 
  };
  
  const roleVariant: Record<User['role'], string> = { 
    admin: 'danger', 
    gestionnaire: 'warning', 
    caissier: 'info' 
  };

  const columns = [
    { header: 'Utilisateur', render: (u: User) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A2B5F] flex items-center justify-center text-[#D4A017] font-bold text-sm flex-shrink-0">
          {u.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
          <p className="text-xs text-gray-400">{u.email}</p>
        </div>
      </div>
    )},
    { header: 'Rôle', render: (u: User) => (
      <Badge label={roleLabel[u.role] || u.role} variant={roleVariant[u.role] || 'default'} />
    )},
    { header: 'Statut', render: (u: User) => (
      <Badge label={u.isActive ? 'Actif' : 'Inactif'} variant={u.isActive ? 'success' : 'danger'} />
    )},
    { header: 'Créé le', render: (u: User) => (
      <span className="text-xs text-gray-500">
        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
      </span>
    )},
    { header: 'Actions', render: (u: User) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(u)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => handleToggle(u)}
          className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
          title={u.isActive ? 'Désactiver' : 'Activer'}>
          <FiPower size={15} />
        </button>
        <button onClick={() => openDelete(u)}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Supprimer définitivement">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{users.length} utilisateur(s)</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <FiPlus size={18} /> Nouvel utilisateur
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={users} loading={loading} emptyMessage="Aucun utilisateur" />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}>
        <div className="space-y-4">
          <Input label="Nom complet" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          {!selected && (
            <Input label="Mot de passe" name="password" type="password" value={form.password} onChange={handleChange} required />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rôle</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="caissier">Caissier</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer la suppression" size="sm">
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-red-700">
              <p className="font-semibold">Cette action est irréversible !</p>
              <p className="mt-1">
                Le compte de <strong>{userToDelete?.name}</strong> sera supprimé définitivement.
              </p>
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
    </div>
  );
}