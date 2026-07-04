// Régimen fiscal del SAT (catálogo FactCatRegimenFiscal, read-only). Lo devuelve
// api/clientes/catalogos/regimenes-fiscales para el dropdown del form de clientes.
// Un archivo = una interfaz + su modelo (regla 11).

export interface RegimenFiscal {
  idRegimenFiscal: number;
  descripcion: string;
}

export class RegimenFiscalModel implements RegimenFiscal {
  idRegimenFiscal: number;
  descripcion: string;

  constructor(data: Partial<RegimenFiscal> = {}) {
    this.idRegimenFiscal = data.idRegimenFiscal ?? 0;
    this.descripcion = data.descripcion ?? '';
  }
}
