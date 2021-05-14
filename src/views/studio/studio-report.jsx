/* eslint-disable react/jsx-no-bind */
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import {selectStudioTitle, selectStudioDescription, selectStudioImage} from '../../redux/studio';

import Modal from '../../components/modal/base/modal.jsx';
import ModalTitle from '../../components/modal/base/modal-title.jsx';
import ModalInnerContent from '../../components/modal/base/modal-inner-content.jsx';
import StudioReportTile from './studio-report-tile.jsx';

import './studio.scss';

import {
    Fields,
    actions,
    selectors
} from '../../redux/studio-report';

const StudioReport = ({
    canReport,
    description,
    error,
    field,
    image,
    intl,
    isOpen,
    isSubmitting,
    previouslyReported,
    title,
    handleSetField,
    handleOpen,
    handleClose,
    handleSubmit
}) => {
    const handleChange = event => handleSetField(event.target.value);
    return (
        <div>
            {canReport && (
                <button onClick={handleOpen}><FormattedMessage id="general.report" /></button>
            )}
            {isOpen && (
                <Modal
                    isOpen
                    className="studio-report-modal"
                    onRequestClose={handleClose}
                >
                    <ModalTitle
                        className="studio-report-title"
                        title={intl.formatMessage({id: 'studio.reportThisStudio'})}
                    />
                    <ModalInnerContent
                        className="studio-report-inner"
                    >
                        <h3><FormattedMessage id="studio.reportThisStudio" /></h3>
                        <p><FormattedMessage id="studio.reportPleaseExplain" /></p>
                        <form onSubmit={handleSubmit}>
                            <StudioReportTile
                                handleChange={handleChange}
                                heading={intl.formatMessage({id: 'studio.title'})}
                                text={title}
                                value={Fields.TITLE}
                            />
                            <StudioReportTile
                                handleChange={handleChange}
                                heading={intl.formatMessage({id: 'studio.description'})}
                                text={description}
                                value={Fields.DESCRIPTION}
                            />
                            <StudioReportTile
                                handleChange={handleChange}
                                heading={intl.formatMessage({id: 'studio.thumbnail'})}
                                image={image}
                                value={Fields.THUMBNAIL}
                            />
                            <p><FormattedMessage id="studio.reportAreThereComments" /></p>
                            <button
                                className="button"
                                type="submit"
                                disabled={field === null || isSubmitting}
                            >
                                {isSubmitting && <FormattedMessage id="report.sending" />}
                                {!isSubmitting && <FormattedMessage id="report.send" />}
                            </button>
                        </form>
                    </ModalInnerContent>
                </Modal>
            )}
        </div>
    );
};

StudioReport.propTypes = {
    canReport: PropTypes.bool,
    error: PropTypes.string,
    field: PropTypes.string,
    intl: intlShape,
    isOpen: PropTypes.bool,
    isSubmitting: PropTypes.bool,
    previouslyReported: PropTypes.bool,
    handleOpen: PropTypes.func,
    handleClose: PropTypes.func,
    handleSetField: PropTypes.func,
    handleSubmit: PropTypes.func,
    image: PropTypes.string
};

export default connect(
    state => ({
        canReport: selectors.selectCanReportStudio(state),
        description: selectStudioDescription(state),
        error: selectors.selectStudioReportError(state),
        field: selectors.selectStudioReportField(state),
        image: selectStudioImage(state),
        isOpen: selectors.selectStudioReportOpen(state),
        isSubmitting: selectors.selectStudioReportSubmitting(state),
        previouslyReported: selectors.selectStudioReportSubmitted(state),
        title: selectStudioTitle(state)
    }),
    {
        handleOpen: actions.openStudioReport,
        handleClose: actions.closeStudioReport,
        handleSetField: actions.setStudioReportField,
        handleSubmit: actions.submitStudioReport
    }
)(injectIntl(StudioReport));
