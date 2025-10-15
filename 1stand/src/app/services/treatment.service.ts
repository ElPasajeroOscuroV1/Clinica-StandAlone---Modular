import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class TreatmentService {
  private apiUrl = 'http://localhost:8000/api/treatments'; // Ajusta a tu backend

  constructor(private http: HttpClient) {}

  getAll(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(this.apiUrl);
  }

  getById(id: number): Observable<Treatment> {
    return this.http.get<Treatment>(`${this.apiUrl}/${id}`);
  }

  create(treatment: Treatment): Observable<Treatment> {
    return this.http.post<Treatment>(this.apiUrl, treatment);
  }

  update(id: number, treatment: Treatment): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.apiUrl}/${id}`, treatment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
