'use strict'

const fs = window.require('fs')
const React = require('react')
const ReactDOM = require('react-dom')
const shallowCompare = require('react-addons-shallow-compare')
const ListImages = require('../list_images/ListImages.jsx')
const Pagination = require('../pagination/Pagination')
const Modal = require('../modal/Modal')
const PageManageTags = require('../page_manage_tags/PageManageTags')
const ListTagsRemovable = require('../list_tags_removable/ListTagsRemovable')
const Db = require('../../lib/Db')
const Utils = require('../../lib/Utils')

const IMAGES_PER_PAGE = 48
const TAGS_PER_AUTOCOMPLETE = 5


class PageListImages extends React.Component {

    constructor(...args) {
        super(...args)
        this.state = {
            images: [],
            communicatingWithDb: [], // a stack
            tagsFilterCriteria: this.props.tagsFilterCriteria || [],
            modal: {
                show: false,
                title: '',
                children: null
            },
        }

        this.currentPage = 0
        this.totalPages = 0
        this.totalImages = 0

        this._removeImage = this._removeImage.bind(this)
        this._modalShowImage = this._modalShowImage.bind(this)
        this._modalShowTagsEdit = this._modalShowTagsEdit.bind(this)
        this._modalClose = this._modalClose.bind(this)
        this._handlePaginationChange = this._handlePaginationChange.bind(this)
        this._removeTagFromFilterCriteria = this._removeTagFromFilterCriteria.bind(this)
        this._addTagToFilterCriteria = this._addTagToFilterCriteria.bind(this)
    }

    static get propTypes() {
        return {
            onLoadingImages: React.PropTypes.func,
            onImagesLoaded: React.PropTypes.func,
            onError: React.PropTypes.func,
            tagsFilterCriteria: React.PropTypes.arrayOf(React.PropTypes.shape({
                id: React.PropTypes.number,
                name: React.PropTypes.string
            }))
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState)
    }

    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.canvasContainer).appendChild(Utils.canvas)
        this._getImagesFromDb()
    }

    componentWillUnmount() {
        let el = ReactDOM.findDOMNode(this.refs.canvasContainer)
        el.firstChild && el.removeChild(el.firstChild)
    }

    _getImagesLimitOffset() {
        return {limit: IMAGES_PER_PAGE, offset: IMAGES_PER_PAGE * this.currentPage}
    }

    _removeImage(image) {
        this._addToDbBusyQueue()
        Db.removeImage(image.props.img.id)
            .then(() => {
                try {
                    fs.unlinkSync(image.props.img.thumb)
                } catch (err) {
                } // no op
                this._removeFromDbBusyQueue()
                this._getImagesFromDb()
            })
            .catch((err) => {
                console.error('error caught: ', err)
                this._removeFromDbBusyQueue()
                this.setState({
                    images: []
                }, () => {
                    this._getImagesFromDb()
                })

            })
    }

    _modalShowImage(image) {
        this.setState({
            modal: {
                children: <img src={image.props.img.src} style={{width: '100%', height: 'auto'}}/>,
                title: image.props.img.src,
                show: true
            }
        })
    }

    _modalShowTagsEdit(image) {
        this.setState({
            modal: {
                children: <PageManageTags
                    imageId={image.props.img.id}
                    searchLabel="Search tags"/>,
                title: 'Edit image tags',
                show: true
            }
        })
    }

    _modalClose(modal) {
        this.setState({
            modal: {
                show: false,
                title: '',
                children: null
            }
        }, () => this._getImagesFromDb())
    }

    _handlePaginationChange(dir) {
        this.currentPage += dir
        this.setState({
            images: [],
        }, () => this._getImagesFromDb())
    }

    _removeMissingImages(rows) {
        const toRemove = rows.filter((row) => {
            try{
                fs.lstatSync(row.src)
                return false
            } catch (err) {
                return true
            }
        })

        const hasRemovableImages = toRemove.length > 0

        hasRemovableImages && this._addToDbBusyQueue()

        hasRemovableImages && Promise.all(toRemove.map((row) => {
            return Db.removeImage(row.id)
        })).then(() => {
            toRemove.map((row) => {
                try {
                    fs.unlinkSync(Utils.thumbPath(row.hash))
                } catch (err) {
                } // no op
            })
            this._removeFromDbBusyQueue()
            this._getImagesFromDb()
        })
        return hasRemovableImages
    }

    _getImagesFromDb() {
        this.props.onLoadingImages && this.props.onLoadingImages()
        this._addToDbBusyQueue()
        Db.getImages(Object.assign({}, this._getImagesLimitOffset(), {filter: this.state.tagsFilterCriteria.map((t)=>t.name)}))
            .then((rows) => {
                if (this._removeMissingImages(rows.images)) {
                    this._removeFromDbBusyQueue()
                    return
                }
                this.totalImages = rows.total
                this.totalPages = rows.total === 0 ? 0 : parseInt(Math.ceil(rows.total / IMAGES_PER_PAGE)) - 1
                const images = []
                let lastPromise = ((rows) => {
                    return rows.reduce((p, row) => {
                        return p.then((data) => {
                            data && images.push(data)
                            return Utils.getOrCreateThumbnail(row)
                        })
                    }, Promise.resolve())
                })(rows.images)

                lastPromise.then((lastImage) => {
                    this.setState({
                        images: lastImage ? [...images, lastImage] : [...images]
                    }, () => {
                        this.props.onImagesLoaded && this.props.onImagesLoaded()
                        lastPromise = null
                    })
                    this._removeFromDbBusyQueue()
                })
            })
            .catch((err) => {
                this.props.onError && this.props.onError(err)
            })
    }

    _removeTagFromFilterCriteria(tag) {
        this.currentPage = 0
        this.setState({
            tagsFilterCriteria: this.state.tagsFilterCriteria.filter((t) => t.id !== tag.id),
            images: []
        }, () => this._getImagesFromDb())
    }

    _addTagToFilterCriteria(tag) {
        if (!this.state.tagsFilterCriteria.find((t) => t.id === tag.id)) {
            this.currentPage = 0
            this.setState({
                tagsFilterCriteria: [...this.state.tagsFilterCriteria, tag],
                images: []
            }, () => this._getImagesFromDb())
        }
    }

    _addToDbBusyQueue() {
        this.setState({
            communicatingWithDb: [...this.state.communicatingWithDb, 1] // push to stack
        })
    }

    _removeFromDbBusyQueue() {
        this.setState({
            communicatingWithDb: this.state.communicatingWithDb.slice(1) // pop from stack
        })
    }

    render() {
        const showCanvas = this.state.images.length === 0
        return (
            <div className="row">

                <div className="col-sm-12" >
                    <ListTagsRemovable title="Tags criteria" tags={this.state.tagsFilterCriteria}
                                       onRemove={this._removeTagFromFilterCriteria}/>
                    <PageManageTags
                        searchLabel="Filter images by tags"
                        isAutoComplete={true}
                        tagsPerPage={TAGS_PER_AUTOCOMPLETE}
                        onTagClick={this._addTagToFilterCriteria}>
                        {
                            showCanvas && this.state.communicatingWithDb.length > 0 ?
                                <i className="fa fa-cog fa-fw fa-spin" /> :
                                null
                        }
                        <div className="row">
                            <div className="col-sm-12" style={{display: showCanvas ? 'block' : 'none'}}>
                                <div ref="canvasContainer" style={{
                                    width: 110,
                                    height: 110,
                                    margin: '0px auto',
                                    //padding: '4px',
                                    //backgroundColor: '#fff',
                                    //border: '1px solid #ddd',
                                    //borderRadius: '4px'
                               }}></div>
                            </div>
                        </div>
                        <ListImages
                            images={this.state.images}
                            totalPages={this.totalPages}
                            totalItems={this.totalImages}
                            itemsPerPage={IMAGES_PER_PAGE}
                            currentPage={this.currentPage}
                            onImageClick={this._modalShowImage}
                            onImageRemove={this._removeImage}
                            onTagIconClick={this._modalShowTagsEdit}
                            onPaginationChange={this._handlePaginationChange}
                        />
                    </PageManageTags>
                </div>
                <Modal onClose={this._modalClose} visible={this.state.modal.show} title={this.state.modal.title}>
                    {this.state.modal.children}
                </Modal>
            </div>
        )
    }
}

module.exports = PageListImages
