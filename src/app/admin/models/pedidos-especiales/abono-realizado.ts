// Modelo devuelto en `Notificacion<AbonoRealizado>.modelo` por
// `POST /pedidos-especiales/cuentas-por-cobrar/abonos`. El `idAbonoCliente` que arma el ticket
// (`GET /pedidos-especiales/cuentas-por-cobrar/abonos/{idAbonoCliente}/ticket`, FE-7) viaja
// dentro de `Modelo` — el `Notificacion<T>` de comercializadora-api no tiene un campo `Id`
// aparte (precedente: `GuardarPedidoEspecialAsync`, ver HU "Se moderniza" punto 3).
// Un archivo = una interfaz + su modelo (regla 09/11).
export interface AbonoRealizado {
  idAbonoCliente: number;
}

export class AbonoRealizadoModel implements AbonoRealizado {
  idAbonoCliente: number;

  constructor(data: Partial<AbonoRealizado> = {}) {
    this.idAbonoCliente = data.idAbonoCliente ?? 0;
  }
}
