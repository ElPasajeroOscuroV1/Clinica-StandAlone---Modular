import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PatientService } from '../../services/patient.service';
import { MedicalHistoryService } from '../../services/medical-history.service';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-medical-history-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModule],
  templateUrl: './medical-history-modal.component.html',
  styleUrls: ['./medical-history-modal.component.css']
})
export class MedicalHistoryModalComponent implements OnInit {
  @Input() patientId!: number;
  @Input() patientData: any;
  @Input() patientHistories: any[] = [];
  @Input() selectedHistory: any;

  medicalHistoryForm: FormGroup;
  loadingHistory = false;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private patientService: PatientService,
    private medicalHistoryService: MedicalHistoryService
  ) {
    this.medicalHistoryForm = this.fb.group({
      patientName: [{ value: '', disabled: true }],
      patientEmail: [{ value: '', disabled: true }],
      patientCi: [{ value: '', disabled: true }],
      medicalBackground: ['', Validators.maxLength(1000)],
      dentalBackground: ['', Validators.maxLength(1000)],
      consultationReason: ['', Validators.required],
      extraoralExam: [''],
      intraoralExam: [''],
      odontogram: [''],
      treatmentsPerformed: [''],
      currentMedications: [''],
      allergies: [''],
      relevantOralHabits: [''],
    });
  }

  ngOnInit(): void {
    if (this.patientData) {
      this.medicalHistoryForm.patchValue({
        patientName: this.patientData.name,
        patientEmail: this.patientData.email,
        patientCi: this.patientData.ci
      });
    }

    if (this.selectedHistory) {
      this.applyHistory(this.selectedHistory);
    }

    // Fallback: si no recibimos historiales desde el componente padre, los cargamos aquí
    if ((!this.patientHistories || this.patientHistories.length === 0) && this.patientId) {
      this.loadingHistory = true;
      this.patientService.getPatientMedicalHistory(this.patientId).subscribe({
        next: (res: any) => {
          const list = (res?.data ?? res ?? []) as any[];
          this.patientHistories = Array.isArray(list) ? list : [];
          this.selectedHistory = this.patientHistories.length ? this.patientHistories[0] : null;
          if (this.selectedHistory) {
            this.applyHistory(this.selectedHistory);
          }
          this.loadingHistory = false;
        },
        error: () => {
          this.loadingHistory = false;
        }
      });
    }
  }

  applyHistory(history: any) {
    this.selectedHistory = history;
    this.medicalHistoryForm.patchValue({
      medicalBackground: history.medical_background ?? '',
      dentalBackground: history.dental_background ?? '',
      consultationReason: history.consultation_reason ?? '',
      extraoralExam: history.extraoral_exam ?? '',
      intraoralExam: history.intraoral_exam ?? '',
      odontogram: history.odontogram ?? '',
      treatmentsPerformed: history.treatments_performed ?? '',
      currentMedications: history.current_medications ?? '',
      allergies: history.allergies ?? '',
      relevantOralHabits: history.relevant_oral_habits ?? '',
    });
  }

  onHistoryChange(event: any) {
    const value = event.target.value;
    if (value === 'new') {
      this.startNewVersion();
      return;
    }
    const historyId = +value;
    const found = this.patientHistories.find(h => h.id === historyId);
    if (found) {
      this.applyHistory(found);
      console.log('Historial seleccionado:', found);
    }
  }

  saveMedicalHistory(): void {
    if (this.medicalHistoryForm.invalid) {
      this.medicalHistoryForm.markAllAsTouched();
      return;
    }

    this.loadingHistory = true;

    const formValues = this.medicalHistoryForm.getRawValue();
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
      patient_id: this.patientId,
    };

    if (this.selectedHistory?.id) {
      // ✅ Actualiza la versión específica de la historia
      this.medicalHistoryService.updateMedicalHistory(
        this.selectedHistory.id,
        historyData
      ).subscribe({
        next: () => {
          this.loadingHistory = false;
          this.activeModal.close('update');
        },
        error: (err) => {
          this.loadingHistory = false;
          console.error('❌ Error actualizando historia:', err);
        }
      });
    } else {
      // Creación de nueva versión
      this.patientService.createPatientMedicalHistory(this.patientId, historyData).subscribe({
        next: () => {
          this.loadingHistory = false;
          this.activeModal.close('create');
        },
        error: (err) => {
          this.loadingHistory = false;
          console.error(err);
        }
      });
    }
  }

  startNewVersion(): void {
    this.selectedHistory = null as any;
    this.medicalHistoryForm.patchValue({
      medicalBackground: '',
      dentalBackground: '',
      consultationReason: '',
      extraoralExam: '',
      intraoralExam: '',
      odontogram: '',
      treatmentsPerformed: '',
      currentMedications: '',
      allergies: '',
      relevantOralHabits: ''
    });
    this.medicalHistoryForm.markAsPristine();
    this.medicalHistoryForm.markAsUntouched();
  }



  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  exportModalToPDF(): void {
    const modalElement = document.getElementById('modalContent');
    if (!modalElement) return;

    html2canvas(modalElement, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HistoriaClinica_${this.patientData.name}.pdf`);
    });
  }
}
