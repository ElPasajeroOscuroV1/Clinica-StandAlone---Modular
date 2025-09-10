import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalAttentionService } from '../../services/medical-attention.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Patient } from '../../interfaces/patient.interface';
import { Appointment } from '../../interfaces/appointment.interface';
import { Treatment } from '../../interfaces/treatment.interface';
import { MedicalAttention } from '../../interfaces/medical-attention.interface';
import { Doctor } from '../../interfaces/doctor.interface'; // Asegúrate de definir esta interfaz

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
    MatIconModule
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
  displayedColumns: string[] = ['id', 'patient_id', 'appointment_id', 'doctor', 'treatments', 'total_cost', 'actions']; // Agregué 'doctor'

  editingAttention: MedicalAttention | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalAttentionService: MedicalAttentionService
  ) {
    this.form = this.fb.group({
      patient_id: ['', Validators.required],
      appointment_id: ['', Validators.required],
      treatment_ids: [[], Validators.required],
    });
  }

  ngOnInit() {
    this.loadPatients();
    this.loadTreatments();
    this.loadDoctors(); // Cargar doctores
    this.loadMedicalAttentions();
  }

  loadPatients() {
    this.medicalAttentionService.getPatients().subscribe({
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
          appointment: attention.appointment || { id: attention.appointment_id, date: 'Sin fecha', time: '00:00:00' }
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
      this.medicalAttentionService.getAppointmentsByPatient(patientId).subscribe({
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
      const data = this.form.value;
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
    this.form.patchValue({
      patient_id: attention.patient_id,
      appointment_id: attention.appointment_id,
      treatment_ids: attention.treatments ? attention.treatments.map(t => t.id) : []
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

  getTreatmentNames(attention: MedicalAttention): string {
    return attention.treatments ? attention.treatments.map(t => t.nombre).join(', ') : 'Sin tratamientos';
  }

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
}