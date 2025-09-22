import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2,
  User,
  CreditCard,
  Search,
  Filter
} from 'lucide-react';

interface CaissierActivity {
  id: number;
  caissier_id: number;
  caissier_nom: string;
  caissier_prenom: string;
  action: 'login' | 'logout' | 'paiement_cree' | 'paiement_modifie' | 'paiement_supprime';
  description: string;
  date_action: string;
  ip_address?: string;
  montant?: number;
  paiement_id?: number;
}

interface DemandeSuppression {
  id: number;
  paiement_id: number;
  demandeur_id: number;
  demandeur_nom: string;
  demandeur_prenom: string;
  demandeur_role: string;
  justification: string;
  statut: 'en_attente' | 'approuve' | 'refuse';
  date_demande: string;
  date_traitement?: string;
  traite_par?: number;
  paiement: {
    id: number;
    nom: string;
    prenom: string;
    montant: number;
    mode_paiement: string;
    numero_police: string;
    date_creation: string;
  };
}

interface CaissierStats {
  caissier_id: number;
  nom: string;
  prenom: string;
  total_paiements: number;
  montant_total: number;
  derniere_activite: string;
  status: 'actif' | 'inactif';
}

const SuperAdmin: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<CaissierActivity[]>([]);
  const [demandesSuppressions, setDemandesSuppressions] = useState<DemandeSuppression[]>([]);
  const [caissierStats, setCaissierStats] = useState<CaissierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCaissier, setSelectedCaissier] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('tous');

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedCaissier, actionFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchActivities(),
        fetchDemandesSuppressions(),
        fetchCaissierStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const params = {
        date: selectedDate,
        caissier_id: selectedCaissier,
        action: actionFilter !== 'tous' ? actionFilter : undefined
      };
      const response = await apiService.getCaissierActivities(params);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setActivities([]);
    }
  };

  const fetchDemandesSuppressions = async () => {
    try {
      const response = await apiService.getDemandesSuppressions();
      setDemandesSuppressions(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      setDemandesSuppressions([]);
    }
  };

  const fetchCaissierStats = async () => {
    try {
      const response = await apiService.getCaissierStats();
      setCaissierStats(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setCaissierStats([]);
    }
  };

  const handleApprouverSuppression = async (demandeId: number) => {
    try {
      await apiService.traiterDemandeSuppression(demandeId, 'approuve');
      await fetchDemandesSuppressions();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
    }
  };

  const handleRefuserSuppression = async (demandeId: number) => {
    try {
      await apiService.traiterDemandeSuppression(demandeId, 'refuse');
      await fetchDemandesSuppressions();
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'logout':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'paiement_cree':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'paiement_modifie':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'paiement_supprime':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'approuve':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvé
          </span>
        );
      case 'refuse':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sunu-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sunu-red font-title">
          Super Administrateur
        </h1>
        <p className="mt-2 text-sunu-gray-dark font-body">
          Supervision des caissiers et gestion des demandes de suppression
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'activities', label: 'Activités Caissiers', icon: <Activity className="h-5 w-5" /> },
            { id: 'suppression', label: 'Demandes de Suppression', icon: <AlertTriangle className="h-5 w-5" /> },
            { id: 'stats', label: 'Statistiques', icon: <Users className="h-5 w-5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors font-body ${
                activeTab === tab.id
                  ? 'bg-sunu-red text-white'
                  : 'text-sunu-gray-dark hover:text-sunu-red'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Onglet Activités */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sunu-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caissier</label>
                <select
                  value={selectedCaissier || ''}
                  onChange={(e) => setSelectedCaissier(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sunu-red"
                >
                  <option value="">Tous les caissiers</option>
                  {caissierStats.map(caissier => (
                    <option key={caissier.caissier_id} value={caissier.caissier_id}>
                      {caissier.prenom} {caissier.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sunu-red"
                >
                  <option value="tous">Toutes les actions</option>
                  <option value="login">Connexions</option>
                  <option value="logout">Déconnexions</option>
                  <option value="paiement_cree">Paiements créés</option>
                  <option value="paiement_modifie">Paiements modifiés</option>
                  <option value="paiement_supprime">Paiements supprimés</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchData}
                  className="w-full bg-sunu-red text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  <Filter className="h-4 w-4 inline mr-2" />
                  Filtrer
                </button>
              </div>
            </div>
          </div>

          {/* Liste des activités */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Activités des Caissiers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caissier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activity.caissier_prenom} {activity.caissier_nom}
                            </div>
                            {activity.ip_address && (
                              <div className="text-sm text-gray-500">IP: {activity.ip_address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(activity.action)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {activity.action.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{activity.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.date_action).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.montant ? formatCurrency(activity.montant) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Demandes de Suppression */}
      {activeTab === 'suppression' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Demandes de Suppression en Attente</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Demandeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandesSuppressions.map((demande) => (
                    <tr key={demande.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {demande.demandeur_prenom} {demande.demandeur_nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {demande.demandeur_role} - {new Date(demande.date_demande).toLocaleString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {demande.paiement.prenom} {demande.paiement.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(demande.paiement.montant)} - {demande.paiement.numero_police}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {demande.justification}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatutBadge(demande.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {demande.statut === 'en_attente' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprouverSuppression(demande.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Approuver
                            </button>
                            <button
                              onClick={() => handleRefuserSuppression(demande.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="h-4 w-4 inline mr-1" />
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Statistiques */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caissierStats.map((caissier) => (
              <div key={caissier.caissier_id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-sunu-red mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {caissier.prenom} {caissier.nom}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        caissier.status === 'actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {caissier.status === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total paiements:</span>
                    <span className="text-sm font-medium text-gray-900">{caissier.total_paiements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Montant total:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(caissier.montant_total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Dernière activité:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(caissier.derniere_activite).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;