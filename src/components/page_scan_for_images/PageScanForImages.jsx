'use strict'

const React = require('react')
const FileDrop = require('../file_drop/FileDrop.jsx')
const Utils = require('../../lib/Utils')

class PageScanForImages extends React.Component {

    constructor(...args) {
        super(...args)
        this._scanSelected = this._scanSelected.bind(this)
        this.state = {
            scanning: false
        }
    }

    static get propTypes() {
        return {
            onScannedImages: React.PropTypes.func.isRequired,
            onScanningStart: React.PropTypes.func.isRequired
        }
    }

    // pass over to parent those images found in specified directories
    _scanSelected(items) {
        this.props.onScanningStart(items)
        this.setState({scanning: true})
        let images = []

        items.forEach((path) => {
            images.push(...Utils.walk(path))
        })

        console.log(`scanned (${images.length})`)
        this.setState({scanning: false})
        this.props.onScannedImages(images)
    }

    render() {
        return (
            <div className="row">
                <div className="col-sm-12">
                    <FileDrop disabled={this.state.scanning} onSelected={this._scanSelected}/>
                </div>
            </div>
        )
    }
}

module.exports = PageScanForImages
