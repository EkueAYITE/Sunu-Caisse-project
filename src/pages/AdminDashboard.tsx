import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  Users,
  CreditCard,
  FileText,
  DollarSign,
  Activity,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  Trash2,
  X
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

interface DailyPayment {
  id: number;
  nom: string;
  prenom: string;
  montant: number;
  type?: 'credit' | 'debit';
  mode_paiement: string;
  numero_police?: string;
  numero_piece?: string;
  date_creation: string;
  date_paiement?: string;
  caissier?: {
    nom: string;
    prenom: string;
  };
}

interface DailyReport {
  date: string;
  total_credits: number;
  total_debits: number;
  total_transactions: number;
  solde_total: number;
  data?: {
    paiements?: DailyPayment[];
  };
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
// Ajouter des interfaces pour les réponses API
interface ApiPayment {
  id: number;
  nom: string;
  prenom: string;
  montant: number;
  type?: string;
  mode_paiement: string;
  numero_police?: string;
  numero_piece?: string;
  date_creation: string;
  date_paiement?: string;
  caissier?: {
    nom: string;
    prenom: string;
  };
}

interface ApiDailyReportResponse {
  data?: {
    paiements?: ApiPayment[];
  };
  total_transactions?: number;
  total_credits?: number;
  total_debits?: number;
}

const AdminDashboard: React.FC = () => {
  console.log('AdminDashboard rendering...');
  const { user } = useAuth();
  console.log('User:', user);
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [dailyPayments, setDailyPayments] = useState<DailyPayment[]>([]);

  useEffect(() => {
    console.log('AdminDashboard mounted, fetching data...');
    const initData = async () => {
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchClients(),
          fetchDailyReport(),
          fetchMonthlyReport(),
          fetchDailyPayments()
        ]);
        console.log('All data fetched successfully');
      } catch (error) {
        console.error('Error during data initialization:', error);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchDailyPayments();
    }
  }, [activeTab, selectedDate]);

  const fetchDailyPayments = async (date?: string) => {
    try {
      const targetDate = date || selectedDate;
      const response = await apiService.getDailyReport(targetDate);

      // Typage spécifique au lieu de any
      const apiData = response.data as ApiDailyReportResponse;
      const paiements = (apiData?.data?.paiements || []).map((p: ApiPayment): DailyPayment => ({
        id: p.id,
        nom: p.nom || '',
        prenom: p.prenom || '',
        montant: Number(p.montant) || 0,
        type: (p.type === 'debit' ? 'debit' : 'credit') as 'credit' | 'debit',
        mode_paiement: p.mode_paiement || '',
        numero_police: p.numero_police,
        numero_piece: p.numero_piece,
        date_creation: p.date_creation || '',
        date_paiement: p.date_paiement,
        caissier: p.caissier
      }));

      setDailyPayments(paiements);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements du jour:', error);
      setDailyPayments([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [clientsResponse, dailyReportResponse] = await Promise.all([
        apiService.getAllClients(),
        apiService.getDailyReport(new Date().toISOString().split('T')[0])
      ]);

      const clients = clientsResponse.data || [];
      const dailyData = dailyReportResponse.data as ApiDailyReportResponse;

      setStats({
        totalClients: clients.length,
        totalPaiements: dailyData?.total_transactions || 0,
        montantTotal: (dailyData?.total_credits || 0) - (dailyData?.total_debits || 0),
        paiementsAujourdhui: dailyData?.total_transactions || 0,
        montantAujourdhui: (dailyData?.total_credits || 0) - (dailyData?.total_debits || 0)
      });

      const paiements = dailyData?.data?.paiements || [];
      setRecentPayments(
        paiements.slice(0, 5).map((p: ApiPayment): RecentPayment => ({
          id: p.id,
          nom: p.nom || '',
          prenom: p.prenom || '',
          montant: Number(p.montant) || 0,
          date: p.date_creation || new Date().toISOString(),
          mode_paiement: p.mode_paiement || 'Non spécifié'
        }))
      );
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setStats({
        totalClients: 0,
        totalPaiements: 0,
        montantTotal: 0,
        paiementsAujourdhui: 0,
        montantAujourdhui: 0
      });
      setRecentPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiService.getAllClients();
      const clientsData = response.data || [];
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClients([]);
      setFilteredClients([]);
    }
  }

  const fetchDailyReport = async (date?: string) => {
    try {
      const targetDate = date || selectedDate;
      const response = await apiService.getDailyReport(targetDate);
      setDailyReport(response.data || null);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport journalier:', error);
      setDailyReport(null);
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
      setMonthlyReport(null);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
        client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchDailyReport(newDate);
    if (activeTab === 'payments') {
      fetchDailyPayments(newDate);
    }
  };

  const handleMonthChange = (month: number, year?: number) => {
    setSelectedMonth(month);
    if (year) setSelectedYear(year);
    fetchMonthlyReport();
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

  const getClientStatusColor = (solde: number | undefined) => {
    const soldeValue = solde || 0;
    if (soldeValue > 0) return 'text-green-600 bg-green-100';
    if (soldeValue < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getClientStatusIcon = (solde: number | undefined) => {
    const soldeValue = solde || 0;
    if (soldeValue > 0) return <CheckCircle className="h-4 w-4" />;
    if (soldeValue < 0) return <AlertTriangle className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
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
              { id: 'clients', label: 'Clients', icon: <Users className="h-5 w-5" /> },
              { id: 'payments', label: 'Paiements', icon: <CreditCard className="h-5 w-5" /> },
              { id: 'reports', label: 'Rapports', icon: <FileText className="h-5 w-5" /> }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                            ? 'bg-sunu-red text-white'
                            : 'text-sunu-gray-dark hover:bg-sunu-gray-light'
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
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
                    value={(stats.totalClients || 0).toLocaleString()}
                    icon={<Users className="h-6 w-6" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Paiements Aujourd'hui"
                    value={stats.paiementsAujourdhui || 0}
                    icon={<Activity className="h-6 w-6" />}
                    color="bg-green-500"
                />
                <StatCard
                    title="Montant Aujourd'hui"
                    value={`${(stats.montantAujourdhui || 0).toLocaleString()} FCFA`}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Total Général"
                    value={`${(stats.montantTotal || 0).toLocaleString()} FCFA`}
                    icon={<CreditCard className="h-6 w-6" />}
                    color="bg-purple-500"
                />
              </div>

              {/* Paiements récents */}
              <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
                <h3 className="text-lg font-semibold text-sunu-gray-dark font-title mb-4">
                  Paiements Récents
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                    <tr className="border-b border-sunu-gray-neutral">
                      <th className="text-left py-2 text-sm font-medium text-sunu-gray-dark">Client</th>
                      <th className="text-left py-2 text-sm font-medium text-sunu-gray-dark">Montant</th>
                      <th className="text-left py-2 text-sm font-medium text-sunu-gray-dark">Mode</th>
                      <th className="text-left py-2 text-sm font-medium text-sunu-gray-dark">Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recentPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-sunu-gray-neutral">
                          <td className="py-2 text-sm text-sunu-gray-dark">
                            {payment.prenom} {payment.nom}
                          </td>
                          <td className="py-2 text-sm font-mono text-green-600">
                            {(payment.montant || 0).toLocaleString()} FCFA
                          </td>
                          <td className="py-2 text-sm text-sunu-gray-dark">
                            {payment.mode_paiement}
                          </td>
                          <td className="py-2 text-sm text-sunu-gray-dark">
                            {new Date(payment.date).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}

        {activeTab === 'clients' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-semibold text-sunu-gray-dark">
                    Gestion des Clients ({filteredClients.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                          type="text"
                          placeholder="Rechercher un client..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-sunu-gray-neutral rounded-md focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sunu-gray-neutral">
                  <thead className="bg-sunu-gray-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Solde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sunu-gray-neutral">
                  {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-sunu-gray-light">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-sunu-gray-dark">
                            {client.prenom} {client.nom}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-sunu-gray-dark">
                          {(client.solde || 0).toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClientStatusColor(client.solde)}`}>
                                {getClientStatusIcon(client.solde)}
                                <span className="ml-1">
                                  {(client.solde || 0) > 0 ? 'Créditeur' : (client.solde || 0) < 0 ? 'Débiteur' : 'Équilibré'}
                                </span>
                              </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                              onClick={() => handleDeleteClick(client)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Supprimer</span>
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral">
              <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-sunu-gray-dark font-title">
                      Paiements du jour - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                    </h3>
                    <p className="text-sm text-sunu-gray-dark font-body mt-1">
                      Liste complète des paiements ({dailyPayments.length} transactions)
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-sunu-gray-dark" />
                      <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="border border-sunu-gray-neutral rounded-md px-3 py-1 text-sm"
                      />
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-sunu-red text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Imprimer
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sunu-gray-neutral">
                  <thead className="bg-sunu-gray-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Mode de paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      N° Police
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Caissier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sunu-gray-neutral">
                  {dailyPayments.length > 0 ? (
                      dailyPayments.map((paiement, index) => (
                          <tr key={paiement.id} className="hover:bg-sunu-gray-light">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-mono">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-sunu-gray-dark">
                                {paiement.prenom || ''} {paiement.nom || ''}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold font-mono text-green-600">
                                {(Number(paiement.montant) || 0).toLocaleString()} FCFA
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                              {paiement.mode_paiement || 'Non spécifié'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-mono">
                              {paiement.numero_police || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                              {paiement.caissier ?
                                  `${paiement.caissier.prenom || ''} ${paiement.caissier.nom || ''}`.trim() || '-'
                                  : '-'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-mono">
                              {paiement.date_creation ?
                                  new Date(paiement.date_creation).toLocaleDateString('fr-FR')
                                  : '-'
                              }
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sunu-gray-dark">
                          Aucun paiement trouvé pour cette date
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-sunu-gray-light border-t border-sunu-gray-neutral">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                        <span className="text-sunu-gray-dark font-body">
                          Total transactions: {dailyPayments.length}
                        </span>
                  </div>
                  <div>
                        <span className="font-bold text-green-600 font-mono">
                          Total: {dailyPayments
                            .reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
                            .toLocaleString()} FCFA
                        </span>
                  </div>
                  <div className="text-right">
                        <span className="text-xs text-sunu-gray-dark">
                          Généré le {new Date().toLocaleString('fr-FR')}
                        </span>
                  </div>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral">
                <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-sunu-gray-dark font-title">
                        Rapport journalier - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                      </h3>
                      <p className="text-sm text-sunu-gray-dark font-body mt-1">
                        Synthèse des activités de la journée
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-sunu-gray-dark" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="border border-sunu-gray-neutral rounded-md px-3 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {dailyReport ? (
                    <div className="px-6 py-4 bg-sunu-gray-light border-b border-sunu-gray-neutral">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 font-mono">
                            {Number(dailyReport.total_credits || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Total Crédits (FCFA)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 font-mono">
                            {Number(dailyReport.total_debits || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Total Débits (FCFA)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 font-mono">
                            {Number(dailyReport.total_transactions || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Transactions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 font-mono">
                            {(Number(dailyReport.total_credits || 0) - Number(dailyReport.total_debits || 0)).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Solde Net (FCFA)</div>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="px-6 py-8 text-center">
                      <p className="text-sunu-gray-dark">Chargement du rapport...</p>
                    </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral">
                <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-sunu-gray-dark font-title">
                        Rapport mensuel
                      </h3>
                      <p className="text-sm text-sunu-gray-dark font-body mt-1">
                        Synthèse des activités du mois
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                          value={selectedMonth}
                          onChange={(e) => handleMonthChange(Number(e.target.value))}
                          className="border border-sunu-gray-neutral rounded-md px-3 py-1 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                            </option>
                        ))}
                      </select>
                      <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="border border-sunu-gray-neutral rounded-md px-3 py-1 text-sm"
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                            <option key={2024 - i} value={2024 - i}>
                              {2024 - i}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {monthlyReport ? (
                    <div className="px-6 py-4 bg-sunu-gray-light">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 font-mono">
                            {Number(monthlyReport.total_credits || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Total Crédits (FCFA)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 font-mono">
                            {Number(monthlyReport.total_debits || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Total Débits (FCFA)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 font-mono">
                            {Number(monthlyReport.total_transactions || 0)}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Transactions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 font-mono">
                            {Number(monthlyReport.clients_actifs || 0)}
                          </div>
                          <div className="text-sm text-sunu-gray-dark font-body">Clients Actifs</div>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="px-6 py-8 text-center">
                      <p className="text-sunu-gray-dark">Aucun rapport disponible pour ce mois</p>
                    </div>
                )}
              </div>
            </div>
        )}

        {deleteModalOpen && (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="relative bg-white w-full max-w-md mx-4 md:mx-auto rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Supprimer le client
                    </h3>
                    <button
                        onClick={closeDeleteModal}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDeleteSubmit}>
                  <div className="px-6 py-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Vous êtes sur le point de supprimer le client :
                      </p>
                      <p className="font-medium text-gray-900">
                        {clientToDelete?.prenom} {clientToDelete?.nom}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
                        Justification de la suppression *
                      </label>
                      <textarea
                          id="justification"
                          rows={3}
                          required
                          value={deleteJustification}
                          onChange={(e) => setDeleteJustification(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                          placeholder="Expliquez pourquoi ce client doit être supprimé..."
                      />
                    </div>

                    {deleteError && (
                        <div className="mb-4 text-sm text-red-600">
                          {deleteError}
                        </div>
                    )}

                    {deleteSuccess && (
                        <div className="mb-4 text-sm text-green-600">
                          {deleteSuccess}
                        </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={closeDeleteModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={deleteLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
};

export default AdminDashboard;