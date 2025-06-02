const fs = require('fs');
const path = require('path');

// Base64 string of a simple avatar image (light gray background with a person icon)
const defaultAvatarBase64 = `data:image/svg+xml;base64,${Buffer.from(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#F3F4F6"/>
    <path d="M100 90C111.046 90 120 81.0457 120 70C120 58.9543 111.046 50 100 50C88.9543 50 80 58.9543 80 70C80 81.0457 88.9543 90 100 90Z" fill="#9CA3AF"/>
    <path d="M140 140C140 151.046 131.046 160 120 160H80C68.9543 160 60 151.046 60 140C60 117.909 77.9086 100 100 100C122.091 100 140 117.909 140 140Z" fill="#9CA3AF"/>
</svg>
`).toString('base64')}`;

// Function to convert base64 to image file
function base64ToImage(base64Str, filePath) {
    // Remove the data:image/svg+xml;base64 prefix
    const base64Data = base64Str.replace(/^data:image\/svg\+xml;base64,/, '');
    
    // Create buffer from base64
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Write file
    fs.writeFileSync(filePath, imageBuffer);
}

// Save the default avatar
const avatarPath = path.join(__dirname, 'default-avatar.svg');
base64ToImage(defaultAvatarBase64, avatarPath);

console.log('Default avatar created successfully!'); 