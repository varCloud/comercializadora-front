export interface Rol{
    idRol: number;         // Id_Rol
    nomRol: string;        // Nom_Rol
    idDpto: number;        // Id_Dpto
    idTipoJefe: number;    // Id_tipo_jefe
    activo: boolean;       // activo
    nomenclatura: string;  // nomenclatura
    idNivelDeRol: number;  // Id_Nivel_de_Rol  
}

export class RolModel {
    idRol: number;         // Id_Rol
    nomRol: string;        // Nom_Rol
    idDpto: number;        // Id_Dpto
    idTipoJefe: number;    // Id_tipo_jefe
    activo: boolean;       // activo
    nomenclatura: string;  // nomenclatura
    idNivelDeRol: number;  // Id_Nivel_de_Rol
  
    constructor(data: any) {
      this.idRol =data.idRol;
      this.nomRol =data.nomRol;
      this.idDpto =data.idDpto;
      this.idTipoJefe =data.idTipoJefe;
      this.activo =data.activo;
      this.nomenclatura =data.nomenclatura;
      this.idNivelDeRol =data.idNivelDeRol;
    }
}