import { useState, useEffect } from 'react';
import { HelpCircle, Gem, Receipt, Settings, Plus, Upload, Github, X, FileText, FolderOpen, Star, GitFork, Clock, ExternalLink, RefreshCw, AlertCircle, Check, AlertTriangle, UserPlus, Menu, BarChart3, Package, Activity, LogOut, Search, Filter, Trash2, Download, Eye } from 'lucide-react';
import { useNotification } from '../components/NotificationPopup';
import NotificationBell from '../components/NotificationBell';
import api from '../services/api';

export default function Projects() {
  const [user, setUser] = useState({ name: '', remainingScans: 0 });
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { showNotification } = useNotification();

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

  const projectsAPI = {
    getProjects: () => api.get('/projects'),
    deleteProject: (projectId) => api.delete(`/projects/${projectId}`)
  };

  useEffect(() => {
    checkUserStatus();
    fetchProjects();
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

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, filterStatus, filterSource]);

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
      showNotification('error', 'Session expired. Please sign in again!');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification('error', 'Failed to load projects!');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.analysisStatus === filterStatus);
    }

    // Source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(project => project.source === filterSource);
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    setDeletingProject(projectToDelete._id);
    try {
      await projectsAPI.deleteProject(projectToDelete._id);
      showNotification('success', 'Project deleted successfully!');
      fetchProjects();
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      showNotification('error', 'Failed to delete project!');
    } finally {
      setDeletingProject(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100 border border-green-200';
      case 'processing':
        return 'text-amber-700 bg-amber-100 border border-amber-200';
      case 'failed':
        return 'text-red-700 bg-red-100 border border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 stroke-2" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 stroke-2" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
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
                        className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg "
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
              My Projects
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

        {/* Projects Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A33FF] focus:border-transparent"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchProjects}
                disabled={loadingProjects}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingProjects ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A33FF] focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                    <select
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A33FF] focus:border-transparent"
                    >
                      <option value="all">All Sources</option>
                      <option value="github">GitHub</option>
                      <option value="zip">ZIP Upload</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Projects</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Completed</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600">
                    {projects.filter(p => p.analysisStatus === 'completed').length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <Check className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 stroke-2" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Processing</p>
                  <p className="text-2xl lg:text-3xl font-bold text-amber-600">
                    {projects.filter(p => p.analysisStatus === 'processing').length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600 " />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Failed</p>
                  <p className="text-2xl lg:text-3xl font-bold text-red-600">
                    {projects.filter(p => p.analysisStatus === 'failed').length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 ml-2">
                  <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 stroke-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {loadingProjects ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5A33FF] border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Loading projects...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className="p-4 lg:p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Project Icon */}
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        {project.source === 'github' ? (
                          <Github className="w-6 h-6 text-[#5A33FF]" />
                        ) : (
                          <FileText className="w-6 h-6 text-[#5A33FF]" />
                        )}
                      </div>

                      {/* Project Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-2">
                          <div className="flex-1 mb-2 lg:mb-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {project.projectName}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(project.analysisStatus)}`}>
                              {getStatusIcon(project.analysisStatus)}
                              <span className="ml-2 capitalize">{project.analysisStatus}</span>
                            </span>
                          </div>
                        </div>

                        {/* Project Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {formatDate(project.createdAt)}
                          </span>
                          <span className="flex items-center capitalize">
                            {project.source === 'github' ? (
                              <>
                                <Github className="w-4 h-4 mr-1.5" />
                                GitHub
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-1.5" />
                                ZIP Upload
                              </>
                            )}
                          </span>
                          {project.githubInfo?.repositoryFullName && (
                            <a
                              href={`https://github.com/${project.githubInfo.repositoryFullName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-[#5A33FF] hover:text-[#4A23EF]"
                            >
                              <ExternalLink className="w-4 h-4 mr-1.5" />
                              View on GitHub
                            </a>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {project.analysisStatus === 'completed' ? (
                            <button
                              onClick={() => window.location.href = `/analysis/${project._id}`}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#5A33FF] hover:bg-[#4A23EF] rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Analysis
                            </button>
                          ) : project.analysisStatus === 'processing' ? (
                            <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Analysis in Progress...
                            </div>
                          ) : project.analysisStatus === 'failed' ? (
                            <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Analysis Failed
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                              <Clock className="w-4 h-4 mr-2" />
                              Pending Analysis
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteProject(project)}
                            disabled={deletingProject === project._id}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">
                  {searchQuery || filterStatus !== 'all' || filterSource !== 'all'
                    ? 'No projects match your filters'
                    : 'No projects yet'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {searchQuery || filterStatus !== 'all' || filterSource !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first MERN stack project to get started'}
                </p>
                {!searchQuery && filterStatus === 'all' && filterSource === 'all' && (
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#5A33FF] hover:bg-[#4A23EF] transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Project
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{projectToDelete.projectName}"? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                disabled={deletingProject}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingProject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingProject ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}