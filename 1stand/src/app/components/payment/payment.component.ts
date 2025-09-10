import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../interfaces/payment.interface';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../services/appointment.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TreatmentService } from '../../services/treatment.service';
import { Treatment } from '../../services/treatment.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe
  ]
})
export class PaymentComponent implements OnInit {
  payments: Payment[] = [];
  paymentForm: FormGroup;
  patients: any[] = [];
  appointments: any[] = [];
  editingPaymentId: number | null = null;
  treatments: Treatment[] = [];

  constructor(
    private paymentService: PaymentService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private treatmentService: TreatmentService

  ) {
    this.paymentForm = new FormGroup({
      patient_id: new FormControl('', [Validators.required]),
      appointment_id: new FormControl('', [Validators.required]),
      //treatment_id: new FormControl('', [Validators.required]),
      treatment_id: new FormControl(''),
      amount: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      method: new FormControl('Efectivo', [Validators.required]),
      status: new FormControl('Pendiente', [Validators.required]),
    });
  }

  ngOnInit() {
  console.log('PaymentComponent initialized');

  // Cargar todos los datos iniciales de forma paralela
  forkJoin({
    payments: this.paymentService.getPayments(),
    patients: this.patientService.getPatients(),
    appointments: this.appointmentService.getAppointments(),
    treatments: this.treatmentService.getAll()
  }).subscribe({
    next: ({ payments, patients, appointments, treatments }) => {
      //console.log('Datos recibidos:', { payments, patients, appointments, treatments });
      console.log('Datos recibidos:');
      console.log('Pagos:', payments);
      console.log('Pacientes:', patients);
      console.log('Citas:', appointments);
      console.log('Tratamientos:', treatments);

      this.patients = patients;
      this.appointments = appointments;
      this.treatments = treatments;

      // Mapear pagos con tratamientos
      this.payments = payments.map((p: Payment): Payment => {
        const treatment = p.treatmentId ? this.treatments.find(t => t.id === p.treatmentId) : undefined;
        console.log(`Mapeando pago ID ${p.id}: treatmentId=${p.treatmentId}, treatment=`, treatment);
        return {
          ...p,
          treatment: treatment ? { id: treatment.id!, nombre: treatment.nombre } : undefined
        };
      });
    },
    error: (err) => console.error('Error cargando datos iniciales:', err)
  });

  // Suscripción a cambios en patient_id
  this.paymentForm.get('patient_id')?.valueChanges.subscribe(patientId => {
    console.log('Paciente seleccionado:', patientId);
    if (patientId) {
      this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
        next: (data) => {
          console.log(`Citas del paciente ${patientId}:`, data);
          this.appointments = data;
        },
        error: (err) => console.error(`Error cargando citas para paciente ${patientId}:`, err)
      });
    } else {
      console.log('No se seleccionó paciente, limpiando citas');
      this.appointments = [];
      this.paymentForm.patchValue({ appointment_id: '' });
    }
  });
}
  /*
  ngOnInit() {
    console.log('PaymentComponent initialized');

    // Cargar pagos
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        console.log('Pagos recibidos:', data);
        //this.payments = data;
        this.payments = data.map(p => {
          const treatment = this.treatments.find(t => t.id === p.treatmentId);
          if (treatment) {
            // solo asigna treatment si existe y tiene id definido
            return { ...p, treatment: { id: treatment.id, nombre: treatment.nombre } };
          } else {
            return { ...p, treatment: undefined };
          }
        });
      },
      error: (err) => console.error('Error cargando pagos:', err)
    });

    // Cargar pacientes
    this.patientService.getPatients().subscribe({
      next: (data) => {
        console.log('Pacientes recibidos:', data);
        this.patients = data;
      },
      error: (err) => console.error('Error cargando pacientes:', err)
    });

    // Cargar citas
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        console.log('Citas recibidas:', data);
        this.appointments = data;
      },
      error: (err) => console.error('Error cargando citas:', err)
    });

    // Carga tratamientos
    this.treatmentService.getAll().subscribe({
      next: (data) => {
        console.log('Tratamientos recibidos:', data);
        this.treatments = data;
      },
      error: (err) => console.error('Error cargando tratamientos:', err)
    });

    // Cuando cambia el paciente, actualizamos citas
    this.paymentForm.get('patient_id')?.valueChanges.subscribe(patientId => {
      console.log('Paciente seleccionado:', patientId);

      if (patientId) {
        this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
          next: (data) => {
            console.log(`Citas del paciente ${patientId}:`, data);
            this.appointments = data;
          },
          error: (err) => console.error(`Error cargando citas para paciente ${patientId}:`, err)
        });
      } else {
        console.log('No se seleccionó paciente, limpiando citas');
        this.appointments = [];
        this.paymentForm.patchValue({ appointment_id: '' });
      }
    });
  }
*/
  private setFormValues(payment: Payment) {
    this.paymentForm.setValue({
      patient_id: payment.patientId ?? payment.patient?.id ?? '',
      appointment_id: payment.appointmentId ?? payment.appointment?.id ?? '',
      treatment_id: payment.treatmentId ?? '',
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      status: payment.status
    });
  }


  editPayment(payment: Payment) {
    console.log('Editar pago:', payment);
    this.editingPaymentId = payment.id;

    // Cargar citas del paciente
    this.appointmentService.getAppointmentsByPatient(payment.patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments;

        // Asegurarse de que el paciente esté en la lista
        const pacienteExiste = this.patients.some(p => p.id === payment.patientId);
        if (!pacienteExiste && payment.patient) {
          this.patients.push(payment.patient);
        }
        this.setFormValues(payment);
        /*
        // Ahora sí, seteamos el formulario
        this.paymentForm.setValue({
          patient_id: payment.patientId,
          appointment_id: payment.appointmentId,
          treatment_id: payment.treatmentId ?? '',
          amount: payment.amount,
          date: payment.date,
          method: payment.method,
          status: payment.status
        });
        */
      },
      error: (err) => console.error('Error cargando citas del paciente:', err)
    });
  }



  deletePayment(id: number) {
    console.log('Eliminar pago ID:', id);
    this.paymentService.deletePayment(id).subscribe({
      next: () => {
        console.log(`Pago ${id} eliminado`);
        this.payments = this.payments.filter(p => p.id !== id);
      },
      error: (err) => console.error(`Error eliminando pago ${id}:`, err)
    });
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const payload = {
        patient_id: this.paymentForm.value.patient_id,
        appointment_id: this.paymentForm.value.appointment_id,
        treatment_id: this.paymentForm.value.treatment_id|| undefined,
        amount: this.paymentForm.value.amount,
        date: this.paymentForm.value.date,
        method: this.paymentForm.value.method,
        status: this.paymentForm.value.status
      };

      if (this.editingPaymentId) {
        // 🔄 Actualizar pago existente
        this.paymentService.updatePayment(this.editingPaymentId, {
          patientId: payload.patient_id,
          appointmentId: payload.appointment_id,
          treatmentId: payload.treatment_id,
          ...payload,
          id: this.editingPaymentId
          /*
          patientId: payload.patient_id,
          appointmentId: payload.appointment_id,
          treatmentId: payload.treatment_id,
          amount: payload.amount,
          date: payload.date,
          method: payload.method,
          status: payload.status,
          id: this.editingPaymentId
          */
        }).subscribe({
          next: (updated) => {
            console.log('Pago actualizado:', updated);
            console.log('Pago actualizado:', updated);
            console.log('TreatmentId del pago actualizado:', updated.treatmentId);
            console.log('Tratamientos disponibles:', this.treatments);
            const treatment = updated.treatmentId ? this.treatments.find(t => t.id === updated.treatmentId) : undefined;
            console.log('Tratamiento encontrado para updated.treatmentId:', treatment);
            this.payments = this.payments.map(p => p.id === updated.id ? {
              ...updated,
              treatment: updated.treatmentId ? 
                this.treatments.find(t => t.id === updated.treatmentId) ? 
                  { id: this.treatments.find(t => t.id === updated.treatmentId)!.id!, 
                    nombre: this.treatments.find(t => t.id === updated.treatmentId)!.nombre } 
                : undefined 
              : undefined
            } : p);
            this.resetForm();
          },
          error: (err) => console.error('Error actualizando pago:', err)
        });
      } else {
        // 🆕 Crear nuevo pago
        this.paymentService.createPayment(payload).subscribe({
          next: (created) => {
          console.log('Pago creado:', created);
          console.log('TreatmentId del pago creado:', created.treatmentId);
          console.log('Tratamientos disponibles:', this.treatments);            //this.payments.push(created);
          const treatment = created.treatmentId ? this.treatments.find(t => t.id === created.treatmentId) : undefined;
          console.log('Tratamiento encontrado para created.treatmentId:', treatment);
            this.payments.push({
              ...created,
              treatment: created.treatmentId ? 
                (this.treatments.find(t => t.id === created.treatmentId) ? 
                  {
                    id: this.treatments.find(t => t.id === created.treatmentId)!.id!,
                    nombre: this.treatments.find(t => t.id === created.treatmentId)!.nombre
                  } : undefined) 
                : undefined
            });
            this.resetForm();
          },
          error: (err) => console.error('Error creando pago:', err)
        });
      }
    } else {
      console.warn('Formulario inválido:', this.paymentForm.value);
    }
  }

  getPagoClass(payment: Payment): string {
    if (!payment.appointment?.date || !payment.date) return '';

    const fechaCita = new Date(payment.appointment.date);
    const fechaPago = new Date(payment.date);

    return fechaPago > fechaCita ? 'text-danger' : 'text-muted';
  }

  resetForm() {
    this.paymentForm.reset({
      method: 'Efectivo',
      status: 'Pendiente'
    });
    this.editingPaymentId = null;
  }

  exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Lista de Pagos', 14, 20);

    const rows = this.payments.map(p => [
      p.id,
      p.patient?.name || 'Sin paciente',
      p.appointment?.date || 'Sin cita',
      //this.treatments.find(t => t.id === p.treatmentId)?.nombre || '',
      p.treatment?.nombre || 'Sin tratamiento',
      p.date,
      p.amount,
      p.method,
      p.status
    ]);

    autoTable(doc, {
      head: [['ID', 'Paciente', 'Fecha Cita', 'Tratamiento', 'Fecha Pago', 'Monto', 'Método', 'Estado']],
      body: rows,
      startY: 30
    });

    doc.save('pagos.pdf');
  }

}
