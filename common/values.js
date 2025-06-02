/* global history page drawing */

const makeSeeds = () => {
  const seeds = []
  for (let s = 0; s < 100; s++) {
    seeds.push(Math.random())
  }
  return seeds
}
// eslint-disable-next-line no-unused-vars
let seeds = makeSeeds()

// eslint-disable-next-line no-unused-vars
const Values = function (valuesObj) {
  Object.entries(valuesObj).forEach((p) => {
    this[p[0]] = p[1]
  })

  //  Check to see if we have been passed any values in the URL, if
  //  we have then read them in here
  const urlParams = new URLSearchParams(window.location.search)
  for (const p of urlParams.entries()) {
    const key = p[0]
    const value = p[1]
    if (key in this) {
      //  If we don't have a number, then it may be a string
      //  or a true/false
      if (isNaN(parseFloat(value))) {
        if (value === 'true') this[key] = true
        if (value === 'false') this[key] = false
        if (value !== 'true' && value !== 'false') {
          //  Force dashes '-' in strings to be converted to spaces
          this[key] = value.replace(/-/g, ' ')
        }
      } else {
        //  Otherwise grab the numeric value
        this[key] = parseFloat(value)
      }
    }
  }

  this.randomise = () => {
    seeds = makeSeeds() // Make seeds is from the source script
    page.clear()
    drawing.drawSingleFrame = true
    drawing.buildLines()
  }

  //  Toggle the redraw on/off when clicked
  this.redraw = () => {
    page.clear()
    drawing.drawSingleFrame = true
    drawing.buildLines()
  }

  //  Print button makes use print :)
  this.save_SVG = () => {
    page.printAll()
  }

  this.makeUrl = () => {
    const params = []
    Object.entries(drawing.values).forEach((p) => {
      const key = p[0]
      const value = p[1]
      if (typeof (value) === 'number') params.push(`${key}=${parseInt(value * 100, 10) / 100}`) // <--- Ugh, lol.
      if (typeof (value) === 'boolean') params.push(`${key}=${value}`)
      //  Force spaces in strings to be converted to dashes '-'
      if (typeof (value) === 'string') params.push(`${key}=${value.replace(/ /g, '-')}`)
    })
    const newUrl = `${params.join('&')}`
    return newUrl
  }
  //  Turns all the values into a new URL string we can
  //  use to pass around the url and give other people
  //  the same settings.
  this.urlValues = () => {
    const params = []
    Object.entries(drawing.values).forEach((p) => {
      const key = p[0]
      const value = p[1]
      if (typeof (value) === 'number') params.push(`${key}=${parseInt(value * 100, 10) / 100}`) // <--- Ugh, lol.
      if (typeof (value) === 'boolean') params.push(`${key}=${value}`)
      //  Force spaces in strings to be converted to dashes '-'
      if (typeof (value) === 'string') params.push(`${key}=${value.replace(/ /g, '-')}`)
    })
    const newUrl = `${window.location.origin}${window.location.pathname}?${params.join('&')}`
    history.replaceState({
      id: 'page'
    }, null, newUrl)
  }

  this.makeFilename = (start) => {
    let filename = start
    Object.entries(drawing.values).forEach((p) => {
      const value = p[1]
      if (typeof (value) !== 'function') {
        if (typeof (value) === 'string') {
          //  Force spaces in strings to be converted to dashes '-'
          filename += `_${value.replace(/ /g, '-')}`
        } else {
          if (value === true) filename += '_t'
          if (value === false) filename += '_f'
          if (value !== true && value !== false) filename += `_${parseInt(value * 100, 10) / 100}`
        }
      }
    })
    return filename
  }
}
