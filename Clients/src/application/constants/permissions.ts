const allowedRoles = {
    projects: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin', 'Editor'],
        editTeamMembers: ['Admin'],
    },
    projectRisks: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin', 'Editor']      
    },
    vendors: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin', 'Editor'],
        edit: ['Admin', 'Editor'],
        delete: ['Admin', 'Editor']     
    },
    frameworks: {
        view: ['Admin', 'Editor', 'Auditor'],    
        edit: ['Admin', 'Editor'],    
        manage: ['Admin', 'Editor'],
        audit: [ 'Auditor']
    },
    organizations: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin'],
        edit: ['Admin'],    
    },
    training: {
        view: ['Admin', 'Editor', 'Auditor'],
        create: ['Admin'],
        edit: ['Admin'], 
        delete: ['Admin'] 
    }
}

export default allowedRoles;
