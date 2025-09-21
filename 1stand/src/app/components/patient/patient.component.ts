import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../interfaces/patient.interface';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as faceapi from 'face-api.js';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component';

import { environment } from '../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// ⚠️ Ajusta esta importación a tu estructura real
// import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgbModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  patients: Patient[] = [];
  patientForm: FormGroup;
  isEditing = false;
  currentPatientId?: number;

  //imageBaseUrl = environment.apiBaseUrl.replace(/\/$/, '') + '/storage/';
  //imageBaseUrl = environment.apiBaseUrl.replace(/\/api$/, '') + '/storage/';

  imageBaseUrl = 'http://localhost:8000/storage/';


  loading = false;
  submitted = false;
  serverError: string | null = null;

  // Para validaciones de fecha en el HTML (max)
  today = new Date().toISOString().slice(0, 10);

  // Si vas a usar environment para construir URLs de imágenes:
  // imageBaseUrl = environment.apiBaseUrl + '/storage/';

  // Imagen / reconocimiento
  isProcessing: boolean = false;
  capturedImage: string = '';           // dataURL cuando el usuario captura o sube una nueva imagen
  faceDetected: boolean = false;
  detectionStatus: string = '';

  // (Opcional) URL previa para mostrar foto existente sin enviarla de vuelta si no cambia
  // previewImageUrl: string = '';

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.patientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      ci: ['', [Validators.required, Validators.maxLength(20)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      birth_date: ['', [Validators.required]],
      medical_history: [''],
      face_image: [''], // Mantén este control para enviar base64 cuando haya nueva foto
      medical_attention_id: ['']
    });
    console.log('Validador de CI:', this.patientForm.get('ci')?.validator);

  }

  async ngOnInit() {
    await this.loadFaceApiModels();
    this.loadPatients();
  }

  private async loadFaceApiModels() {
    try {
      const modelPath = '/assets/models';
      console.log('Cargando modelos desde:', modelPath);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath + '/tiny_face_detector'),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath + '/face_landmark_68'),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath + '/face_recognition')
      ]);
      console.log('Modelos cargados exitosamente');
    } catch (error) {
      console.error('Error cargando modelos de Face API:', error);
      this.detectionStatus = 'Error al cargar los modelos de reconocimiento facial.';
    }
  }

  // ===========
  // IMAGEN / IA
  // ===========
  async captureImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.capturedImage = image.dataUrl || '';
      if (this.capturedImage) {
        await this.detectFace();
      }
    } catch (error) {
      console.error('Error capturando imagen:', error);
      // Fallback: el usuario puede subir archivo si no hay cámara
    }
  }

  // Fallback para subir archivo manualmente (con <input type="file" ... (change)="onFileSelected($event)">)
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      this.capturedImage = (reader.result as string) || '';
      if (this.capturedImage) {
        await this.detectFace();
      }
    };
    reader.readAsDataURL(file);
  }

  private async detectFace() {
    if (!this.capturedImage) return;

    this.isProcessing = true;
    this.detectionStatus = '';

    const img = new Image();
    img.src = this.capturedImage;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    try {
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 0) {
        this.faceDetected = true;
        this.detectionStatus = 'Rostro detectado exitosamente';
        // Guardamos base64 en el form para enviar al backend si se desea
        this.patientForm.patchValue({ face_image: this.capturedImage });
      } else {
        this.faceDetected = false;
        this.detectionStatus = 'No se detectó ningún rostro';
        this.patientForm.patchValue({ face_image: '' });
      }
    } catch (error) {
      console.error('Error en la detección facial:', error);
      this.detectionStatus = 'Error en la detección facial';
      this.faceDetected = false;
      this.patientForm.patchValue({ face_image: '' });
    } finally {
      this.isProcessing = false;
    }
  }

  // ========
  // PACIENTES
  // ========
  loadPatients(): void {
    this.loading = true;
    this.serverError = null;

    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients ?? [];
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.serverError = 'No se pudieron cargar los pacientes.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.patientForm.controls).forEach(key => {
      this.patientForm.get(key)?.markAsTouched();
    });
  }

  async onSubmit() {
    this.submitted = true;
    this.serverError = null;

    console.log('onSubmit: Estado del formulario:', this.patientForm.value);
    console.log('onSubmit: Formulario válido:', this.patientForm.valid);
    console.log('onSubmit: Errores del formulario:', this.patientForm.errors);

    // Si el form es inválido, solo marca y corta
    if (this.patientForm.invalid) {
      this.markAllAsTouched();
      console.log('onSubmit: Formulario INVÁLIDO. Errores después de touch:', this.patientForm.errors);
      Object.keys(this.patientForm.controls).forEach(key => {
          const control = this.patientForm.get(key);
          if (control?.invalid) {
              console.log(`Campo ${key} inválido. Errores:`, control.errors);
          }
      });
      return;
  }

    // Para creación, exige rostro; para edición, solo si el usuario reemplazó la imagen
    const isCreating = !this.isEditing;
    const sendingNewFace = !!this.capturedImage && this.capturedImage.startsWith('data:');

    if (isCreating && !this.faceDetected) {
      this.detectionStatus = 'Por favor, capture o suba una foto válida del rostro.';
      return;
    }

    // Evita doble envío
    if (this.loading) return;
    this.loading = true;

    // Prepara datos a enviar: solo manda base64 si es nueva captura/subida
    const faceImageToSend = sendingNewFace ? this.capturedImage : undefined;

    const patientData = {
      ...this.patientForm.value,
      // En algunos backends es mejor no enviar face_image si no hay cambio:
      //...(faceImageToSend ? { face_image: faceImageToSend } : { face_image: undefined })
      face_image: faceImageToSend // Enviar face_image explícitamente
    };
    console.log('Datos enviados al backend:', patientData);
    console.log('Fecha enviada:', patientData.birth_date);

    if (this.isEditing && this.currentPatientId) {
      this.patientService.updatePatient(this.currentPatientId, patientData, faceImageToSend)
        .subscribe({
          next: () => {
            this.loadPatients();
            this.resetForm();
          },
          error: (error) => {
            console.error('Error actualizando paciente:', error);
            this.handleHttpValidationErrors(error);
          },
          complete: () => {
            this.loading = false;
            this.submitted = false;
          }
        });
    } else {
      this.patientService.createPatient(patientData, faceImageToSend)
        .subscribe({
          next: () => {
            this.loadPatients();
            this.resetForm();
          },
          error: (error) => {
            console.error('Error del backend:', error);
            if (error.status === 422 && error.error?.errors) {
              console.error('Errores de validación recibidos del backend:', error.error.errors);
            } else {
              console.error('Otro error en la creación de paciente:', error);
            }
            this.handleHttpValidationErrors(error);
          },
          complete: () => {
            this.loading = false;
            this.submitted = false;
          }
        });
    }
  }

  private handleHttpValidationErrors(error: any) {
    // Mapea errores 422 del backend al formulario
    if (error?.status === 422 && error?.error?.errors) {
      const validationErrors = error.error.errors;
      console.log('Errores de validación del backend:', validationErrors);
      Object.keys(validationErrors).forEach(key => {
        const control = this.patientForm.get(key);
        if (control) {
          control.setErrors({ serverError: validationErrors[key][0] });
          console.log(`Error de backend en ${key}:`, validationErrors[key][0]);
          console.log(`Errores del control ${key} después de setErrors:`, control.errors);
        }
      });
      this.serverError = 'Revisa los campos marcados.';
      console.log('patientForm.invalid después de errores de backend:', this.patientForm.invalid);
      console.log('patientForm.errors después de errores de backend:', this.patientForm.errors);
    } else {
      this.serverError = error?.message || 'Ocurrió un error inesperado.';
      console.error('Error inesperado del servidor:', error);
    }
  }

  editPatient(patient: Patient): void {
    this.isEditing = true;
    this.currentPatientId = patient.id;

    // Ajusta fecha a yyyy-MM-dd para el control date
    const birthDate = patient.birth_date
      ? new Date(patient.birth_date).toISOString().split('T')[0]
      : '';

    // Parchea todos los campos que correspondan
    this.patientForm.patchValue({
      ...patient,
      birth_date: birthDate,
      // No rellenes face_image con una URL; lo dejamos vacío para no reenviarlo si no cambia
      face_image: ''
    });

    

    // Mostrar la imagen actual si existe (para previsualización en el HTML)
    if (patient.face_image) {
      // Si usas environment: this.previewImageUrl = this.imageBaseUrl + patient.face_image;
      //this.capturedImage = `http://localhost:8000/storage/${patient.face_image}`;
      this.capturedImage = this.imageBaseUrl + patient.face_image;
      this.faceDetected = true; // asumimos que ya fue validada anteriormente
      this.detectionStatus = 'Foto previamente registrada';
    } else {
      this.capturedImage = '';
      this.faceDetected = false;
      this.detectionStatus = '';
    }

    
  }

  onCiChange(): void {  
    // Cuando el usuario cambia el CI, asumimos que intenta corregir el error.
    // Limpiamos los errores específicos del control 'ci'.
    // Esto incluye el 'serverError' si fue establecido por el backend.
    const ciControl = this.patientForm.get('ci');
    if (ciControl) {
        // Opción 1: Limpiar todos los errores del control CI
        ciControl.setErrors(null);
        console.log('onCiChange: Control CI. Errores después de setErrors(null):', ciControl.errors);
        // Actualiza la validez del control
        ciControl.updateValueAndValidity();
        // Actualiza la validez del formulario  
        // Opcional: Si quieres ser más específico y solo quitar serverError
        // let errors = ciControl.errors;
        // if (errors && errors['serverError']) {
        //     delete errors['serverError'];
        //     if (Object.keys(errors).length === 0) {
        //         ciControl.setErrors(null);
        //     } else {
        //         ciControl.setErrors(errors);
        //     }
        // }
        // Esta línea es crucial. Si el formulario completo es válido, limpia el serverError general.
        // Ojo: Asegúrate de que el 'serverError' general solo se muestra si el formulario es inválido.
        if (this.patientForm.valid) {
          this.serverError = null;
          console.log('onCiChange: Formulario COMPLETO es válido. serverError general limpiado.');
        }
        // Force re-evaluation of the control's validity
        ciControl.updateValueAndValidity();
        // Force re-evaluation of the entire form's validity
        this.patientForm.updateValueAndValidity();
        this.changeDetectorRef.detectChanges(); // Asegúrate de inyectar ChangeDetectorRef
        this.serverError = null; // Limpia el error general del servidor si el formulario es válido

        console.log('onCiChange: patientForm.invalid actual:', this.patientForm.invalid);
        console.log('onCiChange: patientForm.errors actual:', this.patientForm.errors);
        console.log('Después de cambiar CI - Errores de CI:', ciControl.errors, 'Formulario Válido:', this.patientForm.valid);
      }

    // Limpia el mensaje de error general del servidor si ya no hay otros errores de validación
    // Esto es un poco más complejo porque `serverError` puede ser para varios campos.
    // Una opción es limpiar `serverError` si el formulario se vuelve válido después de la modificación.
    if (this.patientForm.valid) {
        this.serverError = null;
    }
  }

  logFormState() {
    console.log('Estado actual del formulario:', {
      valid: this.patientForm.valid,
      errors: this.patientForm.errors,
      ciErrors: this.patientForm.get('ci')?.errors
    });
  }
  

  confirmDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este paciente?')) {
      this.deletePatient(id);
    }
  }

  deletePatient(id: number): void {
    this.loading = true;
    this.patientService.deletePatient(id).subscribe({
      next: () => this.loadPatients(),
      error: (error) => {
        console.error('Error al eliminar paciente:', error);
        this.serverError = 'No se pudo eliminar el paciente.';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.patientForm.reset();
    this.isEditing = false;
    this.currentPatientId = undefined;

    // Imagen / reconocimiento
    this.capturedImage = '';
    // this.previewImageUrl = '';
    this.faceDetected = false;
    this.detectionStatus = '';

    this.loading = false;
    this.serverError = null;
    this.submitted = false;
  }

  // ==========
  // HISTORIAL
  // ==========
  openMedicalHistoryModal(): void {
    if (!this.currentPatientId) {
      alert('Primero debe registrar al paciente para gestionar su historial clínico.');
      return;
    }

    this.loading = true;

    // Cargar historiales del paciente
    this.patientService.getPatientMedicalHistory(this.currentPatientId).subscribe({
      next: (histories) => {
        const modalRef = this.modalService.open(MedicalHistoryModalComponent, {
          size: 'xl',
          backdrop: 'static',
          container: 'body',
          windowClass: 'modal-fullscreen'
        });

        // Pasar datos al modal
        modalRef.componentInstance.patientId = this.currentPatientId;
        modalRef.componentInstance.patientData = this.patientForm.value;
        modalRef.componentInstance.patientHistories = histories; // ⚡ Aquí cargamos los historiales
        modalRef.componentInstance.selectedHistory = histories.length ? histories[0] : null;

        // Detectar cuando se cierre el modal
        modalRef.result.then((result: any) => {
          if (result === 'save' || result === 'create' || result === 'update') {
            console.log('Historial guardado desde el modal');
            this.loadPatients(); // refresca la lista de pacientes si quieres
          }
        }, (reason: any) => {
          console.log(`Modal dismissed: ${reason}`);
        });
      },
      error: (err) => {
        console.error('Error cargando historiales:', err);
        alert('No se pudieron cargar los historiales del paciente.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }



  openMedicalHistoryFor(patient: Patient): void {
    const ref = this.modalService.open(MedicalHistoryModalComponent, { size: 'xl', backdrop: 'static' });
    ref.componentInstance.patientId = patient.id;
    ref.componentInstance.patientData = {
      name: patient.name,
      email: patient.email,
      ci: patient.ci
    };

    ref.closed.subscribe((reason) => {
      if (reason === 'save') {
        this.loadPatients();
      }
    });
  }

  // =========
  // UTILIDAD
  // =========
  trackById = (_: number, item: { id?: number }) => item.id ?? _;

  loadPatientHistories(patientId: number) {
    return this.patientService.getPatientMedicalHistory(patientId);
  }

}
