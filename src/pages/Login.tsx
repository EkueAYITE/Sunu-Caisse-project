import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '' // Changé de password à motDePasse
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.motDePasse); // Utilisé motDePasse
      setSuccess('Connexion réussie ! Redirection...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: unknown) { // Correction du type any
      if (err instanceof Error) {
        setError(err.message || 'Erreur lors de la connexion');
      } else {
        setError('Erreur lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunu-gray-light to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-title font-extrabold text-sunu-gray-dark">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-center text-sm font-body text-sunu-gray-dark">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-sunu-red hover:text-sunu-red-hover transition-colors"
            >
              créez un nouveau compte
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700 font-body">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <div className="text-sm text-green-700 font-body">{success}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red focus:z-10 sm:text-sm font-body"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="motDePasse" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                <input
                  id="motDePasse"
                  name="motDePasse" // Changé de password à motDePasse
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red focus:z-10 sm:text-sm font-body"
                  placeholder="Votre mot de passe"
                  value={formData.motDePasse} // Changé de password à motDePasse
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-sunu-red hover:bg-sunu-red-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunu-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-body shadow-sunu"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion en cours...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="font-medium text-sm text-sunu-red hover:text-sunu-red-hover transition-colors font-body"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;