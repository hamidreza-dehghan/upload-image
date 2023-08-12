// Import required modules
const path = require('path')
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const sharp = require('sharp')

// Set storage engine for uploaded files
const storage = multer.diskStorage({
	destination: './uploads',
	filename: function (req, file, cb) {
		cb(
			null,
			file.fieldname + '-' + Date.now() + path.extname(file.originalname)
		)
	},
})

// Initialize upload variable
const upload = multer({
	storage: storage,
	limits: { fileSize: 1000000 }, // 1MB file size limit
}).single('myImage')

// Initialize Express app
const app = express()

// Set the view engine to EJS
app.set('view engine', 'ejs')

// Set up routes
app.get('/', (req, res) => {
	res.render('index')
})

app.post('/upload', (req, res) => {
	upload(req, res, async (err) => {
		if (err) {
			res.send('Error uploading file.')
		} else {
			if (req.file == undefined) {
				res.send('No file selected.')
			} else {
				const imagePath = path.join(
					__dirname,
					'uploads',
					req.file.filename
				)
				const resizedImagePath = path.join(
					__dirname,
					'uploads',
					'resized-' + req.file.filename
				)

				// Get the original image dimensions
				const imageInfo = await sharp(imagePath).metadata()
				const originalWidth = imageInfo.width
				const originalHeight = imageInfo.height

				// Calculate the new dimensions based on the original aspect ratio
				let newWidth, newHeight
				if (originalWidth > originalHeight) {
					newWidth = 500
					newHeight = Math.floor(
						(originalHeight / originalWidth) * newWidth
					)
				} else {
					newHeight = 300
					newWidth = Math.floor(
						(originalWidth / originalHeight) * newHeight
					)
				}

				// Resize the image
				await sharp(imagePath)
					.resize(newWidth, newHeight)
					.toFile(resizedImagePath)

				// Remove the original image
				fs.unlink(imagePath, (err) => {
					if (err) {
						console.error('Error deleting original image:', err)
					}
				})

				const imageUrl = '/uploads/resized-' + req.file.filename
				const deleteUrl = '/delete/resized-' + req.file.filename

				res.render('upload', { imageUrl, deleteUrl })
			}
		}
	})
})

app.get('/delete/:filename', (req, res) => {
	const filePath = path.join(__dirname, 'uploads', req.params.filename)
	fs.unlink(filePath, (err) => {
		if (err) {
			res.send('Error deleting file.')
		} else {
			res.send('File deleted successfully!')
		}
	})
})

app.get('/uploads/:filename', (req, res) => {
	res.sendFile(__dirname + '/uploads/' + req.params.filename)
})

app.listen(3000, () => {
	console.log('Server started on port 3000')
})
