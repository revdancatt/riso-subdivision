import fs from 'fs'
import path from 'path'
import { Canvas, loadImage } from 'skia-canvas'
import inks from '../inks.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const main = async () => {
  const inputFiles = fs.readdirSync(path.join(__dirname, 'inputs')).filter(file => file.endsWith('.png'))
  const outputFile = path.join(__dirname, 'outputs')
  // If the output file doesn't exist, create it
  if (!fs.existsSync(outputFile)) {
    fs.mkdirSync(outputFile)
  }
  // We need to pick two different files to merge
  const firstFile = inputFiles[Math.floor(Math.random() * inputFiles.length)]
  let secondFile = inputFiles[Math.floor(Math.random() * inputFiles.length)]
  while (secondFile === firstFile) {
    secondFile = inputFiles[Math.floor(Math.random() * inputFiles.length)]
  }

  const firstImage = await loadImage(path.join(__dirname, 'inputs', firstFile))
  const secondImage = await loadImage(path.join(__dirname, 'inputs', secondFile))
  const canvas = new Canvas(firstImage.width, firstImage.height)
  const ctx = canvas.getContext('2d')

  // Now pick two inks
  let firstInk = inks[Math.floor(Math.random() * inks.length)]
  while (firstInk.name === 'White' || firstInk.name === '06 Black') {
    firstInk = inks[Math.floor(Math.random() * inks.length)]
  }

  let secondInk = inks[Math.floor(Math.random() * inks.length)]
  // If the first ink is the same as the second ink, pick a different one
  while (firstInk.name === secondInk.name || secondInk.name === 'White' || secondInk.name === '06 Black') {
    secondInk = inks[Math.floor(Math.random() * inks.length)]
  }

  // If alphabetically the name of the first ink is after the name of the second ink, swap them
  if (firstInk.name > secondInk.name) {
    const temp = firstInk
    firstInk = secondInk
    secondInk = temp
  }

  // Main Output Folder =
  const mainOutputPath = path.join(outputFile, `${firstInk.name} - ${secondInk.name}`)
  // If the folder doesn't exist, create it
  if (!fs.existsSync(mainOutputPath)) {
    fs.mkdirSync(mainOutputPath)
  }
  // Count how many directories are in the main output path
  const dirCount = fs.readdirSync(mainOutputPath).filter(file => fs.statSync(path.join(mainOutputPath, file)).isDirectory()).length
  const newDirectory = path.join(mainOutputPath, `${dirCount.toString().padStart(4, '0')} - ${firstInk.name} + ${secondInk.name}`)
  // Create the numbered subdirectory if it doesn't exist
  if (!fs.existsSync(newDirectory)) {
    fs.mkdirSync(newDirectory)
  }
  // Now save the image
  const filenameDate = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outputPath = path.join(newDirectory, `${filenameDate}.png`)

  const thumbFilenameOne = `${firstInk.name} + ${secondInk.name} - ${dirCount.toString().padStart(4, '0')} - thumb.png`
  const thumbFilenameTwo = `${secondInk.name} + ${firstInk.name} - ${dirCount.toString().padStart(4, '0')} - thumb.png`
  const thumbFolder = path.join(__dirname, 'thumbnails')
  if (!fs.existsSync(thumbFolder)) {
    fs.mkdirSync(thumbFolder)
  }
  const thumbPathOne = path.join(thumbFolder, thumbFilenameOne)
  const thumbPathTwo = path.join(thumbFolder, thumbFilenameTwo)

  const firstImageCanvas = new Canvas(firstImage.width, firstImage.height)
  const firstImageCtx = firstImageCanvas.getContext('2d')
  firstImageCtx.drawImage(firstImage, 0, 0)
  const secondImageCanvas = new Canvas(secondImage.width, secondImage.height)
  const secondImageCtx = secondImageCanvas.getContext('2d')
  secondImageCtx.drawImage(secondImage, 0, 0)

  // Sometimes we'll copy the firstImageCanvas over the secondImageCanvas
  if (Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      secondImageCtx.drawImage(firstImageCanvas, 0, 0)
      // Rotate the first image 180 degrees and place it on the second canvas
      secondImageCtx.save()
      // Move to the center of the canvas
      secondImageCtx.translate(secondImage.width / 2, secondImage.height / 2)
      // Rotate 180 degrees
      secondImageCtx.rotate(Math.PI)
      // Draw the image offset by half its width and height to center it
      secondImageCtx.drawImage(firstImageCanvas, -firstImage.width / 2, -firstImage.height / 2)
      secondImageCtx.restore()
    } else {
      if (Math.random() < 0.5) {
        // Flip horizontally
        secondImageCtx.save()
        secondImageCtx.translate(secondImage.width, 0)
        secondImageCtx.scale(-1, 1)
        secondImageCtx.drawImage(firstImageCanvas, 0, 0)
        secondImageCtx.restore()
      } else {
        // Flip vertically
        secondImageCtx.save()
        secondImageCtx.translate(0, secondImage.height)
        secondImageCtx.scale(1, -1)
        secondImageCtx.drawImage(firstImageCanvas, 0, 0)
        secondImageCtx.restore()
      }
    }
  }

  // Save the first image to the new directory
  const firstImageOutputPath = path.join(newDirectory, `${firstInk.name}.png`)
  const firstImageBuffer = await firstImageCanvas.toBuffer('png')
  fs.writeFileSync(firstImageOutputPath, firstImageBuffer)
  // Save the second image to the new directory
  const secondImageOutputPath = path.join(newDirectory, `${secondInk.name}.png`)
  const secondImageBuffer = await secondImageCanvas.toBuffer('png')
  fs.writeFileSync(secondImageOutputPath, secondImageBuffer)

  // The two images are greyscale, but we need to use each one as an alpha mask
  // for the ink colours. The images are already greyscale so we don't need to
  // convert them
  // Make a temporary canvas to draw the first image onto
  const tempCanvas = new Canvas(firstImage.width, firstImage.height)
  const tempCtx = tempCanvas.getContext('2d')

  tempCtx.globalCompositeOperation = 'source-over'
  tempCtx.clearRect(0, 0, firstImage.width, firstImage.height)
  tempCtx.drawImage(firstImageCanvas, 0, 0)
  tempCtx.globalCompositeOperation = 'screen'
  tempCtx.fillStyle = `rgba(${firstInk.r}, ${firstInk.g}, ${firstInk.b}, 1)`
  tempCtx.fillRect(0, 0, firstImage.width, firstImage.height)
  // Draw the second masked image over the first one
  ctx.drawImage(tempCanvas, 0, 0)

  // Clear the temporary canvas
  tempCtx.globalCompositeOperation = 'source-over'
  tempCtx.clearRect(0, 0, firstImage.width, firstImage.height)
  tempCtx.drawImage(secondImageCanvas, 0, 0)
  tempCtx.globalCompositeOperation = 'screen'
  tempCtx.fillStyle = `rgba(${secondInk.r}, ${secondInk.g}, ${secondInk.b}, 1)`
  tempCtx.fillRect(0, 0, firstImage.width, firstImage.height)

  // Draw the second masked image over the first one
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(tempCanvas, 0, 0)

  const buffer = await canvas.toBuffer('png')
  fs.writeFileSync(outputPath, buffer)

  // make a new thumbnail canvas which is 1/4 the size of the original canvas
  const thumbCanvas = new Canvas(canvas.width / 4, canvas.height / 4)
  const thumbCtx = thumbCanvas.getContext('2d')
  thumbCtx.drawImage(canvas, 0, 0, canvas.width / 4, canvas.height / 4)
  const thumbBuffer = await thumbCanvas.toBuffer('png')
  fs.writeFileSync(thumbPathOne, thumbBuffer)
  fs.writeFileSync(thumbPathTwo, thumbBuffer)
}

const run = async () => {
  const total = 1600
  for (let i = 0; i < total; i++) {
    console.log(`Running ${i + 1} of ${total}`)
    await main()
  }
}

run()
