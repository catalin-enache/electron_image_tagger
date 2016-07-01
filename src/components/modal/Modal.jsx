'use strict'

const React = require('react')

class Modal extends React.Component {

    constructor(...args) {
        super(...args)
    }

    static get propTypes() {
        return {
            title: React.PropTypes.string.isRequired,
            visible: React.PropTypes.bool,
            onClose: React.PropTypes.func.isRequired
        }
    }

    render() {
        return (
            <div className="modal" style={{
            display: this.props.visible ? 'block' : 'none', 
            opacity: 1, 
            position: 'fixed',  
            overflow: 'scroll', 
            backgroundColor: 'rgba(0,0,0,0.5)',
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
           }}>
                <div className="modal-dialog" style={{
                margin: '150px auto 50px auto', 
                width: '75%' 
               }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button onClick={( e ) => this.props.onClose( this )} className="close" type="button">
                                <span>×</span>
                            </button>
                            <h4 className="modal-title" style={{wordBreak: 'break-all'}}>{this.props.title}</h4>
                        </div>
                        <div className="modal-body">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = Modal
