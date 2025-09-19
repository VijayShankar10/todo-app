import { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com' 
  : 'http://localhost:5000';

function App() {
  // Auth states
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  // Form states
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(null);
  const [category, setCategory] = useState("personal");
  const [description, setDescription] = useState("");
  
  // Data states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  
  // UI states
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Enhanced categories
  const categories = [
    { 
      value: "work", 
      label: "Work", 
      icon: "💼", 
      color: "#FF6B35", 
      lightColor: "#FFF4F1",
      gradient: "from-orange-500 to-red-500"
    },
    { 
      value: "personal", 
      label: "Personal", 
      icon: "🏠", 
      color: "#FFB400", 
      lightColor: "#FFFBF0",
      gradient: "from-yellow-500 to-orange-500"
    },
    { 
      value: "shopping", 
      label: "Shopping", 
      icon: "🛒", 
      color: "#9C27B0", 
      lightColor: "#F8F5FF",
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      value: "health", 
      label: "Health", 
      icon: "🏥", 
      color: "#F44336", 
      lightColor: "#FFF5F5",
      gradient: "from-red-500 to-pink-500"
    },
    { 
      value: "education", 
      label: "Education", 
      icon: "📚", 
      color: "#2196F3", 
      lightColor: "#F5F9FF",
      gradient: "from-blue-500 to-indigo-500"
    },
    { 
      value: "finance", 
      label: "Finance", 
      icon: "💰", 
      color: "#4CAF50", 
      lightColor: "#F5FFF5",
      gradient: "from-green-500 to-teal-500"
    }
  ];

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token with backend
          const response = await axios.get(`${API_BASE}/api/auth/me`);
          
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch tasks when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  // Login handler
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setTasks([]);
    setActiveView("dashboard");
  };

  // API Functions
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/todos`);
      setTasks(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (task.trim() === "") return;
    
    try {
      const taskToSend = {
        text: task,
        priority: priority,
        dueDate: dueDate,
        category: category,
        description: description.trim() || null
      };

      const response = await axios.post(`${API_BASE}/api/todos`, taskToSend);
      setTasks([response.data, ...tasks]);
      
      // Reset form
      setTask("");
      setPriority("medium");
      setDueDate(null);
      setCategory("personal");
      setDescription("");
      setShowTaskModal(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const response = await axios.put(`${API_BASE}/api/todos/${id}`, updates);
      const updatedTasks = tasks.map((t) =>
        t._id === response.data._id ? response.data : t
      );
      setTasks(updatedTasks);
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const toggleTask = async (id, currentlyCompleted) => {
    await updateTask(id, { completed: !currentlyCompleted });
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/todos/${id}`);
      const updatedTasks = tasks.filter((t) => t._id !== id);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Utility functions
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.setHours(23,59,59,999) - today.setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isToday = (date) => {
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate.toDateString() === today.toDateString();
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (activeView === "my-day") {
      filtered = filtered.filter(task => task.dueDate && isToday(task.dueDate) && !task.completed);
    } else if (activeView === "important") {
      filtered = filtered.filter(task => task.priority === "high" && !task.completed);
    } else if (activeView === "planned") {
      filtered = filtered.filter(task => task.dueDate && !task.completed);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.text.toLowerCase().includes(search) ||
        (task.description && task.description.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getStats = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const todayTasks = tasks.filter(t => t.dueDate && isToday(t.dueDate) && !t.completed);
    const importantTasks = activeTasks.filter(t => t.priority === "high");
    const plannedTasks = activeTasks.filter(t => t.dueDate);
    const overdueTasks = activeTasks.filter(t => t.dueDate && getDaysUntilDue(t.dueDate) < 0);
    
    return {
      myDay: todayTasks.length,
      important: importantTasks.length,
      planned: plannedTasks.length,
      allTasks: activeTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    };
  };

  const stats = getStats();
  const displayTasks = getFilteredTasks();

  const getCurrentTitle = () => {
    switch(activeView) {
      case "dashboard": return "Dashboard";
      case "my-day": return "My Day";
      case "important": return "Important";
      case "planned": return "Planned";
      case "all-tasks": return "All Tasks";
      default: return "Tasks";
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Loading Sunlight Tasks...</p>
        </div>
      </div>
    );
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return showSignup ? (
      <Signup 
        onLogin={handleLogin}
        switchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <Login 
        onLogin={handleLogin}
        switchToSignup={() => setShowSignup(true)}
      />
    );
  }

  // Main App JSX (when authenticated)
  return (
    <div className="app-container">
      {/* MODERN SIDEBAR */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* User Profile Header */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar">
              <div className="avatar-image">{user?.avatar || user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className="status-indicator"></div>
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-email">{user?.email || 'user@example.com'}</div>
              </div>
            )}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="collapse-icon">{sidebarCollapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <div
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <div className="nav-icon">📊</div>
            {!sidebarCollapsed && (
              <>
                <span className="nav-text">Dashboard</span>
                <span className="nav-count">{stats.allTasks}</span>
              </>
            )}
          </div>

          <div
            className={`nav-item ${activeView === 'my-day' ? 'active' : ''}`}
            onClick={() => setActiveView('my-day')}
          >
            <div className="nav-icon">☀️</div>
            {!sidebarCollapsed && (
              <>
                <span className="nav-text">My Day</span>
                <span className="nav-count">{stats.myDay}</span>
              </>
            )}
          </div>

          <div
            className={`nav-item ${activeView === 'important' ? 'active' : ''}`}
            onClick={() => setActiveView('important')}
          >
            <div className="nav-icon">⭐</div>
            {!sidebarCollapsed && (
              <>
                <span className="nav-text">Important</span>
                <span className="nav-count">{stats.important}</span>
              </>
            )}
          </div>

          <div
            className={`nav-item ${activeView === 'planned' ? 'active' : ''}`}
            onClick={() => setActiveView('planned')}
          >
            <div className="nav-icon">📅</div>
            {!sidebarCollapsed && (
              <>
                <span className="nav-text">Planned</span>
                <span className="nav-count">{stats.planned}</span>
              </>
            )}
          </div>

          <div
            className={`nav-item ${activeView === 'all-tasks' ? 'active' : ''}`}
            onClick={() => setActiveView('all-tasks')}
          >
            <div className="nav-icon">📝</div>
            {!sidebarCollapsed && (
              <>
                <span className="nav-text">All Tasks</span>
                <span className="nav-count">{stats.allTasks}</span>
              </>
            )}
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="nav-divider"></div>
              <div className="nav-section-title">Categories</div>
              {categories.map((cat) => {
                const count = tasks.filter(t => t.category === cat.value && !t.completed).length;
                return (
                  <div key={cat.value} className="category-item">
                    <div 
                      className="category-dot" 
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.label}</span>
                    <span className="category-count">{count}</span>
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        {/* TOP HEADER */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <span className="page-icon">
                  {activeView === 'dashboard' && '📊'}
                  {activeView === 'my-day' && '☀️'}
                  {activeView === 'important' && '⭐'}
                  {activeView === 'planned' && '📅'}
                  {activeView === 'all-tasks' && '📝'}
                </span>
                {getCurrentTitle()}
              </h1>
              <p className="page-subtitle">
                {activeView === 'my-day' && `Today • ${new Date().toLocaleDateString()}`}
                {activeView === 'important' && 'High priority tasks that need your attention'}
                {activeView === 'planned' && 'Tasks with scheduled due dates'}
                {activeView === 'dashboard' && `Welcome back, ${user?.name || 'User'} • ${new Date().toLocaleDateString()}`}
                {activeView === 'all-tasks' && 'Your complete task collection'}
              </p>
            </div>

            <div className="header-right">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="search-icon">🔍</div>
              </div>

              <button 
                className="add-task-btn"
                onClick={() => setShowTaskModal(true)}
              >
                <span className="btn-icon">+</span>
                <span className="btn-text">Add Task</span>
              </button>

              <div className="user-menu">
                <div className="user-avatar" onClick={handleLogout} title="Click to logout">
                  {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="content">
          {activeView === 'dashboard' ? (
            <div className="dashboard">
              {/* BEAUTIFUL STATS GRID */}
              <div className="stats-grid">
                <div 
                  className="stat-card my-day-card"
                  onClick={() => setActiveView('my-day')}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon">☀️</div>
                    <div className="stat-trend">+2</div>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-title">My Day</h3>
                    <p className="stat-number">{stats.myDay}</p>
                    <p className="stat-subtitle">Due today</p>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>

                <div 
                  className="stat-card important-card"
                  onClick={() => setActiveView('important')}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-trend urgent">!</div>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-title">Important</h3>
                    <p className="stat-number">{stats.important}</p>
                    <p className="stat-subtitle">High priority</p>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>

                <div 
                  className="stat-card planned-card"
                  onClick={() => setActiveView('planned')}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon">📅</div>
                    <div className="stat-trend">+5</div>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-title">Planned</h3>
                    <p className="stat-number">{stats.planned}</p>
                    <p className="stat-subtitle">With due dates</p>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>

                <div 
                  className="stat-card all-tasks-card"
                  onClick={() => setActiveView('all-tasks')}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon">📝</div>
                    <div className="stat-trend">+8</div>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-title">All Tasks</h3>
                    <p className="stat-number">{stats.allTasks}</p>
                    <p className="stat-subtitle">Active tasks</p>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              </div>

              {/* PROGRESS SECTION */}
              <div className="progress-section">
                <h2 className="section-title">📈 Your Progress</h2>
                <div className="progress-cards">
                  <div className="progress-card completion-card">
                    <div className="progress-circle">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                          className="circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="circle"
                          strokeDasharray={`${stats.completionRate}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="22" className="percentage">
                          {stats.completionRate}%
                        </text>
                      </svg>
                    </div>
                    <div className="progress-info">
                      <h4>Completion Rate</h4>
                      <p>Great progress this week!</p>
                    </div>
                  </div>

                  <div className="progress-card tasks-card">
                    <div className="progress-number completed">{stats.completed}</div>
                    <div className="progress-info">
                      <h4>Completed Today</h4>
                      <p>Keep up the momentum</p>
                    </div>
                  </div>

                  <div className="progress-card overdue-card">
                    <div className="progress-number overdue">{stats.overdue}</div>
                    <div className="progress-info">
                      <h4>Overdue Tasks</h4>
                      <p>{stats.overdue > 0 ? 'Needs attention' : 'All caught up!'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT TASKS */}
              <div className="recent-tasks-section">
                <div className="section-header">
                  <h2 className="section-title">🎯 Recent Activity</h2>
                  <button 
                    className="view-all-btn"
                    onClick={() => setActiveView('all-tasks')}
                  >
                    View All →
                  </button>
                </div>
                <div className="tasks-container">
                  {tasks.slice(0, 4).map((task, index) => (
                    <TaskCard key={task._id} task={task} index={index} compact />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // TASK LIST VIEW
            <div className="task-list-view">
              <div className="task-list-header">
                <div className="task-list-info">
                  <h2>{displayTasks.length} Tasks</h2>
                  <p>{displayTasks.filter(t => !t.completed).length} remaining</p>
                </div>
                <button 
                  className="add-task-btn"
                  onClick={() => setShowTaskModal(true)}
                >
                  <span className="btn-icon">+</span>
                  <span className="btn-text">Add Task</span>
                </button>
              </div>

              <div className="tasks-container">
                {displayTasks.map((task, index) => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    index={index}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onEdit={setEditingTask}
                  />
                ))}

                {displayTasks.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <h3 className="empty-title">No tasks found</h3>
                    <p className="empty-subtitle">Create your first task to get started</p>
                    <button 
                      className="empty-action-btn"
                      onClick={() => setShowTaskModal(true)}
                    >
                      Create Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✨ Create New Task</h2>
              <button 
                className="modal-close"
                onClick={() => setShowTaskModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="What needs to be accomplished?"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">🌱 Low Priority</option>
                    <option value="medium">⭐ Medium Priority</option>
                    <option value="high">🔥 High Priority</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  placeholderText="Select a date..."
                  className="form-input"
                  dateFormat="MMM d, yyyy"
                  minDate={new Date()}
                  isClearable
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={addTask}
                disabled={!task.trim()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // TASK CARD COMPONENT
  function TaskCard({ task, index, compact = false, onToggle, onDelete, onEdit }) {
    const categoryInfo = categories.find(cat => cat.value === task.category) || categories[0];
    const daysUntil = getDaysUntilDue(task.dueDate);
    const isOverdue = daysUntil !== null && daysUntil < 0;
    const isDueToday = daysUntil === 0;

    return (
      <div 
        className={`task-card ${task.completed ? 'completed' : ''} ${compact ? 'compact' : ''}`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="task-card-content">
          <div className="task-checkbox-container">
            <input
              type="checkbox"
              className="task-checkbox"
              checked={task.completed}
              onChange={() => onToggle ? onToggle(task._id, task.completed) : toggleTask(task._id, task.completed)}
            />
            <div className="checkbox-custom"></div>
          </div>

          <div className="task-info">
            <h3 className="task-title">{task.text}</h3>
            {task.description && !compact && (
              <p className="task-description">{task.description}</p>
            )}
            
            <div className="task-meta">
              <div className="task-badges">
                <span 
                  className={`priority-badge priority-${task.priority}`}
                >
                  {task.priority === 'high' && '🔥'}
                  {task.priority === 'medium' && '⭐'}
                  {task.priority === 'low' && '🌱'}
                  {task.priority.toUpperCase()}
                </span>
                
                <span 
                  className="category-badge"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              </div>

              {task.dueDate && (
                <div className={`due-date ${isOverdue ? 'overdue' : isDueToday ? 'due-today' : ''}`}>
                  📅 {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                       isDueToday ? 'Due today' :
                       daysUntil === 1 ? 'Due tomorrow' :
                       `Due in ${daysUntil} days`}
                </div>
              )}
            </div>
          </div>

          {!compact && (
            <div className="task-actions">
              <button 
                className="task-action-btn edit-btn"
                onClick={() => onEdit ? onEdit(task._id) : setEditingTask(task._id)}
                title="Edit task"
              >
                ✏️
              </button>
              <button 
                className="task-action-btn delete-btn"
                onClick={() => onDelete ? onDelete(task._id) : deleteTask(task._id)}
                title="Delete task"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        <div className="task-card-border" style={{ background: categoryInfo.color }}></div>
      </div>
    );
  }
}

export default App;
