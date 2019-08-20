import Logger from '@yaireo/console-colors'
import _ from 'lodash'
var glcanvas = document.getElementById('gl')
glcanvas.width = window.innerWidth;
glcanvas.height = window.innerHeight;

var data =
  `<svg crosssorigin="anonymous" xmlns="http://www.w3.org/2000/svg" width="${glcanvas.width}" height="${glcanvas.height}">
  <foreignObject  crosssorigin="anonymous"  width="100%" height="100%">
  <div xmlns="http://www.w3.org/1999/xhtml"  crosssorigin="anonymous"  style="font-size:78px; position: absolute; top:100px" >
  <em>I</em> like <span style="color:white; text-shadow:0 0 2px blue;">cheese</span><span style="color:yellow; text-shadow:0 0 2px blue;"> in WebGL</span>
  </div>
  </foreignObject>'
  </svg>`

var DOMURL = window.URL || window.webkitURL || window

var img = new Image()
var svg = new Blob([data], {
  type: 'image/svg+xml;charset=utf-8',
})

var reader = new FileReader()
reader.readAsDataURL(svg)

reader.onload = function(e) {
  var svgDataURL = e.target.result
  img.src = svgDataURL
  DOMURL.revokeObjectURL(svgDataURL)
}

img.onload = function() {
  startRegl(img)
}

const glslify = require('glslify')
const baboon = require('baboon-image')

function startRegl(img) {
  require('regl')({
    pixelRatio: 1,
    canvas: glcanvas,
    onDone: (err, regl) => {
      run(regl)
    },
  })
  const n = 50000
  function run(regl) {
    var imageTexture = regl.texture(img)
    const drawPointsFromTexture = regl({
      frag: `
  precision mediump float;
  uniform sampler2D texture;
  varying vec2 vUv;
  void main () {
    gl_FragColor = texture2D(texture, vUv);
  }`,

      vert: `
  precision mediump float;
  attribute vec2 position;
  varying vec2 vUv;
  void main () {
    vec2 uv = position;
    uv.x = 1.- uv.x;
    vUv = uv;
    gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
  }`,

      attributes: {
        position: [-2, 0, 0, -2, 2, 2],
      },

      uniforms: {
        texture: imageTexture,
      },

      count: 3,
    })
    drawPointsFromTexture({})
  }
}
