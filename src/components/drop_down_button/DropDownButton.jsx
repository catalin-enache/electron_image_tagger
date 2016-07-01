'use strict'

const React = require('react')


class DropDownButton extends React.Component {

    static get propTypes() {
        return {
            onAction: React.PropTypes.func.isRequired,
            actions: React.PropTypes.object.isRequired,
            selected: React.PropTypes.string.isRequired,
            disabled: React.PropTypes.bool
        }
    }

    constructor(...args) {
        super(...args)
        this.toggle = this.toggle.bind(this)
        this.toggleOff = this.toggleOff.bind(this)
        this.handleButtonOnClick = this.handleButtonOnClick.bind(this)
        this.handleLinkOnClick = this.handleLinkOnClick.bind(this)
        this.state = {
            opened: false
        }
    }

    toggle() {
        this.setState({
            opened: !this.state.opened
        })
    }

    toggleOff() {
        this.state.opened && this.setState({
            opened: false
        })
    }

    componentDidMount() {
        window.addEventListener('click', this.toggleOff)
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.toggleOff)
    }

    handleButtonOnClick(e) {
        e.preventDefault()
        e.stopPropagation()
        this.toggle()
    }

    handleLinkOnClick(e) {
        e.preventDefault()
        e.stopPropagation()
        this.toggle()
        this.props.onAction(e.target.dataset.action)
    }

    render() {
        let {actions, selected, disabled, onAction, className, ...rest} = this.props
        let children = Object.keys(actions).map((action) => {
            return (
                <li key={ action }>
                    <a onClick={ this.handleLinkOnClick } data-action={ action } href="#">{ actions[action] }</a>
                </li>
            )
        })

        return (
            <div className={`${className} dropdown`} { ...rest }>
                <button
                    onClick={ this.handleButtonOnClick }
                    className="btn btn-default dropdown-toggle"
                    type="button"
                    disabled={ disabled }>
                    { actions[selected] || 'Actions' } <span className="caret"></span>
                </button>
                <ul
                    className="dropdown-menu"
                    style={ { display: !disabled && this.state.opened ? 'block' : 'none' } }>
                    { children }
                </ul>
            </div>
        )
    }
}

module.exports = DropDownButton
