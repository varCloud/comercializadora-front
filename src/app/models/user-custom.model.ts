export interface UserCustom {
  numUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numemp: number;
  correo: string;
  idDpto: number;
  departamento: string;
  idRol: number;
  rol: string;
  idArea: number;
  area: string;
  fechaIngreso: string;
  fechaIngresoPuesto: string;
  fechaIngresoDate?: Date;
  fechaIngresoPuestoDate?: Date;
}

export class UserCustomModel implements UserCustom {
  numUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numemp: number;
  correo: string;
  idDpto: number;
  departamento: string;
  idRol: number;
  rol: string;
  idArea: number;
  area: string;
  fechaIngreso: string;
  fechaIngresoPuesto: string;
  fechaIngresoDate?: Date;
  fechaIngresoPuestoDate?: Date;

  constructor(data: any) {
    this.numUsuario = data.numUsuario ?? this.numUsuario
    this.nombre = data.nombre ?? this.nombre
    this.apellidoPaterno = data.apellidoPaterno ?? this.apellidoPaterno
    this.apellidoMaterno = data.apellidoMaterno ?? this.apellidoMaterno
    this.numemp = data.numemp ?? this.numemp
    this.correo = data.correo ?? this.correo
    this.idDpto = data.idDpto ?? this.idDpto
    this.departamento = data.departamento ?? this.departamento
    this.idRol = data.idRol ?? this.idRol
    this.rol = data.rol ?? this.rol
    this.idArea = data.idArea ?? this.idArea
    this.area = data.area ?? this.area
    this.fechaIngreso = data.fechaIngreso ?? this.fechaIngreso
    this.fechaIngresoPuesto = data.fechaIngresoPuesto ?? this.fechaIngresoPuesto
    this.fechaIngresoDate = data.fechaIngreso ? new Date(data.fechaIngreso+ 'T00:00:00') : undefined;
    this.fechaIngresoPuestoDate = data.fechaIngresoPuesto ? new Date(data.fechaIngresoPuesto + 'T00:00:00') : undefined;
  }

  // Métodos adicionales (opcional)
  public getFullName(): string {
    return `${this.nombre} ${this.apellidoPaterno || ''} ${this.apellidoMaterno || ''}`.trim();
  }
}

