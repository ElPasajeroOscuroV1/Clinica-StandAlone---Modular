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
      // Buscar por medical_attention_id en lugar de medical_history_id
      if (updatedHistory.medical_attention_id && attention.id === updatedHistory.medical_attention_id) {
        console.log('🔄 Sincronizando atención médica ID:', attention.id, 'con historia ID:', updatedHistory.id);
        return {
          ...attention,
          diagnosis: updatedHistory.diagnosis ?? attention.diagnosis,
          preEnrollment: updatedHistory.pre_enrollment ?? attention.preEnrollment,
          otherTreatments: updatedHistory.other_treatments ?? attention.otherTreatments,
          medical_history_id: updatedHistory.id, // Actualizar la referencia al ID de la historia
          appointment: attention.appointment
            ? {
                ...attention.appointment,
                reason: updatedHistory.consultation_reason ?? attention.appointment.reason ?? null
              }
            : attention.appointment,
          // Asegúrate de que otros campos relevantes de MedicalAttention se actualicen aquí
        };
      }
      return attention;
    });
    this.medicalAttentionsSource.next(updatedAttentions);
    console.log('MedicalDataService: Atención médica actualizada desde historial y notificada.', updatedAttentions);
  }
}
