import { useState, useEffect } from 'react';
import {
  getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  paySalary, getSalaryStats, downloadSalarySlip, giveAdvance, getAdvances
} from '../../api/employeeApi';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiEye,
  FiUsers, FiAlertTriangle, FiCheckCircle, FiDownload, FiClock
} from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface EmployeeForm {
  name: string;
  phone: string;
  position: string;
  salaryType: string;
  monthlySalary: number;
  dailyRate: number;
  notes: string;
}

const emptyForm: EmployeeForm = {
  name: '', phone: '', position: '', salaryType: 'mensuel',
  monthlySalary: 0, dailyRate: 0, notes: ''
};

export default function Employees() {
  const [employees, setEmployees]           = useState<any[]>([]);
  const [stats, setStats]                   = useState<any>(null);
  const [loading, setLoading]               = useState<boolean>(true);
  const [modalOpen, setModalOpen]           = useState<boolean>(false);
  const [payModal, setPayModal]             = useState<boolean>(false);
  const [detailModal, setDetailModal]       = useState<boolean>(false);
  const [deleteModal, setDeleteModal]       = useState<boolean>(false);
  const [advanceModal, setAdvanceModal]     = useState<boolean>(false); // ← nouveau
  const [selected, setSelected]             = useState<any>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any>(null);
  const [form, setForm]                     = useState<EmployeeForm>(emptyForm);
  const [saving, setSaving]                 = useState<boolean>(false);
  const [downloading, setDownloading]       = useState<string | null>(null);
  // ── Nouveaux states pour avances ──────────────────
  const [advances, setAdvances]             = useState<any[]>([]);
  const [totalAvances, setTotalAvances]     = useState<number>(0);
  const [savingAdvance, setSavingAdvance]   = useState<boolean>(false);
  const [advanceForm, setAdvanceForm]       = useState({ amount: 0, reason: '' });
  const [detailTab, setDetailTab]           = useState<'paiements' | 'avances'>('paiements');

  const [payForm, setPayForm] = useState({
    amount: 0, period: '', daysWorked: 0, note: ''
  });

  const fetchAll = async () => {
    try {
      const [e, s] = await Promise.all([getEmployees(), getSalaryStats()]);
      setEmployees(e.data);
      setStats(s.data);
    } catch { toast.error('Erreur chargement employés'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll, 30000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit   = (emp: any) => { setSelected(emp); setForm({ ...emp }); setModalOpen(true); };

  const openPay = (emp: any) => {
    setSelected(emp);
    const now = new Date();
    const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    setPayForm({
      amount:     emp.salaryType === 'mensuel' ? emp.monthlySalary : 0,
      period:     emp.salaryType === 'mensuel' ? monthLabel : now.toLocaleDateString('fr-FR'),
      daysWorked: 0,
      note:       ''
    });
    setPayModal(true);
  };

  // ── Ouvre le modal historique (paiements + avances) ──
  const openDetail = async (emp: any) => {
    setSelected(emp);
    setEmployeeDetail(null);
    setDetailTab('paiements'); // ← reset sur onglet paiements
    setDetailModal(true);
    try {
      const [detailRes, advancesRes] = await Promise.all([
        getEmployee(emp._id),
        getAdvances(emp._id)
      ]);
      setEmployeeDetail(detailRes.data);
      setAdvances(advancesRes.data.advances);
      setTotalAvances(advancesRes.data.totalEnAttente);
    } catch { toast.error('Erreur chargement détails'); }
  };

  // ── Ouvre le modal avance ─────────────────────────────
  const openAdvance = (emp: any) => {
    setSelected(emp);
    setAdvanceForm({ amount: 0, reason: '' });
    setAdvanceModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.position) { toast.error('Nom et poste obligatoires'); return; }
    setSaving(true);
    try {
      selected ? await updateEmployee(selected._id, form) : await createEmployee(form);
      toast.success(selected ? 'Employé mis à jour !' : 'Employé créé !');
      setModalOpen(false);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePaySubmit = async () => {
    if (!payForm.amount || payForm.amount <= 0) { toast.error('Montant invalide'); return; }
    if (!payForm.period) { toast.error('Période obligatoire'); return; }
    setSaving(true);
    try {
      const res = await paySalary(selected._id, payForm);
      const { montantBrut, totalAvances: avDed, montantNet } = res.data;
      if (avDed > 0) {
        toast.success(`Salaire payé ! Brut: ${formatAmount(montantBrut)} − Avances: ${formatAmount(avDed)} = Net: ${formatAmount(montantNet)} GNF`);
      } else {
        toast.success('Salaire payé avec succès !');
      }
      setPayModal(false);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteEmployee(selected._id);
      toast.success('Employé désactivé !');
      setDeleteModal(false);
      fetchAll();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const handleAdvanceSubmit = async () => {
    if (!advanceForm.amount || advanceForm.amount <= 0) {
      toast.error('Montant invalide'); return;
    }
    setSavingAdvance(true);
    try {
      await giveAdvance(selected._id, advanceForm);
      toast.success('Avance enregistrée !');
      setAdvanceModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSavingAdvance(false); }
  };

  const handleDownloadSlip = async (paymentId: string, employeeName: string) => {
    setDownloading(paymentId);
    try {
      const res = await downloadSalarySlip(paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Bulletin-${employeeName}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Bulletin téléchargé !');
    } catch { toast.error('Erreur téléchargement'); }
    finally { setDownloading(null); }
  };

  const columns = [
    { header: 'Employé', render: (e: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A2B5F] flex items-center justify-center text-[#D4A017] font-bold text-sm flex-shrink-0">
          {e.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{e.name}</p>
          <p className="text-xs text-gray-400">{e.phone || '—'}</p>
        </div>
      </div>
    )},
    { header: 'Poste', render: (e: any) => <span className="text-sm">{e.position}</span> },
    { header: 'Type', render: (e: any) => (
      <Badge label={e.salaryType === 'mensuel' ? 'Mensuel' : 'Journalier'} variant="info" />
    )},
    { header: 'Salaire', render: (e: any) => (
      <span className="text-sm font-semibold">
        {e.salaryType === 'mensuel'
          ? `${formatAmount(e.monthlySalary)} GNF/mois`
          : `${formatAmount(e.dailyRate)} GNF/jour`}
      </span>
    )},
    { header: 'Ce mois', render: (e: any) => (
      <Badge
        label={e.paidThisMonth ? 'Payé' : 'Non payé'}
        variant={e.paidThisMonth ? 'success' : 'danger'}
      />
    )},
    { header: 'Actions', render: (e: any) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openDetail(e)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Historique">
          <FiEye size={15} />
        </button>
        <button onClick={() => openPay(e)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Payer salaire">
          <FiDollarSign size={15} />
        </button>
        <button onClick={() => openAdvance(e)}
          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Avance sur salaire">
          <FiClock size={15} />
        </button>
        <button onClick={() => openEdit(e)}
          className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors" title="Modifier">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => { setSelected(e); setDeleteModal(true); }}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Désactiver">
          <FiTrash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Salaires & Employés</h1>
          <p className="text-gray-500 text-sm">{employees.length} employé(s)</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <FiPlus size={18} /> Nouvel employé
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: FiUsers,         label: 'Total employés',     value: String(stats.totalEmployees),                    color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { icon: FiCheckCircle,   label: 'Payés ce mois',      value: String(stats.paidCount),                         color: 'text-green-600',  bg: 'bg-green-50'  },
            { icon: FiAlertTriangle, label: 'Non payés',          value: String(stats.unpaidCount),                       color: 'text-red-600',    bg: 'bg-red-50'    },
            { icon: FiDollarSign,    label: 'Total payé ce mois', value: `${formatAmount(stats.totalPaidThisMonth)} GNF`, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`${bg} rounded-lg p-2.5`}><Icon className={color} size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.unpaidEmployees?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="text-red-500" />
            <p className="font-semibold text-red-700 text-sm">Salaires non payés ce mois</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.unpaidEmployees.map((e: any) => (
              <span key={e._id} className="bg-white px-3 py-1 rounded-lg text-xs text-red-600 border border-red-200">
                {e.name} — {e.position}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={employees} loading={loading} emptyMessage="Aucun employé" />
      </div>

      {/* ── Modal Créer/Modifier ─────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? "Modifier l'employé" : 'Nouvel employé'} size="md">
        <div className="space-y-4">
          <Input label="Nom complet" name="name"     value={form.name}     onChange={handleChange} required />
          <Input label="Téléphone"   name="phone"    value={form.phone}    onChange={handleChange} />
          <Input label="Poste"       name="position" value={form.position} onChange={handleChange} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Type de salaire</label>
            <select name="salaryType" value={form.salaryType} onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900">
              <option value="mensuel">Mensuel fixe</option>
              <option value="journalier">Journalier</option>
            </select>
          </div>
          {form.salaryType === 'mensuel' ? (
            <Input label="Salaire mensuel (GNF)" name="monthlySalary" type="number" value={form.monthlySalary} onChange={handleChange} />
          ) : (
            <Input label="Taux journalier (GNF)" name="dailyRate"     type="number" value={form.dailyRate}     onChange={handleChange} />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-900 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"   onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* ── Modal Paiement salaire ───────────────────── */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)}
        title={`Payer le salaire — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-gray-500">Poste</p>
            <p className="font-semibold">{selected?.position}</p>
          </div>
          {totalAvances > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-700 font-semibold">
                ⚠️ {formatAmount(totalAvances)} GNF d'avances seront déduites automatiquement
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Net à payer estimé : {formatAmount(Math.max(0, payForm.amount - totalAvances))} GNF
              </p>
            </div>
          )}
          <Input label="Période" value={payForm.period}
            onChange={(e) => setPayForm({ ...payForm, period: e.target.value })}
            placeholder="Ex: Juin 2026" />
          {selected?.salaryType === 'journalier' && (
            <Input label="Jours travaillés" type="number" value={payForm.daysWorked}
              onChange={(e) => setPayForm({ ...payForm, daysWorked: Number(e.target.value) })} />
          )}
          <Input label="Montant brut (GNF)" type="number" value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
          <Input label="Note (optionnel)" value={payForm.note}
            onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"   onClick={() => setPayModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handlePaySubmit} loading={saving}>
            Confirmer le paiement
          </Button>
        </div>
      </Modal>

      {/* ── Modal Historique avec onglets ────────────── */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)}
        title={`Historique — ${selected?.name}`} size="lg">
        {!employeeDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Infos employé */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div><span className="text-gray-500">Poste :</span> <strong>{employeeDetail.employee.position}</strong></div>
              <div><span className="text-gray-500">Type :</span> <strong>{employeeDetail.employee.salaryType}</strong></div>
              <div><span className="text-gray-500">Téléphone :</span> <strong>{employeeDetail.employee.phone || '—'}</strong></div>
              <div><span className="text-gray-500">Embauché le :</span> <strong>{formatDate(employeeDetail.employee.hireDate)}</strong></div>
            </div>

            {/* Alerte avances en attente */}
            {totalAvances > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
                <FiAlertTriangle className="text-orange-500" size={16} />
                <p className="text-sm text-orange-700">
                  <strong>{formatAmount(totalAvances)} GNF</strong> d'avances en attente de déduction
                </p>
              </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2">
              <button onClick={() => setDetailTab('paiements')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  detailTab === 'paiements' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                Paiements ({employeeDetail.payments.length})
              </button>
              <button onClick={() => setDetailTab('avances')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  detailTab === 'avances' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                Avances ({advances.length})
              </button>
            </div>

            {/* Tableau Paiements */}
            {detailTab === 'paiements' && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-900 text-white text-xs">
                    <tr>
                      {['Période', 'Montant', 'Date', 'Action'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employeeDetail.payments.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun paiement</td></tr>
                    ) : employeeDetail.payments.map((p: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5">{p.period}</td>
                        <td className="px-3 py-2.5 font-semibold">{formatAmount(p.amount)} GNF</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(p.paymentDate)}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => handleDownloadSlip(p._id, employeeDetail.employee.name)}
                            disabled={downloading === p._id}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50">
                            <FiDownload size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tableau Avances */}
            {detailTab === 'avances' && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-purple-700 text-white text-xs">
                    <tr>
                      {['Date', 'Montant', 'Raison', 'Statut'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {advances.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucune avance enregistrée</td></tr>
                    ) : advances.map((a: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(a.createdAt)}</td>
                        <td className="px-3 py-2.5 font-semibold text-purple-700">{formatAmount(a.amount)} GNF</td>
                        <td className="px-3 py-2.5 text-gray-500">{a.reason || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            a.status === 'en_attente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {a.status === 'en_attente' ? 'En attente' : 'Déduit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal Avance ─────────────────────────────── */}
      <Modal isOpen={advanceModal} onClose={() => setAdvanceModal(false)}
        title={`Avance sur salaire — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm">
            <p className="text-gray-500">Poste</p>
            <p className="font-semibold text-purple-900">{selected?.position}</p>
          </div>
          <Input label="Montant de l'avance (GNF)" type="number" value={advanceForm.amount}
            onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })} />
          <Input label="Raison (optionnel)" value={advanceForm.reason}
            onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} />
          <p className="text-xs text-gray-500">
            💡 Cette avance sera automatiquement déduite du prochain paiement de salaire.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"   onClick={() => setAdvanceModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleAdvanceSubmit} loading={savingAdvance}>
            Confirmer l'avance
          </Button>
        </div>
      </Modal>

      {/* ── Modal Supprimer ──────────────────────────── */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Désactiver <strong>{selected?.name}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"  onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Désactiver</Button>
        </div>
      </Modal>

    </div>
  );
}