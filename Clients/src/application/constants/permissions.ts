const allowedRoles = {
    projects: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor', 'Auditor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin'],
        editTeamMembers: ['Admin'],
    }
}

export default allowedRoles;
