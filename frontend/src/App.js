// import './App.css';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Signup from './pages/Signup';
// import Login from './pages/Login';
// import OAuthSuccess from './pages/OAuthSuccess';
// import DashboardWrapper from './pages/dashboard';
// import OnboardingPage from './pages/Onboarding';


// function Protected({ children }) {
//   return localStorage.getItem('token')
//   ? children
//   : <Navigate to="/login"/>;
// }


// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           <Route path="/" element={<Signup />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/oauth-success" element={<OAuthSuccess />} />
//           <Route path="/dashboard" element={<Protected><DashboardWrapper /></Protected>} />
//           <Route path="/onboarding" element={<Protected><OnboardingPage /></Protected>} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;

// import './App.css';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import Signup from './pages/Signup';
// import Login from './pages/Login';
// import OAuthSuccess from './pages/OAuthSuccess';
// import DashboardWrapper from './pages/dashboard';
// import OnboardingPage from './pages/Onboarding';
// import Settings from './pages/settings';
// import Admin from './pages/admin';
// import ForgotPassword from './pages/forgot-password'; 
// import api from './services/api';
// import { NotificationProvider } from './components/NotificationPopup';
// import OAuth2FA from './pages/OAuth2FA';
// import project from './pages/project';
// import Error404Page from './pages/error404page';
// import Referral from './pages/referral';
// import Navbar from './components/Navbar.js'
// // Loading component
// function LoadingScreen() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
//       <div className="text-center">
//         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//         <p className="text-gray-600">Loading...</p>
//       </div>
//     </div>
//   );
// }

// // Role-based protected component
// function RoleProtected({ children, allowedRoles = [1, 2], requiresOnboarding = false }) {
//   const [isLoading, setIsLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     checkAuthAndProfile();
//   }, []);

//   const checkAuthAndProfile = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         setIsAuthenticated(false);
//         setIsLoading(false);
//         return;
//       }

//       const response = await api.get('/users/profile');
//       const userData = response.data;
      
//       setUser(userData);
//       setIsAuthenticated(true);
      
//     } catch (error) {
//       console.error('Error checking user status:', error);
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       setIsAuthenticated(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // Check if user has required role
//   if (!allowedRoles.includes(user.role)) {
//     // Redirect based on user's actual role
//     if (user.role === 2) {
//       return <Navigate to="/admin" replace />;
//     } else {
//       const isProfileComplete = user?.name && user?.isOnboardingComplete;
//       return <Navigate to={isProfileComplete ? "/dashboard" : "/onboarding"} replace />;
//     }
//   }

//   // For admin users, no need to check onboarding
//   if (user.role === 2) {
//     return typeof children === 'function' ? children(user) : children;
//   }

//   // For regular users, handle onboarding logic
//   const isProfileComplete = user?.name && user?.isOnboardingComplete;

//   if (requiresOnboarding && isProfileComplete) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   if (!requiresOnboarding && !isProfileComplete) {
//     return <Navigate to="/onboarding" replace />;
//   }

//   return typeof children === 'function' ? children(user) : children;
// }

// function App() {
//   return (
//     <NotificationProvider>
   
//     <Router>
//       <div className="App">
//         <Routes>
//           <Route path="/" element={<Signup />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/oauth-success" element={<OAuthSuccess />} />
//           <Route path="/settings" element={<Settings />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/oauth-2fa" element={<OAuth2FA />} />
//           <Route path="/project/:projectId" element={<project />} />
//           <Route path="/Error404Page" element={<Error404Page />} />
//           <Route path="/referral" element={<Referral />} />

//           {/* Admin route - only for role 2 */}
//           <Route 
//             path="/admin" 
//             element={
//               <RoleProtected allowedRoles={[2]}>
//                 {(user) => <Admin user={user} />}
//               </RoleProtected>
//             } 
//           />
          
//           {/* User dashboard - only for role 1 with complete profile */}
//           <Route 
//             path="/dashboard" 
//             element={
//               <RoleProtected allowedRoles={[1]} requiresOnboarding={false}>
//                 {(user) => <DashboardWrapper user={user} />}
//               </RoleProtected>
//             } 
//           />
          
//           {/* Onboarding - only for role 1 with incomplete profile */}
//           <Route 
//             path="/onboarding" 
//             element={
//               <RoleProtected allowedRoles={[1]} requiresOnboarding={true}>
//                 {(user) => <OnboardingPage user={user} />}
//               </RoleProtected>
//             } 
//           />
          
//           {/* Fallback redirect */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       </div>
//     </Router>
//     </NotificationProvider>
//   );
// }

// export default App;



import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Signup from './pages/Signup';
import Login from './pages/Login';
import OAuthSuccess from './pages/OAuthSuccess';
import DashboardWrapper from './pages/dashboard';
import OnboardingPage from './pages/Onboarding';
import Settings from './pages/settings';
import Admin from './pages/admin';
import ForgotPassword from './pages/forgot-password'; 
import api from './services/api';
import { NotificationProvider } from './components/NotificationPopup';
import OAuth2FA from './pages/OAuth2FA';
import project from './pages/project';
import Error404Page from './pages/error404page';
import Referral from './pages/referral';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import Home from './pages/home.js'
import Plans from './pages/plans.js';
import Billing from './pages/billing.js'
import Projects from './pages/projects.js'
import Analysis from './pages/analysis.js';
import FAQ from './pages/faq.js';
// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Layout wrapper to conditionally show navbar
function Layout({ children }) {
  const location = useLocation();
  
  // Define routes where navbar should be shown
  const showNavbarRoutes = ['/','/register', '/login', '/forgot-password'];
  const shouldShowNavbar = showNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
      {shouldShowNavbar && <Footer />}
    </>
  );
}

// Role-based protected component
function RoleProtected({ children, allowedRoles = [1, 2], requiresOnboarding = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndProfile();
  }, []);

  const checkAuthAndProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await api.get('/users/profile');
      const userData = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Error checking user status:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    if (user.role === 2) {
      return <Navigate to="/admin" replace />;
    } else {
      const isProfileComplete = user?.name && user?.isOnboardingComplete;
      return <Navigate to={isProfileComplete ? "/dashboard" : "/onboarding"} replace />;
    }
  }

  // For admin users, no need to check onboarding
  if (user.role === 2) {
    return typeof children === 'function' ? children(user) : children;
  }

  // For regular users, handle onboarding logic
  const isProfileComplete = user?.name && user?.isOnboardingComplete;

  if (requiresOnboarding && isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requiresOnboarding && !isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return typeof children === 'function' ? children(user) : children;
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/oauth-success" element={<OAuthSuccess />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/oauth-2fa" element={<OAuth2FA />} />
              <Route path="/project/:projectId" element={<project />} />
              <Route path="/Error404Page" element={<Error404Page />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/projects" element={<Projects />} />
              <Route path='/analysis/:projectId' element={<Analysis />} />
              <Route path="/faq" element={<FAQ />} />
              {/* Admin route - only for role 2 */}
              <Route 
                path="/admin" 
                element={
                  <RoleProtected allowedRoles={[2]}>
                    {(user) => <Admin user={user} />}
                  </RoleProtected>
                } 
              />
              
              {/* User dashboard - only for role 1 with complete profile */}
              <Route 
                path="/dashboard" 
                element={
                  <RoleProtected allowedRoles={[1]} requiresOnboarding={false}>
                    {(user) => <DashboardWrapper user={user} />}
                  </RoleProtected>
                } 
              />
              
              {/* Onboarding - only for role 1 with incomplete profile */}
              <Route 
                path="/onboarding" 
                element={
                  <RoleProtected allowedRoles={[1]} requiresOnboarding={true}>
                    {(user) => <OnboardingPage user={user} />}
                  </RoleProtected>
                } 
              />
              
              {/* Fallback redirect */}
              
            </Routes>
          </div>
        </Layout>
        
      </Router>
      
    </NotificationProvider>
  );
}

export default App;