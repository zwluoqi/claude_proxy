document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const timePeriodSelect = document.getElementById('time-period');
  let usageChart = null;
  
  // 获取总体统计数据
  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        
        // 更新统计数据
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('total-tokens').textContent = stats.totalTokens || 0;
        document.getElementById('total-requests').textContent = stats.totalRequests || 0;
        document.getElementById('total-cost').textContent = '¥' + (stats.totalCost || 0).toFixed(2);
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  }
  
  // 获取最近用户
  async function fetchRecentUsers() {
    try {
      const response = await fetch('/api/admin/users/recent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        const tbody = document.getElementById('recent-users');
        
        // 清空加载占位符
        tbody.innerHTML = '';
        
        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center">暂无用户</td></tr>';
          return;
        }
        
        // 显示最近用户
        users.forEach(user => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(user.createdAt);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${user.username}</td>
            <td>${formattedDate}</td>
            <td>
              <span class="status ${user.status === 'active' ? 'status-active' : 'status-banned'}">
                ${user.status}
              </span>
            </td>
            <td>${user.quota}</td>
          `;
          
          tbody.appendChild(row);
        });
      } else {
        document.getElementById('recent-users').innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取最近用户失败:', err);
      document.getElementById('recent-users').innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 获取最近请求
  async function fetchRecentRequests() {
    try {
      const response = await fetch('/api/admin/usage/recent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const requests = await response.json();
        const tbody = document.getElementById('recent-requests');
        
        // 清空加载占位符
        tbody.innerHTML = '';
        
        if (requests.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无请求记录</td></tr>';
          return;
        }
        
        // 显示最近请求
        requests.forEach(req => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(req.requestTime);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${req.username}</td>
            <td>${req.tokenUsed.substring(0, 8)}...</td>
            <td>${req.tokenCount || 0}</td>
            <td>¥${req.cost ? req.cost.toFixed(4) : '0.0000'}</td>
          `;
          
          tbody.appendChild(row);
        });
      } else {
        document.getElementById('recent-requests').innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取最近请求失败:', err);
      document.getElementById('recent-requests').innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 获取使用趋势数据
  async function fetchUsageTrends(period = 'month') {
    try {
      const response = await fetch(`/api/admin/usage/trends?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateUsageChart(data, period);
      }
    } catch (err) {
      console.error('获取使用趋势失败:', err);
    }
  }
  
  // 更新使用趋势图表
  function updateUsageChart(data, period) {
    const ctx = document.getElementById('usage-chart').getContext('2d');
    
    // 如果图表已经存在，则销毁它
    if (usageChart) {
      usageChart.destroy();
    }
    
    // 获取标签和相应的数据
    const labels = data.map(item => item.label);
    const tokenCounts = data.map(item => item.tokenCount);
    const costs = data.map(item => item.cost);
    const requestCounts = data.map(item => item.requestCount);
    
    // 创建新图表
    usageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '请求数',
            data: requestCounts,
            backgroundColor: 'rgba(74, 108, 247, 0.6)',
            borderColor: 'rgba(74, 108, 247, 1)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Token 数量',
            data: tokenCounts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            order: 1
          },
          {
            label: '费用 (¥)',
            data: costs,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1',
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '数量'
            },
            position: 'left'
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: '费用 (¥)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }
  
  // 时间段选择变化事件
  timePeriodSelect.addEventListener('change', function() {
    fetchUsageTrends(this.value);
  });
  
  // 初始加载数据
  fetchStats();
  fetchRecentUsers();
  fetchRecentRequests();
  fetchUsageTrends(timePeriodSelect.value);
}); 