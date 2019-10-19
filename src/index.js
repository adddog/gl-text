import Logger from '@yaireo/console-colors'
import reglCamera from 'regl-camera'
import {rotate} from './glsl'
import _ from 'lodash'

var loadSvg = require('load-svg')
var parsePath = require('extract-svg-path').parse
var perspective = require('gl-mat4').perspective
var lookAt = require('gl-mat4').lookAt
var svgMesh3d = require('svg-mesh-3d')

var glcanvas = document.getElementById('gl')
glcanvas.width = window.innerWidth
glcanvas.height = window.innerHeight

var DOMURL = window.URL || window.webkitURL || window

var img = new Image()
var regl

img.onload = function() {
  run(regl)
}

function calcImg(text = 'DEMO') {
  var data = `<svg crosssorigin="anonymous" xmlns="http://www.w3.org/2000/svg" width="${
    glcanvas.width
  }" height="${glcanvas.height}">
  <foreignObject  crosssorigin="anonymous"  width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml"  crosssorigin="anonymous"  style="font-size:78px; position: absolute; top:100px" >
    <span style="color:yellow; text-shadow:0 0 2px blue;font-size: 120px; font-family:fantasy;">WebGL ${text}</span>
  </div>
  </foreignObject>'
  </svg>`
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
}

const glslify = require('glslify')

function startRegl(img) {
  require('regl')({
    pixelRatio: 1,
    canvas: glcanvas,
    onDone: (err, rg) => {
      regl = rg
    },
  })
  const n = 50000
}

function run(regl) {
  var imageTexture = regl.texture(img)

  const drawPointsFromTexture = regl({
    frag: `
          precision mediump float;
          uniform sampler2D texture;
          varying vec2 vUv;
          void main () {
            gl_FragColor = texture2D(texture, vUv);
          }
      `,

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

function run2(regl, mesh) {
  var camera = reglCamera(regl, {
    damping: 0,
    preventDefault: true,
    phi: 0.0,
    theta: 1.5,
    distance: 2.4,
  })

  const drawPointsFromTexture = regl({
    vert: `
        precision mediump float;
        // uniform mat4 projection, view, model;
        uniform vec3 eye, translate;
        uniform mat4 projection, view, model;
        uniform float tick;

        attribute vec3 position;
        varying vec3 vUv;

        ${rotate}
        void main () {
          vec3 p = position * vec3(1.,-1.,1);
          float t = tick*0.16;
          vec2 nP = p.xy;
          nP *= 2.0;
          nP -= 1.0;
          p.x += sin(t + sin(nP.x)) * 0.05;
          p.y += cos(t + cos(nP.y)) * 0.03;

          vUv = p;
          mat4 m = model;
          m *= rotationMatrix(vec3(1.,0.,0.), sin(t) * 0.02);
          m *= rotationMatrix(vec3(0.,1.,0.), cos(t) * 0.02);
          gl_Position = projection * view * m*  vec4(p, 1);
        }
    `,
    frag: `
          precision mediump float;
          uniform sampler2D texture;
          varying vec3 vUv;
          uniform float tick;
          uniform mat4 view;

          void main () {
          float t = tick * 0.3;
          float r = fract(vUv.x * 20. * cos(t * vUv.x) )* cos(t);
          float g = vUv.y * 20. * sin(t * vUv.y) * sin(t);
          float b = 1.;//fract(1.)* tan(t);
          gl_FragColor = vec4(r, g, b, 1);
  }
  `,

    uniforms: {
      eye: regl.context('eye'),
      tick: regl.context('tick'),
      model: function() {
        var c = [0, 0.08, 0]
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -c[0], -c[1], -c[2], 1]
      },
      // projection: function(context) {
      //   return perspective(
      //     [],
      //     Math.PI / 4,
      //     context.viewportWidth / context.viewportHeight,
      //     0.01,
      //     1000.0,
      //   )
      // },
      // view: function(context, props) {
      //   return lookAt([], props.eye, props.target, [0, 1, 0])
      // },
    },
    attributes: {
      // here we are using 'positions' proeprty of the mesh
      position: mesh.positions,
    },

    // and same for the cells
    elements: mesh.cells,
  })

  regl.frame(data => {
    camera(() => {
      drawPointsFromTexture({})
    })
  })
}

startRegl()
//calcImg()
setTimeout(() => {
  //calcImg('MEEE')
}, 2000)

loadSvg('assets/logo.svg', function(err, svg) {
  if (err) throw err

  var svgPath = parsePath(svg)
  var mesh = svgMesh3d(svgPath, {
    delaunay: false,
    scale: 4,
  })
  run2(regl, mesh)
})
