document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const generateForm = document.getElementById('generate-code-form');
  const generateMessage = document.getElementById('generate-message');
  const codesList = document.getElementById('codes-list');
  const codeStatusSelect = document.getElementById('code-status');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');
  const exportModal = document.getElementById('export-modal');
  const exportCodes = document.getElementById('export-codes');
  const copyCodesBtn = document.getElementById('copy-codes');
  const downloadCsvBtn = document.getElementById('download-csv');
  const closeExportBtn = document.getElementById('close-export');
  const closeModalSpan = document.querySelector('.close');
  
  let currentPage = 1;
  let totalPages = 1;
  let currentStatus = 'all';
  const PAGE_SIZE = 10;
  let generatedCodes = [];
  
  // 获取兑换码列表
  async function fetchCodes(page = 1, status = 'all') {
    try {
      let url = `/api/admin/redemption?page=${page}&limit=${PAGE_SIZE}`;
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
        codesList.innerHTML = '';
        
        if (!data.codes || data.codes.length === 0) {
          codesList.innerHTML = '<tr><td colspan="6" class="text-center">暂无兑换码</td></tr>';
          return;
        }
        
        // 显示兑换码列表
        data.codes.forEach(code => {
          const row = document.createElement('tr');
          
          // 格式化使用时间
          let usedTime = '未使用';
          let usedBy = '-';
          
          if (code.isUsed && code.usedAt) {
            const date = new Date(code.usedAt);
            usedTime = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            usedBy = code.usedBy || '-';
          }
          
          row.innerHTML = `
            <td>${code.code}</td>
            <td>${code.quota}</td>
            <td>
              <span class="status ${code.isUsed ? 'status-banned' : 'status-active'}">
                ${code.isUsed ? '已使用' : '未使用'}
              </span>
            </td>
            <td>${usedTime}</td>
            <td>${usedBy}</td>
            <td>
              <button class="btn-icon delete-code" data-id="${code.id}" data-code="${code.code}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          
          codesList.appendChild(row);
        });
        
        // 添加删除兑换码按钮事件
        document.querySelectorAll('.delete-code').forEach(btn => {
          btn.addEventListener('click', function() {
            const codeId = this.getAttribute('data-id');
            const codeValue = this.getAttribute('data-code');
            deleteCode(codeId, codeValue);
          });
        });
      } else {
        codesList.innerHTML = '<tr><td colspan="6" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取兑换码列表失败:', err);
      codesList.innerHTML = '<tr><td colspan="6" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 生成兑换码
  async function generateCodes(count, quota) {
    try {
      const response = await fetch('/api/admin/redemption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ count, quota })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        generateMessage.textContent = '生成成功';
        generateMessage.className = 'message success';
        
        // 保存生成的兑换码，并显示导出模态框
        generatedCodes = data.codes || [];
        if (generatedCodes.length > 0) {
          showExportModal(generatedCodes);
        }
        
        // 刷新兑换码列表
        fetchCodes(1, currentStatus);
      } else {
        generateMessage.textContent = data.message || '生成失败';
        generateMessage.className = 'message error';
      }
    } catch (err) {
      console.error('生成兑换码失败:', err);
      generateMessage.textContent = '生成过程中发生错误，请稍后重试';
      generateMessage.className = 'message error';
    }
  }
  
  // 删除兑换码
  async function deleteCode(id, code) {
    if (!confirm(`确定要删除兑换码 "${code}" 吗？`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/redemption/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // 刷新兑换码列表
        fetchCodes(currentPage, currentStatus);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '删除失败');
      }
    } catch (err) {
      console.error('删除兑换码失败:', err);
      alert('删除过程中发生错误，请稍后重试');
    }
  }
  
  // 显示导出兑换码模态框
  function showExportModal(codes) {
    exportCodes.value = codes.map(code => `${code.code} (${code.quota})`).join('\n');
    exportModal.style.display = 'block';
  }
  
  // 关闭导出模态框
  function closeExportModal() {
    exportModal.style.display = 'none';
  }
  
  // 复制兑换码到剪贴板
  copyCodesBtn.addEventListener('click', function() {
    exportCodes.select();
    document.execCommand('copy');
    alert('已复制到剪贴板');
  });
  
  // 下载CSV文件
  downloadCsvBtn.addEventListener('click', function() {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Code,Quota\n' + 
      generatedCodes.map(code => `${code.code},${code.quota}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'redemption_codes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // 提交生成兑换码表单
  generateForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const count = parseInt(document.getElementById('code-count').value);
    const quota = parseInt(document.getElementById('code-quota').value);
    
    if (count < 1 || count > 100) {
      generateMessage.textContent = '生成数量必须在1-100之间';
      generateMessage.className = 'message error';
      return;
    }
    
    if (quota < 1) {
      generateMessage.textContent = '额度必须大于0';
      generateMessage.className = 'message error';
      return;
    }
    
    generateCodes(count, quota);
  });
  
  // 切换兑换码状态过滤
  codeStatusSelect.addEventListener('change', function() {
    currentStatus = this.value;
    currentPage = 1;
    fetchCodes(currentPage, currentStatus);
  });
  
  // 上一页
  prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      fetchCodes(currentPage, currentStatus);
    }
  });
  
  // 下一页
  nextPageBtn.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      fetchCodes(currentPage, currentStatus);
    }
  });
  
  // 关闭导出模态框
  closeExportBtn.addEventListener('click', closeExportModal);
  closeModalSpan.addEventListener('click', closeExportModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === exportModal) {
      closeExportModal();
    }
  });
  
  // 初始加载兑换码列表
  fetchCodes(currentPage, currentStatus);
}); 