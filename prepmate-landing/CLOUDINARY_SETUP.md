# Cloudinary Setup Guide

## Overview

This project uses Cloudinary for image uploads. If Cloudinary is not configured, the app will fall back to base64 encoding for images.

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. Verify your email address

### 2. Get Your Cloud Name

1. Log into your Cloudinary dashboard
2. Your cloud name is displayed in the top-left corner of the dashboard
3. It looks like: `dxxxxx` or `your-username`

### 3. Create an Upload Preset

1. In your Cloudinary dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set the following:
   - **Preset name**: `prepmate` (or any name you prefer)
   - **Signing Mode**: `Unsigned`
   - **Folder**: `prepmate` (optional)
5. Click **Save**

### 4. Configure Environment Variables

Create a `.env` file in the `prepmate-landing` directory with:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

Replace:

- `your-cloud-name` with your actual cloud name from step 2
- `your-upload-preset` with the preset name you created in step 3

### 5. Restart the Development Server

After adding the environment variables, restart your development server:

```bash
npm start
```

## Fallback Behavior

If Cloudinary is not configured:

- Images will be converted to base64 and stored locally
- This works for development but is not recommended for production
- Base64 images are larger and slower to load

## Troubleshooting

### Common Issues

1. **"Invalid cloud name" error**

   - Check that your cloud name is correct
   - Make sure there are no extra spaces or characters

2. **"Invalid upload preset" error**

   - Verify your upload preset name is correct
   - Ensure the preset is set to "Unsigned" mode

3. **CORS errors**
   - Cloudinary handles CORS automatically for unsigned uploads
   - If you're using signed uploads, you'll need to configure CORS in your Cloudinary settings

### Testing

To test if Cloudinary is working:

1. Try uploading a profile picture
2. Check the browser console for any error messages
3. If you see "Cloudinary not configured, using base64 fallback", the environment variables are not set correctly

## Security Notes

- The current setup uses unsigned uploads for simplicity
- For production, consider using signed uploads for better security
- Never expose your Cloudinary API secret in client-side code
