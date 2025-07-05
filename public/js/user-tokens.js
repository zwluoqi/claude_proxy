document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const createTokenForm = document.getElementById('create-token-form');
  const tokensList = document.getElementById('tokens-list');
  const tokenModal = document.getElementById('token-modal');
  const newTokenElement = document.getElementById('new-token');
  const copyTokenBtn = document.getElementById('copy-token');
  const closeModalBtn = document.getElementById('close-modal');
  const closeSpan = document.querySelector('.close');
  
  // 获取用户的所有令牌
  async function fetchTokens() {
    try {
      const response = await fetch('/api/token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const tokens = await response.json();
        
        // 清空加载占位符
        tokensList.innerHTML = '';
        
        if (tokens.length === 0) {
          tokensList.innerHTML = '<tr><td colspan="4" class="text-center">暂无API令牌</td></tr>';
          return;
        }
        
        // 显示所有令牌
        tokens.forEach(t => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(t.createdAt);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${t.token.substring(0, 8)}...</td>
            <td>
              <span class="status ${t.status === 'active' ? 'status-active' : 'status-banned'}">
                ${t.status}
              </span>
            </td>
            <td>${formattedDate}</td>
            <td>
              <button class="btn-icon delete-token" data-token="${t.token}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          
          tokensList.appendChild(row);
        });
        
        // 添加删除令牌的事件监听器
        document.querySelectorAll('.delete-token').forEach(btn => {
          btn.addEventListener('click', function() {
            const tokenToDelete = this.getAttribute('data-token');
            deleteToken(tokenToDelete);
          });
        });
      } else {
        tokensList.innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取令牌失败:', err);
      tokensList.innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 创建新令牌
  async function createToken(description) {
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description })
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        
        // 显示新令牌
        newTokenElement.textContent = tokenData.token;
        tokenModal.style.display = 'block';
        
        // 刷新令牌列表
        fetchTokens();
      } else {
        alert('创建令牌失败，请稍后重试');
      }
    } catch (err) {
      console.error('创建令牌失败:', err);
      alert('创建令牌失败，请稍后重试');
    }
  }
  
  // 删除令牌
  async function deleteToken(tokenValue) {
    if (!confirm('确定要删除此令牌吗？删除后将无法使用该令牌访问API。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/token/${encodeURIComponent(tokenValue)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // 刷新令牌列表
        fetchTokens();
      } else {
        alert('删除令牌失败，请稍后重试');
      }
    } catch (err) {
      console.error('删除令牌失败:', err);
      alert('删除令牌失败，请稍后重试');
    }
  }
  
  // 复制令牌到剪贴板
  copyTokenBtn.addEventListener('click', function() {
    const tokenText = newTokenElement.textContent;
    navigator.clipboard.writeText(tokenText)
      .then(() => {
        alert('令牌已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        // 如果剪贴板API不可用，创建一个临时输入框来实现复制
        const tempInput = document.createElement('input');
        tempInput.value = tokenText;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('令牌已复制到剪贴板');
      });
  });
  
  // 关闭模态框
  function closeModal() {
    tokenModal.style.display = 'none';
  }
  
  closeSpan.addEventListener('click', closeModal);
  closeModalBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === tokenModal) {
      closeModal();
    }
  });
  
  // 提交创建令牌表单
  createTokenForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const description = document.getElementById('token-description').value;
    createToken(description);
    this.reset();
  });
  
  // 初始加载令牌列表
  fetchTokens();
}); 