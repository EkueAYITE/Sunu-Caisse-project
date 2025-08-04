import React, { useState, useEffect } from 'react';
  import { apiService } from '../services/api';
  import {
    Users,
    Calendar,
    TrendingUp,
    DollarSign,
    BarChart3,
    FileText,
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Filter
  } from 'lucide-react';

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

  type PaymentMode = 'tous' | 'tpe' | 'espece' | 'cheque';

  const AdminDashboard: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'clients' | 'daily' | 'monthly'>('clients');
    const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('tous');

    useEffect(() => {
      fetchClients();
      fetchDailyReport();
      fetchMonthlyReport();
    }, []);

    useEffect(() => {
      if (activeTab === 'daily') {
        fetchDailyReport();
      }
    }, [selectedDate, activeTab, selectedPaymentMode]);

    useEffect(() => {
      if (activeTab === 'monthly') {
        fetchMonthlyReport();
      }
    }, [selectedMonth, selectedYear, activeTab, selectedPaymentMode]);

    const fetchClients = async () => {
      try {
        const response = await apiService.getAllClients();
        setClients(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };

    const fetchDailyReport = async () => {
      try {
        const response = await apiService.getDailyReport(selectedDate,selectedPaymentMode !== 'tous' ? selectedPaymentMode : undefined);
        setDailyReport(response.data || null);
      } catch (error) {
        console.error('Erreur lors du chargement du rapport journalier:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMonthlyReport = async () => {
      try {
        const response = await apiService.getMonthlyReport(
          selectedMonth.toString(),
          selectedYear,
          selectedPaymentMode !== 'tous' ? selectedPaymentMode : undefined
        );
        setMonthlyReport(response.data || null);
      } catch (error) {
        console.error('Erreur lors du chargement du rapport mensuel:', error);
      }
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

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-600">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-title">Tableau de bord Admin</h1>
          <p className="mt-2 text-gray-200 font-body">Gestion et rapports des comptes clients</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-500 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-body ${
                activeTab === 'clients'
                  ? 'border-sunu-red text-white'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
              }`}
            >
              <Users className="h-5 w-5 inline-block mr-2" />
              Clients
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-body ${
                activeTab === 'daily'
                  ? 'border-sunu-red text-white'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
              }`}
            >
              <Calendar className="h-5 w-5 inline-block mr-2" />
              Rapport Journalier
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-body ${
                activeTab === 'monthly'
                  ? 'border-sunu-red text-white'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline-block mr-2" />
              Rapport Mensuel
            </button>
          </nav>
        </div>

        {/* Filtre par mode de paiement (uniquement pour les rapports) */}
        {(activeTab === 'daily' || activeTab === 'monthly') && (
          <div className="mb-6 bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-300 mr-2" />
                <span className="text-gray-300 font-body">Filtrer par mode de paiement:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['tous', 'tpe', 'espece', 'cheque'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedPaymentMode(mode)}
                    className={`px-4 py-2 rounded-md font-body border ${
                      selectedPaymentMode === mode
                        ? 'bg-sunu-red text-white border-sunu-red'
                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                    } transition-colors`}
                  >
                    {mode === 'tpe' && <CreditCard className="h-4 w-4 inline-block mr-2" />}
                    {mode === 'espece' && <DollarSign className="h-4 w-4 inline-block mr-2" />}
                    {mode === 'cheque' && <FileText className="h-4 w-4 inline-block mr-2" />}
                    {getPaymentModeLabel(mode)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-lg shadow-md dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-sunu-gray-neutral dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-sunu-gray-dark dark:text-white font-title">Liste des clients</h2>
                <span className="text-sm text-sunu-gray-dark dark:text-gray-300 font-body">
                  {clients.length} client{clients.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sunu-gray-neutral dark:divide-gray-700">
                <thead className="bg-sunu-gray-light dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Prénom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Solde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark dark:text-gray-300 uppercase tracking-wider font-title">
                      Dernière Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-sunu-gray-neutral dark:bg-gray-800 dark:divide-gray-700">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-sunu-gray-light dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark dark:text-gray-300 font-body">
                        {client.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark dark:text-gray-300 font-body">
                        {client.prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark dark:text-gray-300 font-body">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        <span className={client.solde >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {client.solde.toFixed(2)}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClientStatusColor(client.solde)} dark:bg-opacity-20`}>
                          {getClientStatusIcon(client.solde)}
                          <span className="ml-1">
                            {client.solde > 0 ? 'Positif' : client.solde < 0 ? 'Négatif' : 'Neutre'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark dark:text-gray-300 font-body">
                        {client.derniere_transaction || 'Aucune'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-sunu-gray-dark dark:text-white font-title">
                  Rapport journalier {selectedPaymentMode !== 'tous' && `(${getPaymentModeLabel(selectedPaymentMode)})`}
                </h2>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-sunu-red" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {dailyReport ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 dark:bg-green-900 dark:bg-opacity-20">
                    <div className="flex items-center">
                      <TrendingUp className="h-10 w-10 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 font-body">Total Crédits</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-200 font-mono">
                          {dailyReport.total_credits.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 dark:bg-red-900 dark:bg-opacity-20">
                    <div className="flex items-center">
                      <TrendingUp className="h-10 w-10 text-red-500 transform rotate-180" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300 font-body">Total Débits</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-200 font-mono">
                          {dailyReport.total_debits.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sunu-gray-light rounded-lg p-4 dark:bg-gray-700">
                    <div className="flex items-center">
                      <FileText className="h-10 w-10 text-sunu-red" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Transactions</p>
                        <p className="text-2xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                          {dailyReport.total_transactions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sunu-gray-light rounded-lg p-4 dark:bg-gray-700">
                    <div className="flex items-center">
                      <DollarSign className="h-10 w-10 text-sunu-red" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Solde Total</p>
                        <p className="text-2xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                          {dailyReport.solde_total.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  {dailyReport.transactions_par_mode && (
                    <div className="md:col-span-4 bg-white p-4 rounded-lg shadow-sm border border-sunu-gray-neutral dark:bg-gray-700 dark:border-gray-600">
                      <h3 className="text-md font-medium text-sunu-gray-dark dark:text-white font-title mb-4">
                        Répartition par mode de paiement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <CreditCard className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">TPE</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {dailyReport.transactions_par_mode.tpe || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Espèce</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {dailyReport.transactions_par_mode.espece || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Chèque</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {dailyReport.transactions_par_mode.cheque || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-sunu-gray-dark dark:text-gray-300 font-body">
                  Aucune donnée disponible pour cette date
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-sunu-gray-dark dark:text-white font-title">
                  Rapport mensuel {selectedPaymentMode !== 'tous' && `(${getPaymentModeLabel(selectedPaymentMode)})`}
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i, 1).toLocaleString('fr-FR', { month: 'long' })}
                        </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {monthlyReport ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 dark:bg-green-900 dark:bg-opacity-20">
                    <div className="flex items-center">
                      <TrendingUp className="h-10 w-10 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 font-body">Total Crédits</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-200 font-mono">
                          {monthlyReport.total_credits.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 dark:bg-red-900 dark:bg-opacity-20">
                    <div className="flex items-center">
                      <TrendingUp className="h-10 w-10 text-red-500 transform rotate-180" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300 font-body">Total Débits</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-200 font-mono">
                          {monthlyReport.total_debits.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sunu-gray-light rounded-lg p-4 dark:bg-gray-700">
                    <div className="flex items-center">
                      <FileText className="h-10 w-10 text-sunu-red" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Transactions</p>
                        <p className="text-2xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                          {monthlyReport.total_transactions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sunu-gray-light rounded-lg p-4 dark:bg-gray-700">
                    <div className="flex items-center">
                      <Users className="h-10 w-10 text-sunu-red" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Clients Actifs</p>
                        <p className="text-2xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                          {monthlyReport.clients_actifs}
                        </p>
                      </div>
                    </div>
                  </div>

                  {monthlyReport.transactions_par_mode && (
                    <div className="md:col-span-4 bg-white p-4 rounded-lg shadow-sm border border-sunu-gray-neutral dark:bg-gray-700 dark:border-gray-600">
                      <h3 className="text-md font-medium text-sunu-gray-dark dark:text-white font-title mb-4">
                        Répartition par mode de paiement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <CreditCard className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">TPE</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {monthlyReport.transactions_par_mode.tpe || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Espèce</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {monthlyReport.transactions_par_mode.espece || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-sunu-gray-light dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 text-sunu-red" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-sunu-gray-dark dark:text-gray-300 font-body">Chèque</p>
                              <p className="text-xl font-bold text-sunu-gray-dark dark:text-white font-mono">
                                {monthlyReport.transactions_par_mode.cheque || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-sunu-gray-dark dark:text-gray-300 font-body">
                  Aucune donnée disponible pour cette période
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default AdminDashboard;