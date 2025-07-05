document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const redeemForm = document.getElementById('redeem-form');
  const redemptionMessage = document.getElementById('redemption-message');
  const redemptionHistory = document.getElementById('redemption-history');
  
  // 获取兑换记录
  async function fetchRedemptionHistory() {
    try {
      const response = await fetch('/api/redemption/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        
        // 清空加载占位符
        redemptionHistory.innerHTML = '';
        
        if (history.length === 0) {
          redemptionHistory.innerHTML = '<tr><td colspan="3" class="text-center">暂无兑换记录</td></tr>';
          return;
        }
        
        // 显示兑换记录
        history.forEach(item => {
          const row = document.createElement('tr');
          
          // 格式化日期
          const date = new Date(item.createdAt);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${item.code}</td>
            <td>${item.quota}</td>
          `;
          
          redemptionHistory.appendChild(row);
        });
      } else {
        redemptionHistory.innerHTML = '<tr><td colspan="3" class="text-center">加载失败</td></tr>';
      }
    } catch (err) {
      console.error('获取兑换记录失败:', err);
      redemptionHistory.innerHTML = '<tr><td colspan="3" class="text-center">加载失败</td></tr>';
    }
  }
  
  // 兑换码
  async function redeemCode(code) {
    try {
      const response = await fetch('/api/redemption/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 显示成功消息
        redemptionMessage.textContent = `兑换成功！已增加 ${data.quota} 额度。`;
        redemptionMessage.className = 'message success';
        
        // 刷新兑换记录
        fetchRedemptionHistory();
        
        // 更新本地存储中的用户信息（配额）
        try {
          const userResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (err) {
          console.error('获取用户信息失败:', err);
        }
      } else {
        // 显示错误消息
        redemptionMessage.textContent = data.message || '兑换失败';
        redemptionMessage.className = 'message error';
      }
    } catch (err) {
      console.error('兑换失败:', err);
      redemptionMessage.textContent = '兑换过程中发生错误，请稍后重试';
      redemptionMessage.className = 'message error';
    }
  }
  
  // 提交兑换表单
  redeemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('redemption-code').value.trim();
    
    if (!code) {
      redemptionMessage.textContent = '请输入兑换码';
      redemptionMessage.className = 'message error';
      return;
    }
    
    redeemCode(code);
    this.reset();
  });
  
  // 初始加载兑换记录
  fetchRedemptionHistory();
}); 