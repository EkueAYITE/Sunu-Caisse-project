import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  DollarSign,
  Activity,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  Trash2,
  X,
  Filter
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalPaiements: number;
  montantTotal: number;
  paiementsAujourdhui: number;
  montantAujourdhui: number;
}

interface RecentPayment {
  id: number;
  nom: string;
  prenom: string;
  montant: number;
  date: string;
  mode_paiement: string;
}

interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  solde: number;
  derniere_transaction?: string;
}

interface DailyReport {
  date: string;
  total_credits: number;
  total_debits: number;
  total_transactions: number;
  solde_total: number;
  transactions_par_mode?: {
    tpe: number;
    espece: number;
    cheque: number;
  };
}

interface MonthlyReport {
  month: string;
  year: number;
  total_credits: number;
  total_debits: number;
  total_transactions: number;
  clients_actifs: number;
  transactions_par_mode?: {
    tpe: number;
    espece: number;
    cheque: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

type PaymentMode = 'tous' | 'tpe' | 'espece' | 'cheque';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalPaiements: 0,
    montantTotal: 0,
    paiementsAujourdhui: 0,
    montantAujourdhui: 0
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('tous');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchClients();
    fetchDailyReport();
    fetchMonthlyReport();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const fetchDashboardData = async () => {
    try {
      // Simuler des données pour la démo
      setStats({
        totalClients: 1247,
        totalPaiements: 3456,
        montantTotal: 12450000,
        paiementsAujourdhui: 23,
        montantAujourdhui: 345000
      });

      setRecentPayments([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          montant: 15000,
          date: '2024-01-15',
          mode_paiement: 'tpe'
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Marie',
          montant: 25000,
          date: '2024-01-15',
          mode_paiement: 'espece'
        }
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiService.getAllClients();
      setClients(response.data || []);
      setFilteredClients(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const response = await apiService.getDailyReport(selectedDate);
      setDailyReport(response.data || null);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport journalier:', error);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await apiService.getMonthlyReport(
        selectedMonth.toString(),
        selectedYear
      );
      setMonthlyReport(response.data || null);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport mensuel:', error);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
    setDeleteJustification('');
    setDeleteError('');
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deleteJustification.trim()) {
      setDeleteError('La justification est obligatoire');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await apiService.deleteClient(clientToDelete!.id, {
        justification: deleteJustification
      });

      setClients(clients.filter(c => c.id !== clientToDelete!.id));
      setDeleteSuccess(`Le client ${clientToDelete!.prenom} ${clientToDelete!.nom} a été supprimé avec succès.`);

      setTimeout(() => {
        setDeleteModalOpen(false);
        setDeleteSuccess('');
      }, 2000);
    } catch (error) {
      setDeleteError('Erreur lors de la suppression du client');
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
    setDeleteJustification('');
    setDeleteError('');
  };

  const getClientStatusColor = (solde: number) => {
    if (solde > 0) return 'text-green-600 bg-green-100';
    if (solde < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getClientStatusIcon = (solde: number) => {
    if (solde > 0) return <CheckCircle className="h-4 w-4" />;
    if (solde < 0) return <AlertTriangle className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch(mode) {
      case 'tpe': return 'TPE (Carte bancaire)';
      case 'espece': return 'Espèce';
      case 'cheque': return 'Chèque';
      default: return 'Tous les modes';
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sunu-red"></div>
        </div>
    );
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
      <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-xl ${color} text-white shadow-sunu`}>
            {icon}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-sunu-gray-dark font-body">{title}</p>
            <p className="text-2xl font-bold text-sunu-gray-dark font-mono">{value}</p>
            {subtitle && <p className="text-xs text-sunu-gray-dark font-body">{subtitle}</p>}
          </div>
        </div>
      </div>
  );

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sunu-red font-title">
            Tableau de Bord Administrateur
          </h1>
          <p className="mt-2 text-sunu-gray-dark font-body">
            Bonjour {user?.prenom} {user?.nom} - Vue d'ensemble des activités
          </p>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="h-5 w-5" /> },
              { id: 'clients', label: 'Gestion clients', icon: <Users className="h-5 w-5" /> },
              { id: 'payments', label: 'Paiements', icon: <CreditCard className="h-5 w-5" /> },
              { id: 'reports', label: 'Rapports', icon: <FileText className="h-5 w-5" /> }
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

        {activeTab === 'overview' && (
            <>
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Clients"
                    value={stats.totalClients.toLocaleString()}
                    icon={<Users className="h-6 w-6" />}
                    color="bg-sunu-red"
                />
                <StatCard
                    title="Paiements Total"
                    value={stats.totalPaiements.toLocaleString()}
                    icon={<CreditCard className="h-6 w-6" />}
                    color="bg-green-500"
                />
                <StatCard
                    title="Montant Total"
                    value={`${(stats.montantTotal / 1000000).toFixed(1)}M FCFA`}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Aujourd'hui"
                    value={`${stats.paiementsAujourdhui} paiements`}
                    icon={<Activity className="h-6 w-6" />}
                    color="bg-purple-500"
                    subtitle={`${stats.montantAujourdhui.toLocaleString()} FCFA`}
                />
              </div>

              {/* Graphiques et activités récentes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
                  <h3 className="text-lg font-semibold text-sunu-gray-dark mb-4 font-title">
                    Activités Récentes
                  </h3>
                  <div className="space-y-4">
                    {recentPayments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-sunu-gray-light rounded-lg">
                          <div className="flex items-center">
                            <CreditCard className="h-8 w-8 text-sunu-red mr-3" />
                            <div>
                              <p className="font-medium text-sunu-gray-dark font-body">
                                {payment.prenom} {payment.nom}
                              </p>
                              <p className="text-sm text-gray-500 font-body">{payment.mode_paiement}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sunu-red font-mono">{payment.montant.toLocaleString()} FCFA</p>
                            <p className="text-xs text-gray-500 font-body">{payment.date}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
                  <h3 className="text-lg font-semibold text-sunu-gray-dark mb-4 font-title">
                    Tendances Mensuelles
                  </h3>
                  <div className="h-64 flex items-center justify-center text-sunu-gray-dark font-body">
                    <TrendingUp className="h-16 w-16 text-sunu-red mb-4" />
                    <p>Graphique des tendances à venir</p>
                  </div>
                </div>
              </div>
            </>
        )}

        {activeTab === 'clients' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="text-lg font-medium text-sunu-gray-dark font-title">Liste des clients</h2>

                  {/* Barre de recherche */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        className="pl-10 pr-4 py-2 w-full border border-sunu-gray-neutral rounded-md focus:ring-sunu-red focus:border-sunu-red bg-white text-sunu-gray-dark font-body"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <span className="text-sm text-sunu-gray-dark font-body">
                    {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sunu-gray-neutral">
                  <thead className="bg-sunu-gray-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                      Solde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                      Dernière Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sunu-gray-neutral">
                  {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                          <tr key={client.id} className="hover:bg-sunu-gray-light">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-sunu-red flex items-center justify-center">
                                  <span className="text-white font-medium font-body">
                                    {client.prenom.charAt(0)}{client.nom.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-sunu-gray-dark font-body">
                                    {client.prenom} {client.nom}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-body">
                              {client.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClientStatusColor(client.solde)}`}>
                              {getClientStatusIcon(client.solde)}
                              <span className="ml-1 font-mono">{client.solde.toFixed(0)} FCFA</span>
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-body">
                              {client.derniere_transaction ? new Date(client.derniere_transaction).toLocaleDateString('fr-FR') : 'Aucune'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                  onClick={() => handleDeleteClick(client)}
                                  className="text-red-600 hover:text-red-900 flex items-center font-body"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                              </button>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 font-body">
                          Aucun client trouvé
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
              <h3 className="text-lg font-semibold text-sunu-gray-dark mb-4 font-title">
                Gestion des Paiements
              </h3>
              <p className="text-sunu-gray-dark font-body">
                Interface de gestion des paiements à implémenter.
              </p>
            </div>
        )}

        {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Filtre par mode de paiement */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center">
                    <Filter className="h-5 w-5 text-sunu-red mr-2" />
                    <span className="text-sunu-gray-dark font-body">Filtrer par mode de paiement:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['tous', 'tpe', 'espece', 'cheque'] as PaymentMode[]).map((mode) => (
                        <button
                            key={mode}
                            className={`px-3 py-1 rounded-full text-sm font-body ${
                                selectedPaymentMode === mode
                                    ? 'bg-sunu-red text-white'
                                    : 'bg-sunu-gray-light text-sunu-gray-dark hover:bg-sunu-gray-neutral'
                            }`}
                            onClick={() => setSelectedPaymentMode(mode)}
                        >
                          {getPaymentModeLabel(mode)}
                        </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rapport journalier */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-sunu-gray-dark font-title">Rapport journalier</h2>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-sunu-red" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-sunu-gray-neutral rounded px-3 py-1 bg-white text-sunu-gray-dark font-body"
                    />
                  </div>
                </div>

                {dailyReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-sunu-gray-light rounded-lg p-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-sunu-gray-dark font-body">Crédits</p>
                            <p className="text-2xl font-bold text-green-600 font-mono">
                              {dailyReport.total_credits.toFixed(0)} FCFA
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-sunu-gray-light rounded-lg p-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-8 w-8 text-red-600 mr-3 transform rotate-180" />
                          <div>
                            <p className="text-sm font-medium text-sunu-gray-dark font-body">Débits</p>
                            <p className="text-2xl font-bold text-red-600 font-mono">
                              {dailyReport.total_debits.toFixed(0)} FCFA
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-sunu-gray-light rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-sunu-red mr-3" />
                          <div>
                            <p className="text-sm font-medium text-sunu-gray-dark font-body">Transactions</p>
                            <p className="text-2xl font-bold text-sunu-red font-mono">
                              {dailyReport.total_transactions}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-sunu-gray-light rounded-lg p-4">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-sunu-red mr-3" />
                          <div>
                            <p className="text-sm font-medium text-sunu-gray-dark font-body">Solde Total</p>
                            <p className="text-2xl font-bold text-sunu-red font-mono">
                              {dailyReport.solde_total.toFixed(0)} FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-body">Aucune donnée disponible pour cette date</p>
                    </div>
                )}

                {/* Détail par mode de paiement pour le rapport journalier */}
                {dailyReport?.transactions_par_mode && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-sunu-gray-dark mb-4 font-title">
                        Répartition par mode de paiement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 font-body">TPE</p>
                              <p className="text-xl font-bold text-blue-600 font-mono">
                                {dailyReport.transactions_par_mode.tpe || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-green-800 font-body">Espèce</p>
                              <p className="text-xl font-bold text-green-600 font-mono">
                                {dailyReport.transactions_par_mode.espece || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 text-purple-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-purple-800 font-body">Chèque</p>
                              <p className="text-xl font-bold text-purple-600 font-mono">
                                {dailyReport.transactions_par_mode.cheque || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Rapport mensuel */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-sunu-gray-dark font-title">Rapport mensuel</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-sunu-red" />
                      <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="border border-sunu-gray-neutral rounded px-3 py-1 bg-white text-sunu-gray-dark font-body"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleDateString('fr-FR', { month: 'long' })}
                            </option>
                        ))}
                      </select>
                    </div>
                    <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="border border-sunu-gray-neutral rounded px-3 py-1 w-20 bg-white text-sunu-gray-dark font-body"
                        min="2020"
                        max="2030"
                    />
                  </div>
                </div>

                {monthlyReport ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <div className="bg-sunu-gray-light rounded-lg p-4">
                          <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-sunu-gray-dark font-body">Crédits</p>
                              <p className="text-2xl font-bold text-green-600 font-mono">
                                {monthlyReport.total_credits.toFixed(0)} FCFA
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-sunu-gray-light rounded-lg p-4">
                          <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-red-600 mr-3 transform rotate-180" />
                            <div>
                              <p className="text-sm font-medium text-sunu-gray-dark font-body">Débits</p>
                              <p className="text-2xl font-bold text-red-600 font-mono">
                                {monthlyReport.total_debits.toFixed(0)} FCFA
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-sunu-gray-light rounded-lg p-4">
                          <div className="flex items-center">
                            <FileText className="h-8 w-8 text-sunu-red mr-3" />
                            <div>
                              <p className="text-sm font-medium text-sunu-gray-dark font-body">Transactions</p>
                              <p className="text-2xl font-bold text-sunu-red font-mono">
                                {monthlyReport.total_transactions}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-sunu-gray-light rounded-lg p-4">
                          <div className="flex items-center">
                            <Users className="h-8 w-8 text-sunu-red mr-3" />
                            <div>
                              <p className="text-sm font-medium text-sunu-gray-dark font-body">Clients Actifs</p>
                              <p className="text-2xl font-bold text-sunu-red font-mono">
                                {monthlyReport.clients_actifs}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-sunu-gray-light rounded-lg p-4">
                          <div className="flex items-center">
                            <BarChart3 className="h-8 w-8 text-sunu-red mr-3" />
                            <div>
                              <p className="text-sm font-medium text-sunu-gray-dark font-body">Solde Net</p>
                              <p className="text-2xl font-bold text-sunu-red font-mono">
                                {(monthlyReport.total_credits - monthlyReport.total_debits).toFixed(0)} FCFA
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Détail par mode de paiement pour le rapport mensuel */}
                      {monthlyReport.transactions_par_mode && (
                          <div className="mt-8">
                            <h3 className="text-lg font-medium text-sunu-gray-dark mb-4 font-title">
                              Répartition mensuelle par mode de paiement
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800 font-body">TPE</p>
                                      <p className="text-2xl font-bold text-blue-600 font-mono">
                                        {monthlyReport.transactions_par_mode.tpe || 0}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-blue-600 font-body">transactions</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-green-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                                    <div>
                                      <p className="text-sm font-medium text-green-800 font-body">Espèce</p>
                                      <p className="text-2xl font-bold text-green-600 font-mono">
                                        {monthlyReport.transactions_par_mode.espece || 0}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-green-600 font-body">transactions</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-purple-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <FileText className="h-8 w-8 text-purple-600 mr-3" />
                                    <div>
                                      <p className="text-sm font-medium text-purple-800 font-body">Chèque</p>
                                      <p className="text-2xl font-bold text-purple-600 font-mono">
                                        {monthlyReport.transactions_par_mode.cheque || 0}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-purple-600 font-body">transactions</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                      )}
                    </>
                ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-body">
                        Aucune donnée disponible pour {new Date(0, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long' })} {selectedYear}
                      </p>
                    </div>
                )}
              </div>
            </div>
        )}

        {/* Modal de suppression */}
        {deleteModalOpen && (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="relative bg-white w-full max-w-md mx-4 md:mx-auto rounded-lg shadow-lg">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-sunu-gray-dark font-title">
                      Confirmation de suppression
                    </h3>
                    <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {deleteSuccess ? (
                      <div className="mb-4 p-4 bg-green-50 rounded-md text-green-700 font-body">
                        <CheckCircle className="h-5 w-5 inline-block mr-2" />
                        {deleteSuccess}
                      </div>
                  ) : (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-sunu-gray-dark font-body">
                            Êtes-vous sûr de vouloir supprimer le client{' '}
                            <strong>{clientToDelete?.prenom} {clientToDelete?.nom}</strong> ?
                          </p>
                          <p className="text-xs text-red-600 mt-2 font-body">
                            Cette action est irréversible et nécessite une justification.
                          </p>
                        </div>

                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-50 rounded-md text-red-700 text-sm font-body">
                              <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                              {deleteError}
                            </div>
                        )}

                        <form onSubmit={handleDeleteSubmit}>
                          <div className="mb-4">
                            <label htmlFor="justification" className="block text-sm font-medium text-sunu-gray-dark mb-2 font-body">
                              Justification de la suppression *
                            </label>
                            <textarea
                                id="justification"
                                rows={4}
                                className="w-full px-3 py-2 border border-sunu-gray-neutral rounded-md focus:ring-sunu-red focus:border-sunu-red font-body"
                                placeholder="Veuillez expliquer la raison de cette suppression..."
                                value={deleteJustification}
                                onChange={(e) => setDeleteJustification(e.target.value)}
                                required
                            />
                          </div>

                          <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-sm font-medium text-sunu-gray-dark bg-white border border-sunu-gray-neutral rounded-md hover:bg-sunu-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunu-red font-body"
                            >
                              Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={deleteLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-body"
                            >
                              {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                            </button>
                          </div>
                        </form>
                      </>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default AdminDashboard;