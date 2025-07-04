document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard.html';
    } else {
        alert(data.message);
    }
});