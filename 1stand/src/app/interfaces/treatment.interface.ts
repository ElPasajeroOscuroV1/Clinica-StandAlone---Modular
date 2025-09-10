export interface Treatment {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number | null;
  duracion: number | null; // Formato HH:MM:SS
}