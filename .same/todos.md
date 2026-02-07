# Meeting Diary - Todos

## Completed
- [x] Clone project from GitHub
- [x] Set up project with Bun
- [x] Add Dashboard with meeting statistics and charts
- [x] Rework image upload to store in pers-img directory instead of database
- [x] Add image cropping before upload
- [x] Add drag-and-drop photo upload
- [x] Fix PHP 7.3 compatibility for upload-photo.php
- [x] Add ImageLightbox for enlarging photos on tap/click
- [x] Fix mobile touch handling for ImageLightbox
- [x] Rebuild deployment ZIP with all latest files (v11)

## Deployment Package Contents
- Frontend: Static Next.js build with all components (Dashboard, ImageCropper, ImageLightbox)
- Backend: PHP 7.3+ compatible API files
- Database: schema.sql
- Instructions: README.txt

## Notes
- Default credentials: admin@meetings.com / Admin123!
- Photos stored in /pers-img/ directory (needs write permissions)
- PHP 7.3+ compatible (no match() or other PHP 8 features)
