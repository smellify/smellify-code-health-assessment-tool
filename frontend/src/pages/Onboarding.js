// //src/pages/Onboarding.js
// import { useState, useEffect } from 'react';
// import UserOnboarding from '../components/UserOnboarding';
// import api from '../services/api';

// export default function OnboardingPage() {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkUserStatus();
//   }, []);

//   const checkUserStatus = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         window.location.href = '/signin';
//         return;
//       }

//       const response = await api.get('/users/profile');
//       const userData = response.data;
      
//       // Check if user profile is complete
//       const isProfileComplete = userData.name && userData.isOnboardingComplete;
      
//       if (isProfileComplete) {
//         // Profile is complete - redirect immediately without showing onboarding
//         window.location.href = '/dashboard';
//         return;
//       }
      
//       // Profile is incomplete - set user data and stop loading
//       setUser(userData);
      
//     } catch (error) {
//       console.error('Error checking user status:', error);
//       // Token is invalid, redirect to login
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/signin';
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOnboardingComplete = async () => {
//     try {
//       await api.post('/users/complete-onboarding');
//       window.location.href = '/dashboard';
//     } catch (error) {
//       console.error('Error completing onboarding:', error);
//     }
//   };

//   const handleOnboardingSkip = async () => {
//     try {
//       await api.post('/users/complete-onboarding');
//       window.location.href = '/dashboard';
//     } catch (error) {
//       console.error('Error skipping onboarding:', error);
//     }
//   };

//   // Show loading while checking user status
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // If we reach here, profile is incomplete - show onboarding
//   return (
//     <UserOnboarding
//       user={user}
//       onComplete={handleOnboardingComplete}
//       onSkip={handleOnboardingSkip}
//     />
//   );
// }

import { useState, useEffect } from 'react';
import UserOnboarding from '../components/UserOnboarding';
import api from '../services/api';

export default function OnboardingPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await api.get('/users/profile');
      const userData = response.data;
      
      const isProfileComplete = userData.name && userData.isOnboardingComplete;
      
      if (isProfileComplete) {
        window.location.href = '/dashboard';
        return;
      }
      
      setUser(userData);
      
    } catch (error) {
      console.error('Error checking user status:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async (showTour = false) => {
    try {
      await api.post('/users/complete-onboarding');
      window.location.href = showTour ? '/dashboard?tour=true' : '/dashboard';
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await api.post('/users/complete-onboarding');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UserOnboarding
      user={user}
      onComplete={handleOnboardingComplete}
      onSkip={handleOnboardingSkip}
    />
  );
}