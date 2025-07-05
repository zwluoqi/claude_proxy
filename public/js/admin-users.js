document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const createUserForm = document.getElementById('create-user-form');
  const createMessage = document.getElementById('create-message');
  const usersList = document.getElementById('users-list');
  const searchUser = document.getElementById('search-user');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');
  const userModal = document.getElementById('user-modal');
  const editUserForm = document.getElementById('edit-user-form');
  const editUserId = document.getElementById('edit-user-id');
  const editUsername = document.getElementById('edit-username');
  const editStatus = document.getElementById('edit-status');
  const editQuota = document.getElementById('edit-quota');
  const editPassword = document.getElementById('edit-password');
  const saveUserBtn = document.getElementById('save-user');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const closeModalSpan = document.querySelector('.close');
  
  let currentPage = 1;
  let totalPages = 1;
  let searchTerm = '';
  const PAGE_SIZE = 10;
  
  // 获取用户列表
  async function fetchUsers(page = 1, search = '') {
    try {
      let url = `/api/admin/users?page=${page}&limit=${PAGE_SIZE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
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
        usersList.innerHTML = '';
        
        if (!data.users || data.users.length === 0) {
          usersList.innerHTML = '<tr><td colspan="5" class="text-center">暂无用户</td></tr>';
          return;
        }
        
        // 显示用户列表
        data.users.forEach(user => {
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
            <td>
              <button class="btn-icon edit-user" data-id="${user.id}" data-username="${user.username}" data-status="${user.status}" data-quota="${user.quota}">
                <i class="fas fa-edit"></i>
              </button>
            </td>
          `;
          
          usersList.appendChild(row);
        });
        
        // 添加编辑用户按钮事件
        document.querySelectorAll('.edit-user').forEach(btn => {
          btn.addEventListener('click', function() {
            const userData = this.dataset;
            openEditUserModal(userData);
          });
        });
      } else {
        usersList.innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取用户列表失败:', err);
      usersList.innerHTML = '<tr><td colspan="5" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 创建新用户
  async function createUser(username, password, quota) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, quota })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        createMessage.textContent = '创建成功';
        createMessage.className = 'message success';
        
        // 刷新用户列表
        fetchUsers(currentPage, searchTerm);
      } else {
        createMessage.textContent = data.message || '创建失败';
        createMessage.className = 'message error';
      }
    } catch (err) {
      console.error('创建用户失败:', err);
      createMessage.textContent = '创建过程中发生错误，请稍后重试';
      createMessage.className = 'message error';
    }
  }
  
  // 更新用户信息
  async function updateUser(id, data) {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // 关闭模态框
        closeModal();
        
        // 刷新用户列表
        fetchUsers(currentPage, searchTerm);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '更新失败');
      }
    } catch (err) {
      console.error('更新用户失败:', err);
      alert('更新过程中发生错误，请稍后重试');
    }
  }
  
  // 打开编辑用户模态框
  function openEditUserModal(userData) {
    editUserId.value = userData.id;
    editUsername.value = userData.username;
    editStatus.value = userData.status;
    editQuota.value = userData.quota;
    editPassword.value = ''; // 清空密码字段
    
    userModal.style.display = 'block';
  }
  
  // 关闭模态框
  function closeModal() {
    userModal.style.display = 'none';
  }
  
  // 提交创建用户表单
  createUserForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const quota = parseInt(document.getElementById('new-quota').value) || 0;
    
    if (!username || !password) {
      createMessage.textContent = '用户名和密码不能为空';
      createMessage.className = 'message error';
      return;
    }
    
    createUser(username, password, quota);
    this.reset();
    document.getElementById('new-quota').value = '0';
  });
  
  // 保存用户信息
  saveUserBtn.addEventListener('click', function() {
    const id = editUserId.value;
    const updateData = {
      status: editStatus.value,
      quota: parseInt(editQuota.value) || 0
    };
    
    // 如果提供了新密码，则包含在更新数据中
    if (editPassword.value.trim()) {
      updateData.password = editPassword.value.trim();
    }
    
    updateUser(id, updateData);
  });
  
  // 搜索用户
  searchUser.addEventListener('input', function() {
    searchTerm = this.value.trim();
    currentPage = 1;
    fetchUsers(currentPage, searchTerm);
  });
  
  // 上一页
  prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      fetchUsers(currentPage, searchTerm);
    }
  });
  
  // 下一页
  nextPageBtn.addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      fetchUsers(currentPage, searchTerm);
    }
  });
  
  // 关闭模态框
  closeModalSpan.addEventListener('click', closeModal);
  cancelEditBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === userModal) {
      closeModal();
    }
  });
  
  // 初始加载用户列表
  fetchUsers(currentPage, searchTerm);
}); 