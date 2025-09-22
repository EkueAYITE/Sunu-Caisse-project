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
    AlertTriangle,
    CheckCircle,
    X,
    Filter,
    Printer
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

  interface MonthlyStats {
    generales?: any;
    parJour?: any;
    parMode?: any;
    paiements: DailyPayment[];
    total_credits: number;
    total_debits: number;
    total_transactions: number;
  }

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }

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

    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
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
    const [dailyFilterMode, setDailyFilterMode] = useState<PaymentMode>('tous');
    const [monthlyFilterMode, setMonthlyFilterMode] = useState<PaymentMode>('tous');
    const [lastFetchTime, setLastFetchTime] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [monthlyPayments, setMonthlyPayments] = useState<DailyPayment[]>([]);

    const shouldFetch = (key: string, delayMs: number = 1000): boolean => {
      const now = Date.now();
      const lastTime = lastFetchTime[key] || 0;
      return now - lastTime > delayMs;
    };

    const updateFetchTime = (key: string) => {
      setLastFetchTime(prev => ({ ...prev, [key]: Date.now() }));
    };

    const filterPaymentsByMode = (payments: DailyPayment[], mode: PaymentMode): DailyPayment[] => {
      if (mode === 'tous') return payments;
      return payments.filter(payment => payment.mode_paiement === mode);
    };

    const getFilteredDailyPayments = () => filterPaymentsByMode(dailyPayments, dailyFilterMode);
    const getFilteredMonthlyPayments = () => filterPaymentsByMode(monthlyPayments, monthlyFilterMode);

    const getMonthName = (month: number) => {
      const date = new Date(2000, month - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'long' });
    };

    const printReport = () => {
      window.print();
    };

    const getSoldeClass = (solde: number) => {
      if (solde > 0) return 'text-green-600 bg-green-100';
      if (solde < 0) return 'text-red-600 bg-red-100';
      return 'text-gray-600 bg-gray-100';
    };

    const getSoldeIcon = (solde: number) => {
      if (solde > 0) return <CheckCircle className="h-4 w-4" />;
      if (solde < 0) return <AlertTriangle className="h-4 w-4" />;
      return <DollarSign className="h-4 w-4" />;
    };

    useEffect(() => {
      let mounted = true;

      const fetchData = async () => {
        try {
          if (mounted && shouldFetch('main', 3000)) {
            updateFetchTime('main');

            if (activeTab === 'overview') {
              await fetchDashboardData();
            } else if (activeTab === 'clients') {
              await fetchClients();
            } else if (activeTab === 'payments') {
              await fetchDailyPayments();
            } else if (activeTab === 'reports') {
              await Promise.all([
                fetchDailyReport(),
                fetchMonthlyPayments()
              ]);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        }
      };

      fetchData();

      return () => {
        mounted = false;
      };
    }, [selectedDate, activeTab, selectedMonth, selectedYear]);

    // Filtrage des clients en temps réel
    useEffect(() => {
      if (searchTerm) {
        const filtered = clients.filter(client =>
          client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClients(filtered);
      } else {
        setFilteredClients(clients);
      }
    }, [searchTerm, clients]);

    const fetchDailyPayments = async (date?: string) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const targetDate = date || selectedDate;
        const response = await apiService.getDailyReport(targetDate);

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
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      try {
        updateFetchTime('dashboard');

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
            date: p.date_creation || '',
            mode_paiement: p.mode_paiement || ''
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
    };

    const fetchDailyReport = async (date?: string) => {
      try {
        const targetDate = date || selectedDate;
        const response = await apiService.getDailyReport(targetDate);
        setDailyReport(response.data || null);
        await fetchDailyPayments(targetDate);
      } catch (error) {
        console.error('Erreur lors du chargement du rapport journalier:', error);
        setDailyReport(null);
      }
    };

    const fetchMonthlyPayments = async () => {
      try {
        const response = await apiService.getMonthlyReport(
          selectedMonth.toString(),
          selectedYear
        );

        const apiData = response.data;

        const paiements: DailyPayment[] = (apiData?.paiements || []).map((p: ApiPayment): DailyPayment => ({
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

        setMonthlyPayments(paiements);

        setMonthlyStats({
          generales: apiData.statistiques_generales,
          parJour: apiData.statistiques_par_jour,
          parMode: apiData.statistiques_par_mode,
          paiements: paiements,
          total_credits: paiements.filter(p => p.type === 'credit').reduce((sum, p) => sum + p.montant, 0),
          total_debits: paiements.filter(p => p.type === 'debit').reduce((sum, p) => sum + p.montant, 0),
          total_transactions: paiements.length
        });

        console.log('Monthly payments loaded:', paiements.length);
      } catch (error) {
        console.error('Erreur lors du chargement des paiements mensuels:', error);
        setMonthlyPayments([]);
        setMonthlyStats(null);
      }
    };

    const handleDateChange = (newDate: string) => {
      setSelectedDate(newDate);
      setDailyFilterMode('tous');
    };

    const handleMonthChange = (month: number, year?: number) => {
      setSelectedMonth(month);
      if (year) setSelectedYear(year);
      setMonthlyFilterMode('tous');
      fetchMonthlyPayments();
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
            {subtitle && <p className="text-xs text-sunu-gray-dark opacity-75 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
    );

    const PaymentTable: React.FC<{
      payments: DailyPayment[];
      title: string;
      subtitle: string;
      filterMode: PaymentMode;
      onFilterChange: (mode: PaymentMode) => void;
      onPrint: () => void;
    }> = ({ payments, title, subtitle, filterMode, onFilterChange, onPrint }) => (
      <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral">
        <div className="px-6 py-4 border-b border-sunu-gray-neutral">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-sunu-gray-dark">{title}</h3>
              <p className="text-sm text-sunu-gray-dark opacity-75">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-sunu-gray-dark" />
                <select
                  value={filterMode}
                  onChange={(e) => onFilterChange(e.target.value as PaymentMode)}
                  className="border border-sunu-gray-neutral rounded-lg px-3 py-1 text-sm"
                >
                  <option value="tous">Tous les modes</option>
                  <option value="tpe">TPE</option>
                  <option value="espece">Espèce</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <button
                onClick={onPrint}
                className="flex items-center space-x-2 px-4 py-2 bg-sunu-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer</span>
              </button>
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
                  Police
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                  Caissier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sunu-gray-neutral">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-sunu-gray-light">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-sunu-gray-dark">
                      {payment.prenom} {payment.nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-sunu-gray-dark">
                      {payment.numero_police || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${payment.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                      {payment.type === 'debit' ? '-' : '+'}{payment.montant.toLocaleString('fr-FR')} F
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {payment.mode_paiement}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                    {new Date(payment.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                    {payment.caissier ? `${payment.caissier.prenom} ${payment.caissier.nom}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-sunu-gray-dark opacity-50 mx-auto mb-4" />
              <p className="text-sunu-gray-dark opacity-75">Aucun paiement trouvé</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-sunu-gray-light border-t border-sunu-gray-neutral">
          <div className="flex justify-between items-center">
            <div className="text-sm text-sunu-gray-dark">
              Total : {payments.length} transaction{payments.length > 1 ? 's' : ''}
            </div>
            <div className="text-sm font-medium text-sunu-gray-dark">
              Montant total : {payments.reduce((sum, p) => sum + (p.type === 'debit' ? -p.montant : p.montant), 0).toLocaleString('fr-FR')} F
            </div>
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
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
              { id: 'reports', label: 'Rapports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-sunu-red text-white'
                      : 'text-sunu-gray-dark hover:bg-sunu-gray-light'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Clients"
                value={stats.totalClients}
                icon={<Users className="h-6 w-6" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Paiements Aujourd'hui"
                value={stats.paiementsAujourdhui}
                icon={<CreditCard className="h-6 w-6" />}
                color="bg-green-500"
              />
              <StatCard
                title="Total Paiements"
                value={stats.totalPaiements}
                icon={<Activity className="h-6 w-6" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Montant Total"
                value={`${stats.montantTotal.toLocaleString('fr-FR')} F`}
                icon={<DollarSign className="h-6 w-6" />}
                color="bg-orange-500"
              />
            </div>

            {/* Paiements récents */}
            <div className="bg-white rounded-2xl shadow-sunu p-6 border border-sunu-gray-neutral">
              <h3 className="text-xl font-semibold text-sunu-gray-dark mb-4">Paiements Récents</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sunu-gray-neutral">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sunu-gray-neutral">
                    {recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-sunu-gray-dark">
                            {payment.prenom} {payment.nom}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 font-medium">
                            {payment.montant.toLocaleString('fr-FR')} F
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.mode_paiement}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                          {new Date(payment.date).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {recentPayments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-sunu-gray-dark opacity-50 mx-auto mb-4" />
                    <p className="text-sunu-gray-dark opacity-75">Aucun paiement récent</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'clients' && (
          <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral">
            <div className="px-6 py-4 border-b border-sunu-gray-neutral">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-sunu-gray-dark">Gestion des Clients</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-sunu-gray-neutral rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                  />
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
                      Dernière Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-sunu-gray-neutral">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-sunu-gray-light">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getSoldeClass(client.solde)}`}>
                            {getSoldeIcon(client.solde)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-sunu-gray-dark">
                              {client.prenom} {client.nom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-sunu-gray-dark">{client.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${client.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {client.solde.toLocaleString('fr-FR')} F
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark">
                        {client.derniere_transaction ? new Date(client.derniere_transaction).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setClientToDelete(client);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredClients.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-sunu-gray-dark opacity-50 mx-auto mb-4" />
                  <p className="text-sunu-gray-dark opacity-75">Aucun client trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <label className="block text-sm font-medium text-gray-700">
                  Date des paiements :
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                />
              </div>
            </div>

            <PaymentTable
              payments={getFilteredDailyPayments()}
              title={`Paiements du jour - ${new Date(selectedDate).toLocaleDateString('fr-FR')}`}
              subtitle={`Liste complète des paiements (${getFilteredDailyPayments().length} transactions)`}
              filterMode={dailyFilterMode}
              onFilterChange={setDailyFilterMode}
              onPrint={() => printReport()}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Contrôles de date pour les rapports */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rapport journalier
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rapport mensuel
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value))}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={selectedYear - 2 + i} value={selectedYear - 2 + i}>
                          {selectedYear - 2 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Rapport journalier */}
            <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral print-section" data-report-type="daily">
              <div className="px-6 py-4 border-b border-sunu-gray-neutral flex justify-between items-center">
                <h3 className="text-lg font-semibold text-sunu-gray-dark">
                  Rapport Journalier - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                </h3>
                <button
                  onClick={printReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-sunu-red text-white rounded-lg hover:bg-red-700 transition-colors print:hidden"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer</span>
                </button>
              </div>

              {dailyReport ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {dailyReport.total_credits?.toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-sm text-green-700">Total Crédits</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {dailyReport.total_debits?.toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-sm text-red-700">Total Débits</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {dailyReport.total_transactions}
                      </div>
                      <div className="text-sm text-blue-700">Transactions</div>
                    </div>
                  </div>

                  {dailyPayments.length > 0 && (
                    <PaymentTable
                      payments={getFilteredDailyPayments()}
                      title="Détail des transactions"
                      subtitle={`${getFilteredDailyPayments().length} transactions`}
                      filterMode={dailyFilterMode}
                      onFilterChange={setDailyFilterMode}
                      onPrint={() => printReport()}
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune donnée disponible pour cette date</p>
                </div>
              )}
            </div>

            {/* Rapport mensuel */}
            <div className="bg-white rounded-2xl shadow-sunu border border-sunu-gray-neutral print-section" data-report-type="monthly">
              <div className="px-6 py-4 border-b border-sunu-gray-neutral flex justify-between items-center">
                <h3 className="text-lg font-semibold text-sunu-gray-dark">
                  Rapport Mensuel - {getMonthName(selectedMonth)} {selectedYear}
                </h3>
                <button
                  onClick={printReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-sunu-red text-white rounded-lg hover:bg-red-700 transition-colors print:hidden"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer</span>
                </button>
              </div>

              {monthlyStats ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {monthlyStats.total_credits?.toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-sm text-green-700">Total Crédits</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {monthlyStats.total_debits?.toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-sm text-red-700">Total Débits</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {monthlyStats.total_transactions}
                      </div>
                      <div className="text-sm text-blue-700">Transactions</div>
                    </div>
                  </div>

                  {monthlyPayments.length > 0 && (
                    <PaymentTable
                      payments={getFilteredMonthlyPayments()}
                      title="Détail des transactions mensuelles"
                      subtitle={`${getFilteredMonthlyPayments().length} transactions`}
                      filterMode={monthlyFilterMode}
                      onFilterChange={setMonthlyFilterMode}
                      onPrint={() => printReport()}
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune donnée disponible pour ce mois</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Supprimer le client</h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {deleteSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-medium">{deleteSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleDeleteSubmit}>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Vous êtes sur le point de supprimer le client :
                    </p>
                    <p className="font-medium text-gray-900">
                      {clientToDelete?.prenom} {clientToDelete?.nom}
                    </p>
                    <p className="text-sm text-gray-500">{clientToDelete?.email}</p>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
                      Justification de la suppression *
                    </label>
                    <textarea
                      id="justification"
                      value={deleteJustification}
                      onChange={(e) => setDeleteJustification(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sunu-red focus:border-transparent"
                      placeholder="Expliquez pourquoi vous supprimez ce client..."
                      required
                    />
                  </div>

                  {deleteError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-red-600 text-sm">{deleteError}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={deleteLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default AdminDashboard;