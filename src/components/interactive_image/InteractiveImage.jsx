'use strict'

const React = require('react')
const Db = require('../../lib/Db')
const electron = window.require('electron')
const remote = electron.remote
const shell = electron.shell
const menu = new remote.Menu()
menu.append(
    new remote.MenuItem({
        label: 'Show in File Explorer',
        click: () => {
            //remote.getCurrentWindow().blur()
            shell.showItemInFolder(contextImage.props.img.src)
        }
    })
)

let contextImage = null

class InteractiveImage extends React.Component {

    constructor() {
        super(...arguments)
        this.state = {
            removing: false
        }
        this._onRemove = this._onRemove.bind(this)
    }

    static get propTypes() {
        return {
            onClick: React.PropTypes.func.isRequired,
            onRemove: React.PropTypes.func.isRequired,
            onTagIconClick: React.PropTypes.func.isRequired,
            img: React.PropTypes.shape({
                src: React.PropTypes.string.isRequired,
                thumb: React.PropTypes.string.isRequired,
                tagsNum: React.PropTypes.number.isRequired,
            })
        }
    }

    _onRemove(e) {
        this.setState({
            removing: true
        }, () => {
            this.props.onRemove(this)
        })
    }

    render() {
        const {style, onClick, onRemove, onTagIconClick, img, ...rest} = this.props
        const imgStyle = Object.assign({}, style, {
                cursor: 'pointer',
                height: 100,
                width: '100%',
                marginBottom: 15
            }
        )
        if (img.tagsNum === 0) {
            imgStyle.backgroundColor = '#ddd'
        }

        return (
            <div style={{position: 'relative'}}>
                <img onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            contextImage = this
                            menu.popup(remote.getCurrentWindow())
                       }}
                     src={img.thumb}
                     onClick={(e) => {onClick(this)}}
                     style={imgStyle}
                    {...rest} />
                <div className="imageIconsContainer"
                     style={{
                        left: 7,
                        top: 5,
                   }}>
                    {
                        this.state.removing ?
                            <span style={{cursor: 'default'}}><i className="fa fa-cog fa-fw fa-spin" /></span> :
                            <span onClick={this._onRemove} className="glyphicon glyphicon-remove"/>
                    }


                </div>
                <div className="imageIconsContainer"
                     style={{
                        right: 7,
                        top: 5,
                   }}>
                    <span onClick={(e) => {onTagIconClick(this)}}>
                        <span style={{fontSize: '10px', verticalAlign: 'top'}}>{this.props.img.tagsNum}</span>
                        &nbsp;
                        <span  className="glyphicon glyphicon-tag"/>
                    </span>

                </div>
            </div>
        )
    }
}

module.exports = InteractiveImage
