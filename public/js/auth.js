document.addEventListener('DOMContentLoaded', function() {
  // 切换登录和注册表单
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });
  
  registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });
  
  // 登录表单提交
  const loginFormEl = document.getElementById('loginForm');
  loginFormEl.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 登录成功，保存token和用户信息
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 根据用户角色跳转到不同页面
        if (data.user.role === 'admin') {
          window.location.href = '/admin/dashboard.html';
        } else {
          window.location.href = '/user/dashboard.html';
        }
      } else {
        // 登录失败，显示错误消息
        messageEl.textContent = data.message || '登录失败，请检查用户名和密码';
        messageEl.className = 'message error';
      }
    } catch (err) {
      console.error('登录错误:', err);
      messageEl.textContent = '登录过程中发生错误，请稍后重试';
      messageEl.className = 'message error';
    }
  });
  
  // 注册表单提交
  const registerFormEl = document.getElementById('registerForm');
  registerFormEl.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const redemptionCode = document.getElementById('redemption-code').value;
    const messageEl = document.getElementById('register-message');
    
    // 验证密码一致性
    if (password !== confirmPassword) {
      messageEl.textContent = '两次输入的密码不一致';
      messageEl.className = 'message error';
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          password,
          redemptionCode: redemptionCode || undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 注册成功
        messageEl.textContent = '注册成功，请登录';
        messageEl.className = 'message success';
        
        // 清空表单
        registerFormEl.reset();
        
        // 切换到登录表单
        setTimeout(() => {
          loginTab.click();
        }, 2000);
      } else {
        // 注册失败，显示错误消息
        messageEl.textContent = data.message || '注册失败';
        messageEl.className = 'message error';
      }
    } catch (err) {
      console.error('注册错误:', err);
      messageEl.textContent = '注册过程中发生错误，请稍后重试';
      messageEl.className = 'message error';
    }
  });
}); 