"use strict"

const electron = window.require('electron')
const remote = electron.remote
const fs = window.require('fs')
const path = window.require('path')
const crypto = require('crypto')

const CANVAS_WIDTH = 100
const CANVAS_HEIGHT = 100
const THUMBNAILS_PATH = path.resolve(remote.getGlobal('__appDir'), 'thumbnails')

// We prefer native lib now (instead of previously used Image()) due to browser memory leak
// when programmatically changing image.src over and over again
const canvas = document.createElement('canvas')
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT
const context = canvas.getContext('2d')
const imageData = context.createImageData(canvas.width, canvas.height)

const sharp = window.require('sharp')

const Utils = {
    thumbPath(hash) {
        return path.join(THUMBNAILS_PATH, hash + '.jpg')
    },
    canvas: canvas,
    // not following symlinks | accepts either one file or one dir
    walk (dir, filter = /(\.jpg|\.jpeg|\.png|\.svg|\.gif)$/i) {
        // if dir is file return [ dir ]
        let stat = fs.lstatSync(dir)
        if (!stat) {
            return []
        }
        if (!stat.isDirectory() && !stat.isSymbolicLink()) {
            if (dir.match(filter)) {
                return [dir]
            } else {
                return []
            }
        }
        // else retrieve files in dir
        var results = []
        var list = fs.readdirSync(dir)
        list.forEach((file) => {
            file = path.join(dir, file)
            var stat = fs.lstatSync(file)
            if (stat && stat.isDirectory()) results = results.concat(this.walk(file))
            else if (!stat.isSymbolicLink() && file.match(filter)) results.push(file)
        })
        return results
    },

    // !!! must not be called concurrently as canvas is shared; this is intentional design !!!
    getOrCreateThumbnail(img) {
        return new Promise((resolve, reject) => {
            const thumbPath = this.thumbPath(img.hash)
            try {
                // if thumb exists return early
                fs.lstatSync(thumbPath)
                resolve(Object.assign({}, img, {thumb: thumbPath}))
            } catch (err) {
                // using sharp ( c++ lib ) approach
                const _sharp = sharp(img.src) // , {raw: {width: 100, height: 100, channels: 4}}
                _sharp.background({r: 255, g: 255, b: 255, a: 1}) // prepare background for further alpha channel merge
                _sharp.flatten() // merge with background; used for png to force white background; will reduce channels to 3 - if there were 4;
                _sharp.resize(100, 100) // do resize
                _sharp.raw() // prepare for buffer
                _sharp.toBuffer((err, buffer, info) => { // get buffer so we can draw it to browser canvas
                    const bytes = new Uint8Array(buffer)
                    // iterate over bytes but remember that bytes are shorter than imageData.data.length
                    // specifically bytes are 3/4 of imageData.data.length due to missing alpha/fourth byte
                    for (let i = 0, j = 0; i < bytes.length; i++) {
                        imageData.data[j] = bytes[i]
                        // the buffer doesn't have alpha/fourth byte
                        if (!(( i + 1 ) % 3)) { // so we detect alpha/fourth byte incoming
                            // and artificially insert alpha/fourth byte and set it to full opaque
                            imageData.data[++j] = 255
                        }
                        j++ // sync with i
                    }
                    context.putImageData(imageData, 0, 0)
                    _sharp.jpeg() // prepare for jpeg export
                    _sharp.toFile(thumbPath, function (err) {
                        // make canvas 'disappear'
                        context.fillStyle = '#fff'
                        context.fillRect(0, 0, canvas.width, canvas.height)
                        resolve(Object.assign({}, img, {thumb: thumbPath}))
                    })
                })
            }
        })
    }
}

// works with:
//  - import utils from './Utils'
// export default Utils

// works with: 
//  - import utils from './Utils'
//  - const utils = require('./Utils') // not window.require
module.exports = Utils
