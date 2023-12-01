import {
  new_oklab,
  new_rgb,
  oklab_to_css_string,
  oklab_to_rgb,
  range,
} from 'oklab.ts'
import { label, input, div, span, watch, canvas } from 'dom-proxy'

const { random, floor, min, max, sqrt, pow, exp, E, log } = Math
const win = window as any

declare const slidersContainer: HTMLElement
declare const colorCode: HTMLElement
declare const colorCanvas: HTMLCanvasElement

let oklab = new_oklab()
let rgb = new_rgb()

function slider(options: {
  label: 'L' | 'a' | 'b'
  range: { min: number; max: number; range: number }
}) {
  let rangeInput = input({
    type: 'range',
    min: options.range.min.toString(),
    max: options.range.max.toString(),
    value: '0',
  })
  let colorBarCanvas = canvas({ className: 'color-bar' })
  let container = label({ className: 'slider' }, [
    span({}, [options.label]),
    div({ className: 'input-container' }, [colorBarCanvas, rangeInput]),
  ])

  slidersContainer.appendChild(container.node)
  let rect = colorBarCanvas.getBoundingClientRect()
  let width = rect.width - 8
  colorBarCanvas.style.width = width + 'px'
  rangeInput.style.width = width + 'px'
  // width = width / 3
  colorBarCanvas.width = width
  colorBarCanvas.height = 1
  rangeInput.step = (options.range.range / width).toString()
  rangeInput.value = (options.range.min + options.range.range / 2).toString()

  const colorBarContext = colorBarCanvas.getContext('2d')!
  const colorBarImageData = colorBarContext.getImageData(0, 0, width, 1)
  const colorBarData = colorBarImageData.data

  function drawColorBar() {
    oklab.L = LSlider.rangeInput.valueAsNumber
    oklab.a = aSlider.rangeInput.valueAsNumber
    oklab.b = bSlider.rangeInput.valueAsNumber
    for (let w = 0; w < width; w++) {
      let i = w * 4
      oklab[options.label] =
        (w / width) * options.range.range + options.range.min
      oklab_to_rgb(oklab, rgb)
      colorBarData[i + R] = rgb.r
      colorBarData[i + G] = rgb.g
      colorBarData[i + B] = rgb.b
      colorBarData[i + A] = 255
    }
    colorBarContext.putImageData(colorBarImageData, 0, 0)
  }

  let isMouseDown = false
  colorBarCanvas.onmousedown = event => {
    isMouseDown = true
    handleMouseEvent(event)
  }
  window.addEventListener('mouseup', () => {
    isMouseDown = false
  })
  window.addEventListener('mousemove', event => {
    if (!isMouseDown) return
    handleMouseEvent(event)
  })
  function handleMouseEvent(event: MouseEvent) {
    let x = event.clientX - rect.left
    let rate = x / width
    rangeInput.value = (
      options.range.min +
      options.range.range * rate
    ).toString()
  }

  return { rangeInput, drawColorBar }
}

let LSlider = slider({ label: 'L', range: range.L })
let aSlider = slider({ label: 'a', range: range.a })
let bSlider = slider({ label: 'b', range: range.b })

const R = 0
const G = 1
const B = 2
const A = 3

const colorContext = colorCanvas.getContext('2d')!
const colorImageData = colorContext.getImageData(0, 0, 1, 1)
const colorData = colorImageData.data

function drawColor() {
  oklab.L = LSlider.rangeInput.valueAsNumber
  oklab.a = aSlider.rangeInput.valueAsNumber
  oklab.b = bSlider.rangeInput.valueAsNumber
  oklab_to_rgb(oklab, rgb)
  colorCode.textContent = oklab_to_css_string(oklab)
  const i = 0
  colorData[i + R] = rgb.r
  colorData[i + G] = rgb.g
  colorData[i + B] = rgb.b
  colorData[i + A] = 255
  colorContext.putImageData(colorImageData, 0, 0)
}

watch(drawColor)
watch(LSlider.drawColorBar)
watch(aSlider.drawColorBar)
watch(bSlider.drawColorBar)

Object.assign(win, {
  canvas: colorCanvas,
  context: colorContext,
  imageData: colorImageData,
  data: colorData,
})
