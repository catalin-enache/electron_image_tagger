'use strict'

const Application = require('./Application')

const React = require('react')
const ReactDOM = require('react-dom')

function main() {
    ReactDOM.render(
        <Application />,
        document.querySelector('#application')
    )
}

main()