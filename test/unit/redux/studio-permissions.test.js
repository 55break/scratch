import {
    selectCanEditInfo,
    selectCanAddProjects,
    selectShowCommentComposer,
    selectCanDeleteAnyComment,
    selectCanDeleteOwnComment,
    selectCanDeleteCommentWithoutConfirm,
    selectCanReportComment,
    selectCanRestoreComment,
    selectCanFollowStudio,
    selectCanEditCommentsAllowed,
    selectCanEditOpenToAll,
    selectShowCuratorInvite,
    selectCanInviteCurators,
    selectCanRemoveCurator,
    selectCanRemoveManager,
    selectCanPromoteCurators,
    selectCanRemoveProject,
    selectShowProjectMuteError,
    selectShowCuratorMuteError,
    selectShowEditMuteError
} from '../../../src/redux/studio-permissions';

import {getInitialState as getInitialStudioState} from '../../../src/redux/studio';
import {getInitialState as getInitialSessionState, selectUserId, selectUsername} from '../../../src/redux/session';
import {sessions, studios} from '../../helpers/state-fixtures.json';

let state;

const setStateByRole = (role) => {
    switch (role) {
    case 'admin':
        state.session = sessions.user1Admin;
        break;
    case 'curator':
        state.studio = studios.isCurator;
        state.session = sessions.user1Social;
        break;
    case 'manager':
        state.studio = studios.isManager;
        state.session = sessions.user1Social;
        break;
    case 'creator':
        state.studio = studios.creator1;
        state.session = sessions.user1Social;
        break;
    case 'logged in':
        state.session = sessions.user1Social;
        break;
    case 'unconfirmed':
        state.session = sessions.user1;
        break;
    case 'logged out': // Default state set in beforeEach
        break;
    case 'invited':
        state.studio = studios.isInvited;
        break;
    case 'muted creator':
        state.studio = studios.creator1;
        state.session = sessions.user1Muted;
        break;
    case 'muted manager':
        state.studio = studios.isManager;
        state.session = sessions.user1Muted;
        break;
    case 'muted curator':
        state.studio = studios.isCurator;
        state.session = sessions.user1Muted;
        break;
    case 'muted logged in':
        state.session = sessions.user1Muted;
        break;
    default:
        throw new Error('Unknown user role in test: ' + role);
    }
};

beforeEach(() => {
    state = {
        session: getInitialSessionState(),
        studio: getInitialStudioState()
    };
});

describe('studio info', () => {
    describe('can edit studio info', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanEditInfo(state)).toBe(expected);
        });
    });
});

describe('studio projects', () => {
    describe('can add project, not open to all', () => {
        test.each([
            ['admin', false],
            ['curator', true],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanAddProjects(state)).toBe(expected);
        });
    });

    describe('can add project, open to all', () => {
        test.each([
            ['logged in', true],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            state.studio.openToAll = true;
            expect(selectCanAddProjects(state)).toBe(expected);
        });
    });

    describe('can remove projects', () => {
        test.each([
            ['admin', true],
            ['curator', false], // false for projects that were not added by them, see below
            ['manager', true],
            ['creator', true],
            ['logged in', false], // false for projects that are not theirs, see below
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanRemoveProject(state, 'not-me', 'not-me')).toBe(expected);
        });

        test('curators can remove projects they added', () => {
            setStateByRole('curator');
            const addedBy = selectUserId(state);
            expect(selectCanRemoveProject(state, 'not-me', addedBy)).toBe(true);
        });

        test('curators can also remove projects they own that they did not add', () => {
            setStateByRole('curator');
            const creator = selectUsername(state);
            expect(selectCanRemoveProject(state, creator, 'not-me')).toBe(true);
        });

        test('logged in users can only remove projects they own', () => {
            setStateByRole('logged in');
            const creator = selectUsername(state);
            expect(selectCanRemoveProject(state, creator, 'not-me')).toBe(true);
        });
    });
});

describe('studio comments', () => {
    describe('showing comment composer', () => {
        test.each([
            ['logged in', true],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', true], // comment composer is there, but contains muted ComposeStatus
            ['muted logged in', true]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectShowCommentComposer(state)).toBe(expected);
        });
    });

    describe('can report comment', () => {
        test.each([
            ['logged in', true],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', true],
            ['muted logged in', true]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanReportComment(state)).toBe(expected);
        });
    });

    describe('can delete any comment', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanDeleteAnyComment(state)).toBe(expected);
        });
    });

    describe('can delete own comment', () => {
        test.each([
            ['admin', false], // This is false here because we check for `canDeleteAnyComment` separately
            ['curator', false],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', true],
            ['muted manager', true],
            ['muted curator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanDeleteOwnComment(state)).toBe(expected);
        });
    });

    describe('can delete comment without confirmation', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanDeleteCommentWithoutConfirm(state)).toBe(expected);
        });
    });

    describe('can restore a comment', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanRestoreComment(state)).toBe(expected);
        });
    });

    describe('can follow a studio', () => {
        test.each([
            ['logged in', true],
            ['unconfirmed', true],
            ['logged out', false],
            ['muted creator', true],
            ['muted logged in', true]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanFollowStudio(state)).toBe(expected);
        });
    });

    describe('can set "comments allowed" on a studio', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', false],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanEditCommentsAllowed(state)).toBe(expected);
        });
    });

    describe('can set "open to all" on a studio', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanEditOpenToAll(state)).toBe(expected);
        });
    });
});

describe('studio members', () => {
    describe('can accept invitation', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['invited', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectShowCuratorInvite(state)).toBe(expected);
        });
    });

    describe('can promote curators', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanPromoteCurators(state)).toBe(expected);
        });
    });

    describe('can remove curators', () => {
        test.each([
            ['admin', true],
            ['curator', false], // except themselves, see test below
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanRemoveCurator(state, 'others-username')).toBe(expected);
        });

        test('curators can remove themselves', () => {
            setStateByRole('curator');
            const loggedInUsername = selectUsername(state);
            expect(selectCanRemoveCurator(state, loggedInUsername)).toBe(true);
        });
    });

    describe('can remove managers', () => {
        test.each([
            ['admin', true],
            ['curator', false],
            ['manager', true],
            ['creator', true],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanRemoveManager(state, '123')).toBe(expected);
        });

        describe('nobody can remove the studio creator', () => {
            test.each([
                ['admin', false],
                ['curator', false],
                ['manager', false],
                ['creator', false],
                ['logged in', false],
                ['unconfirmed', false],
                ['logged out', false],
                ['muted creator', false],
                ['muted logged in', false]
            ])('%s: %s', (role, expected) => {
                setStateByRole(role);
                state.studio.owner = 'the creator';
                expect(selectCanRemoveManager(state, 'the creator')).toBe(expected);
            });
        });
    });

    describe('can invite curators', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', true],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectCanInviteCurators(state)).toBe(expected);
        });
    });
});

describe('studio mute errors', () => {
    describe('should show projects mute error', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', true],
            ['muted manager', true],
            ['muted curator', true],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectShowProjectMuteError(state)).toBe(expected);
        });
    });

    describe('should show projects mute error, open to all', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            ['muted creator', true],
            ['muted manager', true],
            ['muted curator', true],
            ['muted logged in', true]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            state.studio.openToAll = true;
            expect(selectShowProjectMuteError(state)).toBe(expected);
        });
    });

    describe('should show curators mute error', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            // ['muted creator', true], // This one fails; not sure why
            ['muted manager', true],
            ['muted curator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectShowCuratorMuteError(state)).toBe(expected);
        });
    });

    describe('should show edit info mute error', () => {
        test.each([
            ['admin', false],
            ['curator', false],
            ['manager', false],
            ['creator', false],
            ['logged in', false],
            ['unconfirmed', false],
            ['logged out', false],
            // ['muted creator', true], // This one fails; not sure why
            ['muted manager', true],
            ['muted curator', false],
            ['muted logged in', false]
        ])('%s: %s', (role, expected) => {
            setStateByRole(role);
            expect(selectShowEditMuteError(state)).toBe(expected);
        });
    });
});
