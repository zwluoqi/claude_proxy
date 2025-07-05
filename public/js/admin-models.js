document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const addModelForm = document.getElementById('add-model-form');
  const addModelMessage = document.getElementById('add-model-message');
  const modelsList = document.getElementById('models-list');
  const modelModal = document.getElementById('model-modal');
  const editModelForm = document.getElementById('edit-model-form');
  const editModelId = document.getElementById('edit-model-id');
  const editModelName = document.getElementById('edit-model-name');
  const editInputPrice = document.getElementById('edit-input-price');
  const editOutputPrice = document.getElementById('edit-output-price');
  const saveModelBtn = document.getElementById('save-model');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const closeModalSpan = document.querySelector('.close');
  
  // 获取模型列表
  async function fetchModels() {
    try {
      const response = await fetch('/api/admin/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const models = await response.json();
        
        // 清空加载占位符
        modelsList.innerHTML = '';
        
        if (!models || models.length === 0) {
          modelsList.innerHTML = '<tr><td colspan="4" class="text-center">暂无模型配置</td></tr>';
          return;
        }
        
        // 显示模型列表
        models.forEach(model => {
          const row = document.createElement('tr');
          
          row.innerHTML = `
            <td>${model.modelName}</td>
            <td>¥${model.inputPrice}</td>
            <td>¥${model.outputPrice}</td>
            <td>
              <button class="btn-icon edit-model" data-id="${model.id}" data-model-name="${model.modelName}" data-input-price="${model.inputPrice}" data-output-price="${model.outputPrice}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon delete-model" data-id="${model.id}" data-model-name="${model.modelName}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          
          modelsList.appendChild(row);
        });
        
        // 添加编辑模型按钮事件
        document.querySelectorAll('.edit-model').forEach(btn => {
          btn.addEventListener('click', function() {
            const modelData = this.dataset;
            openEditModelModal(modelData);
          });
        });
        
        // 添加删除模型按钮事件
        document.querySelectorAll('.delete-model').forEach(btn => {
          btn.addEventListener('click', function() {
            const modelId = this.getAttribute('data-id');
            const modelName = this.getAttribute('data-model-name');
            deleteModel(modelId, modelName);
          });
        });
      } else {
        modelsList.innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取模型列表失败:', err);
      modelsList.innerHTML = '<tr><td colspan="4" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 添加模型
  async function addModel(modelName, inputPrice, outputPrice) {
    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modelName, inputPrice, outputPrice })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addModelMessage.textContent = '添加成功';
        addModelMessage.className = 'message success';
        
        // 刷新模型列表
        fetchModels();
      } else {
        addModelMessage.textContent = data.message || '添加失败';
        addModelMessage.className = 'message error';
      }
    } catch (err) {
      console.error('添加模型失败:', err);
      addModelMessage.textContent = '添加过程中发生错误，请稍后重试';
      addModelMessage.className = 'message error';
    }
  }
  
  // 更新模型
  async function updateModel(id, inputPrice, outputPrice) {
    try {
      const response = await fetch(`/api/admin/models/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inputPrice, outputPrice })
      });
      
      if (response.ok) {
        // 关闭模态框
        closeModal();
        
        // 刷新模型列表
        fetchModels();
      } else {
        const errorData = await response.json();
        alert(errorData.message || '更新失败');
      }
    } catch (err) {
      console.error('更新模型失败:', err);
      alert('更新过程中发生错误，请稍后重试');
    }
  }
  
  // 删除模型
  async function deleteModel(id, modelName) {
    if (!confirm(`确定要删除模型 "${modelName}" 吗？`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/models/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // 刷新模型列表
        fetchModels();
      } else {
        const errorData = await response.json();
        alert(errorData.message || '删除失败');
      }
    } catch (err) {
      console.error('删除模型失败:', err);
      alert('删除过程中发生错误，请稍后重试');
    }
  }
  
  // 打开编辑模型模态框
  function openEditModelModal(modelData) {
    editModelId.value = modelData.id;
    editModelName.value = modelData.modelName;
    editInputPrice.value = modelData.inputPrice;
    editOutputPrice.value = modelData.outputPrice;
    
    modelModal.style.display = 'block';
  }
  
  // 关闭模态框
  function closeModal() {
    modelModal.style.display = 'none';
  }
  
  // 提交添加模型表单
  addModelForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const modelName = document.getElementById('model-name').value.trim();
    const inputPrice = parseFloat(document.getElementById('input-price').value);
    const outputPrice = parseFloat(document.getElementById('output-price').value);
    
    if (!modelName) {
      addModelMessage.textContent = '模型名称不能为空';
      addModelMessage.className = 'message error';
      return;
    }
    
    addModel(modelName, inputPrice, outputPrice);
    this.reset();
  });
  
  // 保存模型信息
  saveModelBtn.addEventListener('click', function() {
    const id = editModelId.value;
    const inputPrice = parseFloat(editInputPrice.value);
    const outputPrice = parseFloat(editOutputPrice.value);
    
    updateModel(id, inputPrice, outputPrice);
  });
  
  // 关闭模态框
  closeModalSpan.addEventListener('click', closeModal);
  cancelEditBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === modelModal) {
      closeModal();
    }
  });
  
  // 初始加载模型列表
  fetchModels();
}); 