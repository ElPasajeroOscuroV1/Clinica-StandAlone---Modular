import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MedicalAttentionService } from '../../services/medical-attention.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Patient } from '../../interfaces/patient.interface';
import { Appointment } from '../../interfaces/appointment.interface';
import { Treatment } from '../../interfaces/treatment.interface';
import { MedicalAttention } from '../../interfaces/medical-attention.interface';
import { Doctor } from '../../interfaces/doctor.interface'; // Asegúrate de definir esta interfaz
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component';
import { MedicalHistoryService } from '../../services/medical-history.service';
@Component({
  selector: 'app-medical-attention',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './medical-attention.component.html',
  styleUrls: ['./medical-attention.component.css']
})
export class MedicalAttentionComponent implements OnInit {
  form: FormGroup;
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  treatments: Treatment[] = [];
  doctors: Doctor[] = []; // Nueva propiedad para almacenar doctores
  medicalAttentions: MedicalAttention[] = [];
  displayedColumns: string[] = [
    'id', 
    'patient_id', 
    'appointment_id', 
    'doctor',
    'diagnosis', 
    'treatments',
    'other_treatments', 
    'pre_enrollment',
    'total_cost', 
    'actions'
  ]; // Agregué 'doctor'

  editingAttention: MedicalAttention | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalAttentionService: MedicalAttentionService,
    private modalService: NgbModal,
    private medicalHistoryService: MedicalHistoryService
  ) {
    this.form = this.fb.group({
      patient_id: ['', Validators.required],
      appointment_id: ['', Validators.required],
      treatment_ids: [[], Validators.required],
      diagnosis: ['', Validators.required],
      preEnrollment: ['', Validators.required],
      otherTreatments: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.loadPatients();
    this.loadTreatments();
    this.loadDoctors(); // Cargar doctores
    this.loadMedicalAttentions();
  }

  get otherTreatmentsFormArray(): FormArray {
    return this.form.get('otherTreatments') as FormArray;
  }
  


  loadPatients() {
    this.medicalAttentionService.getPatientsByDoctor().subscribe({
      next: (data: Patient[]) => {
        this.patients = data;
      },
      error: (err) => {
        console.error('Error al cargar pacientes:', err);
      }
    });
  }

  loadTreatments() {
    this.medicalAttentionService.getTreatments().subscribe({
      next: (data: Treatment[]) => {
        this.treatments = data;
      },
      error: (err) => {
        console.error('Error al cargar tratamientos:', err);
      }
    });
  }

  loadDoctors() {
    this.medicalAttentionService.getDoctors().subscribe({
      next: (data: Doctor[]) => {
        this.doctors = data;
      },
      error: (err) => {
        console.error('Error al cargar doctores:', err);
      }
    });
  }

  loadMedicalAttentions() {
    this.medicalAttentionService.getMedicalAttentions().subscribe({
      next: (data: MedicalAttention[]) => {
        this.medicalAttentions = data.map(attention => ({
          ...attention,
          appointment: attention.appointment || { id: attention.appointment_id, date: 'Sin fecha', time: '00:00:00', doctor_id: undefined  }
        }));
        console.log('Datos de medicalAttentions:', this.medicalAttentions);
      },
      error: (err) => {
        console.error('Error al cargar atenciones médicas:', err);
      }
    });
  }

  onPatientChange() {
    const patientId = this.form.get('patient_id')?.value;
    if (patientId) {
      this.medicalAttentionService.getAppointmentsByDoctorPatient(patientId).subscribe({
        next: (data: Appointment[]) => {
          this.appointments = data;
        },
        error: (err) => {
          console.error('Error al cargar citas:', err);
        }
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const data = {
        ...this.form.value,
        pre_enrollment: this.form.get('preEnrollment')?.value,
        other_treatments: this.otherTreatmentsFormArray.value
      };
      if (this.editingAttention) {
        this.medicalAttentionService.updateMedicalAttention(this.editingAttention.id, data).subscribe({
          next: () => {
            this.loadMedicalAttentions();
            this.resetForm();
          },
          error: (err) => {
            console.error('Error al actualizar atención:', err);
          }
        });
      } else {
        this.medicalAttentionService.createMedicalAttention(data).subscribe({
          next: () => {
            this.loadMedicalAttentions();
            this.resetForm();
          },
          error: (err) => {
            console.error('Error al crear atención:', err);
          }
        });
      }
    }
  }

  editAttention(attention: MedicalAttention) {
  this.editingAttention = { ...attention };

  // Limpiar otros tratamientos antes de agregar
  this.otherTreatmentsFormArray.clear();

  if (attention.otherTreatments && attention.otherTreatments.length > 0) {
    attention.otherTreatments.forEach(ot => {
      this.otherTreatmentsFormArray.push(
        this.fb.group({
          name: [ot.name, Validators.required],
          price: [ot.price, Validators.required]
        })
      );
    });
  }

  this.form.patchValue({
    patient_id: attention.patient_id,
    appointment_id: attention.appointment_id,
    treatment_ids: attention.treatments ? attention.treatments.map(t => t.id) : [],
    diagnosis: attention.diagnosis || '',
    preEnrollment: attention.preEnrollment || '',
  });

  this.onPatientChange();
}


  deleteAttention(id: number) {
    if (confirm('¿Estás seguro de eliminar esta atención médica?')) {
      this.medicalAttentionService.deleteMedicalAttention(id).subscribe({
        next: () => {
          this.loadMedicalAttentions();
        },
        error: (err) => {
          console.error('Error al eliminar atención:', err);
        }
      });
    }
  }

  resetForm() {
    this.form.reset();
    this.editingAttention = null;
    this.appointments = [];
  }

  getAppointmentDate(appointmentId: number): string {
    const attention = this.medicalAttentions.find(a => a.appointment?.id === appointmentId);
    return attention?.appointment?.date ? `${attention.appointment.date} ${attention.appointment.time}` : 'Sin fecha';
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Desconocido';
  }

  //getTreatmentNames(attention: MedicalAttention): string {
  //  return attention.treatments ? attention.treatments.map(t => t.nombre).join(', ') : 'Sin tratamientos';
  //}
  /*
  getTreatmentNames(attention: MedicalAttention): string {
    return attention.treatments && attention.treatments.length > 0
      ? attention.treatments.map(t => `${t.nombre} (${t.precio} USD)`).join(', ')
      : 'Sin tratamientos';
  }
  */
  /*
  getDoctorName(appointmentId: number): string {
    // Buscar primero en appointments (para el selector)
    const appointment = this.appointments.find(a => a.id === appointmentId);
    if (appointment && appointment.doctor_id) {
      const doctor = this.doctors.find(d => d.id === appointment.doctor_id);
      return doctor ? doctor.name : 'Desconocido';
    }
    // Fallback para la tabla (usando medicalAttentions)
    const attention = this.medicalAttentions.find(a => a.appointment?.id === appointmentId);
    const doctorId = attention?.appointment && 'doctor_id' in attention.appointment ? attention.appointment.doctor_id : undefined;
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Desconocido';
  }
  */
 getDoctorName(attention: MedicalAttention): string {
    const doctorId = (attention.appointment && 'doctor_id' in attention.appointment)
      ? (attention.appointment as any).doctor_id
      : undefined;
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Desconocido';
  }

  addOtherTreatment() {
    this.otherTreatmentsFormArray.push(
      this.fb.group({
        name: ['', Validators.required],
        price: [0, Validators.required]
      })
    );
  }

  
  removeOtherTreatment(index: number) {
    this.otherTreatmentsFormArray.removeAt(index);
  }

  getDoctorNameByAppointment(app: Appointment): string {
    const doctor = this.doctors.find(d => d.id === app.doctor_id);
    return doctor ? doctor.name : 'Desconocido';
  }

  openMedicalHistoryModal(patientId: number, appointmentId: number, formData: any): void {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) {
      console.error('No se encontró el paciente con ID:', patientId);
      return;
    }

    console.log('🎯 Abriendo modal para atención médica específica:', formData);
    console.log('🆔 Medical Attention ID:', formData.id);
    console.log('👤 Paciente:', patient.name);

    const modalRef = this.modalService.open(MedicalHistoryModalComponent, { size: 'lg' });

    modalRef.componentInstance.patientId = patientId;
    modalRef.componentInstance.patientData = {
      name: patient.name,
      email: patient.email,
      ci: patient.ci,
    };

    // Si hay un medical_attention_id, buscar la historia médica existente
    if (formData.id) {
      console.log('🔍 Buscando historia médica específica para medical_attention_id:', formData.id);
      this.medicalHistoryService.getMedicalHistoryByMedicalAttentionId(formData.id).subscribe({
        next: (response) => {
          console.log('📋 Respuesta del servicio:', response);
          if (response.data) {
            modalRef.componentInstance.selectedHistory = response.data;
            console.log('✅ Historia médica específica encontrada:', response.data);
            
            // Forzar la carga de datos después de asignar selectedHistory
            setTimeout(() => {
              console.log('⏰ Forzando carga de datos después de encontrar historia existente');
              modalRef.componentInstance.loadSelectedHistory(response.data);
            }, 100);
          } else {
            // Si no existe, crear una nueva con los datos del formulario
            console.log('⚠️ No se encontró historia médica específica, creando nueva');
            this.createNewHistoryFromFormData(modalRef, patientId, formData);
          }
        },
        error: (error) => {
          console.error('❌ Error buscando historia médica específica:', error);
          // Si hay error, crear una nueva con los datos del formulario
          this.createNewHistoryFromFormData(modalRef, patientId, formData);
        }
      });
    } else {
      // Si no hay medical_attention_id, crear una nueva con los datos del formulario
      console.log('📝 Creando nueva historia médica con datos del formulario');
      this.createNewHistoryFromFormData(modalRef, patientId, formData);
    }

    modalRef.result.then(
      (result: any) => {
        if (result === 'update' || result === 'create') {
          this.loadMedicalAttentions();
        }
      },
      () => {}
    );
  }

  private createNewHistoryFromFormData(modalRef: any, patientId: number, formData: any): void {
    // Obtener nombres de tratamientos
    const treatmentNames = formData.treatment_ids ? 
      this.treatments.filter(t => formData.treatment_ids.includes(t.id)).map(t => t.nombre) : [];

    const newHistory = {
      patient_id: patientId,
      consultation_reason: formData.diagnosis || 'Consulta médica',
      diagnosis: formData.diagnosis || '',
      treatments_performed: treatmentNames, // Array de nombres de tratamientos
      other_treatments: Array.isArray(formData.otherTreatments) ? formData.otherTreatments : [],
      pre_enrollment: formData.preEnrollment || '',
      medical_attention_id: formData.id || null,
      allergies: '',
      medical_background: '',
      dental_background: '',
      extraoral_exam: '',
      intraoral_exam: '',
      odontogram: '',
      current_medications: '',
      relevant_oral_habits: '',
      details: ''
    };

    console.log('📝 Creando nueva historia médica con datos:', newHistory);
    console.log('💊 Tratamientos a sincronizar:', treatmentNames);
    console.log('🔧 Asignando selectedHistory al modal...');
    
    // Asignar la historia al modal
    modalRef.componentInstance.selectedHistory = newHistory;
    
    // Forzar la detección de cambios para que el modal cargue los datos
    setTimeout(() => {
      console.log('⏰ Forzando carga de datos después de asignar selectedHistory');
      modalRef.componentInstance.loadSelectedHistory(newHistory);
    }, 100);
  }




}