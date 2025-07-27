import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // Si usas NgbModal
import { PatientService } from '../../services/patient.service'; // Asumiendo que el servicio maneja también el historial
import { Patient } from '../../interfaces/patient.interface'; // Reusa la interfaz de Patient o crea una específica para historial

@Component({
  selector: 'app-medical-history-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      reasonForConsultation: ['', Validators.required],

      // Resultados de exámenes clínicos
      extraOralExam: [''],
      intraOralExam: [''],

      // Odontograma (puede ser un JSON string o un objeto más complejo)
      odontogram: [''], // Esto requerirá una lógica más compleja en la UI

      // Secciones adicionales
      treatments: [''], // Podría ser un FormArray de tratamientos
      medications: [''], // Podría ser un FormArray de medicamentos
      allergies: [''],
      dentalHabits: [''],
    });
  }

  ngOnInit(): void {
    if (this.patientId) {
      this.loadMedicalHistory(this.patientId);
      // Cargar datos personales del paciente en el formulario para visualización
      if (this.patientData) {
        this.medicalHistoryForm.patchValue({
          patientName: this.patientData.name,
          patientEmail: this.patientData.email,
          patientCi: this.patientData.ci
        });
      }
    }
  }

  loadMedicalHistory(patientId: number): void {
    this.loadingHistory = true;
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
  }

  saveMedicalHistory(): void {
    if (this.medicalHistoryForm.invalid) {
      this.medicalHistoryForm.markAllAsTouched();
      return;
    }

    this.loadingHistory = true;
    const historyData = this.medicalHistoryForm.getRawValue(); // Usa getRawValue para incluir campos disabled

    // Aquí deberías tener un método en tu servicio para guardar/actualizar el historial clínico
    // Si el odontograma es un objeto, conviértelo a JSON string antes de enviar
    // historyData.odontogram = JSON.stringify(this.teethStatus);

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