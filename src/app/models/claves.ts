import { Rol, RolModel } from "./roles";

export interface Claves {
    numUsuario: number;
    numEmp: number;
    idRol: number;
    jefe?: Claves;
    nombreCompleto: string;
    rol?: Rol;
    autorizo?: number;
  }
  


export class ClavesModel implements Claves {
    numUsuario: number;
    numEmp: number;
    idRol: number;
    nombreCompleto: string;
    rol?: Rol;
    jefe?: Claves;
    autorizo?: number;
    constructor(data?: any) {
      this.numUsuario = data?.numUsuario ?? data.Numusuario ?? 0;
      this.numEmp = data?.numEmp || 0;
      this.idRol = data?.idRol || 0;
      this.nombreCompleto = data?.nombreCompleto || ''; 
      this.rol = data?.Rol ? new RolModel(data?.Rol)  : this.rol 
      this.jefe = data?.Jefe ? new ClavesModel(data?.Jefe) : this.jefe
      this.autorizo = data?.autorizo || 0
    }
  }