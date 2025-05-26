const allowedRoles = {
    projects: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor', 'Auditor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin'],
        editTeamMembers: ['Admin'],
    },
    projecrRisks: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin', 'Editor']      
    },
}

export default allowedRoles;
