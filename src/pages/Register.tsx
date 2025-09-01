import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password
      });
      setSuccess('Inscription réussie ! Redirection...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-sunu-gray-light to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-title font-extrabold text-sunu-gray-dark">
              Créer votre compte
            </h2>
            <p className="mt-2 text-center text-sm font-body text-sunu-gray-dark">
              Ou{' '}
              <Link
                  to="/login"
                  className="font-medium text-sunu-red hover:text-sunu-red-hover transition-colors"
              >
                connectez-vous à votre compte existant
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                    <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        required
                        className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red sm:text-sm font-body"
                        placeholder="Votre prénom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                    <input
                        id="nom"
                        name="nom"
                        type="text"
                        required
                        className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red sm:text-sm font-body"
                        placeholder="Votre nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

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
                      className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red sm:text-sm font-body"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                  <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red sm:text-sm font-body"
                      placeholder="Minimum 6 caractères"
                      value={formData.password}
                      onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-sunu-gray-dark mb-1 font-body">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sunu-red" />
                  <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-sunu-gray-neutral placeholder-gray-500 text-sunu-gray-dark focus:outline-none focus:ring-sunu-red focus:border-sunu-red sm:text-sm font-body"
                      placeholder="Confirmez votre mot de passe"
                      value={formData.confirmPassword}
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
                      Inscription en cours...
                    </div>
                ) : (
                    'Créer mon compte'
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

export default Register;