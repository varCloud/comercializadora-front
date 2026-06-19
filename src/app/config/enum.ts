export enum enumEstatusEvaluacionAsignacion{
    SIN_CONTESTAR = 1,
    CONTESTADA = 2,
    PENDIENTE = 3
}

/**
 * Tipos de usuario en la aplicación Body Booster
 * Utilizado en el parámetro `userType` del payload de login
 */
export enum UserTypeEnum {
    ATHLETE = 1,
    CREATOR = 2,
    PROSPECT = 3,
    ADMIN = 4,
    SUPER_USER_APP = 5
}