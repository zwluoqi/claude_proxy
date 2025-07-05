document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 获取用户信息
  async function fetchUserData() {
    try {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // 更新配额显示
        document.getElementById('user-quota').textContent = userData.quota;
        
        // 更新本地存储中的用户信息
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('获取用户数据失败:', err);
    }
  }
  
  // 获取用户的令牌数量
  async function fetchTokenCount() {
    try {
      const response = await fetch(`/api/token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const tokensData = await response.json();
        document.getElementById('token-count').textContent = tokensData.length;
      }
    } catch (err) {
      console.error('获取令牌数据失败:', err);
    }
  }
  
  // 获取用户的请求次数
  async function fetchRequestCount() {
    try {
      const response = await fetch(`/api/auth/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const usageData = await response.json();
        document.getElementById('request-count').textContent = usageData.totalRequests || 0;
      }
    } catch (err) {
      console.error('获取使用数据失败:', err);
    }
  }
  
  // 获取最近的使用记录
  async function fetchRecentUsage() {
    try {
      const response = await fetch(`/api/auth/usage/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const usageLogs = await response.json();
        const tbody = document.getElementById('recent-usage');
        
        // 清空加载占位符
        tbody.innerHTML = '';
        
        if (usageLogs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无使用记录</td></tr>';
          return;
        }
        
        // 添加最近的使用记录
        usageLogs.forEach(log => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(log.requestTime);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${log.tokenUsed.substring(0, 8)}...</td>
            <td>${log.tokenCount || 0}</td>
            <td>${log.usageCount || 1}</td>
            <td>¥${log.cost ? log.cost.toFixed(4) : '0.0000'}</td>
          `;
          
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.error('获取最近使用记录失败:', err);
      document.getElementById('recent-usage').innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 加载所有数据
  async function loadDashboardData() {
    await fetchUserData();
    await fetchTokenCount();
    await fetchRequestCount();
    await fetchRecentUsage();
  }
  
  // 初始加载
  loadDashboardData();
}); 