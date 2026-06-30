import { useState, useEffect } from 'react';
import { getCapitalReport } from '../../api/reportAPI';
import { formatAmount } from '../../utils/formatAmount';
import toast from 'react-hot-toast';
import {
  FiTrendingUp, FiPackage, FiDollarSign, FiCreditCard,
  FiAlertTriangle, FiBarChart2, FiRefreshCw, FiInfo, FiTruck
} from 'react-icons/fi';
import useAutoRefresh from '../../hooks/useAutoRefresh';

interface CapitalData {
  capitalInitial:        number;
  chiffreAffairesEstime: number;
  stockFinal:            number;
  caisse:                number;
  banque:                number;
  credits:               number;
  avaries:               number;
  totalDepenses:         number;
  paiementsFournisseursComptant: number;
  paiementsFournisseursVirement: number;
  totalPaiementsFournisseurs:    number;
  capitalDisponible:     number;
  details: {
    totalVentesComptant:   number;
    totalAcomptesInitiaux: number;
    totalClientPayments:   number;
    valeurVentesAchat:     number;
    nbProduits:            number;
    nbClients:             number;
  };
}

export default function Capital() {
  const [data, setData]       = useState<CapitalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCapital = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await getCapitalReport();
      setData(res.data);
    } catch {
      toast.error('Erreur chargement du capital');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCapital(); }, []);
  useAutoRefresh(() => fetchCapital(), 30000);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const cards = [
    {
      label:   'Capital Initial',
      value:   data.capitalInitial,
      icon:    FiBarChart2,
      color:   'text-blue-700',
      bg:      'bg-blue-50',
      border:  'border-blue-200',
      tooltip: 'Valeur totale du stock au prix d\'achat'
    },
    {
      label:   'Chiffre d\'affaires estimé',
      value:   data.chiffreAffairesEstime,
      icon:    FiTrendingUp,
      color:   'text-green-700',
      bg:      'bg-green-50',
      border:  'border-green-200',
      tooltip: 'Valeur totale du stock au prix de vente'
    },
    {
      label:   'Stock actuel',
      value:   data.stockFinal,
      icon:    FiPackage,
      color:   'text-indigo-700',
      bg:      'bg-indigo-50',
      border:  'border-indigo-200',
      tooltip: 'Valeur actuelle du stock au prix d\'achat'
    },
    {
      label:   'Caisse',
      value:   data.caisse,
      icon:    FiDollarSign,
      color:   'text-yellow-700',
      bg:      'bg-yellow-50',
      border:  'border-yellow-200',
      tooltip: 'Ventes comptant + acomptes + paiements crédits - dépenses'
    },
    {
      label:   'Banque',
      value:   data.banque,
      icon:    FiDollarSign,
      color:   'text-cyan-700',
      bg:      'bg-cyan-50',
      border:  'border-cyan-200',
      tooltip: 'Total des ventes par virement bancaire'
    },
    {
      label:   'Crédits accordés',
      value:   data.credits,
      icon:    FiCreditCard,
      color:   'text-orange-700',
      bg:      'bg-orange-50',
      border:  'border-orange-200',
      tooltip: 'Total des dettes clients actives'
    },
    {
      label:   'Avaries & Pertes',
      value:   data.avaries,
      icon:    FiAlertTriangle,
      color:   'text-red-700',
      bg:      'bg-red-50',
      border:  'border-red-200',
      tooltip: 'Total des pertes estimées sur avaries'
    },
    {
      label:   'Dépenses',
      value:   data.totalDepenses,
      icon:    FiDollarSign,
      color:   'text-pink-700',
      bg:      'bg-pink-50',
      border:  'border-pink-200',
      tooltip: 'Total des dépenses engagées'
    },
  ];

  const totalVentes = data.caisse + data.banque + data.credits;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Vue financière globale de l'établissement</h1>
        </div>
        <button
          onClick={() => fetchCapital(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Avertissement si purchasePricePerCarton manquant */}
      {data.capitalInitial === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Prix d'achat manquants</p>
            <p className="text-yellow-700 text-sm mt-1">
              Le capital initial est à 0 car les produits n'ont pas encore de prix d'achat par carton renseigné.
              Modifiez chaque produit pour ajouter ce champ.
            </p>
          </div>
        </div>
      )}

      {/* Capital disponible — carte compacte */}
      <div className="bg-gradient-to-r from-[#1A2B5F] to-[#0f1a3a] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">CAPITAL DISPONIBLE</p>
            <p className="text-3xl font-extrabold text-[#D4A017]">
              {formatAmount(data.capitalDisponible)} GNF
            </p>
            <p className="text-white/40 text-xs mt-1">
              Stock final + Caisse + Banque + Crédits
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-white/50 text-[10px]">Caisse</p>
              <p className="text-white text-sm font-semibold">{formatAmount(data.caisse)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px]">Banque</p>
              <p className="text-white text-sm font-semibold">{formatAmount(data.banque)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px]">Stock</p>
              <p className="text-white text-sm font-semibold">{formatAmount(data.stockFinal)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px]">Crédits</p>
              <p className="text-white text-sm font-semibold">{formatAmount(data.credits)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes indicateurs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, border, tooltip }) => (
          <div key={label} className={`bg-white rounded-xl p-4 shadow-sm border ${border} relative group`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`${bg} rounded-lg p-2.5`}>
                <Icon className={color} size={20} />
              </div>
              {/* Tooltip */}
              <div className="relative">
                <FiInfo size={14} className="text-gray-300 cursor-help" />
                <div className="absolute right-0 top-5 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  {tooltip}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{formatAmount(value)} GNF</p>
          </div>
        ))}
      </div>

      {/* Paiements fournisseurs */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
          <FiTruck className="text-orange-600" size={16} /> Paiements fournisseurs
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Par caisse</p>
            <p className="font-bold text-yellow-700">{formatAmount(data.paiementsFournisseursComptant)} GNF</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Par banque</p>
            <p className="font-bold text-cyan-700">{formatAmount(data.paiementsFournisseursVirement)} GNF</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="font-bold text-orange-700">{formatAmount(data.totalPaiementsFournisseurs)} GNF</p>
          </div>
        </div>
      </div>

      {/* Détails supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Détail caisse */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-blue-900 mb-4">Détail de la caisse</h3>
          <div className="space-y-3">
            {[
              { label: 'Ventes comptant',                 value: data.details.totalVentesComptant  },
              { label: 'Acomptes sur crédits',             value: data.details.totalAcomptesInitiaux },
              { label: 'Paiements de dettes',              value: data.details.totalClientPayments  },
              { label: 'Dépenses (déduites)',              value: -data.totalDepenses, negative: true },
              { label: 'Paiements fournisseurs (Caisse)',  value: -data.paiementsFournisseursComptant, negative: true },
            ].map(({ label, value, negative }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${negative ? 'text-red-600' : 'text-green-600'}`}>
                  {negative ? '−' : '+'} {formatAmount(Math.abs(value))} GNF
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-blue-900">Total caisse</span>
              <span className="text-sm font-bold text-blue-900">{formatAmount(data.caisse)} GNF</span>
            </div>
          </div>
        </div>

        {/* Infos générales */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-blue-900 mb-4">Informations générales</h3>
          <div className="space-y-3">
            {[
              { label: 'Nombre de produits actifs',   value: `${data.details.nbProduits} produits`  },
              { label: 'Valeur ventes (prix achat)',  value: `${formatAmount(data.details.valeurVentesAchat)} GNF` },
              { label: 'Clients avec dettes actives', value: `${data.details.nbClients} clients`    },
              { label: 'Bénéfice après ventes',       value: `${formatAmount(totalVentes - data.details.valeurVentesAchat)} GNF` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-blue-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}