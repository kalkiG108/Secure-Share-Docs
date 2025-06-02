// Profile Page JS
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return token;
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    let customClass = 'toast-teal';
    if (type === 'error' || type === 'warning') {
        customClass = 'toast-orange';
    }
    toast.className = `toast align-items-center text-white ${customClass} show mb-2`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function setEditMode(edit) {
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const photoOverlay = document.getElementById('photoOverlay');
    const photoInput = document.getElementById('photo');
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (edit) {
        firstName.removeAttribute('readonly');
        lastName.removeAttribute('readonly');
        photoOverlay.classList.remove('d-none');
        editBtn.classList.add('d-none');
        saveBtn.classList.remove('d-none');
        cancelBtn.classList.remove('d-none');
    } else {
        firstName.setAttribute('readonly', true);
        lastName.setAttribute('readonly', true);
        photoOverlay.classList.add('d-none');
        photoInput.value = '';
        editBtn.classList.remove('d-none');
        saveBtn.classList.add('d-none');
        cancelBtn.classList.add('d-none');
    }
}

async function loadProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${checkAuth()}` }
        });
        if (!response.ok) throw new Error('Failed to load profile');
        const user = await response.json();
        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('aadhaar').value = user.aadhaarNumber || '';
        // Load photo
        const photoRes = await fetch('/api/users/photo', {
            headers: { 'Authorization': `Bearer ${checkAuth()}` }
        });
        let photoUrl = 'images/default-avatar.svg';
        if (photoRes.ok) {
            const blob = await photoRes.blob();
            photoUrl = URL.createObjectURL(blob);
        }
        document.getElementById('profilePreview').src = photoUrl;
        setEditMode(false);
    } catch (err) {
        showToast('Could not load profile', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
    const photoInput = document.getElementById('photo');
    const profilePreview = document.getElementById('profilePreview');
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        setEditMode(true);
    });
    document.getElementById('cancelEditBtn').addEventListener('click', function() {
        loadProfile();
    });
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const photo = document.getElementById('photo').files[0];
        const spinner = document.querySelector('.spinner-border');
        const submitBtn = this.querySelector('button[type="submit"]');
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        try {
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            if (photo) formData.append('photo', photo);
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${checkAuth()}` },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to update profile');
            showToast('Profile updated successfully', 'success');
            loadProfile();
        } catch (err) {
            showToast('Error updating profile', 'error');
        } finally {
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
        }
    });
}); 