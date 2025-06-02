/* global drawing Line Image noise Blob ClipperLib dat */
// eslint-disable-next-line no-unused-vars

/**
 * ===============================================================================================
 * ===============================================================================================
 * ===============================================================================================
 *
 * NOTE TO THE READER (that's you)
 *
 * This is my own messy code to make SVG files for sending to the AxiDraw without having
 * to deal with Illustrator.
 *
 * This is NOT good code, this is not the "proper" way to write helpful libraries like this
 * but it does what I need it to do in a way that helps me debug easily in the console
 * etc. etc. etc.
 *
 * There is no versioning, no changelogs, no githib repo, the latest version probable lives here.
 *
 * ===============================================================================================
 * ===============================================================================================
 * ===============================================================================================
 */

/**
 * The page object (which you'd expect to be a class but isn't for various dull reasons)
 * controls the display of lines on a canvas, the saving of those lines into svgs
 * and other various bits and bobs
 *
 * Page
 * @namespace
 * @property {object}   PAPER
 * @property {object}   sourceImage
 * @property {function} init
 * @property {function} resize
 * @property {function} scaleX
 * @property {function} scaleY
 * @property {function} cullOutside
 * @property {function} cullInside
 * @property {function} translate
 * @property {function} rotate
 * @property {function} getBoundingBox
 * @property {function} sortPointsClockwise
 * @property {function} makeCircle

 * @property {function} clear
 * @property {function} draw
 * @property {function} rgb2cmyk
 * @property {function} svg
 * @property {function} wrapSVG
 * @property {function} download
 */
const page = {

  /**
   * This is a dict object holding three sizes of paper. The sizes are [width, height]
   * and are measured in cm
   *
   * PAPER
   * @namespace
   * @member {page}
   * @property {Array}  A3 Array of [width, height]
   * @property {Array}  A4 Array of [width, height]
   * @property {Array}  A5 Array of [width, height]
   */
  PAPER: {
    A1: [59.4, 84.1],
    A1SQR: [59.4, 59.4],
    A1BIGSQR: [84.1, 84.1],
    A2: [42.0, 59.4],
    A2SQR: [42.0, 42.0],
    A2BIGSQR: [59.4, 59.4],
    A3: [29.7, 42.0],
    A3SQR: [29.7, 29.7],
    A3BIGSQR: [42.0, 42.0],
    A4: [21.0, 29.7],
    A4SQR: [21.0, 21.0],
    A5: [14.8, 21.0],
    A5SQR: [14.8, 14.8],
    A6: [10.5, 14.8],
    A6SQR: [10.5, 10.5],
    A7: [7.4, 10.5],
    A8: [5.2, 7.4],
    A9: [3.7, 5.2],
    C4: [32.4, 23.1], // C4 Envelope-ish
    C5: [23.2, 16.2], // C5 Envelope-ish
    C6: [16.2, 11.4], // C6 Envelope-ish
    FN: [9, 14], //  Field Notes notebook
    NB1: [15.3, 21.5],
    LT1: [9, 15], // LEUCHTTURM 1917
    TW: [12.8, 21.1], // TWSBI notepad
    PL: [8.9, 10.8], // Polaroid.
    iP6S: [7, 14], // iPhone 6s
    LISQ1: [9.6, 10], // Lino square1
    RM: [15.6, 20.9], // ReMarkable 2
    SC: [8.8, 8.8], // Scratch cards
    IGA: [15, 15], // Ingraving aluminium
    CSMSQR: [4.8, 4.8], // Ingraving copper small square
    CLRGSQR: [10, 10], // Ingraving copper small square
    CSMRECT: [10, 15], // Ingraving copper small square
    MAX: [130, 130] // 1.5m
  },

  /**
   * precision - is used when we do some rounding on floats. We can often end up with two floats
   * like 1.9999999999998 and 2.0000000000001, which are the same for the purposes of plotting pen
   * on paper, but won't pass checks to be === equal. So sometimes we'll round the numbers when we
   * want to check things.
   * @constant {number}
   * @access private
   * */
  precision: 2,

  /**
   * dpi - the dots per inch that we are working with. Used to calculate x,y co-ords to printable dimensions
   * @constant {number}
   * @access private
   */
  dpi: 300,

  /**
   * sourceImage - This can hold the canvas and pixel data for a single image, should we want to
   * do things based on a source image. When we do it gets tucked in here
   * @namespace
   * @member {page}
   * @access public
   * @property {object} canvas  The canvas
   * @property {object} ctx     The context part of the canvas
   * @property {Array} data    The pixel data array
   */
  sourceImage: null,

  /**
   * layouts - holds the data we need to do layouts
   */
  layouts: {
    'one up': {
      across: 1,
      down: 1,
      modLayout: false
    },
    'two up': {
      across: 1,
      down: 2,
      rotated: true,
      scale: 0.7071,
      modLayout: true
    },
    'four up': {
      across: 2,
      down: 2,
      rotated: false,
      scale: 0.5,
      modLayout: true
    },
    'eight up': {
      across: 2,
      down: 4,
      rotated: true,
      scale: 0.3536,
      modLayout: true
    },
    'four card': {
      across: 2,
      down: 4,
      rotated: true,
      scale: 0.3536,
      skipOdd: true,
      skipEven: false,
      modLayout: true
    },
    'nine up': {
      across: 3,
      down: 3,
      scale: 0.3333,
      modLayout: true
    },
    'sixteen up': {
      across: 4,
      down: 4,
      scale: 0.25,
      modLayout: true
    },
    'twentyfive up': {
      across: 5,
      down: 5,
      scale: 0.2,
      modLayout: true
    },
    'thirtytwo up': {
      across: 4,
      down: 8,
      rotated: true,
      scale: 0.1768,
      modLayout: true
    },
    'thirtysix up': {
      across: 6,
      down: 6,
      scale: 0.1666,
      modLayout: true
    },
    'fortynine up': {
      across: 7,
      down: 7,
      scale: 0.1428,
      modLayout: true
    },
    'sixtyfour up': {
      across: 8,
      down: 8,
      scale: 0.1250,
      modLayout: true
    },
    'eightyone up': {
      across: 9,
      down: 9,
      scale: 0.1111,
      modLayout: true
    },
    'hundred up': {
      across: 10,
      down: 10,
      scale: 0.1,
      modLayout: true
    }
  },

  // http://mkweb.bcgsc.ca/colorblind/
  colourBlindPalette: [
    '#000000',
    '#1FC9D4',
    '#F9E27A',
    '#128BF8',
    '#F63565',
    '#0F508E',
    '#98002E',
    '#F8E1B0',
    '#18BBF9',
    '#EDF127',
    '#0F42BC',
    '#F60B08',
    '#0C5B6F'
  ],

  /**
   * printStore - This is where we hold things to be printed
   */
  printStore: {},

  /**
   * Returns a rounded value based on the {@private precision}
   * @access private
   * @param {number}  val The value to be rounded
   * @returns {number} The rounded value
   */
  rounding: (val) => {
    return val
    // return parseFloat(val.toFixed(page.precision))
  },

  /**
   * An init function that sets our page size, adds a canvas object to the
   * document, loads in an image if we need it and runs a callback once finished
   * @param {Array}    size        The size of the page as [width, height] in cm
   * @param {string}   imageToLoad [Optional] The path to the image to load
   * @param {function} callback    [Optional] A callback function to call when the image has been loaded
   */
  init: (size, imageToLoad = null, callback = null) => {
    //  Work out how many pixels wide and high this is going to be, parseFloat(line1.x1.toFixed(precision))
    //  by converting the size (in cm) to inch, and then a dpi of 300 per inch
    page.size = size

    //  Create the canvas
    const canvas = document.createElement('canvas')
    canvas.id = 'page'
    canvas.style.position = 'absolute'
    canvas.style.border = '1px solid'
    //  Add it to the body
    document.getElementsByTagName('body')[0].appendChild(canvas)

    //  Now we need to size it
    page.setPageSize(page.size)
    page.resize()
    window.addEventListener('resize', page.resize)

    //  If we have been given an image to load then we do that here
    if (imageToLoad) {
      const loaderImg = new Image()

      //  Set the onload event so we know when the image has loaded
      loaderImg.onload = (e) => {
        page.sourceImage = {
          canvas: document.createElement('canvas')
        }
        page.sourceImage.ctx = page.sourceImage.canvas.getContext('2d')
        let rotated = false
        let degrees = 0
        if (loaderImg.width > loaderImg.height) rotated = true
        if (rotated) {
          page.sourceImage.canvas.width = loaderImg.height
          page.sourceImage.canvas.height = loaderImg.width
          degrees = -90
        } else {
          page.sourceImage.canvas.width = loaderImg.width
          page.sourceImage.canvas.height = loaderImg.height
        }
        page.sourceImage.ctx.clearRect(0, 0, page.sourceImage.canvas.width, page.sourceImage.canvas.height)
        if (rotated) {
          page.sourceImage.ctx.translate(loaderImg.height / 2, loaderImg.width / 2)
        } else {
          page.sourceImage.ctx.translate(loaderImg.width / 2, loaderImg.height / 2)
        }
        page.sourceImage.ctx.rotate(degrees * Math.PI / 180)
        page.sourceImage.ctx.drawImage(loaderImg, -loaderImg.width / 2, -loaderImg.height / 2)
        page.sourceImage.data = page.sourceImage.ctx.getImageData(0, 0, page.sourceImage.canvas.width, page.sourceImage.canvas.height).data

        //  If there's a callback, then call it
        if (callback) callback()
      }
      loaderImg.src = imageToLoad
    } else {
      //  If there's a callback, then call it
      if (callback) callback()
    }

    //  Set the onclick action on the page sizes links.
    //  Make sure that the 'drawing' code exists, it'll be loaded in
    //  via the 'values.js' code. We use it to construct the current URL
    if (drawing) {
      const pageLinks = document.getElementsByClassName('pageResize')
      if (pageLinks.length) {
        for (const link of pageLinks) {
          link.addEventListener('click', event => {
            if (page.PAPER[event.srcElement.innerText]) {
              page.size = page.PAPER[event.srcElement.innerText]
              page.setPageSize(page.size)
              page.resize()
              drawing.values.urlValues()
              try {
                drawing.gui.__folders.Settings.__controllers.forEach((c) => {
                  c.updateDisplay()
                })
              } catch (er) { }
            }
          })
        }
      }
    }
  },

  /**
   * This sets the size of the page
   * @access public
   */
  setPageSize: (size) => {
    const canvas = document.getElementById('page')
    const width = Math.floor(size[0] * 0.393701 * page.dpi)
    const height = Math.floor(size[1] * 0.393701 * page.dpi)
    if (drawing && drawing.values) {
      drawing.values.pageWidth = size[0]
      drawing.values.pageHeight = size[1]
    }
    canvas.width = width
    canvas.height = height
  },

  /**
   * This resizes the canvas on the browser document so it nicely fits within the view.
   * @access public
   */
  resize: () => {
    const canvas = document.getElementById('page')
    const margin = 60
    const canvasNewHeight = page.rounding(window.innerHeight - (margin * 2))
    canvas.style.top = `${margin}px`
    canvas.style.height = page.rounding(canvasNewHeight)
    canvas.style.width = page.rounding(canvasNewHeight * (canvas.width / canvas.height))
    const leftMargin = page.rounding((window.innerWidth - canvas.getBoundingClientRect().width) / 2)
    canvas.style.left = `${leftMargin}px`

    //  If the leftMargin is less than the allowed margin, then we need to scale the other way
    if (leftMargin < margin) {
      const canvasNewWidth = page.rounding(window.innerWidth - (margin * 2))
      canvas.style.left = `${margin}px`
      canvas.style.width = page.rounding(canvasNewWidth)
      canvas.style.height = page.rounding(canvasNewWidth * (canvas.height / canvas.width))
      const topMargin = page.rounding((window.innerHeight - canvas.getBoundingClientRect().height) / 2)
      canvas.style.top = `${topMargin}px`
    }
  },

  /**
   * Scales a canvas pixel co-ord to a printable dimension.
   * For example, if the canvas is 2400 pixels wide, and the page is 21cm wide
   * and we pass in an x pixel value of 1200 pixels, then the output will
   * be 10.5cm
   * @access private
   * @param {number} x  The pixel x co-ordinate
   * @returns {number} The printable X location on a sheet of paper
   */
  scaleX: (x) => {
    const canvas = document.getElementById('page')
    const newX = page.rounding(x / page.size[0] * canvas.width)
    return newX
  },

  /**
   * Scales a canvas pixel co-ord to a printable dimension.
   * For example, if the canvas is 2400 pixels height, and the page is 21cm height
   * and we pass in an y pixel value of 1200 pixels, then the output will
   * be 10.5cm
   * @access private
   * @param {number} y  The pixel y co-ordinate
   * @returns {number} The printable Y location on a sheet of paper
   */
  scaleY: (y) => {
    const canvas = document.getElementById('page')
    const newY = page.rounding(y / page.size[1] * canvas.height)
    return newY
  },

  /**
   * Clips lines against a culler shape, returning both the lines inside and outside the culler.
   * Uses the Clipper library for precise polygon clipping operations.
   *
   * @param {Line|Line[]} lines - The line(s) to be clipped. Can be a single Line object or an array of Line objects.
   * @param {Line} culler - The Line object representing the clipping shape (usually a closed polygon).
   * @returns {Object} An object containing two properties:
   *   - outside: An array of Line objects representing the portions of the input lines outside the culler.
   *   - inside: An array of Line objects representing the portions of the input lines inside the culler.
   */
  clip: (lines, culler) => {
    // Ensure lines is an array
    if (!Array.isArray(lines)) {
      lines = [lines]
    }
    const scale = 1000000 // Use a large scale for precision
    // Hold the scaled up paths here
    const scaledLines = []

    for (const line of lines) {
      const scaledPath = new ClipperLib.Path()
      for (const point of line.points) {
        const scaledX = Math.round(point.x * scale)
        const scaledY = Math.round(point.y * scale)
        if (scaledPath.length === 0) {
          scaledPath.push({ X: scaledX, Y: scaledY })
        } else if (scaledPath[scaledPath.length - 1].X !== scaledX || scaledPath[scaledPath.length - 1].Y !== scaledY) {
          scaledPath.push({ X: scaledX, Y: scaledY })
        }
      }
      if (scaledPath.length > 1) {
        scaledLines.push(scaledPath)
      }
    }

    const cullerArea = new ClipperLib.Paths()
    const cullerPath = new ClipperLib.Path()
    const cullerPoints = culler.getPoints()
    for (const point of cullerPoints) {
      const scaledX = Math.round(point.x * scale)
      const scaledY = Math.round(point.y * scale)
      cullerPath.push({ X: scaledX, Y: scaledY })
    }
    cullerArea.push(cullerPath)

    const cpr = new ClipperLib.Clipper()
    const everythingOutside = new ClipperLib.PolyTree()
    cpr.AddPaths(scaledLines, ClipperLib.PolyType.ptSubject, false)
    cpr.AddPaths(cullerArea, ClipperLib.PolyType.ptClip, true)
    cpr.Execute(ClipperLib.ClipType.ctDifference, everythingOutside)

    const outsideLines = ClipperLib.Clipper.OpenPathsFromPolyTree(everythingOutside)
    const scaledDownOutsideLines = []
    for (const newLine of outsideLines) {
      const scaledDownLine = []
      for (const point of newLine) {
        scaledDownLine.push({
          x: point.X / scale,
          y: point.Y / scale
        })
      }
      scaledDownOutsideLines.push(scaledDownLine)
    }

    cpr.Clear()
    const everythingInside = new ClipperLib.PolyTree()
    cpr.AddPaths(scaledLines, ClipperLib.PolyType.ptSubject, false)
    cpr.AddPaths(cullerArea, ClipperLib.PolyType.ptClip, true)
    cpr.Execute(ClipperLib.ClipType.ctIntersection, everythingInside)

    const insideLines = ClipperLib.Clipper.OpenPathsFromPolyTree(everythingInside)
    const scaledDownInsideLines = []
    for (const newLine of insideLines) {
      const scaledDownLine = []
      for (const point of newLine) {
        scaledDownLine.push({
          x: point.X / scale,
          y: point.Y / scale
        })
      }
      scaledDownInsideLines.push(scaledDownLine)
    }

    return {
      inside: scaledDownInsideLines,
      outside: scaledDownOutsideLines
    }
  },

  /**
   * Culls lines outside a specified boundary.
   *
   * This method takes an array of lines and a "culler" line, and removes all parts of the lines
   * that fall outside the boundary defined by the culler. The culler acts as a clipping mask.
   *
   * @param {Line|Line[]} lines - A single Line object or an array of Line objects to be culled.
   * @param {Line} culler - A Line object representing the boundary for culling. Must be a closed polygon.
   * @param {boolean} [forceSort=false] - Optional parameter to force sorting of the result (unused in current implementation).
   * @returns {Line[]} An array of new Line objects representing the parts of the input lines that fall inside the culler boundary.
   *
   * @throws {Error} Implicitly throws an error if the culler is not a closed polygon.
   *
   * @example
   * const lines = [new Line([0,0], [10,10]), new Line([5,5], [15,15])];
   * const culler = new Line([0,0], [10,0], [10,10], [0,10], [0,0]);
   * const culledLines = page.cullOutside(lines, culler);
   */
  cullOutside: (lines, culler, forceSort = false) => {
    const clipped = page.clip(lines, culler)
    const keepLines = []
    clipped.inside.forEach((line) => {
      const newLine = new Line()
      line.forEach((point) => {
        newLine.addPoint(point.x, point.y)
      })
      keepLines.push(newLine)
    })
    return keepLines
  },

  /**
   * Culls lines inside a specified boundary.
   *
   * This method takes an array of lines and a "culler" line, and removes all parts of the lines
   * that fall inside the boundary defined by the culler. The culler acts as an inverse clipping mask.
   *
   * @param {Line|Line[]} lines - A single Line object or an array of Line objects to be culled.
   * @param {Line} culler - A Line object representing the boundary for culling. Must be a closed polygon.
   * @param {boolean} [forceSort=false] - Optional parameter to force sorting of the result (unused in current implementation).
   * @returns {Line[]} An array of new Line objects representing the parts of the input lines that fall outside the culler boundary.
   *
   * @throws {Error} Implicitly throws an error if the culler is not a closed polygon.
   *
   * @example
   * const lines = [new Line([0,0], [10,10]), new Line([5,5], [15,15])];
   * const culler = new Line([0,0], [10,0], [10,10], [0,10], [0,0]);
   * const culledLines = page.cullInside(lines, culler);
   */
  cullInside: (lines, culler, forceSort = false) => {
    const clipped = page.clip(lines, culler)
    const keepLines = []
    clipped.outside.forEach((line) => {
      const newLine = new Line()
      line.forEach((point) => {
        newLine.addPoint(point.x, point.y)
      })
      keepLines.push(newLine)
    })
    return keepLines
  },

  /**
   * A utility method to translate a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines An array of {@link Line} objects, or a single {@link Line} object
   * @param {number}          x     The x offset
   * @param {number}          y     The y offset
   * @param {number}          z     The z offset
   * @returns {Array}               An array of {@link Line} objects
   */
  translate: (lines, x, y, z = 0) => {
    const newLines = []
    if (!Array.isArray(lines)) lines = [lines]
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        newLine.addPoint(page.rounding(point.x + x), page.rounding(point.y + y), page.rounding(point.z + z))
      })
      newLines.push(newLine)
    })
    return newLines
  },

  /**
   * A utility method to translate a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines             An array of {@link Line} objects, or a single {@link Line} object
   * @param {number}          angle             The angle in degrees to rotate around
   * @param {boolean}         aroundOwnMidpoint Rotate around it's own middle if true, around 0,0 origin if false
   * @returns {Array}                 An array of {@link Line} objects
   */
  rotate: (lines, angle, aroundOwnMidpoint = true) => {
    //  Convert the angle from degree to radians
    const adjustedAngle = (-angle * Math.PI / 180)

    //  This will hold our final lines for us
    let newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]
    //  Grab the bouding box in case we need it
    const bb = page.getBoundingBox(lines)

    //  If we are rotating around it's own center then translate it to 0,0
    if (aroundOwnMidpoint) {
      lines = page.translate(lines, -bb.mid.x, -bb.mid.y)
    }

    //  Now rotate all the points
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        newLine.addPoint((Math.cos(adjustedAngle) * point.x) + (Math.sin(adjustedAngle) * point.y), (Math.cos(adjustedAngle) * point.y) - (Math.sin(adjustedAngle) * point.x), point.z)
      })
      newLines.push(newLine)
    })

    //  If we are rotating around the center now we need to move it back
    //  to it's original position
    if (aroundOwnMidpoint) {
      newLines = page.translate(newLines, bb.mid.x, bb.mid.y)
    }
    //  Send the lines back
    return newLines
  },

  /**
   * A utility method to translate a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines             An array of {@link Line} objects, or a single {@link Line} object
   * @param {number}          angle             The angle in degrees to rotate around
   * @param {boolean}         aroundOwnMidpoint Rotate around it's own middle if true, around 0,0 origin if false
   * @returns {Array}                 An array of {@link Line} objects
   */
  rotateXYZ: (lines, angle, aroundOwnMidpoint = true) => {
    //  This will hold our final lines for us
    let newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]
    //  Grab the bouding box in case we need it
    const bb = page.getBoundingBox(lines)

    //  If we are rotating around it's own center then translate it to 0,0
    if (aroundOwnMidpoint) {
      lines = page.translate(lines, -bb.mid.x, -bb.mid.y, -bb.mid.z)
    }

    //  Now rotate all the points
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        const newPoint = page.rotatePoint(point, angle)
        newLine.addPoint(newPoint.x, newPoint.y, newPoint.z)
      })
      newLines.push(newLine)
    })

    //  If we are rotating around the center now we need to move it back
    //  to it's original position
    if (aroundOwnMidpoint) {
      newLines = page.translate(newLines, bb.mid.x, bb.mid.y, bb.mid.z)
    }
    //  Send the lines back
    return newLines
  },

  zSort: (lines) => {
    //  This will hold our final lines for us
    let newLines = []
    //  Make sure the lines are an array
    const linesMap = {}
    const linesIndex = []

    if (!Array.isArray(lines)) lines = [lines]
    //  Go through the lines
    lines.forEach((line) => {
      //  Grab the bbox
      const bb = page.getBoundingBox(line)
      //  Grab the zIndex of the line
      let z = bb.mid.z
      //  Now adjust it *very* slightly based on the x and y values... the greater the x/y values
      //  the furure it will be away from the middle, so we push that zindex a little further out.
      //  This is of course a terrible HACK, and there is much wrong with this way of doing zSorting!
      z -= (Math.max(Math.abs(bb.max.x), Math.abs(bb.min.x)) / 100)
      z -= (Math.max(Math.abs(bb.max.y), Math.abs(bb.min.y)) / 100)
      line.setZindex(z)
      if (!linesMap[z]) linesMap[z] = []
      linesMap[z].push(line)
      linesIndex.push(z)
      // newLines.push(line)
    })

    //  Now we have built up a map and index of all the lines, we need to sort the zIndex and then push the lines
    //  into the newLines stack in that order
    linesIndex.sort(function (a, b) {
      return a - b
    })
    linesIndex.forEach((i) => {
      newLines = [...newLines, ...linesMap[i]]
    })
    return newLines
  },

  flatten: (lines, zoom) => {
    //  This will hold our final lines for us
    const newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]

    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        const newPoint = page.projectPoint(point, zoom)
        newLine.addPoint(newPoint.x, newPoint.y, newPoint.z)
      })
      newLines.push(newLine)
    })
    return newLines
  },

  /**
   * A utility method to translate a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines             An array of {@link Line} objects, or a single {@link Line} object
   * @param {displacement}    amount            Length and direction of dotify
   * @returns {Array}                           An array of {@link Line} objects
   */
  dotify: (lines, displacement) => {
    if (!displacement) {
      displacement = {
        amplitude: 0,
        resolution: 1,
        xNudge: 0,
        yNudge: 0,
        zNudge: 0,
        xScale: 1,
        yScale: 1,
        zScale: 1,
        addTime: false,
        timeMod: 1
      }
    }
    //  This will hold our final lines for us
    const newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]

    //  If we are supposed to do time, then do it
    let ttMod = 0
    if (displacement.addTime) ttMod = new Date().getTime() / 1000 / displacement.timeMod

    //  Now displace all the points
    lines.forEach((line) => {
      const points = line.getPoints()
      points.forEach((point) => {
        const newPoint = {
          x: point.x,
          y: point.y,
          z: point.z
        }
        newPoint.x += noise.perlin3((point.x + displacement.xNudge + ttMod) / displacement.resolution, (point.y + displacement.xNudge + ttMod) / displacement.resolution, (point.z + displacement.xNudge + ttMod) / displacement.resolution) * displacement.xScale * displacement.amplitude
        newPoint.y += noise.perlin3((point.x + displacement.yNudge + ttMod) / displacement.resolution, (point.y + displacement.yNudge + ttMod) / displacement.resolution, (point.z + displacement.yNudge + ttMod) / displacement.resolution) * displacement.yScale * displacement.amplitude
        newPoint.z += noise.perlin3((point.x + displacement.zNudge + ttMod) / displacement.resolution, (point.y + displacement.zNudge + ttMod) / displacement.resolution, (point.z + displacement.zNudge + ttMod) / displacement.resolution) * displacement.zScale * displacement.amplitude
        //  Make sure we always have something
        if (point.x === newPoint.x && point.y === newPoint.y && point.z === newPoint.z) {
          newPoint.x += 0.02
          newPoint.y += 0.02
          newPoint.y += 0.02
        }
        const newLine = new Line(line.getZindex(), line.getMode())
        newLine.addPoint(point.x, point.y, point.z)
        newLine.addPoint(newPoint.x, newPoint.y, newPoint.z)
        newLines.push(newLine)
      })
    })

    //  Send the lines back
    return newLines
  },

  /**
   * A utility method to translate a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines             An array of {@link Line} objects, or a single {@link Line} object
   * @param {displacement}    vectorObjects     The angle in degrees to rotate around
   * @returns {Array}                           An array of {@link Line} objects
   */
  displace: (lines, displacement) => {
    //  This will hold our final lines for us
    const newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]

    //  If we are supposed to do time, then do it
    let ttMod = 0
    if (displacement.addTime) ttMod = new Date().getTime() / 1000 / displacement.timeMod
    if (displacement.layout) ttMod += displacement.layout * Math.PI * 1000000
    const midPoint = {
      x: page.size[0] / 2,
      y: page.size[1] / 2
    }
    const d = new Date().getTime()
    const cornerDistance = (midPoint.x * midPoint.x) + (midPoint.y * midPoint.y)

    //  Now displace all the points
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        const newPoint = {
          x: point.x,
          y: point.y,
          z: point.z
        }

        //  Do the hoop jumping to
        const weightPoint = {
          x: point.x + page.size[0] / 2 + displacement.xShift,
          y: point.y + page.size[1] / 2 + displacement.yShift,
          z: point.z
        }

        let finalWeightingMod = 1
        if (displacement.direction === 'topDown') finalWeightingMod = (1 - weightPoint.y / page.size[1]) * 1
        if (displacement.direction === 'leftRight') finalWeightingMod = (1 - weightPoint.x / page.size[0]) * 1
        if (displacement.direction === 'middle') {
          const thisDist = ((midPoint.x - weightPoint.x) * (midPoint.x - weightPoint.x)) + ((midPoint.y - weightPoint.y) * (midPoint.y - weightPoint.y))
          finalWeightingMod = (0.71 - (thisDist / cornerDistance - (displacement.middleDist / 1000)) * 1)
        }
        if (displacement.direction === 'noise') {
          finalWeightingMod = ((noise.perlin3(weightPoint.x / 20 + (d / 721), weightPoint.y / 20 + (d / 883), d / 1000) + 1) / 2)
        }
        if (displacement.weighting !== 0) finalWeightingMod *= displacement.weighting
        if (displacement.invert) finalWeightingMod = 1 - finalWeightingMod

        newPoint.x += noise.perlin3((point.x + displacement.xNudge + ttMod) / displacement.resolution, (point.y + displacement.xNudge + ttMod) / displacement.resolution, (point.z + displacement.xNudge + ttMod) / displacement.resolution) * displacement.xScale * displacement.amplitude * finalWeightingMod
        newPoint.y += noise.perlin3((point.x + displacement.yNudge + ttMod) / displacement.resolution, (point.y + displacement.yNudge + ttMod) / displacement.resolution, (point.z + displacement.yNudge + ttMod) / displacement.resolution) * displacement.yScale * displacement.amplitude * finalWeightingMod
        newPoint.z += noise.perlin3((point.x + displacement.zNudge + ttMod) / displacement.resolution, (point.y + displacement.zNudge + ttMod) / displacement.resolution, (point.z + displacement.zNudge + ttMod) / displacement.resolution) * displacement.zScale * displacement.amplitude * finalWeightingMod
        newLine.addPoint(newPoint.x, newPoint.y, newPoint.z)
        // newLine.addPoint((Math.cos(adjustedAngle) * point.x) + (Math.sin(adjustedAngle) * point.y), (Math.cos(adjustedAngle) * point.y) - (Math.sin(adjustedAngle) * point.x))
      })
      newLines.push(newLine)
    })

    //  Send the lines back
    return newLines
  },

  /**
   * A utility method to scale a single line or an array of lines
   * by the passed values. It always returns an array of lines
   * @param {(Array|object)}  lines             An array of {@link Line} objects, or a single {@link Line} object
   * @param {number}          xScale            The amount to scale in the x direction
   * @param {number}          yScale            The amount to scale in the y direction, if null, then uses the same value as xScale
   * @param {number}          zScale            The amount to scale in the z direction, if null, then uses the same value as xScale
   * @param {boolean}         aroundOwnMidpoint Scale around it's own middle if true, around 0,0 origin if false
   * @returns {Array}                           An array of {@link Line} objects
   */
  scale: (lines, xScale, yScale = null, zScale = null, aroundOwnMidpoint = true) => {
    //  This will hold our final lines for us
    let newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]
    //  Grab the bouding box in case we need it
    const bb = page.getBoundingBox(lines)

    //  If we are rotating around it's own center then translate it to 0,0
    if (aroundOwnMidpoint) {
      lines = page.translate(lines, -bb.mid.x, -bb.mid.y)
    }

    if (yScale === null) yScale = xScale
    if (zScale === null) zScale = xScale

    //  Now scale all the points
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex(), line.getMode())
      const points = line.getPoints()
      points.forEach((point) => {
        newLine.addPoint(xScale * point.x, yScale * point.y, zScale * point.z)
      })
      newLines.push(newLine)
    })

    //  If we are scaling around the center now we need to move it back
    //  to it's original position
    if (aroundOwnMidpoint) {
      newLines = page.translate(newLines, bb.mid.x, bb.mid.y, bb.mid.z)
    }
    //  Send the lines back
    return newLines
  },

  getDistance: (p1, p2) => {
    if (!p1.z || isNaN(p1.z)) p1.z = 0
    if (!p2.z || isNaN(p2.z)) p2.z = 0
    return Math.cbrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2))
  },

  /**
   * This utility method gets the bounding box from an array of lines, it also
   * calculates the midpoint
   * @param {(Array|object)}  lines  An array of {@link Line} objects, or a single {@link Line} object
   * @returns {object}        And object containing the min/max points and the mid points
   */
  getBoundingBox: (lines) => {
    if (!Array.isArray(lines)) lines = [lines]

    const max = {
      x: -999999999,
      y: -999999999,
      z: -999999999
    }
    const min = {
      x: 999999999,
      y: 999999999,
      z: 999999999
    }
    lines.forEach((line) => {
      const points = line.getPoints()
      points.forEach((point) => {
        if (point.x < min.x) min.x = point.x
        if (point.x > max.x) max.x = point.x
        if (point.y < min.y) min.y = point.y
        if (point.y > max.y) max.y = point.y
        if (point.z < min.z) min.z = point.z
        if (point.z > max.z) max.z = point.z
      })
    })
    return {
      min,
      max,
      mid: {
        x: page.rounding(min.x + ((max.x - min.x) / 2)),
        y: page.rounding(min.y + ((max.y - min.y) / 2)),
        z: page.rounding(min.z + ((max.z - min.z) / 2))
      }
    }
  },

  /**
   * A utility method for converting an array of points into a clockwise order
   * (or at least I think it's clockwise, it's suddenly struck me that there's
   * a slim chance it's anti-clockwise, TODO: check clockwiseyness)
   * @param {array} points  An array of points objects
   * @returns {array} A sorted array of point objects
   */
  sortPointsClockwise: (points) => {
    //  Get the mid points of the points
    const max = {
      x: -999999999,
      y: -999999999,
      z: -999999999
    }
    const min = {
      x: 999999999,
      y: 999999999,
      z: 999999999
    }
    points.forEach((point) => {
      if (point.x < min.x) min.x = point.x
      if (point.x > max.x) max.x = point.x
      if (point.y < min.y) min.y = point.y
      if (point.y > max.y) max.y = point.y
      if (point.z < min.z) min.z = point.z
      if (point.z > max.z) max.z = point.z
    })
    const mid = {
      x: page.rounding(min.x + ((max.x - min.x) / 2)),
      y: page.rounding(min.y + ((max.y - min.y) / 2)),
      z: page.rounding(min.z + ((max.z - min.z) / 2))
    }
    //  Now calculate the angle between the mid point and
    //  all the points in turn
    let sortedPoints = []
    points.forEach((point) => {
      sortedPoints.push({
        x: point.x,
        y: point.y,
        z: point.z,
        angle: Math.atan2(point.y - mid.y, point.x - mid.x) * 180 / Math.PI
      })
    })
    sortedPoints = sortedPoints.sort((a, b) => parseFloat(a.angle) - parseFloat(b.angle))
    return sortedPoints
  },

  /**
   * A utility method to duplicate an array, so we end up with a deep copy
   * rather than a linked copy. There's a bunch of ways of doing this, I'm gunna
   * do it this way :)
   * @param {Array}   lines The lines (or array of lines to duplicate)
   * @returns {Array} The duplicated lines
   */
  duplicate: (lines) => {
    if (!Array.isArray(lines)) lines = [lines]
    const newLines = []
    lines.forEach((line) => {
      const newLine = new Line(parseInt(line.zIndex), line.getMode())
      const points = line.getPoints()
      points.forEach((p) => {
        newLine.addPoint(p.x, p.y, p.z)
      })
      newLines.push(newLine)
    })
    return newLines
  },

  cleanLines: (lines) => {
    const keepLines = []

    const wasArray = Array.isArray(lines)
    if (!Array.isArray(lines)) lines = [lines]
    //  Go through each line
    lines.forEach((line) => {
      const points = line.getPoints()
      const minDist = 0.01
      //  This is going to keep track of the points we want to keep
      const newPoints = []
      //  grab the first point
      let previousPoint = points.shift()
      newPoints.push(previousPoint)
      while (points.length) {
        //  grab the next point
        const checkPoint = points.shift()
        //  work out the distance
        const xs = checkPoint.x - previousPoint.x
        const ys = checkPoint.y - previousPoint.y
        const zs = checkPoint.z - previousPoint.z
        const dist = page.rounding(Math.cbrt(Math.abs(xs) + Math.abs(ys) + Math.abs(zs)))
        //  if the distance is greater then the minimum allowed, we keep the point
        if (dist >= minDist) {
          //  Keep the point
          newPoints.push(checkPoint)
          //  set the previous point to the one we just had
          previousPoint = checkPoint
        }
      }
      //  Set the points back into the line
      line.points = newPoints
      if (line.points.length > 1) keepLines.push(line)
    })
    if (!wasArray) return keepLines[0]
    return keepLines
  },

  /**
   * A utility method that will return a circle, well, technically a
   * polygon based on the number of segments and radius. The zIndex is
   * also set here. The polygon returned is centered on 0,0.
   * @param   {number}  segments  The number of segments in the circle
   * @param   {number}  radius    The radius of the polygon
   * @param   {number}  zIndex    The zIndex to be applied to the returned {@link Line}
   * @returns {Array}             Returns an Array containing a single {@link Line} object
   */
  makeCircle: (segments, radius, zIndex, mode = 'stroke') => {
    const circle = new Line(zIndex, mode)
    const angle = 360 / segments
    for (let s = 0; s <= segments; s++) {
      const adjustedAngle = ((angle * s) * Math.PI / 180)
      const x = page.rounding(Math.cos(adjustedAngle) * radius)
      const y = page.rounding(Math.sin(adjustedAngle) * radius)
      circle.addPoint(x, y)
    }
    return [circle]
  },

  /**
   * Method to clear the page canvas of whatever's been drawn there
   */
  clear: (backgroundColour = '#FFFFFF') => {
    const canvas = document.getElementById('page')
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = backgroundColour
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  },

  /**
   * A utility method to make a standard culling frame
   * @param   {number}  sideMargin        The size of the side margins
   * @param   {number}  topBottomMargin   The size of the end margins
   * @param   {boolean} squarify          Are we forcing a square or not
   * @returns {Array}                     Returns an Array containing a single {@link Line} object
   */
  makeStandardCuller: (sideMargin, topBottomMargin, squarify) => {
    //  Make the margins
    let tbOffset = 0
    let lrOffset = 0
    if (squarify === true) {
      //  If we are longer than we are high
      if (page.size[1] > page.size[0]) {
        tbOffset = (page.size[1] - page.size[0]) / 2
      }
      //  If we are wider than we are long
      if (page.size[0] > page.size[1]) {
        lrOffset = (page.size[0] - page.size[1]) / 2
      }
    }
    const culler = new Line(1)
    culler.addPoint(sideMargin + lrOffset, topBottomMargin + tbOffset)
    culler.addPoint(page.size[0] - (sideMargin + lrOffset), topBottomMargin + tbOffset)
    culler.addPoint(page.size[0] - (sideMargin + lrOffset), page.size[1] - (topBottomMargin + tbOffset))
    culler.addPoint(sideMargin + lrOffset, page.size[1] - (topBottomMargin + tbOffset))
    culler.addPoint(sideMargin + lrOffset, topBottomMargin + tbOffset)
    return culler
  },

  /**
   * A utility method to make a rectangle of doom
   * @param   {number}  leftMargin        The size of the left margin
   * @param   {number}  topMargin         The size of the top margin
   * @param   {number}  rightMargin       The size of the right margin
   * @param   {number}  bottomMargin      The size of the bottom margin
   * @param   {boolean} squarify          Are we forcing a square or not
   * @returns {Array}                     Returns an Array containing a single {@link Line} object
   */
  makeRectangleOfDoom: (leftMargin, topMargin, rightMargin, bottomMargin, squarify) => {
    //  Make the margins
    let tbOffset = 0
    let lrOffset = 0
    if (squarify === true) {
      //  If we are longer than we are high
      if (page.size[1] > page.size[0]) {
        tbOffset = (page.size[1] - page.size[0]) / 2
      }
      //  If we are wider than we are long
      if (page.size[0] > page.size[1]) {
        lrOffset = (page.size[0] - page.size[1]) / 2
      }
    }
    const culler = new Line(1)
    culler.addPoint(leftMargin + lrOffset, topMargin + tbOffset)
    culler.addPoint(page.size[0] - (rightMargin + lrOffset), topMargin + tbOffset)
    culler.addPoint(page.size[0] - (rightMargin + lrOffset), page.size[1] - (bottomMargin + tbOffset))
    culler.addPoint(leftMargin + lrOffset, page.size[1] - (bottomMargin + tbOffset))
    culler.addPoint(leftMargin + lrOffset, topMargin + tbOffset)
    return culler
  },

  /**
   * Method to draw a {@link Line} or array of {@link Line}s onto the page.
   * @param {(Array|object)}  lines   An array of {@link Line} objects, or a single {@link Line} object
   * @param {string}          c       The colour of the stroke to be used, i.e. '#770000'
   * @param {string}          op      The blending operation to use when drawing
   */
  draw: (lines, c, op = 'normal', widthMod = 1) => {
    const canvas = document.getElementById('page')
    const ctx = canvas.getContext('2d')
    /* globalCompositeOperation :
      normal | multiply | screen | overlay |
      darken | lighten | color-dodge | color-burn | hard-light |
      soft-light | difference | exclusion | hue | saturation |
      color | luminosity
    */
    // ctx.globalCompositeOperation = 'multiply' // <-- use for CMYK based things
    ctx.globalCompositeOperation = op // <-- use for Red/Yellow/Blue based things

    const lineWidth = 8 * page.size[0] / page.PAPER.A3[0]
    //  Now set the width to be a factor of the page size compared to A3

    ctx.lineWidth = lineWidth * widthMod

    //  Make sure the lines is an array
    if (!Array.isArray(lines)) lines = [lines]

    //  Loop through all the lines in the goodLineBucket and draw them
    ctx.strokeStyle = c
    ctx.fillStyle = '#eeeeee'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    lines.forEach((line) => {
      const points = line.getPoints()
      if (points.length) {
        //  start the path at the first point
        ctx.beginPath()
        ctx.moveTo(page.rounding(page.scaleX(page.rounding(points[0].x))), page.rounding(page.scaleY(page.rounding(points[0].y))))
        points.forEach((p, i) => {
          //  If we are not the first point
          if (i > 0) {
            ctx.lineTo(page.rounding(page.scaleX(page.rounding(p.x))), page.rounding(page.scaleY(page.rounding(p.y))))
          }
        })
        if (line.mode === 'stroke' || line.mode === 'both') ctx.stroke()
        if (line.mode === 'fill' || line.mode === 'both') ctx.fill()
      }
    })
  },

  /**
   * Crazy 3D stuff here
   */

  // Blah blah, lazy rotate
  rotatePoint: (point, values) => {
    const radmod = Math.PI / 180
    const newPoint = {
      x: 0,
      y: 0,
      z: 0
    }

    const newValues = {}
    newValues.x = values.x * radmod
    newValues.y = values.y * radmod
    newValues.z = values.z * radmod

    newPoint.x = point.x
    newPoint.y = point.y * Math.cos(newValues.x) - point.z * Math.sin(newValues.x) // rotate about X
    newPoint.z = point.y * Math.sin(newValues.x) + point.z * Math.cos(newValues.x) // rotate about X

    point.x = parseFloat(newPoint.x)
    point.z = parseFloat(newPoint.z)
    newPoint.x = point.z * Math.sin(newValues.y) + point.x * Math.cos(newValues.y) // rotate about Y
    newPoint.z = point.z * Math.cos(newValues.y) - point.x * Math.sin(newValues.y) // rotate about Y

    point.x = parseFloat(newPoint.x)
    point.y = parseFloat(newPoint.y)
    newPoint.x = point.x * Math.cos(newValues.z) - point.y * Math.sin(newValues.z) // rotate about Z
    newPoint.y = point.x * Math.sin(newValues.z) + point.y * Math.cos(newValues.z) // rotate about Z

    return newPoint
  },

  //  Convert a point from 3D to 2D
  projectPoint: (point, perspective) => {
    const f = 1 + (point.z / (perspective * perspective))
    const newPoint = {
      x: (point.x * f),
      y: (point.y * f),
      z: 0
    }

    // send the point back
    return newPoint
  },

  /**
   * Method to convert rgb to CMYK. I tend to "plot" on the axidraw with with black/silver/gold
   * or CMYK pens, this allows me to do things with the sourceImg working out just how CMYK a certain
   * pixel is
   * @param {number}  r The red value (0-255)
   * @param {number}  g The green value (0-255)
   * @param {number}  b The blue value (0-255)\
   * @returns {object}  An object containing the CYMK values in the range of (0-1)
   */
  rgb2cmyk: (r, g, b) => {
    let computedC = 0
    let computedM = 0
    let computedY = 0
    let computedK = 0

    if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
      return
    }

    // BLACK
    if (r === 0 && g === 0 && b === 0) {
      computedK = 1
      return {
        c: 0,
        m: 0,
        y: 0,
        k: 1
      }
    }

    computedC = 1 - (r / 255)
    computedM = 1 - (g / 255)
    computedY = 1 - (b / 255)

    const minCMY = Math.min(computedC,
      Math.min(computedM, computedY))
    computedC = (computedC - minCMY) / (1 - minCMY)
    computedM = (computedM - minCMY) / (1 - minCMY)
    computedY = (computedY - minCMY) / (1 - minCMY)
    computedK = minCMY

    return {
      c: computedC,
      m: computedM,
      y: computedY,
      k: computedK
    }
  },

  /** method to create all the cropping values */
  makeCroppers: (v) => {
    const culler = page.makeStandardCuller(v.sideMargin, v.topBottomMargin, v.squarify)
    const RoD = page.makeRectangleOfDoom(v.leftMargin, v.topMargin, v.rightMargin, v.bottomMargin, v.squarify)
    let CoD = page.makeCircle(v.CoDSides, v.CoDSize)
    CoD = page.rotate(CoD, v.CoDRotation - 90, false)
    CoD = page.translate(CoD, v.CoDx, v.CoDy)
    let CoD2 = page.makeCircle(v.CoD2Sides, v.CoD2Size)
    CoD2 = page.rotate(CoD2, v.CoD2Rotation - 90, false)
    CoD2 = page.translate(CoD2, v.CoD2x, v.CoD2y)
    const ticks = []
    // Top left
    let tick = new Line()
    tick.addPoint(0.10, 0)
    tick.addPoint(0.30, 0)
    ticks.push(tick)
    tick = new Line()
    tick.addPoint(0, 0.10)
    tick.addPoint(0, 0.30)
    ticks.push(tick)
    // Top right
    tick = new Line()
    tick.addPoint(page.size[0] - 0.10, 0)
    tick.addPoint(page.size[0] - 0.30, 0)
    ticks.push(tick)
    tick = new Line()
    tick.addPoint(page.size[0], 0.10)
    tick.addPoint(page.size[0], 0.30)
    ticks.push(tick)
    // Bottom left
    tick = new Line()
    tick.addPoint(0.10, page.size[1])
    tick.addPoint(0.30, page.size[1])
    ticks.push(tick)
    tick = new Line()
    tick.addPoint(0, page.size[1] - 0.10)
    tick.addPoint(0, page.size[1] - 0.30)
    ticks.push(tick)
    // Bottom right
    tick = new Line()
    tick.addPoint(page.size[0] - 0.10, page.size[1])
    tick.addPoint(page.size[0] - 0.30, page.size[1])
    ticks.push(tick)
    tick = new Line()
    tick.addPoint(page.size[0], page.size[1] - 0.10)
    tick.addPoint(page.size[0], page.size[1] - 0.30)
    ticks.push(tick)
    /*
    const topRightTick = new Line()
    topRightTick.addPoint(page.size[0] - 0.15, 0.15)
    topRightTick.addPoint(page.size[0] - 0.30, 0.30)
    const bottomLeftTick = new Line()
    bottomLeftTick.addPoint(0.15, page.size[1] - 0.15)
    bottomLeftTick.addPoint(0.30, page.size[1] - 0.30)
    const bottomRightTick = new Line()
    bottomRightTick.addPoint(page.size[0] - 0.15, page.size[1] - 0.15)
    bottomRightTick.addPoint(page.size[0] - 0.30, page.size[1] - 0.30)
    ticks.push(topLeftTick)
    ticks.push(topRightTick)
    ticks.push(bottomLeftTick)
    ticks.push(bottomRightTick)
    */
    return {
      culler,
      RoD,
      CoD,
      CoD2,
      ticks
    }
  },

  doDisplacement: (thing, v, layout, totalLayouts) => {
    if (v.d1Amplitude > 0 || v.d2Amplitude) {
      thing = page.translate(thing, -page.size[0] / 2, -page.size[1] / 2)
      if (v.d1Amplitude > 0) {
        thing = page.displace(thing, {
          amplitude: v.d1Amplitude,
          resolution: v.d1Resolution,
          xScale: v.d1xScale,
          yScale: v.d1yScale,
          zScale: v.d1zScale,
          xNudge: v.d1xNudge,
          yNudge: v.d1yNudge,
          zNudge: v.d1zNudge,
          addTime: v.d1AddTime,
          timeMod: v.d1TimeMod,
          direction: v.d1Direction,
          invert: v.d1Invert,
          middleDist: v.d1MiddleDist,
          xShift: v.d1xShift,
          yShift: v.d1yShift,
          weighting: v.d1Weighting,
          layout
        })
      }
      if (v.d2Amplitude > 0) {
        thing = page.displace(thing, {
          amplitude: v.d2Amplitude,
          resolution: v.d2Resolution,
          xScale: v.d2xScale,
          yScale: v.d2yScale,
          zScale: v.d2zScale,
          xNudge: v.d2xNudge,
          yNudge: v.d2yNudge,
          zNudge: v.d2zNudge,
          addTime: v.d2AddTime,
          timeMod: v.d2TimeMod,
          direction: v.d2Direction,
          invert: v.d2Invert,
          middleDist: v.d2MiddleDist,
          xShift: v.d2xShift,
          yShift: v.d2yShift,
          weighting: v.d2Weighting,
          layout
        })
      }
      thing = page.translate(thing, page.size[0] / 2, page.size[1] / 2)
    }
    return thing
  },

  doDotify: (thing, v) => {
    if (v.dotify) {
      thing = page.dotify(thing, {
        amplitude: v.dotAmplitude,
        resolution: v.dotResolution,
        xScale: v.dotxScale,
        yScale: v.dotyScale,
        zScale: v.dotzScale,
        xNudge: v.dotxNudge,
        yNudge: v.dotyNudge,
        zNudge: v.dotzNudge,
        addTime: v.dotAddTime,
        timeMod: v.dotTimeMod
      })
    }
    return thing
  },

  doRotation: (thing, v) => {
    if (v.rot1X !== 0 || v.rot1Y !== 0 || v.rot1Z !== 0 || v.rot1X !== 0 || v.rot1Y !== 0 || v.rot1Z !== 0) {
      thing = page.translate(thing, -page.size[0] / 2, -page.size[1] / 2)

      thing = page.rotateXYZ(thing, {
        x: v.rot1X,
        y: v.rot1Y,
        z: v.rot1Z
      }, false)
      thing = page.rotateXYZ(thing, {
        x: v.rot2X,
        y: v.rot2Y,
        z: v.rot2Z
      }, false)

      //  If we haven't dotified the thing then we still have "solids", so we need to
      //  do a zSort to put them back in order after the rotation
      if (!v.dotify) thing = page.zSort(thing)

      //  Flatten and move back
      thing = page.flatten(thing, v.perspective)
      thing = page.translate(thing, page.size[0] / 2, page.size[1] / 2)
    }
    return thing
  },

  doRemoveHiddenLines: (thing, v) => {
    if (v.removeHiddenLines && !v.dotify) {
      if (v.reverseRHL) thing.reverse()
      let culledLines = []
      while (thing.length > 0) {
        let toBeCulled = thing.shift()
        thing.forEach((culler) => {
          toBeCulled = page.cullInside(toBeCulled, culler)
        })
        culledLines = culledLines.concat(toBeCulled)
      }
      thing = culledLines
    }
    return thing
  },

  doCulling: (thing, v, RoD, CoD, CoD2) => {
    if (v.useRoD) {
      if (v.RoDCropOutside) {
        thing = page.cullOutside(thing, RoD)
      } else {
        thing = page.cullInside(thing, RoD)
      }
    }
    if (v.useCoD) {
      if (v.CoDCropOutside) {
        thing = page.cullOutside(thing, CoD[0])
      } else {
        thing = page.cullInside(thing, CoD[0])
      }
    }
    if (v.useCoD2) {
      if (v.CoD2CropOutside) {
        thing = page.cullOutside(thing, CoD2[0])
      } else {
        thing = page.cullInside(thing, CoD2[0])
      }
    }
    return thing
  },

  doCornerScale: (lines, scale) => {
    lines = page.translate(lines, -page.size[0] / 2, -page.size[1] / 2)
    lines = page.scale(lines, scale, scale, scale, false)
    lines = page.translate(lines, page.size[0] / 2, page.size[1] / 2)
    return lines
  },

  optimise: (lines) => {
    return lines
  },

  /** methiod to scale lines down on the page when we are doing a layout
   * @param   {(Array|object)}  lines   An array of {@link Line} objects, or a single {@link Line} object
   * @param {number}  layoutNum   Which "tile" we are currently plotting
   * @param {number}  layoutType  Which layout we are using (2, 4 or 8 up)
   * @returns {Array}             Returns an Array of lines
   */
  doLayout: (lines, layoutNum, layoutType, squarify = false) => {
    const layout = page.layouts[layoutType]

    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]

    //  If we don't need to do a layout then we return here
    if (!layout.modLayout) return lines

    //  Adjust for squarify
    let tbOffset = 0
    let lrOffset = 0
    if (squarify === true) {
      //  If we are longer than we are high
      if (page.size[1] > page.size[0]) {
        tbOffset = (page.size[1] - page.size[0]) / 2
      }
      //  If we are wider than we are long
      if (page.size[0] > page.size[1]) {
        lrOffset = (page.size[0] - page.size[1]) / 2
      }
    }

    //  If we are supposed to adjust the layout, then we do that here
    let newLines = []
    const y = Math.floor(layoutNum / layout.across)
    const x = layoutNum - (y * layout.across)
    lines.forEach((l) => {
      //  Move the lines to the 0,0 origin
      l = page.translate(l, -page.size[0] / 2, -page.size[1] / 2)
      //  Scale them down
      l = page.scale(l, layout.scale, layout.scale, layout.scale, false)
      //  If we are supposed to rotate it
      if (layout.rotated) l = page.rotate(l, 90, false)
      //  Work out how far to move it accross
      const xMove = ((page.size[0] - (lrOffset * 2)) / layout.across) * (x + 0.5) + lrOffset
      const yMove = ((page.size[1] - (tbOffset * 2)) / layout.down) * (y + 0.5) + tbOffset
      l = page.translate(l, xMove, yMove)
      newLines = [...newLines, ...l]
    })

    return newLines
  },

  //  This goes through each line, segment by segment dividing it up by the
  //  distance we want, and then
  doPreScale: (lines, v) => {
    //  Trasnlate all the lines
    lines = page.translate(lines, page.size[0] / -2, page.size[1] / -2)
    lines = page.scale(lines, v.preX, v.preY, v.preZ, false)
    lines = page.translate(lines, page.size[0] / 2, page.size[1] / 2)
    return lines
  },

  //  This goes through each line, segment by segment dividing it up by the
  //  distance we want, and then
  doPreTranslate: (lines, v) => {
    //  Trasnlate all the lines
    lines = page.translate(lines, v.preTranX, v.preTranY, v.preTranZ)
    return lines
  },

  //  This goes through each line, segment by segment dividing it up by the
  //  distance we want, and then
  doPreRotate: (lines, v) => {
    //  Trasnlate all the lines
    lines = page.translate(lines, page.size[0] / -2, page.size[1] / -2)
    lines = page.rotateXYZ(lines, {
      x: v.preRotX,
      y: v.preRotY,
      z: v.preRotZ
    }, false)
    lines = page.translate(lines, page.size[0] / 2, page.size[1] / 2)
    return lines
  },

  //  This goes through each line, segment by segment dividing it up by the
  //  distance we want, and then
  doDecimate: (lines, v) => {
    if (v.decimate) {
      const newLines = []
      lines.forEach((line) => {
        const newLine = new Line(line.getZindex(), line.getMode())
        const points = line.getPoints()
        for (let pi = 0; pi < points.length - 1; pi++) {
          const p1 = points[pi]
          const p2 = points[pi + 1]
          const xDiff = p2.x - p1.x
          const yDiff = p2.y - p1.y
          const zDiff = p2.z - p1.z
          const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff)
          const times = parseInt(distance / v.dDistance)
          const percent = 100 / times / 100
          if (times > 0) {
            for (let d = 0; d < times; d++) {
              newLine.addPoint(p1.x + (xDiff * percent * d), p1.y + (yDiff * percent * d), p1.z + (zDiff * percent * d))
            }
          } else {
            newLine.addPoint(p1.x, p1.y, p1.z)
          }
        }
        //  Add the last point
        newLine.addPoint(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z)
        newLines.push(newLine)
      })
      return newLines
    }
    return lines
  },

  //  Here is where we switch things on and off
  doOnOff: (lines, v) => {
    const midPoint = {
      x: page.size[0] / 2,
      y: page.size[1] / 2
    }
    const d = new Date().getTime()

    if (v.onoff) {
      const newLines = []
      lines.forEach((line) => {
        let newLine = new Line(line.getZindex(), line.getMode())
        let oldStatus = 'off'
        const points = line.getPoints()
        for (let pi = 0; pi < points.length - 1; pi++) {
          let chance = 0.5

          //  Work out which option to use
          if (v.ooDirection === 'topDown') chance = (1 - points[pi].y / page.size[1]) * 1
          if (v.ooDirection === 'leftRight') chance = (1 - points[pi].x / page.size[0]) * 1
          if (v.ooDirection === 'middle') {
            const thisDist = ((midPoint.x - points[pi].x) * (midPoint.x - points[pi].x)) + ((midPoint.y - points[pi].y) * (midPoint.y - points[pi].y))
            chance = 0.7 - ((thisDist / v.ooMiddleDist) * 1)
          }
          if (v.ooDirection === 'noise') {
            chance = 0.7 - ((noise.perlin3(points[pi].x / 20 + (d / 721), points[pi].y / 20 + (d / 883), d / 1000) + 1) / 2)
          }
          if (v.ooWeighting !== 0) chance *= v.ooWeighting
          if (v.ooInvert) chance = 1 - chance
          //  Switch off
          if (Math.random() <= chance) {
            //  Here we are turning the next section off
            if (oldStatus === 'off') {
              //  We don't need to do anything
            } else {
              //  We need to end the last line and add
              //  it to the newLines array
              newLines.push(newLine)
              oldStatus = 'off'
            }
          } else {
            //  Switch On
            //  If the last status was off we need to make a new line
            //  and add the two points
            if (oldStatus === 'off') {
              newLine = new Line(line.getZindex(), line.getMode())
              newLine.addPoint(points[pi].x, points[pi].y, points[pi].z)
              newLine.addPoint(points[pi + 1].x, points[pi + 1].y, points[pi + 1].z)
              oldStatus = 'on'
            } else {
              //  It is still on, so add the next point
              newLine.addPoint(points[pi + 1].x, points[pi + 1].y, points[pi + 1].z)
            }
          }
        }
        //  If we finished with a line, then add it here
        if (oldStatus === 'on') {
          newLines.push(newLine)
        }
      })
      return newLines
    }
    return lines
  },

  doAllExperimental: (lines, v, layout, vLayout) => {
    //  This is where we decimate the line
    lines = page.doDecimate(lines, v)

    //  The prescale
    lines = page.doPreScale(lines, v)

    //  The prerotate
    lines = page.doPreRotate(lines, v)

    //  The pre translate
    lines = page.doPreTranslate(lines, v)

    //  This is where we switch lines on and off
    lines = page.doOnOff(lines, v, layout, vLayout)

    //  This is where we have to make all the displacements
    lines = page.doDisplacement(lines, v, layout, vLayout)

    // Dotify
    lines = page.doDotify(lines, v)

    //  Here we do the rotation
    lines = page.doRotation(lines, v)

    //  Now we need to do hidden line removal if that's selected
    lines = page.doRemoveHiddenLines(lines, v)

    return lines
  },

  doAllCropAndLayout: (layout, vLayout, squarify, culler, RoD, CoD, CoD2, ticks) => {
    //  Now we need to crop the croppers ;)
    RoD = page.cullOutside(RoD, culler)
    CoD = page.cullOutside(CoD, culler)
    CoD2 = page.cullOutside(CoD2, culler)

    //  Put the things into the layout
    culler = page.doLayout(culler, layout, vLayout, squarify)
    RoD = page.doLayout(RoD, layout, vLayout, squarify)
    CoD = page.doLayout(CoD, layout, vLayout, squarify)
    CoD2 = page.doLayout(CoD2, layout, vLayout, squarify)
    ticks = page.doLayout(ticks, layout, vLayout, squarify)

    return {
      culler,
      RoD,
      CoD,
      CoD2,
      ticks
    }
  },

  doAllCulling: (lines, v, culler, RoD, CoD, CoD2) => {
    // If we are not using the removeHidden2 method
    if ('cropToMargin' in v && v.cropToMargin === true) lines = page.cullOutside(lines, culler)
    lines = page.doCulling(lines, v, RoD, CoD, CoD2)
    return lines
  },

  doAllExperimentalAndCulling: (lines, v, culler, RoD, CoD, CoD2, layout, vLayout) => {
    lines = page.doAllExperimental(lines, v, layout, vLayout)
    lines = page.doAllCulling(lines, v, culler, RoD, CoD, CoD2)
    return lines
  },

  guiAddPreCustom: (updateUrl, updatePageSize) => {
    const updaters = []
    const gui = new dat.GUI()
    const settings = gui.addFolder('Settings')
    settings.add(drawing.values, 'pageWidth').min(1).max(84.1).step(0.1).onFinishChange(updatePageSize)
    settings.add(drawing.values, 'pageHeight').min(1).max(118.8).step(0.1).onFinishChange(updatePageSize)
    settings.add(drawing.values, 'sideMargin').min(0).max(84.1 / 2).step(0.1).onFinishChange(updateUrl)
    settings.add(drawing.values, 'topBottomMargin').min(0).max(118.8 / 2).step(0.1).onFinishChange(updateUrl)
    updaters.push(settings.add(drawing.values, 'drawMargin'))
    updaters.push(settings.add(drawing.values, 'cropToMargin'))
    updaters.push(settings.add(drawing.values, 'drawTicks'))
    return {
      gui,
      updaters
    }
  },

  guiAddPostCustom: (gui, updaters, updateUrl, addAutoRedraw = true) => {
    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  This stuff is always here
    const RoD = gui.addFolder('Rectangle Of Doom')
    updaters.push(RoD.add(drawing.values, 'useRoD'))
    RoD.add(drawing.values, 'leftMargin').min(0).max(page.size[0]).step(0.1).onFinishChange(updateUrl)
    RoD.add(drawing.values, 'topMargin').min(0).max(page.size[1] * 2).step(0.1).onFinishChange(updateUrl)
    RoD.add(drawing.values, 'rightMargin').min(0).max(page.size[0]).step(0.1).onFinishChange(updateUrl)
    RoD.add(drawing.values, 'bottomMargin').min(0).max(page.size[1] * 2).step(0.1).onFinishChange(updateUrl)
    updaters.push(RoD.add(drawing.values, 'RoDCropOutside'))
    updaters.push(RoD.add(drawing.values, 'drawRoD'))

    const CoD = gui.addFolder('Circle Of Doom')
    updaters.push(CoD.add(drawing.values, 'useCoD'))
    CoD.add(drawing.values, 'CoDx').min(0).max(page.size[0]).step(0.05).onFinishChange(updateUrl)
    CoD.add(drawing.values, 'CoDy').min(0).max(page.size[1]).step(0.05).onFinishChange(updateUrl)
    CoD.add(drawing.values, 'CoDSize').min(0).max(page.size[0]).step(0.1).onFinishChange(updateUrl)
    CoD.add(drawing.values, 'CoDSides').min(0).max(360).step(1).onFinishChange(updateUrl)
    CoD.add(drawing.values, 'CoDRotation').min(0).max(360).step(1).onFinishChange(updateUrl)
    updaters.push(CoD.add(drawing.values, 'CoDCropOutside'))
    updaters.push(CoD.add(drawing.values, 'drawCoD'))

    const CoD2 = gui.addFolder('Circle Of Doom 2')
    updaters.push(CoD2.add(drawing.values, 'useCoD2'))
    CoD2.add(drawing.values, 'CoD2x').min(0).max(page.size[0]).step(0.05).onFinishChange(updateUrl)
    CoD2.add(drawing.values, 'CoD2y').min(0).max(page.size[1]).step(0.05).onFinishChange(updateUrl)
    CoD2.add(drawing.values, 'CoD2Size').min(0).max(page.size[0]).step(0.1).onFinishChange(updateUrl)
    CoD2.add(drawing.values, 'CoD2Sides').min(0).max(360).step(1).onFinishChange(updateUrl)
    CoD2.add(drawing.values, 'CoD2Rotation').min(0).max(360).step(1).onFinishChange(updateUrl)
    updaters.push(CoD2.add(drawing.values, 'CoD2CropOutside'))
    updaters.push(CoD2.add(drawing.values, 'drawCoD2'))

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  "Experimental" settings
    const experimental = gui.addFolder('Experimental')
    updaters.push(experimental.add(drawing.values, 'squarify'))
    updaters.push(experimental.add(drawing.values, 'layers').min(1).max(page.colourBlindPalette.length).step(1))
    experimental.add(drawing.values, 'finalScale').min(0).max(2).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Prescasle
    const preScale = experimental.addFolder('PreScale')
    preScale.add(drawing.values, 'preX').min(0.1).max(10).step(0.01).onFinishChange(updateUrl)
    preScale.add(drawing.values, 'preY').min(0.1).max(10).step(0.01).onFinishChange(updateUrl)
    preScale.add(drawing.values, 'preZ').min(0.1).max(10).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Pre rotate
    const preRotate = experimental.addFolder('PreRotate')
    preRotate.add(drawing.values, 'preRotX').min(-180).max(180).step(0.1).onFinishChange(updateUrl)
    preRotate.add(drawing.values, 'preRotY').min(-180).max(180).step(0.1).onFinishChange(updateUrl)
    preRotate.add(drawing.values, 'preRotZ').min(-180).max(180).step(0.1).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Pre translate
    const preTranslate = experimental.addFolder('PreTranslate')
    preTranslate.add(drawing.values, 'preTranX').min(-42).max(42).step(0.1).onFinishChange(updateUrl)
    preTranslate.add(drawing.values, 'preTranY').min(-42).max(42).step(0.1).onFinishChange(updateUrl)
    preTranslate.add(drawing.values, 'preTranZ').min(-42).max(42).step(0.1).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Decimate
    const decimate = experimental.addFolder('Decimate')
    updaters.push(decimate.add(drawing.values, 'decimate'))
    decimate.add(drawing.values, 'dDistance').min(0.01).max(2).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Decimate
    const onOff = experimental.addFolder('On-Off')
    updaters.push(onOff.add(drawing.values, 'onoff'))
    updaters.push(onOff.add(drawing.values, 'ooDirection', ['flat', 'topDown', 'leftRight', 'middle', 'noise']))
    updaters.push(onOff.add(drawing.values, 'ooInvert'))
    onOff.add(drawing.values, 'ooMiddleDist').min(0).max(2000).step(1).onFinishChange(updateUrl)
    onOff.add(drawing.values, 'ooWeighting').min(0).max(2).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  The displacement
    const displacement1 = experimental.addFolder('Displacement1')
    displacement1.add(drawing.values, 'd1Amplitude').min(0).max(10).step(0.01).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1Resolution').min(0.1).max(20).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1xScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1yScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1zScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1xNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1yNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1zNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1AddTime').onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1TimeMod').min(0.1).max(16).step(0.01).onFinishChange(updateUrl)
    updaters.push(displacement1.add(drawing.values, 'd1Direction', ['normal', 'topDown', 'leftRight', 'middle', 'noise']))
    updaters.push(displacement1.add(drawing.values, 'd1Invert'))
    displacement1.add(drawing.values, 'd1MiddleDist').min(1).max(2000).step(1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1xShift').min(-60).max(60).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1yShift').min(-60).max(60).step(0.1).onFinishChange(updateUrl)
    displacement1.add(drawing.values, 'd1Weighting').min(0).max(2).step(0.01).onFinishChange(updateUrl)

    const displacement2 = experimental.addFolder('Displacement2')
    displacement2.add(drawing.values, 'd2Amplitude').min(0).max(10).step(0.01).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2Resolution').min(0.1).max(20).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2xScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2yScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2zScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2xNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2yNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2zNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2AddTime').onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2TimeMod').min(0.1).max(16).step(0.01).onFinishChange(updateUrl)
    updaters.push(displacement2.add(drawing.values, 'd2Direction', ['normal', 'topDown', 'leftRight', 'middle', 'noise']))
    updaters.push(displacement2.add(drawing.values, 'd2Invert'))
    displacement2.add(drawing.values, 'd2MiddleDist').min(1).max(2000).step(1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2xShift').min(-60).max(60).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2yShift').min(-60).max(60).step(0.1).onFinishChange(updateUrl)
    displacement2.add(drawing.values, 'd2Weighting').min(0).max(2).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  The rotation
    const rotation1 = experimental.addFolder('Rotation1')
    rotation1.add(drawing.values, 'rot1X').min(-360).max(360).step(0.01).onFinishChange(updateUrl)
    rotation1.add(drawing.values, 'rot1Y').min(-360).max(360).step(0.01).onFinishChange(updateUrl)
    rotation1.add(drawing.values, 'rot1Z').min(-360).max(360).step(0.01).onFinishChange(updateUrl)

    const rotation2 = experimental.addFolder('Rotation2')
    rotation2.add(drawing.values, 'rot2X').min(-360).max(360).step(0.01).onFinishChange(updateUrl)
    rotation2.add(drawing.values, 'rot2Y').min(-360).max(360).step(0.01).onFinishChange(updateUrl)
    rotation2.add(drawing.values, 'rot2Z').min(-360).max(360).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Dotify
    const dotifying = experimental.addFolder('Dotifying')
    dotifying.add(drawing.values, 'dotify').onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotAmplitude').min(0).max(30).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotResolution').min(0.1).max(20).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotxScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotyScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotzScale').min(0).max(8).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotxNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotyNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotzNudge').min(-100).max(100).step(0.1).onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotAddTime').onFinishChange(updateUrl)
    dotifying.add(drawing.values, 'dotTimeMod').min(0.1).max(16).step(0.01).onFinishChange(updateUrl)

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    //  Standard
    const standard = gui.addFolder('Standard')
    if (addAutoRedraw && addAutoRedraw === true) updaters.push(standard.add(drawing.values, 'autoRedraw'))
    standard.add(drawing.values, 'randomise')
    standard.add(drawing.values, 'redraw')
    standard.add(drawing.values, 'perspective').min(0.1).max(25).step(0.1).onFinishChange(updateUrl)
    updaters.push(standard.add(drawing.values, 'layout', Object.entries(page.layouts).map((layout) => layout[0])))
    standard.open()

    return {
      gui,
      updaters
    }
  },

  addStandardValues: (valuesObj, useAutoRedraw = true) => {
    valuesObj.pageWidth = page.size[0]
    valuesObj.pageHeight = page.size[1]
    valuesObj.sideMargin = 1.9
    valuesObj.topBottomMargin = 3
    valuesObj.drawMargin = false
    valuesObj.cropToMargin = true
    valuesObj.drawTicks = false

    valuesObj.useRoD = false
    valuesObj.leftMargin = 3.8
    valuesObj.topMargin = 6
    valuesObj.rightMargin = 3.8
    valuesObj.bottomMargin = 6
    valuesObj.RoDCropOutside = true
    valuesObj.drawRoD = false
    valuesObj.useCoD = false
    valuesObj.CoDx = page.size[0] / 2
    valuesObj.CoDy = page.size[1] / 2
    valuesObj.CoDSize = page.size[0] / 4
    valuesObj.CoDSides = 90
    valuesObj.CoDRotation = 0
    valuesObj.CoDCropOutside = true
    valuesObj.drawCoD = false
    valuesObj.useCoD2 = false
    valuesObj.d1xScale = 1
    valuesObj.d1yScale = 1
    valuesObj.d1zScale = 1
    valuesObj.CoD2x = page.size[0] / 2
    valuesObj.CoD2y = page.size[1] / 2
    valuesObj.CoD2Size = page.size[0] / 4
    valuesObj.CoD2Sides = 90
    valuesObj.CoD2Rotation = 0
    valuesObj.CoD2CropOutside = true
    valuesObj.drawCoD2 = false
    valuesObj.squarify = false
    valuesObj.layers = 1
    valuesObj.finalScale = 1

    valuesObj.preX = 1
    valuesObj.preY = 1
    valuesObj.preZ = 1

    valuesObj.preTranX = 0
    valuesObj.preTranY = 0
    valuesObj.preTranZ = 0

    valuesObj.preRotX = 0
    valuesObj.preRotY = 0
    valuesObj.preRotZ = 0

    valuesObj.decimate = false
    valuesObj.dDistance = 0.2

    valuesObj.onoff = false
    valuesObj.ooDirection = 'flat'
    valuesObj.ooInvert = false
    valuesObj.ooMiddleDist = 100
    valuesObj.ooWeighting = 1

    valuesObj.d1Amplitude = 0
    valuesObj.d1Resolution = 10
    valuesObj.d1xScale = 1
    valuesObj.d1yScale = 1
    valuesObj.d1zScale = 1
    valuesObj.d1xNudge = 50
    valuesObj.d1yNudge = -30
    valuesObj.d1zNudge = 23
    valuesObj.d1AddTime = true
    valuesObj.d1TimeMod = 1
    valuesObj.d1Direction = 'normal'
    valuesObj.d1Invert = false
    valuesObj.d1MiddleDist = 100
    valuesObj.d1xShift = 0
    valuesObj.d1yShift = 0
    valuesObj.d1Weighting = 1

    valuesObj.d2Amplitude = 0
    valuesObj.d2Resolution = 10
    valuesObj.d2xScale = 1
    valuesObj.d2yScale = 1
    valuesObj.d2zScale = 1
    valuesObj.d2xNudge = 50
    valuesObj.d2yNudge = -30
    valuesObj.d2zNudge = 23
    valuesObj.d2AddTime = true
    valuesObj.d2TimeMod = 1
    valuesObj.d2Direction = 'normal'
    valuesObj.d2Invert = false
    valuesObj.d2MiddleDist = 100
    valuesObj.d2xShift = 0
    valuesObj.d2yShift = 0
    valuesObj.d2Weighting = 1

    valuesObj.rot1X = 0
    valuesObj.rot1Y = 0
    valuesObj.rot1Z = 0
    valuesObj.rot2X = 0
    valuesObj.rot2Y = 0
    valuesObj.rot2Z = 0
    valuesObj.dotify = false
    valuesObj.dotAmplitude = 0
    valuesObj.dotResolution = 1
    valuesObj.dotxScale = 1
    valuesObj.dotyScale = 1
    valuesObj.dotzScale = 1
    valuesObj.dotxNudge = 0
    valuesObj.dotyNudge = 0
    valuesObj.dotzNudge = 0
    valuesObj.dotAddTime = false
    valuesObj.dotTimeMod = 1
    valuesObj.autoRedraw = useAutoRedraw
    valuesObj.perspective = 5
    valuesObj.layout = 'one up'

    return valuesObj
  },

  /**
   * The method to convert a {@link Line} or an array of {@link Line}s into SVG markup.
   * @param   {(Array|object)}  lines   An array of {@link Line} objects, or a single {@link Line} object
   * @param   {string}          id      The id to name the layer. NOTE: we don't actually name the layer (that would be a TODO:)
   * @returns {string}          The string representation of the SVG
   */
  svg: (lines, id, strokeWidth = 1.0) => {
    if (!Array.isArray(lines)) lines = [lines]
    let output = `
          <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" >
            `
    lines.forEach((line) => {
      const points = line.getPoints()
      if (line.mode === 'fill') output += '<path style="fill:#eeeeee;stroke:none" d="'
      if (line.mode === 'both') output += `<path style="fill:#eeeeee;stroke:#000000;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
      if (line.mode === 'stroke') output += `<path style="fill:none;stroke:#000000;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
      output += `M ${page.rounding(page.rounding(points[0].x) * 0.393701 * page.dpi)} ${page.rounding(page.rounding(points[0].y) * 0.393701 * page.dpi)} `
      for (let p = 1; p < points.length; p++) {
        output += `L ${page.rounding(page.rounding(points[p].x) * 0.393701 * page.dpi)} ${page.rounding(page.rounding(points[p].y) * 0.393701 * page.dpi)} `
      }
      output += `" />
      `
    })

    output += `
      </g>`
    return output
  },

  report: (allLines) => {
    //  Make sure what we have is an array
    if (!Array.isArray(allLines)) allLines = [allLines]
    //  Put all the lines into a new array
    let newLines = []
    allLines.forEach((line) => {
      //  If the entry is an array of lines we just join it to the newLines
      if (Array.isArray(line)) {
        newLines = [...newLines, ...line]
      } else {
        //  If it's not an array but a single line, then we push it it instead
        newLines.push(line)
      }
    })

    let totalLines = 0
    newLines.forEach((line) => {
      totalLines += line.getPoints().length - 1
    })
    const displayEl = document.getElementById('reportLines')
    if (displayEl) {
      displayEl.innerHTML = `Total lines: ${totalLines}`
      displayEl.style.background = 'rgba(0, 0, 0, 0.25)'
    }
  },

  /**
   * Empties out the print store
   */
  clearPrintStore: () => {
    page.printStore = {}
  },

  /**
   * Take an svg or an array of svgs and wraps them in the XML needed to export an SVG file
   * @param   {(Array|string)}  svgs      An array of svgs strings, or a single svg string
   * @param   {string}          id        A unique ID that we can use to reference this set of SVG files
   * @param   {string}          filename  The filename (without the trailing '.svg') to save the file as, if we are going to save it
   * @returns {string}                    Returns the wrapped svgs string, into a final SVG formatted text chunk
   */
  wrapSVG: (svgs, id = 'plot', filename, values) => {
    const newValues = {}
    // Loop through the values and copy them across, if they aren't a function
    Object.entries(values).forEach((entry) => {
      if (typeof entry[1] !== 'function') newValues[entry[0]] = entry[1]
    })

    if (!Array.isArray(svgs)) svgs = [svgs]
    let output = `<?xml version="1.0" standalone="no" ?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
        "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg version="1.1" id="${id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
        x="0" y="0"
        viewBox="0 0 ${page.size[0] * 0.393701 * page.dpi} ${page.size[1] * 0.393701 * page.dpi}"
        width="${page.size[0]}cm"
        height="${page.size[1]}cm" 
        xml:space="preserve">
        <metadata id="sketch-settings">
        ${JSON.stringify(newValues, null, 2)}
        </metadata>
        `
    svgs.forEach((svg) => {
      output += svg
    })
    output += '</svg>'

    page.printStore[id] = {
      output,
      filename
    }
    return page.printStore[id].output
  },

  /**
   * Function to "print" i.e. save the files down onto disk
   * @param {string} id The id of the layer to print
   */
  print: (id) => {
    if (page.printStore[id]) {
      page.download(`${page.printStore[id].filename}.svg`, page.printStore[id].output)
      console.log('Try using the following commands to optimise, start and resume plotting')
      console.log(`svgsort ${page.printStore[id].filename}.svg  ${page.printStore[id].filename}-opt.svg --no-adjust`)
      console.log(`axicli ${page.printStore[id].filename}-opt.svg --model 2 -o progress01.svg -s 30 --report_time`)
      console.log('axicli progress01.svg --model 2 -o progress02.svg -s 30 --report_time --mode res_plot')
    }
  },

  /**
   * Prints all the things in the printStore
   */
  printAll: () => {
    Object.entries(page.printStore).forEach((entry) => {
      page.print(entry[0])
    })
  },

  /**
   * Utility function to force the downloading of the text file, which is normally our SVG file
   * @param {string}  filename  The filename of the downloaded document
   * @param {string}  text      The text content of the files we want downloaded (normall the wrapped SVG)
   */
  download: (filename, text) => {
    const element = document.createElement('a')
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    //  Blob code via gec @3Dgec https://twitter.com/3Dgec/status/1226018489862967297
    element.setAttribute('href', window.URL.createObjectURL(new Blob([text], {
      type: 'text/plain;charset=utf-8'
    })))

    element.click()
    document.body.removeChild(element)
  }
}
