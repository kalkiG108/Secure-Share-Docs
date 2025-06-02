// DOM Elements
const documentsGrid = document.getElementById('documentsGrid');
const searchInput = document.getElementById('searchInput');
const uploadForm = document.getElementById('uploadForm');
const profileForm = document.getElementById('profileForm');
const logoutBtn = document.getElementById('logoutBtn');
const dropZone = document.getElementById('dropZone');

// Global variables for current filter and sort state
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';
let documents = []; // Store documents globally for filtering and sorting

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return token;
}

// Load User Profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            window.currentUserId = user._id;
            document.getElementById('userFullName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();

            // Fetch the photo as a blob with Authorization header
            const photoResponse = await fetch('/api/users/photo', {
                headers: {
                    'Authorization': `Bearer ${checkAuth()}`
                }
            });

            let photoUrl = 'images/default-avatar.svg';
            if (photoResponse.ok) {
                const blob = await photoResponse.blob();
                photoUrl = URL.createObjectURL(blob);
            }

            document.getElementById('profileAvatar').src = photoUrl;
            document.getElementById('profileModalAvatar').src = photoUrl;

            document.getElementById('profileFirstName').value = user.firstName || '';
            document.getElementById('profileLastName').value = user.lastName || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profileAadhaar').value = user.aadhaarNumber || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load Documents with filter and sort
async function loadDocuments() {
    try {
        const response = await fetch('/api/documents', {
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            documents = data.documents || []; // Store in global variable
            filterAndRenderDocuments();
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Error loading documents', 'error');
    }
}

// Filter and sort documents
function filterAndRenderDocuments() {
    let filteredDocs = [...documents];

    // Apply filter
    if (currentFilter !== 'all') {
        filteredDocs = filteredDocs.filter(doc => doc.access === currentFilter);
    }

    // Apply search
    if (searchQuery) {
        filteredDocs = filteredDocs.filter(doc => 
            doc.title.toLowerCase().includes(searchQuery) ||
            (doc.description && doc.description.toLowerCase().includes(searchQuery))
        );
    }

    // Apply sort
    switch (currentSort) {
        case 'newest':
            filteredDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredDocs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name-asc':
            filteredDocs.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredDocs.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }

    renderDocuments(filteredDocs);
}

// Render Documents
function renderDocuments(docs) {
    if (!docs.length) {
        documentsGrid.innerHTML = `
            <div class="d-flex flex-column justify-content-center align-items-center w-100" style="min-height: calc(100vh - 200px);">
                <i class="fas fa-folder-open fa-3x mb-3 text-secondary"></i>
                <h4 class="mb-2">No documents found</h4>
                <p class="mb-3">${searchQuery ? 'No documents match your search criteria.' : 'You haven\'t uploaded any documents yet.'}</p>
                ${!searchQuery ? `
                    <button class="btn btn-primary" id="inlineUploadBtn">
                        <i class="fas fa-upload me-2"></i>Upload your first document
                    </button>
                ` : ''}
            </div>
        `;
        if (!searchQuery) {
            setTimeout(() => {
                document.getElementById('inlineUploadBtn').onclick = showFullPageUploadForm;
            }, 0);
        }
        return;
    }

    documentsGrid.innerHTML = docs.map(doc => `
        <div class="col-12">
            <div class="card document-card h-100 border-0 shadow-sm hover-shadow" style="transition: all 0.2s ease;">
                <div class="row g-0">
                    <div class="col-auto d-none d-md-flex align-items-center p-3 ps-4" style="width: 80px;">
                        <i class="fas ${getDocumentIcon(doc.documentType)} document-icon fa-2x text-primary"></i>
                    </div>
                    <div class="col position-relative">
                        <span class="badge ${getAccessBadgeClass(doc.access)} position-absolute top-0 end-0 m-3">${doc.access}</span>
                        <div class="card-body py-3 px-4">
                            <div class="d-flex flex-column" style="min-height: 220px;">
                                <div class="pe-0 pe-md-3" style="min-width: 0;">
                                    <h5 class="card-title mb-2 text-truncate" style="font-size: 1.3rem;">${doc.title}</h5>
                                    <p class="card-text text-muted mb-2" style="font-size: 1.05rem;">
                                        ${doc.description || 'No description provided'}
                                    </p>
                                    <p class="card-text mt-3">
                                        <small class="text-muted" style="font-size: 0.95rem;">
                                            <i class="fas fa-clock me-1" style="font-size: 0.75rem;"></i>Last updated: ${formatDate(doc.updatedAt)}
                                        </small>
                                    </p>
                                </div>
                                <div class="document-actions d-flex justify-content-center justify-content-md-start gap-2 mt-auto pt-3">
                                    <button class="btn btn-sm btn-outline-primary action-btn" onclick="viewDocument('${doc._id}')" data-bs-toggle="tooltip" title="View Document">
                                        <i class="fas fa-eye action-icon"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning action-btn" onclick="updateDocument('${doc._id}')" data-bs-toggle="tooltip" title="Update Document">
                                        <i class="fas fa-edit action-icon"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-success action-btn" onclick="shareDocument('${doc._id}')" data-bs-toggle="tooltip" title="Share Document">
                                        <i class="fas fa-share-alt action-icon"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-orange action-btn" onclick="deleteDocument('${doc._id}')" data-bs-toggle="tooltip" title="Delete Document">
                                        <i class="fas fa-trash action-icon"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Add hover effect styles
    const style = document.createElement('style');
    style.textContent = `
        .btn-outline-primary.action-btn:hover {
            color: #fff !important;
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
        }
        .btn-outline-warning.action-btn:hover {
            color: #000 !important;
            background-color: #ffc107 !important;
            border-color: #ffc107 !important;
        }
        .btn-outline-success.action-btn:hover {
            color: #fff !important;
            background-color: #198754 !important;
            border-color: #198754 !important;
        }
        .btn-outline-orange {
            color: #f97316 !important;
            border-color: #f97316 !important;
            background-color: transparent !important;
            transition: all 0.2s ease;
        }
        .btn-outline-orange.action-btn:hover {
            color: #fff !important;
            background-color: #f97316 !important;
            border-color: #f97316 !important;
        }
        .modal .btn-secondary:hover,
        .modal .btn-outline-secondary:hover,
        #fullPageCancelBtn:hover {
            color: #fff !important;
            background-color: #f97316 !important;
            border-color: #f97316 !important;
        }
        .back-to-dashboard {
            color: #0d9488 !important;
            border-color: #0d9488 !important;
            background-color: transparent !important;
            transition: all 0.2s ease;
        }
        .back-to-dashboard:hover {
            color: #fff !important;
            background-color: #f97316 !important;
            border-color: #f97316 !important;
        }
        .btn-primary {
            background-color: #0d9488;
            border-color: #0d9488;
        }
        .btn-primary:hover {
            background-color: #f97316 !important;
            border-color: #f97316 !important;
        }
        .action-btn {
            transition: all 0.2s ease;
        }
        #deleteConfirmModal .text-danger {
            color: #f97316 !important;
        }
        #deleteConfirmModal .bg-danger {
            background-color: rgba(249, 115, 22, 0.1) !important;
        }
        #deleteConfirmModal .fa-exclamation-triangle {
            color: #f97316 !important;
        }
    `;
    document.head.appendChild(style);
}

// Get Document Icon
function getDocumentIcon(type) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'image': 'fa-file-image',
        'other': 'fa-file-alt'
    };
    return icons[type] || icons.other;
}

// Document Actions
async function viewDocument(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        window.location.href = `view-document.html?id=${id}`;
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading document', 'error');
    }
}

async function shareDocument(id) {
    try {
        // Get document details first
        const response = await fetch(`/api/documents/details/${id}`, {
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            }
        });

        if (!response.ok) {
            throw new Error('Error loading document details');
        }

        const doc = await response.json();
        
        // Update modal with document info
        const modal = document.getElementById('shareModal');
        modal.querySelector('.modal-title').textContent = `Share "${doc.title}"`;
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Store document ID in modal
        modal.dataset.documentId = id;

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Handle form submission
        const submitBtn = modal.querySelector('.modal-footer .btn-primary');
        submitBtn.onclick = async () => {
            const emailInput = modal.querySelector('input[type="email"]');
            const accessLevel = modal.querySelector('select').value;
            const message = modal.querySelector('textarea').value;

            if (!emailInput.value) {
                showToast('Please enter an email address', 'error');
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sharing...';

            try {
                const shareResponse = await fetch(`/api/documents/share/${id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${checkAuth()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: emailInput.value,
                        accessLevel: accessLevel,
                        message: message
                    })
                });

                if (shareResponse.ok) {
                    showToast('Document shared successfully', 'success');
                    bsModal.hide();
                } else {
                    const error = await shareResponse.json();
                    showToast(error.message || 'Error sharing document', 'error');
                }
            } catch (error) {
                console.error('Error sharing document:', error);
                showToast('Error sharing document', 'error');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        };
    } catch (error) {
        console.error('Error preparing share modal:', error);
        showToast('Error preparing share dialog', 'error');
    }
}

async function deleteDocument(id) {
    try {
        // Show confirmation dialog with document details
        const response = await fetch(`/api/documents/details/${id}`, {
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            }
        });

        if (!response.ok) {
            throw new Error('Error loading document details');
        }

        const doc = await response.json();
        
        // Create and show a Bootstrap modal for confirmation
        const modalHtml = `
            <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 1rem;">
                        <div class="modal-header border-0 bg-danger bg-opacity-10">
                            <div class="w-100 text-center position-relative">
                                <h5 class="modal-title mb-0 text-danger fw-semibold">Delete Document</h5>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="mb-4">
                                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                                <h5 class="mb-3">Are you sure you want to delete this document?</h5>
                                <p class="mb-1 text-muted">Document Title: <strong>${doc.title}</strong></p>
                                <p class="small text-danger mb-0">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div class="modal-footer border-0 justify-content-center gap-2 pb-4">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="button" class="btn bg-orange px-4" id="confirmDeleteBtn">
                                <i class="fas fa-trash me-2"></i>Delete Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove any existing modal
        const existingModal = document.getElementById('deleteConfirmModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal and handle delete confirmation
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();

        // Handle delete confirmation
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            try {
                // Show loading state
                const btn = document.getElementById('confirmDeleteBtn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

                const deleteResponse = await fetch(`/api/documents/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${checkAuth()}`
                    }
                });

                if (!deleteResponse.ok) {
                    const error = await deleteResponse.json();
                    throw new Error(error.message || 'Error deleting document');
                }

                // Hide modal
                modal.hide();
                
                // Show success message
                showToast('Document deleted successfully', 'success');

                // Reload documents after a short delay
                setTimeout(() => {
                    loadDocuments();
                }, 500);

            } catch (error) {
                console.error('Error deleting document:', error);
                showToast(error.message || 'Error deleting document', 'error');
                
                // Reset button state
                const btn = document.getElementById('confirmDeleteBtn');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };

    } catch (error) {
        console.error('Error in delete process:', error);
        showToast('Error preparing delete operation', 'error');
    }
}

// File Upload Handling
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-primary');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary');
    const files = e.dataTransfer.files;
    if (files.length) {
        const file = files[0];
        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showToast('File is too large. Maximum size is 5MB.', 'error');
            return;
        }
        handleFileUpload(file);
    }
});

function handleFileUpload(file) {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showToast('File is too large. Maximum size is 5MB.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('type', file.type.split('/')[1]);
    formData.append('userId', window.currentUserId);
    
    uploadDocument(formData);
}

async function uploadDocument(formData) {
    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Document uploaded successfully', 'success');
            // Wait for 1.5 seconds before redirecting
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        showToast('Error uploading document', 'error');
    }
}

// Search Functionality
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    filterAndRenderDocuments();
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '1rem';
    toastContainer.style.right = '1rem';
    toastContainer.style.zIndex = '9999';

    let customClass = 'toast-teal';
    if (type === 'error' || type === 'warning') {
        customClass = 'toast-orange';
    }

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${customClass}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

// Logout
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    }
});

// Show full page upload form
function showFullPageUploadForm() {
    const dashboardMain = document.querySelector('.dashboard-container');
    const originalContent = dashboardMain.innerHTML;
    dashboardMain.innerHTML = `
        <div class="upload-overlay w-100" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 10; background: rgba(13, 148, 136, 0.07); padding-top: 100px; display: flex; flex-direction: column; align-items: center; overflow-y: auto;">
            <h2 class="fw-bold mb-4" style="color: #0d9488; text-align: center; letter-spacing: -1px;">Upload Your Documents Here</h2>
            <form id="fullPageUploadForm" class="p-5 rounded-5 shadow-lg bg-white w-100 border" style="max-width: 600px; margin: 0 auto 40px auto; border: 2.5px solid #0d9488; box-shadow: 0 8px 32px rgba(13,148,136,0.18), 0 2px 8px rgba(249,115,22,0.10);">
                <div class="upload-zone mb-4 p-4 rounded-3 border border-2 border-dashed text-center bg-light" id="fullPageDropZone">
                    <i class="fas fa-file-upload fa-2x mb-2 text-secondary"></i>
                    <p class="mb-2">Drag & drop your file here, or</p>
                    <label class="btn btn-outline-primary">
                        <input type="file" id="fullPageFileInput" hidden accept="application/pdf">
                        Choose File
                    </label>
                    <div id="fullPageFileName" class="mt-2 text-secondary small"></div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" style="color:#0d9488;">Document Title</label>
                    <input type="text" class="form-control" id="fullPageTitle" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" style="color:#0d9488;">Description</label>
                    <textarea class="form-control" id="fullPageDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" style="color:#0d9488;">Access Level</label>
                    <select class="form-select" id="fullPageAccess">
                        <option value="private">Private</option>
                        <option value="shared">Shared</option>
                        <option value="public">Public</option>
                    </select>
                </div>
                <div class="d-flex justify-content-end align-items-center gap-2 mt-4">
                    <button type="button" class="btn" id="fullPageCancelBtn" style="border: 2px solid #0d9488; color: #0d9488; background: transparent; font-weight: 500;">Cancel</button>
                    <button type="submit" class="btn d-flex align-items-center btn-primary" id="fullPageUploadSubmitBtn" style="font-weight: 500;">
                        <span class="spinner-border spinner-border-sm d-none me-2" role="status" aria-hidden="true"></span>
                        <i class="fas fa-upload me-2"></i>Upload
                    </button>
                </div>
            </form>
        </div>
    `;
    // Add event listeners for drag-and-drop, file input, upload, and cancel
    const dropZone = document.getElementById('fullPageDropZone');
    const fileInput = document.getElementById('fullPageFileInput');
    const fileNameDiv = document.getElementById('fullPageFileName');
    let selectedFile = null;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary');
        const files = e.dataTransfer.files;
        if (files.length) {
            const file = files[0];
            // Check file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showToast('File is too large. Maximum size is 5MB.', 'error');
                return;
            }
            selectedFile = file;
            fileNameDiv.textContent = selectedFile.name;
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            // Check file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showToast('File is too large. Maximum size is 5MB.', 'error');
                fileInput.value = ''; // Clear the input
                fileNameDiv.textContent = ''; // Clear the filename display
                return;
            }
            selectedFile = file;
            fileNameDiv.textContent = selectedFile.name;
        }
    });
    document.getElementById('fullPageCancelBtn').onclick = () => {
        dashboardMain.innerHTML = originalContent;
        // Re-initialize dashboard events
        initializeDashboardEvents();
        loadDocuments();
    };
    document.getElementById('fullPageUploadForm').onsubmit = async function(e) {
        e.preventDefault();
        if (!selectedFile) {
            showToast('Please select a file to upload', 'error');
            return;
        }
        // Only allow PDF files
        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            showToast('Only PDF files are allowed. Please select a PDF.', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', document.getElementById('fullPageTitle').value);
        formData.append('description', document.getElementById('fullPageDescription').value);
        formData.append('access', document.getElementById('fullPageAccess').value);
        formData.append('userId', window.currentUserId);
        formData.append('documentType', 'pdf');
        // Show spinner
        document.querySelector('#fullPageUploadSubmitBtn .spinner-border').classList.remove('d-none');
        await uploadDocument(formData);
        // Hide spinner and restore dashboard
        document.querySelector('#fullPageUploadSubmitBtn .spinner-border').classList.add('d-none');
        dashboardMain.innerHTML = originalContent;
        initializeDashboardEvents();
        loadDocuments();
    };
}

// Helper to re-initialize dashboard events after restoring content
function initializeDashboardEvents() {
    // All upload buttons (navbar and dashboard)
    document.querySelectorAll('#fullPageUploadBtn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            showFullPageUploadForm();
        };
    });
    // Empty state upload button
    const inlineUploadBtn = document.getElementById('inlineUploadBtn');
    if (inlineUploadBtn) {
        inlineUploadBtn.onclick = showFullPageUploadForm;
    }
}

// Add the updateDocument function
async function updateDocument(id) {
    try {
        // Get the current document data
        const response = await fetch(`/api/documents/details/${id}`, {
            headers: {
                'Authorization': `Bearer ${checkAuth()}`
            }
        });
        
        if (response.ok) {
            const doc = await response.json();
            // Show the full-page update form
            const dashboardMain = document.querySelector('.dashboard-container');
            const originalContent = dashboardMain.innerHTML;
            dashboardMain.innerHTML = `
                <div class="upload-overlay w-100" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 10; background: rgba(13, 148, 136, 0.07); padding-top: 100px; display: flex; flex-direction: column; align-items: center; overflow-y: auto;">
                    <h2 class="fw-bold mb-4" style="color: #0d9488; text-align: center; letter-spacing: -1px;">Update Document</h2>
                    <form id="updateForm" class="p-5 rounded-5 shadow-lg bg-white w-100 border" style="max-width: 600px; margin: 0 auto 40px auto; border: 2.5px solid #0d9488; box-shadow: 0 8px 32px rgba(13,148,136,0.18), 0 2px 8px rgba(249,115,22,0.10);">
                        <div class="upload-zone mb-4 p-4 rounded-3 border border-2 border-dashed text-center bg-light" id="updateDropZone">
                            <i class="fas fa-file-upload fa-2x mb-2 text-secondary"></i>
                            <p class="mb-2">Drag & drop your file here, or</p>
                            <label class="btn btn-outline-primary">
                                <input type="file" id="updateFileInput" hidden accept="application/pdf">
                                Choose File
                            </label>
                            <div id="updateFileName" class="mt-2 text-secondary small"></div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold" style="color:#0d9488;">Document Title</label>
                            <input type="text" class="form-control" id="updateTitle" value="${doc.title}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold" style="color:#0d9488;">Description</label>
                            <textarea class="form-control" id="updateDescription" rows="3">${doc.description || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold" style="color:#0d9488;">Access Level</label>
                            <select class="form-select" id="updateAccess">
                                <option value="private" ${doc.access === 'private' ? 'selected' : ''}>Private</option>
                                <option value="shared" ${doc.access === 'shared' ? 'selected' : ''}>Shared</option>
                                <option value="public" ${doc.access === 'public' ? 'selected' : ''}>Public</option>
                            </select>
                        </div>
                        <div class="d-flex justify-content-end align-items-center gap-2 mt-4">
                            <button type="button" class="btn" id="updateCancelBtn" style="border: 2px solid #0d9488; color: #0d9488; background: transparent; font-weight: 500;">Cancel</button>
                            <button type="submit" class="btn d-flex align-items-center" id="updateSubmitBtn" style="background: #0d9488; color: #fff; font-weight: 500; border: none; transition: background 0.2s;">
                                <span class="spinner-border spinner-border-sm d-none me-2" role="status" aria-hidden="true"></span>
                                <i class="fas fa-save me-2"></i>Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            `;

            // Add event listeners
            const dropZone = document.getElementById('updateDropZone');
            const fileInput = document.getElementById('updateFileInput');
            const fileNameDiv = document.getElementById('updateFileName');
            let selectedFile = null;

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-primary');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-primary');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-primary');
                const files = e.dataTransfer.files;
                if (files.length) {
                    const file = files[0];
                    // Check file size (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                    if (file.size > maxSize) {
                        showToast('File is too large. Maximum size is 5MB.', 'error');
                        return;
                    }
                    selectedFile = file;
                    fileNameDiv.textContent = selectedFile.name;
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    const file = e.target.files[0];
                    // Check file size (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                    if (file.size > maxSize) {
                        showToast('File is too large. Maximum size is 5MB.', 'error');
                        fileInput.value = '';
                        fileNameDiv.textContent = '';
                        return;
                    }
                    selectedFile = file;
                    fileNameDiv.textContent = selectedFile.name;
                }
            });

            document.getElementById('updateCancelBtn').onclick = () => {
                dashboardMain.innerHTML = originalContent;
                initializeDashboardEvents();
                loadDocuments();
            };

            document.getElementById('updateForm').onsubmit = async function(e) {
                e.preventDefault();
                const formData = new FormData();
                if (selectedFile) {
                    // Only allow PDF files
                    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
                    if (!isPdf) {
                        showToast('Only PDF files are allowed. Please select a PDF.', 'error');
                        return;
                    }
                    formData.append('file', selectedFile);
                }
                formData.append('title', document.getElementById('updateTitle').value);
                formData.append('description', document.getElementById('updateDescription').value);
                formData.append('access', document.getElementById('updateAccess').value);

                // Show spinner
                document.querySelector('#updateSubmitBtn .spinner-border').classList.remove('d-none');
                try {
                    const response = await fetch(`/api/documents/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${checkAuth()}`
                        },
                        body: formData
                    });

                    if (response.ok) {
                        showToast('Document updated successfully', 'success');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1500);
                    } else {
                        const error = await response.json();
                        showToast(error.message || 'Error updating document', 'error');
                    }
                } catch (error) {
                    console.error('Error updating document:', error);
                    showToast('Error updating document', 'error');
                }
                // Hide spinner
                document.querySelector('#updateSubmitBtn .spinner-border').classList.add('d-none');
            };
        }
    } catch (error) {
        console.error('Error loading document for update:', error);
        showToast('Error loading document', 'error');
    }
}

// Initialize filter and sort dropdowns
function initializeFilterSort() {
    // Add event listeners for filter and sort
    document.addEventListener('click', function(e) {
        const filterItem = e.target.closest('[data-filter]');
        const sortItem = e.target.closest('[data-sort]');

        if (filterItem) {
            e.preventDefault();
            currentFilter = filterItem.dataset.filter;
            // Update button text
            const btn = document.getElementById('filterDropdown');
            if (btn) {
                btn.innerHTML = `
                    <i class="fas fa-filter"></i>
                    <span class="d-none d-md-inline-block ms-1">${filterItem.textContent}</span>
                `;
            }
            filterAndRenderDocuments();
        }

        if (sortItem) {
            e.preventDefault();
            currentSort = sortItem.dataset.sort;
            // Update button text
            const btn = document.getElementById('sortDropdown');
            if (btn) {
                btn.innerHTML = `
                    <i class="fas fa-sort"></i>
                    <span class="d-none d-md-inline-block ms-1">${sortItem.textContent}</span>
                `;
            }
            filterAndRenderDocuments();
        }
    });

    // Add event listener for search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Helper function to get badge class based on access level
function getAccessBadgeClass(access) {
    switch (access) {
        case 'private':
            return 'bg-secondary';
        case 'shared':
            return 'bg-primary';
        case 'public':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserProfile();
    loadDocuments();
    initializeFilterSort();
    initializeDashboardEvents();
    
    // Initialize all tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
}); 