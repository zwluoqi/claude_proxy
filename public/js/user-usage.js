document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const timePeriodSelect = document.getElementById('time-period');
  const dateFilter = document.getElementById('date-filter');
  const usageList = document.getElementById('usage-list');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageSpan = document.getElementById('current-page');
  
  let currentPage = 1;
  let totalPages = 1;
  const PAGE_SIZE = 10;
  let usageChart = null;
  
  // 设置日期过滤器默认为今天
  const today = new Date();
  dateFilter.value = today.toISOString().split('T')[0];
  
  // 获取使用记录
  async function fetchUsageLogs(page = 1, date = null) {
    try {
      let url = `/api/auth/usage?page=${page}&limit=${PAGE_SIZE}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 更新分页信息
        currentPage = data.currentPage || 1;
        totalPages = data.totalPages || 1;
        currentPageSpan.textContent = currentPage;
        
        // 禁用/启用分页按钮
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // 清空加载占位符
        usageList.innerHTML = '';
        
        if (!data.logs || data.logs.length === 0) {
          usageList.innerHTML = '<tr><td colspan="5" class="text-center">暂无使用记录</td></tr>';
          return;
        }
        
        // 显示使用记录
        data.logs.forEach(log => {
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
          
          usageList.appendChild(row);
        });
      } else {
        usageList.innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取使用记录失败:', err);
      usageList.innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 获取使用趋势数据
  async function fetchUsageTrends(period = 'day') {
    try {
      const response = await fetch(`/api/auth/usage/trends?period=${period}`, {
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
    
    // 创建新图表
    usageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Token 数量',
            data: tokenCounts,
            backgroundColor: 'rgba(74, 108, 247, 0.6)',
            borderColor: 'rgba(74, 108, 247, 1)',
            borderWidth: 1
          },
          {
            label: '费用 (¥)',
            data: costs,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1'
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
              text: 'Token 数量'
            }
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
  
  // 日期过滤器变化事件
  dateFilter.addEventListener('change', function() {
    currentPage = 1;
    fetchUsageLogs(currentPage, this.value);
  });
  
  // 上一页按钮事件
  prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      fetchUsageLogs(currentPage, dateFilter.value);
    }
  });
  
  // 下一页按钮事件
  nextPageBtn.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      fetchUsageLogs(currentPage, dateFilter.value);
    }
  });
  
  // 初始加载
  fetchUsageLogs(currentPage, dateFilter.value);
  fetchUsageTrends(timePeriodSelect.value);
}); 