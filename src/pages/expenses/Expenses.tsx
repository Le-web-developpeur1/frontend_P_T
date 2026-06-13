import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../api/expenseAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface ExpenseForm {
  title: string;
  category: string;
  amount: string | number;
  date: string;
  note: string;
}

interface Expense extends ExpenseForm {
  _id: string;
  amount: number;
}

type CategoryColor = 'info' | 'warning' | 'success' | 'default';

const emptyForm: ExpenseForm = { title: '', category: 'autre', amount: '', date: '', note: '' };

const categoryColors: Record<string, CategoryColor> = {
  transport:   'info',
  loyer:       'warning',
  salaire:     'success',
  fourniture:  'default',
  entretien:   'info',
  autre:       'default',
};

export default function Expenses() {
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [modalOpen, setModalOpen]     = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]       = useState<Expense | null>(null);
  const [form, setForm]               = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving]           = useState<boolean>(false);
  const [search, setSearch]           = useState<string>('');
  const [total, setTotal]             = useState<number>(0);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data);
      setTotal(res.data.reduce((sum: number, e: Expense) => sum + e.amount, 0));
    } catch { toast.error('Erreur chargement dépenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);
  useAutoRefresh(fetchExpenses, 60000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit   = (e: Expense) => { setSelected(e); setForm({ ...e, date: e.date?.split('T')[0] }); setModalOpen(true); };
  const openDelete = (e: Expense) => { setSelected(e); setDeleteModal(true); };

  const handleSubmit = async () => {
    if (!form.title || !form.amount) { toast.error('Titre et montant obligatoires'); return; }
    setSaving(true);
    try {
      selected ? await updateExpense(selected._id, form) : await createExpense(form);
      toast.success(selected ? 'Dépense mise à jour !' : 'Dépense créée !');
      setModalOpen(false);
      fetchExpenses();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteExpense(selected._id);
      toast.success('Dépense supprimée !');
      setDeleteModal(false);
      fetchExpenses();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = expenses.filter((e: Expense) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Libellé', render: (e: Expense) => (
      <div>
        <p className="font-semibold text-gray-800">{e.title}</p>
        {e.note && <p className="text-xs text-gray-400">{e.note}</p>}
      </div>
    )},
    { header: 'Catégorie', render: (e: Expense) => (
      <Badge label={e.category} variant={categoryColors[e.category] || 'default'} />
    )},
    { header: 'Montant', render: (e: Expense) => (
      <span className="font-semibold text-red-600">{formatAmount(e.amount)} GNF</span>
    )},
    { header: 'Date', render: (e: Expense) => <span>{formatDate(e.date)}</span> },
    { header: 'Actions', render: (e: Expense) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(e)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => openDelete(e)}
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
          <h1 className="text-2xl font-bold text-blue-900">Dépenses</h1>
          <p className="text-gray-500 text-sm">Total : <span className="font-bold text-red-600">{formatAmount(total)} GNF</span></p>
        </div>
        <Button onClick={openCreate} variant="primary"><FiPlus size={18} /> Nouvelle dépense</Button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input type="text" placeholder="Rechercher une dépense..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-900" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="Aucune dépense trouvée" />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier la dépense' : 'Nouvelle dépense'}>
        <div className="space-y-4">
          <Input label="Libellé" name="title" value={form.title} onChange={handleChange} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Catégorie</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="transport">Transport</option>
              <option value="loyer">Loyer</option>
              <option value="salaire">Salaire</option>
              <option value="fourniture">Fourniture</option>
              <option value="entretien">Entretien</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <Input label="Montant (GNF)" name="amount" type="number" value={form.amount} onChange={handleChange} required />
          <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
          <Input label="Note (optionnel)" name="note" value={form.note} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Supprimer <strong>{selected?.title}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}