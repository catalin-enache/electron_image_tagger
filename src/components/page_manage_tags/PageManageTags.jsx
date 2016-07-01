'use strict'

// This component can be used
// - as auto-complete inside a different page (e.g. PageListImages) if (this.props.isAutoComplete)
// - inside a modal (e.g. Modal in PageListImages) if (this.props.imageId !== undefined), 
// - as standalone page if (this.props.imageId === undefined && !this.props.isAutoComplete), 
// so it has three distinct behaviours

const React = require('react')
const ReactDOM = require('react-dom')
const Db = require('../../lib/Db')
const _ = require('lodash')
const Pagination = require('../pagination/Pagination')
const ListTagsRemovable = require('../list_tags_removable/ListTagsRemovable')
const InputDebounce = require('../input_debounce/InputDebounce')


class PageManageTags extends React.Component {

    constructor() {
        super(...arguments)
        this.state = {
            tagsAvailable: [],
            tagsForImage: [],
            newTagName: '',
            communicatingWithDb: [], // a stack
            editingTag: {id: null, value: null, scope: null},
            removingTagId: -1,
            selectedTag: 0
        }

        this.currentPage = 0
        this.totalPages = 0
        this.totalTags = 0
        this.componentMounted = false

        this._handleAddNewTagButtonOnClick = this._handleAddNewTagButtonOnClick.bind(this)
        this._handleNewTagOnChange = this._handleNewTagOnChange.bind(this)
        this._onWindowClick = this._onWindowClick.bind(this)
        this._handleEditingTagOnChange = this._handleEditingTagOnChange.bind(this)
        this._handleWindowKeyDown = this._handleWindowKeyDown.bind(this)
        this._handleTagsAvailablePageChange = this._handleTagsAvailablePageChange.bind(this)
        this._detachTag = this._detachTag.bind(this)
        this._addToDbBusyQueue = this._addToDbBusyQueue.bind(this)
        this._removeFromDbBusyQueue = this._removeFromDbBusyQueue.bind(this)
    }

    static get propTypes() {
        return {
            imageId: React.PropTypes.number,
            isAutoComplete: React.PropTypes.bool,
            tagsPerPage: React.PropTypes.number,
            onTagClick: React.PropTypes.func,
            searchLabel: React.PropTypes.string,
            onViewFilteredImages: React.PropTypes.func
        }
    }

    static get defaultProps() {
        return {
            isAutoComplete: false,
            tagsPerPage: 12,
            searchLabel: 'Add tag',
        }
    }

    componentDidMount() {
        this.componentMounted = true
        window.addEventListener('keydown', this._handleWindowKeyDown, false)
        window.addEventListener('click', this._onWindowClick, false)
        this._getTags()
    }

    componentWillUnmount() {
        this.componentMounted = false
        window.removeEventListener('keydown', this._handleWindowKeyDown)
        window.removeEventListener('click', this._onWindowClick)
    }

    setState(...args) {
        this.componentMounted && super.setState(...args)
    }

    _getTagsAvailableLimitOffset() {
        return {limit: this.props.tagsPerPage, offset: this.props.tagsPerPage * this.currentPage}
    }

    _handleWindowKeyDown(e) {
        switch (e.which) {
            case 13: // on Enter
                switch (true) {
                    case !!this.state.editingTag.id:  // if currently editing some tag
                        this._updateTag()
                        break
                    case this.props.isAutoComplete && this.state.tagsAvailable.length > 0:
                        this._handleTagClick(this.state.tagsAvailable[this.state.selectedTag])
                        break
                    default: // add new tag if is not autocomplete and inputText is focused
                        !this.props.isAutoComplete && document.activeElement === ReactDOM.findDOMNode(this.refs.inputText) && this._handleAddNewTagButtonOnClick()
                }
                break
            case 38: // on up arrow
                var selectedTag = this.state.selectedTag
                if (selectedTag > 0) {
                    selectedTag--
                } else {
                    selectedTag = this.state.tagsAvailable.length - 1
                }
                this.setState({
                    selectedTag: selectedTag
                })
                break;
            case 40: // on down arrow
                var selectedTag = this.state.selectedTag
                if (selectedTag < this.state.tagsAvailable.length - 1) {
                    selectedTag++
                } else {
                    selectedTag = 0
                }
                this.setState({
                    selectedTag: selectedTag
                })
                break
        }
    }

    _handleTagsAvailablePageChange(dir) {
        this.currentPage += dir
        this._getTags()
    }

    _handleNewTagOnChange(value) {
        const _value = value.toLowerCase().slice(0, Db.TAG_NAME_LENGTH)
        this.setState({
            newTagName: _value
        }, () => {
            this.currentPage = 0
            this._getTags()
        })
    }

    _handleEditingTagOnChange(e) {
        const value = e.target.value.toLowerCase().slice(0, Db.TAG_NAME_LENGTH)
        this.setState({
            editingTag: Object.assign({}, this.state.editingTag, {value: value})
        })
    }

    _onWindowClick(e) {
        this.setState({
            editingTag: {id: null, value: null, scope: null},
            tagsAvailable: this.props.isAutoComplete ? [] : this.state.tagsAvailable
        })
    }

    _handleAddNewTagButtonOnClick(e) {
        if (this.canAddTag) {
            this._addToDbBusyQueue()
            Db.insertTag(this.newTagName)
                .then(() => {
                    this._removeFromDbBusyQueue()
                    this._getTags()
                })
                .catch((err) => {
                    console.error('error caught: ', err)
                    this._removeFromDbBusyQueue()
                })
        }

    }

    _handleClickOnEdit(tag, e) {
        e && e.stopPropagation()
        this.setState({
            editingTag: {id: tag.id, value: tag.name, scope: 'edit'}
        })
    }

    _handleTagClick(tag) {
        this.props.isAutoComplete && this.setState({
            tagsAvailable: [],
            newTagName: ''
        }, () => {
            this.props.onTagClick && this.props.onTagClick(tag)
        })
    }

    _attachTag(tag, e) {
        e.stopPropagation()
        if (this.props.imageId) {
            this._addToDbBusyQueue()
            Db.insertImageTag(this.props.imageId, tag.id)
                .then(() => {
                    this._removeFromDbBusyQueue()
                    this._getTags()
                })
                .catch((err) => {
                    console.error('error caught: ', err)
                    this._removeFromDbBusyQueue()
                })
        }
    }

    _detachTag(tag) {
        if (this.props.imageId) {
            this._addToDbBusyQueue()
            Db.removeImageTag(this.props.imageId, tag.id)
                .then(() => {
                    this._removeFromDbBusyQueue()
                    this._getTags()
                })
                .catch((err) => {
                    console.error('error caught: ', err)
                    this._removeFromDbBusyQueue()
                })
        }
    }

    _updateTag(tag, e) {
        e && e.stopPropagation()
        this._addToDbBusyQueue()
        Db.updateTag({id: this.state.editingTag.id, name: this.editingTagValue})
        .then(() => {
            this._removeFromDbBusyQueue()
            this._getTags()
        })
        .catch((err) => {
            console.error('error caught: ', err)
            this._removeFromDbBusyQueue()
        })
    }

    _removeTag(tag, e) {
        e && e.stopPropagation()
        this._addToDbBusyQueue()
        this.setState({
            editingTag: {id: tag.id, value: tag.name, scope: 'remove'}
        })
        Db.removeTag(tag.id)
            .then(() => {
                this._removeFromDbBusyQueue()
                this._getTags()
            })
            .catch((err) => {
                console.error('error caught: ', err)
                this._removeFromDbBusyQueue()
            })
    }

    _getTags() {
        this._addToDbBusyQueue()
        return Db.getTagsForImage(this.props.imageId)
            .then((tagsForImage) => {
                const tagsAvailableLimitOffset = this._getTagsAvailableLimitOffset()
                return Db.getTagsAvailable({
                    nameLike: this.newTagName,
                    limit: tagsAvailableLimitOffset.limit,
                    offset: tagsAvailableLimitOffset.offset
                })
                    .then((tagsAvailable) => {
                        this.totalTags = tagsAvailable.total
                        this.totalPages = tagsAvailable.total === 0 ? 0 : parseInt(Math.ceil(tagsAvailable.total / this.props.tagsPerPage)) - 1
                        const _tagsAvailable = this.props.isAutoComplete && !this.newTagName ? [] :
                            // update tagsAvailable only if this is the latest call
                            this.state.communicatingWithDb.length <= 1 ? tagsAvailable.tags : this.state.tagsAvailable
                        this.setState({
                            // do not display tags when is autocomplete and not searching for anything
                            tagsAvailable: _tagsAvailable,
                            tagsForImage: tagsForImage,
                            editingTag: {id: null, value: null, scope: null},
                            selectedTag: 0,
                        })
                        this._removeFromDbBusyQueue()
                        return Promise.all([tagsAvailable, tagsForImage])
                    })
                    .catch((err) => {
                        console.error('error caught: ', err)
                        this._removeFromDbBusyQueue()
                    })
            })
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

    _viewFilteredImages(tag) {
        this.props.onViewFilteredImages && this.props.onViewFilteredImages(tag)
    }

    get newTagName() {
        return _.trim(this.state.newTagName)
    }

    get editingTagValue() {
        return _.trim(this.state.editingTag.value)
    }

    get canAddTag() {
        return !this.state.communicatingWithDb.length > 0 &&
            this.newTagName &&
            (!this.state.tagsAvailable.length || !this.state.tagsAvailable.some((tag) => tag.name === this.newTagName))
    }

    render() {

        const canAddTag = this.canAddTag
        const isAutoComplete = this.props.isAutoComplete

        const liStyle = Object.assign({}, {
            position: 'relative',
        }, isAutoComplete && {
                borderRadius: 0,
                cursor: 'pointer'
            }
        )

        const tagsForImageSection = this.props.imageId === undefined ?
            null :
            <ListTagsRemovable title="Attached tags" tags={this.state.tagsForImage} onRemove={this._detachTag}/>

        const tagsAvailable = isAutoComplete && !this.newTagName ? [] :
            this.state.tagsAvailable.map((tag, idx) => {
                const currentHandlingTag = tag.id === this.state.editingTag.id
                const currentHandlingTagAndBusy = currentHandlingTag && this.state.communicatingWithDb.length > 0
                
                const attachable = this.props.imageId === undefined ?
                    null :
                    this.state.tagsForImage.findIndex((_tag) => _tag.id === tag.id) >= 0 ?
                        null :
                        <span onClick={this._attachTag.bind(this, tag)} className="glyphicon glyphicon-plus"/>

                // is dangerous to have removable when displaying tags that are to be attached to an image
                // in that case we only allow the user to edit newly added tag
                // removing tags is allowed only in stand alone page
                const removable = isAutoComplete || this.props.imageId !== undefined ?
                    null :
                    <span onClick={this._removeTag.bind(this, tag)} className="glyphicon glyphicon-remove"/>

                const editable = isAutoComplete ? null : currentHandlingTag ?
                    <span onClick={this._updateTag.bind(this, tag)}
                          className="glyphicon glyphicon-ok"/> :
                    <span onClick={this._handleClickOnEdit.bind(this, tag)}
                          className="glyphicon glyphicon-pencil"/>

                // if used in its own stand alone page we can have a view icon which we can use to ask Application to show images for tag
                const viewable = !isAutoComplete && this.props.imageId === undefined ?
                    <span onClick={this._viewFilteredImages.bind(this, tag)}
                          className="glyphicon glyphicon-eye-open"/> :
                    null

                const tagContent = currentHandlingTag && this.state.editingTag.scope === 'edit' ?
                    <input type="text" className="form-control" value={this.state.editingTag.value}
                           onChange={this._handleEditingTagOnChange} onClick={(e)=>{e.stopPropagation()}}
                           style={{height: '18px'}}
                           ref={(el)=>{el && el.focus()}}/> :
                    <span style={{cursor: 'default'}}>{tag.name}</span>

                const _liStyle = Object.assign({}, liStyle)
                if (this.state.selectedTag === idx) _liStyle.backgroundColor = '#eee'

                const busyDB =
                    <span className="glyphicon" style={{top: 0, cursor: 'default'}} >
                        <i className="fa fa-circle-o-notch fa-spin " style={{}} />
                    </span>

                return (
                    <li key={tag.id} className="clearfix list-group-item" style={_liStyle}
                        onClick={this._handleTagClick.bind(this, tag)}>
                        <span className="badge">{_.padStart(tag.imagesNum, 5, '0')}</span>
                        {!currentHandlingTagAndBusy ? removable : null}
                        {!currentHandlingTagAndBusy ? editable : null}
                        {!currentHandlingTagAndBusy ? viewable : null}
                        {!currentHandlingTagAndBusy ? attachable : null}
                        {currentHandlingTagAndBusy ? busyDB : null}
                        <div style={{
                            position: 'absolute', right: '160px', left: '10px'
                       }}>
                            {tagContent}
                        </div>
                    </li>
                )
            })

        const tagsAvailableBodyStyle = !isAutoComplete ? {} : {
            position: 'absolute',
            right: 0,
            left: 0,
            top: 33,
            zIndex: 2
        }

        const pagination = isAutoComplete ? null :
            <Pagination
                totalItems={this.totalTags}
                itemsPerPage={this.props.tagsPerPage}
                totalPages={this.totalPages}
                currentPage={this.currentPage}
                onChange={this._handleTagsAvailablePageChange}
            />

        const tagsAvailableBody =
            <div style={tagsAvailableBodyStyle}>
                <ul className="list-group">
                    {tagsAvailable}
                </ul>
                {pagination}
            </div>

        const panelBody = isAutoComplete ? this.props.children : tagsAvailableBody

        const tagsAvailableSection =
            <div className="panel panel-default">
                <div className="panel-heading">
                    <div className="panel-title">
                        <div className="input-group">
                            <span
                                className="input-group-addon"
                                style={{cursor: 'default'}}>
                                {this.props.searchLabel}
                                &nbsp;
                                {
                                    this.state.communicatingWithDb.length > 0 ?
                                        <i className="fa fa-cog fa-fw fa-spin" /> :
                                        <i className="fa fa-fw fa-caret-right" />
                                }
                            </span>
                            <div style={{display: 'table-cell', width: '100%', position: 'relative'}}>
                                <div style={{display: 'table', width: '100%'}}>
                                    <InputDebounce
                                        ref="inputText"
                                        debounce={300}
                                        onChange={this._handleNewTagOnChange}
                                        type="text"
                                        className="form-control"
                                        placeholder="tag name ..."/>
                                </div>
                                {isAutoComplete ? tagsAvailableBody : null }
                            </div>
                            <span
                                onClick={this._handleAddNewTagButtonOnClick}
                                className="input-group-addon"
                                style={{
                                    display: isAutoComplete ? 'none' : 'table-cell',
                                    cursor: canAddTag ? 'pointer' : 'default'
                                }}>
                                {canAddTag ? 'Add new tag' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="panel-body">
                    {panelBody}
                </div>
            </div>
        
        return (
            <div className="row">
                <div className="col-sm-12">
                    {tagsForImageSection}
                    {tagsAvailableSection}
                </div>
            </div>
        )
    }
}

module.exports = PageManageTags
