export interface Treatment {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion: number;
  precio_original?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  tiene_descuento?: boolean;
  motivo_descuento?: string;
  precio_con_descuento?: number;
  ahorro?: number;
}
