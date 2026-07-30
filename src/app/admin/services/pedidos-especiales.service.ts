import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { URIS_CONFIG } from 'src/app/config/uris-config';
import { Notificacion } from 'src/app/models/sesion';
import { PedidoEspecialProducto } from 'src/app/admin/models/ventas/pedido-especial-producto';

/**
 * Servicio HTTP de "Buscar Pedido Especial" del POS (feature Ventas, Bloque E gap-fix).
 * Consume `PedidosEspecialesController` (comercializadora-api), controlador propio (NO el
 * anidado `api/facturas/pedidos-especiales` de `FacturasService`, que es un dominio distinto).
 * `idUsuario`/`idAlmacen` NUNCA se mandan desde aquí: el backend los resuelve del JWT.
 */
@Injectable({ providedIn: 'root' })
export class PedidosEspecialesService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = `${environment.BASE_URL_ADMIN}/${URIS_CONFIG.PEDIDOS_ESPECIALES}`;

  /**
   * Productos de un pedido especial (folio) con cantidad aceptada > 0, listos para agregar al
   * ticket del POS. Devuelve la `Notificacion` completa (no solo `modelo`): cuando el folio no
   * existe / no es tipo especial / no está Finalizado / no pertenece al almacén del usuario /
   * no tiene productos con cantidad aceptada, la API responde `estatus != 200` con `mensaje`
   * describiendo el motivo — el componente debe mostrarlo tal cual con `NotificationService`.
   */
  obtenerProductos(folio: number): Observable<Notificacion<PedidoEspecialProducto[]>> {
    return this.http.get<Notificacion<PedidoEspecialProducto[]>>(`${this.baseUri}/${folio}/productos`);
  }
}
