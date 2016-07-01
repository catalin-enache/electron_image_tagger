'use strict'

const React = require('react')
const electron = window.require('electron')
const remote = electron.remote

const MESSAGES = {
    true: 'scanning ...',
    false: 'Drop your files or directories here or'
}

class FileDrop extends React.Component {

    constructor(...args) {
        super(...args)
        this._handleDragOver = this._handleDragOver.bind(this)
        this._handleDragLeave = this._handleDragLeave.bind(this)
        this._handleDragEnd = this._handleDragEnd.bind(this)
        this._handleDrop = this._handleDrop.bind(this)
        this._handleButtonClick = this._handleButtonClick.bind(this)
    }

    static get propTypes() {
        return {
            onSelected: React.PropTypes.func.isRequired,
            disabled: React.PropTypes.bool
        }
    }

    _handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation()
    }

    _handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation()
    }

    _handleDragEnd(e) {
        e.preventDefault();
        e.stopPropagation()
    }

    _handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
        const selected = Array.from(e.dataTransfer.files).map((item) => item.path)
        this.props.onSelected(selected)
    }

    _handleButtonClick() {
        var selected = remote.dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']})
        selected && this.props.onSelected(selected)
    }

    render() {
        return (
            <div onDragOver={this._handleDragOver}
                 onDragLeave={this._handleDragLeave}
                 onDragEnd={this._handleDragEnd}
                 onDrop={this._handleDrop}
                 style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    border: '3px dashed black',
                    height: 200,
                    width: '100%',
                    display: 'table',
                }}
            >
                <div style={{
                    display: 'table-cell',
                    padding: 15,
                    textAlign: 'center',
                    verticalAlign: 'middle',
               }}>
                    <span> {MESSAGES[this.props.disabled]} </span><br />
                    <button onClick={this._handleButtonClick} type="button" className="btn btn-default"
                            disabled={this.props.disabled}> Open Directories
                    </button>
                </div>
            </div>
        )
    }
}


module.exports = FileDrop
