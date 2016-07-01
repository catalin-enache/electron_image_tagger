'use strict'

const React = require('react')
const _ = require('lodash')

class InputDebounce extends React.Component {

    constructor(...args) {
        super(...args)
        // read defaultValue only in constructor
        this.state = {internalValue: this.props.defaultValue}
        this.debounced = undefined
        this._handleOnChange = this._handleOnChange.bind(this)
    }

    static get propTypes() {
        return {
            type: React.PropTypes.string,
            defaultValue: React.PropTypes.string,
            onChange: React.PropTypes.func,
            debounce: React.PropTypes.number
        }
    }

    static get defaultProps() {
        return {
            type: 'text',
            debounce: 500,
            defaultValue: ''
        }
    }

    _handleOnChange(e) {
        window.clearTimeout(this.debounced)
        this.setState({
            internalValue: e.target.value
        }, () => {
            this.debounced = window.setTimeout(() => {
                this.props.onChange && this.props.onChange(this.state.internalValue)
            }, this.props.debounce)
        })
    }

    render() {
        const {onChange, defaultValue, ...rest} = this.props
        return (
            <input
                value={this.state.internalValue}
                onChange={this._handleOnChange}
                {...rest}
            />
        )
    }
}

module.exports = InputDebounce
