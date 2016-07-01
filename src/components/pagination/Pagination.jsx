'use strict'

const React = require('react')

class Pagination extends React.Component {

    static get propTypes() {
        return {
            display: React.PropTypes.string,
            totalPages: React.PropTypes.number.isRequired, // zero based
            currentPage: React.PropTypes.number.isRequired, // zero based
            totalItems: React.PropTypes.number.isRequired,
            itemsPerPage: React.PropTypes.number.isRequired,
            onChange: React.PropTypes.func.isRequired
        }
    }

    static get defaultProps() {
        return {
            display: 'block'
        }
    }

    render() {
        const prevDisabled = this.props.currentPage === 0
        const nextDisabled = this.props.currentPage === this.props.totalPages
        const rangeStart = this.props.currentPage * this.props.itemsPerPage + 1
        const rangeEnd = Math.min(rangeStart + this.props.itemsPerPage, this.props.totalItems)
        return (
            <div style={{display: this.props.display}}>
                <nav style={{display: 'inline-block'}}>
                    <ul className="pagination margin-top-none margin-bottom-none">
                        <li className={prevDisabled ? 'disabled' : ''}>
                            <a onClick={( e ) => {
                            e.preventDefault()
                            !prevDisabled && this.props.onChange( -this.props.currentPage )
                       }} href="#"><span>&larr;</span></a>
                        </li>
                        <li className={prevDisabled ? 'disabled' : ''}>
                            <a onClick={( e ) => {
                            e.preventDefault()
                            !prevDisabled && this.props.onChange( -1 )
                       }} href="#"><span>&laquo;</span></a>
                        </li>
                        <li className="active">
                            <span href="#"> {this.props.currentPage + 1} </span>
                        </li>
                        <li className={nextDisabled ? 'disabled' : ''}>
                            <a onClick={( e ) => {
                            e.preventDefault()
                            !nextDisabled && this.props.onChange( 1 )
                       }} href="#"><span>&raquo;</span></a>
                        </li>
                        <li className={nextDisabled ? 'disabled' : ''}>
                            <a onClick={( e ) => {
                            e.preventDefault()
                            !nextDisabled && this.props.onChange( this.props.totalPages - this.props.currentPage )
                       }} href="#"><span>&rarr;</span></a>
                        </li>
                    </ul>
                </nav>
                &nbsp;&nbsp;&nbsp;
                <span style={{fontSize: '12px', fontStyle: 'italic', color: '#aaa', float: 'right', marginTop: '21px'}}>
                    &nbsp; showing &nbsp;
                    <span style={{fontWeight: 'bold', color: '#444'}}>{rangeStart} - {rangeEnd}</span>
                    &nbsp; from &nbsp;
                    <span style={{fontWeight: 'bold', color: '#444'}}>{this.props.totalItems}</span>
                </span>
            </div>

        )
    }
}

module.exports = Pagination
