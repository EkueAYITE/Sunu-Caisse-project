import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
            import { AuthProvider } from './context/AuthContext';
            import Header from './components/Header';
            import ProtectedRoute from './components/ProtectedRoute'; // Vérifiez ce chemin
            import Home from './pages/Home';
            import Login from './pages/Login';
            import Register from './pages/Register';
            import Dashboard from './pages/Dashboard';
            import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from "./pages/SuperAdmin.tsx";

            function App() {
              return (
                <AuthProvider>
                  <Router>
                    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-500">
                      <Header />
                      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <Dashboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/admin"
                            element={
                              <ProtectedRoute adminOnly={true}>
                                <AdminDashboard />
                              </ProtectedRoute>
                            }
                          />
                            <Route
                                path={"/super-admin-dashboard"}
                                element={  <SuperAdmin />}
                            />
                        </Routes>
                      </main>
                    </div>
                  </Router>
                </AuthProvider>
              );
            }

            export default App;