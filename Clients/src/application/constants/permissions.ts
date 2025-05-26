const allowedRoles = {
    projects: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor', 'Auditor'],
        edit: ['Admin', 'Editor'],
        delete: [''],
        editTeamMembers: [''],
    },
}

export default allowedRoles;
