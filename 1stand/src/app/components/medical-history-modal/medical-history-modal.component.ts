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
import { of, switchMap, firstValueFrom } from 'rxjs';
import { MedicalHistory } from '../../interfaces/medical-history.interface'; // Importar MedicalHistory
import { environment } from '../../../environments/environment'; // Importar environment

// Usar los valores configurados en environment para mantener consistencia
const IMAGE_BASE_URL = environment.imageBaseUrl;
const FACE_IMAGE_API_BASE_URL = `${environment.apiBaseUrl}/api/images/faces/`;

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
  patientImageSrc = '/assets/logo.jpg';
  private lastLoadedFaceImageRef: string | null = null;

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

    void this.loadPatientImage();

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
        this.availableTreatments = treatments.map(treatment => ({
          ...treatment,
          tiene_descuento: treatment.tiene_descuento ?? Boolean(treatment.precio_con_descuento && treatment.precio_con_descuento !== treatment.precio),
          precio_con_descuento: treatment.precio_con_descuento ?? treatment.precio,
          ahorro: treatment.ahorro ?? (treatment.precio_con_descuento ? treatment.precio - (treatment.precio_con_descuento || 0) : 0)
        }));
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
    
    if (changes['patientData']) {
      if (this.patientData) {
        this.medicalHistoryForm.patchValue({
          patientName: this.patientData.name,
          patientEmail: this.patientData.email,
          patientCi: this.patientData.ci,
        });

        void this.loadPatientImage();
      } else {
        this.patientImageSrc = '/assets/logo.jpg';
      }
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
    const previousSelected = this.selectedHistory;
    this.selectedHistory = history;

    const consultationReason = history.consultation_reason
      ?? history.consultationReason
      ?? history.reason
      ?? history.appointment?.reason
      ?? previousSelected?.appointment?.reason
      ?? previousSelected?.reason
      ?? '';

    // Patch valores simples
    const formData = {
      medicalBackground: history.medical_background ?? '',
      dentalBackground: history.dental_background ?? '',
      consultationReason: consultationReason,
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

    void this.loadPatientImage();
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
    
        const consultationReasonValue = formValues.consultationReason;

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
        console.log('💾 Historia guardada, procediendo a sincronizar atención médica...');
        console.log('📋 Datos a sincronizar:', historyData);
        console.log('🆔 Medical Attention ID:', historyData.medical_attention_id);
        console.log('📅 Appointment ID:', historyData.appointment_id);
        return this.updateMedicalAttentionFromHistory$(historyData);
      })
    ).subscribe({
        next: () => {
          this.loadingHistory = false;
          this.medicalDataService.updateMedicalAttentionFromHistory(historyData); // Notificar a MedicalDataService
    
          // Notifica al padre si lo necesitas
          this.saveHistory.emit({ ...historyData, consultationReason: consultationReasonValue });
    
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
    // Obtener appointment_id desde historyData o selectedHistory
    const appointmentId = historyData.appointment_id || this.selectedHistory?.appointment_id;
    
    if (!historyData.medical_attention_id || !appointmentId) {
      console.log('⚠️ No se puede sincronizar atención médica:');
      console.log('  - medical_attention_id:', historyData.medical_attention_id);
      console.log('  - appointment_id:', appointmentId);
      return of(null); // nada que sincronizar
    }
    
    const treatmentIds = Array.isArray(historyData.treatments_performed)
      ? historyData.treatments_performed
          .map((name: string) => this.availableTreatments.find(t => t.nombre === name)?.id ?? null)
          .filter((id: number|null) => id != null)
      : [];

    if (treatmentIds.length === 0) {
      console.log('⚠️ No hay tratamientos para sincronizar');
      return of(null);
    }

    const attentionUpdateData: any = {
      patient_id: this.patientId,
      appointment_id: appointmentId,
      diagnosis: historyData.diagnosis,
      pre_enrollment: historyData.pre_enrollment,
      other_treatments: historyData.other_treatments,
      treatment_ids: treatmentIds,
      medical_history_id: historyData.id // Incluir el ID de la historia médica
    };
    
    console.log('✅ Sincronizando atención médica con ID:', historyData.medical_attention_id);
    console.log('📋 Datos de sincronización:', attentionUpdateData);
    
    return this.medicalAttentionService.updateMedicalAttention(historyData.medical_attention_id, attentionUpdateData);
  }
  
  startNewVersion(): void {
    const appointmentReason = this.selectedHistory?.consultation_reason
      ?? this.selectedHistory?.consultationReason
      ?? this.selectedHistory?.appointment?.reason
      ?? '';

    this.selectedHistory = null as any;
    this.medicalHistoryForm.reset({
      patientName: this.patientData?.name ?? '',
      patientEmail: this.patientData?.email ?? '',
      patientCi: this.patientData?.ci ?? '',
      medicalBackground: '',
      dentalBackground: '',
      consultationReason: appointmentReason,
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

  getPatientImageUrl(): string {
    return this.patientImageSrc;
  }

  private async loadPatientImage(): Promise<void> {
    let faceImageRef = this.resolveFaceImageReference();

    if (!faceImageRef) {
      faceImageRef = await this.fetchFaceImageFromApi();
    }

    if (!faceImageRef) {
      this.patientImageSrc = '/assets/logo.jpg';
      return;
    }

    if (faceImageRef === this.lastLoadedFaceImageRef && this.patientImageSrc.startsWith('data:')) {
      return;
    }

    if (faceImageRef.startsWith('data:')) {
      this.patientImageSrc = faceImageRef;
      this.lastLoadedFaceImageRef = faceImageRef;
      return;
    }

    let filename = faceImageRef.trim();

    if (filename.startsWith(IMAGE_BASE_URL)) {
      filename = filename.substring(IMAGE_BASE_URL.length);
    }

    filename = filename.split('?')[0];

    if (filename.includes('/')) {
      const segments = filename.split('/');
      filename = segments[segments.length - 1];
    }

    if (!filename) {
      this.patientImageSrc = '/assets/logo.jpg';
      return;
    }

    try {
      const response = await fetch(`${FACE_IMAGE_API_BASE_URL}${encodeURIComponent(filename)}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'reload'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      if (payload?.base64) {
        this.patientImageSrc = payload.base64;
        this.lastLoadedFaceImageRef = faceImageRef;
      } else {
        throw new Error('Invalid base64 payload received');
      }
    } catch (error) {
      console.warn('No fue posible cargar la imagen del paciente, se mostrara el placeholder.', error);
      this.patientImageSrc = '/assets/logo.jpg';
    }
  }

  private resolveFaceImageReference(): string | null {
    const candidates: Array<string | undefined | null> = [
      this.getFaceImageFromSource(this.patientData),
      this.getFaceImageFromSource(this.selectedHistory?.patient),
      this.getFaceImageFromSource(this.selectedHistory)
    ];

    if (Array.isArray(this.patientHistories)) {
      for (const history of this.patientHistories) {
        const historyCandidate =
          this.getFaceImageFromSource((history as any)?.patient) ??
          this.getFaceImageFromSource(history);
        if (historyCandidate) {
          candidates.push(historyCandidate);
          break;
        }
      }
    }

    const candidate = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
    return candidate ? candidate.trim() : null;
  }

  private async fetchFaceImageFromApi(): Promise<string | null> {
    if (!this.patientId) {
      return null;
    }

    try {
      const patient = await firstValueFrom(this.patientService.getPatient(this.patientId));
      const faceImage = this.getFaceImageFromSource(patient);

      if (faceImage) {
        this.patientData = { ...(this.patientData ?? {}), face_image: faceImage };
      }

      return faceImage ?? null;
    } catch (error) {
      console.warn("No se pudo obtener la imagen del paciente desde la API.", error);
      return null;
    }
  }

  private getFaceImageFromSource(source: any): string | null {
    if (!source) {
      return null;
    }

    const value: unknown = source.face_image ?? source.faceImage ?? source.photo ?? null;

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    return null;
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  exportModalToPDF(): void {
    const modalElement = document.getElementById('modalContent');
    if (!modalElement) {
      console.error('Modal content element not found');
      alert('Error: No se pudo encontrar el contenido del modal');
      return;
    }

    // Show loading state
    const exportBtn = document.querySelector('#exportPdfBtn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando PDF...';
    }

    try {
      // Simplified PDF generation without complex logo loading
      this.generateSimplePDF(modalElement, exportBtn);
    } catch (error) {
      console.error('Error in PDF generation:', error);
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Exportar a PDF';
      }
      alert('Error generando PDF. Por favor, inténtelo de nuevo.');
    }
  }

  private generateSimplePDF(modalElement: HTMLElement, exportBtn: HTMLButtonElement | null): void {
    // Multi-page PDF generation with html2canvas
    html2canvas(modalElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: modalElement.scrollHeight // Capture full height
    }).then(canvas => {
      // Reset button state
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Exportar a PDF';
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.8);

      // Calculate dimensions
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // margins
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentHeight = pageHeight - 45 - 20; // header + margins

      // Calculate how many pages we need
      const totalContentHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const totalPages = Math.ceil(totalContentHeight / contentHeight);

      let position = 45; // Start after header
      let remainingHeight = totalContentHeight;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
          position = 20; // Reset position for new page (less margin)

          // Add page number only to subsequent pages
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Página ${page + 1} de ${totalPages}`, 105, 15, { align: 'center' });
        } else {
          // First page header
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text('CLINICA DENTAL', 105, 15, { align: 'center' });

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Centro Odontologico Especializado', 105, 22, { align: 'center' });
          pdf.text('Atencion Profesional y Calidad', 105, 29, { align: 'center' });

          // Add line separator
          pdf.setLineWidth(0.5);
          pdf.line(20, 35, 190, 35);
        }

        // Calculate how much content fits on this page
        const availableHeight = page === 0 ? contentHeight : (pageHeight - 25);
        const contentToShow = Math.min(remainingHeight, availableHeight);

        if (contentToShow > 0) {
          // For multi-page, we'll use a simpler approach - just add the full image and let it overflow
          // This is more reliable than trying to crop portions
          pdf.addImage(imgData, 'JPEG', 10, position, pdfWidth, contentToShow);

          remainingHeight -= contentToShow;
        }
      }

      pdf.save(`HistoriaClinica_${this.patientData?.name?.replace(/\s+/g, '_') || 'Paciente'}_${new Date().toISOString().split('T')[0]}.pdf`);
    }).catch(error => {
      console.error('Error generating PDF:', error);

      // Reset button state
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Exportar a PDF';
      }

      alert('Error generando PDF. Por favor, inténtelo de nuevo.');
    });
  }

  private generatePDFWithContent(modalElement: HTMLElement, exportBtn: HTMLButtonElement | null, logoData: string | null): void {

    // Function to fetch image as base64
    const fetchImageAsBase64 = async (imageSrc: string): Promise<string> => {
      if (!imageSrc) {
        return '/assets/logo.jpg';
      }

      if (imageSrc.startsWith('data:')) {
        return imageSrc;
      }

      if (imageSrc.startsWith(IMAGE_BASE_URL)) {
        const relativePath = imageSrc.substring(IMAGE_BASE_URL.length);
        const filename = relativePath.split('/').pop();

        if (filename) {
          const sanitizedFilename = filename.split('?')[0];
          try {
            const response = await fetch(`${FACE_IMAGE_API_BASE_URL}${encodeURIComponent(sanitizedFilename)}`, {
              method: 'GET',
              mode: 'cors'
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const payload = await response.json();
            if (payload?.base64) {
              return payload.base64;
            }

            throw new Error('Invalid image payload received from API');
          } catch (error) {
            console.warn('Failed to load image through API, using placeholder instead:', filename, error);
            return '/assets/logo.jpg';
          }
        }

        return '/assets/logo.jpg';
      }

      return new Promise((resolve) => {
        fetch(imageSrc, {
          method: 'GET',
          mode: 'cors',
          cache: 'reload'
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('/assets/logo.jpg');
            reader.readAsDataURL(blob);
          })
          .catch(error => {
            console.warn('Failed to fetch image as base64, falling back to placeholder:', imageSrc, error);
            resolve('/assets/logo.jpg');
          });
      });
    };

    // Pre-load images as base64
    const loadImages = async () => {
      const images = modalElement.querySelectorAll('img');
      const imagePromises = Array.from(images).map(async img => {
        try {
          return await fetchImageAsBase64(img.src);
        } catch (error) {
          console.warn('Failed to load image, using placeholder:', img.src);
          return '/assets/logo.jpg';
        }
      });

      return await Promise.all(imagePromises);
    };

    // Load all images first
    loadImages().then(base64Images => {
      // Temporarily replace images with base64 versions
      const images = modalElement.querySelectorAll('img');
      const imageReplacements: { img: HTMLImageElement; originalSrc: string; }[] = [];

      images.forEach((img, index) => {
        const originalSrc = img.src;
        imageReplacements.push({ img, originalSrc });

        // Use the fetched base64 image
        const loadedImage = base64Images[index];
        img.src = loadedImage;
        img.crossOrigin = 'anonymous';
      });

      // Wait for images to render
      setTimeout(() => {
        // Opciones optimizadas para html2canvas
        const options: any = {
          scale: 2,
          allowTaint: true,
          useCORS: false, // Images are now base64
          foreignObjectRendering: false,
          logging: false,
          backgroundColor: '#ffffff',
          ignoreElements: (element: Element) => {
            // Ignore problematic elements
            return element.tagName === 'LINK' || element.tagName === 'SCRIPT' || element.tagName === 'META';
          },
          onclone: (clonedDocument: Document) => {
            // Ensure cloned images maintain their base64 sources
            const clonedImages = clonedDocument.querySelectorAll('img');
            clonedImages.forEach((clonedImg, index) => {
              if (base64Images[index]) {
                clonedImg.src = base64Images[index];
                clonedImg.crossOrigin = '';
              }
            });
          }
        };

        html2canvas(modalElement, options).then(canvas => {
          // Restore original images
          imageReplacements.forEach(({ img, originalSrc }) => {
            img.src = originalSrc;
          });

          // Reset button state
          if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = 'Exportar a PDF';
          }

          // Create PDF
          const pdf = new jsPDF('p', 'mm', 'a4');

          // Add logo at the top if available
          let startY = 6;
          if (logoData) {
            const logoWidth = 35;
            const logoHeight = 35;
            const logoX = 15;
            const logoY = 10;

            pdf.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);

            // Add clinic name next to logo
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CLÍNICA DENTAL', logoX + logoWidth + 10, logoY + 12);

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Centro Odontológico Especializado', logoX + logoWidth + 10, logoY + 20);
            pdf.text('Atención Profesional y Calidad', logoX + logoWidth + 10, logoY + 27);

            // Add border around header
            pdf.setLineWidth(0.5);
            pdf.rect(10, 5, 190, 45);

            startY = 55; // Adjust starting position for content
          }

          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          // Calculate dimensions maintaining aspect ratio
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 12;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          // Añadir contenido respetando el alto de página
          const pageHeight = pdf.internal.pageSize.getHeight();
          const contentHeight = pageHeight - startY - 6; // márgenes superior e inferior
          let heightLeft = pdfHeight;
          let position = startY;

          pdf.addImage(imgData, 'JPEG', 6, position, pdfWidth, pdfHeight, undefined, 'FAST');
          heightLeft -= contentHeight;

          while (heightLeft > 0.5) {
            pdf.addPage();
            position = heightLeft - pdfHeight + startY;
            pdf.addImage(imgData, 'JPEG', 6, position, pdfWidth, pdfHeight, undefined, 'FAST');
            heightLeft -= contentHeight;
          }

          pdf.save(`HistoriaClinica_${this.patientData?.name ?? 'Paciente'}.pdf`);
        }).catch(error => {
          console.error('Error generating PDF:', error);

          // Restore images in case of error
          imageReplacements.forEach(({ img, originalSrc }) => {
            img.src = originalSrc;
          });

          // Reset button state
          if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = 'Exportar a PDF';
          }

          alert('Error generating PDF. Please try again.');
        });
      }, 800); // Wait 800ms for images to render
    }).catch(error => {
      console.error('Error loading images:', error);

      // Reset button state
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Exportar a PDF';
      }

      alert('Error loading images. PDF will be generated without them.');
    });
  }
}
