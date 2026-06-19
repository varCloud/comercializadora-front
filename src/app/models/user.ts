import { DepartamentoModel } from "./departamento.model";
import { RolModel } from "./roles";

export interface User {
    numusuario: number;
    usuario?: string;
    numemp: number;
    autorizo: number;
    correo?: string;
    nombreS: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    fechaCambioContrasena: Date;
    contrasenaEncriptada?: string;
    idDeSucursal: number;
    cierre: string;
    ctaDeud?: string;
    permisos?: string;
    permisosRespaldo?: string;
    idArea: number;
    notaCal?: string;
    aviso1Cal?: string;
    aviso2Cal?: string;
    aviso1Estado?: string;
    aviso2Estado?: string;
    leyendaFicha?: string;
    contrasena: string;
    nomMaquina?: string;
    gafeteImpreso?: string;
    gafeteFecha?: Date;
    nss?: string;
    idCcostosNomina?: number;
    idGeneroWoccu?: number;
    correoExterno?: string;
    permisosCYC?: string;
    idDpto?: number;
    idRol?: number;
    idBloqueo: number;
    objetivo?: string;
    numusuarioJefe?: number;
    idTicket?: number;
    idProceso?: number;
    idAccion?: number;
    comodin?: number;
    pathDfs?: string;
    firma?: boolean;
    Rol?: RolModel;
    Departamento?: DepartamentoModel;
  }

export class UserModel implements User {
    numusuario: number;
    usuario?: string;
    numemp: number;
    autorizo: number;
    correo?: string;
    nombreS: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    fechaCambioContrasena: Date;
    contrasenaEncriptada?: string;
    idDeSucursal: number;
    cierre: string;
    ctaDeud?: string;
    permisos?: string;
    permisosRespaldo?: string;
    idArea: number;
    notaCal?: string;
    aviso1Cal?: string;
    aviso2Cal?: string;
    aviso1Estado?: string;
    aviso2Estado?: string;
    leyendaFicha?: string;
    contrasena: string;
    nomMaquina?: string;
    gafeteImpreso?: string;
    gafeteFecha?: Date;
    nss?: string;
    idCcostosNomina?: number;
    idGeneroWoccu?: number;
    correoExterno?: string;
    permisosCYC?: string;
    idDpto?: number;
    idRol?: number;
    idBloqueo: number;
    objetivo?: string;
    numusuarioJefe?: number;
    idTicket?: number;
    idProceso?: number;
    idAccion?: number;
    comodin?: number;
    pathDfs?: string;
    firma?: boolean;
    Rol?: RolModel;
    Departamento?: DepartamentoModel;
    constructor(data: any) {
      this.numusuario = data.numusuario ?? this.numusuario;
      this.usuario = data.usuario ?? this.usuario;
      this.numemp = data.numemp ?? this.numemp;
      this.autorizo = data.autorizo ?? this.autorizo;
      this.correo = data.correo ?? this.correo;
      this.nombreS = data.nombreS ?? this.nombreS;
      this.apellidoPaterno = data.apellidoPaterno ?? this.apellidoPaterno;
      this.apellidoMaterno = data.apellidoMaterno ?? this.apellidoMaterno;
      this.fechaCambioContrasena = data.fechaCambioContrasena ?? this.fechaCambioContrasena;
      this.contrasenaEncriptada = data.contrasenaEncriptada ?? this.contrasenaEncriptada;
      this.idDeSucursal = data.idDeSucursal ?? this.idDeSucursal;
      this.cierre = data.cierre ?? this.cierre;
      this.ctaDeud = data.ctaDeud ?? this.ctaDeud;
      this.permisos = data.permisos ?? this.permisos;
      this.permisosRespaldo = data.permisosRespaldo ?? this.permisosRespaldo;
      this.idArea = data.idArea ?? this.idArea;
      this.notaCal = data.notaCal ?? this.notaCal;
      this.aviso1Cal = data.aviso1Cal ?? this.aviso1Cal;
      this.aviso2Cal = data.aviso2Cal ?? this.aviso2Cal;
      this.aviso1Estado = data.aviso1Estado ?? this.aviso1Estado;
      this.aviso2Estado = data.aviso2Estado ?? this.aviso2Estado;
      this.leyendaFicha = data.leyendaFicha ?? this.leyendaFicha;
      this.contrasena = data.contrasena ?? this.contrasena;
      this.nomMaquina = data.nomMaquina ?? this.nomMaquina;
      this.gafeteImpreso = data.gafeteImpreso ?? this.gafeteImpreso;
      this.gafeteFecha = data.gafeteFecha ?? this.gafeteFecha;
      this.nss = data.nss ?? this.nss;
      this.idCcostosNomina = data.idCcostosNomina ?? this.idCcostosNomina;
      this.idGeneroWoccu = data.idGeneroWoccu ?? this.idGeneroWoccu;
      this.correoExterno = data.correoExterno ?? this.correoExterno;
      this.permisosCYC = data.permisosCYC ?? this.permisosCYC;
      this.idDpto = data.idDpto ?? this.idDpto;
      this.idRol = data.idRol ?? this.idRol;
      this.idBloqueo = data.idBloqueo ?? this.idBloqueo;
      this.objetivo = data.objetivo ?? this.objetivo;
      this.numusuarioJefe = data.numusuarioJefe ?? this.numusuarioJefe;
      this.idTicket = data.idTicket ?? this.idTicket;
      this.idProceso = data.idProceso ?? this.idProceso;
      this.idAccion = data.idAccion ?? this.idAccion;
      this.comodin = data.comodin ?? this.comodin;
      this.pathDfs = data.pathDfs ?? this.pathDfs;
      this.firma = data.firma ?? this.firma;
      if(data.Rol){
        this.Rol = new RolModel(data.Rol)
      }
      if(data.Departamento){
        this.Departamento = new DepartamentoModel(data.Departamento)
      }
    }
  
    public getFullName(): string {
      return `${this.nombreS} ${this.apellidoPaterno || ''} ${this.apellidoMaterno || ''}`.trim();
    }
  }