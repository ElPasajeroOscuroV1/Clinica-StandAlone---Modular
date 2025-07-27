import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Método para verificar paciente por imagen facial
  verifyPatient(faceData: any) {
    return this.http.post(`${environment.apiUrl}/mobile/verify-patient`, faceData);
  }

  // Método para generar ticket de atención
  generateQueueTicket(patientId: number) {
    return this.http.post(`${environment.apiUrl}/mobile/queue-ticket`, { patientId });
  }
}