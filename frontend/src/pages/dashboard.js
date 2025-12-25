// import { useState, useEffect, useRef } from 'react';
// import { Settings, Plus, Upload, Github, X, FileText, FolderOpen, Star, GitFork, Clock, ExternalLink, RefreshCw, AlertCircle, Bell, Check, CheckCheck, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
// import UserOnboarding from '../components/UserOnboarding';
// import api from '../services/api';
// import { useNotification } from '../components/NotificationPopup';
// import NotificationBell from '../components/NotificationBell';

// export default function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [showOnboarding, setShowOnboarding] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showUploadOptions, setShowUploadOptions] = useState(false);
//   const [showGithubRepos, setShowGithubRepos] = useState(false);
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploadError, setUploadError] = useState(null);
//   const [githubConnected, setGithubConnected] = useState(false);
//   const [githubRepos, setGithubRepos] = useState([]);
//   const [loadingRepos, setLoadingRepos] = useState(false);
//   const [importingRepo, setImportingRepo] = useState(null);
//   const [recentProjects, setRecentProjects] = useState([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const { showNotification } = useNotification();

//   // Inline API methods to avoid modifying api.js
//   const githubAPI = {
//     getStatus: () => api.get('/github/status'),
//     getRepositories: () => api.get('/github/repositories'),
//     importRepository: (repoData) => api.post('/github/import-repository', repoData),
//     getLinkUrl: () => api.get('/github/link'),
//     unlinkAccount: () => api.delete('/github/unlink'),
//     getSessionMessage: () => api.get('/github/session-message')
//   };

//   const projectsAPI = {
//     getProjects: () => api.get('/projects'),
//     getProject: (projectId) => api.get(`/projects/${projectId}`),
//     uploadZip: (formData, onUploadProgress = null) => {
//       const config = {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         }
//       };

//       if (onUploadProgress) {
//         config.onUploadProgress = onUploadProgress;
//       }

//       return api.post('/projects/upload', formData, config);
//     },
//     deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
//     getAnalysis: (projectId) => api.get(`/projects/${projectId}/analysis`)
//   };

//   useEffect(() => {
//     checkUserStatus();
//     checkGithubConnection();
//     fetchRecentProjects();
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

//       const isProfileComplete = userData.name && userData.isOnboardingComplete;

//       if (!isProfileComplete) {
//         window.location.href = '/onboarding';
//         return;
//       }

//       setUser(userData);

//     } catch (error) {
//       console.error('Error checking user status:', error);
//       showNotification('error', 'Session expired. Please sign in again!');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/signin';
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const checkGithubConnection = async () => {
//     try {
//       const response = await githubAPI.getStatus();
//       setGithubConnected(response.data.isLinked);
//     } catch (error) {
//       console.error('Error checking GitHub connection:', error);
//       showNotification('warning', 'Unable to verify GitHub connection status!');
//       setGithubConnected(false);
//     }
//   };

//   const fetchRecentProjects = async () => {
//     setLoadingProjects(true);
//     try {
//       const response = await projectsAPI.getProjects();
//       setRecentProjects(response.data.projects || []);
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       showNotification('error', 'Failed to load recent projects!');
//       setRecentProjects([]);
//     } finally {
//       setLoadingProjects(false);
//     }
//   };

//   const fetchGithubRepos = async () => {
//     setLoadingRepos(true);
//     try {
//       const response = await githubAPI.getRepositories();
//       setGithubRepos(response.data.repositories || []);
//     } catch (error) {
//       console.error('Error fetching GitHub repositories:', error);
//       if (error.response?.status === 401) {
//         showNotification('warning', 'GitHub authentication expired. Please reconnect your account!');
//         setGithubConnected(false);
//       } else {
//         showNotification('error', 'Failed to fetch GitHub repositories!');
//       }
//       setGithubRepos([]);
//     } finally {
//       setLoadingRepos(false);
//     }
//   };

// const handleImportRepo = async (repo) => {
//   setImportingRepo(repo.id);
//   try {
//     const response = await githubAPI.importRepository({
//       repositoryId: repo.id,
//       repositoryName: repo.name,
//       repositoryFullName: repo.fullName,
//       description: repo.description,
//       cloneUrl: repo.cloneUrl
//     });

//     if (response.data.success) {
//       showNotification('success', 'Repository imported successfully!');
//       setShowGithubRepos(false);
//       setShowUploadOptions(false);
//       fetchRecentProjects(); // Refresh the project list
//     }
//   } catch (error) {
//     console.error('Error importing repository:', error);

//     const errorResponse = error.response?.data;

//     // Handle MERN stack validation errors specifically
//     if (error.response?.status === 400 && errorResponse?.message) {
//       if (errorResponse.message.includes('Invalid project structure') ||
//           errorResponse.message.includes('MERN stack') ||
//           errorResponse.message.includes('package.json') ||
//           errorResponse.message.includes('Python') ||
//           errorResponse.message.includes('Java') ||
//           errorResponse.message.includes('PHP') ||
//           errorResponse.message.includes('C#')) {

//         // Show detailed validation error modal
//         setGithubValidationError({
//           repository: repo,
//           error: errorResponse.message,
//           requirements: errorResponse.requirements || [
//             'Repository must contain at least one package.json file',
//             'Repository must be a valid Node.js/React/MERN project',
//             'Repository must not contain Python, Java, PHP, C#, or other non-JavaScript backend files',
//             'Repository structure should follow standard JavaScript project conventions'
//           ]
//         });

//         showNotification('error', `Invalid MERN Stack Project: ${repo.name}`);
//         return;
//       }
//     }

//     // Handle other error types
//     if (error.response?.status === 409) {
//       showNotification('warning', 'This repository has already been imported!');
//     } else if (error.response?.status === 401) {
//       showNotification('error', 'GitHub authentication expired. Please reconnect your account!');
//       setGithubConnected(false);
//     } else {
//       const errorMessage = errorResponse?.message || 'Failed to import repository. Please try again!';
//       showNotification('error', errorMessage);
//     }
//   } finally {
//     setImportingRepo(null);
//   }
// };

// // Add state for GitHub validation error
// const [githubValidationError, setGithubValidationError] = useState(null);

//   const handleOnboardingComplete = async () => {
//     try {
//       await api.post('/auth/complete-onboarding');
//       setShowOnboarding(false);
//       showNotification('success', 'Welcome! Your account setup is complete!');
//       checkUserStatus();
//     } catch (error) {
//       console.error('Error completing onboarding:', error);
//       showNotification('error', 'Failed to complete onboarding. Please try again!');
//     }
//   };

//   const handleOnboardingSkip = async () => {
//     try {
//       await api.post('/auth/complete-onboarding');
//       setShowOnboarding(false);
//       showNotification('success', 'Account setup completed successfully!');
//       checkUserStatus();
//     } catch (error) {
//       console.error('Error skipping onboarding:', error);
//       showNotification('error', 'Failed to complete account setup. Please try again!');
//     }
//   };

//   const validateFile = (file) => {
//     const errors = [];

//     // Check file size (100MB limit)
//     const maxSize = 100 * 1024 * 1024; // 100MB in bytes
//     if (file.size > maxSize) {
//       errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit. Please upload a smaller file.`);
//     }

//     // Check file type
//     if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
//       errors.push('Only ZIP files are allowed. Please upload a ZIP file containing your MERN stack project.');
//     }

//     return errors;
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = async (e) => {
//     e.preventDefault();
//     setIsDragOver(false);

//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       const file = files[0];
//       const validationErrors = validateFile(file);

//       if (validationErrors.length > 0) {
//         setUploadError({
//           type: 'validation',
//           messages: validationErrors
//         });
//         showNotification('error', validationErrors[0]);
//         return;
//       }

//       await uploadZipFile(file);
//     }
//   };

//   const uploadZipFile = async (file) => {
//     setUploadStatus('uploading');
//     setUploadProgress(0);
//     setUploadError(null);

//     const formData = new FormData();
//     formData.append('project', file);
//     formData.append('projectName', file.name.replace('.zip', ''));
//     formData.append('source', 'zip');

//     try {
//       const response = await projectsAPI.uploadZip(formData, (progressEvent) => {
//         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//         setUploadProgress(percentCompleted);
//       });

//       setUploadStatus('success');
//       showNotification('success', 'Project uploaded and validated successfully!');
//       setShowUploadOptions(false);
//       fetchRecentProjects();

//       // Clear status after delay
//       setTimeout(() => {
//         setUploadStatus(null);
//         setUploadProgress(0);
//       }, 3000);

//     } catch (error) {
//       console.error('Error uploading project:', error);
//       setUploadStatus('error');

//       const errorResponse = error.response?.data;
//       let errorMessage = 'Upload failed. Please try again.';
//       let detailedErrors = [];

//       if (errorResponse) {
//         if (errorResponse.message) {
//           errorMessage = errorResponse.message;
//         }

//         // Handle specific error types
//         if (errorResponse.errors && errorResponse.errors.length > 0) {
//           detailedErrors = errorResponse.errors;

//           // Check for MERN stack validation errors
//           const hasMernErrors = detailedErrors.some(err =>
//             err.includes('MERN stack') ||
//             err.includes('package.json') ||
//             err.includes('src directory') ||
//             err.includes('Python') ||
//             err.includes('Java') ||
//             err.includes('PHP') ||
//             err.includes('C#')
//           );

//           if (hasMernErrors) {
//             errorMessage = 'Invalid MERN Stack Project';
//           }
//         }

//         // Handle file size errors
//         if (errorMessage.includes('File too large') || errorMessage.includes('100MB')) {
//           errorMessage = 'File size exceeds 100MB limit';
//           detailedErrors = ['Please compress your project or remove unnecessary files to reduce the file size below 100MB.'];
//         }

//         // Handle file type errors
//         if (errorMessage.includes('Only ZIP files are allowed')) {
//           errorMessage = 'Invalid file type';
//           detailedErrors = ['Please upload a ZIP file containing your MERN stack project.'];
//         }

//         setUploadError({
//           type: 'server',
//           message: errorMessage,
//           details: detailedErrors,
//           requirements: errorResponse.requirements || null
//         });
//       } else {
//         setUploadError({
//           type: 'network',
//           message: errorMessage,
//           details: ['Please check your internet connection and try again.']
//         });
//       }

//       showNotification('error', errorMessage);

//       // Clear error after delay
//       setTimeout(() => {
//         setUploadStatus(null);
//         setUploadError(null);
//         setUploadProgress(0);
//       }, 10000);
//     }
//   };

//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const validationErrors = validateFile(file);

//     if (validationErrors.length > 0) {
//       setUploadError({
//         type: 'validation',
//         messages: validationErrors
//       });
//       showNotification('error', validationErrors[0]);
//       return;
//     }

//     uploadZipFile(file);
//   };

//   const handleGithubUpload = async () => {
//     if (githubConnected) {
//       setShowGithubRepos(true);
//       fetchGithubRepos();
//     } else {
//       try {
//         const response = await api.get("/github/link");
//         if (response.data.authUrl) {
//           window.location.href = response.data.authUrl;
//         }
//       } catch (error) {
//         console.error("Error linking GitHub:", error);
//         showNotification("error", "Failed to connect to GitHub. Please try again!");
//       }
//     }
//   };

//   const handleSettingsClick = () => {
//     window.location.href = '/settings';
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'completed':
//         return 'text-green-600 bg-green-100';
//       case 'processing':
//         return 'text-blue-600 bg-blue-100';
//       case 'failed':
//         return 'text-red-600 bg-red-100';
//       default:
//         return 'text-yellow-600 bg-yellow-100';
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (showOnboarding) {
//     return (
//       <UserOnboarding
//         user={user}
//         onComplete={handleOnboardingComplete}
//         onSkip={handleOnboardingSkip}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Dashboard Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center">
//               <h1 className="text-2xl font-bold text-gray-900">
//                 <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                   Smellify
//                 </span>
//               </h1>
//             </div>

//             <div className="flex items-center space-x-4">
//               <span className="text-sm text-gray-700">
//                 Welcome, {user?.name || 'User'}!
//               </span>

//               <NotificationBell showNotification={showNotification} />
//               <button
//   onClick={() => window.location.href = '/referral'}
//   className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//   title="Invite Friends"
// >
//   <UserPlus className="w-5 h-5" />
// </button>
//               <button
//                 onClick={handleSettingsClick}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Settings"
//               >
//                 <Settings className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => {
//                   localStorage.removeItem('token');
//                   localStorage.removeItem('user');
//                   window.location.href = '/';
//                 }}
//                 className="text-gray-500 hover:text-gray-700 text-sm font-medium"
//               >
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Dashboard Content */}
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-6 sm:px-0">
//           {/* Upload Area */}
//           <div className="mb-8">
//             <div
//               className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
//                 isDragOver
//                   ? 'border-blue-400 bg-blue-50'
//                   : 'border-gray-300 hover:border-gray-400'
//               }`}
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//               onDrop={handleDrop}
//             >
//               <div className="space-y-4">
//                 <div className="flex justify-center">
//                   <FolderOpen className={`w-16 h-16 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">
//                     {isDragOver ? 'Drop your ZIP file here' : 'Upload Your MERN Stack Project'}
//                   </h3>
//                   <p className="text-gray-500 mb-4">
//                     Drag and drop a ZIP file containing your project, or click the button below to choose upload method
//                   </p>
//                   <p className="text-sm text-gray-400">
//                     Maximum file size: 100MB | Supported format: ZIP files only
//                   </p>
//                 </div>

//                 {/* Upload Status */}
//                 {uploadStatus && (
//                   <div className={`p-4 rounded-lg ${
//                     uploadStatus === 'uploading' ? 'bg-blue-50' :
//                     uploadStatus === 'success' ? 'bg-green-50' :
//                     'bg-red-50'
//                   }`}>
//                     {uploadStatus === 'uploading' && (
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-center space-x-2">
//                           <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
//                           <span className="text-blue-700 font-medium">Uploading and validating...</span>
//                         </div>
//                         <div className="w-full bg-blue-200 rounded-full h-2">
//                           <div
//                             className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                             style={{ width: `${uploadProgress}%` }}
//                           ></div>
//                         </div>
//                         <p className="text-blue-600 text-sm">{uploadProgress}% complete</p>
//                       </div>
//                     )}

//                     {uploadStatus === 'success' && (
//                       <div className="flex items-center justify-center space-x-2">
//                         <Check className="w-5 h-5 text-green-600" />
//                         <span className="text-green-700 font-medium">Project uploaded successfully!</span>
//                       </div>
//                     )}

//                     {uploadStatus === 'error' && uploadError && (
//                       <div className="space-y-3">
//                         <div className="flex items-start space-x-2">
//                           <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//                           <div className="flex-1">
//                             <h4 className="text-red-700 font-medium">{uploadError.message}</h4>

//                             {uploadError.details && uploadError.details.length > 0 && (
//                               <div className="mt-2 space-y-1">
//                                 {uploadError.details.map((detail, index) => (
//                                   <p key={index} className="text-red-600 text-sm">• {detail}</p>
//                                 ))}
//                               </div>
//                             )}

//                             {uploadError.requirements && (
//                               <div className="mt-3 p-3 bg-red-100 rounded-md">
//                                 <h5 className="text-red-800 font-medium text-sm mb-2">MERN Stack Requirements:</h5>
//                                 <ul className="text-red-700 text-xs space-y-1">
//                                   {uploadError.requirements.map((req, index) => (
//                                     <li key={index}>• {req}</li>
//                                   ))}
//                                 </ul>
//                               </div>
//                             )}

//                             {uploadError.type === 'server' && uploadError.message.includes('MERN') && (
//                               <div className="mt-3 p-3 bg-red-100 rounded-md">
//                                 <h5 className="text-red-800 font-medium text-sm mb-2">Valid MERN Stack Projects Should Include:</h5>
//                                 <ul className="text-red-700 text-xs space-y-1">
//                                   <li>• React.js frontend with package.json</li>
//                                   <li>• Node.js/Express.js backend</li>
//                                   <li>• MongoDB database integration</li>
//                                   <li>• src directory with source code</li>
//                                   <li>• JavaScript/TypeScript files (not Python, Java, PHP, or C#)</li>
//                                 </ul>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Upload Options Button */}
//                 {!uploadStatus && (
//                   <button
//                     onClick={() => setShowUploadOptions(true)}
//                     className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
//                   >
//                     <Plus className="w-5 h-5 mr-2" />
//                     Upload Project
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Recent Projects Section */}
//           <div className="bg-white shadow rounded-lg p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
//               <button
//                 onClick={fetchRecentProjects}
//                 disabled={loadingProjects}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
//                 title="Refresh"
//               >
//                 <RefreshCw className={`w-4 h-4 ${loadingProjects ? 'animate-spin' : ''}`} />
//               </button>
//             </div>

//             {loadingProjects ? (
//               <div className="text-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
//                 <p className="text-gray-500">Loading projects...</p>
//               </div>
//             ) : recentProjects.length > 0 ? (
//               <div className="space-y-4">
//                 {recentProjects.map((project) => (
//                   <div
//                     key={project._id}
//                     className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-2">
//                           <h3 className="text-sm font-medium text-gray-900">{project.projectName}</h3>
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.analysisStatus)}`}>
//                             {project.analysisStatus}
//                           </span>
//                           {project.source === 'github' && (
//                             <Github className="w-4 h-4 text-gray-500" />
//                           )}
//                         </div>
//                         {project.description && (
//                           <p className="text-sm text-gray-600 mt-1">{project.description}</p>
//                         )}
//                         <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
//                           <span className="flex items-center">
//                             <Clock className="w-3 h-3 mr-1" />
//                             {formatDate(project.createdAt)}
//                           </span>
//                           <span className="flex items-center capitalize">
//                             {project.source === 'github' ? 'GitHub' : 'ZIP Upload'}
//                           </span>
//                           {project.githubInfo?.repositoryFullName && (
//                             <a
//                               href={`https://github.com/${project.githubInfo.repositoryFullName}`}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="flex items-center text-blue-600 hover:text-blue-800"
//                             >
//                               <ExternalLink className="w-3 h-3 mr-1" />
//                               View on GitHub
//                             </a>
//                           )}
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => {
//                           window.location.href = `/project/${project._id}`;
//                         }}
//                         className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
//                       >
//                         View Analysis
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-500">No projects uploaded yet</p>
//                 <p className="text-gray-400 text-sm">Upload your first MERN stack project to get started with code analysis</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>

//       {/* Upload Options Modal */}
//       {showUploadOptions && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-md w-full p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Choose Upload Method</h3>
//               <button
//                 onClick={() => {
//                   setShowUploadOptions(false);
//                   setUploadError(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Upload Requirements Info */}
//             <div className="mb-4 p-3 bg-blue-50 rounded-lg">
//               <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Requirements:</h4>
//               <ul className="text-xs text-blue-800 space-y-1">
//                 <li>• ZIP files only (max 100MB)</li>
//                 <li>• Must contain MERN stack project</li>
//                 <li>• Requires package.json and src directory</li>
//                 <li>• JavaScript/TypeScript files only</li>
//               </ul>
//             </div>

//             <div className="space-y-4">
//               {/* Manual Upload Option */}
//               <div>
//                 <label className="cursor-pointer block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
//                   <input
//                     type="file"
//                     accept=".zip"
//                     onChange={handleFileSelect}
//                     className="hidden"
//                   />
//                   <div className="text-center">
//                     <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                     <p className="text-sm font-medium text-gray-900">Manual Upload</p>
//                     <p className="text-xs text-gray-500">Select a ZIP file from your computer</p>
//                   </div>
//                 </label>
//               </div>

//               {/* GitHub Upload Option */}
//               {githubConnected && (
//                 <button
//                   onClick={handleGithubUpload}
//                   className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
//                 >
//                   <div className="text-center">
//                     <Github className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                     <p className="text-sm font-medium text-gray-900">Import from GitHub</p>
//                     <p className="text-xs text-gray-500">Select a repository from your GitHub account</p>
//                   </div>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* GitHub Repositories Modal */}
//       {showGithubRepos && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
//             <div className="flex justify-between items-center p-6 border-b border-gray-200">
//               <h3 className="text-lg font-medium text-gray-900">Select GitHub Repository</h3>
//               <button
//                 onClick={() => setShowGithubRepos(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-6 overflow-y-auto max-h-[60vh]">
//               {loadingRepos ? (
//                 <div className="text-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
//                   <p className="text-gray-500">Loading repositories...</p>
//                 </div>
//               ) : githubRepos.length > 0 ? (
//                 <div className="space-y-3">
//                   {githubRepos.map((repo) => (
//                     <div
//                       key={repo.id}
//                       className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
//                     >
//                       <div className="flex items-start justify-between">
//                         <div className="flex-1">
//                           <div className="flex items-center space-x-2">
//                             <h4 className="text-sm font-medium text-gray-900">{repo.name}</h4>
//                             {repo.isPrivate && (
//                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
//                                 Private
//                               </span>
//                             )}
//                             {repo.language && (
//                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
//                                 {repo.language}
//                               </span>
//                             )}
//                           </div>
//                           {repo.description && (
//                             <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
//                           )}
//                           <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
//                             <span className="flex items-center">
//                               <Star className="w-3 h-3 mr-1" />
//                               {repo.stargazersCount}
//                             </span>
//                             <span className="flex items-center">
//                               <GitFork className="w-3 h-3 mr-1" />
//                               {repo.forksCount}
//                             </span>
//                             <span className="flex items-center">
//                               <Clock className="w-3 h-3 mr-1" />
//                               Updated {formatDate(repo.updatedAt)}
//                             </span>
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => handleImportRepo(repo)}
//                           disabled={importingRepo === repo.id}
//                           className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           {importingRepo === repo.id ? (
//                             <>
//                               <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
//                               Importing...
//                             </>
//                           ) : (
//                             'Import'
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">No repositories found</p>
//                   <p className="text-gray-400 text-sm">Make sure you have repositories in your GitHub account</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }


//src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  Gem,
  Receipt,
  Eye,
  Settings,
  Plus,
  Upload,
  Github,
  X,
  FileText,
  FolderOpen,
  Star,
  GitFork,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Check,
  AlertTriangle,
  UserPlus,
  Menu,
  BarChart3,
  Package,
  Activity,
  LogOut,
  Award,
  CircleAlert,
  HelpCircle,
} from "lucide-react";
import UserOnboarding from "../components/UserOnboarding";
import api from "../services/api";
import NotificationBell from "../components/NotificationBell";
import { useNotification } from "../components/NotificationPopup";
import { Copy, Layers, Zap, GitMerge } from "lucide-react";
import OnboardingTour from '../pages/OnboardingTour';

export default function Dashboard() {
  const [user, setUser] = useState({ name: "", remainingScans: 0 });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showGithubRepos, setShowGithubRepos] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [importingRepo, setImportingRepo] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [githubValidationError, setGithubValidationError] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { showNotification } = useNotification();
  const [enabledSmells, setEnabledSmells] = useState(null);
const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Inline API methods
  const githubAPI = {
    getStatus: () => api.get("/github/status"),
    getRepositories: () => api.get("/github/repositories"),
    importRepository: (repoData) =>
      api.post("/github/import-repository", repoData),
    getLinkUrl: () => api.get("/github/link"),
    unlinkAccount: () => api.delete("/github/unlink"),
    getSessionMessage: () => api.get("/github/session-message"),
  };

  const projectsAPI = {
    getProjects: () => api.get("/projects"),
    getProject: (projectId) => api.get(`/projects/${projectId}`),
    uploadZip: (formData, onUploadProgress = null) => {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (onUploadProgress) {
        config.onUploadProgress = onUploadProgress;
      }

      return api.post("/projects/upload", formData, config);
    },
    deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
    getAnalysis: (projectId) => api.get(`/projects/${projectId}/analysis`),
  };

  const deductScan = async () => {
    try {
      const response = await api.post("/users/deduct-scan");
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    checkUserStatus();
    checkGithubConnection();
    fetchRecentProjects();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
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

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/signin";
        return;
      }

      const response = await api.get("/users/profile");
      const userData = response.data;

      const isProfileComplete = userData.name && userData.isOnboardingComplete;

      if (!isProfileComplete) {
        window.location.href = "/onboarding";
        return;
      }

      // Set user data immediately
      setUser({
        name: userData.name || "",
        remainingScans: userData.remainingScans || 0,
        ...userData,
      });

      const params = new URLSearchParams(window.location.search);
if (params.get('tour') === 'true') {
  setShowTour(true);
  window.history.replaceState({}, '', '/dashboard');
}

      if (userData.analysisPreferences)
        setEnabledSmells(userData.analysisPreferences);

    } catch (error) {
      console.error("Error checking user status:", error);
      showNotification("error", "Session expired. Please sign in again!");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
  };

  const checkGithubConnection = async () => {
    try {
      const response = await githubAPI.getStatus();
      setGithubConnected(response.data.isLinked);
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      showNotification("warning", "Unable to verify GitHub connection status!");
      setGithubConnected(false);
    }
  };

  const fetchRecentProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectsAPI.getProjects();
      setRecentProjects(response.data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      showNotification("error", "Failed to load recent projects!");
      setRecentProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchGithubRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await githubAPI.getRepositories();
      setGithubRepos(response.data.repositories || []);
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      if (error.response?.status === 401) {
        showNotification(
          "warning",
          "GitHub authentication expired. Please reconnect your account!",
        );
        setGithubConnected(false);
      } else {
        showNotification("error", "Failed to fetch GitHub repositories!");
      }
      setGithubRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleImportRepo = async (repo) => {
    // Check if user has scans remaining
    if (user?.remainingScans <= 0) {
      showNotification("error", "No scans remaining!");
      setShowGithubRepos(false);
      setShowUploadOptions(false);
      return;
    }

    setShowGithubRepos(false); // ← add this
    setShowUploadOptions(false); // ← add this

    setImportingRepo(repo.id);
    try {
      // Deduct scan first
      await deductScan();

      const response = await githubAPI.importRepository({
        repositoryId: repo.id,
        repositoryName: repo.name,
        repositoryFullName: repo.fullName,
        description: repo.description,
        cloneUrl: repo.cloneUrl,
      });

      if (response.data.success) {
        showNotification("success", "Repository imported successfully!");
        setShowGithubRepos(false);
        setShowUploadOptions(false);

        // Update user data from server
        checkUserStatus();
        fetchRecentProjects();
      }
    } catch (error) {
      console.error("Error importing repository:", error);

      const errorResponse = error.response?.data;

      if (error.response?.status === 400 && errorResponse?.message) {
        if (
          errorResponse.message.includes("Invalid project structure") ||
          errorResponse.message.includes("MERN stack") ||
          errorResponse.message.includes("package.json") ||
          errorResponse.message.includes("Python") ||
          errorResponse.message.includes("Java") ||
          errorResponse.message.includes("PHP") ||
          errorResponse.message.includes("C#")
        ) {
          setGithubValidationError({
            repository: repo,
            error: errorResponse.message,
            requirements: errorResponse.requirements || [
              "Repository must contain at least one package.json file",
              "Repository must be a valid Node.js/React/MERN project",
              "Repository must not contain Python, Java, PHP, C#, or other non-JavaScript backend files",
              "Repository structure should follow standard JavaScript project conventions",
            ],
          });

          showNotification("error", `Invalid MERN Stack Project: ${repo.name}`);
          return;
        }
      }

      if (error.response?.status === 409) {
        showNotification(
          "warning",
          "This repository has already been imported!",
        );
      } else if (error.response?.status === 401) {
        showNotification(
          "error",
          "GitHub authentication expired. Please reconnect your account!",
        );
        setGithubConnected(false);
      } else {
        const errorMessage =
          errorResponse?.message ||
          "Failed to import repository. Please try again!";
        showNotification("error", errorMessage);
      }
    } finally {
      setImportingRepo(null);
    }
  };

  const validateFile = (file) => {
    const errors = [];

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit. Please upload a smaller file.`,
      );
    }

    if (
      !file.type.includes("zip") &&
      !file.name.toLowerCase().endsWith(".zip")
    ) {
      errors.push(
        "Only ZIP files are allowed. Please upload a ZIP file containing your MERN stack project.",
      );
    }

    return errors;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validationErrors = validateFile(file);

      if (validationErrors.length > 0) {
        setUploadError({
          type: "validation",
          messages: validationErrors,
        });
        showNotification("error", validationErrors[0]);
        return;
      }

      await uploadZipFile(file);
    }
  };

  const uploadZipFile = async (file) => {
    // Check if user has scans remaining
    if (user?.remainingScans <= 0) {
      showNotification("error", "No scans remaining!");
      setShowUploadOptions(false);
      return;
    }

    setShowUploadOptions(false);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("project", file);
    formData.append("projectName", file.name.replace(".zip", ""));
    formData.append("source", "zip");

    try {
      // Deduct scan first
      await deductScan();

      const response = await projectsAPI.uploadZip(
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      );

      setUploadStatus("success");
      showNotification(
        "success",
        "Project uploaded and validated successfully!",
      );
      setShowUploadOptions(false);

      // Update user data from server
      checkUserStatus();
      fetchRecentProjects();

      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Error uploading project:", error);
      setUploadStatus("error");

      const errorResponse = error.response?.data;
      let errorMessage = "Upload failed. Please try again.";
      let detailedErrors = [];

      if (errorResponse) {
        if (errorResponse.message) {
          errorMessage = errorResponse.message;
        }

        if (errorResponse.errors && errorResponse.errors.length > 0) {
          detailedErrors = errorResponse.errors;

          const hasMernErrors = detailedErrors.some(
            (err) =>
              err.includes("MERN stack") ||
              err.includes("package.json") ||
              err.includes("src directory") ||
              err.includes("Python") ||
              err.includes("Java") ||
              err.includes("PHP") ||
              err.includes("C#"),
          );

          if (hasMernErrors) {
            errorMessage = "Invalid MERN Stack Project";
          }
        }

        if (
          errorMessage.includes("File too large") ||
          errorMessage.includes("100MB")
        ) {
          errorMessage = "File size exceeds 100MB limit";
          detailedErrors = [
            "Please compress your project or remove unnecessary files to reduce the file size below 100MB.",
          ];
        }

        if (errorMessage.includes("Only ZIP files are allowed")) {
          errorMessage = "Invalid file type";
          detailedErrors = [
            "Please upload a ZIP file containing your MERN stack project.",
          ];
        }

        setUploadError({
          type: "server",
          message: errorMessage,
          details: detailedErrors,
          requirements: errorResponse.requirements || null,
        });
      } else {
        setUploadError({
          type: "network",
          message: errorMessage,
          details: ["Please check your internet connection and try again."],
        });
      }

      showNotification("error", errorMessage);

      setTimeout(() => {
        setUploadStatus(null);
        setUploadError(null);
        setUploadProgress(0);
      }, 10000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      setUploadError({
        type: "validation",
        messages: validationErrors,
      });
      showNotification("error", validationErrors[0]);
      return;
    }

    uploadZipFile(file);
  };

  const handleGithubUpload = async () => {
    if (githubConnected) {
      setShowGithubRepos(true);
      fetchGithubRepos();
    } else {
      try {
        const response = await api.get("/github/link");
        if (response.data.authUrl) {
          window.location.href = response.data.authUrl;
        }
      } catch (error) {
        console.error("Error linking GitHub:", error);
        showNotification(
          "error",
          "Failed to connect to GitHub. Please try again!",
        );
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-amber-600 bg-amber-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Check className="w-3.5 h-3.5 stroke-2" />;
      case "processing":
        return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 stroke-2" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const toggleSmell = async (key) => {
    const activeCount = Object.values(enabledSmells).filter(Boolean).length;
    if (activeCount === 1 && enabledSmells[key]) {
      showNotification("warning", "At least one smell must remain active!");
      return;
    }

    const updated = { ...enabledSmells, [key]: !enabledSmells[key] };
    setEnabledSmells(updated); // optimistic update

    try {
      await api.patch("/users/analysis-preferences", updated);
    } catch (error) {
      setEnabledSmells(enabledSmells); // revert on failure
      showNotification("error", "Failed to save preferences!");
    }
  };
  // Calculate stats
  const stats = {
    totalProjects: recentProjects.length,
    analyzing: recentProjects.filter((p) => p.analysisStatus === "processing")
      .length,
    completed: recentProjects.filter((p) => p.analysisStatus === "completed")
      .length,
    issues: recentProjects.filter((p) => p.analysisStatus === "completed")
      .length,
  };

  if (isLoading) {
    return null;
  }

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
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg"
              >
                <BarChart3 className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Dashboard</span>}
              </button>
              <button
              data-tour="nav-projects"
                onClick={() => (window.location.href = "/projects")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Projects</span>}
              </button>
              <button data-tour="nav-analysis" className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Activity className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Analysis</span>}
              </button>
              <button
              data-tour="nav-plans"
                onClick={() => (window.location.href = "/plans")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Gem className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Plans</span>}
              </button>
              <button
              data-tour="nav-billing"
                onClick={() => (window.location.href = "/billing")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Receipt className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Billing</span>}
              </button>
              <button
              data-tour="nav-faq"
                onClick={() => (window.location.href = "/faq")}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">FAQ</span>}
              </button>
            </div>
          </div>

          {/* {sidebarOpen && (
            <div>
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </p>
              <div className="space-y-1">
                <button 
                  onClick={() => setShowUploadOptions(true)}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="ml-3">Upload Project</span>
                </button>
                <button 
                  onClick={handleGithubUpload}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="ml-3">Import from GitHub</span>
                </button>
              </div>
            </div>
          )} */}
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
      <div className="flex-1 flex flex-col w-full lg:w-auto h-screen overflow-hidden">
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
              Welcome back, {user?.name || "User"}!
            </h1>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <NotificationBell />

            {/* Profile Dropdown */}
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

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <div data-tour="stats-scans" className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                    Scans Remaining
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {user?.remainingScans || 0}
                  </h3>
                </div>
                
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <Award className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div data-tour="stats-projects" className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                    Total Projects
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {stats.totalProjects}
                  </h3>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                    Analyzing
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {stats.analyzing}
                  </h3>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                    Completed
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {stats.completed}
                  </h3>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <Check className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">
                    Issues Found
                  </p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {stats.issues}
                  </h3>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <CircleAlert className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Code Smell Toggles */}
          {/* Code Smell Toggles */}
          <div data-tour="analysis-settings" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6 lg:mb-8">
            <div className="mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                Analysis Settings
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Choose which code smells to detect in your project
              </p>
            </div>

            {enabledSmells === null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 animate-pulse h-28"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    key: "codeDuplication",
                    label: "Code Duplication",
                    description: "Detects repeated logic across files",
                    icon: <Copy className="w-4 h-4" />,
                    color: "blue",
                  },
                  {
                    key: "expressMiddleware",
                    label: "Express Middleware",
                    description: "Flags misuse of middleware chains",
                    icon: <Layers className="w-4 h-4" />,
                    color: "amber",
                  },
                  {
                    key: "reactHooks",
                    label: "React Hooks Misuse",
                    description: "Catches improper hook usage",
                    icon: <Zap className="w-4 h-4" />,
                    color: "purple",
                  },
                  {
                    key: "propDrilling",
                    label: "Prop Drilling",
                    description: "Identifies deep prop passing chains",
                    icon: <GitMerge className="w-4 h-4" />,
                    color: "green",
                  },
                ].map(({ key, label, description, icon, color }) => {
                  const enabled = enabledSmells[key];
                  const colorMap = {
                    blue: {
                      bg: "bg-blue-50",
                      icon: "text-blue-500",
                      ring: "ring-blue-200",
                      dot: "bg-blue-500",
                      track: "bg-blue-500",
                    },
                    amber: {
                      bg: "bg-amber-50",
                      icon: "text-amber-500",
                      ring: "ring-amber-200",
                      dot: "bg-amber-500",
                      track: "bg-amber-500",
                    },
                    purple: {
                      bg: "bg-purple-50",
                      icon: "text-purple-500",
                      ring: "ring-purple-200",
                      dot: "bg-purple-500",
                      track: "bg-[#5A33FF]",
                    },
                    green: {
                      bg: "bg-green-50",
                      icon: "text-green-500",
                      ring: "ring-green-200",
                      dot: "bg-green-500",
                      track: "bg-green-500",
                    },
                  };
                  const c = colorMap[color];

                  return (
                    <div
                      key={key}
                      onClick={() => toggleSmell(key)}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 select-none
              ${
                enabled
                  ? `border-transparent ring-2 ${c.ring} ${c.bg}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
                    >
                      {/* Top row: icon + toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? c.bg : "bg-gray-100"}`}
                        >
                          <span className={enabled ? c.icon : "text-gray-400"}>
                            {icon}
                          </span>
                        </div>

                        {/* Toggle pill */}
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${enabled ? c.track : "bg-gray-200"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
                    ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
                          />
                        </div>
                      </div>

                      {/* Label + description */}
                      <p
                        className={`text-sm font-semibold mb-0.5 ${enabled ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {label}
                      </p>
                      <p
                        className={`text-xs leading-relaxed ${enabled ? "text-gray-500" : "text-gray-300"}`}
                      >
                        {description}
                      </p>

                      {/* Active dot */}
                      {enabled && (
                        <span
                          className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${c.dot}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div data-tour="upload-area" className="mb-6 lg:mb-8">
            {user?.remainingScans <= 0 ? (
              <div className="border-2 border-red-300 rounded-xl p-6 lg:p-12 text-center bg-red-50">
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                      No Scans Remaining
                    </h3>
                    <p className="text-sm lg:text-base text-gray-600 mb-4">
                      You've used all your available scans. Purchase more to
                      continue analyzing projects.
                    </p>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/plans")}
                    className="inline-flex items-center px-4 lg:px-6 py-2.5 lg:py-3 border border-transparent text-sm lg:text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-md"
                  >
                    <Award className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    Purchase Scans
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 lg:p-12 text-center transition-all ${
                  isDragOver
                    ? "border-[#5A33FF] bg-purple-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-center">
                    <div
                      className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full ${isDragOver ? "bg-purple-100" : "bg-gray-100"} flex items-center justify-center`}
                    >
                      <FolderOpen
                        className={`w-6 h-6 lg:w-8 lg:h-8 ${isDragOver ? "text-[#5A33FF]" : "text-gray-400"}`}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                      {isDragOver
                        ? "Drop your ZIP file here"
                        : "Upload Your MERN Stack Project"}
                    </h3>
                    <p className="text-sm lg:text-base text-gray-500 mb-4">
                      Drag and drop a ZIP file containing your project, or click
                      the button below
                    </p>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Maximum file size: 100MB | Supported format: ZIP files
                      only
                    </p>
                  </div>

                  {/* Upload Status */}
                  {uploadStatus && (
                    <div
                      className={`max-w-md mx-auto p-4 rounded-lg ${
                        uploadStatus === "uploading"
                          ? "bg-blue-50"
                          : uploadStatus === "success"
                            ? "bg-green-50"
                            : "bg-red-50"
                      }`}
                    >
                      {uploadStatus === "uploading" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#5A33FF] border-t-transparent"></div>
                            <span className="text-[#5A33FF] font-medium">
                              Uploading and validating...
                            </span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2">
                            <div
                              className="bg-[#5A33FF] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-[#5A33FF] text-sm">
                            {uploadProgress}% complete
                          </p>
                        </div>
                      )}

                      {uploadStatus === "success" && (
                        <div className="flex items-center justify-center space-x-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">
                            Project uploaded successfully!
                          </span>
                        </div>
                      )}

                      {uploadStatus === "error" && uploadError && (
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-left">
                              <h4 className="text-red-700 font-medium">
                                {uploadError.message}
                              </h4>

                              {uploadError.details &&
                                uploadError.details.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {uploadError.details.map(
                                      (detail, index) => (
                                        <p
                                          key={index}
                                          className="text-red-600 text-sm"
                                        >
                                          • {detail}
                                        </p>
                                      ),
                                    )}
                                  </div>
                                )}

                              {uploadError.requirements && (
                                <div className="mt-3 p-3 bg-red-100 rounded-md">
                                  <h5 className="text-red-800 font-medium text-sm mb-2">
                                    MERN Stack Requirements:
                                  </h5>
                                  <ul className="text-red-700 text-xs space-y-1">
                                    {uploadError.requirements.map(
                                      (req, index) => (
                                        <li key={index}>• {req}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                              {uploadError.type === "server" &&
                                uploadError.message.includes("MERN") && (
                                  <div className="mt-3 p-3 bg-red-100 rounded-md">
                                    <h5 className="text-red-800 font-medium text-sm mb-2">
                                      Valid MERN Stack Projects Should Include:
                                    </h5>
                                    <ul className="text-red-700 text-xs space-y-1">
                                      <li>
                                        • React.js frontend with package.json
                                      </li>
                                      <li>• Node.js/Express.js backend</li>
                                      <li>• MongoDB database integration</li>
                                      <li>• src directory with source code</li>
                                      <li>
                                        • JavaScript/TypeScript files (not
                                        Python, Java, PHP, or C#)
                                      </li>
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Button */}
                  {!uploadStatus && (
                    <button
                      onClick={() => setShowUploadOptions(true)}
                      className="inline-flex items-center px-4 lg:px-6 py-2.5 lg:py-3 border border-transparent text-sm lg:text-base font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A33FF] transition-colors shadow-md"
                    >
                      <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                      Upload Project
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                Recent Projects
              </h2>
              <button
                onClick={fetchRecentProjects}
                disabled={loadingProjects}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingProjects ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="p-4 lg:p-6">
              {loadingProjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.slice(0, 2).map((project) => (
                    <div
                      key={project._id}
                      className="flex flex-col lg:flex-row lg:items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mb-3 lg:mb-0">
                        {project.source === "github" ? (
                          <Github className="w-5 h-5 text-[#5A33FF]" />
                        ) : (
                          <FileText className="w-5 h-5 text-[#5A33FF]" />
                        )}
                      </div>
                      <div className="flex-1 lg:ml-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2 lg:mb-0">
                            {project.projectName}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm w-fit ${getStatusColor(project.analysisStatus)}`}
                          >
                            {getStatusIcon(project.analysisStatus)}
                            <span className="ml-1.5 capitalize">
                              {project.analysisStatus}
                            </span>
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex flex-col lg:flex-row lg:items-center text-xs text-gray-500 space-y-2 lg:space-y-0 lg:space-x-4 mb-3">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(project.createdAt)}
                          </span>
                          <span className="flex items-center capitalize">
                            {project.source === "github"
                              ? "GitHub"
                              : "ZIP Upload"}
                          </span>
                          {project.githubInfo?.repositoryFullName && (
                            <a
                              href={`https://github.com/${project.githubInfo.repositoryFullName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-[#5A33FF] hover:text-[#4A23EF]"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View on GitHub
                            </a>
                          )}
                        </div>

                        {/* Action Button based on status */}
                        <div className="mt-2">
                          {project.analysisStatus === "completed" ? (
                            <button
                              onClick={() =>
                                (window.location.href = `/analysis/${project._id}`)
                              }
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[#5A33FF] hover:bg-[#4A23EF] rounded-lg transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              View Analysis
                            </button>
                          ) : project.analysisStatus === "processing" ? (
                            <div className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                              Analysis in Progress...
                            </div>
                          ) : project.analysisStatus === "failed" ? (
                            <div className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle className="w-4 h-4 mr-1.5" />
                              Analysis Failed
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                              <Clock className="w-4 h-4 mr-1.5" />
                              Pending Analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentProjects.length > 2 && (
                    <div className="text-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => (window.location.href = "/projects")}
                        className="text-[#5A33FF] hover:text-[#4A23EF] text-sm font-medium"
                      >
                        View All Projects ({recentProjects.length})
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No projects uploaded yet
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Upload your first MERN stack project to get started with
                    code analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Upload Options Modal */}
      {showUploadOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Choose Upload Method
              </h3>
              <button
                onClick={() => {
                  setShowUploadOptions(false);
                  setUploadError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Requirements Info */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h4 className="text-sm font-semibold text-[#5A33FF] mb-2">
                Upload Requirements:
              </h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• ZIP files only (max 100MB)</li>
                <li>• Must contain MERN stack project</li>
                <li>• Requires package.json and src directory</li>
                <li>• JavaScript/TypeScript files only</li>
              </ul>
            </div>

            <div className="space-y-3">
              {/* Manual Upload Option */}
              <label className="cursor-pointer block p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#5A33FF] hover:bg-purple-50 transition-all">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900">
                    Manual Upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a ZIP file from your computer
                  </p>
                </div>
              </label>

              {/* GitHub Upload Option */}
              {githubConnected && (
                <button
                  onClick={handleGithubUpload}
                  className="w-full p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#5A33FF] hover:bg-purple-50 transition-all"
                >
                  <div className="text-center">
                    <Github className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">
                      Import from GitHub
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a repository from your GitHub account
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repositories Modal */}
      {showGithubRepos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Select GitHub Repository
              </h3>
              <button
                onClick={() => setShowGithubRepos(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {loadingRepos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading repositories...</p>
                </div>
              ) : githubRepos.length > 0 ? (
                <div className="space-y-3">
                  {githubRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 mb-4 lg:mb-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">
                              {repo.name}
                            </h4>
                            {repo.isPrivate && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Private
                              </span>
                            )}
                            {repo.language && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-4">
                            <span className="flex items-center">
                              <Star className="w-3.5 h-3.5 mr-1" />
                              {repo.stargazersCount}
                            </span>
                            <span className="flex items-center">
                              <GitFork className="w-3.5 h-3.5 mr-1" />
                              {repo.forksCount}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              Updated {formatDate(repo.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportRepo(repo)}
                          disabled={importingRepo === repo.id}
                          className="w-full lg:w-auto lg:ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {importingRepo === repo.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                              Importing...
                            </>
                          ) : (
                            "Import"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No repositories found</p>
                  <p className="text-gray-400 text-sm">
                    Make sure you have repositories in your GitHub account
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Validation Error Modal */}
      {githubValidationError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Invalid MERN Stack Project
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Repository:{" "}
                  <span className="font-medium">
                    {githubValidationError.repository.name}
                  </span>
                </p>
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    {githubValidationError.error}
                  </p>
                </div>
                {githubValidationError.requirements && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-[#5A33FF] mb-2">
                      Requirements:
                    </h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {githubValidationError.requirements.map((req, index) => (
                        <li key={index}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setGithubValidationError(null)}
                className="px-4 py-2 bg-[#5A33FF] text-white rounded-lg hover:bg-[#4A23EF] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/*{showTour && <OnboardingTour onFinish={() => setShowTour(false)} />}*/}
        {showTour && (
  <OnboardingTour
    onFinish={() => setShowTour(false)}
    setSidebarOpen={setSidebarOpen}  // ← add this
  />
)}
    </div>
  );
}
