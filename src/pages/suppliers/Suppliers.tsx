import { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, recordSupplierPayment, recordPurchase, getSupplierHistory } from '../../api/supplierAPI';
import { formatAmount, formatDate } from '../../utils/formatAmount';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiShoppingBag, FiEye, FiX } from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface SupplierForm {
  name: string;
  phone: string;
  address: string;
}

interface Supplier extends SupplierForm {
  _id: string;
  totalPurchases: number;
  totalPaid: number;
  balance: number;
}

interface PurchaseItem {
  libelle: string;
  quantiteCartons: number;
  prixUnitaire: number;
}

const emptyForm: SupplierForm = { name: '', phone: '', address: '' };
const emptyItem: PurchaseItem = { libelle: '', quantiteCartons: 0, prixUnitaire: 0 };

export default function Suppliers() {
  const [suppliers, setSuppliers]         = useState<Supplier[]>([]);
  const [loading, setLoading]             = useState<boolean>(true);
  const [modalOpen, setModalOpen]         = useState<boolean>(false);
  const [payModal, setPayModal]           = useState<boolean>(false);
  const [purchaseModal, setPurchaseModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal]     = useState<boolean>(false);
  const [detailModal, setDetailModal]     = useState<boolean>(false);
  const [selected, setSelected]           = useState<Supplier | null>(null);
  const [form, setForm]                   = useState<SupplierForm>(emptyForm);
  const [items, setItems]                 = useState<PurchaseItem[]>([{ ...emptyItem }]);
  const [montantPaye, setMontantPaye]     = useState<number>(0);
  const [modePaiement, setModePaiement]   = useState<string>('comptant');
  const [amount, setAmount]               = useState<string>('');
  const [note, setNote]                   = useState<string>('');
  const [saving, setSaving]               = useState<boolean>(false);
  const [search, setSearch]               = useState<string>('');
  const [supplierDetail, setSupplierDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading]   = useState<boolean>(false);
  const [modePaiementVersement, setModePaiementVersement] = useState<string>('comptant');

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch { toast.error('Erreur chargement fournisseurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);
  useAutoRefresh(fetchSuppliers, 30000);

  // Calcul du montant total de tous les articles
  const montantTotal = items.reduce((sum, item) =>
    sum + (Number(item.quantiteCartons) * Number(item.prixUnitaire)), 0
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: field === 'libelle' ? value : Number(value) };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);

  const removeItem = (index: number) => {
    if (items.length === 1) { toast.error('Au moins un article requis'); return; }
    setItems(items.filter((_, i) => i !== index));
  };

  const openCreate   = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit     = (s: Supplier) => { setSelected(s); setForm({ ...s }); setModalOpen(true); };
  const openPay      = (s: Supplier) => { setSelected(s); setAmount(''); setNote(''); setPayModal(true); setModePaiementVersement('comptant') };
  const openDelete   = (s: Supplier) => { setSelected(s); setDeleteModal(true); };

  const openPurchase = (s: Supplier) => {
    setSelected(s);
    setItems([{ ...emptyItem }]);
    setMontantPaye(0);
    setModePaiement('comptant');
    setPurchaseModal(true);
  };

  const openDetail = async (s: Supplier) => {
    setSelected(s);
    setSupplierDetail(null);
    setDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await getSupplierHistory(s._id);
      setSupplierDetail(res.data);
    } catch { toast.error('Erreur chargement détails'); }
    finally { setDetailLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      selected ? await updateSupplier(selected._id, form) : await createSupplier(form);
      toast.success(selected ? 'Fournisseur mis à jour !' : 'Fournisseur créé !');
      setModalOpen(false);
      fetchSuppliers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePayment = async () => {
    if (!selected) return;
    if (!amount || Number(amount) <= 0) { toast.error('Montant invalide'); return; }
    if (Number(amount) > selected.balance) {
      toast.error(`Le montant ne peut pas dépasser ${formatAmount(selected.balance)} GNF`);
      return;
    }
    setSaving(true);
    try {
      await recordSupplierPayment(selected._id, { 
        amount:        Number(amount), 
        note,
        modePaiement:  modePaiementVersement
      });
      toast.success('Versement enregistré !');
      setPayModal(false);
      fetchSuppliers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handlePurchase = async () => {
    if (!selected) return;
    // Validation articles
    for (const item of items) {
      if (!item.libelle) { toast.error('Renseignez le libellé de chaque article'); return; }
      if (!item.prixUnitaire || item.prixUnitaire <= 0) { toast.error('Prix unitaire invalide'); return; }
    }
    if (montantTotal <= 0) { toast.error('Montant total invalide'); return; }
    // Validation paiement
    if (montantPaye > montantTotal) {
      toast.error(`Le montant payé ne peut pas dépasser ${formatAmount(montantTotal)} GNF`);
      return;
    }
    if (montantPaye > 0 && !modePaiement) {
      toast.error('Choisissez un mode de paiement');
      return;
    }
    setSaving(true);
    try {
      await recordPurchase(selected._id, { items, montantPaye, modePaiement });
      toast.success('Achat enregistré !');
      setPurchaseModal(false);
      fetchSuppliers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteSupplier(selected._id);
      toast.success('Fournisseur désactivé !');
      setDeleteModal(false);
      fetchSuppliers();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = suppliers.filter((s: Supplier) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  const columns = [
    { header: 'Fournisseur', render: (s: Supplier) => (
      <div>
        <p className="font-semibold text-gray-800">{s.name}</p>
        <p className="text-xs text-gray-400">{s.phone}</p>
      </div>
    )},
    { header: 'Adresse',      key: 'address' },
    { header: 'Total achats', render: (s: Supplier) => <span>{formatAmount(s.totalPurchases)} GNF</span> },
    { header: 'Total payé',   render: (s: Supplier) => <span className="text-green-600">{formatAmount(s.totalPaid)} GNF</span> },
    { header: 'Solde restant', render: (s: Supplier) => (
      <span className={`font-semibold ${s.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatAmount(s.balance)} GNF
      </span>
    )},
    { header: 'Actions', render: (s: Supplier) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openDetail(s)}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Détails">
          <FiEye size={15} />
        </button>
        <button onClick={() => openPurchase(s)}
          className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors" title="Enregistrer achat">
          <FiShoppingBag size={15} />
        </button>
        <button onClick={() => openPay(s)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Enregistrer versement">
          <FiDollarSign size={15} />
        </button>
        <button onClick={() => openEdit(s)}
          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Modifier">
          <FiEdit2 size={15} />
        </button>
        <button onClick={() => openDelete(s)}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Supprimer">
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

      {/* ── Modal Créer/Modifier ─────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}>
        <div className="space-y-4">
          <Input label="Nom"       name="name"    value={form.name}    onChange={handleChange} required />
          <Input label="Téléphone" name="phone"   value={form.phone}   onChange={handleChange} />
          <Input label="Adresse"   name="address" value={form.address} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"   onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {selected ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* ── Modal Achat multi-articles ───────────────── */}
      <Modal isOpen={purchaseModal} onClose={() => setPurchaseModal(false)}
        title={`Enregistrer un achat — ${selected?.name}`} size="xl">
        <div className="space-y-5">

          {/* Liste des articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-blue-900">Articles achetés</p>
              <button onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                <FiPlus size={13} /> Ajouter un article
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Article {index + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)}
                        className="p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <Input label="Libellé / Description *"
                        value={item.libelle}
                        onChange={(e) => handleItemChange(index, 'libelle', e.target.value)}
                        placeholder="Ex: Maquereau congelé..." />
                    </div>
                    <Input label="Quantité (cartons)" type="number"
                      value={item.quantiteCartons}
                      onChange={(e) => handleItemChange(index, 'quantiteCartons', e.target.value)} />
                    <Input label="Prix unitaire (GNF)" type="number"
                      value={item.prixUnitaire}
                      onChange={(e) => handleItemChange(index, 'prixUnitaire', e.target.value)} />
                    <div className="flex flex-col justify-end pb-1">
                      <p className="text-xs text-gray-500 mb-1">Sous-total</p>
                      <p className="font-bold text-blue-900">
                        {formatAmount(item.quantiteCartons * item.prixUnitaire)} GNF
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Montant total */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Montant total de l'achat :</span>
            <span className="text-xl font-bold text-blue-900">{formatAmount(montantTotal)} GNF</span>
          </div>

          {/* Paiement */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-900">Paiement</p>

            {/* Mode de paiement */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mode de paiement</label>
              <div className="flex gap-2">
                {[
                  { value: 'comptant', label: 'Comptant (Caisse)' },
                  { value: 'virement', label: 'Virement (Banque)' },
                ].map(({ value, label }) => (
                  <button key={value}
                    onClick={() => setModePaiement(value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                      modePaiement === value
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant payé */}
            <div className="space-y-2">
              <Input label="Montant payé maintenant (GNF)" type="number"
                value={montantPaye}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > montantTotal) {
                    toast.error(`Maximum : ${formatAmount(montantTotal)} GNF`);
                    setMontantPaye(montantTotal);
                  } else {
                    setMontantPaye(val);
                  }
                }} />
              <div className="flex gap-2">
                <button onClick={() => setMontantPaye(montantTotal)}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors">
                  Payer tout ({formatAmount(montantTotal)} GNF)
                </button>
                <button onClick={() => setMontantPaye(0)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                  Ne rien payer
                </button>
              </div>
            </div>

            {/* Résumé paiement */}
            {montantTotal > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant total :</span>
                  <span className="font-semibold">{formatAmount(montantTotal)} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Payé {modePaiement === 'virement' ? '(Banque)' : '(Caisse)'} :
                  </span>
                  <span className="font-semibold text-green-600">{formatAmount(montantPaye)} GNF</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="text-gray-500 font-semibold">Reste dû au fournisseur :</span>
                  <span className={`font-bold ${montantTotal - montantPaye > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatAmount(Math.max(0, montantTotal - montantPaye))} GNF
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"     onClick={() => setPurchaseModal(false)}>Annuler</Button>
          <Button variant="secondary" onClick={handlePurchase} loading={saving}>
            Confirmer l'achat
          </Button>
        </div>
      </Modal>

      {/* ── Modal Versement ──────────────────────────── */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)}
        title={`Versement — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-gray-600">
              Solde restant : <strong className="text-red-600">{formatAmount(selected?.balance || 0)} GNF</strong>
            </p>
          </div>

          {/* Mode de paiement */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Mode de paiement</label>
            <div className="flex gap-2">
              {[
                { value: 'comptant', label: 'Comptant (Caisse)' },
                { value: 'virement', label: 'Virement (Banque)' },
              ].map(({ value, label }) => (
                <button key={value}
                  onClick={() => setModePaiementVersement(value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                    modePaiementVersement === value
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant avec validation */}
          <div className="space-y-1">
            <Input label="Montant versé (GNF)" type="number" value={amount}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > (selected?.balance || 0)) {
                  toast.error(`Maximum : ${formatAmount(selected?.balance || 0)} GNF`);
                  setAmount(String(selected?.balance || 0));
                } else {
                  setAmount(e.target.value);
                }
              }}
              placeholder="0" />
            <button
              onClick={() => setAmount(String(selected?.balance || 0))}
              className="text-xs text-blue-600 hover:underline">
              Payer tout ({formatAmount(selected?.balance || 0)} GNF)
            </button>
          </div>

          <Input label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"   onClick={() => setPayModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handlePayment} loading={saving}>Confirmer</Button>
        </div>
      </Modal>

      {/* ── Modal Détail fournisseur ─────────────────── */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)}
        title={`Détail — ${selected?.name}`} size="xl">
        {detailLoading || !supplierDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total achats',  value: formatAmount(supplierDetail.supplier.totalPurchases) + ' GNF', color: 'text-blue-900'  },
                { label: 'Total payé',    value: formatAmount(supplierDetail.supplier.totalPaid)      + ' GNF', color: 'text-green-600' },
                { label: 'Solde restant', value: formatAmount(supplierDetail.supplier.balance)        + ' GNF',
                  color: supplierDetail.supplier.balance > 0 ? 'text-red-600' : 'text-green-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`font-bold text-sm ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tableau achats */}
            <p className="text-sm font-semibold text-blue-900">
              Historique des achats ({supplierDetail.purchases.length})
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white text-xs">
                  <tr>
                    {['Date', 'Articles', 'Total', 'Payé', 'Mode', 'Reste', 'Statut'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplierDetail.purchases.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun achat enregistré</td></tr>
                  ) : supplierDetail.purchases.map((p: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-0.5">
                          {p.items.map((item: any, j: number) => (
                            <p key={j} className="text-xs text-gray-600">
                              {item.libelle} ({item.quantiteCartons} crt × {formatAmount(item.prixUnitaire)} GNF)
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{formatAmount(p.montantTotal)} GNF</td>
                      <td className="px-3 py-2.5 text-green-600 whitespace-nowrap">{formatAmount(p.montantPaye)} GNF</td>
                      <td className="px-3 py-2.5">
                        {p.modePaiement === 'comptant' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">Comptant</span>
                        ) : p.modePaiement === 'virement' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">Virement</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 font-semibold">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-red-600 font-semibold whitespace-nowrap">{formatAmount(p.montantRestant)} GNF</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          label={p.statut === 'payé' ? 'Payé' : p.statut === 'partiel' ? 'Partiel' : 'Impayé'}
                          variant={p.statut === 'payé' ? 'success' : p.statut === 'partiel' ? 'warning' : 'danger'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Supprimer ──────────────────────────── */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirmer" size="sm">
        <p className="text-gray-600">Désactiver <strong>{selected?.name}</strong> ?</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost"  onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}