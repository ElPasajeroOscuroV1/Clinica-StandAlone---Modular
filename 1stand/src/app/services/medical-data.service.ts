import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MedicalAttention } from '../interfaces/medical-attention.interface';
import { MedicalAttentionService } from './medical-attention.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalDataService {
  private medicalAttentionsSource = new BehaviorSubject<MedicalAttention[]>([]);
  medicalAttentions$ = this.medicalAttentionsSource.asObservable();

  constructor(private medicalAttentionService: MedicalAttentionService) { }

  loadMedicalAttentions() {
    this.medicalAttentionService.getMedicalAttentions().subscribe({
      next: (data) => {
        this.medicalAttentionsSource.next(data);
        console.log('MedicalDataService: Atenciones médicas actualizadas y notificadas.');
      },
      error: (err) => {
        console.error('MedicalDataService: Error al cargar atenciones médicas', err);
      }
    });
  }

  updateMedicalAttentionFromHistory(updatedHistory: any) {
    const currentAttentions = this.medicalAttentionsSource.getValue();
    const updatedAttentions = currentAttentions.map(attention => {
      if (attention.medical_history_id === updatedHistory.id) {
        return {
          ...attention,
          diagnosis: updatedHistory.diagnosis ?? attention.diagnosis,
          preEnrollment: updatedHistory.pre_enrollment ?? attention.preEnrollment,
          otherTreatments: updatedHistory.other_treatments ?? attention.otherTreatments,
          // Asegúrate de que otros campos relevantes de MedicalAttention se actualicen aquí
        };
      }
      return attention;
    });
    this.medicalAttentionsSource.next(updatedAttentions);
    console.log('MedicalDataService: Atención médica actualizada desde historial y notificada.');
  }
}
