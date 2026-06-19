export interface Departamento {
  idDpto: number
  nomDepartamento: string
  idArea: number
}

export class DepartamentoModel implements Departamento {
  idDpto: number
  nomDepartamento: string
  idArea: number

  constructor(data: any) {
    this.idDpto = data.idDpto ?? this.idDpto
    this.nomDepartamento = data.nomDepartamento ?? this.nomDepartamento
    this.idArea = data.idArea ?? this.idArea
  }
}