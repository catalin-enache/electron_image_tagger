'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

class PageWithMessage extends React.Component {

    render() {
        return (
            <div className="row">
                <div className="col-sm-12">
                    {this.props.children}
                </div>
            </div>
        )
    }
}

module.exports = PageWithMessage
