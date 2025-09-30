import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output  } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PatientService } from '../../services/patient.service';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { MedicalAttentionService } from '../../services/medical-attention.service';
import { MedicalDataService } from '../../services/medical-data.service'; // Importar MedicalDataService
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { of, switchMap } from 'rxjs';
import { MedicalHistory } from '../../interfaces/medical-history.interface'; // Importar MedicalHistory

@Component({
  selector: 'app-medical-history-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatOptionModule,
  ],
  templateUrl: './medical-history-modal.component.html',
  styleUrls: ['./medical-history-modal.component.css']
})
export class MedicalHistoryModalComponent implements OnInit, OnChanges {
  @Input() patientId!: number;
  @Input() patientData: any;
  @Input() patientHistories: any[] = [];
  @Input() selectedHistory: any;
  @Output() saveHistory = new EventEmitter<any>();
  @Input() doctorData: { id: number, name: string } | null = null;
  availableTreatments: any[] = [];
  medicalHistoryForm: FormGroup;
  loadingHistory = false;
  historySelectControl = new FormControl('new'); // valor inicial 'new'
  form: any;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private patientService: PatientService,
    private medicalHistoryService: MedicalHistoryService,
    private medicalAttentionService: MedicalAttentionService,
    private medicalDataService: MedicalDataService // Inyectar MedicalDataService
  ) {
    this.medicalHistoryForm = this.fb.group({
      patientName: [{ value: '', disabled: true }],
      patientEmail: [{ value: '', disabled: true }],
      patientCi: [{ value: '', disabled: true }],
      medicalBackground: ['', Validators.maxLength(1000)],
      dentalBackground: ['', Validators.maxLength(1000)],
      consultationReason: ['', Validators.required],
      diagnosis: ['', Validators.required],
      extraoralExam: [''],
      intraoralExam: [''],
      odontogram: [''],
      treatmentsPerformed: [[]], // Siempre array
      currentMedications: [''],
      otherTreatments: this.fb.array([]), // FormArray para otros tratamientos
      allergies: [''],
      relevantOralHabits: [''],
      preEnrollment: [''],
      details: ['']
    });
  }

  ngOnInit(): void {
    console.log('🔍 Modal inicializado');
    console.log('📋 selectedHistory recibido:', this.selectedHistory);
    console.log('👤 patientData recibido:', this.patientData);
    console.log('📚 patientHistories recibido:', this.patientHistories);

    if (this.patientData) {
      this.medicalHistoryForm.patchValue({
        patientName: this.patientData.name,
        patientEmail: this.patientData.email,
        patientCi: this.patientData.ci,
      });
    }

    // Solo cargar datos si ya tenemos selectedHistory
    // Si no, esperaremos a que se asigne desde el componente padre
    if (this.selectedHistory) {
      console.log('✅ Cargando historia seleccionada específica:', this.selectedHistory);
      this.loadSelectedHistory(this.selectedHistory);
    } else if (this.patientHistories.length > 0) {
      console.log('📚 Cargando primera historia de la lista (fallback)');
      this.selectedHistory = this.patientHistories[0];
      this.loadSelectedHistory(this.selectedHistory);
    } else {
      console.log('⏳ Esperando selectedHistory del componente padre...');
    }

    // Cargar tratamientos disponibles
    this.medicalHistoryService.getTreatments().subscribe({
      next: (treatments: any[]) => {
        this.availableTreatments = treatments;
        console.log('Tratamientos cargados:', treatments);
      },
      error: (err: any) => {
        console.error('Error al cargar tratamientos:', err);
        this.availableTreatments = [];
      },
    });

    // Si no hay historiales recibidos Y no hay selectedHistory específica, cargar desde servicio
    if ((!this.patientHistories || this.patientHistories.length === 0) && this.patientId && !this.selectedHistory) {
      this.loadingHistory = true;
      this.patientService.getPatientMedicalHistory(this.patientId).subscribe({
        next: (res: any) => {
          const list = (res?.data ?? res ?? []) as any[];
          this.patientHistories = Array.isArray(list) ? list : [];
          // Solo cargar la primera historia si no hay una selectedHistory específica
          if (!this.selectedHistory && this.patientHistories.length > 0) {
            this.selectedHistory = this.patientHistories[0];
            this.loadSelectedHistory(this.selectedHistory);
          }
          this.loadingHistory = false;
        },
        error: () => {
          this.loadingHistory = false;
        }
      });
    }

    // Suscripción para detectar cambios en el select de historial
    this.historySelectControl.valueChanges.subscribe(value => {
      if (value === 'new') {
        this.startNewVersion();
      } else if (value != null) {  // <-- chequeo explícito para evitar null
        const historyId = +value;
        const found = this.patientHistories.find(h => h.id === historyId);
        if (found) {
          this.loadSelectedHistory(found);
        }
      }
    });

    // Sincronizar valor inicial del control con selectedHistory
    if (this.selectedHistory?.id) {
      this.historySelectControl.setValue(this.selectedHistory.id, { emitEvent: false });
    } else {
      this.historySelectControl.setValue('new', { emitEvent: false });
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 ngOnChanges detectado:', changes);
    
    if (changes['patientData'] && this.patientData) {
      this.medicalHistoryForm.patchValue({
        patientName: this.patientData.name,
        patientEmail: this.patientData.email,
        patientCi: this.patientData.ci,
      });
    }
    
    if (changes['selectedHistory'] && this.selectedHistory) {
      console.log('📋 selectedHistory cambió, cargando datos:', this.selectedHistory);
      this.loadSelectedHistory(this.selectedHistory);
    }
  }


  get otherTreatmentsFormArray(): FormArray {
    return this.medicalHistoryForm.get('otherTreatments') as FormArray;
  }

  addOtherTreatment(): void {
    this.otherTreatmentsFormArray.push(
      this.fb.group({
        name: ['', Validators.required],
        price: [0, Validators.required],
      })
    );
  }

  removeOtherTreatment(index: number): void {
    this.otherTreatmentsFormArray.removeAt(index);
  }

  /**
   * Carga los datos de una historia clínica seleccionada en el formulario,
   * incluyendo el FormArray de otros tratamientos.
   */
  loadSelectedHistory(history: any): void {
    console.log('🔄 Cargando historia en el formulario:', history);
    this.selectedHistory = history;

    // Patch valores simples
    const formData = {
      medicalBackground: history.medical_background ?? '',
      dentalBackground: history.dental_background ?? '',
      consultationReason: history.consultation_reason ?? '',
      diagnosis: history.diagnosis ?? '',
      extraoralExam: history.extraoral_exam ?? '',
      intraoralExam: history.intraoral_exam ?? '',
      odontogram: history.odontogram ?? '',
      treatmentsPerformed: Array.isArray(history.treatments_performed)
        ? history.treatments_performed
        : typeof history.treatments_performed === 'string'
          ? history.treatments_performed.split(',').map((item: string) => item.trim())
          : [],
      currentMedications: history.current_medications ?? '',
      allergies: history.allergies ?? '',
      relevantOralHabits: history.relevant_oral_habits ?? '',
      preEnrollment: history.pre_enrollment ?? '',
      details: history.details ?? '',
    };

    console.log('📝 Datos del formulario a cargar:', formData);
    console.log('💊 Tratamientos a cargar en el formulario:', formData.treatmentsPerformed);
    this.medicalHistoryForm.patchValue(formData);
    
    // Verificar estado del campo treatmentsPerformed
    const treatmentsControl = this.medicalHistoryForm.get('treatmentsPerformed');
    console.log('🔍 Estado del campo treatmentsPerformed:');
    console.log('  - Disabled:', treatmentsControl?.disabled);
    console.log('  - Enabled:', treatmentsControl?.enabled);
    console.log('  - Value:', treatmentsControl?.value);
    console.log('  - Valid:', treatmentsControl?.valid);
    console.log('  - Available Treatments:', this.availableTreatments.length);
    console.log('  - Available Treatments Data:', this.availableTreatments);
    
    // Asegurar que el campo esté habilitado
    if (treatmentsControl?.disabled) {
      console.log('⚠️ Campo treatmentsPerformed está deshabilitado, habilitándolo...');
      treatmentsControl.enable();
    }

    // Manejo del FormArray otherTreatments
    const otherTreatmentsArray = this.otherTreatmentsFormArray;
    otherTreatmentsArray.clear();

    let otherTreatments = history.other_treatments;

    if (typeof otherTreatments === 'string') {
      try {
        otherTreatments = JSON.parse(otherTreatments);
      } catch (e) {
        console.warn('No se pudo parsear other_treatments como JSON:', e);
        otherTreatments = [];
      }
    }

    if (Array.isArray(otherTreatments)) {
      otherTreatments.forEach((ot: any) => {
        otherTreatmentsArray.push(
          this.fb.group({
            name: [ot.name, Validators.required],
            price: [ot.price, Validators.required],
          })
        );
      });
    } else {
      console.warn('other_treatments no es un array:', otherTreatments);
    }
    if (history.medical_attention_id) {
      this.medicalAttentionService.getMedicalAttention(history.medical_attention_id).subscribe({
        next: (attention: any) => {
          this.selectedHistory = {
            ...(this.selectedHistory || {}),
            doctor: { name: attention?.doctor?.name || this.doctorData?.name || 'Desconocido' }
          };
        }
      });
    }
  }

  /*
  saveMedicalHistory(): void {
    if (this.medicalHistoryForm.invalid) {
      this.medicalHistoryForm.markAllAsTouched();
      return;
    }

    this.loadingHistory = true;

    const formValues = this.medicalHistoryForm.getRawValue();

    // Convertir FormArray otherTreatments a array simple para enviar
    let otherTreatmentsPayload = formValues.otherTreatments;
    if (!Array.isArray(otherTreatmentsPayload)) {
      otherTreatmentsPayload = [];
    }

    const historyData = {
      patient_id: this.patientId,
      medical_background: formValues.medicalBackground,
      dental_background: formValues.dentalBackground,
      consultation_reason: formValues.consultationReason,
      extraoral_exam: formValues.extraoralExam,
      intraoral_exam: formValues.intraoralExam,
      odontogram: formValues.odontogram,
      treatments_performed: Array.isArray(formValues.treatmentsPerformed)
        ? formValues.treatmentsPerformed
        : (formValues.treatmentsPerformed ? [formValues.treatmentsPerformed] : []),
      current_medications: formValues.currentMedications,
      diagnosis: formValues.diagnosis,
      other_treatments: otherTreatmentsPayload,
      allergies: formValues.allergies,
      relevant_oral_habits: formValues.relevantOralHabits,
      pre_enrollment: formValues.preEnrollment,
      medical_attention_id: this.selectedHistory?.medical_attention_id || null, // Vinculación con medical_attentions
      details: formValues.details || ''
    };

    console.log('💾 Datos a enviar al backend:', historyData);
    console.log('📋 FormValues completos:', formValues);
    console.log('💊 otherTreatmentsPayload:', otherTreatmentsPayload);
    console.log('🔍 Tipo de otherTreatmentsPayload:', typeof otherTreatmentsPayload);
    console.log('🔍 Es array otherTreatmentsPayload:', Array.isArray(otherTreatmentsPayload));

    if (this.selectedHistory?.id) {
        //this.medicalHistoryService.updateMedicalHistory(this.selectedHistory.id, historyData).subscribe({
          this.medicalHistoryService.updateMedicalHistory(this.selectedHistory.id, historyData).pipe(
            switchMap(() => this.updateMedicalAttentionFromHistory$(historyData)) // <-- espera a atención
          ).subscribe({
          next: () => {
            this.updateMedicalAttentionFromHistory(historyData);
            this.loadingHistory = false;
            this.activeModal.close({
              action: 'update',
              medicalAttentionId: this.selectedHistory?.medical_attention_id ?? null,
              appointmentId: this.selectedHistory?.appointment_id ?? null,
              payload: historyData,
              attentionSynced: true // <-- bandera de sincronización completa

            });
          },
          error: (err) => {
            this.loadingHistory = false;
            console.error('❌ Error actualizando historia:', err);
            console.error('📋 Detalles del error:', err.error);
            if (err.error && err.error.errors) {
              console.error('🚫 Errores de validación:', err.error.errors);
            }
          }
        });
      } else {
        //this.medicalHistoryService.createMedicalHistory(this.patientId, historyData).subscribe({
          this.medicalHistoryService.createMedicalHistory(this.patientId, historyData).pipe(
            switchMap(() => this.updateMedicalAttentionFromHistory$(historyData))
          ).subscribe({
          next: () => {
            this.updateMedicalAttentionFromHistory(historyData);
            this.loadingHistory = false;
            this.activeModal.close({
              action: 'create',
              medicalAttentionId: this.selectedHistory?.medical_attention_id ?? null,
              appointmentId: this.selectedHistory?.appointment_id ?? null,
              payload: historyData,
              attentionSynced: true
            });
          },
          error: (err) => {
            this.loadingHistory = false;
            console.error('❌ Error creando historia:', err);
            console.error('📋 Detalles del error:', err.error);
            if (err.error && err.error.errors) {
              console.error('🚫 Errores de validación:', err.error.errors);
            }
          }
        });
      }

      // Emitir cambios al componente padre
      if (this.medicalHistoryForm.valid) {
        const updatedHistory = this.medicalHistoryForm.getRawValue();
        this.saveHistory.emit(updatedHistory);
      }

    }
    */
    saveMedicalHistory(): void {
      if (this.medicalHistoryForm.invalid) {
        this.medicalHistoryForm.markAllAsTouched();
        return;
      }
    
      this.loadingHistory = true;
    
      const formValues = this.medicalHistoryForm.getRawValue();
    
      const otherTreatmentsPayload = Array.isArray(formValues.otherTreatments)
        ? formValues.otherTreatments
        : [];
    
      const historyData: MedicalHistory = { // Especificar el tipo MedicalHistory
        id: this.selectedHistory?.id || 0, // Inicializar id, será 0 o el id existente
        patient_id: this.patientId,
        consultation_reason: formValues.consultationReason,
        allergies: formValues.allergies,
        created_at: this.selectedHistory?.created_at || new Date().toISOString(), // Mantener o generar fecha
        patient: this.patientData, // Asignar patientData
        medical_background: formValues.medicalBackground,
        dental_background: formValues.dentalBackground,
        extraoral_exam: formValues.extraoralExam,
        intraoral_exam: formValues.intraoralExam,
        odontogram: formValues.odontogram,
        treatments_performed: Array.isArray(formValues.treatmentsPerformed)
          ? formValues.treatmentsPerformed
          : (formValues.treatmentsPerformed ? [formValues.treatmentsPerformed] : []),
        current_medications: formValues.currentMedications,
        diagnosis: formValues.diagnosis,
        other_treatments: otherTreatmentsPayload,
        relevant_oral_habits: formValues.relevantOralHabits,
        pre_enrollment: formValues.preEnrollment,
        medical_attention_id: this.selectedHistory?.medical_attention_id || null,
        appointment_id: this.selectedHistory?.appointment_id || null,
        details: formValues.details || ''
      };
    
      const isUpdate = !!this.selectedHistory?.id;
    
      const save$ = isUpdate
        ? this.medicalHistoryService.updateMedicalHistory(this.selectedHistory.id, historyData)
        : this.medicalHistoryService.createMedicalHistory(this.patientId, historyData);
    
      save$.pipe(
        switchMap((response) => {
          // Si es una creación, la respuesta contendrá el ID de la nueva historia
          if (!isUpdate && response && response.data) {
            historyData.id = response.data.id; // Asignar el ID de la historia recién creada
          }
          return this.updateMedicalAttentionFromHistory$(historyData);
        })
      ).subscribe({
        next: () => {
          this.loadingHistory = false;
          this.medicalDataService.updateMedicalAttentionFromHistory(historyData); // Notificar a MedicalDataService
    
          // Notifica al padre si lo necesitas
          this.saveHistory.emit(this.medicalHistoryForm.getRawValue());
    
          this.activeModal.close({
            action: isUpdate ? 'update' : 'create',
            medicalAttentionId: this.selectedHistory?.medical_attention_id ?? null,
            appointmentId: this.selectedHistory?.appointment_id ?? null,
            payload: historyData,
            attentionSynced: true
          });
        },
        error: (err) => {
          this.loadingHistory = false;
          console.error('❌ Error guardando historia/atención:', err);
          if (err?.error?.errors) {
            console.error('🚫 Errores de validación:', err.error.errors);
          }
        }
      });
    }
  /*
  onHistoryChange(event: any): void {
    const value = event.target.value;
    if (value === 'new') {
      this.startNewVersion();
      return;
    }
    const historyId = +value;
    const found = this.patientHistories.find(h => h.id === historyId);
    if (found) {
      this.loadSelectedHistory(found);
      console.log('Historial seleccionado:', found);
    }
  }
  */

// Agrega este helper:
  private updateMedicalAttentionFromHistory$(historyData: any) {
    if (!historyData.medical_attention_id || !this.selectedHistory?.appointment_id) {
      return of(null); // nada que sincronizar
    }
    const treatmentIds = Array.isArray(historyData.treatments_performed)
      ? historyData.treatments_performed
          .map((name: string) => this.availableTreatments.find(t => t.nombre === name)?.id ?? null)
          .filter((id: number|null) => id != null)
      : [];

    if (treatmentIds.length === 0) return of(null);

    const attentionUpdateData: any = {
      patient_id: this.patientId,
      appointment_id: this.selectedHistory.appointment_id,
      diagnosis: historyData.diagnosis,
      pre_enrollment: historyData.pre_enrollment,
      other_treatments: historyData.other_treatments,
      treatment_ids: treatmentIds,
      medical_history_id: historyData.id // Incluir el ID de la historia médica
    };
    return this.medicalAttentionService.updateMedicalAttention(historyData.medical_attention_id, attentionUpdateData);
  }
  
  startNewVersion(): void {
    this.selectedHistory = null as any;
    this.medicalHistoryForm.reset({
      patientName: this.patientData?.name ?? '',
      patientEmail: this.patientData?.email ?? '',
      patientCi: this.patientData?.ci ?? '',
      medicalBackground: '',
      dentalBackground: '',
      consultationReason: '',
      diagnosis: '',
      extraoralExam: '',
      intraoralExam: '',
      odontogram: '',
      treatmentsPerformed: [],
      currentMedications: '',
      allergies: '',
      relevantOralHabits: '',
      preEnrollment: '',
      details: '',
    });

    // Limpiar FormArray otherTreatments
    this.otherTreatmentsFormArray.clear();

    this.medicalHistoryForm.markAsPristine();
    this.medicalHistoryForm.markAsUntouched();

    this.historySelectControl.setValue('new', { emitEvent: false });

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
      pdf.save(`HistoriaClinica_${this.patientData?.name ?? 'Paciente'}.pdf`);
    });
  }
  /*
  private updateMedicalAttentionFromHistory(historyData: any): void {
    // Solo actualizar si hay un medical_attention_id
    if (historyData.medical_attention_id) {
      // Convertir nombres de tratamientos de vuelta a IDs para la atención médica
      const treatmentIds = Array.isArray(historyData.treatments_performed) 
        ? historyData.treatments_performed
            .map((treatmentName: string) => {
              const treatment = this.availableTreatments.find(t => t.nombre === treatmentName);
              return treatment ? treatment.id : null;
            })
            .filter((id: any) => id !== null)
        : [];

      // Si no hay tratamientos, usar un tratamiento por defecto o no actualizar
      if (treatmentIds.length === 0) {
        console.log('⚠️ No hay tratamientos para sincronizar, saltando actualización de atención médica');
        return;
      }

      // Verificar que tenemos appointment_id válido
      if (!this.selectedHistory?.appointment_id) {
        console.log('⚠️ No hay appointment_id válido, saltando actualización de atención médica');
        return;
      }

      const attentionUpdateData = {
        patient_id: this.patientId, // Agregar patient_id requerido
        appointment_id: this.selectedHistory.appointment_id, // Agregar appointment_id requerido
        diagnosis: historyData.diagnosis,
        pre_enrollment: historyData.pre_enrollment, // Corregir nombre del campo
        other_treatments: historyData.other_treatments,
        treatment_ids: treatmentIds // Sincronizar también los tratamientos
      } as any; // Usar 'as any' para evitar problemas de tipos

      console.log('🔄 Sincronizando atención médica con:', attentionUpdateData);
      console.log('💊 IDs de tratamientos a sincronizar:', treatmentIds);
      console.log('🆔 Medical Attention ID:', historyData.medical_attention_id);
      console.log('👤 Patient ID:', this.patientId);
      console.log('📅 Appointment ID:', this.selectedHistory?.appointment_id);

      this.medicalAttentionService.updateMedicalAttention(historyData.medical_attention_id, attentionUpdateData).subscribe({
        next: () => {
          console.log('✅ Atención médica actualizada desde historia médica');
        },
        error: (err) => {
          console.error('❌ Error actualizando atención médica desde historia:', err);
          console.error('📋 Detalles del error de atención médica:', err.error);
          console.error('📊 Status del error:', err.status);
          console.error('📝 Mensaje del error:', err.message);
          if (err.error && err.error.errors) {
            console.error('🚫 Errores de validación de atención médica:', err.error.errors);
            console.error('🔍 Campos con errores:', Object.keys(err.error.errors));
          }
        }
      });
    }
  }
  */
}
