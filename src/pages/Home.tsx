import React from 'react';
      import { Link } from 'react-router-dom';
      import { useAuth } from '../context/AuthContext';
      import { CreditCard, TrendingUp, Shield, Users } from 'lucide-react';

      const Home: React.FC = () => {
        const { isAuthenticated } = useAuth();

        const features = [
          {
            icon: <CreditCard className="h-8 w-8" />,
            title: 'Gestion de Solde',
            description: 'Consultez votre solde et gérez vos transactions en temps réel'
          },
          {
            icon: <TrendingUp className="h-8 w-8" />,
            title: 'Paiements & Crédits',
            description: 'Effectuez des paiements, rechargez votre compte ou payez à crédit'
          },
          {
            icon: <Shield className="h-8 w-8" />,
            title: 'Sécurisé',
            description: 'Toutes vos transactions sont sécurisées et chiffrées'
          },
          {
            icon: <Users className="h-8 w-8" />,
            title: 'Interface Admin',
            description: 'Tableaux de bord complets pour la gestion administrative'
          }
        ];

        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-100 to-neutral-300">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
              <div className="max-w-7xl mx-auto">
                <div className="relative z-10 pb-8 bg-gradient-to-br from-gray-100  to-neutral-200 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                  <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div className="sm:text-center lg:text-left">
                      <h1 className="text-4xl tracking-tight font-title font-extrabold text-sunu-gray-dark sm:text-5xl md:text-6xl">
                        <span className="block xl:inline">Gestion de</span>{' '}
                        <span className="block text-sunu-red xl:inline">Caisse SUNU</span>
                      </h1>
                      <p className="mt-3 text-base font-body text-sunu-gray-dark sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                        Une application moderne pour gérer vos finances professionnelles.
                        Consultez votre solde, effectuez des transactions et suivez vos dépenses en toute simplicité.
                      </p>
                      <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                        <div className="rounded-md shadow">
                          {isAuthenticated ? (
                            <Link
                              to="/dashboard"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-body font-medium rounded-md text-white bg-sunu-red hover:bg-sunu-red-hover md:py-4 md:text-lg md:px-10 transition-colors"
                            >
                              Accéder au Dashboard
                            </Link>
                          ) : (
                            <Link
                              to="/login"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-body font-medium rounded-md text-white bg-sunu-red hover:bg-sunu-red-hover md:py-4 md:text-lg md:px-10 transition-colors"
                            >
                              Se connecter
                            </Link>
                          )}
                        </div>
                        {!isAuthenticated && (
                          <div className="mt-3 sm:mt-0 sm:ml-3">
                            <Link
                              to="/register"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-body font-medium rounded-md text-sunu-gray-dark bg-white hover:bg-sunu-gray-light md:py-4 md:text-lg md:px-10 transition-colors"
                            >
                              S'inscrire
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                  <h2 className="text-base text-sunu-red font-title font-semibold tracking-wide uppercase">
                    Fonctionnalités
                  </h2>
                  <p className="mt-2 text-3xl leading-8 font-title font-extrabold tracking-tight text-sunu-gray-dark sm:text-4xl">
                    Tout ce dont vous avez besoin
                  </p>
                  <p className="mt-4 max-w-2xl text-xl font-body text-sunu-gray-dark lg:mx-auto">
                    Une suite complète d'outils pour gérer efficacement vos finances
                  </p>
                </div>

                <div className="mt-10">
                  <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                    {features.map((feature, index) => (
                      <div key={index} className="relative">
                        <dt>
                          <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-sunu-red text-white">
                            {feature.icon}
                          </div>
                          <p className="ml-16 text-lg leading-6 font-title font-medium text-sunu-gray-dark">
                            {feature.title}
                          </p>
                        </dt>
                        <dd className="mt-2 ml-16 text-base font-body text-sunu-gray-dark">
                          {feature.description}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      };

      export default Home;