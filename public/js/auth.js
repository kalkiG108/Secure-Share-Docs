// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard.html';
    }
}

// Show error message
function showError(message) {
    // Remove any existing messages first
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Find the submit button and insert the error message after it
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.insertAdjacentElement('afterend', errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    // Remove any existing messages first
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Find the submit button and insert the success message after it
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.insertAdjacentElement('afterend', successDiv);
    
    setTimeout(() => successDiv.remove(), 5000);
}

// Handle login form
if (document.getElementById('loginForm')) {
    checkAuth();
    const loginForm = document.getElementById('loginForm');
    const requestOtpBtn = document.getElementById('requestOtp');
    const otpSection = document.getElementById('otpSection');

    requestOtpBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (!username) {
            showError('Please enter username');
            return;
        }

        try {
            await api.auth.sendOtp(username);
            otpSection.style.display = 'block';
            requestOtpBtn.textContent = 'Resend OTP';
        } catch (error) {
            showError(error.message);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const otp = document.getElementById('otp').value;

        if (!username || !password || !otp) {
            showError('Please fill in all fields');
            return;
        }

        try {
            const response = await api.auth.login(username, password, otp);
            localStorage.setItem('token', response.token);
            window.location.href = '/dashboard.html';
        } catch (error) {
            showError(error.message);
        }
    });
}

// Handle registration form
if (document.getElementById('registerForm')) {
    checkAuth();
    const registerForm = document.getElementById('registerForm');
    const photoInput = document.getElementById('photo');
    const profilePreview = document.getElementById('profilePreview');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    // Handle profile photo preview
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showError('Please select an image file');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Toggle password visibility
    function togglePasswordVisibility(inputField, button) {
        const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
        inputField.setAttribute('type', type);
        button.querySelector('i').classList.toggle('fa-eye');
        button.querySelector('i').classList.toggle('fa-eye-slash');
    }

    togglePassword.addEventListener('click', () => togglePasswordVisibility(password, togglePassword));
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPassword, toggleConfirmPassword));

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Registration form submitted');
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const aadhaar = document.getElementById('aadhaar').value.trim();
        const photo = document.getElementById('photo').files[0];
        const terms = document.getElementById('terms').checked;

        // Log form data
        console.log('Form Data:', {
            firstName,
            lastName,
            email,
            aadhaar,
            photoName: photo ? photo.name : 'No photo selected',
            photoSize: photo ? photo.size : 0,
            photoType: photo ? photo.type : 'none',
            terms
        });

        // Validation
        if (!firstName || !lastName || !email || !aadhaar || !password.value || !confirmPassword.value || !photo) {
            showError('Please fill in all fields');
            console.log('Validation failed: Missing fields');
            return;
        }

        if (password.value !== confirmPassword.value) {
            showError('Passwords do not match');
            console.log('Validation failed: Passwords do not match');
            return;
        }

        if (password.value.length < 8) {
            showError('Password must be at least 8 characters long');
            console.log('Validation failed: Password too short');
            return;
        }

        if (!/^\d{12}$/.test(aadhaar)) {
            showError('Please enter a valid 12-digit Aadhaar number');
            console.log('Validation failed: Invalid Aadhaar number');
            return;
        }

        if (!terms) {
            showError('Please agree to the terms and conditions');
            console.log('Validation failed: Terms not accepted');
            return;
        }

        // Create FormData object
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('password', password.value);
        formData.append('aadhaarNumber', aadhaar);
        formData.append('photo', photo);

        // Log FormData entries
        for (let pair of formData.entries()) {
            console.log('FormData Entry:', pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
        }

        try {
            console.log('Sending registration request...');
            const spinner = document.querySelector('.spinner-border');
            const submitBtn = document.querySelector('button[type="submit"]');
            spinner.classList.remove('d-none');
            submitBtn.disabled = true;

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.ok) {
                showSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showError(data.message || 'Error registering user');
                console.error('Registration failed:', data);
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Error registering user: ' + (error.message || 'Unknown error'));
        } finally {
            const spinner = document.querySelector('.spinner-border');
            const submitBtn = document.querySelector('button[type="submit"]');
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
        }
    });
} 