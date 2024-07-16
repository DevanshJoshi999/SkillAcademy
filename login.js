document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://dev-api.skill.college/user/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({ 'username': username, 'password': password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Login failed');
        }

        const data = await response.json();
        const accessToken = data.access_token;

        if (accessToken) {
            // Save the access token (consider using session storage or cookies for security)
            sessionStorage.setItem('accessToken', accessToken);

            // Redirect to the index.html (roadmap page)
            window.location.href = 'index.html';
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
    }
});
