export interface Utilisateur {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'caissier' | 'admin';
    actif: boolean;
    date_creation: string;
    date_modification: string;
}

export interface UtilisateurLogin {
    email: string;
    mot_de_passe: string;
}

export interface UtilisateurRegister {
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
}