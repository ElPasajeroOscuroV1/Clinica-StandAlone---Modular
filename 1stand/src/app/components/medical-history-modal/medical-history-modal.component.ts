import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // Si usas NgbModal
import { PatientService } from '../../services/patient.service'; // Asumiendo que el servicio maneja también el historial
import { Patient } from '../../interfaces/patient.interface'; // Reusa la interfaz de Patient o crea una específica para historial
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Asegúrate de importar NgbModule

@Component({
  selector: 'app-medical-history-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule ],
  templateUrl: './medical-history-modal.component.html',
  styleUrls: ['./medical-history-modal.component.css']
})
export class MedicalHistoryModalComponent implements OnInit {
  @Input() patientId: number | undefined;
  @Input() patientData: any; // Para mostrar datos personales del paciente
  medicalHistoryForm: FormGroup;
  loadingHistory = false;

  // Variables para odontograma, si lo implementas
  // teethStatus: any = {}; // Mapa para el estado de cada diente

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal, // Para controlar el modal de NgbModal
    private patientService: PatientService
  ) {
    this.medicalHistoryForm = this.fb.group({
      // Datos personales del paciente (solo para mostrar, no editar aquí)
      patientName: [{ value: '', disabled: true }],
      patientEmail: [{ value: '', disabled: true }],
      patientCi: [{ value: '', disabled: true }],

      // Antecedentes Médicos y Odontológicos
      medicalBackground: ['', Validators.maxLength(1000)],
      dentalBackground: ['', Validators.maxLength(1000)],

      // Motivo de la consulta
      consultationReason: ['', Validators.required],

      // Resultados de exámenes clínicos
      extraoralExam: [''],
      intraoralExam: [''],

      // Odontograma (puede ser un JSON string o un objeto más complejo)
      odontogram: [''], // Esto requerirá una lógica más compleja en la UI

      // Secciones adicionales
      treatmentsPerformed: [''], // Podría ser un FormArray de tratamientos
      currentMedications: [''], // Podría ser un FormArray de medicamentos
      allergies: [''],
      relevantOralHabits: [''],
    });
  }

  // Convierte las claves del backend (snake_case) a las del formulario (camelCase)
  private mapApiToForm(h: any) {
    return {
      medicalBackground:    h?.medical_background    ?? '',
      dentalBackground:     h?.dental_background     ?? '',
      consultationReason:   h?.consultation_reason   ?? '',
      extraoralExam:        h?.extraoral_exam        ?? '',
      intraoralExam:        h?.intraoral_exam        ?? '',
      odontogram:           h?.odontogram            ?? '',
      treatmentsPerformed:  h?.treatments_performed  ?? '',
      currentMedications:   h?.current_medications   ?? '',
      allergies:            h?.allergies             ?? '',
      relevantOralHabits:   h?.relevant_oral_habits  ?? '',
    };
  }

  ngOnInit(): void {
    if (this.patientId) {
      //this.loadMedicalHistory(this.patientId);
      // Cargar datos personales del paciente en el formulario para visualización
      // 2.1) Mostrar datos del paciente en los inputs deshabilitados (cabecera)
      if (this.patientData) {
        this.medicalHistoryForm.patchValue({
          patientName: this.patientData.name,
          patientEmail: this.patientData.email,
          patientCi: this.patientData.ci
        });
      }
      // 2.2) Cargar el historial desde el backend
      this.loadMedicalHistory(this.patientId);
    }
  }

  loadMedicalHistory(patientId: number): void {
    this.loadingHistory = true;
    /*
    // Debes tener un método en tu servicio para obtener el historial clínico de un paciente
    this.patientService.getPatientMedicalHistory(patientId).subscribe({
      next: (history) => {
        this.medicalHistoryForm.patchValue(history); // Asume que la estructura del historial coincide
        this.loadingHistory = false;
        // Si hay un odontograma, parsearlo y cargarlo
        // if (history.odontogram) { this.teethStatus = JSON.parse(history.odontogram); }
      },
      error: (err) => {
        console.error('Error cargando historial clínico:', err);
        this.loadingHistory = false;
        // Manejar error, ej. mostrar un mensaje al usuario
      }
    });
    */
    this.patientService.getPatientMedicalHistory(patientId).subscribe({
      next: (raw) => {
        // Si por alguna razón el backend devuelve [], conviértelo a objeto vacío
        const apiObj = Array.isArray(raw) ? {} : (raw || {});
        // Mapeamos a las claves del formulario
        const formValues = this.mapApiToForm(apiObj);

        // OPCIÓN C (mi preferida por robustez):
        this.medicalHistoryForm.reset({
          patientName: this.patientData?.name ?? '',
          patientEmail: this.patientData?.email ?? '',
          patientCi: this.patientData?.ci ?? '',
          ...formValues
        });

        console.log('RAW desde API:', apiObj);              // <- claves snake_case
        console.log('MAP a Form (camelCase):', formValues); // <- lo que vas a patchValue
  
        //this.medicalHistoryForm.patchValue(formValues);
        console.log('VALOR DEL FORM tras patch:', this.medicalHistoryForm.getRawValue());

        console.log('✅ Historial cargado desde API:', apiObj);
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error('❌ Error cargando historial clínico:', err);
        this.loadingHistory = false;
      }
    });
  }

  saveMedicalHistory(): void {
    if (this.medicalHistoryForm.invalid) {
      this.medicalHistoryForm.markAllAsTouched();
      return;
    }

    this.loadingHistory = true;
    //const historyData = this.medicalHistoryForm.getRawValue(); // Usa getRawValue para incluir campos disabled
    const formValues = this.medicalHistoryForm.getRawValue();

    // Aquí deberías tener un método en tu servicio para guardar/actualizar el historial clínico
    // Si el odontograma es un objeto, conviértelo a JSON string antes de enviar
    // historyData.odontogram = JSON.stringify(this.teethStatus);

    // Mapear los nombres de campo del frontend a los nombres de campo del backend
    const historyData = {
      medical_background: formValues.medicalBackground,
      dental_background: formValues.dentalBackground,
      consultation_reason: formValues.consultationReason,
      extraoral_exam: formValues.extraoralExam,
      intraoral_exam: formValues.intraoralExam,
      odontogram: formValues.odontogram,
      treatments_performed: formValues.treatmentsPerformed,
      current_medications: formValues.currentMedications,
      allergies: formValues.allergies,
      relevant_oral_habits: formValues.relevantOralHabits,
    };

    this.patientService.updatePatientMedicalHistory(this.patientId!, historyData).subscribe({
      next: (response) => {
        console.log('Historial clínico guardado con éxito', response);
        this.loadingHistory = false;
        this.activeModal.close('save'); // Cerrar el modal indicando éxito
      },
      error: (err) => {
        console.error('Error guardando historial clínico:', err);
        this.loadingHistory = false;
        // Manejar error
      }
    });
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel'); // Cerrar el modal sin guardar
  }

  // Métodos para interactuar con el odontograma si lo implementas
  // toggleToothStatus(toothId: string, surface: string) { ... }
}