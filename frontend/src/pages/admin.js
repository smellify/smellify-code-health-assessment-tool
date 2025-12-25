// import React, { useState, useEffect } from 'react';
// import { 
//   Users, 
//   Shield, 
//   Activity, 
//   UserX, 
//   Search, 
//   Filter, 
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   MoreVertical,
//   Ban,
//   Unlock,
//   Trash2,
//   Crown,
//   LogOut,
//   Eye,
//   Zap,
//   TrendingUp,
//   Clock,
//   Github,
//   Database,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   RefreshCw
// } from 'lucide-react';

// // API base URL - adjust as needed
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// export default function Admin() {
//   // State management
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [dashboardData, setDashboardData] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [sessions, setSessions] = useState([]);
//   const [deletedAccounts, setDeletedAccounts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
  
//   // Pagination & filtering
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [sortBy, setSortBy] = useState('createdAt');
//   const [sortOrder, setSortOrder] = useState('desc');
  
//   // Modal states
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showUserDetails, setShowUserDetails] = useState(false);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [confirmAction, setConfirmAction] = useState(null);
//   const [actionReason, setActionReason] = useState('');
  
//   // Scan management
//   const [scanAmount, setScanAmount] = useState(0);
//   const [scanOperation, setScanOperation] = useState('set');
  
//   // Connection status
//   const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, error

//   // Get auth token
//   const getAuthToken = () => localStorage.getItem('token');
  
//   // Check initial connection and auth
//   useEffect(() => {
//     const checkConnection = async () => {
//       const token = getAuthToken();
//       if (!token) {
//         setConnectionStatus('error');
//         setError('No authentication token found. Please sign in.');
//         setTimeout(() => {
//           window.location.href = '/signin';
//         }, 2000);
//         return;
//       }
      
//       try {
//         // Try a simple API call to check connection
//         await apiCall('/admin/dashboard');
//         setConnectionStatus('connected');
//       } catch (err) {
//         setConnectionStatus('error');
//         console.error('Connection check failed:', err);
//       }
//     };
    
//     checkConnection();
//   }, []);

//   // API call helper
//   const apiCall = async (endpoint, method = 'GET', body = null) => {
//     const token = getAuthToken();
    
//     if (!token) {
//       throw new Error('No authentication token found. Please sign in again.');
//     }
    
//     const options = {
//       method,
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       }
//     };
    
//     if (body) {
//       options.body = JSON.stringify(body);
//     }
    
//     try {
//       const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      
//       // Check if response is JSON
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         // Server returned HTML or other non-JSON content
//         const text = await response.text();
//         console.error('Non-JSON response:', text);
//         throw new Error('Server error: Expected JSON but received HTML. Check if the API endpoint exists and is running.');
//       }
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         // Handle different error codes
//         if (response.status === 401) {
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           window.location.href = '/signin';
//           throw new Error('Session expired. Please sign in again.');
//         }
        
//         if (response.status === 403) {
//           throw new Error(data.message || 'Access denied. Admin privileges required.');
//         }
        
//         throw new Error(data.message || `API error: ${response.status}`);
//       }
      
//       return data;
//     } catch (error) {
//       // Network error or other issues
//       if (error.message.includes('Failed to fetch')) {
//         throw new Error('Cannot connect to server. Please check if the backend is running.');
//       }
//       throw error;
//     }
//   };

//   // Fetch dashboard data
//   const fetchDashboard = async () => {
//     try {
//       setLoading(true);
//       const data = await apiCall('/admin/dashboard');
//       setDashboardData(data.data);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch users with filters
//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: currentPage,
//         limit: 20,
//         search: searchQuery,
//         status: statusFilter,
//         sortBy,
//         sortOrder
//       });
      
//       const data = await apiCall(`/admin/users?${params}`);
//       setUsers(data.data.users);
//       setTotalPages(data.data.pagination.totalPages);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch sessions
//   const fetchSessions = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: currentPage,
//         limit: 50
//       });
      
//       const data = await apiCall(`/admin/sessions?${params}`);
//       setSessions(data.data.sessions);
//       setTotalPages(data.data.pagination.totalPages);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch deleted accounts
//   const fetchDeletedAccounts = async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({
//         page: currentPage,
//         limit: 20,
//         search: searchQuery
//       });
      
//       const data = await apiCall(`/admin/deleted-accounts?${params}`);
//       setDeletedAccounts(data.data.deletedAccounts);
//       setTotalPages(data.data.pagination.totalPages);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // User actions
//   const banUser = async (userId, reason) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}/ban`, 'PUT', { reason });
//       setSuccess('User banned successfully');
//       fetchUsers();
//       setShowConfirmModal(false);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const unbanUser = async (userId) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}/unban`, 'PUT');
//       setSuccess('User unbanned successfully');
//       fetchUsers();
//       setShowConfirmModal(false);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteUser = async (userId, reason) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}`, 'DELETE', { reason });
//       setSuccess('User deleted successfully');
//       fetchUsers();
//       setShowConfirmModal(false);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateUserRole = async (userId, role) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}/role`, 'PUT', { role });
//       setSuccess('User role updated successfully');
//       fetchUsers();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateUserScans = async (userId, scans, operation) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}/scans`, 'PUT', { scans, operation });
//       setSuccess('User scans updated successfully');
//       if (showUserDetails) {
//         fetchUserDetails(userId);
//       }
//       fetchUsers();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteSession = async (sessionId) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/sessions/${sessionId}`, 'DELETE');
//       setSuccess('Session deleted successfully');
//       fetchSessions();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteAllUserSessions = async (userId) => {
//     try {
//       setLoading(true);
//       await apiCall(`/admin/users/${userId}/sessions`, 'DELETE');
//       setSuccess('All user sessions deleted successfully');
//       fetchSessions();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserDetails = async (userId) => {
//     try {
//       setLoading(true);
//       const data = await apiCall(`/admin/users/${userId}`);
//       setSelectedUser(data.data);
//       setShowUserDetails(true);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load data based on active tab
//   useEffect(() => {
//     if (activeTab === 'dashboard') {
//       fetchDashboard();
//     } else if (activeTab === 'users') {
//       fetchUsers();
//     } else if (activeTab === 'sessions') {
//       fetchSessions();
//     } else if (activeTab === 'deleted') {
//       fetchDeletedAccounts();
//     }
//   }, [activeTab, currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

//   // Auto-dismiss notifications
//   useEffect(() => {
//     if (success) {
//       const timer = setTimeout(() => setSuccess(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success]);

//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   // Sign out handler
//   const handleSignOut = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     window.location.href = '/signin';
//   };

//   // Confirm action modal
//   const openConfirmModal = (action, user) => {
//     setConfirmAction({ type: action, user });
//     setShowConfirmModal(true);
//     setActionReason('');
//   };

//   const executeConfirmAction = () => {
//     if (!confirmAction) return;
    
//     const { type, user } = confirmAction;
    
//     switch (type) {
//       case 'ban':
//         banUser(user._id, actionReason);
//         break;
//       case 'unban':
//         unbanUser(user._id);
//         break;
//       case 'delete':
//         deleteUser(user._id, actionReason);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       {/* Animated background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
//         <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
//         <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
//       </div>

//       {/* Notifications */}
//       {success && (
//         <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slideIn">
//           <CheckCircle size={20} />
//           <span className="font-medium">{success}</span>
//         </div>
//       )}
      
//       {error && (
//         <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slideIn">
//           <XCircle size={20} />
//           <span className="font-medium">{error}</span>
//         </div>
//       )}
      
//       {/* Connection Status Banner */}
//       {connectionStatus === 'error' && (
//         <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-2xl">
//           <AlertCircle size={20} />
//           <div>
//             <p className="font-medium">Connection Error</p>
//             <p className="text-sm opacity-90">Cannot connect to API. Check if backend is running at: {API_BASE_URL}</p>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <header className="relative border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/30">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="relative">
//                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-lg opacity-50"></div>
//                 <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
//                   <Shield className="text-white" size={28} />
//                 </div>
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
//                   Admin Control Panel
//                 </h1>
//                 <p className="text-slate-400 text-sm">System Management Dashboard</p>
//               </div>
//             </div>
            
//             <button
//               onClick={handleSignOut}
//               className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/50 rounded-lg text-slate-300 hover:text-red-400 transition-all duration-200"
//             >
//               <LogOut size={18} />
//               <span className="font-medium">Sign Out</span>
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Navigation Tabs */}
//       <nav className="relative border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/20">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="flex gap-1">
//             {[
//               { id: 'dashboard', label: 'Dashboard', icon: Activity },
//               { id: 'users', label: 'Users', icon: Users },
//               { id: 'sessions', label: 'Sessions', icon: Clock },
//               { id: 'deleted', label: 'Deleted Accounts', icon: UserX }
//             ].map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => {
//                   setActiveTab(tab.id);
//                   setCurrentPage(1);
//                   setSearchQuery('');
//                 }}
//                 className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 relative group ${
//                   activeTab === tab.id
//                     ? 'text-cyan-400'
//                     : 'text-slate-400 hover:text-slate-200'
//                 }`}
//               >
//                 <tab.icon size={18} />
//                 <span>{tab.label}</span>
//                 {activeTab === tab.id && (
//                   <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="relative max-w-7xl mx-auto px-6 py-8">
//         {loading && (
//           <div className="flex items-center justify-center py-12">
//             <RefreshCw className="animate-spin text-cyan-400" size={32} />
//           </div>
//         )}

//         {!loading && activeTab === 'dashboard' && dashboardData && (
//           <DashboardView data={dashboardData} />
//         )}

//         {!loading && activeTab === 'users' && (
//           <UsersView
//             users={users}
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             statusFilter={statusFilter}
//             setStatusFilter={setStatusFilter}
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//             onViewDetails={fetchUserDetails}
//             onBan={(user) => openConfirmModal('ban', user)}
//             onUnban={(user) => openConfirmModal('unban', user)}
//             onDelete={(user) => openConfirmModal('delete', user)}
//             onUpdateRole={updateUserRole}
//             onUpdateScans={updateUserScans}
//           />
//         )}

//         {!loading && activeTab === 'sessions' && (
//           <SessionsView
//             sessions={sessions}
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//             onDeleteSession={deleteSession}
//             onDeleteAllUserSessions={deleteAllUserSessions}
//           />
//         )}

//         {!loading && activeTab === 'deleted' && (
//           <DeletedAccountsView
//             accounts={deletedAccounts}
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//           />
//         )}
//       </main>

//       {/* User Details Modal */}
//       {showUserDetails && selectedUser && (
//         <UserDetailsModal
//           user={selectedUser}
//           onClose={() => {
//             setShowUserDetails(false);
//             setSelectedUser(null);
//           }}
//           onUpdateScans={updateUserScans}
//           onDeleteSession={deleteSession}
//         />
//       )}

//       {/* Confirm Action Modal */}
//       {showConfirmModal && confirmAction && (
//         <ConfirmModal
//           action={confirmAction}
//           reason={actionReason}
//           setReason={setActionReason}
//           onConfirm={executeConfirmAction}
//           onCancel={() => {
//             setShowConfirmModal(false);
//             setConfirmAction(null);
//             setActionReason('');
//           }}
//         />
//       )}

//       <style jsx>{`
//         @keyframes blob {
//           0%, 100% {
//             transform: translate(0px, 0px) scale(1);
//           }
//           33% {
//             transform: translate(30px, -50px) scale(1.1);
//           }
//           66% {
//             transform: translate(-20px, 20px) scale(0.9);
//           }
//         }
        
//         .animate-blob {
//           animation: blob 7s infinite;
//         }
        
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
        
//         .animation-delay-4000 {
//           animation-delay: 4s;
//         }
        
//         @keyframes slideIn {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
        
//         .animate-slideIn {
//           animation: slideIn 0.3s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// }

// // Dashboard View Component
// function DashboardView({ data }) {
//   const { statistics, recentActivity } = data;
  
//   return (
//     <div className="space-y-6">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Users"
//           value={statistics.users.total}
//           icon={Users}
//           gradient="from-cyan-500 to-blue-500"
//           details={[
//             { label: 'Active', value: statistics.users.active },
//             { label: 'Banned', value: statistics.users.banned }
//           ]}
//         />
        
//         <StatCard
//           title="Verified Users"
//           value={statistics.users.verified}
//           icon={CheckCircle}
//           gradient="from-emerald-500 to-green-500"
//           details={[
//             { label: 'Verification Rate', value: `${Math.round((statistics.users.verified / statistics.users.total) * 100)}%` }
//           ]}
//         />
        
//         <StatCard
//           title="Active Sessions"
//           value={statistics.sessions.activeLast24Hours}
//           icon={Activity}
//           gradient="from-violet-500 to-purple-500"
//           details={[
//             { label: 'Total', value: statistics.sessions.total }
//           ]}
//         />
        
//         <StatCard
//           title="GitHub Linked"
//           value={statistics.users.githubLinked}
//           icon={Github}
//           gradient="from-orange-500 to-red-500"
//           details={[
//             { label: 'Link Rate', value: `${Math.round((statistics.users.githubLinked / statistics.users.total) * 100)}%` }
//           ]}
//         />
//       </div>

//       {/* Recent Activity */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <ActivityCard title="Recent Users" icon={Users} items={recentActivity.recentUsers} type="users" />
//         <ActivityCard title="Recent Deletions" icon={UserX} items={recentActivity.recentDeletions} type="deletions" />
//       </div>
//     </div>
//   );
// }

// // Stat Card Component
// function StatCard({ title, value, icon: Icon, gradient, details }) {
//   return (
//     <div className="relative group">
//       <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-200`}></div>
//       <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors duration-200">
//         <div className="flex items-start justify-between mb-4">
//           <div className={`bg-gradient-to-r ${gradient} p-3 rounded-lg`}>
//             <Icon className="text-white" size={24} />
//           </div>
//         </div>
//         <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
//         <p className="text-3xl font-bold text-white mb-3">{value.toLocaleString()}</p>
//         {details && (
//           <div className="flex flex-wrap gap-3 text-xs">
//             {details.map((detail, idx) => (
//               <div key={idx} className="text-slate-400">
//                 <span className="text-slate-500">{detail.label}:</span> {detail.value}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Activity Card Component
// function ActivityCard({ title, icon: Icon, items, type }) {
//   return (
//     <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
//       <div className="flex items-center gap-3 mb-4">
//         <Icon className="text-cyan-400" size={20} />
//         <h3 className="text-lg font-semibold text-white">{title}</h3>
//       </div>
//       <div className="space-y-3">
//         {items && items.length > 0 ? items.map((item, idx) => (
//           <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
//             <div>
//               <p className="text-white font-medium">{item.email || item.name}</p>
//               {type === 'users' && (
//                 <p className="text-slate-400 text-sm">
//                   {item.isVerified ? '✓ Verified' : '○ Unverified'} · 
//                   {item.isActive ? ' Active' : ' Banned'}
//                 </p>
//               )}
//               {type === 'deletions' && item.reason && (
//                 <p className="text-slate-400 text-sm">{item.reason}</p>
//               )}
//             </div>
//             <div className="text-slate-500 text-sm">
//               {new Date(item.createdAt || item.deletedAt).toLocaleDateString()}
//             </div>
//           </div>
//         )) : (
//           <p className="text-slate-500 text-center py-4">No recent activity</p>
//         )}
//       </div>
//     </div>
//   );
// }

// // Users View Component
// function UsersView({
//   users,
//   searchQuery,
//   setSearchQuery,
//   statusFilter,
//   setStatusFilter,
//   currentPage,
//   totalPages,
//   setCurrentPage,
//   onViewDetails,
//   onBan,
//   onUnban,
//   onDelete,
//   onUpdateRole,
//   onUpdateScans
// }) {
//   const [actionMenuOpen, setActionMenuOpen] = useState(null);

//   return (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
//             />
//           </div>
          
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
//           >
//             <option value="all">All Users</option>
//             <option value="active">Active Only</option>
//             <option value="banned">Banned Only</option>
//             <option value="verified">Verified Only</option>
//             <option value="unverified">Unverified Only</option>
//           </select>
          
//           <div className="flex items-center gap-2 text-slate-400 text-sm">
//             <Filter size={16} />
//             <span>Showing {users.length} users</span>
//           </div>
//         </div>
//       </div>

//       {/* Users Table */}
//       <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-800/50 border-b border-slate-700">
//               <tr>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">User</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Status</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Role</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Scans</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Joined</th>
//                 <th className="text-right px-6 py-4 text-slate-300 font-semibold text-sm">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map((user) => (
//                 <tr key={user._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
//                   <td className="px-6 py-4">
//                     <div>
//                       <p className="text-white font-medium">{user.name || 'N/A'}</p>
//                       <p className="text-slate-400 text-sm">{user.email}</p>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex flex-col gap-1">
//                       <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${
//                         user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
//                       }`}>
//                         {user.isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
//                         {user.isActive ? 'Active' : 'Banned'}
//                       </span>
//                       {user.isVerified && (
//                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 w-fit">
//                           <CheckCircle size={12} />
//                           Verified
//                         </span>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
//                       user.role === 2 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'
//                     }`}>
//                       {user.role === 2 ? <Crown size={12} /> : <Users size={12} />}
//                       {user.role === 2 ? 'Admin' : 'User'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="text-white font-medium">{user.remainingScans || 0}</span>
//                   </td>
//                   <td className="px-6 py-4 text-slate-400 text-sm">
//                     {new Date(user.createdAt).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center justify-end gap-2">
//                       <button
//                         onClick={() => onViewDetails(user._id)}
//                         className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
//                         title="View Details"
//                       >
//                         <Eye size={18} />
//                       </button>
                      
//                       <div className="relative">
//                         <button
//                           onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
//                           className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
//                         >
//                           <MoreVertical size={18} />
//                         </button>
                        
//                         {actionMenuOpen === user._id && (
//                           <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
//                             <button
//                               onClick={() => {
//                                 user.isActive ? onBan(user) : onUnban(user);
//                                 setActionMenuOpen(null);
//                               }}
//                               className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 first:rounded-t-lg flex items-center gap-2"
//                             >
//                               {user.isActive ? <Ban size={14} /> : <Unlock size={14} />}
//                               {user.isActive ? 'Ban User' : 'Unban User'}
//                             </button>
                            
//                             <button
//                               onClick={() => {
//                                 onUpdateRole(user._id, user.role === 2 ? 1 : 2);
//                                 setActionMenuOpen(null);
//                               }}
//                               className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
//                             >
//                               <Crown size={14} />
//                               {user.role === 2 ? 'Remove Admin' : 'Make Admin'}
//                             </button>
                            
//                             <button
//                               onClick={() => {
//                                 onDelete(user);
//                                 setActionMenuOpen(null);
//                               }}
//                               className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 last:rounded-b-lg flex items-center gap-2"
//                             >
//                               <Trash2 size={14} />
//                               Delete User
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Pagination */}
//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//       />
//     </div>
//   );
// }

// // Sessions View Component
// function SessionsView({
//   sessions,
//   currentPage,
//   totalPages,
//   setCurrentPage,
//   onDeleteSession,
//   onDeleteAllUserSessions
// }) {
//   return (
//     <div className="space-y-6">
//       <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-800/50 border-b border-slate-700">
//               <tr>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">User</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Device</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">IP Address</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Last Active</th>
//                 <th className="text-right px-6 py-4 text-slate-300 font-semibold text-sm">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {sessions.map((session) => (
//                 <tr key={session._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
//                   <td className="px-6 py-4">
//                     {session.userId && (
//                       <div>
//                         <p className="text-white font-medium">{session.userId.name || 'N/A'}</p>
//                         <p className="text-slate-400 text-sm">{session.userId.email}</p>
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4">
//                     {session.deviceInfo && (
//                       <div>
//                         <p className="text-white text-sm">{session.deviceInfo.browser || 'Unknown'}</p>
//                         <p className="text-slate-400 text-xs">{session.deviceInfo.os || 'Unknown OS'}</p>
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 text-slate-300 text-sm">{session.ipAddress || 'N/A'}</td>
//                   <td className="px-6 py-4 text-slate-400 text-sm">
//                     {new Date(session.lastActive).toLocaleString()}
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center justify-end gap-2">
//                       <button
//                         onClick={() => onDeleteSession(session.sessionId)}
//                         className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-colors"
//                       >
//                         End Session
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//       />
//     </div>
//   );
// }

// // Deleted Accounts View Component
// function DeletedAccountsView({
//   accounts,
//   searchQuery,
//   setSearchQuery,
//   currentPage,
//   totalPages,
//   setCurrentPage
// }) {
//   return (
//     <div className="space-y-6">
//       {/* Search */}
//       <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
//           <input
//             type="text"
//             placeholder="Search deleted accounts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
//           />
//         </div>
//       </div>

//       {/* Accounts Table */}
//       <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-800/50 border-b border-slate-700">
//               <tr>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Email</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Reason</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">Deleted At</th>
//                 <th className="text-left px-6 py-4 text-slate-300 font-semibold text-sm">IP</th>
//               </tr>
//             </thead>
//             <tbody>
//               {accounts.map((account) => (
//                 <tr key={account._id} className="border-b border-slate-800/50">
//                   <td className="px-6 py-4 text-white font-medium">{account.email}</td>
//                   <td className="px-6 py-4 text-slate-400 text-sm">{account.reason || 'No reason provided'}</td>
//                   <td className="px-6 py-4 text-slate-400 text-sm">
//                     {new Date(account.deletedAt).toLocaleString()}
//                   </td>
//                   <td className="px-6 py-4 text-slate-400 text-sm">{account.deletedIp || 'N/A'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//       />
//     </div>
//   );
// }

// // Pagination Component
// function Pagination({ currentPage, totalPages, onPageChange }) {
//   return (
//     <div className="flex items-center justify-center gap-2">
//       <button
//         onClick={() => onPageChange(currentPage - 1)}
//         disabled={currentPage === 1}
//         className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//       >
//         <ChevronLeft size={18} />
//       </button>
      
//       <div className="flex items-center gap-2">
//         {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//           let pageNum;
//           if (totalPages <= 5) {
//             pageNum = i + 1;
//           } else if (currentPage <= 3) {
//             pageNum = i + 1;
//           } else if (currentPage >= totalPages - 2) {
//             pageNum = totalPages - 4 + i;
//           } else {
//             pageNum = currentPage - 2 + i;
//           }
          
//           return (
//             <button
//               key={pageNum}
//               onClick={() => onPageChange(pageNum)}
//               className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                 currentPage === pageNum
//                   ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
//                   : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700'
//               }`}
//             >
//               {pageNum}
//             </button>
//           );
//         })}
//       </div>
      
//       <button
//         onClick={() => onPageChange(currentPage + 1)}
//         disabled={currentPage === totalPages}
//         className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//       >
//         <ChevronRight size={18} />
//       </button>
      
//       <span className="ml-4 text-slate-400 text-sm">
//         Page {currentPage} of {totalPages}
//       </span>
//     </div>
//   );
// }

// // User Details Modal
// function UserDetailsModal({ user, onClose, onUpdateScans, onDeleteSession }) {
//   const [scanAmount, setScanAmount] = useState(0);
//   const [scanOperation, setScanOperation] = useState('set');
  
//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700 px-6 py-4">
//           <div className="flex items-center justify-between">
//             <h2 className="text-2xl font-bold text-white">User Details</h2>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
//             >
//               <XCircle size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
//           <div className="space-y-6">
//             {/* User Info */}
//             <div className="grid grid-cols-2 gap-4">
//               <InfoField label="Name" value={user.user.name || 'N/A'} />
//               <InfoField label="Email" value={user.user.email} />
//               <InfoField label="Phone" value={user.user.phoneNumber || 'N/A'} />
//               <InfoField label="Company" value={user.user.company || 'N/A'} />
//               <InfoField label="Role" value={user.user.role === 2 ? 'Admin' : 'User'} />
//               <InfoField label="Status" value={user.user.isActive ? 'Active' : 'Banned'} />
//               <InfoField label="Verified" value={user.user.isVerified ? 'Yes' : 'No'} />
//               <InfoField label="GitHub ID" value={user.user.githubId || 'Not linked'} />
//             </div>

//             {/* Scan Management */}
//             <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//               <h3 className="text-white font-semibold mb-4">Manage Scans</h3>
//               <div className="flex items-end gap-3">
//                 <div className="flex-1">
//                   <label className="block text-slate-400 text-sm mb-2">Amount</label>
//                   <input
//                     type="number"
//                     value={scanAmount}
//                     onChange={(e) => setScanAmount(parseInt(e.target.value) || 0)}
//                     className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <label className="block text-slate-400 text-sm mb-2">Operation</label>
//                   <select
//                     value={scanOperation}
//                     onChange={(e) => setScanOperation(e.target.value)}
//                     className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
//                   >
//                     <option value="set">Set</option>
//                     <option value="add">Add</option>
//                     <option value="subtract">Subtract</option>
//                   </select>
//                 </div>
//                 <button
//                   onClick={() => {
//                     onUpdateScans(user.user._id, scanAmount, scanOperation);
//                     setScanAmount(0);
//                   }}
//                   className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-medium transition-colors"
//                 >
//                   Update
//                 </button>
//               </div>
//               <p className="text-slate-400 text-sm mt-2">
//                 Current: {user.user.remainingScans || 0} scans
//               </p>
//             </div>

//             {/* Sessions */}
//             {user.sessions && user.sessions.length > 0 && (
//               <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//                 <h3 className="text-white font-semibold mb-4">Active Sessions ({user.sessions.length})</h3>
//                 <div className="space-y-3">
//                   {user.sessions.map((session) => (
//                     <div key={session._id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
//                       <div>
//                         <p className="text-white text-sm">
//                           {session.deviceInfo?.browser} on {session.deviceInfo?.os}
//                         </p>
//                         <p className="text-slate-400 text-xs">
//                           {session.ipAddress} · Last active: {new Date(session.lastActive).toLocaleString()}
//                         </p>
//                       </div>
//                       <button
//                         onClick={() => onDeleteSession(session.sessionId)}
//                         className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 text-xs font-medium transition-colors"
//                       >
//                         End
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* GitHub History */}
//             {user.user.githubIdHistory && user.user.githubIdHistory.length > 0 && (
//               <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
//                 <h3 className="text-white font-semibold mb-4">GitHub History</h3>
//                 <div className="space-y-2">
//                   {user.user.githubIdHistory.map((gh, idx) => (
//                     <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
//                       <div>
//                         <p className="text-white text-sm">{gh.username}</p>
//                         <p className="text-slate-400 text-xs">ID: {gh.githubId}</p>
//                       </div>
//                       <span className={`px-2 py-1 rounded text-xs ${
//                         gh.isCurrentlyLinked
//                           ? 'bg-emerald-500/20 text-emerald-400'
//                           : 'bg-slate-700 text-slate-400'
//                       }`}>
//                         {gh.isCurrentlyLinked ? 'Current' : 'Unlinked'}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Info Field Component
// function InfoField({ label, value }) {
//   return (
//     <div>
//       <p className="text-slate-400 text-sm mb-1">{label}</p>
//       <p className="text-white font-medium">{value}</p>
//     </div>
//   );
// }

// // Confirm Modal Component
// function ConfirmModal({ action, reason, setReason, onConfirm, onCancel }) {
//   const getActionDetails = () => {
//     switch (action.type) {
//       case 'ban':
//         return {
//           title: 'Ban User',
//           description: `Are you sure you want to ban ${action.user.email}? This will deactivate their account and log them out from all devices.`,
//           confirmText: 'Ban User',
//           confirmClass: 'bg-red-500 hover:bg-red-600',
//           requiresReason: true
//         };
//       case 'unban':
//         return {
//           title: 'Unban User',
//           description: `Are you sure you want to unban ${action.user.email}? This will restore their access.`,
//           confirmText: 'Unban User',
//           confirmClass: 'bg-emerald-500 hover:bg-emerald-600',
//           requiresReason: false
//         };
//       case 'delete':
//         return {
//           title: 'Delete User',
//           description: `Are you sure you want to permanently delete ${action.user.email}? This action cannot be undone.`,
//           confirmText: 'Delete Permanently',
//           confirmClass: 'bg-red-600 hover:bg-red-700',
//           requiresReason: true
//         };
//       default:
//         return {};
//     }
//   };

//   const details = getActionDetails();

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
//         <div className="p-6">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-3 bg-red-500/20 rounded-full">
//               <AlertCircle className="text-red-400" size={24} />
//             </div>
//             <h3 className="text-xl font-bold text-white">{details.title}</h3>
//           </div>
          
//           <p className="text-slate-300 mb-6">{details.description}</p>
          
//           {details.requiresReason && (
//             <div className="mb-6">
//               <label className="block text-slate-400 text-sm mb-2">Reason (optional)</label>
//               <textarea
//                 value={reason}
//                 onChange={(e) => setReason(e.target.value)}
//                 placeholder="Enter reason for this action..."
//                 className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
//                 rows={3}
//               />
//             </div>
//           )}
          
//           <div className="flex gap-3">
//             <button
//               onClick={onCancel}
//               className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               className={`flex-1 px-4 py-2 ${details.confirmClass} rounded-lg text-white font-medium transition-colors`}
//             >
//               {details.confirmText}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Activity,
  UserX,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Ban,
  Unlock,
  Trash2,
  Crown,
  LogOut,
  Eye,
  Github,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Admin() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionReason, setActionReason] = useState('');

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, error

  // Get auth token
  const getAuthToken = () => localStorage.getItem('token');

  // API call helper
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found. Please sign in again.');

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: Expected JSON but received HTML. Check if the API endpoint exists and is running.');
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please sign in again.');
        }
        if (response.status === 403) {
          throw new Error(data.message || 'Access denied. Admin privileges required.');
        }
        throw new Error(data.message || `API error: ${response.status}`);
      }

      return data;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw err;
    }
  };

  // Check initial connection and auth
  useEffect(() => {
    const checkConnection = async () => {
      const token = getAuthToken();
      if (!token) {
        setConnectionStatus('error');
        setError('No authentication token found. Please sign in.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      try {
        await apiCall('/admin/dashboard');
        setConnectionStatus('connected');
      } catch (err) {
        setConnectionStatus('error');
        console.error('Connection check failed:', err);
      }
    };

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/admin/dashboard');
      setDashboardData(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users with filters
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        search: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      const data = await apiCall(`/admin/users?${params}`);
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50'
      });

      const data = await apiCall(`/admin/sessions?${params}`);
      setSessions(data.data.sessions);
      setTotalPages(data.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch deleted accounts
  const fetchDeletedAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        search: searchQuery
      });

      const data = await apiCall(`/admin/deleted-accounts?${params}`);
      setDeletedAccounts(data.data.deletedAccounts);
      setTotalPages(data.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // User actions
  const banUser = async (userId, reason) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}/ban`, 'PUT', { reason });
      setSuccess('User banned successfully');
      fetchUsers();
      setShowConfirmModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unbanUser = async (userId) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}/unban`, 'PUT');
      setSuccess('User unbanned successfully');
      fetchUsers();
      setShowConfirmModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, reason) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}`, 'DELETE', { reason });
      setSuccess('User deleted successfully');
      fetchUsers();
      setShowConfirmModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}/role`, 'PUT', { role });
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserScans = async (userId, scans, operation) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}/scans`, 'PUT', { scans, operation });
      setSuccess('User scans updated successfully');
      if (showUserDetails) {
        fetchUserDetails(userId);
      }
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      setLoading(true);
      await apiCall(`/admin/sessions/${sessionId}`, 'DELETE');
      setSuccess('Session deleted successfully');
      fetchSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllUserSessions = async (userId) => {
    try {
      setLoading(true);
      await apiCall(`/admin/users/${userId}/sessions`, 'DELETE');
      setSuccess('All user sessions deleted successfully');
      fetchSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const data = await apiCall(`/admin/users/${userId}`);
      setSelectedUser(data.data);
      setShowUserDetails(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'deleted') fetchDeletedAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Confirm action modal
  const openConfirmModal = (action, user) => {
    setConfirmAction({ type: action, user });
    setShowConfirmModal(true);
    setActionReason('');
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    const { type, user } = confirmAction;

    if (type === 'ban') banUser(user._id, actionReason);
    if (type === 'unban') unbanUser(user._id);
    if (type === 'delete') deleteUser(user._id, actionReason);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Notifications */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-slideIn">
          <CheckCircle size={20} />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-slideIn">
          <XCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Connection Status Banner */}
      {connectionStatus === 'error' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 max-w-2xl">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Connection Error</p>
            <p className="text-sm opacity-90">Cannot connect to API. Check if backend is running at: {API_BASE_URL}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
                  <Shield className="text-white" size={28} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Admin Control Panel
                </h1>
                <p className="text-slate-500 text-sm">System Management Dashboard</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg text-slate-700 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'sessions', label: 'Sessions', icon: Activity },
              { id: 'deleted', label: 'Deleted Accounts', icon: UserX }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 relative group ${
                  activeTab === tab.id ? 'text-cyan-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8 bg-white">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-cyan-600" size={32} />
          </div>
        )}

        {!loading && activeTab === 'dashboard' && dashboardData && <DashboardView data={dashboardData} />}

        {!loading && activeTab === 'users' && (
          <UsersView
            users={users}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            onViewDetails={fetchUserDetails}
            onBan={(user) => openConfirmModal('ban', user)}
            onUnban={(user) => openConfirmModal('unban', user)}
            onDelete={(user) => openConfirmModal('delete', user)}
            onUpdateRole={updateUserRole}
            onUpdateScans={updateUserScans}
          />
        )}

        {!loading && activeTab === 'sessions' && (
          <SessionsView
            sessions={sessions}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            onDeleteSession={deleteSession}
            onDeleteAllUserSessions={deleteAllUserSessions}
          />
        )}

        {!loading && activeTab === 'deleted' && (
          <DeletedAccountsView
            accounts={deletedAccounts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </main>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onUpdateScans={updateUserScans}
          onDeleteSession={deleteSession}
        />
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && confirmAction && (
        <ConfirmModal
          action={confirmAction}
          reason={actionReason}
          setReason={setActionReason}
          onConfirm={executeConfirmAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
            setActionReason('');
          }}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ data }) {
  const { statistics, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statistics.users.total}
          icon={Users}
          gradient="from-cyan-500 to-blue-500"
          details={[
            { label: 'Active', value: statistics.users.active },
            { label: 'Banned', value: statistics.users.banned }
          ]}
        />

        <StatCard
          title="Verified Users"
          value={statistics.users.verified}
          icon={CheckCircle}
          gradient="from-emerald-500 to-green-500"
          details={[
            { label: 'Verification Rate', value: `${Math.round((statistics.users.verified / statistics.users.total) * 100)}%` }
          ]}
        />

        <StatCard
          title="Active Sessions"
          value={statistics.sessions.activeLast24Hours}
          icon={Activity}
          gradient="from-violet-500 to-purple-500"
          details={[{ label: 'Total', value: statistics.sessions.total }]}
        />

        <StatCard
          title="GitHub Linked"
          value={statistics.users.githubLinked}
          icon={Github}
          gradient="from-orange-500 to-red-500"
          details={[
            { label: 'Link Rate', value: `${Math.round((statistics.users.githubLinked / statistics.users.total) * 100)}%` }
          ]}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityCard title="Recent Users" icon={Users} items={recentActivity.recentUsers} type="users" />
        <ActivityCard title="Recent Deletions" icon={UserX} items={recentActivity.recentDeletions} type="deletions" />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, gradient, details }) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity duration-200`}></div>
      <div className="relative bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors duration-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className={`bg-gradient-to-r ${gradient} p-3 rounded-lg`}>
            <Icon className="text-white" size={24} />
          </div>
        </div>
        <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 mb-3">{value.toLocaleString()}</p>
        {details && (
          <div className="flex flex-wrap gap-3 text-xs">
            {details.map((detail, idx) => (
              <div key={idx} className="text-slate-600">
                <span className="text-slate-500">{detail.label}:</span> {detail.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ title, icon: Icon, items, type }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="text-cyan-600" size={20} />
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {items && items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-slate-900 font-medium">{item.email || item.name}</p>
                {type === 'users' && (
                  <p className="text-slate-600 text-sm">
                    {item.isVerified ? '✓ Verified' : '○ Unverified'} · {item.isActive ? ' Active' : ' Banned'}
                  </p>
                )}
                {type === 'deletions' && item.reason && <p className="text-slate-600 text-sm">{item.reason}</p>}
              </div>
              <div className="text-slate-500 text-sm">{new Date(item.createdAt || item.deletedAt).toLocaleDateString()}</div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}

// Users View Component
function UsersView({
  users,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  currentPage,
  totalPages,
  setCurrentPage,
  onViewDetails,
  onBan,
  onUnban,
  onDelete,
  onUpdateRole
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Filter size={16} />
            <span>Showing {users.length} users</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">User</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Status</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Role</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Scans</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Joined</th>
                <th className="text-right px-6 py-4 text-slate-700 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 font-medium">{user.name || 'N/A'}</p>
                      <p className="text-slate-600 text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {user.isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
                        {user.isActive ? 'Active' : 'Banned'}
                      </span>
                      {user.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 w-fit">
                          <CheckCircle size={12} />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        user.role === 2 ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {user.role === 2 ? <Crown size={12} /> : <Users size={12} />}
                      {user.role === 2 ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-900 font-medium">{user.remainingScans || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(user._id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-cyan-700 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {actionMenuOpen === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-10">
                            <button
                              onClick={() => {
                                user.isActive ? onBan(user) : onUnban(user);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 first:rounded-t-lg flex items-center gap-2"
                            >
                              {user.isActive ? <Ban size={14} /> : <Unlock size={14} />}
                              {user.isActive ? 'Ban User' : 'Unban User'}
                            </button>

                            <button
                              onClick={() => {
                                onUpdateRole(user._id, user.role === 2 ? 1 : 2);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Crown size={14} />
                              {user.role === 2 ? 'Remove Admin' : 'Make Admin'}
                            </button>

                            {/* <button
                              onClick={() => {
                                onDelete(user);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 last:rounded-b-lg flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete User
                            </button> */}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

// Sessions View Component
function SessionsView({ sessions, currentPage, totalPages, setCurrentPage, onDeleteSession }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">User</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Device</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">IP Address</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Last Active</th>
                <th className="text-right px-6 py-4 text-slate-700 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {session.userId && (
                      <div>
                        <p className="text-slate-900 font-medium">{session.userId.name || 'N/A'}</p>
                        <p className="text-slate-600 text-sm">{session.userId.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {session.deviceInfo && (
                      <div>
                        <p className="text-slate-900 text-sm">{session.deviceInfo.browser || 'Unknown'}</p>
                        <p className="text-slate-600 text-xs">{session.deviceInfo.os || 'Unknown OS'}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-sm">{session.ipAddress || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{new Date(session.lastActive).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDeleteSession(session.sessionId)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm font-medium transition-colors"
                      >
                        End Session
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

// Deleted Accounts View Component
function DeletedAccountsView({ accounts, searchQuery, setSearchQuery, currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search deleted accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Email</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Reason</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">Deleted At</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold text-sm">IP</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account._id} className="border-b border-slate-100">
                  <td className="px-6 py-4 text-slate-900 font-medium">{account.email}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{account.reason || 'No reason provided'}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{new Date(account.deletedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{account.deletedIp || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) pageNum = i + 1;
          else if (currentPage <= 3) pageNum = i + 1;
          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = currentPage - 2 + i;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === pageNum
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <span className="ml-4 text-slate-600 text-sm">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}

// User Details Modal
function UserDetailsModal({ user, onClose, onUpdateScans, onDeleteSession }) {
  const [scanAmount, setScanAmount] = useState(0);
  const [scanOperation, setScanOperation] = useState('set');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">User Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Name" value={user.user.name || 'N/A'} />
              <InfoField label="Email" value={user.user.email} />
              <InfoField label="Phone" value={user.user.phoneNumber || 'N/A'} />
              <InfoField label="Company" value={user.user.company || 'N/A'} />
              <InfoField label="Role" value={user.user.role === 2 ? 'Admin' : 'User'} />
              <InfoField label="Status" value={user.user.isActive ? 'Active' : 'Banned'} />
              <InfoField label="Verified" value={user.user.isVerified ? 'Yes' : 'No'} />
              <InfoField label="GitHub ID" value={user.user.githubId || 'Not linked'} />
            </div>

            {/* Scan Management */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-slate-900 font-semibold mb-4">Manage Scans</h3>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-slate-600 text-sm mb-2">Amount</label>
                  <input
                    type="number"
                    value={scanAmount}
                    onChange={(e) => setScanAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-600 text-sm mb-2">Operation</label>
                  <select
                    value={scanOperation}
                    onChange={(e) => setScanOperation(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="set">Set</option>
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    onUpdateScans(user.user._id, scanAmount, scanOperation);
                    setScanAmount(0);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-medium transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="text-slate-600 text-sm mt-2">Current: {user.user.remainingScans || 0} scans</p>
            </div>

            {/* Sessions */}
            {user.sessions && user.sessions.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h3 className="text-slate-900 font-semibold mb-4">Active Sessions ({user.sessions.length})</h3>
                <div className="space-y-3">
                  {user.sessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-slate-900 text-sm">
                          {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                        </p>
                        <p className="text-slate-600 text-xs">
                          {session.ipAddress} · Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteSession(session.sessionId)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-700 text-xs font-medium transition-colors"
                      >
                        End
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub History */}
            {user.user.githubIdHistory && user.user.githubIdHistory.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h3 className="text-slate-900 font-semibold mb-4">GitHub History</h3>
                <div className="space-y-2">
                  {user.user.githubIdHistory.map((gh, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-slate-900 text-sm">{gh.username}</p>
                        <p className="text-slate-600 text-xs">ID: {gh.githubId}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          gh.isCurrentlyLinked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {gh.isCurrentlyLinked ? 'Current' : 'Unlinked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Field Component
function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-slate-600 text-sm mb-1">{label}</p>
      <p className="text-slate-900 font-medium">{value}</p>
    </div>
  );
}

// Confirm Modal Component
function ConfirmModal({ action, reason, setReason, onConfirm, onCancel }) {
  const getActionDetails = () => {
    if (action.type === 'ban') {
      return {
        title: 'Ban User',
        description: `Are you sure you want to ban ${action.user.email}? This will deactivate their account and log them out from all devices.`,
        confirmText: 'Ban User',
        confirmClass: 'bg-red-600 hover:bg-red-700',
        requiresReason: true
      };
    }
    if (action.type === 'unban') {
      return {
        title: 'Unban User',
        description: `Are you sure you want to unban ${action.user.email}? This will restore their access.`,
        confirmText: 'Unban User',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
        requiresReason: false
      };
    }
    if (action.type === 'delete') {
      return {
        title: 'Delete User',
        description: `Are you sure you want to permanently delete ${action.user.email}? This action cannot be undone.`,
        confirmText: 'Delete Permanently',
        confirmClass: 'bg-red-700 hover:bg-red-800',
        requiresReason: true
      };
    }
    return { title: '', description: '', confirmText: '', confirmClass: '', requiresReason: false };
  };

  const details = getActionDetails();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="text-red-700" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{details.title}</h3>
          </div>

          <p className="text-slate-700 mb-6">{details.description}</p>

          {details.requiresReason && (
            <div className="mb-6">
              <label className="block text-slate-600 text-sm mb-2">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 ${details.confirmClass} rounded-lg text-white font-medium transition-colors`}
            >
              {details.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
