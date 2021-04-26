/**
 * Studio Mutation Reducer - Responsible for client-side modifications
 * to studio info / roles. Stores in-progress and error states for updates,
 * and handles the network requests.
 *
 * This reducer DOES NOT store the value of the field being mutated,
 * or deal with loading that value initially from the server. That is
 * handled by the studio info and roles reducer.
 */
const keyMirror = require('keymirror');
const api = require('../lib/api');
const {selectUsername} = require('./session');
const {selectStudioId, selectStudioImage} = require('./studio');

const Errors = keyMirror({
    NETWORK: null,
    SERVER: null,
    INAPPROPRIATE: null,
    PERMISSION: null,
    THUMBNAIL_TOO_LARGE: null,
    THUMBNAIL_MISSING: null,
    UNHANDLED: null
});

const getInitialState = () => ({
    mutationErrors: {}, // { [field]: <error>, ... }
    isMutating: {} // { [field]: <boolean>, ... }
});

const studioMutationsReducer = (state, action) => {
    if (typeof state === 'undefined') {
        state = getInitialState();
    }

    switch (action.type) {
    case 'START_STUDIO_MUTATION':
        return {
            ...state,
            isMutating: {
                ...state.isMutating,
                [action.field]: true
            },
            mutationErrors: {
                ...state.mutationErrors,
                [action.field]: null
            }
        };
    case 'COMPLETE_STUDIO_MUTATION':
        return {
            ...state,
            isMutating: {
                ...state.isMutating,
                [action.field]: false
            },
            mutationErrors: {
                ...state.mutationErrors,
                [action.field]: action.error
            }
        };
    default:
        return state;
    }
};

// Action Creators
const startMutation = field => ({
    type: 'START_STUDIO_MUTATION',
    field
});

const completeMutation = (field, value, error = null) => ({
    type: 'COMPLETE_STUDIO_MUTATION',
    field,
    value, // Value is used by other reducers listening for this action
    error
});

// Selectors
const selectIsMutatingTitle = state => state.studioMutations.isMutating.title;
const selectIsMutatingDescription = state => state.studioMutations.isMutating.description;
const selectIsMutatingFollowing = state => state.studioMutations.isMutating.following;
const selectTitleMutationError = state => state.studioMutations.mutationErrors.title;
const selectDescriptionMutationError = state => state.studioMutations.mutationErrors.description;
const selectFollowingMutationError = state => state.studioMutations.mutationErrors.following;
const selectIsMutatingImage = state => state.studioMutations.isMutating.image;
const selectImageMutationError = state => state.studioMutations.mutationErrors.image;

// Thunks
/**
 * Given a response from `api.js`, normalize the possible
 * error conditions using the `Errors` object.
 * @param {object} err - error from api.js
 * @param {object} body - parsed body
 * @param {object} res - raw response from api.js
 * @returns {string} one of Errors.<TYPE> or null
 */
const normalizeError = (err, body, res) => {
    if (err) return Errors.NETWORK;
    if (res.statusCode === 401 || res.statusCode === 403) return Errors.PERMISSION;
    if (res.statusCode !== 200) return Errors.SERVER;
    try {
        if (body.errors.length > 0) {
            if (body.errors[0] === 'inappropriate-generic') return Errors.INAPPROPRIATE;
            if (body.errors[0] === 'thumbnail-too-large') return Errors.THUMBNAIL_TOO_LARGE;
            if (body.errors[0] === 'thumbnail-missing') return Errors.THUMBNAIL_MISSING;
            return Errors.UNHANDLED;
        }
    } catch (_) { /* No body.errors[], continue */ }
    return null;
};

const mutateStudioTitle = value => ((dispatch, getState) => {
    dispatch(startMutation('title'));
    api({
        host: '',
        uri: `/site-api/galleries/all/${selectStudioId(getState())}/`,
        method: 'PUT',
        useCsrf: true,
        json: {
            title: value
        }
    }, (err, body, res) => {
        const error = normalizeError(err, body, res);
        dispatch(completeMutation('title', value, error));
    });
});

const mutateStudioDescription = value => ((dispatch, getState) => {
    dispatch(startMutation('description'));
    api({
        host: '',
        uri: `/site-api/galleries/all/${selectStudioId(getState())}/`,
        method: 'PUT',
        useCsrf: true,
        json: {
            description: value
        }
    }, (err, body, res) => {
        const error = normalizeError(err, body, res);
        dispatch(completeMutation('description', value, error));
    });
});

const mutateFollowingStudio = shouldFollow => ((dispatch, getState) => {
    dispatch(startMutation('following'));
    const state = getState();
    const studioId = selectStudioId(state);
    const username = selectUsername(state);
    let uri = `/site-api/users/bookmarkers/${studioId}/`;
    uri += shouldFollow ? 'add/' : 'remove/';
    uri += `?usernames=${username}`;
    api({
        host: '',
        uri: uri,
        method: 'PUT',
        useCsrf: true
    }, (err, body, res) => {
        const error = normalizeError(err, body, res);
        dispatch(completeMutation('following', error ? !shouldFollow : shouldFollow, error));
    });
});

const mutateStudioImage = input => ((dispatch, getState) => {
    const state = getState();
    const studioId = selectStudioId(state);
    const currentImage = selectStudioImage(state);
    dispatch(startMutation('image'));
    const formData = new FormData();
    formData.append('file', input.files[0]);
    api({
        host: '',
        uri: `/site-api/galleries/all/${studioId}/`,
        method: 'POST',
        withCredentials: true,
        useCsrf: true,
        body: formData
    }, (err, body, res) => {
        const error = normalizeError(err, body, res);
        dispatch(completeMutation('image', error ? currentImage : body.thumbnail_url, error));
    });
});

module.exports = {
    getInitialState,
    studioMutationsReducer,
    Errors,

    // Thunks
    mutateStudioTitle,
    mutateStudioDescription,
    mutateFollowingStudio,
    mutateStudioImage,

    // Selectors
    selectIsMutatingTitle,
    selectIsMutatingDescription,
    selectIsMutatingFollowing,
    selectTitleMutationError,
    selectDescriptionMutationError,
    selectFollowingMutationError,
    selectIsMutatingImage,
    selectImageMutationError
};
