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
        // Procesar tratamientos para asegurarse de que tengan precios finales correctos
        // Primero obtenemos los tratamientos completos desde el servicio para enriquecer los datos
        this.medicalAttentionService.getTreatments().subscribe({
          next: (allTreatments) => {
            const processedData = data.map(attention => {
              // Enriquecer tratamientos de esta atención con datos completos
              const enrichedTreatments = attention.treatments?.map(treatment => {
                // Buscar el tratamiento completo en allTreatments para obtener datos de descuento
                const fullTreatment = allTreatments.find(t => t.id === treatment.id);
                return {
                  ...treatment,
                  // Usar datos del tratamiento completo si están disponibles
                  precio_original: fullTreatment?.precio ?? treatment.precio,
                  tiene_descuento: fullTreatment?.tiene_descuento ?? Boolean(fullTreatment?.precio_con_descuento && fullTreatment.precio_con_descuento !== fullTreatment.precio),
                  precio_con_descuento: fullTreatment?.precio_con_descuento ?? fullTreatment?.precio ?? treatment.precio,
                  ahorro: fullTreatment?.ahorro ?? (fullTreatment?.precio_con_descuento ? (fullTreatment.precio - fullTreatment.precio_con_descuento) : 0),
                };
              }) ?? [];

              // Recalcular el total_cost basado en precios finales
              const totalCost = this.calculateTotalCost({
                ...attention,
                treatments: enrichedTreatments
              });

              return {
                ...attention,
                treatments: enrichedTreatments,
                total_cost: totalCost
              };
            });

            this.medicalAttentionsSource.next(processedData);
            console.log('MedicalDataService: Atenciones médicas procesadas con tratamientos enriquecidos');
          },
          error: (treatmentsErr) => {
            console.warn('Error al cargar tratamientos completos, usando datos disponibles:', treatmentsErr);
            // Fallback: procesar sin enriquecer si falla la carga de tratamientos
            const processedData = data.map(attention => ({
              ...attention,
              total_cost: attention.total_cost ?? this.calculateTotalCost(attention)
            }));
            this.medicalAttentionsSource.next(processedData);
          }
        });
      },
      error: (err) => {
        console.error('MedicalDataService: Error al cargar atenciones médicas', err);
      }
    });
  }

  private calculateTotalCost(attention: MedicalAttention): number {
    let total = 0;

    // Suma precio final de tratamientos
    if (attention.treatments && attention.treatments.length > 0) {
      total += attention.treatments.reduce((sum, treatment) => {
        const precioFinal = treatment.precio_con_descuento ?? treatment.precio ?? 0;
        return sum + precioFinal;
      }, 0);
    }

    // Suma otros tratamientos
    if (attention.otherTreatments && attention.otherTreatments.length > 0) {
      total += attention.otherTreatments.reduce((sum, other: any) => {
        return sum + (Number(other.price) || 0);
      }, 0);
    }

    return total;
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
