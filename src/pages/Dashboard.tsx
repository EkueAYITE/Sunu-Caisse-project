import React, { useState, useEffect } from 'react';
            import '../index.css';
            import { useAuth } from '../context/AuthContext';
            import {
              CreditCard,
              Plus,
              Search,
              Calendar,
              User,
              FileText,
              CheckCircle,
              AlertCircle,
              Clock,
              Hash
            } from 'lucide-react';

// Dans votre composant Login ou Dashboard
import { apiService } from '../services/api';

// Option 1 : Utiliser testConnection via apiService
const handleTestConnection = async () => {
  await apiService.testConnection();
};

            interface Payment {
              id: number;
              nom: string;
              prenom: string;
              montant: number;
              montant_lettres: string;
              numero_police: string;
              date: string;
              caissier?: string;
              mode_paiement: string;
              numero_piece?: string;
            }

            const Dashboard: React.FC = () => {
              const { user } = useAuth();
              const [payments, setPayments] = useState<Payment[]>([]);
              const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
              const [loading, setLoading] = useState(true);
              const [actionLoading, setActionLoading] = useState(false);
              const [searchTerm, setSearchTerm] = useState('');
              const [paymentForm, setPaymentForm] = useState({
                nom: '',
                prenom: '',
                montant: '',
                montant_lettres: '',
                numero_police: '',
                mode_paiement: 'espece',
                numero_piece: ''
              });
              const [error, setError] = useState('');
              const [success, setSuccess] = useState('');

              useEffect(() => {
                fetchPayments();
              }, []);

              useEffect(() => {
                filterPayments();
              }, [searchTerm, payments]);

              const fetchPayments = async () => {
                try {
                  const response = await apiService.getTransactions();
                  setPayments(response.data.data || []);
                } catch (err) {
                  console.error('Erreur lors du chargement des paiements:', err);
                } finally {
                  setLoading(false);
                }
              };

              const filterPayments = () => {
                if (!searchTerm) {
                  setFilteredPayments(payments);
                  return;
                }

                const filtered = payments.filter(payment =>
                    payment.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.numero_police.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setFilteredPayments(filtered);
              };

              const handlePaymentSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setActionLoading(true);
                setError('');
                setSuccess('');

                // Validation des champs
                if (!paymentForm.nom.trim() || !paymentForm.prenom.trim() ||
                    !paymentForm.montant || !paymentForm.montant_lettres.trim() ||
                    !paymentForm.numero_police.trim() || !paymentForm.mode_paiement) {
                  setError('Tous les champs sont obligatoires');
                  setActionLoading(false);
                  return;
                }

                // Validation du numéro de pièce selon le mode de paiement
                if ((paymentForm.mode_paiement === 'cheque' || paymentForm.mode_paiement === 'tpe') &&
                    !paymentForm.numero_piece.trim()) {
                  setError(`Le numéro de ${paymentForm.mode_paiement === 'cheque' ? 'chèque' : 'référence TPE'} est obligatoire`);
                  setActionLoading(false);
                  return;
                }

                if (parseFloat(paymentForm.montant) <= 0) {
                  setError('Le montant doit être supérieur à 0');
                  setActionLoading(false);
                  return;
                }

                try {
                  await apiService.createTransaction({
                    type: 'payment',
                    montant: parseFloat(paymentForm.montant),
                    description: `Paiement (${paymentForm.mode_paiement}) - ${paymentForm.nom} ${paymentForm.prenom} - Police: ${paymentForm.numero_police} - Montant: ${paymentForm.montant_lettres} FCFA${paymentForm.numero_piece ? ' - ' + (paymentForm.mode_paiement === 'cheque' ? 'Chèque n°' : 'Réf. TPE:') + paymentForm.numero_piece : ''}`
                  });

                  setSuccess(`Paiement de ${paymentForm.montant} FCFA (${paymentForm.montant_lettres}) enregistré avec succès pour ${paymentForm.prenom} ${paymentForm.nom}`);

                  // Réinitialiser le formulaire
                  setPaymentForm({
                    nom: '',
                    prenom: '',
                    montant: '',
                    montant_lettres: '',
                    numero_police: '',
                    mode_paiement: 'espece',
                    numero_piece: ''
                  });

                  // Recharger la liste des paiements
                  await fetchPayments();
                } catch (err: unknown) {
                  const errorMessage = err instanceof Error ? err.message :
                      typeof err === 'object' && err && 'response' in err ?
                          (err as Record<string, unknown>).response?.data?.message :
                          'Erreur lors de l\'enregistrement du paiement';

                  setError(errorMessage);
                } finally {
                  setActionLoading(false);
                }
              };

              const handleInputChange = (
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
              ) => {
                setPaymentForm(prev => ({
                  ...prev,
                  [e.target.name]: e.target.value
                }));
              };

              // Fonction pour obtenir le libellé du numéro de pièce selon le mode de paiement
              const getPieceLabel = () => {
                switch(paymentForm.mode_paiement) {
                  case 'cheque': return 'Numéro de chèque';
                  case 'tpe': return 'Référence TPE';
                  default: return '';
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
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-sunu-red font-title p2 rounded text-border">
                        Interface Caissier
                      </h1>
                      <button onClick={handleTestConnection}>
                        Tester la connexion
                      </button>
                      <p className="mt-2 text-sunu-gray-dark font-body">
                        Bonjour {user?.prenom} {user?.nom} - Enregistrement des paiements clients
                      </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                          <div className="text-sm text-red-700 font-body">{error}</div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 rounded-md bg-green-50 p-4 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <div className="text-sm text-green-700 font-body">{success}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Formulaire de paiement */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center mb-6">
                          <CreditCard className="h-6 w-6 text-sunu-red mr-2" />
                          <h2 className="text-xl font-semibold text-sunu-gray-dark font-title">Enregistrer un paiement</h2>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="nom" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                                Nom *
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                                <input
                                    type="text"
                                    id="nom"
                                    name="nom"
                                    required
                                    className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body"
                                    placeholder="Nom du client"
                                    value={paymentForm.nom}
                                    onChange={handleInputChange}
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="prenom" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                                Prénom *
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                                <input
                                    type="text"
                                    id="prenom"
                                    name="prenom"
                                    required
                                    className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body"
                                    placeholder="Prénom du client"
                                    value={paymentForm.prenom}
                                    onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="montant" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                              Montant (FCFA) *
                            </label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                              <input
                                  type="number"
                                  id="montant"
                                  name="montant"
                                  step="1"
                                  min="1"
                                  required
                                  className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-mono"
                                  placeholder="0"
                                  value={paymentForm.montant}
                                  onChange={handleInputChange}
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="montant_lettres" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                              Montant en lettres *
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                              <input
                                  type="text"
                                  id="montant_lettres"
                                  name="montant_lettres"
                                  required
                                  className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body"
                                  placeholder="Montant en toutes lettres"
                                  value={paymentForm.montant_lettres}
                                  onChange={handleInputChange}
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="numero_police" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                              Numéro de police *
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                              <input
                                  type="text"
                                  id="numero_police"
                                  name="numero_police"
                                  required
                                  className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body"
                                  placeholder="Numéro de police"
                                  value={paymentForm.numero_police}
                                  onChange={handleInputChange}
                              />
                            </div>
                          </div>

                          {/* Sélecteur de mode de paiement */}
                          <div>
                            <label htmlFor="mode_paiement" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                              Mode de paiement *
                            </label>
                            <div className="relative">
                              <div className="flex space-x-2">
                                {['espece', 'tpe', 'cheque'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        className={`px-4 py-2 rounded-md font-body border ${
                                            paymentForm.mode_paiement === mode
                                                ? 'bg-gray-600 text-white border-sunu-red'
                                                : 'bg-white text-sunu-gray-dark border-sunu-gray-neutral hover:bg-sunu-gray-light hover:text-dark'
                                        } transition-colors`}
                                        onClick={() =>
                                            setPaymentForm((prev) => ({ ...prev, mode_paiement: mode, numero_piece: '' }))
                                        }
                                    >
                                      {mode === 'espece'
                                          ? 'Espèce'
                                          : mode === 'tpe'
                                              ? 'TPE (Carte bancaire)'
                                              : 'Chèque'}
                                    </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Numéro de pièce conditionnel selon le mode de paiement */}
                          {(paymentForm.mode_paiement === 'cheque' || paymentForm.mode_paiement === 'tpe') && (
                            <div>
                              <label htmlFor="numero_piece" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                                {getPieceLabel()} *
                              </label>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                                <input
                                    type="text"
                                    id="numero_piece"
                                    name="numero_piece"
                                    required
                                    className="pl-10 w-full rounded-md border-sunu-gray-neutral shadow-sm focus:border-sunu-red focus:ring-sunu-red font-body"
                                    placeholder={paymentForm.mode_paiement === 'cheque' ? "Numéro du chèque" : "Référence transaction TPE"}
                                    value={paymentForm.numero_piece}
                                    onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          )}

                          <button
                              type="submit"
                              disabled={actionLoading}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sunu-red hover:bg-sunu-red-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunu-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-body"
                          >
                            {actionLoading ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Traitement en cours...
                                </div>
                            ) : (
                                <>
                                  <Plus className="h-5 w-5 mr-2" />
                                  Enregistrer le paiement
                                </>
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Statistiques rapides */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                          <h3 className="text-lg font-semibold text-sunu-gray-dark mb-4 font-title">Statistiques du jour</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-sunu-gray-light rounded-lg p-4">
                              <div className="flex items-center">
                                <FileText className="h-6 w-6 text-sunu-red" />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-sunu-red font-body">Paiements</p>
                                  <p className="text-xl font-bold text-sunu-gray-dark font-mono">{filteredPayments.length}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-sunu-gray-light rounded-lg p-4">
                              <div className="flex items-center">
                                <CreditCard className="h-6 w-6 text-sunu-red" />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-sunu-red font-body">Total</p>
                                  <p className="text-xl font-bold text-sunu-gray-dark font-mono">
                                    {filteredPayments.reduce((sum, payment) => sum + payment.montant, 0).toFixed(0)} FCFA
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-sunu-red to-sunu-red-hover rounded-lg p-6 text-white">
                          <div className="flex items-center">
                            <Clock className="h-8 w-8 mr-3" />
                            <div>
                              <h3 className="text-lg font-semibold font-title">Session active</h3>
                              <p className="text-white font-body">Connecté en tant que caissier</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section historique */}
                    <div className="mt-8 bg-white rounded-lg shadow-md">
                      <div className="px-6 py-4 border-b border-sunu-gray-neutral">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <h2 className="text-lg font-medium text-sunu-gray-dark mb-4 sm:mb-0 font-title">
                            Historique des paiements
                          </h2>
                          <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou police..."
                                className="pl-10 pr-4 py-2 border border-sunu-gray-neutral rounded-md focus:ring-sunu-red focus:border-sunu-red font-body"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
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
                              Montant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                              Mode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                              N° Police
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sunu-gray-dark uppercase tracking-wider font-title">
                              Date
                            </th>
                          </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-sunu-gray-neutral">
                          {filteredPayments.length > 0 ? (
                              filteredPayments.map((payment) => (
                                  <tr key={payment.id} className="hover:bg-sunu-gray-light">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <User className="h-4 w-4 text-sunu-red mr-2" />
                                        <div className="text-sm font-medium text-sunu-gray-dark font-body">
                                          {payment.prenom} {payment.nom}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-sunu-red font-mono">
                                        {payment.montant.toFixed(0)} FCFA
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-body">
                                      {payment.mode_paiement === 'espece' ? 'Espèce' :
                                       payment.mode_paiement === 'tpe' ? 'TPE' : 'Chèque'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-body">
                                      {payment.numero_police}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sunu-gray-dark font-body">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1 text-sunu-red" />
                                        {new Date(payment.date).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-sunu-gray-dark font-body">
                                  {searchTerm ? 'Aucun paiement trouvé pour cette recherche' : 'Aucun paiement enregistré'}
                                </td>
                              </tr>
                          )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
              );
            };

            export default Dashboard;