/* global Line Values page requestAnimationFrame */
// 12539

const drawing = {

  // Needed for the menu and drawing frame to work
  menuSet: false,
  frame: 0,
  saveFrames: false,
  frameSkipper: 0,
  triggerSaveFrames: false,
  savedFrames: [],
  forcedFirstFrame: false,
  drawSingleFrame: true,
  // You can set this to true to use autoRedraw and false to not
  useAutoRedraw: false,
  design: null,

  // Helper functions for drawing shapes
  drawSquare: (ctx, corners, fillStyle) => {
    ctx.fillStyle = fillStyle
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
    ctx.lineTo(corners.topRight.x, corners.topRight.y)
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
    ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    ctx.lineTo(corners.topLeft.x, corners.topLeft.y)
    ctx.fill()
  },

  drawVerticalSplit: (ctx, corners, middle, borderMarginSize, fillStyle) => {
    // Left half
    ctx.fillStyle = fillStyle
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
    ctx.lineTo(middle.x - borderMarginSize, corners.topLeft.y)
    ctx.lineTo(middle.x - borderMarginSize, corners.bottomLeft.y)
    ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    ctx.lineTo(corners.topLeft.x, corners.topLeft.y)
    ctx.fill()

    // Right half
    ctx.beginPath()
    ctx.moveTo(middle.x + borderMarginSize, corners.topRight.y)
    ctx.lineTo(corners.topRight.x, corners.topRight.y)
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
    ctx.lineTo(middle.x + borderMarginSize, corners.bottomRight.y)
    ctx.lineTo(middle.x + borderMarginSize, corners.topRight.y)
    ctx.fill()
  },

  drawHorizontalSplit: (ctx, corners, middle, borderMarginSize, fillStyle) => {
    // Top half
    ctx.fillStyle = fillStyle
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
    ctx.lineTo(corners.topRight.x, corners.topRight.y)
    ctx.lineTo(corners.topRight.x, middle.y - borderMarginSize)
    ctx.lineTo(corners.topLeft.x, middle.y - borderMarginSize)
    ctx.lineTo(corners.topLeft.x, corners.topLeft.y)
    ctx.fill()

    // Bottom half
    ctx.beginPath()
    ctx.moveTo(corners.bottomLeft.x, middle.y + borderMarginSize)
    ctx.lineTo(corners.bottomRight.x, middle.y + borderMarginSize)
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
    ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    ctx.lineTo(corners.bottomLeft.x, middle.y + borderMarginSize)
    ctx.fill()
  },

  drawVerticalPills: (ctx, corners, middle, borderMarginSize, pillRadius, fillStyle) => {
    // Left pill
    ctx.fillStyle = fillStyle
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x, corners.topLeft.y + pillRadius)
    ctx.arc(corners.topLeft.x + pillRadius, corners.topLeft.y + pillRadius, pillRadius, Math.PI, 0, false)
    ctx.lineTo(middle.x - borderMarginSize, corners.bottomLeft.y - pillRadius)
    ctx.arc(middle.x - borderMarginSize - pillRadius, corners.bottomLeft.y - pillRadius, pillRadius, 0, Math.PI)
    ctx.closePath()
    ctx.fill()

    // Right pill
    ctx.beginPath()
    ctx.moveTo(middle.x + borderMarginSize, corners.topRight.y + pillRadius)
    ctx.arc(middle.x + borderMarginSize + pillRadius, corners.topRight.y + pillRadius, pillRadius, Math.PI, 0, false)
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y - pillRadius)
    ctx.arc(corners.bottomRight.x - pillRadius, corners.bottomRight.y - pillRadius, pillRadius, 0, Math.PI)
    ctx.closePath()
    ctx.fill()
  },

  drawHorizontalPills: (ctx, corners, middle, borderMarginSize, pillRadius, fillStyle) => {
    // Top pill
    ctx.fillStyle = fillStyle
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x + pillRadius, corners.topLeft.y)
    ctx.lineTo(corners.topRight.x - pillRadius, corners.topLeft.y)
    ctx.arc(corners.topRight.x - pillRadius, corners.topRight.y + pillRadius, pillRadius, Math.PI * 1.5, Math.PI * 0.5, false)
    ctx.lineTo(corners.bottomLeft.x + pillRadius, middle.y - borderMarginSize)
    ctx.arc(corners.bottomLeft.x + pillRadius, middle.y - borderMarginSize - pillRadius, pillRadius, Math.PI * 0.5, Math.PI * 1.5, false)
    ctx.fill()

    // Bottom pill
    ctx.beginPath()
    ctx.moveTo(corners.topLeft.x + pillRadius, middle.y + borderMarginSize)
    ctx.lineTo(corners.topRight.x - pillRadius, middle.y + borderMarginSize)
    ctx.arc(corners.topRight.x - pillRadius, middle.y + borderMarginSize + pillRadius, pillRadius, Math.PI * 1.5, Math.PI * 0.5, false)
    ctx.lineTo(corners.bottomLeft.x + pillRadius, corners.bottomLeft.y)
    ctx.arc(corners.bottomLeft.x + pillRadius, corners.bottomLeft.y - pillRadius, pillRadius, Math.PI * 0.5, Math.PI * 1.5, false)
    ctx.closePath()
    ctx.fill()
  },

  getRandomFillStyle: (opacities, gradients, v) => {
    if (Math.random() < v.gradienty) {
      return gradients[Math.floor(Math.random() * gradients.length)]
    }
    return `rgba(0, 0, 0, ${opacities[Math.floor(Math.random() * opacities.length)]})`
  },

  buildLines: async () => {
    //  If we are saving frames, then we need to skip a bunch of renders
    //  to give us time to download the frames
    if (drawing.saveFrames && drawing.frameSkipper < 100) {
      drawing.frameSkipper++
      return
    }
    //  Once we have skipped enough frames we can reset it
    drawing.frameSkipper = 0

    // //////////////////////////////////////////////////////
    //  Start redraw
    //  Set all the menu stuff one time
    if (drawing.menuSet === false) {
      drawing.setMenu()
    }

    if (drawing.useAutoRedraw === false && drawing.forcedFirstFrame === false) {
      drawing.forcedFirstFrame = true
      // Schedule the next call to buildLines after 100ms
      setTimeout(() => {
        v.redraw()
      }, 100)
    }

    //  Only draw if autoRedraw is on, or we've been told to draw a single frame
    if (drawing.values.autoRedraw === false && drawing.drawSingleFrame === false) return
    drawing.drawSingleFrame = false
    //  End of auto redraw
    // //////////////////////////////////////////////////////

    //  Shortcut to the values
    const v = drawing.values

    //  Update the frame count
    drawing.frame++
    if (drawing.frame >= v.maxFrames) {
      drawing.frame = 0
      if (drawing.triggerSaveFrames) {
        drawing.saveFrames = true
        drawing.triggerSaveFrames = false
      } else {
        drawing.saveFrames = false
      }
    }

    // *****************************************************
    // *****************************************************
    // *****************************************************
    //
    //  Below is where we put our own custom drawing code
    //

    //  Calculates tile size
    const tilesAcross = v.tilesAcross
    const tileSize = (page.size[0] - (v.sideMargin * 2)) / tilesAcross
    const tilesDown = Math.floor((page.size[1] - (v.topBottomMargin * 2)) / tileSize)
    const topOffset = ((page.size[1] - (v.topBottomMargin * 2)) - (tilesDown * tileSize)) / 2

    // We are now going to make a grid, which is the tileSize / 4
    const gridSize = tileSize / 4
    const gridHolder = {}
    for (let y = 0; y < tilesDown * 4; y++) {
      for (let x = 0; x < tilesAcross * 4; x++) {
        gridHolder[`${x},${y}`] = {
          indexX: x,
          indexY: y,
          x: x * gridSize + v.sideMargin,
          y: y * gridSize + v.topBottomMargin + topOffset,
          topLeft: {
            x: x * gridSize + v.sideMargin,
            y: y * gridSize + v.topBottomMargin + topOffset
          },
          topRight: {
            x: (x + 1) * gridSize + v.sideMargin,
            y: y * gridSize + v.topBottomMargin + topOffset
          },
          bottomLeft: {
            x: x * gridSize + v.sideMargin,
            y: (y + 1) * gridSize + v.topBottomMargin + topOffset
          },
          bottomRight: {
            x: (x + 1) * gridSize + v.sideMargin,
            y: (y + 1) * gridSize + v.topBottomMargin + topOffset
          },
          level: 1,
          angle: Math.floor(Math.random() * 4) * 90
        }
      }
    }

    const totalTiles = tilesAcross * 4 * tilesDown * 4

    // We we want to see if we can do the same, but grouping 16 level 1 cells into a level 3 cell, so we need a good
    // way to check if there are 16 level 1 cells in a 4x4 area, where the random cell is the top left
    // We're going to do this in a while loop
    const groupCells = (gridHolder, totalTiles, span, checkLevel, targetLevel, targetTries, targetCellsMade) => {
      let loopTries = 0
      let newCellsMade = 0
      while (loopTries < targetTries && newCellsMade < targetCellsMade) {
        loopTries++
        // Pick a random cell
        const randomCellItem = Object.entries(gridHolder)[Math.floor(Math.random() * Object.entries(gridHolder).length)]
        const randomCell = randomCellItem[1]
        // Check if it's on the first level
        if (checkLevel.includes(randomCell.level)) {
          let allOtherCellsAreValid = true
          for (let y = 0; y < span; y++) {
            for (let x = 0; x < span; x++) {
              if (!gridHolder[`${randomCell.indexX + x},${randomCell.indexY + y}`] ||
                !checkLevel.includes(gridHolder[`${randomCell.indexX + x},${randomCell.indexY + y}`].level)) {
                allOtherCellsAreValid = false
              }
            }
          }
          if (allOtherCellsAreValid) {
            randomCell.level = targetLevel
            randomCell.topRight.x = gridHolder[`${randomCell.indexX + span - 1},${randomCell.indexY}`].topRight.x
            randomCell.bottomRight.x = gridHolder[`${randomCell.indexX + span - 1},${randomCell.indexY}`].bottomRight.x
            randomCell.bottomRight.y = gridHolder[`${randomCell.indexX},${randomCell.indexY + span - 1}`].bottomRight.y
            randomCell.bottomLeft.y = gridHolder[`${randomCell.indexX},${randomCell.indexY + span - 1}`].bottomLeft.y
            // Delete the other 15 cells
            for (let y = 0; y < span; y++) {
              for (let x = 0; x < span; x++) {
                if (!(x === 0 && y === 0)) {
                  delete gridHolder[`${randomCell.indexX + x},${randomCell.indexY + y}`]
                }
              }
            }
            newCellsMade++
          }
        }
      }
    }

    if (v.super) groupCells(gridHolder, totalTiles, 8, [1], 4, 100, (totalTiles / (64 * 4)) * v.superModAdjuster)
    groupCells(gridHolder, totalTiles, 4, [1], 3, 100, (totalTiles / (16 * 4)) * v.mediumModAdjuster)
    groupCells(gridHolder, totalTiles, 2, [1], 2, 100, (totalTiles / (4)) * v.normalModAdjuster)
    if (v.deleteCells) groupCells(gridHolder, totalTiles, 1, [1, 2, 3, 4], null, 500, (totalTiles / (4)) * v.deleteModAdjuster)
    const allLines = []
    const layers = v.layers - 1

    //  Make the layers needed for allLines
    for (let l = 0; l <= layers; l++) {
      allLines.push([])
    }

    page.clear() //  Clear the page

    const layouts = page.layouts[v.layout].across * page.layouts[v.layout].down

    //  Start the loop of drawing the things
    for (let layout = 0; layout < layouts; layout++) {
      if (page.layouts[v.layout].skipOdd && (layout === 0 || layout === 1 || layout === 4 || layout === 5)) continue
      if (page.layouts[v.layout].skipEven && (layout === 2 || layout === 3 || layout === 6 || layout === 7)) continue

      drawing.design = []
      for (let l = 0; l <= layers; l++) {
        drawing.design.push([])

        // Loop through the grid object
        for (const [, cell] of Object.entries(gridHolder)) {
          const newLines = []
          if (v.showSquares && cell.level !== null) {
            const squareLine = new Line()
            squareLine.addPoint(cell.topLeft.x + (v.squareBorder / 10), cell.topLeft.y + (v.squareBorder / 10))
            squareLine.addPoint(cell.topRight.x - (v.squareBorder / 10), cell.topRight.y + (v.squareBorder / 10))
            squareLine.addPoint(cell.bottomRight.x - (v.squareBorder / 10), cell.bottomRight.y - (v.squareBorder / 10))
            squareLine.addPoint(cell.bottomLeft.x + (v.squareBorder / 10), cell.bottomLeft.y - (v.squareBorder / 10))
            squareLine.addPoint(cell.topLeft.x + (v.squareBorder / 10), cell.topLeft.y + (v.squareBorder / 10))
            drawing.design[l] = [...drawing.design[l], squareLine]
          }

          drawing.design[l] = [...drawing.design[l], ...newLines]
        }
      }

      //
      //  This probable counts as the end of our custom code.
      //  Everything after this just copy and paste into all
      //  of the next code
      //
      // *****************************************************
      // *****************************************************
      // *****************************************************

      //  Make the margins
      const {
        culler,
        RoD,
        CoD,
        CoD2,
        ticks
      } = page.makeCroppers(v)

      // Subtract 0.1 from the x value of points 0, 3 and 4 in the culler
      culler.points[0].x -= 0.05
      culler.points[3].x -= 0.05
      culler.points[4].x -= 0.05

      for (let layerIndex = 0; layerIndex <= layers; layerIndex++) {
        // Remove everything outside of the margins for this layer
        v.cropToMargin = false
        let layerDrawLines = page.doAllExperimentalAndCulling(drawing.design[layerIndex], v, culler, RoD, CoD, CoD2)

        // Apply layout for this layer
        const newCulls = page.doAllCropAndLayout(layout[layerIndex], v.layout, v.squarify, culler, RoD, CoD, CoD2, ticks)
        let layerCuller = newCulls.culler
        let layerRoD = newCulls.RoD
        let layerCoD = newCulls.CoD
        let layerCoD2 = newCulls.CoD2
        let layerTicks = newCulls.ticks

        layerDrawLines = page.doLayout(layerDrawLines, layout, v.layout, v.squarify)

        // Final scale for this layer
        if (v.finalScale !== 1) {
          layerCuller = page.doCornerScale(layerCuller, v.finalScale)
          layerRoD = page.doCornerScale(layerRoD, v.finalScale)
          layerCoD = page.doCornerScale(layerCoD, v.finalScale)
          layerCoD2 = page.doCornerScale(layerCoD2, v.finalScale)
          layerTicks = page.doCornerScale(layerTicks, v.finalScale)
          layerDrawLines = page.doCornerScale(layerDrawLines, v.finalScale)
        }

        // Draw the layer
        if (layerIndex === 0) {
          // Draw the margin and other elements for the first layer
          /*
          page.draw(layerCuller, '#FFCCCC', 'margin')
          if (v.useRoD) page.draw(layerRoD, '#CCFFCC', 'margin')
          if (v.useCoD) page.draw(layerCoD, '#CCFFFF', 'circleOfDoom')
          if (v.useCoD2) page.draw(layerCoD2, '#CCCCFF', 'circleOfDoom2')
          if (v.drawTicks) page.draw(layerTicks, '#FF0000', 'ticks')

          if (v.drawMargin) layerDrawLines = [...layerDrawLines, ...layerCuller]
          if (v.drawRoD) layerDrawLines = [...layerDrawLines, ...layerRoD]
          if (v.drawCoD) layerDrawLines = [...layerDrawLines, ...layerCoD]
          if (v.drawCoD2) layerDrawLines = [...layerDrawLines, ...layerCoD2]
          if (v.drawTicks) layerDrawLines = [...layerDrawLines, ...layerTicks]
          */
        }

        // page.draw(layerDrawLines, page.colourBlindPalette[layerIndex], 'spiral')
        const canvas = document.getElementById('page')
        const ctx = canvas.getContext('2d')
        layerDrawLines.forEach((line) => {
          const corners = {
            topLeft: {
              x: line.points[0].x * 0.393701 * page.dpi,
              y: line.points[0].y * 0.393701 * page.dpi
            },
            topRight: {
              x: line.points[1].x * 0.393701 * page.dpi,
              y: line.points[1].y * 0.393701 * page.dpi
            },
            bottomRight: {
              x: line.points[2].x * 0.393701 * page.dpi,
              y: line.points[2].y * 0.393701 * page.dpi
            },
            bottomLeft: {
              x: line.points[3].x * 0.393701 * page.dpi,
              y: line.points[3].y * 0.393701 * page.dpi
            }
          }
          const middle = {
            x: corners.topLeft.x + (corners.topRight.x - corners.topLeft.x) / 2,
            y: corners.topLeft.y + (corners.bottomLeft.y - corners.topLeft.y) / 2
          }
          const middleDownPercent = middle.y / (page.size[1] * 0.393701 * page.dpi)
          const outerRadius = (corners.topRight.x - corners.topLeft.x) / 2
          const innerRadius = outerRadius * 0.9
          const innerHalfRadius = outerRadius * 0.5

          // Lets make a top down gradient, the size of the square
          const gradientTopDown = ctx.createLinearGradient(corners.topLeft.x, corners.topLeft.y, corners.bottomLeft.x, corners.bottomLeft.y)
          gradientTopDown.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
          gradientTopDown.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
          const gradientLeftRight = ctx.createLinearGradient(corners.topLeft.x, corners.topLeft.y, corners.topRight.x, corners.topRight.y)
          gradientLeftRight.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
          gradientLeftRight.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
          const gradientBottomUp = ctx.createLinearGradient(corners.bottomLeft.x, corners.bottomLeft.y, corners.bottomRight.x, corners.bottomRight.y)
          gradientBottomUp.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
          gradientBottomUp.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
          const gradientRightLeft = ctx.createLinearGradient(corners.topRight.x, corners.topRight.y, corners.bottomRight.x, corners.bottomRight.y)
          gradientRightLeft.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
          gradientRightLeft.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
          const gradients = [gradientTopDown, gradientLeftRight, gradientBottomUp, gradientRightLeft]

          const opacities = [0.1, 0.2, 0.5, 0.8, 1, 0.2, 0.5, 0.8, 0.5]
          const borderMarginSize = v.squareBorder / 10 * 0.393701 * page.dpi

          if (Math.random() < middleDownPercent * 1.5 || !v.fadeDown) {
            if (Math.random() > v.squareOrCircle) {
              // Do the square based design
              const fillStyle = drawing.getRandomFillStyle(opacities, gradients, v)

              if (v.complicated && Math.random() < 0.2) {
                // Choose randomly between rectangles and pills
                if (Math.random() < 0.8) {
                  // Normal square
                  if (Math.random() < 0.5) {
                    drawing.drawVerticalSplit(ctx, corners, middle, borderMarginSize, fillStyle)
                  } else {
                    drawing.drawHorizontalSplit(ctx, corners, middle, borderMarginSize, fillStyle)
                  }
                } else {
                  // Pills where the end is rounded
                  const pillRadius = ((middle.x - borderMarginSize) - corners.topLeft.x) / 2
                  if (Math.random() < 0.5) {
                    drawing.drawVerticalPills(ctx, corners, middle, borderMarginSize, pillRadius, fillStyle)
                  } else {
                    drawing.drawHorizontalPills(ctx, corners, middle, borderMarginSize, pillRadius, fillStyle)
                  }
                }
              } else {
                drawing.drawSquare(ctx, corners, fillStyle)
              }
            } else {
              // Perhaps we are inverting the circle
              if (Math.random() < v.invertAndStuff) {
                // Inverted

                const doAGradient = Math.random() < v.gradienty
                let firstGradientIndex = null
                let oppositeGradientIndex = null
                if (doAGradient) {
                  firstGradientIndex = Math.floor(Math.random() * gradients.length)
                  if (firstGradientIndex === 0) oppositeGradientIndex = 2
                  if (firstGradientIndex === 1) oppositeGradientIndex = 3
                  if (firstGradientIndex === 2) oppositeGradientIndex = 0
                  if (firstGradientIndex === 3) oppositeGradientIndex = 1
                }
                // Draw the square first
                ctx.fillStyle = `rgba(0, 0, 0, ${opacities[Math.floor(Math.random() * opacities.length)]})`
                if (doAGradient) {
                  ctx.fillStyle = gradients[firstGradientIndex]
                }
                ctx.beginPath()
                ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
                ctx.lineTo(corners.topRight.x, corners.topRight.y)
                ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
                ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
                ctx.lineTo(corners.topLeft.x, corners.topLeft.y)
                ctx.fill()
                // Now draw the circle
                let thisRadius = innerRadius
                if (Math.random() < 0.2) {
                  thisRadius = innerHalfRadius
                }
                ctx.fillStyle = 'rgba(255, 255, 255, 1)'
                ctx.beginPath()
                ctx.arc(middle.x, middle.y, thisRadius, 0, 2 * Math.PI)
                ctx.fill()
                if (doAGradient) {
                  ctx.fillStyle = gradients[oppositeGradientIndex]
                  ctx.beginPath()
                  ctx.arc(middle.x, middle.y, thisRadius, 0, 2 * Math.PI)
                  ctx.fill()
                }
              } else {
                // Draw a normal circle
                // Now draw the circle
                let thisRadius = outerRadius
                if (Math.random() < 0.1) {
                  thisRadius = innerHalfRadius
                }
                ctx.fillStyle = `rgba(0, 0, 0, ${opacities[Math.floor(Math.random() * opacities.length)]})`
                if (Math.random() < v.gradienty) {
                  ctx.fillStyle = gradients[Math.floor(Math.random() * gradients.length)]
                }
                if (Math.random() < 0.1 && v.complicated) {
                  if (Math.random() < 0.3 && v.veryComplicated) {
                    if (Math.random() < 0.8) {
                      if (Math.random() < 0.5) {
                        ctx.beginPath()
                        ctx.arc(corners.topLeft.x, middle.y, thisRadius, Math.PI * 1.5, Math.PI * 0.5)
                        ctx.fill()
                        ctx.beginPath()
                        ctx.arc(corners.topRight.x, middle.y, thisRadius, Math.PI * 0.5, Math.PI * 1.5)
                        ctx.fill()
                      } else {
                        ctx.beginPath()
                        ctx.arc(middle.x, corners.topLeft.y, thisRadius, Math.PI * 0, Math.PI * 1)
                        ctx.fill()
                        ctx.beginPath()
                        ctx.arc(middle.x, corners.bottomRight.y, thisRadius, Math.PI * 1, Math.PI * 2)
                        ctx.fill()
                      }
                    } else {
                      thisRadius = outerRadius
                      ctx.beginPath()
                      ctx.arc(corners.topLeft.x, middle.y, thisRadius, Math.PI * 1.5, Math.PI * 0.5)
                      ctx.arc(middle.x, corners.bottomRight.y, thisRadius, Math.PI * 1, Math.PI * 2)
                      ctx.arc(corners.topRight.x, middle.y, thisRadius, Math.PI * 0.5, Math.PI * 1.5)
                      ctx.arc(middle.x, corners.topLeft.y, thisRadius, Math.PI * 0, Math.PI * 1)
                      ctx.fill()
                    }
                  } else {
                    ctx.beginPath()
                    ctx.arc(middle.x, middle.y, thisRadius, 0, 2 * Math.PI)
                    ctx.fill()
                    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
                    ctx.beginPath()
                    if (Math.random() < 0.5) {
                      ctx.moveTo(middle.x - borderMarginSize, corners.topLeft.y)
                      ctx.lineTo(middle.x + borderMarginSize, corners.topLeft.y)
                      ctx.lineTo(middle.x + borderMarginSize, corners.bottomLeft.y)
                      ctx.lineTo(middle.x - borderMarginSize, corners.bottomLeft.y)
                      ctx.lineTo(middle.x - borderMarginSize, corners.topLeft.y)
                    } else {
                      // Go the other way
                      ctx.moveTo(corners.topLeft.x, middle.y - borderMarginSize)
                      ctx.lineTo(corners.topRight.x, middle.y - borderMarginSize)
                      ctx.lineTo(corners.topRight.x, middle.y + borderMarginSize)
                      ctx.lineTo(corners.topLeft.x, middle.y + borderMarginSize)
                      ctx.lineTo(corners.topLeft.x, middle.y - borderMarginSize)
                    }
                    ctx.fill()
                  }
                } else {
                  ctx.beginPath()
                  ctx.arc(middle.x, middle.y, thisRadius, 0, 2 * Math.PI)
                  ctx.fill()
                }
              }
            }
          }
        })

        // Add the layer's lines to allLines
        layerDrawLines.forEach((line) => {
          allLines[layerIndex].push(line)
        })
      }
    }

    //  Set the filename
    let id = null
    let filename = null
    const basename = `subdivisions-01-${new Date().toISOString().slice(0, 19).replace(/[T]/g, '-').replace(/[:]/g, '-')}`
    let strokeWidth = 1
    if (drawing.saveFrames) strokeWidth = 3
    page.clearPrintStore()
    if (v.layers === 1) {
      id = basename
      filename = basename
      if (drawing.saveFrames) filename = `${filename}_${String(drawing.frame).padStart(3, '0')}`
      page.report(allLines[0])
      page.wrapSVG([page.svg(allLines[0], id, strokeWidth)], id, filename, drawing.values) // Do shenanigans to make sure we can save the SVG
    } else {
      let reportAllLines = []
      for (let l = 0; l <= layers; l++) {
        id = `${basename}_layer${l.toString().padStart(2, '0')}`
        filename = `${basename}_layer${l.toString().padStart(2, '0')}`
        if (drawing.saveFrames) filename = `${filename}_${String(drawing.frame).padStart(3, '0')}`
        reportAllLines = [...reportAllLines, ...allLines[l]]
        page.wrapSVG([page.svg(allLines[l], id, strokeWidth)], id, filename, drawing.values) // Do shenanigans to make sure we can save the SVG
      }
      page.report(reportAllLines)
    }

    if (drawing.saveFrames) {
      drawing.savedFrames.push(drawing.frame)
      page.printAll()
    }
    //
    //  End of our custom code
    //
    // *****************************************************
    // *****************************************************
    // *****************************************************
  },

  setMenu: () => {
    drawing.menuSet = true // Only set the menu stuff once

    //  Here are the default values
    let valuesObj = {
      tilesAcross: 4,
      layers: 1,
      super: false,
      superModAdjuster: 0.5,
      mediumModAdjuster: 1,
      normalModAdjuster: 1,
      showSquares: true,
      deleteCells: false,
      deleteModAdjuster: 0.5,
      squareBorder: 2,
      squareOrCircle: 0.5,
      invertAndStuff: 0.1,
      gradienty: 0.1,
      fadeDown: false,
      complicated: false,
      veryComplicated: false
    }

    valuesObj = page.addStandardValues(valuesObj, drawing.useAutoRedraw)
    drawing.values = new Values(valuesObj)

    const updatePageSize = () => {
      page.size = [drawing.values.pageWidth, drawing.values.pageHeight]
      page.setPageSize(page.size)
      page.resize()
      updateUrl()
    }
    const updateUrl = () => {
      drawing.values.urlValues()
    }

    let newGuiUpdaters = page.guiAddPreCustom(updateUrl, updatePageSize)
    let gui = newGuiUpdaters.gui
    let updaters = newGuiUpdaters.updaters

    const custom = gui.addFolder('Custom')
    custom.add(drawing.values, 'tilesAcross').min(1).max(16).step(1).onFinishChange(updateUrl)
    custom.add(drawing.values, 'layers').min(1).max(1).step(1).onFinishChange(updateUrl)
    custom.add(drawing.values, 'super').onFinishChange(updateUrl)
    custom.add(drawing.values, 'superModAdjuster').min(0).max(2).step(0.1).onFinishChange(updateUrl)
    custom.add(drawing.values, 'mediumModAdjuster').min(0).max(2).step(0.1).onFinishChange(updateUrl)
    custom.add(drawing.values, 'normalModAdjuster').min(0).max(2).step(0.1).onFinishChange(updateUrl)
    custom.add(drawing.values, 'showSquares').onFinishChange(updateUrl)
    custom.add(drawing.values, 'deleteCells').onFinishChange(updateUrl)
    custom.add(drawing.values, 'deleteModAdjuster').min(0).max(1).step(0.05).onFinishChange(updateUrl)
    custom.add(drawing.values, 'squareBorder').min(0).max(10).step(0.05).onFinishChange(updateUrl)
    custom.add(drawing.values, 'squareOrCircle').min(0).max(1).step(0.05).onFinishChange(updateUrl)
    custom.add(drawing.values, 'invertAndStuff').min(0).max(1).step(0.05).onFinishChange(updateUrl)
    custom.add(drawing.values, 'gradienty').min(0).max(1).step(0.05).onFinishChange(updateUrl)
    custom.add(drawing.values, 'fadeDown').onFinishChange(updateUrl)
    custom.add(drawing.values, 'complicated').onFinishChange(updateUrl)
    custom.add(drawing.values, 'veryComplicated').onFinishChange(updateUrl)
    custom.open()

    newGuiUpdaters = page.guiAddPostCustom(gui, updaters, updateUrl, drawing.useAutoRedraw)
    gui = newGuiUpdaters.gui
    updaters = newGuiUpdaters.updaters

    gui.add(drawing.values, 'save_SVG')
    drawing.update()

    //  Fire off an redraw when one of the controls we've marked as an updater is changed
    updaters.forEach((control) => {
      control.onFinishChange((value) => {
        updateUrl()
        page.clear()
        drawing.drawSingleFrame = true
        drawing.buildLines()
      })
    })

    updatePageSize()
    drawing.gui = gui
    /* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */
  },

  /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
  //  Draw the lines (autoRedraw is checked in the buildLines function)
  update: () => {
    requestAnimationFrame(drawing.update)
    drawing.buildLines()
  }
  /* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */
}

const saveOutput = async () => {
  await drawing.values.redraw()
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 1000))
  // Now save the canvas to a base64 string
  const canvas = document.getElementById('page')
  const base64 = canvas.toDataURL('image/png')
  const base64Data = base64.split(',')[1]
  const binaryData = atob(base64Data)
  const uint8Array = new Uint8Array(binaryData.length)
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i)
  }
  const blob = new Blob([uint8Array], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const basename = `subdivisions-01-${new Date().toISOString().slice(0, 19).replace(/[T]/g, '-').replace(/[:]/g, '-')}`
  a.download = `${basename}.png`
  a.click()
  URL.revokeObjectURL(url)
}

/* eslint-disable */
const save64Outputs = async () => {
  for (let i = 0; i < 64; i++) {
    await saveOutput()
  }
}
