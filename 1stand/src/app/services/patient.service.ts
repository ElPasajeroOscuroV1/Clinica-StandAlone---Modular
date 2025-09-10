import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Patient } from '../interfaces/patient.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patients';
  private baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    /*
    return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });
    */
    const base = { 'Content-Type': 'application/json' } as Record<string, string>;
    if (token) base['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(base);
}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError) // Añade esto
    );
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError) // Añade esto
    );
  }
  /*
  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient, { headers: this.getHeaders() });
  }

  updatePatient(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient, { headers: this.getHeaders() });
  }
  */

  createPatient(patient: Patient, faceImage?: string): Observable<Patient> {
    const patientData = {
      ...patient,
      face_image: faceImage
    };
    return this.http.post<Patient>(this.apiUrl, patientData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError) // <-- AÑADE ESTO
    );
  }

  updatePatient(id: number, patient: Patient, faceImage?: string): Observable<Patient> {
    const patientData = {
      ...patient,
      face_image: faceImage
    };
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patientData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError) // <-- AÑADE ESTO
    );
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError) // Añade esto
    );
  }

  // Nuevo método para obtener el historial clínico de un paciente
  getPatientMedicalHistory(patientId: number): Observable<any> { // Ajusta el tipo de retorno si lo conoces
    return this.http.get(`${this.apiUrl}/${patientId}/medical-history`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError) // Añade esto
    );
  }

  // Nuevo método para actualizar (o crear si no existe) el historial clínico
  updatePatientMedicalHistory(patientId: number, historyData: any): Observable<any> { // Ajusta el tipo de retorno
    return this.http.put(`${this.apiUrl}/${patientId}/medical-history`, historyData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError) // Añade esto
    );
  }
  
  // ============== FUNCIÓN DE MANEJO DE ERRORES ==============
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en PatientService:', error); // Consologuea el error completo para depuración

    let errorMessage = 'Ocurrió un error inesperado en el servidor.';
    if (error.error instanceof ErrorEvent) {
      // Un error del lado del cliente o de la red
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // El backend devolvió un código de respuesta de error.
      // El cuerpo de la respuesta puede contener más información.
      if (error.status === 422 && error.error && error.error.errors) {
        // Esto es un error de validación del backend (ej. Laravel)
        // Devolvemos el error original para que el componente lo procese
        // con 'handleHttpValidationErrors'
        return throwError(() => error);
      } else if (error.error && error.error.message) {
        // Si el backend envía un mensaje de error genérico en 'message'
        errorMessage = `Error del servidor (${error.status}): ${error.error.message}`;
      } else {
        // Mensaje de error por defecto si no hay información específica
        errorMessage = `Error del servidor: Código ${error.status}`;
      }
    }
    // Devolvemos un error que se pueda manejar en el componente
    // Puedes devolver solo un mensaje o un objeto de error más complejo si lo necesitas.
    return throwError(() => new Error(errorMessage));
  }
  
  // Obtener todos los historiales clínicos
  getAllMedicalHistories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medical-histories`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }


}