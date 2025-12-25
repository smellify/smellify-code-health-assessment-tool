// import React, { useState, useEffect } from "react";
// import {
//   CreditCard,
//   Download,
//   Calendar,
//   Package,
//   DollarSign,
// } from "lucide-react";
// import api from "../services/api";

// export default function Billing() {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalSpent: 0,
//     totalCreditsEarned: 0,
//     remainingScans: 0,
//   });

//   useEffect(() => {
//     fetchBillingData();
//   }, []);

//   const fetchBillingData = async () => {
//     try {
//       setLoading(true);
//       const [historyRes, currentRes] = await Promise.all([
//         api.get("/billing/history"),
//         api.get("/billing/current"),
//       ]);

//       setTransactions(historyRes.data.transactions);
//       setStats({
//         totalSpent: historyRes.data.totalSpent,
//         totalCreditsEarned: historyRes.data.totalCreditsEarned,
//         remainingScans: currentRes.data.remainingScans,
//       });
//     } catch (error) {
//       console.error("Failed to fetch billing data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "completed":
//         return "bg-green-100 text-green-700";
//       case "pending":
//         return "bg-yellow-100 text-yellow-700";
//       case "failed":
//         return "bg-red-100 text-red-700";
//       case "refunded":
//         return "bg-gray-100 text-gray-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading billing history...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">
//             Billing History
//           </h1>
//           <p className="text-gray-600">View and manage your transactions</p>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <div
//                 className="w-12 h-12 rounded-lg flex items-center justify-center"
//                 style={{ backgroundColor: "#5A33FF" }}
//               >
//                 <DollarSign className="w-6 h-6 text-white" />
//               </div>
//             </div>

//             <p className="text-sm text-gray-600 mb-1">Total Spent</p>
//             <p className="text-3xl font-bold text-gray-900">
//               ${stats.totalSpent.toFixed(2)}
//             </p>
//           </div>

//           <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
//                 <Package className="w-6 h-6 text-yellow-600" />
//               </div>
//             </div>
//             <p className="text-sm text-gray-600 mb-1">Total Credits Bought</p>
//             <p className="text-3xl font-bold text-gray-900">
//               {stats.totalCreditsEarned}
//             </p>
//           </div>

//           <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
//                 <CreditCard className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//             <p className="text-sm text-gray-600 mb-1">Remaining Credits</p>
//             <p className="text-3xl font-bold text-gray-900">
//               {stats.remainingScans}
//             </p>
//           </div>
//         </div>

//         {/* Transactions Table */}
//         <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
//           <div
//             className="px-6 py-4 border-b border-purple-700"
//             style={{ backgroundColor: "#5A33FF" }}
//           >
//             <h2 className="text-xl font-bold text-white">
//               Transaction History
//             </h2>
//           </div>

//           {transactions.length === 0 ? (
//             <div className="text-center py-12">
//               <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//               <p className="text-gray-500 text-lg">No transactions yet</p>
//               <p className="text-gray-400 text-sm">
//                 Your purchase history will appear here
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Transaction ID
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Package
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Amount
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Credits
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                       Payment
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {transactions.map((transaction) => (
//                     <tr
//                       key={transaction.transactionId}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <p className="text-sm font-mono text-gray-900">
//                           {transaction.transactionId}
//                         </p>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div>
//                           <p className="text-sm font-semibold text-gray-900">
//                             {transaction.packageName}
//                           </p>
//                           {transaction.quantity > 1 && (
//                             <p className="text-xs text-gray-500">
//                               Qty: {transaction.quantity}
//                             </p>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <p className="text-sm font-semibold text-gray-900">
//                           ${transaction.amount.toFixed(2)}
//                         </p>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
//                           style={{ backgroundColor: "#5A33FF" }}
//                         >
//                           +{transaction.creditsAdded} credits
//                         </span>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
//                             transaction.status
//                           )}`}
//                         >
//                           {transaction.status.charAt(0).toUpperCase() +
//                             transaction.status.slice(1)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center gap-2 text-sm text-gray-600">
//                           <Calendar className="w-4 h-4" />
//                           {formatDate(transaction.createdAt)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center gap-2">
//                           <CreditCard className="w-4 h-4 text-gray-400" />
//                           <span className="text-sm text-gray-600">
//                             ****{transaction.paymentMethod.cardLastFour}
//                           </span>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Back to Plans */}
//         <div className="mt-8 text-center">
//           <a
//             href="/plans"
//             className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
//             style={{ backgroundColor: "#5A33FF" }}
//           >
//             <Package className="w-5 h-5" />
//             View Available Plans
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  Calendar,
  Package,
  DollarSign,
  Gem,
  Receipt,
  Settings,
  Menu,
  BarChart3,
  Activity,
  LogOut,
  UserPlus,
  X,
  HelpCircle,
} from "lucide-react";
import api from "../services/api";

export default function Billing() {
  const [user, setUser] = useState({ name: '', remainingScans: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalCreditsEarned: 0,
    remainingScans: 0,
  });

  const transactionsPerPage = 5;
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  useEffect(() => {
    checkUserStatus();
    fetchBillingData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };
    
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await api.get('/users/profile');
      const userData = response.data;
      
      setUser({
        name: userData.name || '',
        remainingScans: userData.remainingScans || 0,
        ...userData
      });
      
    } catch (error) {
      console.error('Error checking user status:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
  };

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [historyRes, currentRes] = await Promise.all([
        api.get("/billing/history"),
        api.get("/billing/current"),
      ]);

      setTransactions(historyRes.data.transactions);
      setCurrentPage(1); // Reset to first page when data is fetched
      setStats({
        totalSpent: historyRes.data.totalSpent,
        totalCreditsEarned: historyRes.data.totalCreditsEarned,
        remainingScans: currentRes.data.remainingScans,
      });
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-100 border border-green-200";
      case "pending":
        return "text-amber-700 bg-amber-100 border border-amber-200";
      case "failed":
        return "text-red-700 bg-red-100 border border-red-200";
      case "refunded":
        return "text-gray-700 bg-gray-100 border border-gray-200";
      default:
        return "text-gray-700 bg-gray-100 border border-gray-200";
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed lg:sticky lg:top-0 lg:self-stretch h-screen z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-bold text-sm">
              <img 
                src="/bug.png" 
                alt="Bug Icon" 
                className="w-7 h-7 object-contain"
              />
            </div>
            {sidebarOpen && (
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-[#5A33FF] to-[#7C5CFF] bg-clip-text text-transparent">
                Smellify
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <div className="mb-6">
            {sidebarOpen && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
            )}
            <div className="space-y-1">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Dashboard</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/projects'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Projects</span>}
              </button>
              <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Activity className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Analysis</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/plans'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Gem className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Plans</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/billing'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg"
              >
                <Receipt className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Billing</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/faq'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">FAQ</span>}
              </button>
            </div>
          </div>
        </nav>

        {/* Desktop Toggle Button */}
        <div className="hidden lg:block px-3 pb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
              Billing History
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#4A23EF] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A33FF]"
              >
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/referral';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-3 text-gray-500" />
                    Referrals
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/settings';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Billing Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">Loading billing history...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Spent</p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        ${stats.totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-[#5A33FF]" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Credits Bought</p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {stats.totalCreditsEarned}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <Package className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Remaining Credits</p>
                      <p className="text-2xl lg:text-3xl font-bold text-green-600">
                        {stats.remainingScans}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    Transaction History
                  </h2>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">No transactions yet</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Your purchase history will appear here
                    </p>
                    <button
                      onClick={() => window.location.href = '/plans'}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View Available Plans
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Package
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentTransactions.map((transaction) => (
                          <tr
                            key={transaction.transactionId}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-mono text-gray-900">
                                {transaction.transactionId}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {transaction.packageName}
                                </p>
                                {transaction.quantity > 1 && (
                                  <p className="text-xs text-gray-500">
                                    Qty: {transaction.quantity}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-semibold text-gray-900">
                                ${transaction.amount.toFixed(2)}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-[#5A33FF]">
                                +{transaction.creditsAdded} credits
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {formatDate(transaction.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  ****{transaction.paymentMethod.cardLastFour}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {transactions.length > 0 && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-[#5A33FF] text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Back to Plans */}
              {/* {transactions.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => window.location.href = '/plans'}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#5A33FF] hover:bg-[#4A23EF] rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    View Available Plans
                  </button>
                </div>
              )} */}
            </>
          )}
        </main>
      </div>
    </div>
  );
}