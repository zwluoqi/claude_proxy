document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const tokensList = document.getElementById('tokens-list');
  const searchToken = document.getElementById('search-token');
  const tokenStatusSelect = document.getElementById('token-status');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');
  const tokenModal = document.getElementById('token-modal');
  const editTokenValue = document.getElementById('edit-token-value');
  const tokenDisplay = document.getElementById('token-display');
  const tokenUser = document.getElementById('token-user');
  const tokenStatusEdit = document.getElementById('token-status-edit');
  const tokenTotalRequests = document.getElementById('token-total-requests');
  const tokenTotalTokens = document.getElementById('token-total-tokens');
  const tokenTotalCost = document.getElementById('token-total-cost');
  const tokenUsageList = document.getElementById('token-usage-list');
  const saveTokenBtn = document.getElementById('save-token');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const closeModalSpan = document.querySelector('.close');
  
  let currentPage = 1;
  let totalPages = 1;
  let searchTerm = '';
  let currentStatus = 'all';
  const PAGE_SIZE = 10;
  
  // 获取令牌列表
  async function fetchTokens(page = 1, search = '', status = 'all') {
    try {
      let url = `/api/admin/tokens?page=${page}&limit=${PAGE_SIZE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (status !== 'all') {
        url += `&status=${status}`;
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
        totalPagesSpan.textContent = totalPages;
        
        // 禁用/启用分页按钮
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // 清空加载占位符
        tokensList.innerHTML = '';
        
        if (!data.tokens || data.tokens.length === 0) {
          tokensList.innerHTML = '<tr><td colspan="6" class="text-center">暂无令牌</td></tr>';
          return;
        }
        
        // 显示令牌列表
        data.tokens.forEach(t => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(t.createdAt);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${t.token.substring(0, 8)}...</td>
            <td>${t.username}</td>
            <td>
              <span class="status ${t.status === 'active' ? 'status-active' : 'status-banned'}">
                ${t.status}
              </span>
            </td>
            <td>${formattedDate}</td>
            <td>${t.usageCount || 0}</td>
            <td>
              <button class="btn-icon view-token" data-token="${t.token}" data-username="${t.username}" data-status="${t.status}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon ${t.status === 'active' ? 'ban-token' : 'unban-token'}" data-token="${t.token}">
                <i class="fas ${t.status === 'active' ? 'fa-ban' : 'fa-check-circle'}"></i>
              </button>
            </td>
          `;
          
          tokensList.appendChild(row);
        });
        
        // 添加查看令牌按钮事件
        document.querySelectorAll('.view-token').forEach(btn => {
          btn.addEventListener('click', function() {
            const tokenData = this.dataset;
            openTokenModal(tokenData);
          });
        });
        
        // 添加禁用令牌按钮事件
        document.querySelectorAll('.ban-token').forEach(btn => {
          btn.addEventListener('click', function() {
            const tokenValue = this.getAttribute('data-token');
            updateTokenStatus(tokenValue, 'banned');
          });
        });
        
        // 添加启用令牌按钮事件
        document.querySelectorAll('.unban-token').forEach(btn => {
          btn.addEventListener('click', function() {
            const tokenValue = this.getAttribute('data-token');
            updateTokenStatus(tokenValue, 'active');
          });
        });
      } else {
        tokensList.innerHTML = '<tr><td colspan="6" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取令牌列表失败:', err);
      tokensList.innerHTML = '<tr><td colspan="6" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 获取令牌使用记录
  async function fetchTokenUsage(tokenValue) {
    try {
      const response = await fetch(`/api/admin/tokens/${encodeURIComponent(tokenValue)}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 更新统计数据
        tokenTotalRequests.textContent = data.totalRequests || 0;
        tokenTotalTokens.textContent = data.totalTokens || 0;
        tokenTotalCost.textContent = `¥${(data.totalCost || 0).toFixed(2)}`;
        
        // 清空加载占位符
        tokenUsageList.innerHTML = '';
        
        if (!data.logs || data.logs.length === 0) {
          tokenUsageList.innerHTML = '<tr><td colspan="3" class="text-center">暂无使用记录</td></tr>';
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
            <td>${log.tokenCount || 0}</td>
            <td>¥${log.cost ? log.cost.toFixed(4) : '0.0000'}</td>
          `;
          
          tokenUsageList.appendChild(row);
        });
      } else {
        tokenUsageList.innerHTML = '<tr><td colspan="3" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取令牌使用记录失败:', err);
      tokenUsageList.innerHTML = '<tr><td colspan="3" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 更新令牌状态
  async function updateTokenStatus(tokenValue, status) {
    try {
      const response = await fetch(`/api/admin/tokens/${encodeURIComponent(tokenValue)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // 刷新令牌列表
        fetchTokens(currentPage, searchTerm, currentStatus);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '更新失败');
      }
    } catch (err) {
      console.error('更新令牌状态失败:', err);
      alert('更新过程中发生错误，请稍后重试');
    }
  }
  
  // 打开令牌详情模态框
  function openTokenModal(tokenData) {
    editTokenValue.value = tokenData.token;
    tokenDisplay.value = tokenData.token;
    tokenUser.value = tokenData.username;
    tokenStatusEdit.value = tokenData.status;
    
    // 获取令牌使用记录
    fetchTokenUsage(tokenData.token);
    
    tokenModal.style.display = 'block';
  }
  
  // 关闭模态框
  function closeModal() {
    tokenModal.style.display = 'none';
  }
  
  // 保存令牌信息
  saveTokenBtn.addEventListener('click', function() {
    const tokenValue = editTokenValue.value;
    const status = tokenStatusEdit.value;
    
    updateTokenStatus(tokenValue, status);
    closeModal();
  });
  
  // 搜索令牌
  searchToken.addEventListener('input', function() {
    searchTerm = this.value.trim();
    currentPage = 1;
    fetchTokens(currentPage, searchTerm, currentStatus);
  });
  
  // 切换状态过滤
  tokenStatusSelect.addEventListener('change', function() {
    currentStatus = this.value;
    currentPage = 1;
    fetchTokens(currentPage, searchTerm, currentStatus);
  });
  
  // 上一页
  prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      fetchTokens(currentPage, searchTerm, currentStatus);
    }
  });
  
  // 下一页
  nextPageBtn.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      fetchTokens(currentPage, searchTerm, currentStatus);
    }
  });
  
  // 关闭模态框
  closeModalSpan.addEventListener('click', closeModal);
  cancelEditBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === tokenModal) {
      closeModal();
    }
  });
  
  // 初始加载令牌列表
  fetchTokens(currentPage, searchTerm, currentStatus);
}); 