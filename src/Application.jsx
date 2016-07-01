'use strict'

const electron = window.require('electron')
const remote = electron.remote
const React = require('react')
const DropDownButton = require('./components/drop_down_button/DropDownButton')
const PageScanForImages = require('./components/page_scan_for_images/PageScanForImages')
const PageListImages = require('./components/page_list_images/PageListImages')
const PageManageTags = require('./components/page_manage_tags/PageManageTags')
const PageWithMessage = require('./components/page_with_message/PageWithMessage')
const Db = require('./lib/Db')

class Application extends React.Component {

    constructor(...args) {
        super(...args)

        this.state = {
            reportingMessage: null,
            button: {
                pages: {
                    'scan_for_images': 'Scan for images',
                    'list_images': 'List images',
                    'manage_tags': 'Manage tags'
                },
                selectedPage: 'scan_for_images',
                disabled: false
            }
        }

        this.tagsFilterCriteria = []

        this._disableMainButton = this._disableMainButton.bind(this)
        this._freezeAndShowMessage = this._freezeAndShowMessage.bind(this)
        this._goToPage = this._goToPage.bind(this)
        this._handleWindowKeyPress = this._handleWindowKeyPress.bind(this)
        this._handleScanningStart = this._handleScanningStart.bind(this)
        this._handleScannedImages = this._handleScannedImages.bind(this)
        this._handleOnLoadingImages = this._handleOnLoadingImages.bind(this)
        this._handleOnImagesLoaded = this._handleOnImagesLoaded.bind(this)
        this._handlePageManageTagsViewFilteredImages = this._handlePageManageTagsViewFilteredImages.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keypress', this._handleWindowKeyPress, false)
    }

    componentWillUnmount() {
        window.removeEventListener('keypress', this._handleWindowKeyPress)
    }

    _handleWindowKeyPress(e) {
        // on Ctrl+Shift+I : openDevTools()
        if (e.which === 9 && !!e.shiftKey && !!e.ctrlKey) {
            remote.getCurrentWindow().webContents.openDevTools()
        }
    }

    _goToPage(page) {
        let _state = Object.assign({}, this.state)
        _state.reportingMessage = null
        _state.button.disabled = false
        _state.button.selectedPage = page
        this.setState(_state)
    }

    _handleScanningStart(items) {
        this._freezeAndShowMessage('scanning images ...')
    }

    _handleScannedImages(images) {
        setTimeout(() => {// allow 500 ms just for the user to see previous message in case the scanning was too fast
            this._freezeAndShowMessage('saving images paths into database ...')
            Db.insertImages(images)
                .then(() => {
                    this._goToPage('list_images')
                })
                .catch((err) => {
                    console.error(err)
                })
        }, 500)
    }

    _handleOnLoadingImages() {
        setTimeout(() => this._disableMainButton(true), 0)
    }

    _handleOnImagesLoaded() {
        setTimeout(() => this._disableMainButton(false), 0)
    }

    _disableMainButton(bool) {
        let _state = Object.assign({}, this.state)
        _state.button.disabled = bool
        this.setState(_state)
    }

    _freezeAndShowMessage(message) {
        let _state = Object.assign({}, this.state)
        _state.button.disabled = true
        _state.reportingMessage = message
        this.setState(_state)
    }

    _handlePageManageTagsViewFilteredImages(tag) {
        this.tagsFilterCriteria = [tag] // we'll use this for next 'list_images' page then clear it back
        this._goToPage('list_images')
    }

    render() {
        const tagsFilterCriteria = [...this.tagsFilterCriteria]
        this.tagsFilterCriteria = []

        const page = this.state.reportingMessage ?
            <PageWithMessage>
                {this.state.reportingMessage}
            </PageWithMessage> :
            {
                'scan_for_images': <PageScanForImages
                    onScanningStart={this._handleScanningStart}
                    onScannedImages={this._handleScannedImages}
                />,
                'list_images': <PageListImages
                    onLoadingImages={this._handleOnLoadingImages}
                    onImagesLoaded={this._handleOnImagesLoaded}
                    onError={this._freezeAndShowMessage}
                    tagsFilterCriteria={tagsFilterCriteria}
                />,
                'manage_tags': <PageManageTags
                    onViewFilteredImages={this._handlePageManageTagsViewFilteredImages}
                />
            }[this.state.button.selectedPage]
        
        return (
            <div className="col-sm-12">
                <div className="v-space-30"></div>
                <div className="row">
                    <div className="col-sm-12 clearfix">
                        <DropDownButton className="pull-right"
                                        onAction={this._goToPage}
                                        actions={this.state.button.pages}
                                        selected={this.state.button.selectedPage}
                                        disabled={this.state.button.disabled}
                        />
                    </div>
                </div>
                <div className="v-space-15"></div>
                <div className="row">
                    <div className="col-sm-12">
                        {page}
                    </div>
                </div>
                <div className="v-space-30"></div>
            </div>
        )
    }
}

module.exports = Application
