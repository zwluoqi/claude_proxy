document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否已登录
  function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    // 如果没有token或用户信息，则重定向到登录页
    if (!token || !user) {
      window.location.href = '/index.html';
      return false;
    }
    
    // 检查当前页面路径，确保用户访问的是对应其角色的页面
    const currentPath = window.location.pathname;
    if (user.role === 'admin' && !currentPath.includes('/admin/')) {
      window.location.href = '/admin/dashboard.html';
      return false;
    } else if (user.role === 'user' && currentPath.includes('/admin/')) {
      window.location.href = '/user/dashboard.html';
      return false;
    }
    
    return true;
  }
  
  // 设置用户信息
  function setUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = user.username;
    }
  }
  
  // 注销功能
  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 重定向到登录页
      window.location.href = '/index.html';
    });
  }
  
  // 切换侧边栏显示/隐藏
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  if (toggleSidebarButton) {
    toggleSidebarButton.addEventListener('click', function() {
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.getElementById('main-content');
      
      sidebar.classList.toggle('active');
      mainContent.classList.toggle('active');
    });
  }
  
  // 检查认证状态
  if (checkAuthStatus()) {
    setUserInfo();
  }
}); 