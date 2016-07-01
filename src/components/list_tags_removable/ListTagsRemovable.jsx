'use strict'

const React = require('react')

class ListTagsRemovable extends React.Component {

    constructor(...args) {
        super(...args)
    }

    static get propTypes() {
        return {
            tags: React.PropTypes.arrayOf(React.PropTypes.shape({
                name: React.PropTypes.string,
                id: React.PropTypes.number
            })).isRequired,
            onRemove: React.PropTypes.func.isRequired,
            title: React.PropTypes.string.isRequired
        }
    }

    render() {
        const tags = this.props.tags.map((tag) => {
            const detachable = <span onClick={() => {this.props.onRemove( tag )}}
                                     className="glyphicon glyphicon glyphicon-minus"
                                     style={{top: '0px', marginRight: '0px', marginLeft: '10px'}}/>
            return (
                <li key={tag.id}
                    className="clearfix list-group-item pull-left"
                    style={{borderRadius: '6px', marginRight: '6px', marginBottom: '6px', boxShadow: '0 1px 2px rgba(0, 0, 0, .075)'}}>
                    {detachable}
                    <div style={{lineHeight: 1, float: 'left'}}>
                        <span style={{cursor: 'default'}}>{tag.name}</span>
                    </div>
                </li>
            )
        })

        return (
            <div className="panel panel-default">
                <div className="panel-heading">
                    <div className="panel-title">{this.props.title}</div>
                </div>
                <div className="panel-body">
                    <ul className="list-group clearfix"
                        style={{borderRadius: '0px', boxShadow: 'none', marginBottom: '0px'}}>
                        {tags}
                    </ul>
                </div>
            </div>
        )
    }
}

module.exports = ListTagsRemovable
