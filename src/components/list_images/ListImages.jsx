'use strict'

const React = require('react')
const InteractiveImage = require('../interactive_image/InteractiveImage')
const Pagination = require('../pagination/Pagination')

class ListImages extends React.Component {

    constructor(...args) {
        super(...args)
    }

    static get propTypes() {
        return {
            images: React.PropTypes.arrayOf(React.PropTypes.shape({
                src: React.PropTypes.string,
                thumb: React.PropTypes.string,
                tagsNum: React.PropTypes.number.isRequired,
            })).isRequired,
            totalPages: React.PropTypes.number.isRequired,
            totalItems: React.PropTypes.number.isRequired,
            itemsPerPage: React.PropTypes.number.isRequired,
            currentPage: React.PropTypes.number.isRequired,
            onImageClick: React.PropTypes.func.isRequired,
            onImageRemove: React.PropTypes.func.isRequired,
            onTagIconClick: React.PropTypes.func.isRequired,
            onPaginationChange: React.PropTypes.func.isRequired
        }
    }

    render() {
        let {images, onImageClick, onImageRemove, onTagIconClick} = this.props
        let interactiveImages = images.map((img, index) => {
            return (
                <div key={img.id} className="col-md-2 col-sm-3 col-xs-4">
                    <InteractiveImage
                        onClick={onImageClick}
                        onRemove={onImageRemove}
                        onTagIconClick={onTagIconClick}
                        className="img-thumbnail"
                        style={{}}
                        img={img}/>
                </div>
            )
        })
        return (
            <div className="row">
                {interactiveImages}
                <div className="col-sm-12">
                    <Pagination
                        display={this.props.images.length === 0 ? 'none' : 'block'}
                        totalItems={this.props.totalItems}
                        itemsPerPage={this.props.itemsPerPage}
                        totalPages={this.props.totalPages}
                        currentPage={this.props.currentPage}
                        onChange={(dir) => this.props.onPaginationChange(dir)}
                    />
                </div>
            </div>
        )
    }
}

module.exports = ListImages
