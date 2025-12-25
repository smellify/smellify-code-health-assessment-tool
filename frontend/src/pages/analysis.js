// import { useState, useEffect } from 'react';
// import {
//   CreditCard,
//   Download,
//   Calendar,
//   Package,
//   DollarSign,
//   Gem,
//   Receipt,
//   Settings,
//   Menu,
//   BarChart3,
//   Activity,
//   LogOut,
//   UserPlus,
//   X,
//   AlertCircle,
//   FileCode,
// } from "lucide-react";

// export default function Analysis() {
//   const projectId = window.location.pathname.split('/').pop();
//   const [project, setProject] = useState(null);
//   const [analysis, setAnalysis] = useState(null);
//   const [duplicationMetrics, setDuplicationMetrics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [user, setUser] = useState({ name: '' });

//   useEffect(() => {
//     checkUserStatus();
//     fetchProjectAndAnalysis();
//   }, [projectId]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
//         setShowProfileDropdown(false);
//       }
//     };

//     if (showProfileDropdown) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [showProfileDropdown]);

//   const checkUserStatus = async () => {
//     try {
//       const response = await fetch('/api/users/profile', {
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//       });
//       const data = await response.json();
//       setUser({ name: data.name || '', ...data });
//     } catch (error) {
//       console.error('Error checking user status:', error);
//     }
//   };

//   const fetchProjectAndAnalysis = async () => {
//     try {
//       setLoading(true);
//       const projectResponse = await fetch(`/api/projects/${projectId}`, {
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//       });
//       setProject((await projectResponse.json()).project);

//       const analysisResponse = await fetch(`/api/projects/${projectId}/sonarqube`, {
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//       });
//       setAnalysis(await analysisResponse.json());

//       const metricsResponse = await fetch(`/api/projects/${projectId}/duplication-metrics`, {
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
//       });
//       setDuplicationMetrics(await metricsResponse.json());
//     } catch (err) {
//       console.error('Error fetching analysis:', err);
//       setError('Failed to load analysis');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getDuplicateIssues = () => {
//     if (!analysis?.results?.issues) return [];
//     return analysis.results.issues.filter(issue =>
//       issue.type === 'DUPLICATION' ||
//       issue.rule?.includes('duplication') ||
//       issue.message?.toLowerCase().includes('duplicate')
//     );
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity?.toLowerCase()) {
//       case 'blocker': return 'text-red-700 bg-red-100 border border-red-200';
//       case 'critical': return 'text-orange-700 bg-orange-100 border border-orange-200';
//       case 'major': return 'text-amber-700 bg-amber-100 border border-amber-200';
//       case 'minor': return 'text-blue-700 bg-blue-100 border border-blue-200';
//       default: return 'text-gray-700 bg-gray-100 border border-gray-200';
//     }
//   };

//   const duplicateIssues = getDuplicateIssues();

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {/* Sidebar */}
//       <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed lg:relative h-screen z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
//         {/* Logo */}
//         <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
//           <div className="flex items-center">
//             <div className="w-8 h-8 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-bold text-sm">
//               <img
//                 src="/bug.png"
//                 alt="Bug Icon"
//                 className="w-7 h-7 object-contain"
//               />
//             </div>
//             {sidebarOpen && (
//               <span className="ml-3 text-xl font-bold bg-gradient-to-r from-[#5A33FF] to-[#7C5CFF] bg-clip-text text-transparent">
//                 Smellify
//               </span>
//             )}
//           </div>
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 px-3 py-6">
//           <div className="mb-6">
//             {sidebarOpen && (
//               <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
//                 Navigation
//               </p>
//             )}
//             <div className="space-y-1">
//               <button
//                 onClick={() => window.location.href = '/dashboard'}
//                 className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <BarChart3 className="w-5 h-5" />
//                 {sidebarOpen && <span className="ml-3">Dashboard</span>}
//               </button>
//               <button
//                 onClick={() => window.location.href = '/projects'}
//                 className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <Package className="w-5 h-5" />
//                 {sidebarOpen && <span className="ml-3">Projects</span>}
//               </button>
//               <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg">
//                 <Activity className="w-5 h-5" />
//                 {sidebarOpen && <span className="ml-3">Analysis</span>}
//               </button>
//               <button
//                 onClick={() => window.location.href = '/plans'}
//                 className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <Gem className="w-5 h-5" />
//                 {sidebarOpen && <span className="ml-3">Plans</span>}
//               </button>
//               <button
//                 onClick={() => window.location.href = '/billing'}
//                 className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <Receipt className="w-5 h-5" />
//                 {sidebarOpen && <span className="ml-3">Billing</span>}
//               </button>
//             </div>
//           </div>
//         </nav>

//         {/* Desktop Toggle Button */}
//         <div className="hidden lg:block px-3 pb-4">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="w-full p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
//           >
//             <Menu className="w-5 h-5" />
//           </button>
//         </div>
//       </aside>

//       {/* Mobile Overlay */}
//       {sidebarOpen && (
//         <div
//           className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
//           onClick={() => setSidebarOpen(false)}
//         ></div>
//       )}

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col w-full lg:w-auto">
//         {/* Header */}
//         <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
//           <div className="flex items-center">
//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="lg:hidden p-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               <Menu className="w-5 h-5" />
//             </button>
//             <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Code Analysis</h1>
//           </div>

//           <div className="flex items-center space-x-2 lg:space-x-3">
//             {/* Profile Dropdown */}
//             <div className="relative profile-dropdown-container">
//               <button
//                 onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//                 className="w-10 h-10 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#4A23EF] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A33FF]"
//               >
//                 {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
//               </button>

//               {showProfileDropdown && (
//                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                   <button
//                     onClick={() => {
//                       setShowProfileDropdown(false);
//                       window.location.href = '/referral';
//                     }}
//                     className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
//                   >
//                     <UserPlus className="w-4 h-4 mr-3 text-gray-500" />
//                     Referrals
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowProfileDropdown(false);
//                       window.location.href = '/settings';
//                     }}
//                     className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
//                   >
//                     <Settings className="w-4 h-4 mr-3 text-gray-500" />
//                     Settings
//                   </button>
//                   <div className="border-t border-gray-100 my-1"></div>
//                   <button
//                     onClick={() => {
//                       localStorage.removeItem('token');
//                       localStorage.removeItem('user');
//                       window.location.href = '/';
//                     }}
//                     className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
//                   >
//                     <LogOut className="w-4 h-4 mr-3" />
//                     Sign Out
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {/* Analysis Content */}
//         <main className="flex-1 p-4 lg:p-8 overflow-auto">
//           {loading ? (
//             <div className="text-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4"></div>
//               <p className="text-gray-500">Loading analysis...</p>
//             </div>
//           ) : error ? (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
//               <p className="text-red-700 font-medium mb-4">{error}</p>
//               <button
//                 onClick={() => window.location.href = '/projects'}
//                 className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
//               >
//                 ← Back to Projects
//               </button>
//             </div>
//           ) : !project ? (
//             <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
//               <p className="text-gray-600">Project not found</p>
//             </div>
//           ) : (
//             <>
//               {/* Project Header */}
//               <div className="mb-6 pb-6 border-b border-gray-200">
//                 <div className="flex items-start justify-between mb-4">
//                   <div>
//                     <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{project.projectName}</h2>
//                     {project.description && <p className="text-gray-600">{project.description}</p>}
//                   </div>

//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                   <div>
//                     <p className="text-gray-600 font-medium">Source</p>
//                     <p className="text-gray-900">{project.source === 'github' ? 'GitHub' : 'ZIP Upload'}</p>
//                   </div>
//                   <div>
//                     <p className="text-gray-600 font-medium">Type</p>
//                     <p className="text-gray-900 capitalize">{project.projectType}</p>
//                   </div>
//                   <div>
//                     <p className="text-gray-600 font-medium">Status</p>
//                     <p className="text-gray-900 capitalize">{project.analysisStatus}</p>
//                   </div>
//                   <div>
//                     <p className="text-gray-600 font-medium">Created</p>
//                     <p className="text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Duplication Metrics Cards */}
//               {duplicationMetrics && (
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
//                   <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <p className="text-sm font-medium text-gray-600 mb-2">Duplication Density</p>
//                         <p className="text-2xl lg:text-3xl font-bold text-gray-900">
//                           {duplicationMetrics.duplicatedLinesDensity !== undefined ? `${duplicationMetrics.duplicatedLinesDensity}%` : 'N/A'}
//                         </p>
//                       </div>
//                       <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 ml-2">
//                         <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <p className="text-sm font-medium text-gray-600 mb-2">Duplicated Files</p>
//                         <p className="text-2xl lg:text-3xl font-bold text-gray-900">
//                           {duplicationMetrics.duplicatedFiles !== undefined ? duplicationMetrics.duplicatedFiles : 'N/A'}
//                         </p>
//                       </div>
//                       <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 ml-2">
//                         <Package className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <p className="text-sm font-medium text-gray-600 mb-2">Duplicated Lines</p>
//                         <p className="text-2xl lg:text-3xl font-bold text-gray-900">
//                           {duplicationMetrics.duplicatedLines !== undefined ? duplicationMetrics.duplicatedLines : 'N/A'}
//                         </p>
//                       </div>
//                       <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ml-2">
//                         <FileCode className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Duplicated Files List */}
//               {duplicationMetrics?.duplicatedFilesList && duplicationMetrics.duplicatedFilesList.length > 0 && (
//                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
//                   <div className="px-6 py-4 border-b border-gray-200">
//                     <h3 className="text-lg font-bold text-gray-900">
//                       Files with Duplications ({duplicationMetrics.duplicatedFilesList.length})
//                     </h3>
//                   </div>
//                   <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
//                     {duplicationMetrics.duplicatedFilesList.map((file, index) => (
//                       <div key={index} className="px-6 py-3 hover:bg-gray-50 transition-colors">
//                         <p className="text-sm font-mono text-gray-900">{file.name || file}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Duplicate Code Issues */}
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="px-6 py-4 border-b border-gray-200">
//                   <h3 className="text-lg font-bold text-gray-900">
//                     Code Duplication Issues ({duplicateIssues.length})
//                   </h3>
//                 </div>

//                 {duplicateIssues.length === 0 ? (
//                   <div className="p-8 text-center">
//                     <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
//                       <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <p className="text-gray-700 font-medium mb-2">Excellent! No duplications found</p>
//                     <p className="text-gray-500 text-sm">Your code is free of duplicate blocks</p>
//                   </div>
//                 ) : (
//                   <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
//                     {duplicateIssues.map((issue, index) => (
//                       <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
//                         <div className="flex items-start justify-between mb-4">
//                           <div className="flex items-start gap-3 flex-1">
//                             <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
//                               <AlertCircle className="w-5 h-5 text-blue-600" />
//                             </div>
//                             <div className="flex-1">
//                               <h4 className="text-sm font-semibold text-gray-900">
//                                 {issue.message || `Duplicate Issue ${index + 1}`}
//                               </h4>
//                             </div>
//                           </div>
//                           {issue.severity && (
//                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${getSeverityColor(issue.severity)}`}>
//                               {issue.severity}
//                             </span>
//                           )}
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                           {issue.component && (
//                             <div className="bg-gray-50 p-3 rounded-lg">
//                               <p className="text-gray-600 font-medium mb-1">File</p>
//                               <p className="font-mono text-gray-900 break-all text-xs">{issue.component}</p>
//                             </div>
//                           )}

//                           {issue.textRange && (
//                             <div className="bg-gray-50 p-3 rounded-lg">
//                               <p className="text-gray-600 font-medium mb-1">Line Range</p>
//                               <p className="text-gray-900">Lines {issue.textRange.startLine} - {issue.textRange.endLine}</p>
//                             </div>
//                           )}

//                           {issue.effort && (
//                             <div className="bg-gray-50 p-3 rounded-lg">
//                               <p className="text-gray-600 font-medium mb-1">Effort to Fix</p>
//                               <p className="text-gray-900">{issue.effort}</p>
//                             </div>
//                           )}

//                           {issue.status && (
//                             <div className="bg-gray-50 p-3 rounded-lg">
//                               <p className="text-gray-600 font-medium mb-1">Status</p>
//                               <p className="text-gray-900 capitalize">{issue.status}</p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Analysis Info Footer */}
//               {analysis && (
//                 <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
//                   <h3 className="text-sm font-semibold text-gray-900 mb-4">Analysis Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
//                     <div>
//                       <p className="text-gray-600 font-medium">Project Key</p>
//                       <p className="text-gray-900 font-mono">{analysis.projectKey}</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-600 font-medium">Scan Status</p>
//                       <p className="text-gray-900 capitalize">{analysis.status}</p>
//                     </div>
//                     {analysis.results?.scanDate && (
//                       <div>
//                         <p className="text-gray-600 font-medium">Scan Date</p>
//                         <p className="text-gray-900">{new Date(analysis.results.scanDate).toLocaleString()}</p>
//                       </div>
//                     )}
//                     {/* {analysis.sonarQubeUrl && (
//                       <div>
//                         <p className="text-gray-600 font-medium">Full Report</p>
//                         <a href={analysis.sonarQubeUrl} target="_blank" rel="noopener noreferrer" className="text-[#5A33FF] hover:text-[#4A23EF] font-medium">
//                           View on SonarQube →
//                         </a>
//                       </div>
//                     )} */}
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';

// const Analysis = () => {
//   const { projectId } = useParams();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [combinedData, setCombinedData] = useState(null);
//   const [activeTab, setActiveTab] = useState('overview');
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [fileContent, setFileContent] = useState(null);
//   const [fileLoading, setFileLoading] = useState(false);

//   useEffect(() => {
//     fetchCombinedAnalysis();
//   }, [projectId]);

//   const fetchCombinedAnalysis = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = localStorage.getItem('token');

//       const response = await axios.get(
//         `http://localhost:5000/api/projects/${projectId}/analysis`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       console.log('Analysis data received:', response.data);
//       setCombinedData(response.data);
//       setLoading(false);
//     } catch (err) {
//       console.error('Error fetching analysis:', err);
//       setError(err.response?.data?.message || 'Failed to fetch analysis data');
//       setLoading(false);
//     }
//   };

//   const fetchFileContent = async (filePath, startLine, endLine) => {
//     try {
//       setFileLoading(true);
//       const token = localStorage.getItem('token');

//       const response = await axios.get(
//         `http://localhost:5000/api/projects/${projectId}/file-content`,
//         {
//           params: { filePath, startLine, endLine },
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       setFileContent(response.data);
//       setFileLoading(false);
//     } catch (err) {
//       console.error('Failed to fetch file content:', err);
//       setFileContent({ content: 'Failed to load file content', error: true });
//       setFileLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: '40px', textAlign: 'center' }}>
//         <div style={{ fontSize: '18px', color: '#666' }}>Loading analysis...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: '20px', maxWidth: '800px', margin: '40px auto' }}>
//         <div style={{ backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '8px', padding: '20px' }}>
//           <h2 style={{ color: '#d32f2f', marginTop: 0 }}>Error</h2>
//           <p style={{ color: '#666' }}>{error}</p>
//           <button
//             onClick={fetchCombinedAnalysis}
//             style={{
//               marginTop: '15px',
//               padding: '10px 20px',
//               backgroundColor: '#007bff',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer'
//             }}
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!combinedData) {
//     return <div style={{ padding: '20px', textAlign: 'center' }}>No analysis data available</div>;
//   }

//   const duplicationData = combinedData.duplication || {};
//   const qualityData = combinedData.codeQuality || {};
//   const summary = combinedData.summary || {};

//   return (
//     <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
//       <h1 style={{ marginBottom: '10px' }}>
//         Analysis Dashboard - {combinedData.projectName}
//       </h1>
//       <p style={{ color: '#666', marginBottom: '30px' }}>
//         Project Type: {combinedData.projectType}
//       </p>

//       {/* Navigation Tabs */}
//       <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
//         <button
//           onClick={() => setActiveTab('overview')}
//           style={{
//             padding: '12px 24px',
//             marginRight: '5px',
//             border: 'none',
//             borderBottom: activeTab === 'overview' ? '3px solid #007bff' : 'none',
//             background: activeTab === 'overview' ? '#f0f8ff' : 'transparent',
//             cursor: 'pointer',
//             fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
//           }}
//         >
//           Overview
//         </button>
//         <button
//           onClick={() => setActiveTab('exact')}
//           style={{
//             padding: '12px 24px',
//             marginRight: '5px',
//             border: 'none',
//             borderBottom: activeTab === 'exact' ? '3px solid #007bff' : 'none',
//             background: activeTab === 'exact' ? '#f0f8ff' : 'transparent',
//             cursor: 'pointer',
//             fontWeight: activeTab === 'exact' ? 'bold' : 'normal'
//           }}
//         >
//           Exact Clones ({summary.exactClones || 0})
//         </button>
//         <button
//           onClick={() => setActiveTab('near')}
//           style={{
//             padding: '12px 24px',
//             marginRight: '5px',
//             border: 'none',
//             borderBottom: activeTab === 'near' ? '3px solid #007bff' : 'none',
//             background: activeTab === 'near' ? '#f0f8ff' : 'transparent',
//             cursor: 'pointer',
//             fontWeight: activeTab === 'near' ? 'bold' : 'normal'
//           }}
//         >
//           Near Clones ({summary.nearClones || 0})
//         </button>
//         <button
//           onClick={() => setActiveTab('routes')}
//           style={{
//             padding: '12px 24px',
//             marginRight: '5px',
//             border: 'none',
//             borderBottom: activeTab === 'routes' ? '3px solid #007bff' : 'none',
//             background: activeTab === 'routes' ? '#f0f8ff' : 'transparent',
//             cursor: 'pointer',
//             fontWeight: activeTab === 'routes' ? 'bold' : 'normal'
//           }}
//         >
//           API Route Issues ({summary.apiRouteIssues || 0})
//         </button>
//         <button
//           onClick={() => setActiveTab('queries')}
//           style={{
//             padding: '12px 24px',
//             border: 'none',
//             borderBottom: activeTab === 'queries' ? '3px solid #007bff' : 'none',
//             background: activeTab === 'queries' ? '#f0f8ff' : 'transparent',
//             cursor: 'pointer',
//             fontWeight: activeTab === 'queries' ? 'bold' : 'normal'
//           }}
//         >
//           Query Issues ({(summary.mongooseQueryIssues || 0) + (summary.redundantQueryIssues || 0)})
//         </button>
//       </div>

//       {/* Overview Tab */}
//       {activeTab === 'overview' && (
//         <div>
//           <h2 style={{ marginBottom: '20px' }}>Analysis Summary</h2>

//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
//             <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
//               <h3 style={{ marginTop: 0, color: '#007bff' }}>Code Duplication</h3>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>Total Files:</strong> {summary.totalFiles || 0}
//               </p>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>Exact Clones:</strong> {summary.exactClones || 0}
//               </p>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>Near Clones:</strong> {summary.nearClones || 0}
//               </p>
//             </div>

//             <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff9f0' }}>
//               <h3 style={{ marginTop: 0, color: '#ff8c00' }}>Code Quality</h3>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>API Route Issues:</strong> {summary.apiRouteIssues || 0}
//               </p>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>Mongoose Query Issues:</strong> {summary.mongooseQueryIssues || 0}
//               </p>
//               <p style={{ fontSize: '14px', margin: '5px 0' }}>
//                 <strong>Redundant Queries:</strong> {summary.redundantQueryIssues || 0}
//               </p>
//             </div>
//           </div>

//           {duplicationData?.results?.stats && (
//             <div style={{ marginBottom: '30px' }}>
//               <h3>Duplication Statistics</h3>
//               <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: 'white' }}>
//                 <tbody>
//                   <tr>
//                     <td><strong>Total Files Analyzed</strong></td>
//                     <td>{duplicationData.results.stats.totalFiles}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Total Code Units</strong></td>
//                     <td>{duplicationData.results.stats.totalUnits}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Duplicated Units</strong></td>
//                     <td>{duplicationData.results.stats.duplicatedUnits}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Analysis Started</strong></td>
//                     <td>{duplicationData.startedAt ? new Date(duplicationData.startedAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Analysis Completed</strong></td>
//                     <td>{duplicationData.completedAt ? new Date(duplicationData.completedAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {qualityData?.results?.stats && (
//             <div>
//               <h3>Quality Analysis Statistics</h3>
//               <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: 'white' }}>
//                 <tbody>
//                   <tr>
//                     <td><strong>Files Analyzed</strong></td>
//                     <td>{qualityData.results.stats.totalFiles || 0}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Total Routes</strong></td>
//                     <td>{qualityData.results.stats.routeCount || 0}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Total Issues Found</strong></td>
//                     <td>{qualityData.results.stats.totalIssuesFound || 0}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Analysis Started</strong></td>
//                     <td>{qualityData.startedAt ? new Date(qualityData.startedAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Analysis Completed</strong></td>
//                     <td>{qualityData.completedAt ? new Date(qualityData.completedAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Exact Clones Tab */}
//       {activeTab === 'exact' && duplicationData?.results?.exactClones && (
//         <div>
//           <h2>Exact Clone Groups</h2>
//           <p style={{ color: '#666' }}>These are code blocks with identical structure (same logic, different variable names)</p>

//           {duplicationData.results.exactClones.length === 0 ? (
//             <p style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
//               ✓ No exact clones found! Your code is well-structured.
//             </p>
//           ) : (
//             duplicationData.results.exactClones.map((group) => (
//               <div key={group.groupId} style={{
//                 border: '1px solid #ccc',
//                 padding: '15px',
//                 marginBottom: '20px',
//                 backgroundColor: '#f9f9f9',
//                 borderRadius: '8px'
//               }}>
//                 <h3>
//                   Group #{group.groupId} - {group.type}
//                   <span style={{ marginLeft: '10px', color: '#666', fontSize: '16px' }}>
//                     ({group.duplicateCount} duplicates)
//                   </span>
//                 </h3>

//                 <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: 'white' }}>
//                   <thead>
//                     <tr style={{ backgroundColor: '#f0f0f0' }}>
//                       <th>#</th>
//                       <th>Type</th>
//                       <th>Name</th>
//                       <th>File</th>
//                       <th>Lines</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {group.occurrences.map((occurrence, idx) => (
//                       <tr key={idx}>
//                         <td>{idx + 1}</td>
//                         <td>{occurrence.type}</td>
//                         <td style={{ fontFamily: 'monospace' }}>{occurrence.name}</td>
//                         <td style={{ fontSize: '12px' }}>{occurrence.file}</td>
//                         <td>
//                           {occurrence.startLine} - {occurrence.endLine}
//                           <span style={{ marginLeft: '5px', color: '#666' }}>
//                             ({occurrence.lineCount} lines)
//                           </span>
//                         </td>
//                         <td>
//                           <button
//                             onClick={() => {
//                               setSelectedFile(occurrence);
//                               fetchFileContent(
//                                 occurrence.file,
//                                 occurrence.startLine,
//                                 occurrence.endLine
//                               );
//                             }}
//                             style={{
//                               padding: '5px 10px',
//                               cursor: 'pointer',
//                               backgroundColor: '#007bff',
//                               color: 'white',
//                               border: 'none',
//                               borderRadius: '4px'
//                             }}
//                           >
//                             View Code
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* Near Clones Tab */}
//       {activeTab === 'near' && duplicationData?.results?.nearClones && (
//         <div>
//           <h2>Near Clone Groups</h2>
//           <p style={{ color: '#666' }}>These are code blocks with similar structure (80%+ similarity)</p>

//           {duplicationData.results.nearClones.length === 0 ? (
//             <p style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
//               ✓ No near clones found! Your code is well-structured.
//             </p>
//           ) : (
//             duplicationData.results.nearClones.map((group) => (
//               <div key={group.groupId} style={{
//                 border: '1px solid #ccc',
//                 padding: '15px',
//                 marginBottom: '20px',
//                 backgroundColor: '#fff9e6',
//                 borderRadius: '8px'
//               }}>
//                 <h3>
//                   Group #{group.groupId} - {group.type}
//                   <span style={{ marginLeft: '10px', color: '#666', fontSize: '16px' }}>
//                     (Similarity: {(group.similarity * 100).toFixed(1)}%)
//                   </span>
//                 </h3>

//                 <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: 'white' }}>
//                   <thead>
//                     <tr style={{ backgroundColor: '#f0f0f0' }}>
//                       <th>#</th>
//                       <th>Type</th>
//                       <th>Name</th>
//                       <th>File</th>
//                       <th>Lines</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {group.occurrences.map((occurrence, idx) => (
//                       <tr key={idx}>
//                         <td>{idx + 1}</td>
//                         <td>{occurrence.type}</td>
//                         <td style={{ fontFamily: 'monospace' }}>{occurrence.name}</td>
//                         <td style={{ fontSize: '12px' }}>{occurrence.file}</td>
//                         <td>
//                           {occurrence.startLine} - {occurrence.endLine}
//                           <span style={{ marginLeft: '5px', color: '#666' }}>
//                             ({occurrence.lineCount} lines)
//                           </span>
//                         </td>
//                         <td>
//                           <button
//                             onClick={() => {
//                               setSelectedFile(occurrence);
//                               fetchFileContent(
//                                 occurrence.file,
//                                 occurrence.startLine,
//                                 occurrence.endLine
//                               );
//                             }}
//                             style={{
//                               padding: '5px 10px',
//                               cursor: 'pointer',
//                               backgroundColor: '#007bff',
//                               color: 'white',
//                               border: 'none',
//                               borderRadius: '4px'
//                             }}
//                           >
//                             View Code
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* API Route Issues Tab */}
//       {activeTab === 'routes' && (
//         <div>
//           <h2>API Route Issues</h2>
//           <p style={{ color: '#666' }}>Issues found in your API route handlers</p>

//           {(!qualityData?.results?.apiRouteIssues || qualityData.results.apiRouteIssues.length === 0) ? (
//             <p style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
//               ✓ No API route issues found! Your routes are well-implemented.
//             </p>
//           ) : (
//             qualityData.results.apiRouteIssues.map((issue, idx) => (
//               <div key={idx} style={{
//                 border: '1px solid #ffcc00',
//                 padding: '15px',
//                 marginBottom: '15px',
//                 backgroundColor: '#fffbf0',
//                 borderRadius: '8px',
//                 borderLeft: '4px solid #ff9800'
//               }}>
//                 <div style={{ marginBottom: '10px' }}>
//                   <span style={{
//                     backgroundColor: '#ff9800',
//                     color: 'white',
//                     padding: '3px 8px',
//                     borderRadius: '3px',
//                     fontSize: '12px',
//                     fontWeight: 'bold'
//                   }}>
//                     {issue.severity?.toUpperCase() || 'MEDIUM'}
//                   </span>
//                   <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
//                     {issue.type}
//                   </span>
//                 </div>
//                 <p style={{ margin: '10px 0' }}>{issue.message}</p>
//                 <div style={{ fontSize: '13px', color: '#666' }}>
//                   <p style={{ margin: '5px 0' }}>
//                     <strong>File:</strong> {issue.file}
//                   </p>
//                   {issue.route && (
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>Route:</strong> <code>{issue.route}</code> ({issue.method})
//                     </p>
//                   )}
//                   <p style={{ margin: '5px 0' }}>
//                     <strong>Line:</strong> {issue.line}
//                   </p>
//                   {issue.suggestion && (
//                     <p style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
//                       <strong>💡 Suggestion:</strong> {issue.suggestion}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* Query Issues Tab */}
//       {activeTab === 'queries' && (
//         <div>
//           <h2>Database Query Issues</h2>

//           <div style={{ marginBottom: '30px' }}>
//             <h3 style={{ color: '#d32f2f' }}>Mongoose Query Issues</h3>
//             <p style={{ color: '#666' }}>Problems with Mongoose query patterns</p>

//             {(!qualityData?.results?.mongooseQueryIssues || qualityData.results.mongooseQueryIssues.length === 0) ? (
//               <p style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
//                 ✓ No Mongoose query issues found!
//               </p>
//             ) : (
//               qualityData.results.mongooseQueryIssues.map((issue, idx) => (
//                 <div key={idx} style={{
//                   border: '1px solid #f44336',
//                   padding: '15px',
//                   marginBottom: '15px',
//                   backgroundColor: '#ffebee',
//                   borderRadius: '8px',
//                   borderLeft: '4px solid #d32f2f'
//                 }}>
//                   <div style={{ marginBottom: '10px' }}>
//                     <span style={{
//                       backgroundColor: '#d32f2f',
//                       color: 'white',
//                       padding: '3px 8px',
//                       borderRadius: '3px',
//                       fontSize: '12px',
//                       fontWeight: 'bold'
//                     }}>
//                       {issue.severity?.toUpperCase() || 'MEDIUM'}
//                     </span>
//                     <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
//                       {issue.type}
//                     </span>
//                   </div>
//                   <p style={{ margin: '10px 0' }}>{issue.message}</p>
//                   <div style={{ fontSize: '13px', color: '#666' }}>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>File:</strong> {issue.file}
//                     </p>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>Line:</strong> {issue.line}
//                     </p>
//                     {issue.suggestion && (
//                       <p style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
//                         <strong>💡 Suggestion:</strong> {issue.suggestion}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           <div>
//             <h3 style={{ color: '#ff6f00' }}>Redundant Query Issues</h3>
//             <p style={{ color: '#666' }}>Multiple queries that could be optimized</p>

//             {(!qualityData?.results?.redundantQueryIssues || qualityData.results.redundantQueryIssues.length === 0) ? (
//               <p style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
//                 ✓ No redundant query issues found!
//               </p>
//             ) : (
//               qualityData.results.redundantQueryIssues.map((issue, idx) => (
//                 <div key={idx} style={{
//                   border: '1px solid #ff9800',
//                   padding: '15px',
//                   marginBottom: '15px',
//                   backgroundColor: '#fff3e0',
//                   borderRadius: '8px',
//                   borderLeft: '4px solid #ff6f00'
//                 }}>
//                   <div style={{ marginBottom: '10px' }}>
//                     <span style={{
//                       backgroundColor: '#ff6f00',
//                       color: 'white',
//                       padding: '3px 8px',
//                       borderRadius: '3px',
//                       fontSize: '12px',
//                       fontWeight: 'bold'
//                     }}>
//                       {issue.severity?.toUpperCase() || 'MEDIUM'}
//                     </span>
//                     <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
//                       {issue.type}
//                     </span>
//                   </div>
//                   <p style={{ margin: '10px 0' }}>{issue.message}</p>
//                   <div style={{ fontSize: '13px', color: '#666' }}>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>File:</strong> {issue.file}
//                     </p>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>Line:</strong> {issue.line}
//                     </p>
//                     {issue.suggestion && (
//                       <p style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
//                         <strong>💡 Suggestion:</strong> {issue.suggestion}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       )}

//       {/* Code Viewer Modal */}
//       {selectedFile && (
//         <div style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: 'rgba(0,0,0,0.5)',
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           zIndex: 1000
//         }}>
//           <div style={{
//             backgroundColor: 'white',
//             padding: '20px',
//             borderRadius: '8px',
//             maxWidth: '90%',
//             maxHeight: '90%',
//             overflow: 'auto',
//             boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
//           }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
//               <div>
//                 <h3 style={{ margin: '0 0 10px 0' }}>{selectedFile.name}</h3>
//                 <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                   File: {selectedFile.file}
//                 </p>
//                 <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                   Lines: {selectedFile.startLine} - {selectedFile.endLine}
//                 </p>
//               </div>
//               <button
//                 onClick={() => {
//                   setSelectedFile(null);
//                   setFileContent(null);
//                 }}
//                 style={{
//                   height: '40px',
//                   padding: '0 20px',
//                   cursor: 'pointer',
//                   backgroundColor: '#f44336',
//                   color: 'white',
//                   border: 'none',
//                   borderRadius: '4px'
//                 }}
//               >
//                 Close
//               </button>
//             </div>

//             {fileLoading ? (
//               <div style={{ padding: '20px', textAlign: 'center' }}>Loading code...</div>
//             ) : fileContent?.error ? (
//               <div style={{ padding: '20px', color: 'red' }}>Failed to load file content</div>
//             ) : fileContent ? (
//               <pre style={{
//                 backgroundColor: '#f5f5f5',
//                 padding: '15px',
//                 overflow: 'auto',
//                 borderRadius: '4px',
//                 maxHeight: '500px',
//                 border: '1px solid #ddd'
//               }}>
//                 <code style={{ fontSize: '13px', fontFamily: 'monospace' }}>
//                   {fileContent.content}
//                 </code>
//               </pre>
//             ) : null}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Analysis;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Package,
  Menu,
  BarChart3,
  Activity,
  LogOut,
  UserPlus,
  X,
  Settings,
  Gem,
  Receipt,
  FileCode,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Code2,
  Terminal,
  Info,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  ArrowDownRight,
  GitBranch,
  Layers,
  HelpCircle,
} from "lucide-react";
import AISuggestionsPanel from "../components/aisuggestions";
const Analysis = () => {
  const { projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [combinedData, setCombinedData] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState({ name: "User" });
  // Hooks tab states
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedViolationType, setSelectedViolationType] = useState("all");
  const [expandedViolations, setExpandedViolations] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  // First try to get from hooks (new format), fall back to analysisReport (legacy format)
  const hooksData = combinedData?.hooks || {};
  const hooksResults = hooksData?.results || {};
  const allViolations = hooksResults?.violations || [];

  const violationTypes = [...new Set(allViolations.map((v) => v.type))];
  // Add these after your existing state declarations
  const [selectedPropSeverity, setSelectedPropSeverity] = useState("all");
  const [expandedPropIssues, setExpandedPropIssues] = useState({});

  // Get prop drilling data
  // REPLACE WITH:
  const propDrillingData = combinedData?.propDrilling || {};
  const propDrillingResults = propDrillingData?.results || {};

  // Use chains data if issues array is not populated
  const propDrillingIssues =
    propDrillingResults?.propDrillingIssues ||
    propDrillingResults?.issues ||
    [];

  // If we have chains but no formatted issues, format them
  const formattedChains =
    propDrillingResults?.chains?.map((chainData, idx) => ({
      prop: chainData.prop,
      severity:
        chainData.chain?.length >= 4
          ? "high"
          : chainData.chain?.length >= 3
          ? "medium"
          : "low",
      chainLength: chainData.chain?.length || 0,
      chain: chainData.chain || [],
      intermediateComponents: (chainData.chain?.length || 0) - 2,
      message: `Prop "${chainData.prop}" is passed through ${
        chainData.chain?.length || 0
      } components`,
      recommendation: `Consider using React Context, state management (Redux/Zustand), or component composition to avoid prop drilling.`,
    })) || [];

  const displayIssues =
    propDrillingIssues.length > 0 ? propDrillingIssues : formattedChains;

  const propDrillingSummary = propDrillingResults?.summary || {
    totalIssues: displayIssues.length,
    highSeverity: displayIssues.filter((i) => i.severity === "high").length,
    mediumSeverity: displayIssues.filter((i) => i.severity === "medium").length,
    lowSeverity: displayIssues.filter((i) => i.severity === "low").length,
  };
  const togglePropIssue = (index) => {
    setExpandedPropIssues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  // Filter prop drilling issues
  const filteredPropIssues = displayIssues.filter((issue) => {
    return (
      selectedPropSeverity === "all" || issue.severity === selectedPropSeverity
    );
  });
  const filteredViolations = allViolations.filter((violation) => {
    const matchesSeverity =
      selectedSeverity === "all" || violation.severity === selectedSeverity;
    const matchesType =
      selectedViolationType === "all" ||
      violation.type === selectedViolationType;
    return matchesSeverity && matchesType;
  });
  // Fetch user + analysis on mount / project change
  useEffect(() => {
    const token = localStorage.getItem("token");
    checkUserStatus(token);
    fetchCombinedAnalysis(token);
  }, [projectId]);

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
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProfileDropdown &&
        !event.target.closest(".profile-dropdown-container")
      ) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  const checkUserStatus = async (authToken) => {
    try {
      if (!authToken) {
        setUser({ name: "Demo User" });
        return;
      }

      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const userData = res.data || {};
      setUser({ name: userData.name || "User", ...userData });
    } catch (err) {
      console.error("Error checking user status:", err);
      setUser({ name: "User" });
    }
  };

  const fetchCombinedAnalysis = async (authToken) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `http://localhost:5000/api/projects/${projectId}/analysis`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setCombinedData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError(err.response?.data?.message || "Failed to fetch analysis data");
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath, startLine, endLine) => {
    try {
      setFileLoading(true);
      setFileContent(null);

      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/projects/${projectId}/file-content`,
        {
          params: { filePath, startLine, endLine },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFileContent(res.data);
      setFileLoading(false);
    } catch (err) {
      console.error("Failed to fetch file content:", err);
      setFileContent({ content: "Failed to load file content", error: true });
      setFileLoading(false);
    }
  };

  const duplicationData = combinedData?.duplication || {};
  const qualityData = combinedData?.codeQuality || {};
  const summary = combinedData?.summary || {};

  const dupStats = duplicationData?.results?.stats || {};
  const qualityStats = qualityData?.results?.stats || {};

  const apiRouteIssues = qualityData?.results?.apiRouteIssues || [];
  const mongooseIssues = qualityData?.results?.mongooseQueryIssues || [];
  const redundantIssues = qualityData?.results?.redundantQueryIssues || [];

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading analysis...</p>
        </div>
      </div>
    );
  }
  const toggleViolation = (index) => {
    setExpandedViolations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return colors[severity] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: <XCircle className="w-3 h-3" />,
      high: <AlertOctagon className="w-3 h-3" />,
      medium: <AlertTriangle className="w-3 h-3" />,
      low: <AlertCircle className="w-3 h-3" />,
    };
    return icons[severity] || <AlertCircle className="w-3 h-3" />;
  };

  const getViolationTypeLabel = (type) => {
    const labels = {
      "missing-deps": "Missing Dependencies",
      "exhaustive-deps": "Exhaustive Dependencies",
      "rules-of-hooks": "Rules of Hooks",
      "stale-closure": "Stale Closure",
      "missing-cleanup": "Missing Cleanup",
      "unnecessary-effect": "Unnecessary Effect",
      // Add new types from your MongoDB data
      HOOK_IN_LOOP: "Hook in Loop",
      HOOK_IN_CONDITIONAL: "Hook in Conditional",
      MISSING_DEPENDENCY: "Missing Dependency",
      EXHAUSTIVE_DEPS: "Exhaustive Dependencies",
      STALE_CLOSURE: "Stale Closure",
      MISSING_CLEANUP: "Missing Cleanup",
      UNNECESSARY_EFFECT: "Unnecessary Effect",
    };
    return (
      labels[type] ||
      type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg w-full text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() =>
                fetchCombinedAnalysis(localStorage.getItem("token"))
              }
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => (window.location.href = "/projects")}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!combinedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No analysis data available.</p>
      </div>
    );
  }

  const printStats = () => {
    const duplicationExact = duplicationData?.results?.exactClones || [];
    const duplicationNear = duplicationData?.results?.nearClones || [];

    const hooksSummary = hooksResults?.summary || {};
    const hooksViolations = allViolations || [];

    const propStats = propDrillingResults?.stats || null;
    const propChainsCount = propDrillingResults?.chains?.length || 0;
    const propIssuesAll = displayIssues || [];
    const propSummary = propDrillingSummary || {
      totalIssues: propIssuesAll.length,
      highSeverity: propIssuesAll.filter((i) => i.severity === "high").length,
      mediumSeverity: propIssuesAll.filter((i) => i.severity === "medium")
        .length,
      lowSeverity: propIssuesAll.filter((i) => i.severity === "low").length,
    };

    const routes = apiRouteIssues || [];
    const mongoose = mongooseIssues || [];
    const redundant = redundantIssues || [];

    const startedAt = duplicationData?.startedAt
      ? new Date(duplicationData.startedAt).toLocaleString()
      : "N/A";
    const completedAt = duplicationData?.completedAt
      ? new Date(duplicationData.completedAt).toLocaleString()
      : "N/A";

    const safe = (v) =>
      String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const renderIssueTable = (items, columns, emptyText) => {
      if (!items || items.length === 0)
        return `<p class="muted">${safe(emptyText)}</p>`;
      return `
      <table>
        <thead>
          <tr>${columns.map((c) => `<th>${safe(c.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${items
            .map((row, idx) => {
              const tds = columns
                .map((c) => {
                  const raw =
                    typeof c.value === "function"
                      ? c.value(row, idx)
                      : row?.[c.value];
                  const cls = c.className ? ` class="${c.className}"` : "";
                  return `<td${cls}>${safe(raw)}</td>`;
                })
                .join("");
              return `<tr>${tds}</tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;
    };

    const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Smellify – Full Analysis Report</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1 { margin: 0 0 6px; font-size: 22px; }
        .meta { font-size: 13px; color: #555; margin-bottom: 18px; line-height: 1.5; }
        h2 { margin-top: 26px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; font-size: 18px; }
        h3 { margin-top: 16px; font-size: 14px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
        .k { font-size: 12px; color: #555; }
        .v { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .muted { color: #666; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
        th { background: #f3f4f6; text-align: left; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; word-break: break-all; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; border: 1px solid #d1d5db; background: #f9fafb; }
        .b-red { background: #fee2e2; border-color: #fecaca; }
        .b-amber { background: #fef3c7; border-color: #fde68a; }
        .b-blue { background: #dbeafe; border-color: #bfdbfe; }
        .b-green { background: #dcfce7; border-color: #bbf7d0; }
        .section { page-break-inside: avoid; }
        .pb { page-break-before: always; }
        @media print {
          body { padding: 0; }
          .pb { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <h1>Full Analysis Report</h1>
      <div class="meta">
        <strong>Project:</strong> ${safe(
          combinedData?.projectName || "N/A"
        )} <br/>
        <strong>Type:</strong> ${safe(combinedData?.projectType || "N/A")} <br/>
        <strong>Generated:</strong> ${safe(new Date().toLocaleString())} <br/>
        <strong>Analysis Started:</strong> ${safe(startedAt)} <br/>
        <strong>Analysis Completed:</strong> ${safe(completedAt)}
      </div>

      <h2>Overview</h2>
      <div class="grid">
        <div class="card"><div class="k">Total Files</div><div class="v">${safe(
          summary.totalFiles || dupStats.totalFiles || 0
        )}</div></div>
        <div class="card"><div class="k">Exact Clones</div><div class="v">${safe(
          summary.exactClones || dupStats.exactCloneGroups || 0
        )}</div></div>
        <div class="card"><div class="k">Near Clones</div><div class="v">${safe(
          summary.nearClones || dupStats.nearCloneGroups || 0
        )}</div></div>
        <div class="card"><div class="k">Duplicated Units</div><div class="v">${safe(
          dupStats.duplicatedUnits || 0
        )}</div></div>

        <div class="card"><div class="k">API Route Issues</div><div class="v">${safe(
          summary.apiRouteIssues || routes.length || 0
        )}</div></div>
        <div class="card"><div class="k">Query Issues</div><div class="v">${safe(
          (summary.mongooseQueryIssues || 0) +
            (summary.redundantQueryIssues || 0) ||
            mongoose.length + redundant.length
        )}</div></div>
        <div class="card"><div class="k">Hooks Issues</div><div class="v">${safe(
          hooksSummary.totalViolations || hooksViolations.length || 0
        )}</div></div>
        <div class="card"><div class="k">Prop Drilling Issues</div><div class="v">${safe(
          propSummary.totalIssues || 0
        )}</div></div>
      </div>

      <div class="pb"></div>

      <h2>Duplicated Code</h2>

      <h3>Exact Clone Groups <span class="badge b-red">${safe(
        duplicationExact.length
      )}</span></h3>
      ${
        duplicationExact.length === 0
          ? `<p class="muted">No exact clones found.</p>`
          : duplicationExact
              .map(
                (group) => `
          <div class="section">
            <h3>
              Group #${safe(
                group.groupId
              )} <span class="badge b-red">Exact</span>
              <span class="muted">(${safe(
                group.duplicateCount
              )} duplicates, ${safe(group.type || "")})</span>
            </h3>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Type</th><th>Name</th><th>File</th><th>Lines</th>
                </tr>
              </thead>
              <tbody>
                ${(group.occurrences || [])
                  .map(
                    (o, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${safe(o.type)}</td>
                    <td class="mono">${safe(o.name)}</td>
                    <td class="mono">${safe(o.file)}</td>
                    <td>${safe(o.startLine)} to ${safe(o.endLine)} (${safe(
                      o.lineCount
                    )} lines)</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
              )
              .join("")
      }

      <h3 class="pb">Near Clone Groups <span class="badge b-amber">${safe(
        duplicationNear.length
      )}</span></h3>
      ${
        duplicationNear.length === 0
          ? `<p class="muted">No near clones found.</p>`
          : duplicationNear
              .map(
                (group) => `
          <div class="section">
            <h3>
              Group #${safe(
                group.groupId
              )} <span class="badge b-amber">Near</span>
              <span class="muted">(Similarity ${safe(
                ((group.similarity || 0) * 100).toFixed(1)
              )}%, ${safe(group.type || "")})</span>
            </h3>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Type</th><th>Name</th><th>File</th><th>Lines</th>
                </tr>
              </thead>
              <tbody>
                ${(group.occurrences || [])
                  .map(
                    (o, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${safe(o.type)}</td>
                    <td class="mono">${safe(o.name)}</td>
                    <td class="mono">${safe(o.file)}</td>
                    <td>${safe(o.startLine)} to ${safe(o.endLine)} (${safe(
                      o.lineCount
                    )} lines)</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
              )
              .join("")
      }

      <div class="pb"></div>

      <h2>Hooks Issues</h2>
      <div class="grid">
        <div class="card"><div class="k">Total</div><div class="v">${safe(
          hooksSummary.totalViolations || hooksViolations.length || 0
        )}</div></div>
        <div class="card"><div class="k">Critical</div><div class="v">${safe(
          hooksSummary.criticalViolations ||
            hooksViolations.filter((v) => v.severity === "critical").length ||
            0
        )}</div></div>
        <div class="card"><div class="k">High</div><div class="v">${safe(
          hooksSummary.highViolations ||
            hooksViolations.filter((v) => v.severity === "high").length ||
            0
        )}</div></div>
        <div class="card"><div class="k">Medium</div><div class="v">${safe(
          hooksSummary.mediumViolations ||
            hooksViolations.filter((v) => v.severity === "medium").length ||
            0
        )}</div></div>
      </div>

      ${renderIssueTable(
        hooksViolations,
        [
          { label: "Severity", value: (r) => (r.severity || "").toUpperCase() },
          { label: "Type", value: (r) => r.type },
          { label: "Message", value: (r) => r.message },
          { label: "File", value: (r) => r.file, className: "mono" },
          { label: "Line", value: (r) => r.line },
        ],
        "No hooks violations found."
      )}

      <div class="pb"></div>

      // Inside printStats() function, update the Prop Drilling section:

<h2>Prop Drilling</h2>
<div class="grid">
  <div class="card"><div class="k">Total Issues</div><div class="v">${safe(
    propSummary.totalIssues || 0
  )}</div></div>
  <div class="card"><div class="k">High</div><div class="v">${safe(
    propSummary.highSeverity || 0
  )}</div></div>
  <div class="card"><div class="k">Medium</div><div class="v">${safe(
    propSummary.mediumSeverity || 0
  )}</div></div>
  <div class="card"><div class="k">Low</div><div class="v">${safe(
    propSummary.lowSeverity || 0
  )}</div></div>
</div>

${
  propStats
    ? `
  <h3>Analysis Stats</h3>
  <table>
    <tr><th>Total Files</th><td>${safe(propStats.totalFiles || 0)}</td></tr>
    <tr><th>Total Components</th><td>${safe(
      propStats.totalComponents || 0
    )}</td></tr>
    <tr><th>Affected Props</th><td>${safe(
      propSummary.affectedProps || 0
    )}</td></tr>
    <tr><th>Affected Files</th><td>${safe(
      propSummary.affectedFiles || 0
    )}</td></tr>
    <tr><th>Deepest Chain</th><td>${safe(
      propSummary.deepestChain || 0
    )}</td></tr>
    <tr><th>Total Drilling Points</th><td>${safe(
      propSummary.totalDrillingPoints || 0
    )}</td></tr>
  </table>
`
    : ""
}

${renderIssueTable(
  propIssuesAll,
  [
    { label: "Severity", value: (r) => (r.severity || "").toUpperCase() },
    { label: "Prop", value: (r) => r.prop },
    { label: "Depth", value: (r) => r.depth || r.fullChain?.length || 0 },
    {
      label: "Drilling Points",
      value: (r) => r.locations?.drillingPoints?.length || 0,
    },
    {
      label: "Source",
      value: (r) => r.locations?.source?.component || "N/A",
    },
    {
      label: "Destination",
      value: (r) => r.locations?.finalDestination?.component || "N/A",
    },
  ],
  "No prop drilling issues found."
)}

      <div class="pb"></div>

      <h2>API Route Issues</h2>
      ${renderIssueTable(
        routes,
        [
          {
            label: "Severity",
            value: (r) => (r.severity || "MEDIUM").toUpperCase(),
          },
          { label: "Type", value: (r) => r.type },
          { label: "Message", value: (r) => r.message },
          {
            label: "Route",
            value: (r) => (r.route ? `${r.method || ""} ${r.route}` : "N/A"),
            className: "mono",
          },
          { label: "File", value: (r) => r.file, className: "mono" },
          { label: "Line", value: (r) => r.line },
          { label: "Suggestion", value: (r) => r.suggestion || "" },
        ],
        "No API route issues found."
      )}

      <div class="pb"></div>

      <h2>Query Issues</h2>

      <h3>Mongoose Query Issues <span class="badge b-red">${safe(
        mongoose.length
      )}</span></h3>
      ${renderIssueTable(
        mongoose,
        [
          {
            label: "Severity",
            value: (r) => (r.severity || "MEDIUM").toUpperCase(),
          },
          { label: "Type", value: (r) => r.type },
          { label: "Message", value: (r) => r.message },
          { label: "File", value: (r) => r.file, className: "mono" },
          { label: "Line", value: (r) => r.line },
          { label: "Suggestion", value: (r) => r.suggestion || "" },
        ],
        "No mongoose query issues found."
      )}

      <h3 class="pb">Redundant Query Issues <span class="badge b-amber">${safe(
        redundant.length
      )}</span></h3>
      ${renderIssueTable(
        redundant,
        [
          {
            label: "Severity",
            value: (r) => (r.severity || "MEDIUM").toUpperCase(),
          },
          { label: "Type", value: (r) => r.type },
          { label: "Message", value: (r) => r.message },
          { label: "File", value: (r) => r.file, className: "mono" },
          { label: "Line", value: (r) => r.line },
          { label: "Suggestion", value: (r) => r.suggestion || "" },
        ],
        "No redundant query issues found."
      )}

      <script>
        window.onload = () => window.print();
      </script>
    </body>
  </html>
  `;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed lg:sticky lg:top-0 lg:self-stretch h-screen z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-bold text-sm">
              S
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

        <nav className="flex-1 px-3 py-6">
          <div className="mb-6">
            {sidebarOpen && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Dashboard</span>}
              </button>
              <button
                onClick={() => (window.location.href = "/projects")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Projects</span>}
              </button>
              <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg">
                <Activity className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Analysis</span>}
              </button>
              <button
                onClick={() => (window.location.href = "/plans")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Gem className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Plans</span>}
              </button>
              <button
                onClick={() => (window.location.href = "/billing")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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

        <div className="hidden lg:block px-3 pb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main layout */}
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
              Project Analysis
            </h1>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#4A23EF] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A33FF]"
              >
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = "/referral";
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-3 text-gray-500" />
                    Referrals
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = "/settings";
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/";
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

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Project heading */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              {combinedData.projectName}
            </h2>
            <p className="text-gray-500 text-sm">
              Project Type:{" "}
              <span className="font-medium">MERN</span>
            </p>
          </div>
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("exact")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "exact"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Exact Clones ({summary.exactClones || 0})
              </button>
              <button
                onClick={() => setActiveTab("near")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "near"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Near Clones ({summary.nearClones || 0})
              </button>
              <button
                onClick={() => setActiveTab("routes")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "routes"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                API Route Issues ({summary.apiRouteIssues || 0})
              </button>
              <button
                onClick={() => setActiveTab("queries")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "queries"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Query Issues{" "}
                {(summary.mongooseQueryIssues || 0) +
                  (summary.redundantQueryIssues || 0)}
              </button>
              <button
                onClick={() => setActiveTab("hooks")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "hooks"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Hooks Issues (
                {hooksResults?.summary?.totalViolations ||
                  allViolations.length ||
                  0}
                )
              </button>
              <button
                onClick={() => setActiveTab("props")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "props"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Prop Drilling ({summary.propDrillingIssues || 0})
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "ai"
                    ? "border-[#5A33FF] text-[#5A33FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                AI Suggestions
              </button>
            </div>
          </div>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              {/* Top metric cards */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Total Files
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {summary.totalFiles || dupStats.totalFiles || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <FileCode className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Total Code Units
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {dupStats.totalUnits || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Exact Clones
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {summary.exactClones || dupStats.exactCloneGroups || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <AlertCircle className="w-5 h-5 lg:w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Near Clones
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {summary.nearClones || dupStats.nearCloneGroups || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 ml-2">
                      <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Duplication detailed stats */}
              {dupStats && Object.keys(dupStats).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">
                      Analysis Statistics
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Total Files Analyzed
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {dupStats.totalFiles || 0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Total Code Units
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {dupStats.totalUnits || 0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Duplicated Units
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {dupStats.duplicatedUnits || 0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Total Routes
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {qualityStats.routeCount || 0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Total Issues Found
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {qualityStats.totalIssuesFound || 0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Hooks Issues Found
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {hooksResults?.summary?.totalViolations ||
                          allViolations.length ||
                          0}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Prop Drilling Issues Found
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {summary.propDrillingIssues || 0}
                      </span>
                    </div>

                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Analysis Started
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {duplicationData.startedAt
                          ? new Date(duplicationData.startedAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        Analysis Completed
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {duplicationData.completedAt
                          ? new Date(
                              duplicationData.completedAt
                            ).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Stats</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Print a clean report of key analysis metrics.
                  </p>
                </div>

                <button
                  onClick={printStats}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
                >
                  Print Stats
                </button>
              </div>
            </div>
          )}
          {/* EXACT CLONES TAB */}
          {activeTab === "exact" && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Exact Clone Groups
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    These are code blocks with identical structure (same logic,
                    different variable names).
                  </p>
                </div>
              </div>

              {!duplicationData?.results?.exactClones ||
              duplicationData.results.exactClones.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Excellent! No exact clones found
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your code doesn't have any identical blocks.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {duplicationData.results.exactClones.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-gray-900">
                            Group #{group.groupId} - {group.type}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            {group.duplicateCount} duplicates
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                File
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Lines
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.occurrences.map((occurrence, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {occurrence.type}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  <span className="font-mono">
                                    {occurrence.name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono break-all">
                                  {occurrence.file}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                  {occurrence.startLine} - {occurrence.endLine}
                                  <span className="ml-2 text-gray-500">
                                    ({occurrence.lineCount} lines)
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <button
                                    onClick={() => {
                                      setSelectedFile(occurrence);
                                      fetchFileContent(
                                        occurrence.file,
                                        occurrence.startLine,
                                        occurrence.endLine
                                      );
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
                                  >
                                    View Code
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* NEAR CLONES TAB */}
          {activeTab === "near" && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Near Clone Groups
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    These are code blocks with similar structure (80%+
                    similarity).
                  </p>
                </div>
              </div>

              {!duplicationData?.results?.nearClones ||
              duplicationData.results.nearClones.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    Excellent! No near clones found
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your code doesn't have any similar blocks.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {duplicationData.results.nearClones.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-gray-900">
                            Group #{group.groupId} - {group.type}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            Similarity: {(group.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                File
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Lines
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.occurrences.map((occurrence, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {occurrence.type}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  <span className="font-mono">
                                    {occurrence.name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono break-all">
                                  {occurrence.file}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                  {occurrence.startLine} - {occurrence.endLine}
                                  <span className="ml-2 text-gray-500">
                                    ({occurrence.lineCount} lines)
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <button
                                    onClick={() => {
                                      setSelectedFile(occurrence);
                                      fetchFileContent(
                                        occurrence.file,
                                        occurrence.startLine,
                                        occurrence.endLine
                                      );
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
                                  >
                                    View Code
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* API ROUTE ISSUES TAB */}
          {activeTab === "routes" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                API Route Issues
              </h2>
              <p className="text-gray-600 mb-4">
                Issues found in your API route handlers.
              </p>

              {!apiRouteIssues || apiRouteIssues.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    No API route issues found
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your routes look well implemented.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiRouteIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow-sm border border-amber-300 overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              {(issue.severity || "MEDIUM").toUpperCase()}
                            </span>
                            <span className="ml-3 font-semibold text-gray-900">
                              {issue.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4">
                        <p className="text-gray-800 mb-3">{issue.message}</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">File:</span>{" "}
                            {issue.file}
                          </p>
                          {issue.route && (
                            <p>
                              <span className="font-medium">Route:</span>{" "}
                              <code className="bg-gray-100 px-1 rounded">
                                {issue.route}
                              </code>{" "}
                              ({issue.method})
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Line:</span>{" "}
                            {issue.line}
                          </p>
                        </div>

                        {issue.suggestion && (
                          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                            <span className="font-semibold mr-1">
                              Suggestion:
                            </span>
                            {issue.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* QUERY ISSUES TAB */}
          {activeTab === "queries" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Database Query Issues
                </h2>
                <p className="text-gray-600 mb-4">
                  Potential problems and inefficiencies detected in your
                  Mongoose queries.
                </p>
              </div>

              {/* Mongoose Query Issues */}
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  Mongoose Query Issues
                </h3>
                <p className="text-gray-600 mb-3">
                  Problems with Mongoose query patterns.
                </p>

                {!mongooseIssues || mongooseIssues.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      No Mongoose query issues found!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mongooseIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-sm border border-red-300 overflow-hidden"
                      >
                        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                              {(issue.severity || "MEDIUM").toUpperCase()}
                            </span>
                            <span className="ml-3 font-semibold text-gray-900">
                              {issue.type}
                            </span>
                          </div>
                        </div>

                        <div className="px-6 py-4">
                          <p className="text-gray-800 mb-3">{issue.message}</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">File:</span>{" "}
                              {issue.file}
                            </p>
                            <p>
                              <span className="font-medium">Line:</span>{" "}
                              {issue.line}
                            </p>
                          </div>
                          {issue.suggestion && (
                            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                              <span className="font-semibold mr-1">
                                Suggestion:
                              </span>
                              {issue.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Redundant Query Issues */}
              <div>
                <h3 className="text-lg font-semibold text-amber-700 mb-2">
                  Redundant Query Issues
                </h3>
                <p className="text-gray-600 mb-3">
                  Multiple queries that could be optimized or merged.
                </p>

                {!redundantIssues || redundantIssues.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      No redundant query issues found!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {redundantIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-sm border border-amber-300 overflow-hidden"
                      >
                        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              {(issue.severity || "MEDIUM").toUpperCase()}
                            </span>
                            <span className="ml-3 font-semibold text-gray-900">
                              {issue.type}
                            </span>
                          </div>
                        </div>

                        <div className="px-6 py-4">
                          <p className="text-gray-800 mb-3">{issue.message}</p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">File:</span>{" "}
                              {issue.file}
                            </p>
                            <p>
                              <span className="font-medium">Line:</span>{" "}
                              {issue.line}
                            </p>
                          </div>
                          {issue.suggestion && (
                            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                              <span className="font-semibold mr-1">
                                💡 Suggestion:
                              </span>
                              {issue.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "hooks" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Total Violations
                    </span>
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {hooksResults?.summary?.totalViolations ||
                      allViolations.length ||
                      0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-red-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-600">
                      Critical
                    </span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {hooksResults?.summary?.criticalViolations ||
                      allViolations.filter((v) => v.severity === "critical")
                        .length ||
                      0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-orange-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-600">
                      High
                    </span>
                    <AlertOctagon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-orange-700">
                    {hooksResults?.summary?.highViolations ||
                      allViolations.filter((v) => v.severity === "high")
                        .length ||
                      0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-yellow-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-600">
                      Medium
                    </span>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {hooksResults?.summary?.mediumViolations ||
                      allViolations.filter((v) => v.severity === "medium")
                        .length ||
                      0}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A33FF]"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Violation Type
                    </label>
                    <select
                      value={selectedViolationType}
                      onChange={(e) => setSelectedViolationType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A33FF]"
                    >
                      <option value="all">All Types</option>
                      {violationTypes.map((type) => (
                        <option key={type} value={type}>
                          {getViolationTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Showing {filteredViolations.length} of {allViolations.length}{" "}
                  violations
                </div>
              </div>

              {/* Violations List */}
              <div className="space-y-4">
                {filteredViolations.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedSeverity !== "all" ||
                      selectedViolationType !== "all"
                        ? "No Matching Violations"
                        : "No Violations Found"}
                    </h3>
                    <p className="text-gray-600">
                      {selectedSeverity !== "all" ||
                      selectedViolationType !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "Great! Your code follows React Hook best practices."}
                    </p>
                  </div>
                ) : (
                  filteredViolations.map((violation, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Violation Header */}
                      <div
                        onClick={() => toggleViolation(index)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            <div className="mr-3 mt-0.5">
                              {expandedViolations[index] ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                                    violation.severity
                                  )}`}
                                >
                                  {getSeverityIcon(violation.severity)}
                                  <span className="ml-1.5">
                                    {violation.severity.toUpperCase()}
                                  </span>
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  {getViolationTypeLabel(violation.type)}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {violation.message}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 space-x-4">
                                <span className="flex items-center">
                                  <FileCode2 className="w-4 h-4 mr-1" />
                                  {violation.file}
                                </span>
                                <span className="flex items-center">
                                  <Code2 className="w-4 h-4 mr-1" />
                                  Line {violation.line}
                                  {/* :{violation.column} */}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Violation Details (Expanded) */}
                      {expandedViolations[index] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Code Snippet */}
                          {violation.codeSnippet && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <Terminal className="w-4 h-4 text-gray-600 mr-2" />
                                <h4 className="text-sm font-semibold text-gray-700">
                                  Code Snippet
                                </h4>
                              </div>
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-sm text-gray-100 font-mono">
                                  {violation.codeSnippet}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Explanation */}
                          {violation.explanation && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <Info className="w-4 h-4 text-blue-600 mr-2" />
                                <h4 className="text-sm font-semibold text-gray-700">
                                  Why This Is Wrong
                                </h4>
                              </div>
                              <p className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                {violation.explanation}
                              </p>
                            </div>
                          )}

                          {/* Recommendation */}
                          {violation.recommendation && (
                            <div>
                              <div className="flex items-center mb-2">
                                <Lightbulb className="w-4 h-4 text-green-600 mr-2" />
                                <h4 className="text-sm font-semibold text-gray-700">
                                  How to Fix
                                </h4>
                              </div>
                              <p className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3">
                                {violation.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "props" && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Prop Drilling Analysis
                </h2>
                <p className="text-gray-600">
                  Detect components that pass props through multiple layers
                  without using them
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Total Issues
                    </span>
                    <ArrowDownRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {propDrillingSummary?.totalIssues || 0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-red-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-600">
                      High
                    </span>
                    <AlertOctagon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {propDrillingSummary?.highSeverity || 0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-yellow-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-600">
                      Medium
                    </span>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {propDrillingSummary?.mediumSeverity || 0}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-blue-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      Low
                    </span>
                    <Info className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {propDrillingSummary?.lowSeverity || 0}
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              {propDrillingResults?.stats && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Analysis Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <FileCode className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-gray-600">Files Analyzed</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {propDrillingResults.stats.totalFiles || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Layers className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-gray-600">Components Found</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {propDrillingResults.stats.totalComponents || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <GitBranch className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-gray-600">Prop Chains</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {propDrillingResults?.chains?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Severity
                    </label>
                    <select
                      value={selectedPropSeverity}
                      onChange={(e) => setSelectedPropSeverity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A33FF]"
                    >
                      <option value="all">All Severities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredPropIssues.length} of{" "}
                    {displayIssues.length} issues
                  </div>
                </div>
              </div>

              {/* Issues List */}
              {filteredPropIssues.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedPropSeverity !== "all"
                      ? "No Matching Issues"
                      : "No Prop Drilling Issues Found"}
                  </h3>
                  <p className="text-gray-600">
                    {selectedPropSeverity !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "Great! Your components don't have prop drilling problems."}
                  </p>
                </div>
              ) : (
                filteredPropIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Issue Header */}
                    <div
                      onClick={() => togglePropIssue(index)}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <div className="mr-3 mt-0.5">
                            {expandedPropIssues[index] ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                                  issue.severity
                                )}`}
                              >
                                {getSeverityIcon(issue.severity)}
                                <span className="ml-1.5">
                                  {issue.severity?.toUpperCase()}
                                </span>
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                Chain Length:{" "}
                                {issue.depth || issue.fullChain?.length || 0}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                {issue.locations?.drillingPoints?.length || 0}{" "}
                                drilling point
                                {issue.locations?.drillingPoints?.length !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Prop "{issue.prop}" drilled through{" "}
                              {issue.depth || issue.fullChain?.length || 0}{" "}
                              levels
                            </h3>

                            {/* Source and Destination Preview */}
                            <div className="text-sm text-gray-600 space-y-1 mb-3">
                              {issue.locations?.source && (
                                <div>
                                  <span className="font-medium">Source:</span>{" "}
                                  {issue.locations.source.component}
                                </div>
                              )}
                              {issue.locations?.finalDestination && (
                                <div>
                                  <span className="font-medium">
                                    Destination:
                                  </span>{" "}
                                  {issue.locations.finalDestination.component}
                                </div>
                              )}
                            </div>

                            {/* Chain Preview */}
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-500">Chain:</span>
                              <div className="flex items-center space-x-1 overflow-x-auto">
                                {issue.fullChain?.slice(0, 3).map((node, i) => (
                                  <React.Fragment key={i}>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        node.usedHere
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-600"
                                      }`}
                                    >
                                      {node.component}
                                    </span>
                                    {i <
                                      Math.min(
                                        (issue.fullChain?.length || 0) - 1,
                                        2
                                      ) && (
                                      <ArrowDownRight className="w-4 h-4 text-gray-400" />
                                    )}
                                  </React.Fragment>
                                ))}
                                {(issue.fullChain?.length || 0) > 3 && (
                                  <span className="text-gray-400">
                                    ... +{issue.fullChain.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Issue Details (Expanded) */}
                    {expandedPropIssues[index] && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {/* Drilling Points Section - NEW */}
                        {issue.locations?.drillingPoints?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center mb-3">
                              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Drilling Points (Components that only forward
                                props)
                              </h4>
                            </div>
                            <div className="bg-white rounded-lg border border-orange-200 p-4 space-y-3">
                              {issue.locations.drillingPoints.map(
                                (point, i) => (
                                  <div
                                    key={i}
                                    className="border-l-4 border-orange-400 pl-4"
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="font-medium text-gray-900">
                                        {point.component}
                                      </span>
                                      <span className="text-xs text-orange-600 font-medium">
                                        {point.issue}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div className="font-mono">
                                        {point.file}:{point.line}
                                      </div>
                                      <div className="text-red-600">
                                        {point.description}
                                      </div>
                                      <div>
                                        Passed to:{" "}
                                        <span className="font-medium">
                                          {point.passedTo}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Full Chain Visualization */}
                        <div className="mb-4">
                          <div className="flex items-center mb-3">
                            <GitBranch className="w-4 h-4 text-gray-600 mr-2" />
                            <h4 className="text-sm font-semibold text-gray-700">
                              Complete Prop Chain
                            </h4>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="space-y-2">
                              {issue.fullChain?.map((node, i) => (
                                <div key={i} className="flex items-start">
                                  <div className="flex flex-col items-center mr-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        node.usedHere
                                          ? "bg-green-500 text-white"
                                          : "bg-red-500 text-white"
                                      }`}
                                    >
                                      {i + 1}
                                    </div>
                                    {i < (issue.fullChain?.length || 0) - 1 && (
                                      <div className="w-0.5 h-8 bg-gray-300"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-900">
                                        {node.component}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {node.line && (
                                          <span className="text-xs text-gray-500 font-mono">
                                            Line {node.line}
                                          </span>
                                        )}
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full ${
                                            node.usedHere
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {node.usedHere
                                            ? "✓ Used"
                                            : "✗ Not Used"}
                                        </span>
                                      </div>
                                    </div>
                                    {node.file && (
                                      <div className="text-xs text-gray-500 font-mono break-all">
                                        {node.file}
                                      </div>
                                    )}
                                    {node.passedTo && !node.usedHere && (
                                      <div className="text-xs text-orange-600 mt-1">
                                        → Passed to: {node.passedTo}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Recommendation - UPDATED to use new structure */}
                        {issue.recommendation && (
                          <div>
                            <div className="flex items-center mb-2">
                              <Lightbulb className="w-4 h-4 text-green-600 mr-2" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                {issue.recommendation.solution || "How to Fix"}
                              </h4>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700 mb-3">
                                {issue.recommendation.reason ||
                                  issue.recommendation}
                              </p>
                              {issue.recommendation.steps &&
                                issue.recommendation.steps.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-green-200">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">
                                      Suggested steps:
                                    </p>
                                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                                      {issue.recommendation.steps.map(
                                        (step, i) => (
                                          <li key={i}>{step}</li>
                                        )
                                      )}
                                    </ol>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Analysis Metadata */}
              {propDrillingData?.startedAt && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Analysis Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Started At:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {new Date(propDrillingData.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Completed At:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {propDrillingData.completedAt
                          ? new Date(
                              propDrillingData.completedAt
                            ).toLocaleString()
                          : "In Progress"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                          propDrillingData.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {propDrillingData.status || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "ai" && (
  <div>
    {combinedData?.aiSuggestions?.status === 'completed' ? (
      <AISuggestionsPanel 
        analysisData={combinedData} 
        preloadedSuggestions={combinedData.aiSuggestions}
      />
    ) : combinedData?.aiSuggestions?.status === 'failed' ? (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">AI suggestions generation failed. You can regenerate them.</p>
        <AISuggestionsPanel analysisData={combinedData} />
      </div>
    ) : (
      <AISuggestionsPanel analysisData={combinedData} />
    )}
  </div>
)}
        </main>
      </div>

      {/* Code Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {selectedFile.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">File:</span>{" "}
                      <span className="font-mono">{selectedFile.file}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Lines:</span>{" "}
                      {selectedFile.startLine} - {selectedFile.endLine}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent(null);
                  }}
                  className="ml-4 p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {fileLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4" />
                    <p className="text-gray-500">Loading code...</p>
                  </div>
                </div>
              ) : fileContent?.error ? (
                <div className="text-red-600 text-sm">
                  Failed to load file content.
                </div>
              ) : fileContent?.content ? (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm font-mono leading-relaxed max-h-[60vh]">
                  <code>{fileContent.content}</code>
                </pre>
              ) : (
                <p className="text-gray-500 text-sm">No content to display.</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileContent(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
